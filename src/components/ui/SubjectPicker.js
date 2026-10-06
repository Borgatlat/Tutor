/**
 * SubjectPicker — collapsible subject selector, shared by ProfileSetupScreen
 * and ProfileScreen so the picker looks and behaves identically in both.
 *
 * There are 9 categories (5 core + SAT + 3 AP groups), which is far too many
 * to render as one flat scroll. Sections start collapsed unless they contain
 * something already selected, so returning users land on their own subjects.
 *
 * Props
 *   selected       string[] | string | null       — chosen subject name(s)
 *   onToggle       (subject) => void
 *   grades         { [subject]: string } | null   — omit to hide grade inputs
 *   onGradeChange  (subject, value) => void
 *   allLabel       string                         — renders a leading "clear"
 *                  chip (search filter use); omit for the multi-select editor
 *   onSelectAll    () => void
 */
import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Chip from './Chip';
import AppTextInput from '../AppTextInput';
import colors from '../../theme/colors';
import { radii, space, border, press } from '../../theme/layout';
import { SUBJECT_CATEGORIES } from '../../constants';

export default function SubjectPicker({
  selected = [],
  onToggle,
  grades = null,
  onGradeChange,
  allLabel,
  onSelectAll,
}) {
  const categories = Object.keys(SUBJECT_CATEGORIES);

  // Accept a single string (filter mode) or an array (editor mode).
  const picked = Array.isArray(selected)
    ? selected
    : selected ? [selected] : [];

  // Expand a section on first render only if the user already has a pick in it.
  const [open, setOpen] = useState(() => {
    const initial = {};
    categories.forEach((c) => {
      initial[c] = SUBJECT_CATEGORIES[c].some((s) => picked.includes(s));
    });
    // Nothing selected yet → open the first category so the control doesn't
    // read as an inert list of headers.
    if (!Object.values(initial).some(Boolean)) initial[categories[0]] = true;
    return initial;
  });

  const countIn = (cat) =>
    SUBJECT_CATEGORIES[cat].filter((s) => picked.includes(s)).length;

  return (
    <View>
      {allLabel ? (
        <View style={styles.allRow}>
          <Chip
            label={allLabel}
            selected={picked.length === 0}
            onPress={onSelectAll}
          />
        </View>
      ) : null}

      {categories.map((cat) => {
        const isOpen = !!open[cat];
        const count  = countIn(cat);

        return (
          <View key={cat} style={styles.section}>
            <TouchableOpacity
              style={styles.header}
              onPress={() => setOpen((o) => ({ ...o, [cat]: !o[cat] }))}
              activeOpacity={press.opacity}
              accessibilityRole="button"
              accessibilityLabel={`${cat}, ${count} selected`}
              accessibilityState={{ expanded: isOpen }}
            >
              <Ionicons
                name={isOpen ? 'chevron-down' : 'chevron-forward'}
                size={16}
                color={colors.gray500}
              />
              <Text style={styles.headerText}>{cat}</Text>
              {count > 0 ? (
                <View style={styles.countPill}>
                  <Text style={styles.countText}>{count}</Text>
                </View>
              ) : null}
            </TouchableOpacity>

            {isOpen ? (
              <View style={styles.chipRow}>
                {SUBJECT_CATEGORIES[cat].map((subject) => (
                  <Chip
                    key={subject}
                    label={subject}
                    selected={picked.includes(subject)}
                    showCheck
                    onPress={() => onToggle(subject)}
                  />
                ))}
              </View>
            ) : null}
          </View>
        );
      })}

      {grades && picked.length > 0 ? (
        <View style={styles.gradeSection}>
          <Text style={styles.gradeHeading}>Your grade or score</Text>
          <Text style={styles.gradeHint}>
            Optional — shown on your profile so students know your strength in each subject.
          </Text>

          {picked.map((subject) => (
            <View key={subject} style={styles.gradeRow}>
              <Text style={styles.gradeLabel} numberOfLines={1}>{subject}</Text>
              <View style={styles.gradeBox}>
                <AppTextInput
                  style={styles.gradeInput}
                  placeholder="A / 5 / 1500"
                  placeholderTextColor={colors.gray400}
                  value={grades[subject] ?? ''}
                  onChangeText={(v) => onGradeChange?.(subject, v)}
                  maxLength={8}
                  autoCapitalize="characters"
                  autoCorrect={false}
                  accessibilityLabel={`Grade for ${subject}`}
                />
              </View>
            </View>
          ))}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  section: { marginBottom: space.sm },

  allRow: { flexDirection: 'row', marginBottom: space.sm },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
    paddingVertical: space.md,
    borderBottomWidth: border.hairline,
    borderBottomColor: colors.lineSoft,
  },
  headerText: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1.4,
    textTransform: 'uppercase',
    color: colors.gray700,
    flex: 1,
  },
  countPill: {
    minWidth: 22,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: radii.xs,
    backgroundColor: colors.brand,
    alignItems: 'center',
  },
  countText: { fontSize: 11, fontWeight: '700', color: colors.white },

  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: space.sm,
    paddingTop: space.md,
    paddingBottom: space.md,
  },

  gradeSection: {
    marginTop: space.lg,
    paddingTop: space.lg,
    borderTopWidth: border.hairline,
    borderTopColor: colors.line,
  },
  gradeHeading: { fontSize: 14, fontWeight: '700', color: colors.gray700 },
  gradeHint: {
    fontSize: 12, color: colors.gray500,
    marginTop: space.xs, marginBottom: space.md, lineHeight: 17,
  },
  gradeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    marginBottom: space.sm,
  },
  gradeLabel: { flex: 1, fontSize: 13, fontWeight: '600', color: colors.gray700 },
  gradeBox: {
    width: 104,
    borderWidth: border.control,
    borderColor: colors.line,
    borderRadius: radii.sm,
    backgroundColor: colors.white,
    paddingHorizontal: space.sm,
  },
  gradeInput: {
    flex: 1,
    fontSize: 14,
    color: colors.black,
    paddingVertical: space.sm,
    textAlign: 'center',
  },
});
