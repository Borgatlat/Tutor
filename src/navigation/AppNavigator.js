import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets }        from 'react-native-safe-area-context';
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
import { school }        from '../theme/school';
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
  { name: 'Home',     label: 'Home',     iconOff: 'home-outline',     iconOn: 'home' },
  { name: 'Search',   label: 'Search',   iconOff: 'search-outline',   iconOn: 'search' },
  { name: 'Sessions', label: 'Sessions', iconOff: 'calendar-outline', iconOn: 'calendar' },
  { name: 'Profile',  label: 'Profile',  iconOff: 'person-outline',   iconOn: 'person' },
];

// Ionicons only. The old emoji fallback sat behind the glyph and showed through
// its transparent areas even after the font loaded; App.js already waits for
// the icon font before rendering, so the fallback isn't needed.
function NavIcon({ name, size, color }) {
  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
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
          <NavIcon name="school" size={22} color={colors.white} />
        </View>
        <View>
          <Text style={styles.brandLine1}>{school.name.toUpperCase()}</Text>
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
            />
            <Text style={[styles.navLabel, isFocused && styles.navLabelActive]}>
              {meta.label}
            </Text>
            {isFocused ? <View style={styles.navDot} /> : null}
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

// ─── Mobile tab bar ───────────────────────────────────────────────────────────
// White bar with tracked-caps labels; the active tab gets a short rounded gold
// marker and a soft green pill behind its icon.
function MobileTabBar({ state, navigation }) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.tabBar, { paddingBottom: Math.max(insets.bottom, space.sm) }]}>
      {state.routes.map((route, index) => {
        const isFocused = state.index === index;
        const meta = TAB_META.find((t) => t.name === route.name);
        if (!meta) return null;

        const onPress = () => {
          const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
          if (!isFocused && !event.defaultPrevented) navigation.navigate(route.name);
        };

        const tint = isFocused ? colors.brand : colors.gray500;
        return (
          <TouchableOpacity
            key={route.key}
            style={styles.tabItem}
            onPress={onPress}
            activeOpacity={press.opacity}
            accessibilityRole="tab"
            accessibilityLabel={meta.label}
            accessibilityState={{ selected: isFocused }}
          >
            <View style={[styles.tabMarker, isFocused && styles.tabMarkerActive]} />
            <View style={[styles.tabIconWrap, isFocused && styles.tabIconWrapActive]}>
              <NavIcon
                name={isFocused ? meta.iconOn : meta.iconOff}
                size={22}
                color={tint}
              />
            </View>
            <Text style={[styles.tabLabel, { color: tint }, isFocused && styles.tabLabelActive]}>
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
  return <MobileTabBar {...props} />;
}

// ─── Navigator ────────────────────────────────────────────────────────────────
export default function AppNavigator() {
  const { isWide } = useResponsive();

  return (
    <Tab.Navigator
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={({ route }) => ({
        headerShown: false,
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
    width: 40, height: 40, borderRadius: radii.pill,
    borderWidth: 1, borderColor: colors.whiteAlpha[30],
    alignItems: 'center', justifyContent: 'center',
  },
  brandLine1: {
    color: colors.white,
    fontSize: 12, fontWeight: '800', letterSpacing: 0.6,
  },
  brandLine2: {
    color: colors.whiteAlpha[65],
    fontSize: 11, fontWeight: '500', marginTop: 1,
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
    borderRadius: radii.pill,
    marginBottom: space.xs,
  },
  // Soft pill for the current section, with a gold dot at its end.
  navItemActive: {
    backgroundColor: colors.whiteAlpha[12],
  },
  navDot: {
    width: 6, height: 6, borderRadius: 3,
    backgroundColor: colors.gold,
    marginLeft: 'auto',
  },
  navLabel: {
    fontSize: 12, fontWeight: '600', letterSpacing: 1.6, textTransform: 'uppercase',
    color: colors.whiteAlpha[65],
  },
  navLabelActive: { color: colors.white, fontWeight: '700' },

  // ── Mobile tab bar ────────────────────────────────────────────────────────
  tabBar: {
    flexDirection: 'row',
    backgroundColor: colors.white,
    borderTopWidth: border.hairline,
    borderTopColor: colors.gray200,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
    minHeight: 60,
  },
  tabMarker: {
    width: 28, height: 4, borderRadius: 2,
    backgroundColor: 'transparent',
    marginBottom: space.xs,
  },
  tabMarkerActive: { backgroundColor: colors.gold },
  tabIconWrap: {
    paddingHorizontal: space.lg, paddingVertical: 3,
    borderRadius: radii.pill,
  },
  tabIconWrapActive: { backgroundColor: colors.brandTint },
  tabLabel: {
    fontSize: 10, fontWeight: '600', letterSpacing: 1.4, textTransform: 'uppercase',
  },
  tabLabelActive: { fontWeight: '700' },
});
