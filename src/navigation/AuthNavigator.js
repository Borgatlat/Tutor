import React from 'react';
import { View, StyleSheet } from 'react-native';
import { createStackNavigator } from '@react-navigation/stack';
import LoginScreen        from '../screens/auth/LoginScreen';
import SignUpScreen       from '../screens/auth/SignUpScreen';
import VerifyEmailScreen  from '../screens/auth/VerifyEmailScreen';
import ProfileSetupScreen from '../screens/auth/ProfileSetupScreen';
import { useResponsive }  from '../hooks/useResponsive';
import colors             from '../theme/colors';

const Stack = createStackNavigator();

function AuthStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Login"        component={LoginScreen} />
      <Stack.Screen name="SignUp"       component={SignUpScreen} />
      <Stack.Screen name="VerifyEmail"  component={VerifyEmailScreen} />
      <Stack.Screen name="ProfileSetup" component={ProfileSetupScreen} />
    </Stack.Navigator>
  );
}

export default function AuthNavigator() {
  const { isWide } = useResponsive();

  if (isWide) {
    // Desktop / tablet: green background, centered card
    return (
      <View style={styles.bg}>
        <View style={styles.card}>
          <AuthStack />
        </View>
      </View>
    );
  }

  return <AuthStack />;
}

const styles = StyleSheet.create({
  bg: {
    flex: 1,
    backgroundColor: colors.red,
    alignItems: 'center',
    justifyContent: 'center',
  },
  card: {
    width: '100%',
    maxWidth: 480,
    flex: 1,
    maxHeight: 900,
    borderRadius: 20,
    overflow: 'hidden',
    boxShadow: '0 8px 48px rgba(0,0,0,0.28)',
  },
});
