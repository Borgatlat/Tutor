import { useWindowDimensions } from 'react-native';

export const BREAKPOINTS = { mobile: 0, tablet: 768, desktop: 1100 };
export const SIDEBAR_WIDTH = 240;

export function useResponsive() {
  const { width } = useWindowDimensions();
  return {
    width,
    isMobile:  width < BREAKPOINTS.tablet,
    isTablet:  width >= BREAKPOINTS.tablet && width < BREAKPOINTS.desktop,
    isDesktop: width >= BREAKPOINTS.desktop,
    isWide:    width >= BREAKPOINTS.tablet,   // tablet OR desktop → show sidebar
    columns:   width >= BREAKPOINTS.desktop ? 2 : 1,
  };
}
