/**
 * AuthShell — the layout wrapper for every pre-app screen.
 *
 * Desktop (≥768): two columns — brand panel left, form card right.
 * Mobile: green brand band on top, form on white below.
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
import { heading, label } from '../../theme/fonts';
import { rule } from '../../theme/layout';
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
      <View style={styles.lockup}>
        <View style={[styles.badge, compact && styles.badgeCompact]}>
          <Ionicons name="school" size={compact ? 20 : 24} color={colors.white} />
        </View>
        <View>
          <Text style={styles.school}>STRAKE JESUIT</Text>
          <Text style={styles.schoolSub}>Peer Tutoring</Text>
        </View>
      </View>
      <View style={[styles.rule, compact && styles.ruleCompact]} />
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
  // No bottom padding here: it would show the green safe-area background
  // below the white form. The form itself pads its bottom.
  scroll: { flexGrow: 1 },

  // ── Brand ─────────────────────────────────────────────────────────────────
  lockup: { flexDirection: 'row', alignItems: 'center', gap: space.md },
  badge: {
    width: 48, height: 48, borderRadius: radii.sm,
    borderWidth: 1, borderColor: colors.whiteAlpha[30],
    alignItems: 'center', justifyContent: 'center',
  },
  badgeCompact: { width: 40, height: 40 },

  school: {
    color: colors.white,
    fontSize: 14, fontWeight: '800', letterSpacing: 0.6,
  },
  schoolSub: { color: colors.whiteAlpha[65], fontSize: 11, marginTop: 1 },

  // Short gold rule above the title, like the school site's section headings.
  rule: {
    width: rule.width + 8, height: rule.height,
    backgroundColor: colors.gold,
    marginTop: space.huge, marginBottom: space.lg,
  },
  ruleCompact: { width: rule.width, marginTop: space.xxl, marginBottom: space.md },
  title: {
    ...heading.xl,
    color: colors.white,
    fontSize: 44, lineHeight: 52,
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
    paddingBottom: space.huge,
    alignItems: 'flex-start',
  },
  // alignItems keeps the back button pinned left; without it the IconButton's
  // own centering wins inside a stretched row.
  heroTop: { alignSelf: 'stretch', alignItems: 'flex-start', marginBottom: space.lg },

  sheet: {
    flexGrow: 1,
    backgroundColor: colors.white,
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
    borderTopWidth: 4,
    borderTopColor: colors.brand,
    padding: space.xxxl,
    ...panelShadow,
  },

  featureList: { gap: space.lg, marginTop: space.huge },
  featureRow:  { flexDirection: 'row', alignItems: 'center', gap: space.md },
  featureIcon: {
    width: 36, height: 36, borderRadius: radii.sm,
    borderWidth: 1, borderColor: colors.whiteAlpha[30],
    alignItems: 'center', justifyContent: 'center',
  },
  featureText: { color: colors.whiteAlpha[80], fontSize: 14, lineHeight: 21, flex: 1 },
});
