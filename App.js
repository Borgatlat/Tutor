import 'react-native-gesture-handler';
import React, { useEffect } from 'react';
import { View, StyleSheet, Platform } from 'react-native';
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

function App() {
  const { session, setupComplete, loading, init } = useAuthStore();

  useEffect(() => {
    const unsub = init();
    return unsub;
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

  // On web: center a phone-width container with the brand color on the sides
  if (Platform.OS === 'web') {
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

  // Web-only: fills the browser viewport, centers the app column
  webOuter: {
    flex: 1,
    minHeight: '100vh',
    backgroundColor: colors.red,        // forest-green gutters match brand
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  webInner: {
    width: '100%',
    maxWidth: 430,                       // iPhone 15 Pro width — feels native
    flex: 1,
    minHeight: '100vh',
    overflow: 'hidden',
    boxShadow: '0 0 60px rgba(0,0,0,0.35)',
    backgroundColor: '#F7F5F0',         // colors.offWhite
  },
});

registerRootComponent(App);

export default App;
