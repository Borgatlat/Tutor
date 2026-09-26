import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import colors from '../theme/colors';
import { radii, space, press } from '../theme/layout';
import { cardShadow } from '../theme/shadows';
import Avatar from './ui/Avatar';
import SubjectBadge from './SubjectBadge';
import RatingStars from './RatingStars';

// Subject badges are capped so a tutor with 12 subjects doesn't push the bio
// and availability line out of the card.
const MAX_BADGES = 4;

export default function TutorCard({ tutor, onPress }) {
  const subjects  = (tutor.subjects ?? []).map((s) => (typeof s === 'object' ? s.subject : s));
  const shown     = subjects.slice(0, MAX_BADGES);
  const overflow  = subjects.length - shown.length;
  const freeCount = tutor.availability?.length ?? 0;

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
          size={52}
          style={styles.avatar}
        />

        <View style={styles.info}>
          <Text style={styles.name} numberOfLines={1}>{tutor.full_name}</Text>
          <RatingStars rating={tutor.avg_rating} count={tutor.review_count} size={12} />
          <Text style={styles.sessions}>
            {tutor.session_count ?? 0} session{tutor.session_count === 1 ? '' : 's'} completed
          </Text>
        </View>

        <Ionicons name="chevron-forward" size={18} color={colors.gray300} />
      </View>

      {shown.length ? (
        <View style={styles.badgeRow}>
          {shown.map((s) => <SubjectBadge key={s} subject={s} small />)}
          {overflow > 0 ? (
            <View style={styles.more}>
              <Text style={styles.moreText}>+{overflow}</Text>
            </View>
          ) : null}
        </View>
      ) : null}

      {tutor.bio ? (
        <Text style={styles.bio} numberOfLines={2}>{tutor.bio}</Text>
      ) : null}

      <View style={styles.availRow}>
        <Ionicons
          name="time-outline"
          size={13}
          color={freeCount > 0 ? colors.accent : colors.gray400}
        />
        <Text style={[styles.availText, freeCount === 0 && styles.availTextEmpty]}>
          {freeCount > 0
            ? `${freeCount} free block${freeCount === 1 ? '' : 's'} available`
            : 'No availability set yet'}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.white,
    borderRadius: radii.lg,
    padding: space.lg,
    marginBottom: space.md,
    ...cardShadow,
  },

  top:    { flexDirection: 'row', alignItems: 'center', marginBottom: space.md },
  avatar: { marginRight: space.md },
  info:   { flex: 1 },
  name:     { fontSize: 16, fontWeight: '800', color: colors.black, marginBottom: 3 },
  sessions: { fontSize: 11, color: colors.gray400, marginTop: 2 },

  badgeRow: { flexDirection: 'row', gap: 6, flexWrap: 'wrap', marginBottom: space.sm },
  more: {
    paddingHorizontal: space.sm,
    paddingVertical: space.xs,
    borderRadius: radii.pill,
    backgroundColor: colors.gray100,
  },
  moreText: { fontSize: 11, fontWeight: '700', color: colors.gray500 },

  bio: { fontSize: 13, color: colors.gray600, lineHeight: 19, marginBottom: space.sm },

  availRow:       { flexDirection: 'row', alignItems: 'center', gap: space.xs },
  availText:      { fontSize: 12, color: colors.accent, fontWeight: '600' },
  availTextEmpty: { color: colors.gray400 },
});
