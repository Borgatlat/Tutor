/**
 * Field - label + input + error, with the focus state the app was missing.
 *
 * Owning `focused` here is the whole point: AppTextInput's web path sets
 * `outline: none`, so without this there is no focus indication at all on web.
 * Every form in the app gets the ring by using this component.
 *
 * Pass `icon` for a leading Ionicon, `trailing` for a node on the right
 * (e.g. a password reveal button).
 */
import React, { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AppTextInput from '../AppTextInput';
import colors from '../../theme/colors';
import { radii, space, border } from '../../theme/layout';

export default function Field({
  label,
  error,
  icon,
  trailing,
  multiline = false,
  onFocus,
  onBlur,
  style,
  inputStyle,
  hint,
  ...inputProps
}) {
  const [focused, setFocused] = useState(false);

  return (
    <View style={[styles.wrap, style]}>
      {label ? <Text style={styles.label}>{label}</Text> : null}

      <View
        style={[
          styles.box,
          multiline && styles.boxMultiline,
          focused && styles.boxFocused,
          error   && styles.boxError,
        ]}
      >
        {icon ? (
          <Ionicons
            name={icon}
            size={18}
            color={focused ? colors.accent : colors.gray400}
            style={styles.icon}
          />
        ) : null}

        <AppTextInput
          style={[styles.input, multiline && styles.inputMultiline, inputStyle]}
          placeholderTextColor={colors.gray400}
          multiline={multiline}
          accessibilityLabel={label}
          onFocus={(e) => { setFocused(true);  onFocus?.(e); }}
          onBlur={(e)  => { setFocused(false); onBlur?.(e);  }}
          {...inputProps}
        />

        {trailing}
      </View>

      {error ? (
        <Text style={styles.error}>{error}</Text>
      ) : hint ? (
        <Text style={styles.hint}>{hint}</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginBottom: space.lg },

  label: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.gray600,
    marginBottom: space.sm,
  },

  box: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: border.control,
    borderColor: colors.gray200,
    borderRadius: radii.md,
    backgroundColor: colors.offWhite,
    paddingHorizontal: space.md,
  },
  boxMultiline: { alignItems: 'flex-start', paddingVertical: space.xs },
  boxFocused: {
    borderColor: colors.accent,
    backgroundColor: colors.white,
  },
  boxError: { borderColor: colors.error },

  icon: { marginRight: space.sm },

  input: {
    flex: 1,
    fontSize: 15,
    color: colors.black,
    paddingVertical: space.md,
  },
  inputMultiline: { height: 92, textAlignVertical: 'top' },

  error: { fontSize: 12, color: colors.error,   marginTop: space.xs },
  hint:  { fontSize: 12, color: colors.gray500, marginTop: space.xs },
});
