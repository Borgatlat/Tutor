import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { BottomTabBar }             from '@react-navigation/bottom-tabs';
import { createStackNavigator }     from '@react-navigation/stack';
import { Ionicons }                 from '@expo/vector-icons';

import HomeScreen         from '../screens/app/HomeScreen';
import SearchScreen       from '../screens/app/SearchScreen';
import TutorProfileScreen from '../screens/app/TutorProfileScreen';
import BookSessionScreen  from '../screens/app/BookSessionScreen';
import SessionsScreen     from '../screens/app/SessionsScreen';
import ProfileScreen      from '../screens/app/ProfileScreen';
import { useResponsive, SIDEBAR_WIDTH } from '../hooks/useResponsive';
import colors             from '../theme/colors';

const Tab   = createBottomTabNavigator();
const Stack = createStackNavigator();

function HomeStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="HomeMain"     component={HomeScreen} />
      <Stack.Screen name="TutorProfile" component={TutorProfileScreen} />
      <Stack.Screen name="BookSession"  component={BookSessionScreen} />
    </Stack.Navigator>
  );
}

function SearchStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="SearchMain"   component={SearchScreen} />
      <Stack.Screen name="TutorProfile" component={TutorProfileScreen} />
      <Stack.Screen name="BookSession"  component={BookSessionScreen} />
    </Stack.Navigator>
  );
}

const TAB_META = [
  { name: 'Home',     label: 'Home',     iconOff: 'home-outline',     iconOn: 'home'     },
  { name: 'Search',   label: 'Search',   iconOff: 'search-outline',   iconOn: 'search'   },
  { name: 'Sessions', label: 'Sessions', iconOff: 'calendar-outline', iconOn: 'calendar' },
  { name: 'Profile',  label: 'Profile',  iconOff: 'person-outline',   iconOn: 'person'   },
];

// ─── Desktop sidebar ──────────────────────────────────────────────────────────
function DesktopSidebar({ state, navigation }) {
  return (
    <View style={styles.sidebar}>
      {/* Brand */}
      <View style={styles.brand}>
        <View style={styles.brandIconWrap}>
          <Ionicons name="school" size={22} color={colors.white} />
        </View>
        <View>
          <Text style={styles.brandLine1}>STRAKE JESUIT</Text>
          <Text style={styles.brandLine2}>Tutors</Text>
        </View>
      </View>

      <View style={styles.sidebarDivider} />

      {/* Nav items */}
      {state.routes.map((route, index) => {
        const isFocused = state.index === index;
        const meta = TAB_META.find((t) => t.name === route.name);
        if (!meta) return null;
        return (
          <TouchableOpacity
            key={route.key}
            style={[styles.navItem, isFocused && styles.navItemActive]}
            onPress={() => navigation.navigate(route.name)}
            activeOpacity={0.8}
          >
            <Ionicons
              name={isFocused ? meta.iconOn : meta.iconOff}
              size={20}
              color={isFocused ? colors.green : 'rgba(255,255,255,0.65)'}
            />
            <Text style={[styles.navLabel, isFocused && styles.navLabelActive]}>
              {meta.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

// ─── Adaptive tab bar ─────────────────────────────────────────────────────────
function CustomTabBar(props) {
  const { isWide } = useResponsive();
  if (isWide) return <DesktopSidebar {...props} />;
  return <BottomTabBar {...props} />;
}

// ─── Navigator ────────────────────────────────────────────────────────────────
export default function AppNavigator() {
  const { isWide } = useResponsive();

  return (
    <Tab.Navigator
      tabBar={(props) => <CustomTabBar {...props} />}
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
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600', marginTop: 2 },
        tabBarIcon: ({ focused, color, size }) => {
          const meta = TAB_META.find((t) => t.name === route.name);
          return <Ionicons name={focused ? meta.iconOn : meta.iconOff} size={size} color={color} />;
        },
      })}
      sceneContainerStyle={isWide ? { marginLeft: SIDEBAR_WIDTH } : undefined}
    >
      <Tab.Screen name="Home"     component={HomeStack}     />
      <Tab.Screen name="Search"   component={SearchStack}   />
      <Tab.Screen name="Sessions" component={SessionsScreen} />
      <Tab.Screen name="Profile"  component={ProfileScreen} />
    </Tab.Navigator>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  sidebar: {
    width: SIDEBAR_WIDTH,
    backgroundColor: colors.red,
    paddingTop: 32,
    paddingHorizontal: 14,
    ...Platform.select({
      web: {
        position: 'fixed',
        top: 0,
        left: 0,
        bottom: 0,
        zIndex: 100,
        borderRightWidth: 1,
        borderRightColor: colors.redDark,
        boxShadow: '2px 0 16px rgba(0,0,0,0.12)',
      },
      default: {
        borderRightWidth: 1,
        borderRightColor: colors.redDark,
      },
    }),
  },

  brand: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 6,
    paddingBottom: 24,
  },
  brandIconWrap: {
    width: 40, height: 40, borderRadius: 12,
    backgroundColor: colors.green,
    alignItems: 'center', justifyContent: 'center',
  },
  brandLine1: {
    color: 'rgba(255,255,255,0.65)',
    fontSize: 9, fontWeight: '700', letterSpacing: 1.8,
  },
  brandLine2: {
    color: colors.white,
    fontSize: 17, fontWeight: '800', marginTop: 1,
  },

  sidebarDivider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.12)',
    marginBottom: 14,
  },

  navItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 13,
    paddingHorizontal: 14,
    paddingVertical: 13,
    borderRadius: 12,
    marginBottom: 4,
  },
  navItemActive: {
    backgroundColor: 'rgba(255,255,255,0.13)',
  },
  navLabel:       { fontSize: 14, fontWeight: '600', color: 'rgba(255,255,255,0.65)' },
  navLabelActive: { color: colors.white, fontWeight: '700' },
});
