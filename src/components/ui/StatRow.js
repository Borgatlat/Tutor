/**
 * StatRow — the "At a glance" strip from the school website: a stone rule,
 * then big green numbers over small tracked captions, in equal columns.
 *
 *   <StatRow stats={[{ value: '24', label: 'Sessions' }, …]} />
 *
 * `title` renders a centered caps eyebrow above the rule.
 */
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import colors from '../../theme/colors';
import { space } from '../../theme/layout';
import { heading, label } from '../../theme/fonts';

export default function StatRow({ stats = [], title, size = 'md', style }) {
  const big = size === 'lg';

  return (
    <View style={style}>
      {title ? <Text style={styles.title}>{title}</Text> : null}
      <View style={styles.rule} />
      <View style={styles.row}>
        {stats.map((s) => (
          <View
            key={s.label}
            style={styles.cell}
            accessible
            accessibilityLabel={`${s.value} ${s.label}`}
          >
            <Text style={[styles.value, big && styles.valueLg]} numberOfLines={1}>
              {s.value}
            </Text>
            <Text style={styles.label} numberOfLines={2}>{s.label}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  title: {
    ...label.caps,
    fontSize: 10,
    letterSpacing: 2.4,
    color: colors.gray500,
    textAlign: 'center',
    marginBottom: space.md,
  },
  rule: { height: 3, backgroundColor: colors.line, marginBottom: space.lg },
  row:  { flexDirection: 'row' },
  cell: { flex: 1, alignItems: 'center', paddingHorizontal: space.xs },
  value: {
    ...heading.xl,
    fontSize: 28,
    lineHeight: 34,
    color: colors.brand,
  },
  valueLg: { fontSize: 40, lineHeight: 48 },
  label: {
    ...label.caps,
    fontWeight: '500',
    fontSize: 9,
    letterSpacing: 1.6,
    color: colors.gray500,
    textAlign: 'center',
    marginTop: space.xs,
  },
});
