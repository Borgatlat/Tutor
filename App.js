import 'react-native-gesture-handler';
import React, { useEffect } from 'react';
import { Platform } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { registerRootComponent } from 'expo';

// ─── iOS Safari keyboard fix ─────────────────────────────────────────────────
// TWO separate problems on iOS Safari:
//
// 1. body { overflow: hidden } (injected by Expo's reset CSS) causes Safari to
//    try scrolling the body when an input is focused — the scroll fails, Safari
//    decides the input is inaccessible and drops focus → keyboard never opens.
//    Fix: body { position: fixed } tells Safari the layout is already anchored;
//    no scroll is needed; keyboard appears normally.
//
// 2. React Native Web puts user-select:none on every View container, which
//    prevents Safari from treating a tap as a genuine text-input gesture.
//    Fix: force user-select:text on all input/textarea elements.
//
if (Platform.OS === 'web' && typeof document !== 'undefined') {
  const style = document.createElement('style');
  style.id = 'rn-web-ios-keyboard-fix';
  style.textContent = `
    /* Fix 1 — stop Safari dropping focus when body is overflow:hidden */
    html, body {
      position: fixed !important;
      overflow: hidden !important;
      width: 100% !important;
      height: 100% !important;
      top: 0 !important;
      left: 0 !important;
    }
    #root {
      height: 100%;
      overflow: hidden;
    }

    /* Fix 2 — allow Safari to treat taps as keyboard-triggering gestures */
    input, textarea, [contenteditable] {
      -webkit-user-select: text !important;
      user-select: text !important;
      touch-action: manipulation !important;
      -webkit-tap-highlight-color: transparent;
      /* ≥16px prevents iOS auto-zoom on focus */
      font-size: max(16px, 1em) !important;
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
  // Insert AFTER expo-reset so our rules win
  const expoReset = document.getElementById('expo-reset');
  if (expoReset && expoReset.nextSibling) {
    document.head.insertBefore(style, expoReset.nextSibling);
  } else {
    document.head.appendChild(style);
  }
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
