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
| 1:20–1:40 | Tutor profile: pick a free block, then **Book session** | "Their profile shows ratings, subjects and only the blocks they're free. Pick one and send the request." |
| 1:40–2:00 | Switch to the tutor account: **Confirm**, **Add to calendar**, then **Mark as done** | "The tutor confirms, and both people get a reminder ten minutes before. Afterwards the tutor marks it done." |
| 2:00–2:15 | Profile: **Service hours**, then **Download hours log** | "Every session counts toward service hours, and tutors can download a log their moderator signs." |
| 2:15–2:35 | Quick shots: the code, the tests passing, the accessibility scan | "We built it in React Native with Expo, so it runs on iPhone, Android and the web, with a Supabase backend. Security rules keep each student's sessions private. It has 24 unit tests, 90 automated end-to-end checks, dark mode, and an accessibility scan with zero issues." |
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

- [ ] Run `community_stats()` and the latest `supabase_schema.sql` changes on the real Supabase project, so the Home impact numbers appear.
- [ ] Seed a few demo accounts and sessions so the app doesn't look empty to judges.
- [ ] Test on a real iPhone: photo picker, calendar and reminders.
- [ ] Confirm that every team member is registered for your district on the Congressional App Challenge site.
