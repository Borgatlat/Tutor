import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import colors from '../theme/colors';
import { space } from '../theme/layout';
import { type } from '../theme/fonts';
import Card from './ui/Card';
import Avatar from './ui/Avatar';
import Button from './ui/Button';
import StatusPill from './ui/StatusPill';
import { canMarkDone, sessionWhen } from '../utils/schedule';

export default function SessionCard({
  session,
  currentUserId,
  onConfirm,
  onComplete,
  onCancel,
  onReview,
  onMessage,
  onAddToCalendar,
  calendarAdded,
  busy = false,
}) {
  const isTutor   = session.tutor_id === currentUserId;
  const otherUser = isTutor ? session.student : session.tutor;
  const hasActions =
       session.status === 'pending'
    || session.status === 'confirmed'
    || (session.status === 'completed' && (!!onMessage || (!isTutor && !session.reviewed)));

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
          <Text style={styles.name} numberOfLines={1}>{otherUser?.full_name ?? 'Unknown'}</Text>
          {/* One compact line instead of separate subject / block tiles */}
          <Text style={styles.meta} numberOfLines={1}>
            {isTutor ? 'Student' : 'Tutor'} · {session.subject || 'Subject'}
          </Text>
          <View style={styles.when}>
            <Ionicons name="calendar-outline" size={13} color={colors.brandText} />
            <Text style={styles.whenText}>{sessionWhen(session)}</Text>
          </View>
        </View>

        <StatusPill status={session.status} />
      </View>

      {session.notes ? (
        <Text style={styles.notes} numberOfLines={2}>{session.notes}</Text>
      ) : null}

      {/* Actions: `busy` disables them all so they can't be double-tapped
          while the request is in flight. */}
      {hasActions ? (
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
            label="Cancel request"
            size="sm"
            variant="danger"
            loading={busy}
            onPress={() => onCancel?.(session.id)}
            style={styles.grow}
          />
        )}

        {session.status === 'confirmed' && isTutor && canMarkDone(session) && (
          <Button
            label="Mark as done"
            icon="checkmark-done"
            size="sm"
            loading={busy}
            onPress={() => onComplete?.(session.id)}
          />
        )}

        {session.status === 'confirmed' && (
          <Button
            label={calendarAdded ? 'Added to calendar' : 'Add to calendar'}
            icon={calendarAdded ? 'checkmark-circle' : 'calendar-outline'}
            size="sm"
            variant={calendarAdded ? 'ghost' : 'secondary'}
            disabled={calendarAdded}
            onPress={() => onAddToCalendar?.(session)}
          />
        )}

        {session.status !== 'cancelled' && onMessage ? (
          <Button
            label="Message"
            icon="chatbubble-ellipses-outline"
            size="sm"
            variant="secondary"
            accessibilityLabel={`Message ${otherUser?.full_name ?? 'them'}`}
            onPress={() => onMessage(session)}
          />
        ) : null}

        {session.status === 'completed' && !isTutor && !session.reviewed && (
          <Button
            label="Leave a review"
            icon="star-outline"
            size="sm"
            variant="secondary"
            onPress={() => onReview?.(session)}
          />
        )}
      </View>
      ) : null}
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { marginBottom: space.md },

  top:    { flexDirection: 'row', alignItems: 'center' },
  avatar: { marginRight: space.md },
  info:   { flex: 1, marginRight: space.sm },
  name:   { ...type.body, fontWeight: '700', color: colors.black },
  meta:   { ...type.small, color: colors.gray500, marginTop: 2 },
  when:     { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
  whenText: { ...type.small, fontWeight: '600', color: colors.brandText },

  notes: { ...type.small, color: colors.gray600, marginTop: space.md },

  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm, marginTop: space.md },
  grow:    { flex: 1 },
});
