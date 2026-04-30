// ─── Strake Jesuit Official Palette ──────────────────────────────────────────
// Matched from strakejesuit.org: dark forest green primary, gold accent, white
// "red" keys map to the dark-green primary so no other files need renaming
// "green" keys map to the gold accent
// ─────────────────────────────────────────────────────────────────────────────

export default {
  // Primary brand — dark forest green (replaces all former "red" usages)
  red:        '#1B4D2E',   // primary hero / header background
  redDark:    '#123320',   // pressed / darker variant
  redLight:   '#2D6B44',   // hover / lighter variant
  redMuted:   '#E8F0EC',   // tinted background chips

  // Accent — gold (replaces all former "green" usages)
  green:      '#C9A547',   // gold accent buttons, badges
  greenDark:  '#A8863A',   // darker gold
  greenLight: '#D4B560',   // lighter gold
  greenMuted: '#FAF3E0',   // gold-tinted background

  // Base
  white:      '#FFFFFF',
  offWhite:   '#F7F5F0',   // warm off-white background
  cream:      '#F0EDE8',   // card / section backgrounds

  // Neutrals
  gray100:    '#F2F2F0',
  gray200:    '#E5E4E0',
  gray300:    '#C5C4C0',
  gray400:    '#A0A09C',
  gray500:    '#6B7074',
  gray600:    '#4B5059',
  gray700:    '#333840',
  black:      '#111214',

  // Semantic
  warning:    '#C9A547',   // reuse gold for warnings/stars
  error:      '#C0392B',   // destructive actions / error text
  errorMuted: '#FEF2F2',   // error banner background
  errorBorder:'#FECACA',   // error banner border
  shadow:     'rgba(0,0,0,0.07)',
};
