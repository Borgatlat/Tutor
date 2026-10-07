import { Platform, Text, TextInput, StyleSheet } from 'react-native';

// ─── Typeface: Montserrat ─────────────────────────────────────────────────────
// Matches the school website. One family for everything — headings are
// ExtraBold, labels are small tracked capitals, body is Regular/Medium.
//
// Web loads Montserrat from Google Fonts (web/index.html) as one family with
// real weights. Native loads each weight as its own family via
// @expo-google-fonts/montserrat (App.js), so a fontWeight has to be turned into
// a family name there — `applyFontFamily()` below does that globally.
// ─────────────────────────────────────────────────────────────────────────────

const WEB_FAMILY = 'Montserrat, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';

const NATIVE_FAMILY = {
  '100': 'Montserrat_400Regular',
  '200': 'Montserrat_400Regular',
  '300': 'Montserrat_400Regular',
  '400': 'Montserrat_400Regular',
  normal: 'Montserrat_400Regular',
  '500': 'Montserrat_500Medium',
  '600': 'Montserrat_600SemiBold',
  '700': 'Montserrat_700Bold',
  bold:  'Montserrat_700Bold',
  '800': 'Montserrat_800ExtraBold',
  '900': 'Montserrat_800ExtraBold',
};

const sans = Platform.select({ web: WEB_FAMILY, default: NATIVE_FAMILY['400'] });

// `serif` is kept as an alias so older imports keep working — there is no
// serif in the app any more.
export const fonts = { sans, serif: sans };

// Heading style presets
export const heading = {
  xl:  { fontFamily: sans, fontWeight: '800', letterSpacing: -0.6 },
  lg:  { fontFamily: sans, fontWeight: '800', letterSpacing: -0.4 },
  md:  { fontFamily: sans, fontWeight: '700', letterSpacing: -0.2 },
  sm:  { fontFamily: sans, fontWeight: '700', letterSpacing: 0    },
};

// Label / caption preset — small tracked capitals, like the site's
// "FOUNDING YEAR" / "ALUMNI NEWS" labels.
export const label = {
  caps: { fontFamily: sans, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 1.8 },
};

// ─── Global font application ──────────────────────────────────────────────────
// Every <Text> / <TextInput> without its own font family (icon fonts keep
// theirs) gets Montserrat. On native the weight is folded into the family name
// and fontWeight reset, otherwise iOS fakes a bold on top of an already-bold
// face or falls back to the system font.
let applied = false;

function patch(Component) {
  const original = Component.render;
  if (typeof original !== 'function') return;

  Component.render = function render(props, ref) {
    const flat = StyleSheet.flatten(props.style) || {};
    if (flat.fontFamily && flat.fontFamily !== sans) {
      return original.call(this, props, ref);
    }
    const extra = Platform.OS === 'web'
      ? { fontFamily: WEB_FAMILY }
      : {
          fontFamily: NATIVE_FAMILY[String(flat.fontWeight ?? '400')] ?? NATIVE_FAMILY['400'],
          fontWeight: 'normal',
        };
    return original.call(this, { ...props, style: [props.style, extra] }, ref);
  };
}

export function applyFontFamily() {
  if (applied) return;
  applied = true;
  patch(Text);
  patch(TextInput);
}
