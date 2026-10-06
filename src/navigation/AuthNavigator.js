import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import LoginScreen        from '../screens/auth/LoginScreen';
import SignUpScreen       from '../screens/auth/SignUpScreen';
import OnboardingScreen   from '../screens/auth/OnboardingScreen';
import VerifyEmailScreen  from '../screens/auth/VerifyEmailScreen';
import ForgotPasswordScreen from '../screens/auth/ForgotPasswordScreen';
import ProfileSetupScreen from '../screens/auth/ProfileSetupScreen';

const Stack = createStackNavigator();

export default function AuthNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Login"        component={LoginScreen} />
      <Stack.Screen name="Onboarding"   component={OnboardingScreen} />
      {/* Kept registered as a fallback; the Create Account button now goes to
          Onboarding, which collects the profile answers before the account. */}
      <Stack.Screen name="SignUp"       component={SignUpScreen} />
      <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
      <Stack.Screen name="VerifyEmail"  component={VerifyEmailScreen} />
      <Stack.Screen name="ProfileSetup" component={ProfileSetupScreen} />
    </Stack.Navigator>
  );
}
