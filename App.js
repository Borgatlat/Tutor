import 'react-native-gesture-handler';
import React, { useEffect, useState } from 'react';
import { View, StyleSheet, Platform, Dimensions } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { registerRootComponent } from 'expo';

import useAuthStore       from './src/store/useAuthStore';
import AuthNavigator      from './src/navigation/AuthNavigator';
import AppNavigator       from './src/navigation/AppNavigator';
import SplashScreen       from './src/screens/auth/SplashScreen';
import ProfileSetupScreen from './src/screens/auth/ProfileSetupScreen';
import colors             from './src/theme/colors';

// Breakpoints
const BREAKPOINTS = {
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
};

function App() {
  const { session, setupComplete, loading, init } = useAuthStore();
  const [screenWidth, setScreenWidth] = useState(
    Platform.OS === 'web' && typeof window !== 'undefined'
      ? window.innerWidth
      : Dimensions.get('window').width
  );

  useEffect(() => {
    const unsub = init();
    return unsub;
  }, []);

  // Listen for resize on web
  useEffect(() => {
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      const handleResize = () => setScreenWidth(window.innerWidth);
      window.addEventListener('resize', handleResize);
      return () => window.removeEventListener('resize', handleResize);
    }
  }, []);

  if (loading) return <SplashScreen />;

  const inner = (
    <GestureHandlerRootView style={styles.gestureRoot}>
      <StatusBar style="light" />
      <NavigationContainer>
        {!session
          ? <AuthNavigator />
          : !setupComplete
            ? <ProfileSetupScreen />
            : <AppNavigator />
        }
      </NavigationContainer>
    </GestureHandlerRootView>
  );

  // On web: use responsive layout
  if (Platform.OS === 'web') {
    // Determine layout mode based on screen width
    const isPhone = screenWidth < BREAKPOINTS.md;
    const isTablet = screenWidth >= BREAKPOINTS.md && screenWidth < BREAKPOINTS.lg;
    const isDesktop = screenWidth >= BREAKPOINTS.lg;

    // Full-width responsive layout for larger screens
    if (isDesktop || isTablet) {
      return (
        <View style={styles.webResponsiveOuter}>
          <View style={[
            styles.webResponsiveInner,
            isDesktop && styles.webDesktopInner,
            isTablet && styles.webTabletInner,
          ]}>
            {inner}
          </View>
        </View>
      );
    }

    // Phone-style centered layout for small screens
    return (
      <View style={styles.webOuter}>
        <View style={styles.webInner}>
          {inner}
        </View>
      </View>
    );
  }

  return inner;
}

const styles = StyleSheet.create({
  gestureRoot: { flex: 1 },

  // Phone-style: centered column (small screens)
  webOuter: {
    flex: 1,
    minHeight: '100vh',
    backgroundColor: colors.red,
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  webInner: {
    width: '100%',
    maxWidth: 430,
    flex: 1,
    minHeight: '100vh',
    overflow: 'hidden',
    boxShadow: '0 0 60px rgba(0,0,0,0.35)',
    backgroundColor: colors.offWhite,
  },

  // Responsive: full-width layouts (tablet & desktop)
  webResponsiveOuter: {
    flex: 1,
    minHeight: '100vh',
    backgroundColor: colors.offWhite,
  },
  webResponsiveInner: {
    flex: 1,
    minHeight: '100vh',
    width: '100%',
    backgroundColor: colors.offWhite,
  },
  webTabletInner: {
    maxWidth: 900,
    marginHorizontal: 'auto',
  },
  webDesktopInner: {
    maxWidth: 1200,
    marginHorizontal: 'auto',
  },
});

registerRootComponent(App);

export default App;
