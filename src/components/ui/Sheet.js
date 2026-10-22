/**
 * Sheet: the bottom-sheet modal.
 *
 * Wraps the dim overlay + rounded top corners + drag handle that were written
 * out separately in ReportModal and twice in SessionsScreen, each with its own
 * radius and padding.
 */
import React from 'react';
import { Modal, View, Text, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import colors from '../../theme/colors';
import { radii, space } from '../../theme/layout';
import { sheetShadow } from '../../theme/shadows';
import { heading, label, type } from '../../theme/fonts';

export default function Sheet({
  visible,
  onClose,
  title,
  subtitle,
  children,
  style,
}) {
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      {/* Lifts the sheet above the keyboard on iPhone, so inputs stay visible. */}
      <KeyboardAvoidingView style={styles.overlay} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={[styles.sheet, style]}>
          <View style={styles.handle} />

          {title ? <Text style={styles.title}>{title}</Text> : null}
          {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}

          {children}
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radii.xxl,
    borderTopRightRadius: radii.xxl,
    paddingHorizontal: space.xxl,
    paddingTop: space.md,
    paddingBottom: space.huge,
    maxHeight: '88%',
    ...sheetShadow,
  },
  handle: {
    width: 40, height: 4, borderRadius: radii.pill,
    backgroundColor: colors.line,
    alignSelf: 'center', marginBottom: space.xl,
  },
  title:    { ...heading.lg, fontSize: 20, color: colors.black, marginBottom: space.xs },
  subtitle: { fontSize: 14, color: colors.gray500, marginBottom: space.xl, lineHeight: 20 },
});
