import React, { useEffect, useRef } from 'react';
import { View, Animated, StyleSheet, Platform } from 'react-native';
import colors from '../theme/colors';

// expo-calendar lazy-loads; web can't use native driver for opacity animations
const useNativeDriver = Platform.OS !== 'web';

function Shimmer({ style }) {
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(anim, { toValue: 1, duration: 900, useNativeDriver }),
        Animated.timing(anim, { toValue: 0, duration: 900, useNativeDriver }),
      ])
    ).start();
  }, []);

  const opacity = anim.interpolate({ inputRange: [0, 1], outputRange: [0.4, 0.9] });
  return <Animated.View style={[style, { opacity, backgroundColor: colors.gray200 }]} />;
}

export default function SkeletonCard() {
  return (
    <View style={styles.card}>
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
    borderRadius: 18,
    padding: 18,
    marginBottom: 14,
  },
  top:    { flexDirection: 'row', alignItems: 'center', marginBottom: 14 },
  avatar: { width: 52, height: 52, borderRadius: 26, marginRight: 12 },
  lines:  { flex: 1, gap: 8 },
  line1:  { height: 14, borderRadius: 7, width: '60%' },
  line2:  { height: 11, borderRadius: 6, width: '40%' },
  badgeRow: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  badge:  { height: 24, width: 80, borderRadius: 12 },
  bio:    { height: 11, borderRadius: 6, width: '90%' },
});
