import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import colors from '../theme/colors';
import { space, radii } from '../theme/layout';
import { heading, label } from '../theme/fonts';
import Card from './ui/Card';
import Avatar from './ui/Avatar';
import Button from './ui/Button';
import StatusPill from './ui/StatusPill';
import SubjectBadge from './SubjectBadge';

export default function SessionCard({
  session,
  currentUserId,
  onConfirm,
  onComplete,
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
          color={isTutor ? colors.accentLight : colors.brand}
          style={styles.avatar}
        />

        <View style={styles.info}>
          <Text style={styles.name}>{otherUser?.full_name ?? 'Unknown'}</Text>
          <Text style={styles.role}>{isTutor ? 'Student' : 'Tutor'}</Text>
        </View>

        <StatusPill status={session.status} />
      </View>

      {/* Details — subject and block as a small "at a glance" pair */}
      <View style={styles.details}>
        <View style={styles.detailCell}>
          <Text style={styles.detailLabel}>Subject</Text>
          <SubjectBadge subject={session.subject} small />
        </View>
        <View style={[styles.detailCell, styles.detailCellRight]}>
          <Text style={styles.detailLabel}>Block</Text>
          <View style={styles.detailItem}>
            <Ionicons name="calendar-outline" size={14} color={colors.brand} />
            <Text style={styles.detailValue}>{session.period}</Text>
          </View>
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

        {session.status === 'confirmed' && isTutor && (
          <Button
            label="Mark as Done"
            icon="checkmark-done"
            size="sm"
            loading={busy}
            onPress={() => onComplete?.(session.id)}
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

  details: {
    flexDirection: 'row',
    gap: space.sm,
    marginBottom: space.md,
  },
  detailCell: {
    flex: 1, gap: space.xs, alignItems: 'flex-start',
    backgroundColor: colors.offWhite,
    borderRadius: radii.sm,
    padding: space.md,
  },
  detailCellRight: {},
  detailLabel:     { ...label.caps, fontWeight: '500', fontSize: 9, letterSpacing: 1.6, color: colors.gray500 },
  detailItem:      { flexDirection: 'row', alignItems: 'center', gap: space.xs },
  detailValue:     { ...heading.lg, fontSize: 18, color: colors.brand },

  notes: { fontSize: 13, color: colors.gray600, lineHeight: 18, marginBottom: space.sm },

  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm, marginTop: space.xs },
  grow:    { flex: 1 },
});
