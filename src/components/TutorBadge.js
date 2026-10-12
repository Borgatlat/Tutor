/**
 * TutorBadge: one achievement pill (see utils/badges.js). Gold tint on light
 * surfaces; `onDark` for the green profile header.
 */
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import colors from '../theme/colors';
import { radii, space } from '../theme/layout';

export default function TutorBadge({ badge, onDark = false }) {
  const fg = onDark ? colors.white : colors.starText;
  return (
    <View
      style={[styles.pill, onDark && styles.pillDark]}
      accessible
      accessibilityLabel={`Badge: ${badge.label}`}
    >
      <Ionicons name={badge.icon} size={12} color={onDark ? colors.gold : colors.starText} />
      <Text style={[styles.text, { color: fg }]}>{badge.label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  pill: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 10, paddingVertical: 3,
    borderRadius: radii.pill,
    backgroundColor: colors.goldTint,
    alignSelf: 'flex-start',
  },
  pillDark: { backgroundColor: colors.whiteAlpha[12] },
  text: { fontSize: 12, fontWeight: '700' },
});
