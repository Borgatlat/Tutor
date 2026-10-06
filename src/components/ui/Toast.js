/**
 * Toast - the one transient-confirmation treatment.
 *
 * Use for "it worked" moments that have no screen of their own: account
 * created, signed in, session booked. Rendered once at the App root (see
 * App.js), driven by useToastStore from anywhere.
 *
 * For errors that belong to a form, keep using ErrorBanner - it sits next to
 * the fields and doesn't time out.
 */
import React, { useEffect, useRef } from 'react';
import { Animated, Platform, StatusBar, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import colors from '../../theme/colors';
import { radii, space } from '../../theme/layout';
import useToastStore from '../../store/useToastStore';

// StatusBar.currentHeight is Android-only; iOS/web get a fixed inset so this
// clears the notch without needing a SafeAreaProvider above it.
const TOP_OFFSET = Platform.select({
  android: (StatusBar.currentHeight ?? 24) + space.sm,
  default: space.huge,
});

const VARIANTS = {
  success: { bg: colors.accent, icon: 'checkmark-circle' },
  error:   { bg: colors.error,  icon: 'alert-circle' },
  info:    { bg: colors.brand,  icon: 'information-circle' },
};

export default function Toast() {
  const message = useToastStore((s) => s.message);
  const variant = useToastStore((s) => s.variant);
  const visible = useToastStore((s) => s.visible);

  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(anim, {
      toValue: visible ? 1 : 0,
      duration: visible ? 220 : 180,
      useNativeDriver: true,
    }).start();
  }, [visible, anim]);

  if (!message) return null;

  const v = VARIANTS[variant] ?? VARIANTS.success;

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        styles.wrap,
        {
          opacity: anim,
          transform: [{
            translateY: anim.interpolate({
              inputRange:  [0, 1],
              outputRange: [-16, 0],
            }),
          }],
        },
      ]}
    >
      <View
        style={[styles.toast, { backgroundColor: v.bg }]}
        accessibilityRole="alert"
        accessibilityLiveRegion="polite"
      >
        <Ionicons name={v.icon} size={18} color={colors.white} />
        <Text style={styles.text} numberOfLines={2}>{message}</Text>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    top: TOP_OFFSET,
    left: space.lg,
    right: space.lg,
    alignItems: 'center',
    zIndex: 9999,
    elevation: 12,
  },
  toast: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
    maxWidth: 420,
    paddingVertical: space.md,
    paddingHorizontal: space.lg,
    borderRadius: radii.lg,
    shadowColor: '#000',
    shadowOpacity: 0.18,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
  },
  text: {
    flexShrink: 1,
    color: colors.white,
    fontSize: 13,
    fontWeight: '700',
  },
});
