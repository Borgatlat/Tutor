# Strake Jesuit Tutor Platform — Technical Architecture
**Role:** Technical Co-Founder  
**Stack decision:** React Native (Expo) · Supabase · Custom Search  
**MVP scope:** SAT tutoring (Math + English) at Strake Jesuit  

---

## 1. Tech Stack

| Layer | Choice | Reason |
|---|---|---|
| Mobile | React Native + Expo SDK 51 | Cross-platform iOS-first, fast iteration |
| Navigation | React Navigation v6 (Stack + Bottom Tabs) | Industry standard, smooth native feel |
| Backend / Auth | Supabase | Postgres DB + Row-Level Security + Auth + Storage, one service |
| File Storage | Supabase Storage | Profile pictures, cheap, co-located with DB |
| Search | Custom algorithm (Supabase RPC + `pg_trgm`) | Fuzzy name matching, subject + period filters, scored ranking — no third-party needed |
| State | Zustand | Lightweight global store (auth session, user profile) |
| Forms | React Hook Form + Zod | Validation with schema, great DX |
| Icons | @expo/vector-icons (Ionicons) | Already in project |
| Image Picker | expo-image-picker | Profile photo selection |
| Calendar/Schedule | Custom grid component | Period 1–8 × Day grid |
| Notifications | Expo Notifications | Session reminders (Phase 2) |

---

## 2. Supabase Database Schema

### `profiles` table
```sql
create table profiles (
  id            uuid primary key references auth.users(id) on delete cascade,
  email         text unique not null,           -- @mail.strakejesuit.org enforced
  full_name     text not null,
  phone         text,                           -- optional
  avatar_url    text,                           -- Supabase Storage path, optional
  role          text check (role in ('student','tutor','both')) not null,
  bio           text,                           -- optional, tutor bio
  is_tutor      boolean generated always as (role in ('tutor','both')) stored,
  is_student    boolean generated always as (role in ('student','both')) stored,
  created_at    timestamptz default now()
);
```

### `tutor_subjects` table
```sql
create table tutor_subjects (
  id         uuid primary key default gen_random_uuid(),
  tutor_id   uuid references profiles(id) on delete cascade,
  subject    text check (subject in ('SAT Math','SAT English')),
  unique(tutor_id, subject)
);
```

### `tutor_availability` table
```sql
-- One row per (tutor × day × period) slot they are FREE
create table tutor_availability (
  id         uuid primary key default gen_random_uuid(),
  tutor_id   uuid references profiles(id) on delete cascade,
  day        text check (day in ('Mon','Tue','Wed','Thu','Fri')),
  period     int  check (period between 1 and 8),
  unique(tutor_id, day, period)
);
```

### `sessions` table
```sql
create table sessions (
  id           uuid primary key default gen_random_uuid(),
  tutor_id     uuid references profiles(id),
  student_id   uuid references profiles(id),
  subject      text,
  day          text,
  period       int,
  status       text check (status in ('pending','confirmed','cancelled','completed')) default 'pending',
  notes        text,
  created_at   timestamptz default now()
);
```

### `reviews` table
```sql
create table reviews (
  id           uuid primary key default gen_random_uuid(),
  session_id   uuid references sessions(id) on delete cascade,
  reviewer_id  uuid references profiles(id),
  tutor_id     uuid references profiles(id),
  rating       int check (rating between 1 and 5),
  comment      text,
  created_at   timestamptz default now()
);
```

### `pg_trgm` extension + search function
```sql
-- Enable fuzzy text matching
create extension if not exists pg_trgm;

-- Supabase RPC used by the custom search algorithm
create or replace function search_tutors(
  query_name    text    default '',
  filter_subject text   default null,   -- 'SAT Math' | 'SAT English' | null
  filter_day    text    default null,   -- 'Mon'..'Fri' | null
  filter_period int     default null    -- 1..8 | null
)
returns table (
  id          uuid,
  full_name   text,
  avatar_url  text,
  bio         text,
  email       text,
  phone       text,
  subjects    text[],
  avg_rating  numeric,
  session_count bigint,
  score       float
)
language sql stable as $$
  select
    p.id,
    p.full_name,
    p.avatar_url,
    p.bio,
    p.email,
    p.phone,
    array_agg(distinct ts.subject)                        as subjects,
    round(avg(r.rating)::numeric, 1)                      as avg_rating,
    count(distinct s.id)                                  as session_count,
    -- SCORING FORMULA (higher = better match)
    (
      case when query_name = '' then 0.5
           else similarity(p.full_name, query_name) end   -- fuzzy name match [0,1]
      + coalesce(round(avg(r.rating)::numeric,1),3) * 0.1 -- rating bonus (max 0.5)
      + least(count(distinct s.id) * 0.01, 0.2)           -- experience bonus (max 0.2)
    )                                                      as score
  from profiles p
  join tutor_subjects ts on ts.tutor_id = p.id
  left join sessions s   on s.tutor_id = p.id and s.status = 'completed'
  left join reviews r    on r.tutor_id = p.id
  where p.is_tutor = true
    and (filter_subject is null or ts.subject = filter_subject)
    and (
      filter_day is null or filter_period is null or exists (
        select 1 from tutor_availability a
        where a.tutor_id = p.id
          and a.day = filter_day
          and a.period = filter_period
      )
    )
    and (
      query_name = '' or similarity(p.full_name, query_name) > 0.15
    )
  group by p.id
  order by score desc
  limit 50;
$$;
```

---

## 3. Custom Search Algorithm

The search runs entirely in Postgres via the `search_tutors` RPC above. Here's how the scoring works:

```
SCORE = name_similarity + rating_bonus + experience_bonus

name_similarity  = pg_trgm similarity(full_name, query)   → [0.0 – 1.0]
                   (trigram fuzzy match, typo-tolerant)
rating_bonus     = avg_rating × 0.10                      → [0.0 – 0.5]
experience_bonus = min(completed_sessions × 0.01, 0.20)   → [0.0 – 0.2]

MAX possible score ≈ 1.70
```

**Filter pipeline (applied before scoring, in SQL WHERE):**
1. `is_tutor = true`
2. Subject filter — exact match on `tutor_subjects.subject`
3. Period filter — existence check in `tutor_availability` for (day, period)
4. Name filter — `similarity > 0.15` threshold (removes total mismatches)

**Client-side (React Native):**
```js
// src/lib/searchTutors.js
export async function searchTutors({ query, subject, day, period }) {
  const { data, error } = await supabase.rpc('search_tutors', {
    query_name:     query   ?? '',
    filter_subject: subject ?? null,
    filter_day:     day     ?? null,
    filter_period:  period  ?? null,
  });
  if (error) throw error;
  return data;   // already ranked by score desc
}
```

---

## 4. App Screen Architecture

```
App
├── AuthStack (unauthenticated)
│   ├── SplashScreen
│   ├── LoginScreen          ← @mail.strakejesuit.org validation
│   ├── SignUpScreen         ← name, email, password, role picker
│   └── ProfileSetupScreen  ← avatar, bio, phone (all optional)
│
└── AppTabs (authenticated)
    ├── HomeScreen           ← dashboard: upcoming sessions, quick stats
    ├── SearchScreen         ← find tutors (search bar + filters)
    │   └── TutorProfileScreen (Stack push)
    │       └── BookSessionScreen (Stack push)
    ├── SessionsScreen       ← my scheduled / past sessions
    └── ProfileScreen        ← edit profile, availability grid, subjects
        └── EditAvailabilityScreen
```

---

## 5. Screen-by-Screen Spec

### AuthStack

#### `LoginScreen`
- Strake Jesuit branded header (red hero, green cross badge)
- Email input — validated to end with `@mail.strakejesuit.org` on submit
- Password input
- "Sign Up" link → SignUpScreen
- Supabase `signInWithPassword` on submit

#### `SignUpScreen`
- Full name, email, password
- **Role picker** — three tappable cards:
  - 🎓 Student — "I want to find a tutor"
  - 📚 Tutor — "I want to help others"
  - ⚡ Both — "I do both"
- Email domain enforced: reject anything not `@mail.strakejesuit.org`
- On submit → Supabase `signUp` → insert into `profiles`

#### `ProfileSetupScreen`
- Avatar picker (expo-image-picker → upload to Supabase Storage)
- Bio (multiline, optional)
- Phone number (optional)
- If role is Tutor/Both → subject selector (SAT Math, SAT English, or both)
- Skip button — all fields optional

---

### AppTabs

#### `HomeScreen`
- Greeting card with name + Strake Jesuit branding
- "Upcoming Sessions" horizontal scroll (next 3 booked slots)
- "Top Tutors This Week" horizontal scroll (highest scored from search_tutors with no filters)
- Quick CTA: "Find a Tutor" button → navigates to SearchScreen

#### `SearchScreen` (tab icon: `search` Ionicon)
- **Search bar** — debounced 300ms, calls `searchTutors` on change
- **Subject filter chips** — `All` · `SAT Math` · `SAT English`
- **Period filter** — two dropdowns: Day (Mon–Fri) + Period (1–8)
  - When both selected, only tutors free that slot appear
- **Results list** — `TutorCard` components ranked by score
  - Shows: avatar, name, subjects, avg rating, free periods badge
- Empty state with illustration
- Loading skeleton cards while fetching

#### `TutorProfileScreen`
- Full profile: avatar, name, bio, email, phone (if provided)
- Subject badges
- **Availability grid** — 5 columns (Mon–Fri) × 8 rows (P1–P8)
  - Green cell = tutor is free · Gray = unavailable
- Star rating + review count
- Completed sessions count
- **"Book a Session" CTA** → BookSessionScreen

#### `BookSessionScreen`
- Tap a free slot from the tutor's availability grid
- Subject selector (whichever the tutor teaches)
- Optional notes field
- Confirm button → insert into `sessions` with status `pending`
- Confirmation animation

#### `SessionsScreen`
- Tab-switched: Upcoming / Past
- Session cards: tutor/student avatar, subject, day+period, status chip
- Pending sessions show "Confirm" / "Cancel" for tutors
- Past sessions show "Leave a Review" button → review modal

#### `ProfileScreen`
- View/edit: avatar, name, bio, phone
- Role badge
- If Tutor/Both: "Edit Subjects" + "Edit Availability" 
- `EditAvailabilityScreen` → tap to toggle each (Day × Period) cell green/gray
- "Sign Out" button

---

## 6. Supabase Auth — Email Domain Enforcement

**Layer 1 — Client validation (React Hook Form + Zod):**
```js
const schema = z.object({
  email: z.string().endsWith('@mail.strakejesuit.org', {
    message: 'Must use your Strake Jesuit email',
  }),
  password: z.string().min(8),
});
```

**Layer 2 — Supabase Edge Function (server-side, can't be bypassed):**
```js
// supabase/functions/validate-signup/index.ts
Deno.serve(async (req) => {
  const { email } = await req.json();
  if (!email.endsWith('@mail.strakejesuit.org')) {
    return new Response(JSON.stringify({ error: 'Invalid school email' }), { status: 403 });
  }
  return new Response(JSON.stringify({ ok: true }));
});
```

**Layer 3 — Row Level Security:**
```sql
alter table profiles enable row level security;
create policy "Users can only see their own profile for editing"
  on profiles for all using (auth.uid() = id);
create policy "Anyone authenticated can read tutor profiles"
  on profiles for select using (auth.role() = 'authenticated');
```

---

## 7. Availability Grid Component Spec

```
         Mon   Tue   Wed   Thu   Fri
Period 1  [ ]   [✓]   [ ]   [✓]   [ ]
Period 2  [✓]   [ ]   [✓]   [ ]   [✓]
Period 3  [ ]   [✓]   [ ]   [ ]   [ ]
Period 4  [✓]   [✓]   [ ]   [✓]   [ ]
Period 5  [ ]   [ ]   [✓]   [ ]   [✓]
Period 6  [✓]   [ ]   [ ]   [✓]   [ ]
Period 7  [ ]   [✓]   [✓]   [ ]   [✓]
Period 8  [✓]   [ ]   [ ]   [✓]   [ ]

[✓] = green cell (tutor free)
[ ] = gray cell  (unavailable)
```

- On `ProfileScreen`: cells are tappable → toggle availability in `tutor_availability`
- On `TutorProfileScreen`: cells are read-only, tapping a green one opens BookSessionScreen pre-filled

---

## 8. Project File Structure

```
src/
├── app/
│   └── App.js                  ← root, wraps NavigationContainer + AuthProvider
├── navigation/
│   ├── AppNavigator.js         ← tab navigator (authenticated)
│   └── AuthNavigator.js        ← stack navigator (login/signup)
├── screens/
│   ├── auth/
│   │   ├── SplashScreen.js
│   │   ├── LoginScreen.js
│   │   ├── SignUpScreen.js
│   │   └── ProfileSetupScreen.js
│   └── app/
│       ├── HomeScreen.js
│       ├── SearchScreen.js
│       ├── TutorProfileScreen.js
│       ├── BookSessionScreen.js
│       ├── SessionsScreen.js
│       └── ProfileScreen.js
├── components/
│   ├── TutorCard.js            ← reusable card for search results + home
│   ├── AvailabilityGrid.js     ← 5×8 tappable/readonly grid
│   ├── SubjectBadge.js         ← colored chip (SAT Math / SAT English)
│   ├── RatingStars.js
│   ├── SessionCard.js
│   └── SkeletonCard.js         ← loading placeholder
├── lib/
│   ├── supabase.js             ← createClient + typed helpers
│   ├── searchTutors.js         ← wraps supabase.rpc('search_tutors')
│   └── uploadAvatar.js         ← Supabase Storage helper
├── store/
│   └── useAuthStore.js         ← Zustand: session, profile, role
├── hooks/
│   ├── useProfile.js
│   ├── useTutorAvailability.js
│   └── useSearch.js            ← debounced search + filter state
├── theme/
│   └── colors.js               ← red #B22222 · green #1A6B3C · white #FFFFFF
└── constants/
    └── index.js                ← DAYS, PERIODS, SUBJECTS arrays
```

---

## 9. Phase Roadmap

### Phase 1 — MVP (build now)
- [ ] Supabase project setup (tables, RLS, search RPC)
- [ ] Auth flow (login, sign up, domain validation)
- [ ] Profile creation + avatar upload
- [ ] Tutor availability grid
- [ ] Search screen with custom algorithm
- [ ] Tutor profile view
- [ ] Session booking

### Phase 2 — Polish
- [ ] Push notifications for session confirmation/reminder
- [ ] In-app messaging between tutor + student
- [ ] Review + rating system
- [ ] Home screen dashboard with real data

### Phase 3 — Growth
- [ ] Admin dashboard (web) for faculty oversight
- [ ] Expand subjects beyond SAT (AP classes, etc.)
- [ ] Session history + tutor earnings tracking
- [ ] School-wide leaderboard / tutor badges

---

## 10. Key Technical Decisions & Rationale

| Decision | Choice | Why |
|---|---|---|
| Email restriction | Zod client + Edge Function server-side | Two layers = can't be bypassed |
| Search | `pg_trgm` + custom SQL RPC | No extra service, typo-tolerant, fully customizable scoring |
| Availability | Sparse rows (one per free slot) | Easy to query for period filters, simple to update |
| Auth state | Zustand + Supabase `onAuthStateChange` | Reactive, persists across app restarts |
| Profile pictures | Supabase Storage (public bucket) | Co-located with DB, free tier sufficient |
| Role system | Single `role` enum + computed booleans | Clean, easy to extend |
