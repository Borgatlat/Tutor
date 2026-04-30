import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import colors from '../theme/colors';
import { DAYS, PERIODS } from '../constants';

/**
 * AvailabilityGrid
 *
 * Props:
 *  availability  – array of { day, period } objects currently free
 *  onToggle      – (day, period) => void  — if provided, grid is editable
 *  highlightSlot – { day, period } | null — highlights one slot (for booking)
 *  onSelectSlot  – (day, period) => void  — called when a free cell is tapped in read-only mode
 */
export default function AvailabilityGrid({
  availability = [],
  onToggle,
  highlightSlot,
  onSelectSlot,
}) {
  const isFree = (day, period) =>
    availability.some((a) => a.day === day && a.period === period);

  const isHighlighted = (day, period) =>
    highlightSlot?.day === day && highlightSlot?.period === period;

  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
      <View>
        {/* Day headers */}
        <View style={styles.headerRow}>
          <View style={styles.periodLabel} />
          {DAYS.map((d) => (
            <View key={d} style={styles.dayHeader}>
              <Text style={styles.dayText}>{d}</Text>
            </View>
          ))}
        </View>

        {/* Period rows */}
        {PERIODS.map((p) => (
          <View key={p} style={styles.row}>
            <View style={styles.periodLabel}>
              <Text style={styles.periodText}>P{p}</Text>
            </View>
            {DAYS.map((d) => {
              const free  = isFree(d, p);
              const hi    = isHighlighted(d, p);
              const editable = !!onToggle;

              const cellStyle = [
                styles.cell,
                free && styles.cellFree,
                hi   && styles.cellHighlight,
              ];

              if (editable) {
                return (
                  <TouchableOpacity
                    key={d}
                    style={cellStyle}
                    onPress={() => onToggle(d, p)}
                    activeOpacity={0.7}
                  >
                    {free && <Text style={styles.checkmark}>✓</Text>}
                  </TouchableOpacity>
                );
              }

              // Read-only: only free cells are tappable (to select a slot)
              return (
                <TouchableOpacity
                  key={d}
                  style={cellStyle}
                  onPress={free && onSelectSlot ? () => onSelectSlot(d, p) : undefined}
                  activeOpacity={free && onSelectSlot ? 0.7 : 1}
                >
                  {hi && <Text style={styles.checkmarkHi}>✓</Text>}
                </TouchableOpacity>
              );
            })}
          </View>
        ))}

        {/* Legend */}
        <View style={styles.legend}>
          <View style={[styles.legendDot, { backgroundColor: colors.greenMuted, borderColor: colors.green }]} />
          <Text style={styles.legendText}>Free</Text>
          <View style={[styles.legendDot, { backgroundColor: colors.gray100, borderColor: colors.gray200, marginLeft: 12 }]} />
          <Text style={styles.legendText}>Unavailable</Text>
        </View>
      </View>
    </ScrollView>
  );
}

const CELL_SIZE = 46;

const styles = StyleSheet.create({
  headerRow: { flexDirection: 'row', marginBottom: 4 },
  periodLabel: {
    width: 34,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayHeader: {
    width: CELL_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 2,
    paddingVertical: 4,
  },
  dayText: { fontSize: 12, fontWeight: '700', color: colors.gray500 },

  row: { flexDirection: 'row', marginBottom: 4 },
  periodText: { fontSize: 11, fontWeight: '700', color: colors.gray500 },

  cell: {
    width: CELL_SIZE,
    height: CELL_SIZE,
    borderRadius: 10,
    marginHorizontal: 2,
    backgroundColor: colors.gray100,
    borderWidth: 1.5,
    borderColor: colors.gray200,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cellFree: {
    backgroundColor: colors.greenMuted,
    borderColor: colors.green,
  },
  cellHighlight: {
    backgroundColor: colors.green,
    borderColor: colors.greenDark,
  },
  checkmark:   { fontSize: 16, color: colors.green, fontWeight: '700' },
  checkmarkHi: { fontSize: 16, color: colors.white, fontWeight: '700' },

  legend: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
    paddingLeft: 36,
  },
  legendDot: {
    width: 14,
    height: 14,
    borderRadius: 4,
    borderWidth: 1.5,
    marginRight: 5,
  },
  legendText: { fontSize: 12, color: colors.gray500, marginRight: 4 },
});
