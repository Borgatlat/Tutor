/**
 * Celebration: a short confetti burst with a cheering Ollie, for good moments
 * (a session confirmed or marked done, a booking sent, a review left).
 *
 *   <Celebration visible={!!party} title="Session done!" subtitle="+0.8 service hours" onDone={() => setParty(null)} />
 *
 * `confettiOnly` skips the card, for screens that already show Ollie.
 *
 * Plays once (about 2 seconds), never blocks touches, and fires a success
 * haptic. With Reduce Motion on, the card fades in and out without confetti.
 */
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, StyleSheet, Animated, Easing, Platform, AccessibilityInfo } from 'react-native';
import colors from '../theme/colors';
import { radii, space } from '../theme/layout';
import { type } from '../theme/fonts';
import { sheetShadow } from '../theme/shadows';
import { success } from '../utils/haptics';
import { Mascot } from './ui';

const useNativeDriver = Platform.OS !== 'web';
const PIECES = 22;
const CONFETTI = [colors.gold, colors.brand, colors.maroon, colors.accentLight, colors.gold];
const DURATION = 2100;

export default function Celebration({ visible, title, subtitle, onDone, confettiOnly = false }) {
  const t = useRef(new Animated.Value(0)).current;
  const [reduce, setReduce] = useState(false);

  // Fixed, evenly spread directions with a little jitter, so it looks lively
  // but never lopsided.
  const pieces = useMemo(() => Array.from({ length: PIECES }, (_, i) => {
    const angle = (i / PIECES) * Math.PI * 2 + ((i * 37) % 10) / 20;
    const dist  = 110 + ((i * 53) % 70);
    return {
      dx: Math.cos(angle) * dist,
      dy: Math.sin(angle) * dist - 40,
      spin: (i % 2 ? 1 : -1) * (180 + ((i * 29) % 180)),
      color: CONFETTI[i % CONFETTI.length],
      w: i % 3 === 0 ? 10 : 7,
      h: i % 3 === 0 ? 5 : 11,
    };
  }), []);

  useEffect(() => {
    if (!visible) return undefined;
    let alive = true;
    success();
    AccessibilityInfo.isReduceMotionEnabled().catch(() => false).then((r) => alive && setReduce(!!r));
    t.setValue(0);
    const anim = Animated.timing(t, { toValue: 1, duration: DURATION, easing: Easing.linear, useNativeDriver });
    anim.start(({ finished }) => { if (finished && alive) onDone?.(); });
    return () => { alive = false; anim.stop(); };
  }, [visible]);

  if (!visible) return null;

  const card = {
    opacity: t.interpolate({ inputRange: [0, 0.08, 0.82, 1], outputRange: [0, 1, 1, 0] }),
    transform: [{
      scale: t.interpolate({ inputRange: [0, 0.1, 0.16, 1], outputRange: [0.7, 1.06, 1, 1] }),
    }],
  };

  return (
    <View style={styles.overlay} pointerEvents="none">
      {!reduce ? pieces.map((p, i) => (
        <Animated.View
          key={i}
          style={[styles.piece, {
            width: p.w, height: p.h, backgroundColor: p.color,
            opacity: t.interpolate({ inputRange: [0, 0.05, 0.7, 1], outputRange: [0, 1, 1, 0] }),
            transform: [
              { translateX: t.interpolate({ inputRange: [0, 0.35, 1], outputRange: [0, p.dx, p.dx * 1.15] }) },
              { translateY: t.interpolate({ inputRange: [0, 0.35, 1], outputRange: [0, p.dy, p.dy + 160] }) },
              { rotate: t.interpolate({ inputRange: [0, 1], outputRange: ['0deg', `${p.spin}deg`] }) },
            ],
          }]}
        />
      )) : null}

      {confettiOnly ? null : (
      <Animated.View
        style={[styles.card, card]}
        accessibilityLiveRegion="polite"
        accessibilityRole="alert"
      >
        <Mascot size={88} mood="happy" />
        <Text style={styles.title}>{title}</Text>
        {subtitle ? <Text style={styles.sub}>{subtitle}</Text> : null}
      </Animated.View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 200,
  },
  piece: { position: 'absolute', borderRadius: 2 },
  card: {
    alignItems: 'center',
    backgroundColor: colors.surface ?? colors.white,
    borderRadius: radii.xl,
    paddingVertical: space.xl,
    paddingHorizontal: space.xxl,
    minWidth: 220,
    ...sheetShadow,
  },
  title: { ...type.heading, color: colors.brandText ?? colors.brand, marginTop: space.sm, textAlign: 'center' },
  sub:   { ...type.small, color: colors.gray600, marginTop: 2, textAlign: 'center' },
});
