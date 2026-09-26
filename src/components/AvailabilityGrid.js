/**
 * AvailabilityGrid — the B1–B8 block picker.
 *
 * Block schedule: no day dimension. Renders one Chip per block so the same
 * block looks identical here, in profile setup, and in the booking flow.
 *
 * Props
 *  availability  – array of { period } — the blocks that are free
 *  onToggle      – (block) => void — makes every chip toggleable (edit mode)
 *  highlightSlot – { period } | null — marks one chip as chosen
 *  onSelectSlot  – (null, period) => void — free chips become selectable
 *  emptyLabel    – shown instead of the grid when nothing is free and the grid
 *                  is read-only, so "no blocks" doesn't look like a bug
 */
import React from 'react';
import { View, StyleSheet } from 'react-native';
import Chip from './ui/Chip';
import EmptyState from './ui/EmptyState';
import { space } from '../theme/layout';
import { BLOCKS } from '../constants';

export default function AvailabilityGrid({
  availability = [],
  onToggle,
  highlightSlot,
  onSelectSlot,
  emptyLabel = 'No free blocks set yet',
}) {
  const isFree        = (b) => availability.some((a) => a.period === b);
  const isHighlighted = (b) => highlightSlot?.period === b;

  const editable = !!onToggle;

  // Read-only and nothing free → say so rather than rendering 8 inert chips.
  if (!editable && !onSelectSlot && availability.length === 0) {
    return <EmptyState icon="time-outline" title={emptyLabel} compact />;
  }

  return (
    <View style={styles.row}>
      {BLOCKS.map((b) => {
        const free = isFree(b);
        const hi   = isHighlighted(b);

        const onPress = editable
          ? () => onToggle(b)
          : free && onSelectSlot
            ? () => onSelectSlot(null, b)
            : undefined;

        return (
          <Chip
            key={b}
            label={`B${b}`}
            minWidth={52}
            onPress={onPress}
            selected={hi || (editable && free)}
            available={!editable && free}
            disabled={!onPress}
            accessibilityLabel={`Block ${b}${free ? ', free' : ', not free'}`}
          />
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm, marginTop: space.xs },
});
