/**
 * FadeIn: content eases in (fade + a short rise) when it mounts, so data
 * arriving from the server settles into place instead of popping in.
 *
 *   <FadeIn>{content}</FadeIn>
 *   <FadeIn index={i}>{card}</FadeIn>   // staggered list items
 *
 * Stagger is capped so long lists never feel slow. With Reduce Motion on,
 * content appears immediately.
 */
import React, { useEffect, useRef } from 'react';
import { Animated, Easing, Platform, AccessibilityInfo } from 'react-native';

const useNativeDriver = Platform.OS !== 'web';
const STEP = 45;      // ms between list items
const MAX_DELAY = 270;

export default function FadeIn({ children, index = 0, delay = 0, style }) {
  const t = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    let anim;
    AccessibilityInfo.isReduceMotionEnabled()
      .catch(() => false)
      .then((reduce) => {
        if (reduce) { t.setValue(1); return; }
        anim = Animated.timing(t, {
          toValue: 1,
          duration: 280,
          delay: Math.min(delay + index * STEP, MAX_DELAY),
          easing: Easing.out(Easing.cubic),
          useNativeDriver,
        });
        anim.start();
      });
    return () => anim?.stop();
  }, []);

  return (
    <Animated.View
      style={[style, {
        opacity: t,
        transform: [{ translateY: t.interpolate({ inputRange: [0, 1], outputRange: [8, 0] }) }],
      }]}
    >
      {children}
    </Animated.View>
  );
}
