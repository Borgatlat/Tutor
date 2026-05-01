import { useState, useEffect } from 'react';
import { Dimensions, Platform } from 'react-native';
import {
  BREAKPOINTS,
  getScreenWidth,
  getDeviceType,
  getGridColumns,
  getMaxContentWidth,
  getResponsivePadding,
  getFontScale,
} from '../utils/responsive';

export default function useResponsive() {
  const [screenWidth, setScreenWidth] = useState(getScreenWidth());

  useEffect(() => {
    // On web, listen to window resize
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      const handleResize = () => setScreenWidth(window.innerWidth);
      window.addEventListener('resize', handleResize);
      return () => window.removeEventListener('resize', handleResize);
    }

    // On native, listen to Dimensions changes
    const subscription = Dimensions.addEventListener('change', ({ window }) => {
      setScreenWidth(window.width);
    });

    return () => subscription?.remove();
  }, []);

  const deviceType = getDeviceType(screenWidth);
  const isPhone = deviceType === 'phone';
  const isTablet = deviceType === 'tablet';
  const isDesktop = deviceType === 'desktop';

  return {
    screenWidth,
    deviceType,
    isPhone,
    isTablet,
    isDesktop,
    isWeb: Platform.OS === 'web',
    columns: getGridColumns(screenWidth),
    maxContentWidth: getMaxContentWidth(screenWidth),
    padding: getResponsivePadding(screenWidth),
    fontScale: getFontScale(screenWidth),
    breakpoints: BREAKPOINTS,
  };
}
