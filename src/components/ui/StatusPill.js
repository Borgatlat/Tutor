/**
 * StatusPill — renders a session status from SESSION_STATUS.
 *
 * Reads the `tint` defined alongside each status rather than appending an
 * alpha suffix to the hex string, which only worked for 6-digit hex values
 * and broke silently on any other color format.
 */
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import colors from '../../theme/colors';
import { radii, space } from '../../theme/layout';
import { SESSION_STATUS } from '../../constants';

const FALLBACK = { label: 'Unknown', color: colors.gray500, tint: colors.gray100 };

export default function StatusPill({ status, style }) {
  const s = SESSION_STATUS[status] ?? FALLBACK;

  return (
    <View style={[styles.pill, { backgroundColor: s.tint }, style]}>
      <Text style={[styles.text, { color: s.color }]}>{s.label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  pill: {
    paddingHorizontal: space.md,
    paddingVertical: space.xs,
    borderRadius: radii.pill,
    alignSelf: 'flex-start',
  },
  text: { fontSize: 11, fontWeight: '700', letterSpacing: 0.3 },
});
