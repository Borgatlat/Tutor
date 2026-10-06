/**
 * Chip - one pill primitive for every selectable token in the app:
 * availability blocks (B1–B8), subject picker entries, report reasons.
 *
 * States:
 *   idle       not selected, tappable
 *   available  highlighted as "free"/eligible but not chosen (accent outline)
 *   selected   chosen (solid accent)
 *   disabled   visibly inert - dimmed, no press feedback
 */
import React from 'react';
import { Text, TouchableOpacity, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import colors from '../../theme/colors';
import { radii, space, border, press, hit } from '../../theme/layout';

export default function Chip({
  label,
  onPress,
  selected = false,
  available = false,
  disabled = false,
  showCheck = false,
  minWidth,
  style,
  accessibilityLabel,
}) {
  const interactive = !!onPress && !disabled;
  const textColor =
      selected   ? colors.white
    : disabled   ? colors.gray400
    : available  ? colors.accentDark
    : colors.gray600;

  return (
    <TouchableOpacity
      style={[
        styles.chip,
        available && styles.available,
        selected  && styles.selected,
        disabled  && styles.disabled,
        minWidth != null && { minWidth, justifyContent: 'center' },
        style,
      ]}
      onPress={interactive ? onPress : undefined}
      disabled={!interactive}
      activeOpacity={interactive ? press.opacity : 1}
      hitSlop={hit.slop}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityState={{ selected, disabled: !interactive }}
    >
      <View style={styles.inner}>
        <Text style={[styles.label, { color: textColor }]}>{label}</Text>
        {showCheck && selected ? (
          <Ionicons name="checkmark" size={14} color={colors.white} />
        ) : null}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  chip: {
    paddingHorizontal: space.md,
    paddingVertical: space.sm,
    borderRadius: radii.pill,
    borderWidth: border.control,
    borderColor: colors.gray200,
    backgroundColor: colors.white,
    alignItems: 'center',
  },
  available: {
    borderColor: colors.accent,
    backgroundColor: colors.accentTint,
  },
  selected: {
    borderColor: colors.accent,
    backgroundColor: colors.accent,
  },
  disabled: {
    borderColor: colors.gray200,
    backgroundColor: colors.gray100,
  },

  inner: { flexDirection: 'row', alignItems: 'center', gap: space.xs },
  label: { fontSize: 13, fontWeight: '600' },
});
