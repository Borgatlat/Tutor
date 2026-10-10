/**
 * Mascot — "Ollie", a wise owl in a graduation cap.
 *
 * Drawn entirely from theme colours, so another school that swaps colors.js
 * gets an owl in its own colours. Pure vector (react-native-svg): crisp at any
 * size on iPhone, Android and web.
 *
 *   size  number, px (the owl is square)
 *   mood  'default' — open eyes
 *         'happy'   — smiling closed eyes (success moments)
 *         'thinking'— eyes glancing up (empty / nothing-found states)
 *   onDark true when sitting on a green header: lighter body + a soft halo so
 *          the owl doesn't disappear into the background
 */
import React from 'react';
import Svg, { Circle, Ellipse, Path, Polygon, Rect, G } from 'react-native-svg';
import colors from '../../theme/colors';
import { school } from '../../theme/school';

export default function Mascot({ size = 96, mood = 'default', onDark = false, style }) {
  const ink = colors.black;
  const face = colors.offWhite;
  const body = onDark ? colors.accentLight : colors.brand;
  const wing = onDark ? colors.mascotWingLight : colors.brandLight;

  // Pupil offset per mood; 'happy' draws arcs instead of pupils.
  const look = mood === 'thinking' ? { dx: 2.5, dy: -3.5 } : { dx: 0, dy: 0 };

  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 120 120"
      style={style}
      accessibilityRole="image"
      accessibilityLabel={`${school.mascotName} the owl`}
    >
      {onDark ? <Circle cx="60" cy="64" r="56" fill={colors.blob} /> : null}

      {/* Wings */}
      <Ellipse cx="25" cy="80" rx="11" ry="22" fill={wing} transform="rotate(14 25 80)" />
      <Ellipse cx="95" cy="80" rx="11" ry="22" fill={wing} transform="rotate(-14 95 80)" />

      {/* Body */}
      <Ellipse cx="60" cy="74" rx="36" ry="39" fill={body} />

      {/* Belly with feather chevrons */}
      <Ellipse cx="60" cy="94" rx="21" ry="15" fill={face} />
      <G stroke={colors.line} strokeWidth="2" strokeLinecap="round" fill="none">
        <Path d="M52 90 L56 94 L60 90 L64 94 L68 90" />
        <Path d="M54 98 L58 102 L62 98 L66 102" />
      </G>

      {/* Eye discs */}
      <Circle cx="45" cy="62" r="15" fill={face} />
      <Circle cx="75" cy="62" r="15" fill={face} />

      {/* Eyes */}
      {mood === 'happy' ? (
        <G stroke={ink} strokeWidth="3.2" strokeLinecap="round" fill="none">
          <Path d="M38 64 Q45 56 52 64" />
          <Path d="M68 64 Q75 56 82 64" />
        </G>
      ) : (
        <>
          <Circle cx={45 + look.dx} cy={63 + look.dy} r="7.5" fill={ink} />
          <Circle cx={75 + look.dx} cy={63 + look.dy} r="7.5" fill={ink} />
          <Circle cx={47.5 + look.dx} cy={60.5 + look.dy} r="2.4" fill={colors.white} />
          <Circle cx={77.5 + look.dx} cy={60.5 + look.dy} r="2.4" fill={colors.white} />
        </>
      )}

      {/* Beak */}
      <Polygon points="54,72 66,72 60,81" fill={colors.gold} />

      {/* Feet */}
      <Ellipse cx="50" cy="112" rx="7" ry="3.5" fill={colors.gold} />
      <Ellipse cx="70" cy="112" rx="7" ry="3.5" fill={colors.gold} />

      {/* Graduation cap */}
      <Rect x="42" y="29" width="36" height="12" rx="4" fill={colors.brandDeep} />
      <Polygon points="60,12 100,26 60,40 20,26" fill={colors.brandDeep} />
      <Path d="M60 26 L92 30 L92 44" stroke={colors.gold} strokeWidth="2.5" strokeLinecap="round" fill="none" />
      <Circle cx="92" cy="46" r="3.6" fill={colors.gold} />
      <Circle cx="60" cy="26" r="2.6" fill={colors.gold} />
    </Svg>
  );
}
