/**
 * IconButton - an icon-only control that is actually reachable.
 *
 * Icon-only buttons need two things a bare <TouchableOpacity><Ionicons/> gives
 * you neither of: an accessibilityLabel (a screen reader otherwise announces
 * nothing) and a hit area at/above the 44pt minimum. Both are built in here,
 * and `label` is required.
 */
import React from 'react';
import { TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import colors from '../../theme/colors';
import { radii, space, press, hit } from '../../theme/layout';

export default function IconButton({
  icon,
  label,
  onPress,
  size = 20,
  color = colors.gray500,
  tinted = false,
  disabled = false,
  style,
}) {
  return (
    <TouchableOpacity
      style={[styles.btn, tinted && styles.tinted, disabled && styles.off, style]}
      onPress={onPress}
      disabled={disabled}
      activeOpacity={press.opacity}
      hitSlop={hit.slop}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled }}
    >
      <Ionicons name={icon} size={size} color={color} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  btn: {
    minWidth: 36,
    minHeight: 36,
    padding: space.sm,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radii.pill,
  },
  tinted: { backgroundColor: colors.gray100 },
  off:    { opacity: 0.4 },
});
