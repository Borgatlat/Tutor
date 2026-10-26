# Testing with real students

A one-week test with 15 to 30 Strake students. It shows what to fix, and the
numbers it produces ("25 students signed up and booked 12 sessions in the
first week") are the strongest line in the Congressional App Challenge video.

Live app: **https://tutor-delta-one.vercel.app**

## Before you send it
- [ ] The latest migrations are run in Supabase (through `011_app_name.sql`).
- [ ] Optional: email updates switched on (Resend key and sender in the Vault,
      see *Email notifications* in the README). Send yourself a test booking
      with email updates ticked to check it arrives (and isn't in spam).
- [ ] Optional: Ask Ollie's AI switched on (OpenAI key in the Vault, see
      *Ask Ollie* in the README). Without it Ollie still matches keywords.
- [ ] Your privacy policy (betterullc.com/privacy) names OpenAI (Ask Ollie)
      and Resend (emails) as services that process data for the app.
- [ ] The site opens in a private browser window without a Vercel login screen.
- [ ] Sign up yourself with your school email and book a test session with a friend.
- [ ] You are a moderator (`update public.profiles set is_moderator = true where email = 'you@mail.strakejesuit.org';`).
- [ ] The demo accounts are deleted (their password is public in the README):
      `delete from auth.users where email like '%.demo@mail.strakejesuit.org';`
- [ ] Optional: make a Google Form with the questions below, and put its link
      in `feedbackUrl` in `src/theme/school.js` so a **Send feedback** button
      shows on the Profile screen.

Start with a mix: about a third of testers who can tutor something, the rest
who need help. Without tutors, students find nobody when they search.

## Message to send

> Hey! I built a peer tutoring app for Strake for the Congressional App
> Challenge and I need testers this week. You can find a tutor for any class
> during your free blocks, or tutor others and earn service hours (they get
> logged for you automatically).
>
> Sign up with your school email: https://tutor-delta-one.vercel.app
>
> It takes about 5 minutes. Then tell me what was confusing. Thanks!

For tutors, add one line: *"If you're good at a class, pick Tutor or Both
when you sign up so people can book you."*

## 5-minute test (what to ask testers to do)
1. **Sign up** with your @mail.strakejesuit.org email (or Continue with Google)
   and pick Student, Tutor or Both.
2. **Set your free blocks** (B1 to B8, CT, A or B Lunch) and, if you tutor,
   your subjects.
3. **Find a tutor**: search a class or filter by a block you're free.
4. **Book a session** on a real day and add a note about what you need.
5. **Tutors: confirm** the request, then message the student in the chat.
6. **At the session**: the tutor taps **Check-in code**, the student taps
   **Check in** and types it. This logs the hours, confirmed by both.
7. **Students: leave a review** afterwards.
8. **Try Ask Ollie**: tap the owl in the corner and type what you need, like
   "I need help with chem during B3".

On a phone, use the browser's **Add to Home Screen** so it opens like an app.

## Feedback questions (Google Form)
1. Were you a student, a tutor, or both?
2. What was the most confusing part? (open answer)
3. Did you find a tutor (or get booked) for what you needed? Yes / No / Didn't try
4. How likely are you to use it this semester? 1 to 5
5. Which classes would you want tutoring in, or could you tutor? (open answer)
6. What one thing would you add or change? (open answer)

## Numbers to collect for the submission
Open **Profile → Moderator tools → Insights** at the end of the week:
- students who signed up, and how many are tutors (Supabase → Authentication → Users)
- sessions completed and hours tutored (last 30 days)
- the share **confirmed by both** tutor and student
- the busiest blocks
- the subjects students searched for and **found no tutor**, which shows a real
  need at Strake

Write down two or three quotes from the feedback form for the video and the
written answers ("what did you learn", "what would version 2.0 add").

## Judge access
Judges may ask to try the app, but sign-up only accepts school emails. Create
one judge account and give its password only in the submission form:
1. Supabase → Authentication → Users → **Add user** →
   `cac.judge@mail.strakejesuit.org`, a strong password, **Auto Confirm** on.
2. SQL Editor → run [`supabase/judge_account.sql`](../supabase/judge_account.sql).

The judge is a tutor, a student and a moderator, so every screen (including
Insights) has something to show. If the demo data is loaded, they also get a
session ready for check-in today. If you deleted the demo accounts, the judge
account still works; it just starts with no sessions.
