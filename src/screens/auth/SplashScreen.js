import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Platform, ActivityIndicator } from 'react-native';
import { Mascot, OrganicBackdrop } from '../../components/ui';
import colors from '../../theme/colors';
import { radii, space, rule } from '../../theme/layout';
import { heading } from '../../theme/fonts';
import { school } from '../../theme/school';

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
      <OrganicBackdrop />
      <Animated.View style={[styles.content, { opacity, transform: [{ scale }] }]}>
        <Mascot size={132} onDark style={styles.mascot} />
        <Text style={styles.school}>{school.name.toUpperCase()}</Text>
        <View style={styles.rule} />
        <Text style={styles.title}>Tutor{'\n'}Marketplace</Text>
        <Text style={styles.sub}>{school.memberPlural} helping {school.memberPlural}</Text>

        {/* A real spinner — the old static dot read as a loading indicator but
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
    overflow: 'hidden',
    flex: 1,
    backgroundColor: colors.brand,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: { alignItems: 'center' },

  mascot: { marginBottom: space.lg },
  school: {
    color: colors.white,
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 3,
  },
  rule: {
    width: rule.width, height: rule.height, borderRadius: rule.radius,
    backgroundColor: colors.gold,
    marginTop: space.lg, marginBottom: space.lg,
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
