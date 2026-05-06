/**
 * AppTextInput
 *
 * On web: renders a native HTML <input> / <textarea>.
 *   iOS Safari only shows the keyboard when focus is triggered by a direct
 *   touchend on the actual <input> DOM node. React Native Web's responder
 *   system intercepts that touch and calls .focus() via JS, which Safari
 *   treats as a programmatic (non-gesture) focus and ignores — keyboard
 *   never appears. A raw <input> element has no such indirection.
 *
 * On native (iOS / Android): renders React Native <TextInput> as normal.
 */
import React from 'react';
import { Platform, TextInput, StyleSheet } from 'react-native';
import colors from '../theme/colors';

export default function AppTextInput({
  style,
  multiline = false,
  secureTextEntry = false,
  placeholder,
  placeholderTextColor,
  value,
  onChangeText,
  onBlur,
  onFocus,
  keyboardType,
  inputMode,
  autoCapitalize,
  autoCorrect,
  autoComplete,
  textContentType,
  editable = true,
  maxLength,
  numberOfLines,
  ...rest
}) {
  if (Platform.OS !== 'web') {
    return (
      <TextInput
        style={style}
        multiline={multiline}
        secureTextEntry={secureTextEntry}
        placeholder={placeholder}
        placeholderTextColor={placeholderTextColor}
        value={value}
        onChangeText={onChangeText}
        onBlur={onBlur}
        onFocus={onFocus}
        keyboardType={keyboardType}
        inputMode={inputMode}
        autoCapitalize={autoCapitalize}
        autoCorrect={autoCorrect}
        autoComplete={autoComplete}
        textContentType={textContentType}
        editable={editable}
        maxLength={maxLength}
        numberOfLines={numberOfLines}
        {...rest}
      />
    );
  }

  // ── Web: raw HTML element ─────────────────────────────────────────────────
  const flat = StyleSheet.flatten(style) || {};

  const baseStyle = {
    flex:            flat.flex ?? 1,
    fontSize:        Math.max(flat.fontSize ?? 15, 16), // ≥16px prevents iOS zoom
    color:           flat.color ?? colors.black,
    paddingTop:      flat.paddingVertical ?? 11,
    paddingBottom:   flat.paddingVertical ?? 11,
    paddingLeft:     0,
    paddingRight:    0,
    border:          'none',
    outline:         'none',
    background:      'transparent',
    width:           '100%',
    fontFamily:      'inherit',
    // Critical: override RN Web's user-select:none so Safari allows keyboard
    WebkitUserSelect: 'text',
    userSelect:      'text',
    touchAction:     'manipulation',
    WebkitTapHighlightColor: 'transparent',
  };

  const type = secureTextEntry          ? 'password'
    : keyboardType === 'email-address'  ? 'email'
    : keyboardType === 'phone-pad'      ? 'tel'
    : keyboardType === 'numeric'        ? 'number'
    : 'text';

  const htmlAutoCapitalize =
      autoCapitalize === 'none'      ? 'off'
    : autoCapitalize === 'words'     ? 'words'
    : autoCapitalize === 'sentences' ? 'sentences'
    : 'off';

  const sharedProps = {
    placeholder,
    value: value ?? '',
    onChange:        (e) => onChangeText?.(e.target.value),
    onBlur,
    onFocus,
    autoComplete:    autoComplete ?? 'off',
    autoCorrect:     autoCorrect === false ? 'off' : 'on',
    autoCapitalize:  htmlAutoCapitalize,
    spellCheck:      autoCorrect !== false,
    maxLength,
    disabled:        !editable,
  };

  if (multiline) {
    return (
      <textarea
        {...sharedProps}
        rows={numberOfLines ?? 3}
        style={{
          ...baseStyle,
          resize:   'none',
          height:   flat.height ?? 'auto',
          overflow: 'hidden',
        }}
      />
    );
  }

  return <input type={type} style={baseStyle} {...sharedProps} />;
}
