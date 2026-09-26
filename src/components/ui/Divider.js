/**
 * Divider — a rule, optionally with centered text ("or", "New here?").
 */
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import colors from '../../theme/colors';
import { space } from '../../theme/layout';

export default function Divider({ label, style }) {
  if (!label) return <View style={[styles.plain, style]} />;

  return (
    <View style={[styles.row, style]}>
      <View style={styles.line} />
      <Text style={styles.label}>{label}</Text>
      <View style={styles.line} />
    </View>
  );
}

const styles = StyleSheet.create({
  plain: {
    height: 1,
    backgroundColor: colors.gray200,
    marginVertical: space.xl,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    marginVertical: space.xl,
  },
  line:  { flex: 1, height: 1, backgroundColor: colors.gray200 },
  label: { fontSize: 13, color: colors.gray400 },
});
