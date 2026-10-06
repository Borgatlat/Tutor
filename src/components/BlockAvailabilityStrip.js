/**
 * BlockAvailabilityStrip - live tutor coverage across Strake's eight blocks.
 *
 * This replaces the vertical list of icon-circle feature bullets that used to
 * fill the auth hero. Those bullets are the single most generic thing an app
 * can show; this is the opposite. It is real data, it is specific to this
 * school's schedule, and no template could produce it, because producing it
 * requires knowing that Strake runs B1 through B8.
 *
 * Renders its own skeleton while loading and simply says the app is new when
 * nobody has signed up yet - it never shows a misleading zero state as if
 * something had failed.
 */
import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { fetchBlockAvailability } from '../lib/supabase';
import { BLOCKS } from '../constants';
import colors from '../theme/colors';
import { radii, space, border } from '../theme/layout';
import { label as labelFont } from '../theme/fonts';

export default function BlockAvailabilityStrip({ style }) {
  const [counts, setCounts]   = useState(null);
  const [failed, setFailed]   = useState(false);

  useEffect(() => {
    let alive = true;
    fetchBlockAvailability()
      .then((c) => { if (alive) setCounts(c); })
      .catch(()  => { if (alive) setFailed(true); });
    return () => { alive = false; };
  }, []);

  // Say nothing rather than something wrong if the query failed.
  if (failed) return null;

  const loading = counts === null;

  // The block with the most cover - the one worth calling out underneath.
  const bestBlock = loading
    ? null
    : Object.entries(counts).sort((a, b) => b[1] - a[1])[0] ?? null;

  return (
    <View style={[styles.wrap, style]}>
      <Text style={styles.heading}>Tutors free by block</Text>

      <View style={styles.row}>
        {BLOCKS.map((b) => {
          const n      = loading ? 0 : (counts[b] ?? 0);
          const active = n > 0;
          return (
            <View
              key={b}
              style={[styles.cell, active && styles.cellActive, loading && styles.cellLoading]}
              accessible
              accessibilityLabel={
                loading ? `Block ${b}, loading`
                        : `Block ${b}, ${n} tutor${n === 1 ? '' : 's'} free`
              }
            >
              <Text style={[styles.blockLabel, active && styles.blockLabelActive]}>B{b}</Text>
              <Text style={[styles.count, active && styles.countActive]}>
                {loading ? '·' : n}
              </Text>
            </View>
          );
        })}
      </View>

      <Text style={styles.caption}>
        {loading
          ? 'Checking who is free…'
          : bestBlock
            ? `${bestBlock[1]} Crusader${bestBlock[1] === 1 ? '' : 's'} free during B${bestBlock[0]}`
            : 'Be the first Crusader to tutor a block'}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginTop: space.xxxl },

  heading: {
    ...labelFont.caps,
    fontSize: 10,
    color: colors.whiteAlpha[65],
    marginBottom: space.md,
  },

  row: { flexDirection: 'row', gap: space.xs, flexWrap: 'wrap' },

  cell: {
    minWidth: 42,
    paddingVertical: space.sm,
    paddingHorizontal: space.xs,
    borderRadius: radii.sm,
    borderWidth: border.hairline,
    borderColor: colors.whiteAlpha[18],
    backgroundColor: colors.whiteAlpha[12],
    alignItems: 'center',
  },
  cellActive: {
    backgroundColor: colors.accent,
    borderColor: colors.accentLight,
  },
  cellLoading: { opacity: 0.5 },

  blockLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.whiteAlpha[65],
    letterSpacing: 0.4,
  },
  blockLabelActive: { color: colors.whiteAlpha[80] },

  count: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.whiteAlpha[80],
    marginTop: 1,
  },
  countActive: { color: colors.white },

  caption: {
    fontSize: 12,
    color: colors.whiteAlpha[65],
    marginTop: space.md,
  },
});
