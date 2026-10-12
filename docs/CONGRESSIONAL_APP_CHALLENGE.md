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
> already mastered the class. Students search by subject (core classes, SAT and
> AP) or tap "Match my schedule" to find tutors who share a free block. They
> book in one tap, get a reminder before the session, and leave a review
> afterwards. Tutors confirm requests, mark sessions done, and download a
> service-hours log their moderator can sign. Sign-up is limited to school
> email addresses, and every profile can be reported or blocked. One React
> Native codebase runs on iPhone, Android and the web.

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
| 0:50–1:20 | Search: type a subject, tap **Match my schedule**, open a tutor | "Search by class, from Algebra to AP Calc, or tap *Match my schedule*. Our search function ranks tutors by name match, rating and experience, and boosts anyone who shares your free blocks." |
| 1:20–1:40 | Tutor profile: pick a free block, then **Book session** and a day | "Their profile shows ratings, subjects and only the blocks they're free. Pick a block and a day, and send the request. Nobody can be double-booked." |
| 1:40–2:00 | Switch to the tutor account: the push notification, **Confirm**, then **Message** | "The tutor gets a notification, confirms, and they plan the session in the built-in chat, so no one shares a phone number." |
| 2:00–2:15 | **Mark as done**, Profile **Service hours**, then the moderator account verifying | "Every session counts toward service hours. A teacher moderator verifies them in the app, and tutors download an official log." |
| 2:15–2:35 | Quick shots: the code, the tests passing, the accessibility scan | "We built it in React Native with Expo, so it runs on iPhone, Android and the web, with a Supabase backend. Security rules keep each student's sessions private. It has 30 unit tests, 111 automated screen checks, 47 database security tests, dark mode, and an accessibility scan with zero issues." |
| 2:35–2:45 | Home screen | "Strake Jesuit Tutors: Crusaders helping Crusaders. Thanks for watching!" |

Check before you upload:
- [ ] Under 3 minutes.
- [ ] Every team member's name is said or shown.
- [ ] The app's purpose, audience and tools are all mentioned.
- [ ] Uploaded to YouTube or Vimeo as **Unlisted** (not private) so judges can open the link.

## 6. Links to include

- **Live app (web):** https://tutor-git-claude-cool-rubin-dcjy6e-borgatlats-projects.vercel.app.
  After merging, use the production Vercel URL instead.
- **Code:** the GitHub repository. Make sure judges can open it: either make it public, or follow your district's instructions for sharing code.
- **iPhone (optional):** an Expo Go link (`npx expo start --tunnel`) or a TestFlight invite. TestFlight needs an Apple Developer account.

## 7. Before you submit

- [ ] In the Supabase SQL Editor, run the files in `supabase/migrations/` in order (001, 002, 003). Booking, free blocks, chat and phone privacy need them. On a project that already has the base schema, 001 is safe to run again.
- [ ] Run `supabase/seed_demo.sql` so the app isn't empty, and record the video signed in as `james.smith.demo@mail.strakejesuit.org` (password `DemoTutor2026!`).
- [ ] Run `npx eas init` so phones can register for push notifications, then test on a real iPhone: booking, chat, notifications, photo picker, calendar and reminders.
- [ ] Confirm that every team member is registered for your district on the Congressional App Challenge site.
