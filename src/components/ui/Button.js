/**
 * Button — the only button in the app.
 *
 * Variants:
 *   primary   filled accent green — the main action on a screen
 *   secondary accent outline on white — a real but lesser action
 *   ghost     no border, accent text — tertiary / inline
 *   danger    error outline — destructive, offered alongside a safer option
 *   dangerSolid filled error — the confirming tap in a destructive dialog
 *   neutral   gray outline — "keep it" / dismiss
 *
 * `loading` swaps the label for a spinner and disables the press, so callers
 * never have to hand-roll the double-tap guard.
 */
import React from 'react';
import { Text, TouchableOpacity, ActivityIndicator, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import colors from '../../theme/colors';
import { radii, space, border, press, control } from '../../theme/layout';

export default function Button({
  label,
  onPress,
  variant = 'primary',
  size = 'md',
  icon,
  loading = false,
  disabled = false,
  fullWidth = false,
  style,
  accessibilityLabel,
}) {
  const isOff = disabled || loading;
  const small = size === 'sm';

  const filled = variant === 'primary' || variant === 'dangerSolid';
  const contentColor =
      filled                 ? colors.white
    : variant === 'danger'   ? colors.error
    : variant === 'neutral'  ? colors.gray600
    : colors.accent;
  const spinnerColor = filled ? colors.white : contentColor;

  return (
    <TouchableOpacity
      style={[
        styles.base,
        small ? styles.sizeSm : styles.sizeMd,
        styles[variant],
        fullWidth && styles.fullWidth,
        isOff && styles.off,
        style,
      ]}
      onPress={onPress}
      disabled={isOff}
      activeOpacity={press.opacity}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityState={{ disabled: isOff, busy: loading }}
    >
      {loading ? (
        <ActivityIndicator size="small" color={spinnerColor} />
      ) : (
        <View style={styles.content}>
          {icon ? (
            <Ionicons name={icon} size={small ? 15 : 17} color={contentColor} />
          ) : null}
          <Text
            style={[
              styles.label,
              small && styles.labelSm,
              { color: contentColor },
            ]}
            numberOfLines={1}
          >
            {label}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: radii.lg,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  sizeMd: { height: control.height,      paddingHorizontal: space.xl },
  sizeSm: { height: control.heightSmall, paddingHorizontal: space.lg, borderRadius: radii.md },

  fullWidth: { alignSelf: 'stretch' },

  content: { flexDirection: 'row', alignItems: 'center', gap: space.sm },

  primary: {
    backgroundColor: colors.accent,
  },
  secondary: {
    backgroundColor: colors.white,
    borderWidth: border.control,
    borderColor: colors.accent,
  },
  ghost: {
    backgroundColor: 'transparent',
  },
  danger: {
    backgroundColor: colors.white,
    borderWidth: border.control,
    borderColor: colors.error,
  },
  dangerSolid: {
    backgroundColor: colors.error,
  },
  neutral: {
    backgroundColor: colors.white,
    borderWidth: border.control,
    borderColor: colors.gray200,
  },

  off: { opacity: 0.5 },

  label:   { fontSize: 15, fontWeight: '700' },
  labelSm: { fontSize: 13 },
});
