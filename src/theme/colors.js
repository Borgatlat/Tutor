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
//
// Light and dark: the app follows the device's appearance setting. The dark
// palette below overrides only what changes; green headers, green buttons, the
// gold accents and the logo look the same in both. Pick tokens by role:
//   surface    card / sheet / input background   (white in light mode)
//   white      text and icons ON green or coloured fills (always white)
//   black      primary text                       (near-white in dark mode)
//   brand      green FILLS: headers, buttons      (same in both)
//   brandText  green TEXT and icons on a surface  (lighter green in dark mode)
//   errorText  red text on a surface
// The scheme is read once at launch, before any StyleSheet is created, so a
// change to the device setting applies the next time the app opens.
// ─────────────────────────────────────────────────────────────────────────────
import { Appearance } from 'react-native';

const light = {
  // Primary brand: Strake green
  brand:      '#004B30',   // hero / header backgrounds, sidebar
  brandDark:  '#003521',   // pressed state
  brandLight: '#1D6347',   // hover state
  brandTint:  '#E5EEE9',   // tinted chip / section backgrounds

  // Accent: the same green family for interactive states
  accent:      '#004B30',  // primary buttons, selected chips, links
  accentDark:  '#003521',  // pressed
  accentLight: '#2F6B4F',  // hover + secondary avatar fill
  accentTint:  '#EEF4F0',  // accent-tinted background (lighter than brandTint)

  // School secondary colors
  maroon:     '#9B2C2C',   // date / status tags
  maroonTint: '#F6E9E9',
  gold:       '#C49A2C',   // accent rule above titles, active tab marker
  goldTint:   '#F6EFDD',   // tutor badge background
  goldText:   '#735610',   // tutor badge text on goldTint

  // Base
  white:    '#FFFFFF',     // text/icons on green: never changes
  surface:  '#FFFFFF',     // cards, sheets, inputs
  brandText:'#004B30',     // green text and icons on surfaces
  errorText:'#B42318',     // red text on surfaces
  paper:    '#F1EFEC',     // Ollie's face and belly (same in both schemes)
  ink:      '#1A1C1E',     // Ollie's eyes (same in both schemes)
  paperLine:'#D8D0C8',     // chevrons on Ollie's belly
  offWhite: '#F1EFEC',     // app background: warm stone
  cream:    '#E9E5E0',     // recessed section background

  // 3D button edges: the darker "base" a raised button sits on
  brandDeep: '#002417',   // under Strake-green buttons
  stoneDeep: '#C9C1B8',   // under white / outlined buttons
  brandTintDeep: '#C3D6CB', // under light-green 'available' chips
  mascotWingLight: '#4C8A6B', // owl wings when drawn on a green header
  errorDeep: '#7E1810',   // under red buttons
  buttonGlow: 'rgba(0,75,48,0.22)', // soft green-tinted shadow

  // Organic header blobs: lighter shades of the same green, drawn over brand
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

  // White overlays: for text/icons on brand-colored surfaces
  whiteAlpha: {
    12: 'rgba(255,255,255,0.12)',   // dividers
    18: 'rgba(255,255,255,0.18)',   // active nav background
    30: 'rgba(255,255,255,0.30)',   // outlined controls on green
    65: 'rgba(255,255,255,0.70)',   // secondary text / inactive icons
    80: 'rgba(255,255,255,0.85)',   // body text on brand
    90: 'rgba(255,255,255,0.92)',   // logo book pages on brand
  },

  // Semantic
  star:        '#C49A2C',  // rating stars
  starText:    '#8C6A14',  // rating numbers: darker gold so text passes contrast
  pending:     '#9B2C2C',  // "waiting" status: school maroon
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

const dark = {
  ...light,
  brandTint:     '#173A2B',
  accentTint:    '#14301F',
  maroonTint:    '#3A1E1E',
  goldTint:      '#3A3016',
  goldText:      '#F0D27E',

  surface:   '#17211C',
  brandText: '#7FC4A0',
  errorText: '#F2857B',

  offWhite: '#0E1512',   // app background
  cream:    '#1E2924',   // recessed tracks (segmented controls)

  stoneDeep:     '#060A08',
  brandTintDeep: '#0B2318',
  buttonGlow:    'rgba(0,0,0,0.45)',

  line:     '#33413A',
  lineSoft: '#25312B',

  gray100: '#1F2A25',
  gray200: '#2C3832',
  gray300: '#5C6862',
  gray400: '#87928C',
  gray500: '#A9B3AE',
  gray600: '#C0C8C4',
  gray700: '#D5DBD8',
  black:   '#EEF2EF',

  starText:    '#E2BF62',
  pendingTint: '#3A1E1E',
  errorMuted:  '#33191A',
  errorBorder: '#6E2B26',

  focus: '#7FC4A0',

  subject: {
    mathBg:    '#173A2B', mathText:    '#9AD5B5',
    scienceBg: '#163126', scienceText: '#A6D8BE',
    englishBg: '#3A1E1E', englishText: '#F0B4B4',
    socialBg:  '#2E2A22', socialText:  '#E0D2B8',
    langBg:    '#1F2B2A', langText:    '#B8D0CF',
  },

  shadow: 'rgba(0,0,0,0.4)',
};

export const isDark = Appearance.getColorScheme() === 'dark';

export default isDark ? dark : light;
