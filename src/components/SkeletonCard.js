import React, { useEffect, useRef } from 'react';
import { View, Animated, StyleSheet, Platform } from 'react-native';
import colors from '../theme/colors';
import { radii, space } from '../theme/layout';
import { cardShadow } from '../theme/shadows';

// Web can't use the native driver for opacity animations.
const useNativeDriver = Platform.OS !== 'web';

function Shimmer({ style }) {
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(anim, { toValue: 1, duration: 900, useNativeDriver }),
        Animated.timing(anim, { toValue: 0, duration: 900, useNativeDriver }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, []);

  const opacity = anim.interpolate({ inputRange: [0, 1], outputRange: [0.4, 0.9] });
  return <Animated.View style={[style, { opacity, backgroundColor: colors.gray200 }]} />;
}

// Geometry here must match TutorCard exactly (radius, padding, margin, shadow,
// avatar size) - otherwise the card visibly jumps when real data arrives.
export default function SkeletonCard() {
  return (
    <View style={styles.card} accessibilityLabel="Loading tutor">
      <View style={styles.top}>
        <Shimmer style={styles.avatar} />
        <View style={styles.lines}>
          <Shimmer style={styles.line1} />
          <Shimmer style={styles.line2} />
        </View>
      </View>
      <View style={styles.badgeRow}>
        <Shimmer style={styles.badge} />
        <Shimmer style={styles.badge} />
      </View>
      <Shimmer style={styles.bio} />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.white,
    borderRadius: radii.lg,
    padding: space.lg,
    marginBottom: space.md,
    ...cardShadow,
  },
  top:    { flexDirection: 'row', alignItems: 'center', marginBottom: space.md },
  avatar: { width: 52, height: 52, borderRadius: radii.pill, marginRight: space.md },
  lines:  { flex: 1, gap: space.sm },
  line1:  { height: 14, borderRadius: radii.sm, width: '60%' },
  line2:  { height: 11, borderRadius: radii.sm, width: '40%' },
  badgeRow: { flexDirection: 'row', gap: space.sm, marginBottom: space.sm },
  badge:  { height: 24, width: 80, borderRadius: radii.pill },
  bio:    { height: 11, borderRadius: radii.sm, width: '90%' },
});
