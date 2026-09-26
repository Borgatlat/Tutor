import React, { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  SafeAreaView, StatusBar, Image, Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../lib/supabase';
import useAuthStore from '../../store/useAuthStore';
import colors from '../../theme/colors';
import { radii, space, border, press, hit } from '../../theme/layout';
import { modalShadow } from '../../theme/shadows';
import { heading } from '../../theme/fonts';
import SubjectBadge from '../../components/SubjectBadge';
import RatingStars from '../../components/RatingStars';
import AvailabilityGrid from '../../components/AvailabilityGrid';
import ReportModal from '../../components/ReportModal';
import {
  Avatar, Button, EmptyState, IconButton, initialsOf,
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
      val: tutor.avg_rating ? Number(tutor.avg_rating).toFixed(1) : '—',
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
          <View style={styles.heroAvatarRing}>
            <Avatar
              uri={tutor.avatar_url}
              name={tutor.full_name}
              size={82}
              color={colors.accent}
            />
          </View>
          <Text style={styles.heroName}>{tutor.full_name}</Text>
          <Text style={styles.heroEmail}>{tutor.email}</Text>
          {tutor.phone ? <Text style={styles.heroPhone}>{tutor.phone}</Text> : null}
          <RatingStars rating={tutor.avg_rating} count={tutor.review_count} size={15} />
        </View>

        {/* Stats bar */}
        <View style={styles.statsBar}>
          {stats.map((s, i) => (
            <React.Fragment key={s.lbl}>
              {i > 0 ? <View style={styles.statDivider} /> : null}
              <View style={styles.statItem}>
                <Ionicons name={s.icon} size={18} color={colors.accent} />
                <Text style={styles.statVal}>{s.val}</Text>
                <Text style={styles.statLbl}>{s.lbl}</Text>
              </View>
            </React.Fragment>
          ))}
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
                  compact
                />
              )}
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Free Blocks</Text>
              <Text style={styles.sectionHint}>
                {isSelf
                  ? 'Your free blocks'
                  : 'Tap a highlighted block to pick a time'}
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
              ) : null}
            </View>
          </View>

          <View style={[styles.col, isWide && styles.colFlex]}>
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Reviews</Text>

              {reviews.length ? (
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

        {/* Room for the sticky book bar */}
        <View style={styles.bottomSpacer} />
      </ScrollView>

      <ReportModal
        visible={reportVisible}
        onClose={() => setReportVisible(false)}
        reportedUser={tutor}
      />

      {/* Book CTA */}
      {!isSelf ? (
        <View style={styles.bookBar}>
          <View style={styles.bookText}>
            <Text style={styles.bookTitle}>
              {selectedSlot ? `Block ${selectedSlot.period}` : 'Select a block above'}
            </Text>
            <Text style={styles.bookSub}>
              {selectedSlot ? 'Ready to book' : 'Tap a free block to select it'}
            </Text>
          </View>
          <Button
            label="Book Session"
            disabled={!selectedSlot}
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
  backText:   { color: colors.white, fontSize: 15, fontWeight: '600' },
  navActions: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
  navBtn:     { backgroundColor: colors.whiteAlpha[18] },

  // ── Hero ──────────────────────────────────────────────────────────────────
  hero: {
    backgroundColor: colors.brand,
    alignItems: 'center',
    paddingBottom: space.xxl,
    paddingTop: space.xs,
  },
  heroAvatarRing: {
    borderRadius: radii.pill,
    borderWidth: 3,
    borderColor: colors.white,
    marginBottom: space.md,
  },
  heroName:  { ...heading.lg, color: colors.white, fontSize: 22, marginBottom: 3 },
  heroEmail: { color: colors.whiteAlpha[80], fontSize: 13, marginBottom: 2 },
  heroPhone: { color: colors.whiteAlpha[65], fontSize: 13, marginBottom: space.sm },

  // ── Stats ─────────────────────────────────────────────────────────────────
  statsBar: {
    flexDirection: 'row',
    backgroundColor: colors.white,
    paddingVertical: space.lg,
    borderBottomWidth: border.hairline,
    borderBottomColor: colors.gray200,
  },
  statItem:    { flex: 1, alignItems: 'center', gap: 3 },
  statVal:     { ...heading.md, fontSize: 18, color: colors.black },
  statLbl:     { fontSize: 11, color: colors.gray500 },
  statDivider: { width: 1, backgroundColor: colors.gray200 },

  // ── Body ──────────────────────────────────────────────────────────────────
  body:     { padding: space.lg, gap: space.md },
  bodyWide: { flexDirection: 'row', alignItems: 'flex-start', gap: space.lg },
  col:      { gap: space.md },
  colFlex:  { flex: 1 },

  section: {
    backgroundColor: colors.white,
    borderRadius: radii.lg,
    padding: space.lg,
  },
  sectionTitle: { ...heading.md, fontSize: 16, color: colors.black, marginBottom: space.sm },
  sectionHint:  { fontSize: 12, color: colors.gray500, marginBottom: space.sm },
  bio:          { fontSize: 14, color: colors.gray700, lineHeight: 22 },
  badgeRow:     { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm },

  // ── Reviews ───────────────────────────────────────────────────────────────
  reviewCard: {
    backgroundColor: colors.offWhite,
    borderRadius: radii.md,
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
  reviewAuthor:   { fontSize: 13, fontWeight: '700', color: colors.black, marginBottom: 2 },
  reviewComment:  { fontSize: 13, color: colors.gray700, lineHeight: 19 },

  bottomSpacer: { height: 120 },

  // ── Sticky book bar ───────────────────────────────────────────────────────
  bookBar: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: colors.white,
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
  bookTitle: { fontSize: 15, fontWeight: '800', color: colors.black },
  bookSub:   { fontSize: 12, color: colors.gray500, marginTop: 2 },
});
