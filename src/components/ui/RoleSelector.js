/**
 * RoleSelector — the student / tutor / both picker.
 *
 * Shared by SignUpScreen and ProfileSetupScreen. The old ProfileSetup version
 * used a pink (#FFF5F5) active background left over from the pre-rebrand red
 * palette, which clashed with its green active border; there is now one
 * treatment for both screens.
 */
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import colors from '../../theme/colors';
import { radii, space, border, press } from '../../theme/layout';
import { ROLES } from '../../constants';

export default function RoleSelector({ value, onChange, style }) {
  return (
    <View style={[styles.row, style]}>
      {ROLES.map((r) => {
        const active = value === r.key;

        return (
          <TouchableOpacity
            key={r.key}
            style={[styles.card, active && styles.cardActive]}
            onPress={() => onChange(r.key)}
            activeOpacity={press.opacity}
            accessibilityRole="radio"
            accessibilityLabel={`${r.label} — ${r.description}`}
            accessibilityState={{ selected: active }}
          >
            <View style={[styles.icon, active && styles.iconActive]}>
              <Ionicons
                name={r.icon}
                size={20}
                color={active ? colors.white : colors.gray500}
              />
            </View>
            <Text style={[styles.label, active && styles.labelActive]}>{r.label}</Text>
            <Text style={[styles.desc, active && styles.descActive]}>{r.description}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: space.sm },

  card: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: space.lg,
    paddingHorizontal: space.sm,
    borderRadius: radii.sm,
    borderWidth: border.control,
    borderColor: colors.line,
    backgroundColor: colors.white,
  },
  cardActive: {
    borderColor: colors.brand,
    backgroundColor: colors.brandTint,
    // Gold marker on the chosen option, echoing the active tab.
    borderTopWidth: border.rule,
    borderTopColor: colors.gold,
    paddingTop: space.lg - 2,
  },

  icon: {
    width: 40, height: 40, borderRadius: radii.pill,
    backgroundColor: colors.gray100,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: space.sm,
  },
  iconActive: { backgroundColor: colors.brand },

  label:       { fontSize: 11, fontWeight: '700', letterSpacing: 1.4, textTransform: 'uppercase', color: colors.gray700 },
  labelActive: { color: colors.brand },
  desc: {
    fontSize: 10, color: colors.gray500,
    textAlign: 'center', marginTop: 2, lineHeight: 14,
  },
  descActive: { color: colors.brand },
});
