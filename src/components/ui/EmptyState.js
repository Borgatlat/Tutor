/**
 * EmptyState - icon + title + optional body and action.
 *
 * Use this anywhere a list can be empty, so "no data" always reads as a
 * deliberate state rather than a blank area that looks broken.
 */
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Button from './Button';
import colors from '../../theme/colors';
import { radii, space } from '../../theme/layout';

export default function EmptyState({
  icon = 'file-tray-outline',
  title,
  body,
  actionLabel,
  onAction,
  // Optional second action, for empty states that offer a real choice rather
  // than one obvious next step (e.g. "be the first tutor" OR "invite a friend").
  secondaryActionLabel,
  onSecondaryAction,
  compact = false,
  style,
}) {
  const hasPrimary   = !!(actionLabel && onAction);
  const hasSecondary = !!(secondaryActionLabel && onSecondaryAction);

  return (
    <View style={[styles.wrap, compact && styles.compact, style]}>
      <View style={[styles.iconWrap, compact && styles.iconWrapCompact]}>
        <Ionicons name={icon} size={compact ? 20 : 26} color={colors.accent} />
      </View>

      <Text style={[styles.title, compact && styles.titleCompact]}>{title}</Text>
      {body ? <Text style={styles.body}>{body}</Text> : null}

      {hasPrimary ? (
        <Button
          label={actionLabel}
          onPress={onAction}
          variant={hasSecondary ? 'primary' : 'secondary'}
          size="sm"
          style={styles.action}
        />
      ) : null}

      {hasSecondary ? (
        <Button
          label={secondaryActionLabel}
          onPress={onSecondaryAction}
          variant="secondary"
          size="sm"
          style={hasPrimary ? styles.secondaryAction : styles.action}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    paddingVertical: space.xxxl,
    paddingHorizontal: space.xl,
  },
  compact: { paddingVertical: space.xl },

  iconWrap: {
    width: 56, height: 56,
    borderRadius: radii.pill,
    backgroundColor: colors.accentTint,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: space.md,
  },
  iconWrapCompact: { width: 40, height: 40, marginBottom: space.sm },

  title: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.gray700,
    textAlign: 'center',
  },
  titleCompact: { fontSize: 14 },

  body: {
    fontSize: 13,
    color: colors.gray500,
    textAlign: 'center',
    marginTop: space.xs,
    lineHeight: 19,
    maxWidth: 320,
  },

  action: { marginTop: space.lg },
  // Tighter than `action` so a pair of buttons reads as one group.
  secondaryAction: { marginTop: space.sm },
});
