import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Platform, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import colors from '../../theme/colors';
import { radii, space } from '../../theme/layout';
import { heading } from '../../theme/fonts';

const useNativeDriver = Platform.OS !== 'web';

export default function SplashScreen() {
  const opacity = useRef(new Animated.Value(0)).current;
  const scale   = useRef(new Animated.Value(0.8)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, { toValue: 1, duration: 700, useNativeDriver }),
      Animated.spring(scale,   { toValue: 1, tension: 60, friction: 8, useNativeDriver }),
    ]).start();
  }, []);

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.content, { opacity, transform: [{ scale }] }]}>
        <View style={styles.iconWrap}>
          <Ionicons name="school" size={56} color={colors.white} />
        </View>
        <Text style={styles.school}>STRAKE JESUIT</Text>
        <Text style={styles.title}>Tutor{'\n'}Marketplace</Text>
        <Text style={styles.sub}>Crusaders helping Crusaders</Text>

        {/* A real spinner - the old static dot read as a loading indicator but
            never moved, so a slow session restore looked frozen. */}
        <ActivityIndicator
          color={colors.whiteAlpha[65]}
          style={styles.spinner}
          accessibilityLabel="Loading"
        />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.brand,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: { alignItems: 'center' },

  iconWrap: {
    width: 100,
    height: 100,
    borderRadius: radii.pill,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: space.xxl,
  },
  school: {
    color: colors.whiteAlpha[80],
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 3,
    marginBottom: space.sm,
  },
  title: {
    ...heading.xl,
    color: colors.white,
    fontSize: 42,
    textAlign: 'center',
    lineHeight: 48,
    marginBottom: space.md,
  },
  sub: {
    color: colors.whiteAlpha[80],
    fontSize: 15,
    marginBottom: space.xxxl,
  },
  spinner: { transform: [{ scale: 0.9 }] },
});
