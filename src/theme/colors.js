// ─── Strake Jesuit Palette ────────────────────────────────────────────────────
// Matched to the school website: deep Strake green, warm stone, maroon tags,
// and a short gold rule above section titles.
//
// brand*  → Strake green   (heroes, nav, headers, primary buttons)
// accent* → same green family, used for interactive/selected states
// maroon  → date / status tags (like the site's news date labels)
// gold    → the short accent rule above titles, active-tab marker, stars
//
// Every color in the app comes from this file. If you need a shade that isn't
// here, add it here rather than inlining a hex somewhere else.
// ─────────────────────────────────────────────────────────────────────────────

export default {
  // Primary brand — Strake green
  brand:      '#004B30',   // hero / header backgrounds, sidebar
  brandDark:  '#003521',   // pressed state
  brandLight: '#1D6347',   // hover state
  brandTint:  '#E5EEE9',   // tinted chip / section backgrounds

  // Accent — the same green family for interactive states
  accent:      '#004B30',  // primary buttons, selected chips, links
  accentDark:  '#003521',  // pressed
  accentLight: '#2F6B4F',  // hover + secondary avatar fill
  accentTint:  '#EEF4F0',  // accent-tinted background (lighter than brandTint)

  // School secondary colors
  maroon:     '#9B2C2C',   // date / status tags
  maroonTint: '#F6E9E9',
  gold:       '#C49A2C',   // accent rule above titles, active tab marker

  // Base
  white:    '#FFFFFF',
  offWhite: '#F1EFEC',     // app background — warm stone
  cream:    '#E9E5E0',     // recessed section background

  // 3D button edges — the darker "base" a raised button sits on
  brandDeep: '#002417',   // under Strake-green buttons
  stoneDeep: '#C9C1B8',   // under white / outlined buttons
  brandTintDeep: '#C3D6CB', // under light-green 'available' chips
  mascotWingLight: '#4C8A6B', // owl wings when drawn on a green header
  errorDeep: '#7E1810',   // under red buttons
  buttonGlow: 'rgba(0,75,48,0.22)', // soft green-tinted shadow

  // Organic header blobs — lighter shades of the same green, drawn over brand
  blob:     'rgba(255,255,255,0.07)',
  blobSoft: 'rgba(255,255,255,0.045)',

  // Rules / borders
  line:     '#D8D0C8',     // stone rule, input + outline borders
  lineSoft: '#EEEAE5',     // row dividers inside cards

  // Neutrals
  gray100: '#F4F2EF',
  gray200: '#E4DED7',
  gray300: '#C9C3BC',
  gray400: '#9A9EA2',
  gray500: '#5E6266',
  gray600: '#4B4F54',
  gray700: '#3A3E43',
  black:   '#1A1C1E',

  // White overlays — for text/icons on brand-colored surfaces
  whiteAlpha: {
    12: 'rgba(255,255,255,0.12)',   // dividers
    18: 'rgba(255,255,255,0.18)',   // active nav background
    30: 'rgba(255,255,255,0.30)',   // outlined controls on green
    65: 'rgba(255,255,255,0.70)',   // secondary text / inactive icons
    80: 'rgba(255,255,255,0.85)',   // body text on brand
  },

  // Semantic
  star:        '#C49A2C',  // rating stars
  starText:    '#8C6A14',  // rating numbers — darker gold so text passes contrast
  pending:     '#9B2C2C',  // "waiting" status — school maroon
  pendingTint: '#F6E9E9',
  error:       '#B42318',
  errorMuted:  '#FEF2F2',
  errorBorder: '#FECACA',

  // Focus ring
  focus: '#004B30',

  // Subject-badge families (SubjectBadge). Muted green/stone derivatives so a
  // row of badges reads as one palette and never competes with the brand.
  subject: {
    mathBg:    '#E5EEE9', mathText:    '#004B30',
    scienceBg: '#EEF4F0', scienceText: '#1D6347',
    englishBg: '#F6E9E9', englishText: '#7E2323',
    socialBg:  '#EFEBE4', socialText:  '#5A4E3A',
    langBg:    '#EDF0EF', langText:    '#3F5556',
  },

  shadow: 'rgba(0,0,0,0.06)',
};
