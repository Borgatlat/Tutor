import 'react-native-gesture-handler';
import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { registerRootComponent } from 'expo';

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
