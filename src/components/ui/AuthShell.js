/**
 * AuthShell - the layout wrapper for every pre-app screen.
 *
 * Desktop (≥768): two columns - brand panel left, form card right.
 * Mobile: brand hero on top, form in a rounded sheet below.
 *
 * On web the KeyboardAvoidingView is deliberately skipped: it collapses the
 * container on iPhone Safari and blocks input taps, and the browser already
 * handles keyboard avoidance natively.
 */
import React, { useEffect } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView,
  KeyboardAvoidingView, Platform, ScrollView,
} from 'react-native';
import colors from '../../theme/colors';
import { radii, space } from '../../theme/layout';
import { panelShadow } from '../../theme/shadows';
import { heading } from '../../theme/fonts';
import { useResponsive } from '../../hooks/useResponsive';
import Wordmark from './Wordmark';
import BlockAvailabilityStrip from '../BlockAvailabilityStrip';

// The overflow lock in App.js is only needed for the iOS Safari keyboard bug.
// Everywhere else it breaks wheel scrolling on long forms, so auth screens opt
// out and let the document scroll instead. iPadOS reports as MacIntel, hence
// the maxTouchPoints check.
const IS_WEB = Platform.OS === 'web';
const IS_IOS_WEB = IS_WEB && typeof navigator !== 'undefined' && (
  /iP(hone|ad|od)/.test(navigator.userAgent) ||
  (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
);
const USE_PAGE_SCROLL = IS_WEB && !IS_IOS_WEB;

export default function AuthShell({
  title,
  subtitle,
  headerRight,
  children,
}) {
  const { isWide } = useResponsive();

  // Hand scrolling back to the document while this screen is mounted.
  useEffect(() => {
    if (!USE_PAGE_SCROLL) return undefined;
    const html = document.documentElement;
    html.classList.add('page-scroll');
    return () => html.classList.remove('page-scroll');
  }, []);

  const brand = (compact) => (
    <>
      <Wordmark compact={compact} style={styles.mark} />
      <Text style={[styles.title, compact && styles.titleCompact]}>{title}</Text>
      {subtitle ? (
        <Text style={[styles.subtitle, compact && styles.subtitleCompact]}>{subtitle}</Text>
      ) : null}
    </>
  );

  // ── Desktop: two-column ─────────────────────────────────────────────────────
  if (isWide) {
    return (
      <View style={styles.wideRoot}>
        <View style={styles.wideLeft}>
          {brand(false)}

          {/* Real, school-specific data instead of generic feature bullets. */}
          <BlockAvailabilityStrip />
        </View>

        <ScrollView
          style={styles.wideRight}
          contentContainerStyle={styles.wideScroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.panel}>{children}</View>
        </ScrollView>
      </View>
    );
  }

  // ── Mobile: hero + sheet ────────────────────────────────────────────────────
  const inner = (
    <ScrollView
      style={styles.fill}
      contentContainerStyle={styles.scroll}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.hero}>
        {headerRight ? <View style={styles.heroTop}>{headerRight}</View> : null}
        {brand(true)}
      </View>
      <View style={styles.sheet}>{children}</View>
    </ScrollView>
  );

  return (
    <SafeAreaView style={styles.safe}>
      {Platform.OS === 'web' ? (
        <View style={styles.fill}>{inner}</View>
      ) : (
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.fill}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : space.xxl}
        >
          {inner}
        </KeyboardAvoidingView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  safe: {
    flex: 1,
    backgroundColor: colors.brand,
    // Clamp only when the inner ScrollView must scroll (iOS). When the page
    // scrolls, the root has to grow past the viewport or nothing overflows.
    ...(USE_PAGE_SCROLL ? { minHeight: '100vh' } : {}),
    ...(IS_IOS_WEB ? { maxHeight: '100vh' } : {}),
  },
  // flexGrow lets content fill the viewport minimum while still overflowing
  // enough for the ScrollView to actually scroll.
  scroll: { flexGrow: 1, paddingBottom: space.xxxl },

  // ── Brand ─────────────────────────────────────────────────────────────────
  mark: { marginBottom: space.xl },
  title: {
    ...heading.xl,
    color: colors.white,
    fontSize: 46, lineHeight: 54,
    marginTop: space.xs,
  },
  titleCompact: { fontSize: 30, lineHeight: 36 },
  subtitle: {
    color: colors.whiteAlpha[80],
    fontSize: 16, lineHeight: 24,
    marginTop: space.md, maxWidth: 380,
  },
  subtitleCompact: { fontSize: 14, lineHeight: 20, marginTop: space.sm },

  // ── Mobile ────────────────────────────────────────────────────────────────
  hero: {
    backgroundColor: colors.brand,
    paddingHorizontal: space.xxl,
    paddingTop: space.lg,
    paddingBottom: space.xxxl,
    alignItems: 'flex-start',
  },
  // alignItems keeps the back button pinned left; without it the IconButton's
  // own centering wins inside a stretched row.
  heroTop: { alignSelf: 'stretch', alignItems: 'flex-start', marginBottom: space.lg },

  sheet: {
    flexGrow: 1,
    backgroundColor: colors.white,
    borderTopLeftRadius: radii.xxl,
    borderTopRightRadius: radii.xxl,
    padding: space.xxl,
    paddingBottom: space.huge,
  },

  // ── Desktop ───────────────────────────────────────────────────────────────
  wideRoot: {
    flex: 1,
    flexDirection: 'row',
    // maxHeight, not minHeight/height. With minHeight the row grows to fit tall
    // content (an expanded SubjectPicker), so the ScrollView grows with it and
    // never overflows -> nothing scrolls, and the page can't scroll either
    // because App.js pins body to overflow:hidden for the iOS keyboard fix.
    // Plain `height` doesn't help: `flex: 1` compiles to flex-basis:0%, which
    // wins over height on the main axis. max-height always clamps.
    ...(USE_PAGE_SCROLL ? { minHeight: '100vh' } : {}),
    ...(IS_IOS_WEB ? { height: '100vh', maxHeight: '100vh' } : {}),
  },
  wideLeft: {
    flex: 1,
    overflow: 'hidden',
    backgroundColor: colors.brand,
    paddingHorizontal: 56,
    paddingVertical: 64,
    justifyContent: 'center',
  },
  wideRight: { flex: 1, backgroundColor: colors.offWhite },
  wideScroll: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: space.huge,
  },
  panel: {
    width: '100%',
    maxWidth: 480,
    backgroundColor: colors.white,
    borderRadius: radii.xl,
    padding: space.xxxl,
    ...panelShadow,
  },

});
