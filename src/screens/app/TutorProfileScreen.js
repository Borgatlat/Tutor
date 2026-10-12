import React, { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  SafeAreaView, StatusBar, Image, Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../lib/supabase';
import useAuthStore from '../../store/useAuthStore';
import colors from '../../theme/colors';
import { radii, space, border, press, hit, rule, leaf } from '../../theme/layout';
import { modalShadow, cardShadow } from '../../theme/shadows';
import { heading, label, type } from '../../theme/fonts';
import SubjectBadge from '../../components/SubjectBadge';
import TutorBadge from '../../components/TutorBadge';
import { getTutorBadges } from '../../utils/badges';
import { SkeletonLines } from '../../components/SkeletonCard';
import RatingStars from '../../components/RatingStars';
import AvailabilityGrid from '../../components/AvailabilityGrid';
import ReportModal from '../../components/ReportModal';
import {
  Avatar, Button, EmptyState, IconButton, initialsOf,
  StatRow,
  OrganicBackdrop,
} from '../../components/ui';
import { useResponsive } from '../../hooks/useResponsive';

export default function TutorProfileScreen({ route, navigation }) {
  const { tutor: initialTutor } = route.params;
  const { profile: myProfile }  = useAuthStore();

  const [tutor, setTutor]        = useState(initialTutor);
  const [reviews, setReviews]    = useState([]);
  const [availability, setAvail] = useState([]);
  const [selectedSlot, setSlot]  = useState(null);
  const [loading, setLoading]    = useState(true);
  const [reportVisible, setReportVisible] = useState(false);

  const { isWide } = useResponsive();
  const isSelf = myProfile?.id === tutor.id;

  useEffect(() => { loadDetails(); }, []);

  const loadDetails = async () => {
    const [profileRes, reviewsRes, availRes, subjectsRes] = await Promise.all([
      supabase.from('profiles').select('*').eq('id', tutor.id).single(),
      supabase.from('reviews').select('*, reviewer:profiles!reviews_reviewer_id_fkey(full_name,avatar_url)').eq('tutor_id', tutor.id).order('created_at', { ascending: false }).limit(5),
      supabase.from('tutor_availability').select('period').eq('tutor_id', tutor.id),
      supabase.from('tutor_subjects').select('subject, grade').eq('tutor_id', tutor.id),
    ]);
    setTutor({
      ...tutor,
      ...profileRes.data,
      // subjects is array of { subject, grade }
      subjects: subjectsRes.data ?? tutor.subjects ?? [],
    });
    setReviews(reviewsRes.data ?? []);
    setAvail(availRes.data ?? []);
    setLoading(false);
  };

  const subjects = tutor.subjects ?? [];

  const stats = [
    { icon: 'checkmark-circle-outline', val: tutor.session_count ?? 0, lbl: 'Sessions' },
    { icon: 'book-outline',             val: subjects.length,          lbl: 'Subjects' },
    {
      icon: 'star-outline',
      val: tutor.avg_rating ? Number(tutor.avg_rating).toFixed(1) : 'New',
      lbl: 'Rating',
    },
  ];

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" backgroundColor={colors.brand} />

      {/* Nav bar */}
      <View style={styles.navBar}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => navigation.goBack()}
          hitSlop={hit.slop}
          activeOpacity={press.opacity}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <Ionicons name="chevron-back" size={22} color={colors.white} />
          <Text style={styles.backText}>Back</Text>
        </TouchableOpacity>

        {!isSelf ? (
          <View style={styles.navActions}>
            <IconButton
              icon="mail-outline"
              label={`Email ${tutor.full_name}`}
              onPress={() => tutor.email && Linking.openURL(`mailto:${tutor.email}`)}
              size={18}
              color={colors.white}
              style={styles.navBtn}
            />
            <IconButton
              icon="flag-outline"
              label="Report or block this user"
              onPress={() => setReportVisible(true)}
              size={18}
              color={colors.white}
              style={styles.navBtn}
            />
          </View>
        ) : null}
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Profile hero */}
        <View style={styles.hero}>
          <OrganicBackdrop />
          <View style={styles.heroAvatarRing}>
            <Avatar
              uri={tutor.avatar_url}
              name={tutor.full_name}
              size={82}
              color={colors.accentLight}
            />
          </View>
          <View style={styles.heroRule} />
          <Text style={styles.heroName}>{tutor.full_name}</Text>
          <Text style={styles.heroEmail}>{tutor.email}</Text>
          {tutor.phone ? <Text style={styles.heroPhone}>{tutor.phone}</Text> : null}
          <RatingStars rating={tutor.avg_rating} count={tutor.review_count} size={15} onDark />
          {getTutorBadges(tutor).length ? (
            <View style={styles.heroBadges}>
              {getTutorBadges(tutor).map((b) => <TutorBadge key={b.key} badge={b} onDark />)}
            </View>
          ) : null}
        </View>

        {/* "At a glance" stats, as on the school site */}
        <View style={styles.statsBar}>
          <StatRow
            title="At a glance"
            stats={stats.map((s) => ({ value: String(s.val), label: s.lbl }))}
          />
        </View>

        {/* Body: two columns on desktop, stacked on mobile */}
        <View style={[styles.body, isWide && styles.bodyWide]}>
          <View style={[styles.col, isWide && styles.colFlex]}>
            {tutor.bio ? (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>About</Text>
                <Text style={styles.bio}>{tutor.bio}</Text>
              </View>
            ) : null}

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Subjects</Text>
              {subjects.length ? (
                <View style={styles.badgeRow}>
                  {subjects.map((s) => {
                    const name  = typeof s === 'object' ? s.subject : s;
                    const grade = typeof s === 'object' ? s.grade   : undefined;
                    return <SubjectBadge key={name} subject={name} grade={grade} />;
                  })}
                </View>
              ) : (
                <EmptyState
                  icon="book-outline"
                  title="No subjects listed yet"
                  actionLabel={isSelf ? 'Add subjects' : undefined}
                  onAction={isSelf ? () => navigation.navigate('Profile') : undefined}
                  compact
                />
              )}
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Free blocks</Text>
              <Text style={styles.sectionHint}>
                {isSelf
                  ? 'Your free blocks'
                  : 'Pick a block to book it'}
              </Text>

              {!loading ? (
                <AvailabilityGrid
                  availability={availability}
                  highlightSlot={selectedSlot}
                  onSelectSlot={isSelf ? undefined : (_d, period) => setSlot({ period })}
                  emptyLabel={
                    isSelf
                      ? "You haven't set any free blocks yet"
                      : 'No free blocks set yet'
                  }
                />
              ) : (
                <SkeletonLines count={1} />
              )}
            </View>
          </View>

          <View style={[styles.col, isWide && styles.colFlex]}>
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Reviews</Text>

              {loading ? (
                <SkeletonLines count={3} />
              ) : reviews.length ? (
                reviews.map((r) => (
                  <View key={r.id} style={styles.reviewCard}>
                    <View style={styles.reviewTop}>
                      {r.reviewer?.avatar_url ? (
                        <Image source={{ uri: r.reviewer.avatar_url }} style={styles.reviewAvatar} />
                      ) : (
                        <View style={styles.reviewAvatarFallback}>
                          <Text style={styles.reviewInitials}>
                            {initialsOf(r.reviewer?.full_name)}
                          </Text>
                        </View>
                      )}
                      <View style={styles.reviewMeta}>
                        <Text style={styles.reviewAuthor}>
                          {r.reviewer?.full_name ?? 'Anonymous'}
                        </Text>
                        <RatingStars rating={r.rating} size={12} showCount={false} />
                      </View>
                    </View>
                    {r.comment ? (
                      <Text style={styles.reviewComment}>{r.comment}</Text>
                    ) : null}
                  </View>
                ))
              ) : (
                <EmptyState
                  icon="chatbubble-outline"
                  title="No reviews yet"
                  body={
                    isSelf
                      ? 'Reviews from students you tutor will appear here.'
                      : 'Be the first to leave a review after your session.'
                  }
                  compact
                />
              )}
            </View>
          </View>
        </View>

        {/* Room for the book bar once it appears */}
        <View style={selectedSlot ? styles.bottomSpacer : styles.bottomSpacerShort} />
      </ScrollView>

      <ReportModal
        visible={reportVisible}
        onClose={() => setReportVisible(false)}
        reportedUser={tutor}
      />

      {/* Book bar: only appears once a block is picked */}
      {!isSelf && selectedSlot ? (
        <View style={styles.bookBar}>
          <View style={styles.bookText}>
            <Text style={styles.bookTitle}>Block {selectedSlot.period}</Text>
            <Text style={styles.bookSub}>Ready to book</Text>
          </View>
          <Button
            label="Book session"
            onPress={() => navigation.navigate('BookSession', { tutor, slot: selectedSlot })}
          />
        </View>
      ) : null}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.offWhite },

  navBar: {
    backgroundColor: colors.brand,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: space.lg,
    paddingVertical: space.sm,
  },
  backBtn:    { flexDirection: 'row', alignItems: 'center', gap: space.xs },
  backText:   { ...label.ui, color: colors.white, fontSize: 15 },
  navActions: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
  navBtn:     { borderWidth: 1, borderColor: colors.whiteAlpha[30] },

  // ── Hero ──────────────────────────────────────────────────────────────────
  hero: {
    overflow: 'hidden',
    backgroundColor: colors.brand,
    alignItems: 'center',
    paddingBottom: space.xxxl,
    paddingTop: space.xs,
    borderBottomLeftRadius: radii.xxl,
    borderBottomRightRadius: radii.xxl,
  },
  heroAvatarRing: {
    borderRadius: radii.pill,
    borderWidth: 3,
    borderColor: colors.white,
    marginBottom: space.md,
  },
  heroRule: {
    width: rule.width, height: rule.height, borderRadius: rule.radius,
    backgroundColor: colors.gold,
    marginBottom: space.md,
  },
  heroName:  { ...type.title, color: colors.white, marginBottom: space.xs },
  heroEmail: { color: colors.whiteAlpha[80], fontSize: 13, marginBottom: 2 },
  heroBadges: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: space.sm, marginTop: space.md },
  heroPhone: { color: colors.whiteAlpha[65], fontSize: 13, marginBottom: space.sm },

  // ── Stats ─────────────────────────────────────────────────────────────────
  // Floating card that overlaps the curved hero edge.
  statsBar: {
    backgroundColor: colors.surface,
    marginHorizontal: space.lg,
    marginTop: -space.xl,
    ...leaf.lg,
    ...cardShadow,
    padding: space.xl,
  },

  // ── Body ──────────────────────────────────────────────────────────────────
  body:     { padding: space.lg, gap: space.md },
  bodyWide: { flexDirection: 'row', alignItems: 'flex-start', gap: space.lg },
  col:      { gap: space.md },
  colFlex:  { flex: 1 },

  section: {
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    ...cardShadow,
    padding: space.xl,
  },
  sectionTitle: { ...type.heading, color: colors.black, marginBottom: space.sm },
  sectionHint:  { ...type.small, color: colors.gray500, marginBottom: space.sm },
  bio:          { ...type.body, color: colors.gray700 },
  badgeRow:     { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm },

  // ── Reviews ───────────────────────────────────────────────────────────────
  reviewCard: {
    backgroundColor: colors.offWhite,
    borderRadius: radii.sm,
    padding: space.md,
    marginBottom: space.sm,
  },
  reviewTop:    { flexDirection: 'row', alignItems: 'center', gap: space.sm, marginBottom: space.sm },
  reviewAvatar: { width: 36, height: 36, borderRadius: radii.pill },
  reviewAvatarFallback: {
    width: 36, height: 36, borderRadius: radii.pill,
    backgroundColor: colors.brand,
    alignItems: 'center', justifyContent: 'center',
  },
  reviewInitials: { color: colors.white, fontWeight: '700', fontSize: 12 },
  reviewMeta:     { flex: 1 },
  reviewAuthor:   { ...type.small, fontWeight: '700', color: colors.black, marginBottom: 2 },
  reviewComment:  { ...type.small, color: colors.gray700 },

  bottomSpacer:      { height: 120 },
  bottomSpacerShort: { height: space.xxxl },

  // ── Sticky book bar ───────────────────────────────────────────────────────
  bookBar: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: colors.surface,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: space.md,
    paddingHorizontal: space.xl,
    paddingTop: space.md,
    paddingBottom: space.xxl,
    borderTopWidth: border.hairline,
    borderTopColor: colors.gray200,
    ...modalShadow,
  },
  bookText:  { flex: 1 },
  bookTitle: { ...type.body, fontWeight: '700', color: colors.black },
  bookSub:   { ...type.small, color: colors.gray500 },
});
