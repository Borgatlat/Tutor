import { Platform } from 'react-native';
import colors from './colors';

// Emits a cross-platform elevation. Both branches must always be present —
// a web-only branch means no shadow on native, and vice versa.
// The look is flat (like the school site), so these stay very soft.
const s = (h, blur, opacity) =>
  Platform.select({
    web: { boxShadow: `0 ${h}px ${blur}px rgba(0,0,0,${opacity})` },
    default: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: h },
      shadowOpacity: opacity,
      shadowRadius: blur / 2,
      elevation: Math.round(h * 2),
    },
  });

export const cardShadow   = s(1,  3, 0.05);   // cards, list rows
export const modalShadow  = s(2,  8, 0.06);   // popovers, dropdowns
export const searchShadow = s(1,  4, 0.06);   // search bars, sticky headers
export const sheetShadow  = s(3, 16, 0.18);   // bottom sheets, modals over dim
export const panelShadow  = s(2, 16, 0.06);   // desktop form panels

// Sidebar casts to the right, so it needs its own offset rather than the
// downward `s()` factory.
export const sidebarShadow = Platform.select({
  web: { boxShadow: '1px 0 0 rgba(0,0,0,0.06)' },
  default: {
    shadowColor: '#000',
    shadowOffset: { width: 1, height: 0 },
    shadowOpacity: 0.06,
    shadowRadius: 2,
    elevation: 2,
  },
});

// ─── Raised (3D) controls ─────────────────────────────────────────────────────
// A raised control sits on a darker "base" edge in its own colour family plus a
// soft green-tinted glow. Pressed, it drops onto the base (see Button.js).
export const RAISE = 4;          // base edge thickness at rest
export const RAISE_PRESSED = 1;  // base edge thickness while pressed

export const buttonShadow = Platform.select({
  web: { boxShadow: `0 6px 14px ${colors.buttonGlow}` },
  default: {
    shadowColor: colors.brand,
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.22,
    shadowRadius: 7,
    elevation: 4,
  },
});

// Base edge colour per surface. `raised('white')` for white pills on green.
const BASE = {
  green: colors.brandDeep,
  white: colors.stoneDeep,
  red:   colors.errorDeep,
};

export function raised(kind = 'green', pressed = false) {
  return {
    borderBottomWidth: pressed ? RAISE_PRESSED : RAISE,
    borderBottomColor: BASE[kind] ?? BASE.green,
    // Keep the outer height constant: the lost edge turns into top offset,
    // so the button visibly "presses in" without the layout jumping.
    marginTop: pressed ? RAISE - RAISE_PRESSED : 0,
    ...(pressed ? {} : buttonShadow),
  };
}
