/**
 * EmailConsent: the opt-in checkbox for session emails.
 *
 * Unticked by default, and never required: nobody gets an email unless they
 * tick it. The words match email_consent_wording() in migration 007, which
 * the database stores with every opt-in and opt-out.
 */
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import colors from '../theme/colors';
import { space, press, hit } from '../theme/layout';
import { type } from '../theme/fonts';
import { EMAIL_CONSENT_TEXT } from '../constants';

export default function EmailConsent({ value, onChange, disabled, style }) {
  return (
    <TouchableOpacity
      style={[styles.row, style]}
      onPress={() => onChange?.(!value)}
      disabled={disabled}
      hitSlop={hit.slop}
      activeOpacity={press.opacity}
      accessibilityRole="checkbox"
      accessibilityState={{ checked: !!value, disabled: !!disabled }}
      accessibilityLabel="Email updates from BetterU LLC"
      accessibilityHint={EMAIL_CONSENT_TEXT}
    >
      <Ionicons
        name={value ? 'checkbox' : 'square-outline'}
        size={22}
        color={value ? colors.brand : colors.gray500}
      />
      <View style={styles.flex}>
        <Text style={styles.title}>Email updates</Text>
        <Text style={styles.text}>{EMAIL_CONSENT_TEXT}</Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  row:   { flexDirection: 'row', alignItems: 'flex-start', gap: space.md },
  flex:  { flex: 1 },
  title: { ...type.body, fontWeight: '700', color: colors.black },
  text:  { ...type.small, color: colors.gray600, marginTop: 2 },
});
