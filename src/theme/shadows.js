import { Platform } from 'react-native';

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

export const cardShadow   = s(2, 10, 0.07);
export const modalShadow  = s(2,  8, 0.06);
export const searchShadow = s(2,  6, 0.08);
