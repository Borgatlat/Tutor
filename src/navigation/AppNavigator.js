import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator }     from '@react-navigation/stack';
import { Ionicons }                 from '@expo/vector-icons';

import HomeScreen         from '../screens/app/HomeScreen';
import SearchScreen       from '../screens/app/SearchScreen';
import TutorProfileScreen from '../screens/app/TutorProfileScreen';
import BookSessionScreen  from '../screens/app/BookSessionScreen';
import SessionsScreen     from '../screens/app/SessionsScreen';
import ProfileScreen      from '../screens/app/ProfileScreen';
import colors             from '../theme/colors';

const Tab   = createBottomTabNavigator();
const Stack = createStackNavigator();

function HomeStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="HomeMain"    component={HomeScreen} />
      <Stack.Screen name="TutorProfile" component={TutorProfileScreen} />
      <Stack.Screen name="BookSession"  component={BookSessionScreen} />
    </Stack.Navigator>
  );
}

function SearchStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="SearchMain"  component={SearchScreen} />
      <Stack.Screen name="TutorProfile" component={TutorProfileScreen} />
      <Stack.Screen name="BookSession"  component={BookSessionScreen} />
    </Stack.Navigator>
  );
}

const TAB_ICONS = {
  Home:     { default: 'home-outline',     active: 'home'     },
  Search:   { default: 'search-outline',   active: 'search'   },
  Sessions: { default: 'calendar-outline', active: 'calendar' },
  Profile:  { default: 'person-outline',   active: 'person'   },
};

export default function AppNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor:   colors.red,
        tabBarInactiveTintColor: colors.gray400,
        tabBarStyle: {
          backgroundColor: colors.white,
          borderTopColor:  colors.gray100,
          borderTopWidth:  1,
          paddingBottom:   10,
          paddingTop:      6,
          height:          68,
        },
        tabBarLabelStyle: {
          fontSize:   11,
          fontWeight: '600',
          marginTop:  2,
        },
        tabBarIcon: ({ focused, color, size }) => {
          const icon = TAB_ICONS[route.name];
          return (
            <Ionicons
              name={focused ? icon.active : icon.default}
              size={size}
              color={color}
            />
          );
        },
      })}
    >
      <Tab.Screen name="Home"     component={HomeStack}    />
      <Tab.Screen name="Search"   component={SearchStack}  />
      <Tab.Screen name="Sessions" component={SessionsScreen} />
      <Tab.Screen name="Profile"  component={ProfileScreen} />
    </Tab.Navigator>
  );
}
