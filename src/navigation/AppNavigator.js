import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
// Text imported above is used for emoji fallbacks
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
import { radii, space, border, press } from '../theme/layout';
import { sidebarShadow }  from '../theme/shadows';

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
  { name: 'Home',     label: 'Home',     iconOff: 'home-outline',     iconOn: 'home',     emoji: '🏠' },
  { name: 'Search',   label: 'Search',   iconOff: 'search-outline',   iconOn: 'search',   emoji: '🔍' },
  { name: 'Sessions', label: 'Sessions', iconOff: 'calendar-outline', iconOn: 'calendar', emoji: '📅' },
  { name: 'Profile',  label: 'Profile',  iconOff: 'person-outline',   iconOn: 'person',   emoji: '👤' },
];

// Renders an Ionicons icon with an emoji fallback in case the font hasn't loaded yet.
// The emoji is rendered behind the icon; once Ionicons loads it covers the emoji.
function NavIcon({ name, size, color, emoji }) {
  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      {/* Emoji fallback - visible only while the Ionicons font is loading */}
      <Text style={{ position: 'absolute', fontSize: size * 0.7, lineHeight: size }}>{emoji}</Text>
      {/* Ionicons - renders on top once the font loads */}
      <Ionicons name={name} size={size} color={color} />
    </View>
  );
}

// ─── Desktop sidebar ──────────────────────────────────────────────────────────
function DesktopSidebar({ state, navigation }) {
  return (
    <View style={styles.sidebar}>
      {/* Brand */}
      <View style={styles.brand}>
        <View style={styles.brandIconWrap}>
          <NavIcon name="school" size={22} color={colors.white} emoji="🎓" />
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
            activeOpacity={press.opacity}
            accessibilityRole="tab"
            accessibilityLabel={meta.label}
            accessibilityState={{ selected: isFocused }}
          >
            <NavIcon
              name={isFocused ? meta.iconOn : meta.iconOff}
              size={20}
              color={isFocused ? colors.white : colors.whiteAlpha[65]}
              emoji={meta.emoji}
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
        tabBarActiveTintColor:   colors.accent,
        tabBarInactiveTintColor: colors.gray400,
        tabBarStyle: {
          backgroundColor: colors.white,
          borderTopColor:  colors.gray200,
          borderTopWidth:  border.hairline,
          paddingBottom:   10,
          paddingTop:      6,
          height:          68,
        },
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600', marginTop: 2 },
        tabBarIcon: ({ focused, color, size }) => {
          const meta = TAB_META.find((t) => t.name === route.name);
          return (
            <NavIcon
              name={focused ? meta.iconOn : meta.iconOff}
              size={size}
              color={color}
              emoji={meta.emoji}
            />
          );
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
    backgroundColor: colors.brand,
    paddingTop: space.xxxl,
    paddingHorizontal: space.md,
    borderRightWidth: border.hairline,
    borderRightColor: colors.brandDark,
    ...sidebarShadow,
    ...Platform.select({
      web: {
        position: 'fixed',
        top: 0,
        left: 0,
        bottom: 0,
        zIndex: 100,
      },
      default: {},
    }),
  },

  brand: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    paddingHorizontal: 6,
    paddingBottom: space.xxl,
  },
  brandIconWrap: {
    width: 40, height: 40, borderRadius: radii.md,
    backgroundColor: colors.accent,
    alignItems: 'center', justifyContent: 'center',
  },
  brandLine1: {
    color: colors.whiteAlpha[65],
    fontSize: 9, fontWeight: '700', letterSpacing: 1.8,
  },
  brandLine2: {
    color: colors.white,
    fontSize: 17, fontWeight: '800', marginTop: 1,
  },

  sidebarDivider: {
    height: 1,
    backgroundColor: colors.whiteAlpha[12],
    marginBottom: space.md,
  },

  navItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    paddingHorizontal: space.md,
    paddingVertical: space.md,
    borderRadius: radii.md,
    marginBottom: space.xs,
  },
  navItemActive: {
    backgroundColor: colors.whiteAlpha[18],
  },
  navLabel:       { fontSize: 14, fontWeight: '600', color: colors.whiteAlpha[65] },
  navLabelActive: { color: colors.white, fontWeight: '700' },
});
