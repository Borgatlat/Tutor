import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import colors from '../theme/colors';
import { cardShadow } from '../theme/shadows';
import SubjectBadge from './SubjectBadge';
import RatingStars from './RatingStars';

export default function TutorCard({ tutor, onPress }) {
  const initials = tutor.full_name
    ?.split(' ')
    .map((w) => w[0])
    .slice(0, 2)
    .join('') ?? '?';

  const freeCount = tutor.availability?.length ?? 0;

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.88}>
      {/* Top row */}
      <View style={styles.top}>
        {/* Avatar */}
        {tutor.avatar_url ? (
          <Image source={{ uri: tutor.avatar_url }} style={styles.avatar} />
        ) : (
          <View style={styles.avatarPlaceholder}>
            <Text style={styles.initials}>{initials}</Text>
          </View>
        )}

        <View style={styles.info}>
          <Text style={styles.name}>{tutor.full_name}</Text>
          <RatingStars rating={tutor.avg_rating} count={tutor.review_count} size={12} />
          <Text style={styles.sessions}>
            {tutor.session_count ?? 0} sessions completed
          </Text>
        </View>

        <Ionicons name="chevron-forward" size={18} color={colors.gray300} />
      </View>

      {/* Subject badges */}
      <View style={styles.badgeRow}>
        {(tutor.subjects ?? []).map((s) => (
          <SubjectBadge
            key={typeof s === 'object' ? s.subject : s}
            subject={typeof s === 'object' ? s.subject : s}
            small
          />
        ))}
      </View>

      {/* Bio snippet */}
      {tutor.bio ? (
        <Text style={styles.bio} numberOfLines={2}>{tutor.bio}</Text>
      ) : null}

      {/* Availability hint */}
      <View style={styles.availRow}>
        <Ionicons name="time-outline" size={13} color={colors.green} />
        <Text style={styles.availText}>
          {freeCount > 0
            ? `${freeCount} free period${freeCount !== 1 ? 's' : ''} available`
            : 'No availability set yet'}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.white,
    borderRadius: 18,
    padding: 18,
    marginBottom: 14,
    ...cardShadow,
  },
  top: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  avatar: { width: 52, height: 52, borderRadius: 26, marginRight: 12 },
  avatarPlaceholder: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: colors.red,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  initials: { color: colors.white, fontWeight: '800', fontSize: 18 },
  info:     { flex: 1 },
  name:     { fontSize: 16, fontWeight: '800', color: colors.black, marginBottom: 3 },
  sessions: { fontSize: 11, color: colors.gray400, marginTop: 2 },

  badgeRow: { flexDirection: 'row', gap: 6, flexWrap: 'wrap', marginBottom: 10 },

  bio: { fontSize: 13, color: colors.gray600, lineHeight: 19, marginBottom: 10 },

  availRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  availText: { fontSize: 12, color: colors.green, fontWeight: '600' },
});
