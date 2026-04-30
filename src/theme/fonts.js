import { Platform } from 'react-native';

// Heading font — Georgia (system serif on iOS/web, fallback on Android)
const serif = Platform.select({
  ios:     'Georgia',
  android: 'serif',
  web:     'Georgia, "Times New Roman", serif',
});

// Body font — system sans-serif
const sans = Platform.select({
  ios:     'System',
  android: 'sans-serif',
  web:     '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
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
