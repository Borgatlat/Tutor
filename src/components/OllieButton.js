/**
 * OllieButton: a small round owl in the corner that opens Ask Ollie.
 *
 * Sits bottom-right on Home and Search, out of the way of the content, with
 * a little chat bubble so it reads as "chat" rather than decoration.
 */
import React, { useState } from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import colors from '../theme/colors';
import { radii, space, press } from '../theme/layout';
import { cardShadow } from '../theme/shadows';
import { school } from '../theme/school';
import { Mascot } from './ui';
import OllieChat from './OllieChat';

export default function OllieButton({ navigation, style }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <TouchableOpacity
        style={[styles.fab, style]}
        onPress={() => setOpen(true)}
        activeOpacity={press.opacity}
        accessibilityRole="button"
        accessibilityLabel={`Ask ${school.mascotName}`}
        accessibilityHint="Chat with Ollie to find a tutor"
      >
        <View pointerEvents="none" importantForAccessibility="no-hide-descendants" accessibilityElementsHidden>
          <Mascot size={44} />
        </View>
        <View style={styles.badge} pointerEvents="none">
          <Ionicons name="chatbubble-ellipses" size={12} color={colors.white} />
        </View>
      </TouchableOpacity>
      {open ? <OllieChat visible onClose={() => setOpen(false)} navigation={navigation} /> : null}
    </>
  );
}

const styles = StyleSheet.create({
  fab: {
    position: 'absolute', right: space.lg, bottom: space.lg,
    width: 56, height: 56, borderRadius: radii.pill,
    // Ollie's own stone colour, the same in light and dark mode, so the green
    // owl always stands out.
    backgroundColor: colors.paper, borderWidth: 1, borderColor: colors.paperLine,
    alignItems: 'center', justifyContent: 'center',
    ...cardShadow,
  },
  badge: {
    position: 'absolute', top: -2, right: -2,
    width: 22, height: 22, borderRadius: radii.pill,
    backgroundColor: colors.brand, borderWidth: 2, borderColor: colors.paper,
    alignItems: 'center', justifyContent: 'center',
  },
});
