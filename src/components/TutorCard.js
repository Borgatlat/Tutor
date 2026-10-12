import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import colors from '../theme/colors';
import { radii, space, press } from '../theme/layout';
import { cardShadow } from '../theme/shadows';
import { type } from '../theme/fonts';
import Avatar from './ui/Avatar';
import SubjectBadge from './SubjectBadge';
import TutorBadge from './TutorBadge';
import { getTutorBadges } from '../utils/badges';
import RatingStars from './RatingStars';

// List cards stay short: name, rating, two subjects and how many blocks are
// free. The bio and full subject list live on the tutor's profile.
const MAX_BADGES = 2;

export default function TutorCard({ tutor, onPress }) {
  const subjects  = (tutor.subjects ?? []).map((s) => (typeof s === 'object' ? s.subject : s));
  const shown     = subjects.slice(0, MAX_BADGES);
  const overflow  = subjects.length - shown.length;
  const freeCount = tutor.availability?.length ?? 0;
  const badge     = getTutorBadges(tutor)[0];

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={onPress}
      activeOpacity={press.opacity}
      accessibilityRole="button"
      accessibilityLabel={`View ${tutor.full_name}'s profile`}
    >
      <View style={styles.top}>
        <Avatar
          uri={tutor.avatar_url}
          name={tutor.full_name}
          size={48}
          style={styles.avatar}
        />

        <View style={styles.info}>
          <Text style={styles.name} numberOfLines={1}>{tutor.full_name}</Text>
          <RatingStars rating={tutor.avg_rating} count={tutor.review_count} size={12} />
          {badge ? <TutorBadge badge={badge} /> : null}
        </View>

        <Ionicons name="chevron-forward" size={18} color={colors.gray300} />
      </View>

      <View style={styles.bottom}>
        <View style={styles.badgeRow}>
          {shown.map((s) => <SubjectBadge key={s} subject={s} small />)}
          {overflow > 0 ? (
            <View style={styles.more}>
              <Text style={styles.moreText}>+{overflow}</Text>
            </View>
          ) : null}
        </View>

        <Text style={[styles.availText, freeCount === 0 && styles.availTextEmpty]}>
          {freeCount > 0
            ? `${freeCount} free block${freeCount === 1 ? '' : 's'}`
            : 'No free blocks'}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    padding: space.lg,
    marginBottom: space.md,
    ...cardShadow,
  },

  top:    { flexDirection: 'row', alignItems: 'center', marginBottom: space.md },
  avatar: { marginRight: space.md },
  info:   { flex: 1, gap: 2 },
  name:   { ...type.body, fontWeight: '700', color: colors.black },

  bottom:   { flexDirection: 'row', alignItems: 'center', gap: space.sm },
  badgeRow: { flex: 1, flexDirection: 'row', gap: 6, flexWrap: 'wrap' },
  more: {
    paddingHorizontal: space.sm,
    paddingVertical: 3,
    borderRadius: radii.xs,
    backgroundColor: colors.gray100,
  },
  moreText: { fontSize: 12, fontWeight: '600', color: colors.gray500 },

  availText:      { ...type.small, fontWeight: '600', color: colors.brandText },
  availTextEmpty: { color: colors.gray500 },
});
