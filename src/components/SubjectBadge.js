import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import colors from '../theme/colors';
import { radii, space, border } from '../theme/layout';

// Badges are colored by department, not by difficulty - 'Algebra 2' and
// 'AP Calculus BC' read as the same subject family at a glance. All five
// families are green- or neutral-derived so nothing competes with the brand.
const s = colors.subject;

const DEPARTMENTS = [
  {
    bg: s.mathBg, text: s.mathText,
    match: ['Algebra', 'Geometry', 'Precalculus', 'Calculus', 'Statistics',
            'Computer Science', 'SAT Math'],
  },
  {
    bg: s.scienceBg, text: s.scienceText,
    match: ['Biology', 'Chemistry', 'Physics', 'Anatomy', 'Environmental'],
  },
  // Languages must come BEFORE English: 'AP Spanish Language' contains
  // "Language", so an English-first order would mis-file every language AP.
  {
    bg: s.langBg, text: s.langText,
    match: ['Spanish', 'Latin', 'French'],
  },
  {
    bg: s.englishBg, text: s.englishText,
    match: ['English', 'Literature', 'Language'],
  },
  {
    bg: s.socialBg, text: s.socialText,
    match: ['History', 'Government', 'Economics', 'Geography'],
  },
];

// `subject` can be null when a session row is missing its join, so coerce
// before matching rather than letting .includes() throw.
const getSubjectColors = (subject) => {
  const name = typeof subject === 'string' ? subject : '';
  const dept = DEPARTMENTS.find((d) => d.match.some((m) => name.includes(m)));
  return dept ?? { bg: colors.gray100, text: colors.gray600 };
};

export default function SubjectBadge({ subject, grade, small = false }) {
  const c = getSubjectColors(subject);

  return (
    <View style={[styles.badge, { backgroundColor: c.bg }, small && styles.small]}>
      <Text style={[styles.text, { color: c.text }, small && styles.smallText]}>
        {subject || 'Subject'}
      </Text>
      {grade ? (
        <View style={[styles.gradePill, { borderColor: c.text }]}>
          <Text style={[styles.gradeText, { color: c.text }]}>{grade}</Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: space.md,
    paddingVertical: 6,
    borderRadius: radii.pill,
    gap: 6,
  },
  text:      { fontSize: 13, fontWeight: '700' },
  small:     { paddingHorizontal: space.sm, paddingVertical: space.xs },
  smallText: { fontSize: 11 },
  gradePill: {
    borderWidth: border.hairline,
    borderRadius: radii.sm,
    paddingHorizontal: 6,
    paddingVertical: 1,
  },
  gradeText: { fontSize: 11, fontWeight: '700' },
});
