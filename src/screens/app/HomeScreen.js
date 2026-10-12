import React, { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  SafeAreaView, StatusBar, RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { supabase, searchTutors } from '../../lib/supabase';
import useAuthStore from '../../store/useAuthStore';
import colors from '../../theme/colors';
import { radii, space, border, press, rule, leaf } from '../../theme/layout';
import { type, label } from '../../theme/fonts';
import { raised, cardShadow } from '../../theme/shadows';
import { school } from '../../theme/school';
import TutorCard from '../../components/TutorCard';
import SkeletonCard from '../../components/SkeletonCard';
import WelcomeTour from '../../components/WelcomeTour';
import GettingStarted from '../../components/GettingStarted';
import { Avatar, EmptyState, FadeIn, OrganicBackdrop, SectionHeader, StatRow, StatusPill } from '../../components/ui';
import { useResponsive } from '../../hooks/useResponsive';

export default function HomeScreen({ navigation }) {
  const { profile } = useAuthStore();
  const { isWide } = useResponsive();

  const [topTutors, setTopTutors]         = useState([]);
  const [upcomingSessions, setUpcoming]   = useState([]);
  const [loadingTutors, setLoadingTutors] = useState(true);
  const [community, setCommunity]         = useState(null);
  const [sessionsLoaded, setSessionsLoaded] = useState(false);

  const firstName = profile?.full_name?.split(' ')[0] ?? school.memberName;
  const hour      = new Date().getHours();
  const greeting  = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
  const isTutor   = profile?.role === 'tutor' || profile?.role === 'both';

  useEffect(() => { loadTopTutors(); loadUpcomingSessions(); loadCommunity(); }, []);

  const [refreshing, setRefreshing] = useState(false);
  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([loadTopTutors(), loadUpcomingSessions(), loadCommunity()]);
    setRefreshing(false);
  };

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

  // School-wide totals. Hidden if the RPC isn't deployed or fails; it's a
  // nice-to-have, never a blocker for the rest of Home.
  const loadCommunity = async () => {
    const { data, error } = await supabase.rpc('community_stats');
    const row = Array.isArray(data) ? data[0] : data;
    if (!error && row && Number(row.sessions_completed) > 0) setCommunity(row);
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
    setSessionsLoaded(true);
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
          color={s.tutor_id === profile?.id ? colors.accentLight : colors.brand}
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
      <View style={styles.promoRule} />
      <Text style={styles.promoTitle}>Core Classes, SAT & AP</Text>
      <Text style={styles.promoSub}>
        Algebra to AP Calc, with help from fellow {school.memberPlural}.
      </Text>
      <View style={styles.promoCta}>
        <Text style={styles.promoCtaText}>Browse tutors</Text>
      </View>
    </TouchableOpacity>
  );

  const impactSection = community ? (
    <View style={styles.section}>
      <StatRow
        title={`${school.memberPlural} helping ${school.memberPlural}`}
        stats={[
          { value: String(Number(community.hours_tutored)), label: 'Hours tutored' },
          { value: String(community.sessions_completed),    label: 'Sessions' },
          { value: String(community.active_tutors),         label: 'Tutors' },
        ]}
      />
    </View>
  ) : null;

  const sessionsSection = upcomingSessions.length > 0 ? (
    <View style={styles.section}>
      <SectionHeader
        ruled
        title="Upcoming sessions"
        actionLabel="See all"
        onAction={() => navigation.navigate('Sessions')}
      />
      {upcomingSessions.map(renderSessionRow)}
    </View>
  ) : sessionsLoaded ? (
    <View style={styles.section}>
      <EmptyState
        icon="calendar-outline"
        title="No upcoming sessions"
        body={isTutor
          ? 'Keep your free blocks up to date so students can book you.'
          : 'Find a tutor who is free when you are and book a block.'}
        actionLabel={isTutor ? 'Update free blocks' : 'Find a tutor'}
        onAction={() => navigation.navigate(isTutor ? 'Profile' : 'Search')}
        compact
      />
    </View>
  ) : null;

  // Tutor cards are already cards, so this section sits straight on the page
  // rather than inside another white panel.
  const tutorsSection = (
    <View>
      <SectionHeader
        ruled
        title="Top tutors"
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
          body={`Once ${school.memberPlural} add the subjects they can teach, they'll show up here.`}
          actionLabel="Browse search"
          onAction={() => navigation.navigate('Search')}
        />
      ) : (
        <View style={isWide ? styles.grid : undefined}>
          {topTutors.map((t, i) => (
            <FadeIn key={t.id} index={i} style={isWide ? styles.gridItem : undefined}>
              <TutorCard
                tutor={t}
                onPress={() => navigation.navigate('TutorProfile', { tutor: t })}
              />
            </FadeIn>
          ))}
        </View>
      )}
    </View>
  );

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" backgroundColor={colors.brand} />
      <WelcomeTour />

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.white}
            colors={[colors.brand]}
          />
        }
      >
        {/* Hero */}
        <View style={styles.hero}>
          <OrganicBackdrop />
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
              <Avatar
                uri={profile?.avatar_url}
                name={profile?.full_name}
                size={44}
                color={colors.accentLight}
              />
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
              <Ionicons name="search" size={17} color={colors.brandText} />
              <Text style={styles.qBtnText}>Find a tutor</Text>
            </TouchableOpacity>

            {isTutor ? (
              <TouchableOpacity
                style={styles.qBtn}
                onPress={() => navigation.navigate('Sessions')}
                activeOpacity={press.opacity}
                accessibilityRole="button"
                accessibilityLabel="My sessions"
              >
                <Ionicons name="calendar" size={17} color={colors.brandText} />
                <Text style={styles.qBtnText}>My sessions</Text>
              </TouchableOpacity>
            ) : null}
          </View>
        </View>

        {/* One content tree: the wrapper switches between two columns and a
            single stack, so the blocks themselves are never duplicated. */}
        <View style={[styles.body, isWide && styles.bodyWide]}>
          <View style={[styles.col, isWide && styles.colNarrow]}>
            <GettingStarted profile={profile} isTutor={isTutor} navigation={navigation} />
            {promoBanner}
            {impactSection ? <FadeIn>{impactSection}</FadeIn> : null}
            {sessionsSection ? <FadeIn>{sessionsSection}</FadeIn> : null}
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
  // Curved bottom edge so the green band flows into the page.
  hero: {
    overflow: 'hidden',
    backgroundColor: colors.brand,
    paddingHorizontal: space.xl,
    paddingTop: space.xl,
    paddingBottom: space.xxxl,
    borderBottomLeftRadius: radii.xxl,
    borderBottomRightRadius: radii.xxl,
  },
  heroRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: space.xl,
  },
  heroGreetingWrap: { flex: 1, marginRight: space.md },
  heroGreeting: {
    ...label.caps,
    fontSize: 10, letterSpacing: 2.4,
    color: colors.whiteAlpha[65],
    marginBottom: space.xs,
  },
  heroName: { ...type.title, color: colors.white },
  heroBadge: {
    borderRadius: radii.pill,
    borderWidth: 2, borderColor: colors.whiteAlpha[30],
  },

  quickActions: { flexDirection: 'row', gap: space.sm, flexWrap: 'wrap' },
  qBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: colors.surface,
    paddingHorizontal: space.lg, paddingVertical: space.md,
    borderRadius: radii.pill,
    ...raised('white'),
  },
  qBtnText: { ...label.ui, fontSize: 14, color: colors.brandText },

  // ── Body ──────────────────────────────────────────────────────────────────
  body:     { padding: space.lg, gap: space.lg },
  bodyWide: { flexDirection: 'row', alignItems: 'flex-start', padding: space.xl, gap: space.xl },
  col:       { gap: space.lg },
  colNarrow: { flex: 1 },
  colWide:   { flex: 1.4 },

  grid:     { flexDirection: 'row', flexWrap: 'wrap', gap: space.md },
  gridItem: { flex: 1, minWidth: 260 },

  section: {
    backgroundColor: colors.surface,
    padding: space.xl,
    borderRadius: radii.lg,
    ...cardShadow,
  },

  // ── Session rows ──────────────────────────────────────────────────────────
  sessionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: space.md,
    borderBottomWidth: border.hairline,
    borderBottomColor: colors.lineSoft,
  },
  sessionRowLast: { borderBottomWidth: 0, paddingBottom: 0 },
  sessionAvatar:  { marginRight: space.md },
  sessionInfo:    { flex: 1, marginRight: space.sm },
  sessionName:    { ...type.body, fontWeight: '700', color: colors.black },
  sessionDetail:  { ...type.small, color: colors.gray500, marginTop: 2 },

  // ── Promo banner ──────────────────────────────────────────────────────────
  // Light green panel with the gold rule, so it doesn't stack a second dark
  // block under the green header.
  promo: {
    backgroundColor: colors.brandTint,
    ...leaf.lg,
    padding: space.xxl,
  },
  promoRule: {
    width: rule.width, height: rule.height, borderRadius: rule.radius,
    backgroundColor: colors.gold,
    marginBottom: space.lg,
  },
  promoTitle: { ...type.heading, color: colors.brandText, marginBottom: space.xs },
  promoSub:   { ...type.small, color: colors.gray600 },
  promoCta: {
    alignSelf: 'flex-start',
    backgroundColor: colors.brand,
    borderRadius: radii.pill,
    ...raised('green'),
    // After raised(), which resets marginTop for its press offset.
    marginTop: space.lg,
    paddingHorizontal: space.xl,
    paddingVertical: space.md,
  },
  promoCtaText: { ...label.ui, fontSize: 14, color: colors.white },

  bottomSpacer: { height: space.xxxl },
});
