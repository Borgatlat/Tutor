/**
 * Logo: two people whose bodies form one heart, above an open book.
 * Peer tutoring as community service: one student (green) and the one they
 * help (gold) make the heart, and the book is what they share.
 *
 *   size    number, px (square)
 *   onDark  white + gold, for green backgrounds
 *   layer   'all' (default) | 'book' | 'left' | 'right'
 *           Draws one piece only, so the loading screen can animate the
 *           parts separately. Every layer uses the same 120×120 frame, so
 *           stacked layers line up exactly.
 *
 * Colours come from the theme, so another school gets its own logo.
 */
import React from 'react';
import Svg, { Circle, Path } from 'react-native-svg';
import colors from '../../theme/colors';
import { school } from '../../theme/school';

export const LOGO_PATHS = {
  leftHead:  { cx: 40, cy: 24, r: 10.5 },
  rightHead: { cx: 80, cy: 24, r: 10.5 },
  leftBody:  'M58.5 48 C52 40 44 38 37 40 C27 43 22 52 24 62 C27 74 42 84 58.5 94 Z',
  rightBody: 'M61.5 48 C68 40 76 38 83 40 C93 43 98 52 96 62 C93 74 78 84 61.5 94 Z',
  leftPage:  'M57 110 C45 102 31 100 16 103 L16 93 C31 90 45 92 57 101 Z',
  rightPage: 'M63 110 C75 102 89 100 104 103 L104 93 C89 90 75 92 63 101 Z',
};

export default function Logo({ size = 64, onDark = false, layer = 'all', style }) {
  const main = onDark ? colors.white : colors.brand;
  const page = onDark ? colors.whiteAlpha[90] : colors.brand;
  const show = (part) => layer === 'all' || layer === part;
  const p = LOGO_PATHS;

  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 120 120"
      style={style}
      accessibilityRole={layer === 'all' ? 'image' : undefined}
      accessibilityLabel={layer === 'all' ? `${school.name} Tutors logo` : undefined}
      accessibilityElementsHidden={layer !== 'all'}
      importantForAccessibility={layer === 'all' ? 'yes' : 'no-hide-descendants'}
    >
      {show('book') ? (
        <>
          <Path d={p.leftPage} fill={page} />
          <Path d={p.rightPage} fill={page} />
        </>
      ) : null}
      {show('left') ? (
        <>
          <Circle {...p.leftHead} fill={main} />
          <Path d={p.leftBody} fill={main} />
        </>
      ) : null}
      {show('right') ? (
        <>
          <Circle {...p.rightHead} fill={colors.gold} />
          <Path d={p.rightBody} fill={colors.gold} />
        </>
      ) : null}
    </Svg>
  );
}
