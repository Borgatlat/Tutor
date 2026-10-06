/**
 * Wordmark - the app's own mark.
 *
 * Replaces the Ionicons "school" mortarboard, which is the default icon every
 * generated school app reaches for. This is a monogram lockup instead: a
 * rounded square (not a circle - icon-in-a-circle is the same generic pattern),
 * the SJ monogram set in the heading serif, and a rule that echoes a crest
 * without copying the school's actual one.
 *
 * Deliberately not the Strake Jesuit crest: that is the school's property, and
 * an original mark avoids needing anyone's permission.
 */
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import colors from '../../theme/colors';
import { radii, space } from '../../theme/layout';
import { heading, label } from '../../theme/fonts';

export default function Wordmark({ compact = false, onBrand = true, style }) {
  const size = compact ? 44 : 54;
  const mono = compact ? 19 : 23;

  return (
    <View style={[styles.wrap, style]}>
      <View
        style={[
          styles.badge,
          { width: size, height: size },
          onBrand ? styles.badgeOnBrand : styles.badgeOnLight,
        ]}
        accessible
        accessibilityRole="image"
        accessibilityLabel="Strake Jesuit Tutors"
      >
        <Text style={[styles.mono, { fontSize: mono }]}>SJ</Text>
        <View style={styles.rule} />
      </View>

      <View style={styles.lockup}>
        <Text style={[styles.school, !onBrand && styles.schoolOnLight]}>STRAKE JESUIT</Text>
        <Text style={[styles.product, !onBrand && styles.productOnLight]}>Tutors</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flexDirection: 'row', alignItems: 'center', gap: space.md },

  badge: {
    borderRadius: radii.md,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 2,
  },
  badgeOnBrand: { backgroundColor: colors.accent },
  badgeOnLight: { backgroundColor: colors.brand },

  mono: {
    ...heading.lg,
    color: colors.white,
    letterSpacing: 0.5,
    lineHeight: undefined,
  },
  // The rule under the monogram is what makes it read as a mark rather than
  // two letters in a box.
  rule: {
    width: 20,
    height: 2,
    borderRadius: 1,
    backgroundColor: colors.whiteAlpha[65],
    marginTop: 3,
  },

  lockup: { gap: 1 },
  school: {
    ...label.caps,
    fontSize: 10,
    color: colors.whiteAlpha[65],
  },
  schoolOnLight: { color: colors.gray500 },
  product: {
    ...heading.md,
    fontSize: 17,
    color: colors.white,
  },
  productOnLight: { color: colors.brand },
});
