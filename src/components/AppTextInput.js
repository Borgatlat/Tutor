/**
 * AppTextInput
 *
 * On web: renders a native HTML <input> / <textarea>.
 *   iOS Safari only shows the keyboard when focus is triggered by a direct
 *   touchend on the actual <input> DOM node. React Native Web's responder
 *   system intercepts that touch and calls .focus() via JS, which Safari
 *   treats as a programmatic (non-gesture) focus and ignores - keyboard
 *   never appears. A raw <input> element has no such indirection.
 *
 * On native (iOS / Android): renders React Native <TextInput> as normal.
 */
import React, { useRef, useEffect } from 'react';
import { Platform, TextInput, StyleSheet } from 'react-native';
import colors from '../theme/colors';
import { fonts } from '../theme/fonts';

// `placeholderTextColor` has no HTML equivalent, so on web it would silently
// fall back to the browser default and not match native. One global rule fixes
// every input at once.
const PLACEHOLDER_CLASS = 'app-text-input';
if (Platform.OS === 'web' && typeof document !== 'undefined') {
  const ID = 'app-text-input-placeholder';
  if (!document.getElementById(ID)) {
    const el = document.createElement('style');
    el.id = ID;
    el.textContent =
      `.${PLACEHOLDER_CLASS}::placeholder{color:${colors.gray400};opacity:1}`;
    document.head.appendChild(el);
  }
}

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
  const inputRef = useRef(null);

  // iOS Safari only shows the keyboard when focus() is called synchronously
  // inside a *native* touchend handler (not a synthetic React event).
  // stopPropagation() on touchstart prevents React Native Web's document-level
  // responder from capturing the touch and potentially calling preventDefault().
  useEffect(() => {
    const el = inputRef.current;
    if (!el) return;

    const onTouchStart = (e) => {
      // Stop RN Web's document-level responder from claiming this touch
      e.stopPropagation();
    };

    const onTouchEnd = (e) => {
      e.stopPropagation();
      // preventDefault() stops the synthetic click/mousedown events that
      // fire after a touch - those events can trigger RN Web parent handlers
      // which steal focus and dismiss the keyboard.
      // We call el.focus() explicitly so we don't need the browser default.
      e.preventDefault();
      el.focus();
    };

    // passive:false on touchend so preventDefault() is allowed
    el.addEventListener('touchstart', onTouchStart, { passive: true });
    el.addEventListener('touchend',   onTouchEnd,   { passive: false });

    return () => {
      el.removeEventListener('touchstart', onTouchStart);
      el.removeEventListener('touchend',   onTouchEnd);
    };
  }, []);

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
    // Explicit, not 'inherit': inheriting picks up the serif heading font from
    // an ancestor, so inputs rendered in serif while their labels were sans.
    fontFamily:      flat.fontFamily ?? fonts.sans,
    // textAlign is dropped by the whitelist otherwise - centered numeric
    // inputs (grade fields) rely on it.
    textAlign:       flat.textAlign ?? 'left',
    // Disabled fields need to look disabled, not just refuse input.
    cursor:          editable ? 'text' : 'not-allowed',
    opacity:         editable ? 1 : 0.6,
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
    className: PLACEHOLDER_CLASS,
    'aria-label': rest.accessibilityLabel,
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
        ref={inputRef}
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

  return <input ref={inputRef} type={type} style={baseStyle} {...sharedProps} />;
}
