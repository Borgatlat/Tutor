/**
 * EmptyState — icon + title + optional body and action.
 *
 * Use this anywhere a list can be empty, so "no data" always reads as a
 * deliberate state rather than a blank area that looks broken.
 */
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Button from './Button';
import Mascot from './Mascot';
import colors from '../../theme/colors';
import { radii, space } from '../../theme/layout';

export default function EmptyState({
  icon = 'file-tray-outline',
  title,
  body,
  actionLabel,
  onAction,
  compact = false,
  style,
}) {
  return (
    <View style={[styles.wrap, compact && styles.compact, style]}>
      {compact ? (
        <View style={[styles.iconWrap, styles.iconWrapCompact]}>
          <Ionicons name={icon} size={20} color={colors.brand} />
        </View>
      ) : (
        <Mascot size={96} mood="thinking" style={styles.mascot} />
      )}

      <Text style={[styles.title, compact && styles.titleCompact]}>{title}</Text>
      {body ? <Text style={styles.body}>{body}</Text> : null}

      {actionLabel && onAction ? (
        <Button
          label={actionLabel}
          onPress={onAction}
          variant="secondary"
          size="sm"
          style={styles.action}
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
    backgroundColor: colors.brandTint,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: space.md,
  },
  iconWrapCompact: { width: 40, height: 40, marginBottom: space.sm },
  mascot: { marginBottom: space.md },

  title: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.black,
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
});
