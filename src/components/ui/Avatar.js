/**
 * Avatar — photo with an initials fallback.
 *
 * The "image, or a colored circle with up to two initials" block was written
 * out five separate times with four different sizes and two different fallback
 * colors. This is that block, once.
 */
import React from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';
import colors from '../../theme/colors';
import { radii } from '../../theme/layout';

export function initialsOf(name) {
  if (!name) return '?';
  const parts = String(name).trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return '?';
  return parts.map((w) => w[0]).slice(0, 2).join('').toUpperCase();
}

export default function Avatar({
  uri,
  name,
  size = 48,
  color = colors.brand,
  style,
}) {
  const round = { width: size, height: size, borderRadius: radii.pill };

  if (uri) {
    return (
      <Image
        source={{ uri }}
        style={[round, style]}
        accessibilityLabel={name ? `${name}'s photo` : 'Profile photo'}
      />
    );
  }

  return (
    <View style={[round, styles.fallback, { backgroundColor: color }, style]}>
      <Text style={[styles.initials, { fontSize: Math.round(size * 0.36) }]}>
        {initialsOf(name)}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  fallback: { alignItems: 'center', justifyContent: 'center' },
  initials: { color: colors.white, fontWeight: '800' },
});
