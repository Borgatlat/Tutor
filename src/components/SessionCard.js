import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import colors from '../theme/colors';
import { space } from '../theme/layout';
import Card from './ui/Card';
import Avatar from './ui/Avatar';
import Button from './ui/Button';
import StatusPill from './ui/StatusPill';
import SubjectBadge from './SubjectBadge';

export default function SessionCard({
  session,
  currentUserId,
  onConfirm,
  onCancel,
  onReview,
  onAddToCalendar,
  calendarAdded,
  busy = false,
}) {
  const isTutor   = session.tutor_id === currentUserId;
  const otherUser = isTutor ? session.student : session.tutor;

  return (
    <Card style={styles.card}>
      {/* Top row */}
      <View style={styles.top}>
        <Avatar
          uri={otherUser?.avatar_url}
          name={otherUser?.full_name}
          size={44}
          color={isTutor ? colors.accent : colors.brand}
          style={styles.avatar}
        />

        <View style={styles.info}>
          <Text style={styles.name}>{otherUser?.full_name ?? 'Unknown'}</Text>
          <Text style={styles.role}>{isTutor ? 'Student' : 'Tutor'}</Text>
        </View>

        <StatusPill status={session.status} />
      </View>

      {/* Details */}
      <View style={styles.details}>
        <SubjectBadge subject={session.subject} small />
        <View style={styles.detailItem}>
          <Ionicons name="calendar-outline" size={13} color={colors.gray500} />
          <Text style={styles.detailText}>Block {session.period}</Text>
        </View>
      </View>

      {session.notes ? (
        <Text style={styles.notes} numberOfLines={2}>{session.notes}</Text>
      ) : null}

      {/* Actions — `busy` disables them all so they can't be double-tapped
          while the request is in flight. */}
      <View style={styles.actions}>
        {session.status === 'pending' && isTutor && (
          <>
            <Button
              label="Confirm"
              size="sm"
              loading={busy}
              onPress={() => onConfirm?.(session.id)}
              style={styles.grow}
            />
            <Button
              label="Decline"
              size="sm"
              variant="danger"
              disabled={busy}
              onPress={() => onCancel?.(session.id)}
              style={styles.grow}
            />
          </>
        )}

        {session.status === 'pending' && !isTutor && (
          <Button
            label="Cancel Request"
            size="sm"
            variant="danger"
            loading={busy}
            onPress={() => onCancel?.(session.id)}
            style={styles.grow}
          />
        )}

        {session.status === 'confirmed' && (
          <Button
            label={calendarAdded ? 'Added to Calendar' : 'Add to Calendar'}
            icon={calendarAdded ? 'checkmark-circle' : 'calendar-outline'}
            size="sm"
            variant={calendarAdded ? 'ghost' : 'secondary'}
            disabled={calendarAdded}
            onPress={() => onAddToCalendar?.(session)}
          />
        )}

        {session.status === 'completed' && !isTutor && !session.reviewed && (
          <Button
            label="Leave a Review"
            icon="star-outline"
            size="sm"
            variant="secondary"
            onPress={() => onReview?.(session)}
          />
        )}
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { marginBottom: space.md },

  top:    { flexDirection: 'row', alignItems: 'center', marginBottom: space.md },
  avatar: { marginRight: space.md },
  info:   { flex: 1 },
  name:   { fontSize: 15, fontWeight: '700', color: colors.black },
  role:   { fontSize: 12, color: colors.gray500, marginTop: 1 },

  details:    { flexDirection: 'row', alignItems: 'center', gap: space.sm, marginBottom: space.sm },
  detailItem: { flexDirection: 'row', alignItems: 'center', gap: space.xs },
  detailText: { fontSize: 12, color: colors.gray500 },

  notes: { fontSize: 13, color: colors.gray600, lineHeight: 18, marginBottom: space.sm },

  actions: { flexDirection: 'row', gap: space.sm, marginTop: space.xs },
  grow:    { flex: 1 },
});
