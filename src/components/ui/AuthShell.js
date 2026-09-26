/**
 * AuthShell — the layout wrapper for every pre-app screen.
 *
 * Desktop (≥768): two columns — brand panel left, form card right.
 * Mobile: brand hero on top, form in a rounded sheet below.
 *
 * On web the KeyboardAvoidingView is deliberately skipped: it collapses the
 * container on iPhone Safari and blocks input taps, and the browser already
 * handles keyboard avoidance natively.
 */
import React from 'react';
import {
  View, Text, StyleSheet, SafeAreaView,
  KeyboardAvoidingView, Platform, ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import colors from '../../theme/colors';
import { radii, space } from '../../theme/layout';
import { panelShadow } from '../../theme/shadows';
import { heading } from '../../theme/fonts';
import { useResponsive } from '../../hooks/useResponsive';

export default function AuthShell({
  title,
  subtitle,
  features,
  headerRight,
  children,
}) {
  const { isWide } = useResponsive();

  const brand = (compact) => (
    <>
      <View style={[styles.badge, compact && styles.badgeCompact]}>
        <Ionicons name="school" size={compact ? 30 : 36} color={colors.white} />
      </View>
      <Text style={styles.school}>STRAKE JESUIT</Text>
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

          {features?.length ? (
            <View style={styles.featureList}>
              {features.map((f) => (
                <View key={f.text} style={styles.featureRow}>
                  <View style={styles.featureIcon}>
                    <Ionicons name={f.icon} size={16} color={colors.white} />
                  </View>
                  <Text style={styles.featureText}>{f.text}</Text>
                </View>
              ))}
            </View>
          ) : null}
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
  safe: { flex: 1, backgroundColor: colors.brand },
  // flexGrow lets content fill the viewport minimum while still overflowing
  // enough for the ScrollView to actually scroll.
  scroll: { flexGrow: 1, paddingBottom: space.xxxl },

  // ── Brand ─────────────────────────────────────────────────────────────────
  badge: {
    width: 64, height: 64, borderRadius: radii.pill,
    backgroundColor: colors.accent,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: space.lg,
  },
  badgeCompact: { width: 56, height: 56, marginBottom: space.md },

  school: {
    color: colors.whiteAlpha[80],
    fontSize: 11, fontWeight: '700',
    letterSpacing: 2.5, marginBottom: space.sm,
  },
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
    ...Platform.select({ web: { minHeight: '100vh' }, default: {} }),
  },
  wideLeft: {
    flex: 1,
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

  featureList: { gap: space.lg, marginTop: space.huge },
  featureRow:  { flexDirection: 'row', alignItems: 'center', gap: space.md },
  featureIcon: {
    width: 36, height: 36, borderRadius: radii.md,
    backgroundColor: colors.whiteAlpha[18],
    alignItems: 'center', justifyContent: 'center',
  },
  featureText: { color: colors.whiteAlpha[80], fontSize: 14, flex: 1 },
});
