# Strake Jesuit Tutors

**Peer tutoring that fits a block schedule.** Students find a classmate who has
already aced the class, book one of the blocks they're both free, and tutors
earn verifiable service hours for every session they finish.

Built with React Native (Expo), so one codebase runs as an **iPhone / Android
app** and as a **website**.

| Home | Find a tutor | Tutor profile | Sessions | Profile & hours |
|---|---|---|---|---|
| ![Home](docs/screenshots/mobile-home.png) | ![Search](docs/screenshots/mobile-search.png) | ![Tutor profile](docs/screenshots/mobile-tutorprofile.png) | ![Sessions](docs/screenshots/mobile-sessions.png) | ![Profile](docs/screenshots/mobile-profile.png) |

## The problem

Students who need help usually ask a friend, wait for office hours, or pay for
outside tutoring. Strong students who want to help (and who often need
volunteer or NHS hours) have no easy way to be found. And on a rotating block
schedule, "when are we both free?" takes a dozen texts.

## What it does

- **Find a tutor** by name, subject (core classes, SAT and AP) or block, or tap
  **Match my schedule** to rank tutors who are free when you are.
- **Book a free block** and add a note. The tutor confirms or declines.
- **Reminders** 10 minutes before a confirmed block, plus *Add to calendar*.
- **Service-hours log**: every session a tutor marks as done counts as one
  50-minute block; tutors download a CSV a moderator can check and sign.
- **Reviews** after a session, so the best tutors rise to the top.
- **Safety and privacy for minors**: school-email sign-up only, report and
  block on every profile, email addresses never shown (students tap
  *Message*), and phone numbers private unless the owner opts in.
- **Guided start**: a three-step setup with Ollie, then a *Get started*
  checklist (add your classes or free blocks, invite a friend, host or book
  your first session).
- **Ollie the owl** guides new users through a three-step welcome tour.
- **Feels like a real app**: confetti when a session is confirmed or done,
  tutor badges (Top tutor, 10+ hours), pull to refresh, loading placeholders,
  haptic feedback, and a full **dark mode** that follows your phone.

## How it works

```
 iPhone / Android / Web  (Expo · React Native · React Navigation · Zustand)
            │
            ▼
 Supabase ─ Auth (school-email only)
          ├ Postgres + Row-Level Security on every table
          ├ search_tutors(): fuzzy name search + subject/block filters,
          │                     ranked by rating and shared free blocks
          ├ community_stats(): school-wide totals only (no personal rows)
          └ Storage: profile photos
```

- **Matching on a block schedule.** Tutors and students each mark the blocks
  (B1–B8) they're free. `search_tutors` gives every tutor one score: how well
  the name matches, plus their rating and experience, plus a boost for every
  free block they share with the student. Blocked users are left out both
  ways. The top result is a good tutor you can actually meet.
- **Privacy by default.** Row-level security means a student can only read and
  change their own sessions. The Home impact numbers come from a
  `security definer` function that returns aggregate counts only.
- **One design system.** Colours, type scale, spacing and the raised 3D
  buttons live in `src/theme/`; every screen is built from the shared
  components in `src/components/ui/`. Re-skinning for another school means
  editing `src/theme/school.js` and `src/theme/colors.js`.

More detail: [ARCHITECTURE.md](ARCHITECTURE.md) · database:
[supabase_schema.sql](supabase_schema.sql).

## Quality

- **Unit tests** (Jest + Testing Library): service hours, schedule maths,
  reminders and core components: `npm test`.
- **CI** on every push: tests plus web and iOS bundles
  ([.github/workflows/ci.yml](.github/workflows/ci.yml)).
- **End-to-end checks** with Playwright against the web build: 90 checks
  covering every screen and button.
- **Accessibility**: screen-reader labels and roles on every control, Reduce
  Motion respected, and an axe-core (WCAG 2 AA) scan with no violations in
  both light and dark mode.

## Run it

```bash
npm install
npm test               # unit tests
npx expo start         # scan the QR code with Expo Go on your phone
npx expo start --web   # or open it in the browser
```

To use your own backend, create a Supabase project, run
`supabase_schema.sql` in its SQL editor, and put the project URL and anon key
in `src/lib/supabase.js`.

## Built with

React Native · Expo SDK 51 · JavaScript · Supabase (Postgres, Auth, Storage) ·
React Navigation · Zustand · React Hook Form + Zod · react-native-svg ·
expo-notifications · Jest · Playwright · Vercel
