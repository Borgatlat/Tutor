import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import colors from '../theme/colors';

// Color coding: SAT = forest-green family, AP Math/CS = gold family, AP Science = teal, AP Humanities = slate
const getSubjectColors = (subject) => {
  if (subject === 'SAT Math')    return { bg: colors.redMuted,   text: colors.red };
  if (subject === 'SAT English') return { bg: colors.greenMuted, text: colors.greenDark };
  if (subject.startsWith('AP Calc') || subject.startsWith('AP Stat') || subject.startsWith('AP Computer')) {
    return { bg: '#FEF9EC', text: '#92681A' }; // amber/gold
  }
  if (subject.startsWith('AP Chem') || subject.startsWith('AP Phys') || subject.startsWith('AP Bio')) {
    return { bg: '#EDF7F4', text: '#1A6B4A' }; // teal
  }
  if (subject.startsWith('AP')) {
    return { bg: '#F0EFF8', text: '#4A4580' }; // slate-purple for humanities
  }
  return { bg: colors.gray100, text: colors.gray600 };
};

export default function SubjectBadge({ subject, grade, small = false }) {
  const c = getSubjectColors(subject);
  return (
    <View style={[styles.badge, { backgroundColor: c.bg }, small && styles.small]}>
      <Text style={[styles.text, { color: c.text }, small && styles.smallText]}>
        {subject}
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
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6,
  },
  text:      { fontSize: 13, fontWeight: '700' },
  small:     { paddingHorizontal: 8, paddingVertical: 4 },
  smallText: { fontSize: 11 },
  gradePill: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 1,
  },
  gradeText: { fontSize: 11, fontWeight: '700' },
});
