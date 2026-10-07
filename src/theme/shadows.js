import { Platform } from 'react-native';

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
