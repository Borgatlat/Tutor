/**
 * Field — label + input + error, with the focus state the app was missing.
 *
 * Owning `focused` here is the whole point: AppTextInput's web path sets
 * `outline: none`, so without this there is no focus indication at all on web.
 * Every form in the app gets the ring by using this component.
 *
 * Pass `icon` for a leading Ionicon, `trailing` for a node on the right
 * (e.g. a password reveal button).
 */
import React, { useState } from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AppTextInput from '../AppTextInput';
import colors from '../../theme/colors';
import { radii, space, border } from '../../theme/layout';
import { label as labelPreset } from '../../theme/fonts';

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
            color={focused ? colors.brand : colors.gray400}
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
    ...labelPreset.caps,
    fontSize: 11,
    letterSpacing: 1.6,
    color: colors.gray600,
    marginBottom: space.sm,
  },

  box: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: border.control,
    borderColor: colors.line,
    borderRadius: radii.sm,
    backgroundColor: colors.white,
    paddingHorizontal: space.md,
  },
  boxMultiline: { alignItems: 'flex-start', paddingVertical: space.xs },
  // Green border plus a 1px outer ring on web, so focus reads as a 2px line
  // without the box changing size.
  boxFocused: {
    borderColor: colors.brand,
    ...Platform.select({ web: { boxShadow: `0 0 0 1px ${colors.brand}` }, default: {} }),
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
