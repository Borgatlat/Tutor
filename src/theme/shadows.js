import { Platform } from 'react-native';

// Emits a cross-platform elevation. Both branches must always be present —
// a web-only branch means no shadow on native, and vice versa.
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

export const cardShadow   = s(2, 10, 0.07);   // cards, list rows
export const modalShadow  = s(2,  8, 0.06);   // popovers, dropdowns
export const searchShadow = s(2,  6, 0.08);   // search bars, sticky headers
export const sheetShadow  = s(3, 16, 0.22);   // bottom sheets, modals over dim
export const panelShadow  = s(4, 32, 0.10);   // desktop form panels

// Sidebar casts to the right, so it needs its own offset rather than the
// downward `s()` factory.
export const sidebarShadow = Platform.select({
  web: { boxShadow: '2px 0 16px rgba(0,0,0,0.12)' },
  default: {
    shadowColor: '#000',
    shadowOffset: { width: 2, height: 0 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 8,
  },
});
