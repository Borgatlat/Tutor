/**
 * AvailabilityGrid: the B1–B8 + CT block picker.
 *
 * Block schedule: no day dimension. Renders one Chip per block so the same
 * block looks identical here, in profile setup, and in the booking flow.
 *
 * Props
 *  availability  – array of { period }, the blocks that are free
 *  onToggle      – (block) => void: makes every chip toggleable (edit mode)
 *  highlightSlot – { period } | null, marks one chip as chosen
 *  onSelectSlot  – (null, period) => void: free chips become selectable
 *  emptyLabel    – shown instead of the grid when nothing is free and the grid
 *                  is not editable, so "no blocks" doesn't look like a bug
 *
 * Outside edit mode only the free blocks are drawn.
 */
import React from 'react';
import { View, StyleSheet } from 'react-native';
import Chip from './ui/Chip';
import EmptyState from './ui/EmptyState';
import { space } from '../theme/layout';
import { BLOCKS } from '../constants';
import { blockLabel, blockName } from '../utils/schedule';

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

  // Not editable and nothing free → say so rather than rendering 8 inert chips.
  if (!editable && availability.length === 0) {
    return <EmptyState icon="time-outline" title={emptyLabel} compact />;
  }

  // Only the edit view needs every block; elsewhere show just the free ones,
  // so the row isn't mostly greyed-out chips.
  const blocks = editable ? BLOCKS : BLOCKS.filter(isFree);

  return (
    <View style={styles.row}>
      {blocks.map((b) => {
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
            label={blockLabel(b)}
            minWidth={52}
            onPress={onPress}
            selected={hi || (editable && free)}
            available={!editable && free}
            disabled={!onPress}
            accessibilityLabel={`${blockName(b)}${free ? ', free' : ', not free'}`}
          />
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm, marginTop: space.xs },
});
