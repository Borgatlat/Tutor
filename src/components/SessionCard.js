import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import colors from '../theme/colors';
import { cardShadow } from '../theme/shadows';
import { SESSION_STATUS } from '../constants';
import SubjectBadge from './SubjectBadge';

export default function SessionCard({ session, currentUserId, onConfirm, onCancel, onReview, onAddToCalendar, calendarAdded }) {
  const isTutor   = session.tutor_id === currentUserId;
  const otherUser = isTutor ? session.student : session.tutor;
  const status    = SESSION_STATUS[session.status] ?? { label: session.status, color: colors.gray500 };

  const initials = otherUser?.full_name
    ?.split(' ').map((w) => w[0]).slice(0, 2).join('') ?? '?';

  return (
    <View style={styles.card}>
      {/* Top row */}
      <View style={styles.top}>
        {otherUser?.avatar_url ? (
          <Image source={{ uri: otherUser.avatar_url }} style={styles.avatar} />
        ) : (
          <View style={[styles.avatarPlaceholder, { backgroundColor: isTutor ? colors.green : colors.red }]}>
            <Text style={styles.initials}>{initials}</Text>
          </View>
        )}

        <View style={styles.info}>
          <Text style={styles.name}>{otherUser?.full_name ?? 'Unknown'}</Text>
          <Text style={styles.role}>{isTutor ? 'Student' : 'Tutor'}</Text>
        </View>

        <View style={[styles.statusBadge, { backgroundColor: `${status.color}22` }]}>
          <Text style={[styles.statusText, { color: status.color }]}>{status.label}</Text>
        </View>
      </View>

      {/* Details */}
      <View style={styles.details}>
        <SubjectBadge subject={session.subject} small />
        <View style={styles.detailItem}>
          <Ionicons name="calendar-outline" size={13} color={colors.gray500} />
          <Text style={styles.detailText}>{session.day} · Period {session.period}</Text>
        </View>
      </View>

      {session.notes ? (
        <Text style={styles.notes} numberOfLines={2}>{session.notes}</Text>
      ) : null}

      {/* Actions */}
      <View style={styles.actions}>
        {session.status === 'pending' && isTutor && (
          <>
            <TouchableOpacity style={styles.confirmBtn} onPress={() => onConfirm?.(session.id)}>
              <Text style={styles.confirmText}>Confirm</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.cancelBtn} onPress={() => onCancel?.(session.id)}>
              <Text style={styles.cancelText}>Decline</Text>
            </TouchableOpacity>
          </>
        )}
        {session.status === 'pending' && !isTutor && (
          <TouchableOpacity style={styles.cancelBtn} onPress={() => onCancel?.(session.id)}>
            <Text style={styles.cancelText}>Cancel Request</Text>
          </TouchableOpacity>
        )}
        {session.status === 'confirmed' && (
          <TouchableOpacity
            style={[styles.calendarBtn, calendarAdded && styles.calendarBtnAdded]}
            onPress={() => !calendarAdded && onAddToCalendar?.(session)}
            activeOpacity={calendarAdded ? 1 : 0.7}
          >
            <Ionicons
              name={calendarAdded ? 'checkmark-circle' : 'calendar-outline'}
              size={14}
              color={calendarAdded ? colors.green : colors.red}
            />
            <Text style={[styles.calendarBtnText, calendarAdded && styles.calendarBtnTextAdded]}>
              {calendarAdded ? 'Added to Calendar' : 'Add to Calendar'}
            </Text>
          </TouchableOpacity>
        )}
        {session.status === 'completed' && !isTutor && !session.reviewed && (
          <TouchableOpacity style={styles.reviewBtn} onPress={() => onReview?.(session)}>
            <Ionicons name="star-outline" size={14} color={colors.warning} />
            <Text style={styles.reviewText}>Leave a Review</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    ...cardShadow,
  },
  top: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  avatar:            { width: 44, height: 44, borderRadius: 22, marginRight: 10 },
  avatarPlaceholder: { width: 44, height: 44, borderRadius: 22, marginRight: 10, alignItems: 'center', justifyContent: 'center' },
  initials:  { color: colors.white, fontWeight: '800', fontSize: 15 },
  info:      { flex: 1 },
  name:      { fontSize: 15, fontWeight: '700', color: colors.black },
  role:      { fontSize: 12, color: colors.gray500, marginTop: 1 },
  statusBadge:  { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  statusText:   { fontSize: 12, fontWeight: '700' },

  details:    { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8 },
  detailItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  detailText: { fontSize: 12, color: colors.gray500 },
  notes:      { fontSize: 13, color: colors.gray600, lineHeight: 18, marginBottom: 10 },

  actions:    { flexDirection: 'row', gap: 8, marginTop: 4 },
  confirmBtn: {
    flex: 1, backgroundColor: colors.green, borderRadius: 10,
    paddingVertical: 9, alignItems: 'center',
  },
  confirmText: { color: colors.white, fontWeight: '700', fontSize: 13 },
  cancelBtn: {
    flex: 1, borderWidth: 1.5, borderColor: colors.gray200, borderRadius: 10,
    paddingVertical: 9, alignItems: 'center',
  },
  cancelText: { color: colors.gray500, fontWeight: '700', fontSize: 13 },
  reviewBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    borderWidth: 1.5, borderColor: colors.warning, borderRadius: 10,
    paddingVertical: 9, paddingHorizontal: 14,
  },
  reviewText: { color: colors.warning, fontWeight: '700', fontSize: 13 },

  calendarBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    borderWidth: 1.5, borderColor: colors.red, borderRadius: 10,
    paddingVertical: 9, paddingHorizontal: 14,
  },
  calendarBtnAdded:    { borderColor: colors.green, backgroundColor: colors.greenMuted },
  calendarBtnText:     { color: colors.red,   fontWeight: '700', fontSize: 13 },
  calendarBtnTextAdded:{ color: colors.green, fontWeight: '700', fontSize: 13 },
});
