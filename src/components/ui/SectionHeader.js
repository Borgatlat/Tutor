/**
 * SectionHeader — title on the left, optional action link on the right.
 *
 * Replaces the several hand-rolled "row with a title and a See all" headers
 * that each had their own font size and margin.
 *
 * `ruled` adds the short gold rule above the title, for the main section on a
 * screen (the school site's "Take the Next Steps" treatment).
 */
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import colors from '../../theme/colors';
import { space, press, hit, rule } from '../../theme/layout';
import { heading, label } from '../../theme/fonts';

export default function SectionHeader({ title, actionLabel, onAction, ruled = false, style }) {
  return (
    <View style={[styles.row, style]}>
      <View style={styles.titleWrap}>
        {ruled ? <View style={styles.rule} /> : null}
        <Text style={styles.title}>{title}</Text>
      </View>

      {actionLabel && onAction ? (
        <TouchableOpacity
          style={styles.action}
          onPress={onAction}
          activeOpacity={press.opacity}
          hitSlop={hit.slop}
          accessibilityRole="button"
          accessibilityLabel={actionLabel}
        >
          <Text style={styles.actionText}>{actionLabel}</Text>
          <Ionicons name="chevron-forward" size={13} color={colors.brand} />
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    marginBottom: space.md,
  },
  titleWrap: { flexShrink: 1 },
  rule: {
    width: rule.width, height: rule.height,
    backgroundColor: colors.gold,
    marginBottom: space.sm,
  },
  title: {
    ...heading.lg,
    fontSize: 18,
    color: colors.black,
  },
  action: { flexDirection: 'row', alignItems: 'center', gap: 2, paddingBottom: 2 },
  actionText: { ...label.caps, fontSize: 11, letterSpacing: 1.6, color: colors.brand },
});
