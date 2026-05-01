import { Dimensions, Platform } from 'react-native';

// Breakpoints (similar to Tailwind)
export const BREAKPOINTS = {
  sm: 640,   // Small phones
  md: 768,   // Tablets
  lg: 1024,  // Small laptops
  xl: 1280,  // Desktops
};

// Get current screen width
export const getScreenWidth = () => {
  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    return window.innerWidth;
  }
  return Dimensions.get('window').width;
};

// Get device type based on screen width
export const getDeviceType = (width = getScreenWidth()) => {
  if (width < BREAKPOINTS.md) return 'phone';
  if (width < BREAKPOINTS.lg) return 'tablet';
  return 'desktop';
};

// Check if we're on web
export const isWeb = Platform.OS === 'web';

// Get responsive value based on breakpoint
// Usage: responsive({ phone: 1, tablet: 2, desktop: 3 })
export const responsive = (values, width = getScreenWidth()) => {
  const device = getDeviceType(width);
  return values[device] ?? values.phone ?? values.tablet ?? values.desktop;
};

// Get number of columns for grid layouts
export const getGridColumns = (width = getScreenWidth()) => {
  if (width >= BREAKPOINTS.xl) return 4;
  if (width >= BREAKPOINTS.lg) return 3;
  if (width >= BREAKPOINTS.md) return 2;
  return 1;
};

// Get max content width based on screen size
export const getMaxContentWidth = (width = getScreenWidth()) => {
  if (width >= BREAKPOINTS.xl) return 1200;
  if (width >= BREAKPOINTS.lg) return 960;
  if (width >= BREAKPOINTS.md) return 720;
  return '100%';
};

// Get responsive padding
export const getResponsivePadding = (width = getScreenWidth()) => {
  if (width >= BREAKPOINTS.lg) return 32;
  if (width >= BREAKPOINTS.md) return 24;
  return 14;
};

// Get responsive font scale
export const getFontScale = (width = getScreenWidth()) => {
  if (width >= BREAKPOINTS.lg) return 1.1;
  if (width >= BREAKPOINTS.md) return 1.05;
  return 1;
};
