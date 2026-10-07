/**
 * ErrorBanner — the one submit-error treatment.
 *
 * Always render this at the TOP of a form, above the fields. Placing it next
 * to the submit button puts it off-screen on a long form, so the user never
 * sees why their submit failed.
 */
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import colors from '../../theme/colors';
import { radii, space } from '../../theme/layout';

export default function ErrorBanner({ message, style }) {
  if (!message) return null;

  return (
    <View style={[styles.banner, style]} accessibilityRole="alert">
      <Ionicons name="alert-circle" size={16} color={colors.white} />
      <Text style={styles.text}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
    backgroundColor: colors.error,
    borderRadius: radii.sm,
    padding: space.md,
    marginBottom: space.lg,
  },
  text: { flex: 1, color: colors.white, fontSize: 13, fontWeight: '600' },
});
