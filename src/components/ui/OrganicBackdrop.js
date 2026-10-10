/**
 * OrganicBackdrop — soft, overlapping blob shapes behind a green header.
 *
 * Purely decorative: absolutely positioned, ignores touches and is hidden
 * from screen readers. Drop it as the FIRST child of a header whose style has
 * `overflow: 'hidden'` (and usually a curved bottom edge); everything after it
 * renders on top.
 *
 *   variant  'header' (default) — blobs top-right + bottom-left
 *            'panel'            — one smaller blob, for cards like the Home promo
 */
import React from 'react';
import { View, StyleSheet } from 'react-native';
import colors from '../../theme/colors';

export default function OrganicBackdrop({ variant = 'header' }) {
  return (
    <View
      style={StyleSheet.absoluteFill}
      pointerEvents="none"
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      {variant === 'panel' ? (
        <View style={[styles.blob, styles.panelBlob]} />
      ) : (
        <>
          <View style={[styles.blob, styles.topRight]} />
          <View style={[styles.blob, styles.topRightInner]} />
          <View style={[styles.blob, styles.bottomLeft]} />
        </>
      )}
    </View>
  );
}

// Uneven width/height plus a rotation keeps each rounded rect from reading as
// a plain circle — that's what gives the "organic" pebble shape.
const styles = StyleSheet.create({
  blob: { position: 'absolute' },
  topRight: {
    width: 260, height: 220,
    top: -110, right: -90,
    borderRadius: 120,
    backgroundColor: colors.blob,
    transform: [{ rotate: '-18deg' }],
  },
  topRightInner: {
    width: 150, height: 120,
    top: -30, right: -40,
    borderRadius: 70,
    backgroundColor: colors.blobSoft,
    transform: [{ rotate: '24deg' }],
  },
  bottomLeft: {
    width: 200, height: 160,
    bottom: -100, left: -70,
    borderRadius: 90,
    backgroundColor: colors.blobSoft,
    transform: [{ rotate: '12deg' }],
  },
  panelBlob: {
    width: 190, height: 160,
    bottom: -80, right: -60,
    borderRadius: 90,
    backgroundColor: colors.blob,
    transform: [{ rotate: '-14deg' }],
  },
});
