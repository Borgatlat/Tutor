import 'react-native-gesture-handler';
import React, { useEffect } from 'react';
import { Platform } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { registerRootComponent } from 'expo';

// ─── iOS Safari keyboard fix ─────────────────────────────────────────────────
// React Native Web sets user-select:none on all Views, which prevents mobile
// Safari from showing the keyboard when text inputs are tapped.
// We inject a <style> tag at startup to override this for every input/textarea.
if (Platform.OS === 'web' && typeof document !== 'undefined') {
  const style = document.createElement('style');
  style.id = 'rn-web-input-fix';
  style.textContent = `
    input, textarea, [contenteditable] {
      -webkit-user-select: text !important;
      user-select: text !important;
      touch-action: manipulation;
      -webkit-tap-highlight-color: transparent;
      font-size: max(16px, 1em);
    }
    input[type="text"],
    input[type="email"],
    input[type="password"],
    input[type="tel"],
    input[type="search"],
    textarea {
      -webkit-appearance: none;
      appearance: none;
    }
  `;
  document.head.appendChild(style);
}

import useAuthStore       from './src/store/useAuthStore';
import AuthNavigator      from './src/navigation/AuthNavigator';
import AppNavigator       from './src/navigation/AppNavigator';
import SplashScreen       from './src/screens/auth/SplashScreen';
import ProfileSetupScreen from './src/screens/auth/ProfileSetupScreen';

function App() {
  const { session, setupComplete, loading, init } = useAuthStore();

  useEffect(() => {
    const unsub = init();
    return unsub;
  }, []);

  if (loading) return <SplashScreen />;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
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
}

registerRootComponent(App);

export default App;
