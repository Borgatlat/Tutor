import { Platform } from 'react-native';

// Heading font. Web loads Source Serif 4 (see the <link> in web/index.html);
// native keeps the system serif until the TTFs are bundled via expo-font.
const serif = Platform.select({
  ios:     'Georgia',
  android: 'serif',
  web:     '"Source Serif 4", Georgia, "Times New Roman", serif',
});

// Body font. IBM Plex Sans on web - chosen over Inter, which reads as the
// default of every generated interface.
const sans = Platform.select({
  ios:     'System',
  android: 'sans-serif',
  web:     '"IBM Plex Sans", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
});

export const fonts = { serif, sans };

// Heading style presets
export const heading = {
  xl:  { fontFamily: serif, fontWeight: '800', letterSpacing: -0.5 },
  lg:  { fontFamily: serif, fontWeight: '700', letterSpacing: -0.3 },
  md:  { fontFamily: serif, fontWeight: '700', letterSpacing: -0.2 },
  sm:  { fontFamily: serif, fontWeight: '600', letterSpacing: 0    },
};

// Label / caption preset (always sans)
export const label = {
  caps: { fontFamily: sans, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1 },
};
