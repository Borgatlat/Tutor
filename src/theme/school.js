// ─── School identity ──────────────────────────────────────────────────────────
// Everything that names the school lives here, so the app can be re-skinned for
// another school by editing this file and the palette in colors.js. The owl
// mascot (components/ui/Mascot.js) draws itself from colors.js automatically.
// ─────────────────────────────────────────────────────────────────────────────

export const school = {
  appName:     'Tutors for Others', // the app's name (after the Jesuit motto "men and women for others")
  name:        'Strake Jesuit',   // the school's name, shown under the app name
  memberName:  'Crusader',        // what a student is called ("Welcome back, Crusader")
  memberPlural:'Crusaders',
  // Link people are sent when someone taps "Invite a friend": the production
  // website. On the website the app uses its own address instead.
  appUrl: 'https://tutor-delta-one.vercel.app',
  mascotName:  'Ollie',           // the owl
  // Where "Send feedback" on the Profile screen goes (a Google Form works
  // well). Leave it empty to hide the button.
  feedbackUrl: '',
};
