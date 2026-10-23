# Congressional App Challenge: submission kit

**Deadline:** October 26, 2026 (some districts list October 30, so check your
representative's page). Submissions can't be changed after the deadline.

**Judges score:**
1. **Quality of the idea**: creativity and originality.
2. **Implementation**: user experience and design.
3. **Coding**: demonstrated excellence of coding and programming skills.

Each part of the kit below is aimed at one of these three.

---

## 1. App title

**Strake Jesuit Tutors**: peer tutoring built around the block schedule.

## 2. Short description (for the form)

> Strake Jesuit Tutors connects students who need help with classmates who have
> already mastered the class, during the free blocks they share. Students
> search by class or tap "Match my schedule", or just tell Ollie, our AI owl,
> what they need ("chem during B3"). They book a real school day on Strake's
> 8-day rotation, plan in a built-in chat, and check in with a code from the
> tutor, so service hours are confirmed by both students before a teacher
> verifies them. Moderators see which classes students search for but can't
> find a tutor in. Built for minors: school-email sign-up only, private phone
> numbers, opt-in emails and AI, and security rules enforced in the database.
> One React Native codebase runs on iPhone, Android and the web.

## 3. Target audience

High-school students: those who want help in a class, and strong students who
want to tutor and need volunteer or NHS service hours. Teachers and moderators
use the hours log. The school name, colours and mascot are kept in two files,
so another school could run its own version.

## 4. Tools and languages

JavaScript · React Native · Expo SDK 51 · Supabase (PostgreSQL, Auth, Storage,
SQL functions, row-level security) · React Navigation · Zustand · React Hook
Form + Zod · react-native-svg · expo-notifications · Jest + Testing Library ·
Playwright · axe-core · GitHub Actions · Vercel

## 5. Demo video script (target 2:30, hard limit 3:00)

Record the phone screen with an iPhone in Expo Go, or use the website in a
phone-sized browser window. Speak over it. Use **clear placeholder names**
("Alex Kim", "James Smith") rather than real classmates.

| Time | On screen | Say |
|---|---|---|
| 0:00–0:15 | Each team member on camera, or a title card | "Hi, we're **[names]** from **[school]**, and this is Strake Jesuit Tutors." |
| 0:15–0:35 | Login screen with Ollie the owl | "At our school, getting help means texting around to find someone who's free during your block. Students who want to tutor also need service hours but have no way to be found. We built one app for both." |
| 0:35–0:50 | Sign up with a school email, then the welcome tour | "You can only sign up with a school email, and Ollie gives a quick three-step tour." |
| 0:50–1:20 | Search: type a subject, tap **Match my schedule**; then tap the owl, type "chem during B3", open a tutor | "Search by class, from Algebra to AP Calc, or tap *Match my schedule*. Our search ranks tutors by rating and experience, and boosts anyone who shares your free blocks. Or just ask Ollie: AI turns your words into a search, but the matching happens in our own database, so no student's data goes to the AI." |
| 1:20–1:40 | Tutor profile: pick a free block, then **Book session** and a day | "Their profile shows ratings, subjects and only the blocks they're free. Pick a block and a day, and send the request. Nobody can be double-booked." |
| 1:40–2:00 | Switch to the tutor account: the push notification, **Confirm**, then **Message** | "The tutor gets a notification, confirms, and they plan the session in the built-in chat, so no one shares a phone number." |
| 2:00–2:15 | Tutor taps **Check-in code**, student types it, then Profile **Service hours** and the moderator's **Insights** tab | "At the session, the student types the tutor's code, so the hours are confirmed by both. A teacher verifies them, and Insights shows which classes students need help in but can't find a tutor for." |
| 2:15–2:35 | Quick shots: the code, the tests passing, the accessibility scan | "We built it in React Native with Expo, so it runs on iPhone, Android and the web, with a Supabase backend. Security rules keep each student's sessions private. It has 44 unit tests, 149 automated screen checks, 112 database security tests, dark mode, and an accessibility scan with zero issues." |
| 2:35–2:45 | Home screen | "In our first week of testing, **[N] students** signed up and booked **[N] sessions**. Strake Jesuit Tutors: Crusaders helping Crusaders. Thanks for watching!" |

Check before you upload:
- [ ] Under 3 minutes.
- [ ] Every team member's name is said or shown.
- [ ] The app's purpose, audience and tools are all mentioned.
- [ ] Uploaded to YouTube or Vimeo as **Unlisted** (not private) so judges can open the link.

## 6. Links to include

- **Live app (web):** https://tutor-delta-one.vercel.app. Open it in a private
  window first to make sure it loads without a Vercel login (judges won't have one).
- **Code:** the GitHub repository. Make sure judges can open it: either make it public, or follow your district's instructions for sharing code.
- **iPhone (optional):** an Expo Go link (`npx expo start --tunnel`) or a TestFlight invite. TestFlight needs an Apple Developer account.

## 7. Before you submit

**Database and accounts**
- [ ] All migrations are run: paste `supabase/all_migrations.sql` (001–010) into the Supabase SQL Editor and run it. Safe to run again.
- [ ] The OpenAI key is in the Vault (README → *Ask Ollie*). Test by tapping the owl and asking "chem during B3".
- [ ] The judge account is set up (`docs/TESTING.md` → *Judge access*), and its password is written **only** in the submission form.
- [ ] Record the video with the demo data (`supabase/seed_demo.sql`, password in the README). **Then delete the demo accounts before submitting**, because their password is public:
      `delete from auth.users where email like '%.demo@mail.strakejesuit.org';`
      The judge account keeps working without them.

**Results from real students (the strongest part of the submission)**
- [ ] Run the one-week test in `docs/TESTING.md`.
- [ ] From Profile → Moderator tools → Insights, write down: sign-ups, sessions, hours, the share confirmed by both, and the top classes with no tutor.
- [ ] Put the numbers in the last line of the video and in the written answers, with one or two quotes from testers.

**Links and accounts**
- [ ] The live site opens in a private window with no Vercel login.
- [ ] The GitHub repo is public, with a one-line description and the live link at the top of its page.
- [ ] Two-factor sign-in is on for GitHub, Supabase, Vercel and OpenAI, and OpenAI has a monthly spending limit.
- [ ] The privacy policy (betterullc.com/privacy) names OpenAI and Resend.

**Video and form**
- [ ] The video is under 3 minutes, every team member is named, and it's uploaded to YouTube or Vimeo as **Unlisted**.
- [ ] Every team member is registered for your district on the Congressional App Challenge site, before the deadline.
