import React, { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  SafeAreaView, StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { supabase, searchTutors } from '../../lib/supabase';
import useAuthStore from '../../store/useAuthStore';
import colors from '../../theme/colors';
import { radii, space, border, press } from '../../theme/layout';
import { heading } from '../../theme/fonts';
import TutorCard from '../../components/TutorCard';
import SkeletonCard from '../../components/SkeletonCard';
import { Avatar, EmptyState, SectionHeader, StatusPill } from '../../components/ui';
import { useResponsive } from '../../hooks/useResponsive';

export default function HomeScreen({ navigation }) {
  const { profile } = useAuthStore();
  const { isWide } = useResponsive();

  const [topTutors, setTopTutors]         = useState([]);
  const [upcomingSessions, setUpcoming]   = useState([]);
  const [loadingTutors, setLoadingTutors] = useState(true);

  const firstName = profile?.full_name?.split(' ')[0] ?? 'Crusader';
  const hour      = new Date().getHours();
  const greeting  = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
  const isTutor   = profile?.role === 'tutor' || profile?.role === 'both';

  useEffect(() => { loadTopTutors(); loadUpcomingSessions(); }, []);

  const loadTopTutors = async () => {
    try {
      const data = await searchTutors({});
      setTopTutors(data.slice(0, isWide ? 8 : 5));
    } catch (e) {
      if (__DEV__) console.warn('[HomeScreen] loadTopTutors:', e);
    } finally {
      setLoadingTutors(false);
    }
  };

  const loadUpcomingSessions = async () => {
    if (!profile?.id) return;
    const { data } = await supabase
      .from('sessions')
      .select('*, tutor:profiles!sessions_tutor_id_fkey(full_name,avatar_url), student:profiles!sessions_student_id_fkey(full_name,avatar_url)')
      .or(`tutor_id.eq.${profile.id},student_id.eq.${profile.id}`)
      .in('status', ['pending', 'confirmed'])
      .limit(3);
    setUpcoming(data ?? []);
  };

  const renderSessionRow = (s, i, arr) => {
    const other = s.tutor_id === profile?.id ? s.student : s.tutor;

    return (
      <View
        key={s.id}
        style={[styles.sessionRow, i === arr.length - 1 && styles.sessionRowLast]}
      >
        <Avatar
          uri={other?.avatar_url}
          name={other?.full_name}
          size={40}
          color={s.tutor_id === profile?.id ? colors.accent : colors.brand}
          style={styles.sessionAvatar}
        />
        <View style={styles.sessionInfo}>
          <Text style={styles.sessionName} numberOfLines={1}>{other?.full_name}</Text>
          <Text style={styles.sessionDetail}>{s.subject} · Block {s.period}</Text>
        </View>
        <StatusPill status={s.status} />
      </View>
    );
  };

  // ── Content blocks, shared by both layouts ──────────────────────────────────
  const promoBanner = (
    <TouchableOpacity
      style={styles.promo}
      onPress={() => navigation.navigate('Search')}
      activeOpacity={press.opacity}
      accessibilityRole="button"
      accessibilityLabel="Browse tutors for core classes, SAT and AP"
    >
      <View style={styles.promoText}>
        <Text style={styles.promoLabel}>EVERY SUBJECT</Text>
        <Text style={styles.promoTitle}>Core Classes, SAT & AP</Text>
        <Text style={styles.promoSub}>
          Algebra to AP Calc — help from fellow Crusaders
        </Text>
      </View>
      <View style={styles.promoIcon}>
        <Ionicons name="ribbon" size={30} color={colors.white} />
      </View>
    </TouchableOpacity>
  );

  const sessionsSection = upcomingSessions.length > 0 ? (
    <View style={styles.section}>
      <SectionHeader
        title="Upcoming Sessions"
        actionLabel="See all"
        onAction={() => navigation.navigate('Sessions')}
      />
      {upcomingSessions.map(renderSessionRow)}
    </View>
  ) : null;

  const tutorsSection = (
    <View style={styles.section}>
      <SectionHeader
        title="Top Tutors"
        actionLabel="Browse all"
        onAction={() => navigation.navigate('Search')}
      />

      {loadingTutors ? (
        <View style={isWide ? styles.grid : undefined}>
          {[1, 2, 3, 4].slice(0, isWide ? 4 : 3).map((i) => (
            <View key={i} style={isWide ? styles.gridItem : undefined}>
              <SkeletonCard />
            </View>
          ))}
        </View>
      ) : topTutors.length === 0 ? (
        <EmptyState
          icon="people-outline"
          title="No tutors yet"
          body="Once Crusaders add the subjects they can teach, they'll show up here."
          actionLabel="Browse search"
          onAction={() => navigation.navigate('Search')}
        />
      ) : (
        <View style={isWide ? styles.grid : undefined}>
          {topTutors.map((t) => (
            <View key={t.id} style={isWide ? styles.gridItem : undefined}>
              <TutorCard
                tutor={t}
                onPress={() => navigation.navigate('TutorProfile', { tutor: t })}
              />
            </View>
          ))}
        </View>
      )}
    </View>
  );

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" backgroundColor={colors.brand} />

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Hero */}
        <View style={styles.hero}>
          <View style={styles.heroRow}>
            <View style={styles.heroGreetingWrap}>
              <Text style={styles.heroGreeting}>{greeting},</Text>
              <Text style={styles.heroName} numberOfLines={1}>{firstName}</Text>
            </View>

            <TouchableOpacity
              style={styles.heroBadge}
              onPress={() => navigation.navigate('Profile')}
              activeOpacity={press.opacity}
              accessibilityRole="button"
              accessibilityLabel="Open your profile"
            >
              {profile?.avatar_url ? (
                <Avatar uri={profile.avatar_url} name={profile.full_name} size={44} />
              ) : (
                <Ionicons name="person" size={22} color={colors.white} />
              )}
            </TouchableOpacity>
          </View>

          <View style={styles.quickActions}>
            <TouchableOpacity
              style={styles.qBtn}
              onPress={() => navigation.navigate('Search')}
              activeOpacity={press.opacity}
              accessibilityRole="button"
              accessibilityLabel="Find a tutor"
            >
              <Ionicons name="search" size={17} color={colors.brand} />
              <Text style={styles.qBtnText}>Find a Tutor</Text>
            </TouchableOpacity>

            {isTutor ? (
              <TouchableOpacity
                style={styles.qBtn}
                onPress={() => navigation.navigate('Sessions')}
                activeOpacity={press.opacity}
                accessibilityRole="button"
                accessibilityLabel="My sessions"
              >
                <Ionicons name="calendar" size={17} color={colors.brand} />
                <Text style={styles.qBtnText}>My Sessions</Text>
              </TouchableOpacity>
            ) : null}
          </View>
        </View>

        {/* One content tree — the wrapper switches between two columns and a
            single stack, so the blocks themselves are never duplicated. */}
        <View style={[styles.body, isWide && styles.bodyWide]}>
          <View style={[styles.col, isWide && styles.colNarrow]}>
            {promoBanner}
            {sessionsSection}
          </View>
          <View style={[styles.col, isWide && styles.colWide]}>
            {tutorsSection}
          </View>
        </View>

        <View style={styles.bottomSpacer} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.offWhite },

  // ── Hero ──────────────────────────────────────────────────────────────────
  hero: {
    backgroundColor: colors.brand,
    paddingHorizontal: space.xl,
    paddingTop: space.lg,
    paddingBottom: space.xxl,
  },
  heroRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: space.xl,
  },
  heroGreetingWrap: { flex: 1, marginRight: space.md },
  heroGreeting: { color: colors.whiteAlpha[80], fontSize: 14 },
  heroName: {
    ...heading.lg,
    color: colors.white,
    fontSize: 26,
  },
  heroBadge: {
    width: 44, height: 44, borderRadius: radii.pill,
    backgroundColor: colors.whiteAlpha[18],
    alignItems: 'center', justifyContent: 'center',
    overflow: 'hidden',
  },

  quickActions: { flexDirection: 'row', gap: space.sm, flexWrap: 'wrap' },
  qBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: colors.white,
    paddingHorizontal: space.lg, paddingVertical: space.sm,
    borderRadius: radii.pill,
  },
  qBtnText: { fontWeight: '700', fontSize: 14, color: colors.brand },

  // ── Body ──────────────────────────────────────────────────────────────────
  body:     { padding: space.lg, gap: space.lg },
  bodyWide: { flexDirection: 'row', alignItems: 'flex-start', padding: space.xl, gap: space.xl },
  col:       { gap: space.lg },
  colNarrow: { flex: 1 },
  colWide:   { flex: 1.4 },

  grid:     { flexDirection: 'row', flexWrap: 'wrap', gap: space.md },
  gridItem: { flex: 1, minWidth: 260 },

  section: {
    backgroundColor: colors.white,
    padding: space.lg,
    borderRadius: radii.lg,
  },

  // ── Session rows ──────────────────────────────────────────────────────────
  sessionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: space.md,
    borderBottomWidth: border.hairline,
    borderBottomColor: colors.gray200,
  },
  sessionRowLast: { borderBottomWidth: 0, paddingBottom: 0 },
  sessionAvatar:  { marginRight: space.md },
  sessionInfo:    { flex: 1, marginRight: space.sm },
  sessionName:    { fontSize: 14, fontWeight: '700', color: colors.black },
  sessionDetail:  { fontSize: 12, color: colors.gray500, marginTop: 1 },

  // ── Promo banner ──────────────────────────────────────────────────────────
  promo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.accent,
    borderRadius: radii.lg,
    padding: space.xl,
    gap: space.md,
  },
  promoText:  { flex: 1 },
  promoLabel: {
    color: colors.whiteAlpha[80], fontSize: 10,
    fontWeight: '700', letterSpacing: 1.5, marginBottom: space.xs,
  },
  promoTitle: { color: colors.white, fontSize: 19, fontWeight: '800', marginBottom: 2 },
  promoSub:   { color: colors.whiteAlpha[80], fontSize: 12, lineHeight: 17 },
  promoIcon: {
    width: 56, height: 56, borderRadius: radii.pill,
    backgroundColor: colors.whiteAlpha[18],
    alignItems: 'center', justifyContent: 'center',
  },

  bottomSpacer: { height: space.xxxl },
});
