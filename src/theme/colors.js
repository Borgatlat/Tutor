// ─── Strake Jesuit Palette ────────────────────────────────────────────────────
// brand*  → dark forest green   (heroes, nav, headers — the primary voice)
// accent* → medium forest green (buttons, badges, active/selected states)
// star    → gold, reserved exclusively for rating stars
//
// Every color in the app comes from this file. If you need a shade that isn't
// here, add it here rather than inlining a hex somewhere else.
// ─────────────────────────────────────────────────────────────────────────────

export default {
  // Primary brand — dark forest green
  brand:      '#1B4D2E',   // hero / header backgrounds, sidebar
  brandDark:  '#123320',   // pressed state
  brandLight: '#2D6B44',   // hover state
  brandTint:  '#E8F0EC',   // tinted chip / section backgrounds

  // Accent — medium forest green
  accent:      '#2E7D52',  // primary buttons, selected chips, links
  accentDark:  '#1F5C3A',  // pressed
  accentLight: '#3D9E68',  // hover + focus ring
  accentTint:  '#EAF5EF',  // accent-tinted background (lighter than brandTint)

  // Base
  white:    '#FFFFFF',
  offWhite: '#F7F5F0',     // app background
  cream:    '#F0EDE8',     // recessed section background

  // Neutrals
  gray100: '#F2F2F0',
  gray200: '#E5E4E0',
  gray300: '#C5C4C0',
  gray400: '#A0A09C',
  gray500: '#6B7074',
  gray600: '#4B5059',
  gray700: '#333840',
  black:   '#111214',

  // White overlays — for text/icons on brand-colored surfaces
  whiteAlpha: {
    12: 'rgba(255,255,255,0.12)',   // dividers
    18: 'rgba(255,255,255,0.18)',   // active nav background
    65: 'rgba(255,255,255,0.65)',   // secondary text / inactive icons
    80: 'rgba(255,255,255,0.80)',   // body text on brand
  },

  // Semantic
  star:        '#C9A547',  // rating stars ONLY — not a general accent
  pending:     '#8A7A4D',  // "waiting" status — warm neutral, not gold
  pendingTint: '#F3F0E6',
  error:       '#C0392B',
  errorMuted:  '#FEF2F2',
  errorBorder: '#FECACA',

  // Focus ring
  focus: '#3D9E68',

  // Subject-badge families (SubjectBadge). Muted green/slate derivatives so a
  // row of badges reads as one palette and never competes with the brand.
  subject: {
    mathBg:    '#E8F0EC', mathText:    '#1B4D2E',
    scienceBg: '#EAF5EF', scienceText: '#1F5C3A',
    englishBg: '#EFF3F1', englishText: '#3C5A4A',
    socialBg:  '#F1F2EE', socialText:  '#4F5847',
    langBg:    '#EEF2F2', langText:    '#3F5556',
  },

  shadow: 'rgba(0,0,0,0.07)',
};
