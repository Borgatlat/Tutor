/**
 * RoleSelector: the student / tutor / both picker.
 *
 * Shared by SignUpScreen, ProfileSetupScreen and ProfileScreen. A single pill
 * switch (the same shape as the Sessions tabs) with a one-line description of
 * the chosen role underneath, instead of three tall cards.
 */
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import colors from '../../theme/colors';
import { radii, space, press } from '../../theme/layout';
import { label, type } from '../../theme/fonts';
import { cardShadow } from '../../theme/shadows';
import { ROLES } from '../../constants';
import { select } from '../../utils/haptics';

export default function RoleSelector({ value, onChange, style }) {
  const current = ROLES.find((r) => r.key === value);

  return (
    <View style={style}>
      <View style={styles.track} accessibilityRole="radiogroup">
        {ROLES.map((r) => {
          const active = value === r.key;

          return (
            <TouchableOpacity
              key={r.key}
              style={[styles.option, active && styles.optionActive]}
              onPress={() => { select(); onChange(r.key); }}
              activeOpacity={press.opacity}
              accessibilityRole="radio"
              accessibilityLabel={`${r.label}: ${r.description}`}
              accessibilityState={{ checked: active, selected: active }}
              aria-checked={active}
            >
              <Text style={[styles.label, active && styles.labelActive]}>{r.label}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {current ? <Text style={styles.desc}>{current.description}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    flexDirection: 'row',
    backgroundColor: colors.cream,
    borderRadius: radii.pill,
    padding: space.xs,
  },
  option: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: space.md,
    borderRadius: radii.pill,
  },
  optionActive: { backgroundColor: colors.surface, ...cardShadow },

  label:       { ...label.ui, fontSize: 14, color: colors.gray500 },
  labelActive: { color: colors.brandText, fontWeight: '700' },

  desc: { ...type.small, color: colors.gray500, textAlign: 'center', marginTop: space.sm },
});
