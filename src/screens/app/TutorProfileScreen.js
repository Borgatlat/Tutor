import React, { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  SafeAreaView, StatusBar, Image, Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../lib/supabase';
import useAuthStore from '../../store/useAuthStore';
import colors from '../../theme/colors';
import { heading } from '../../theme/fonts';
import SubjectBadge from '../../components/SubjectBadge';
import RatingStars from '../../components/RatingStars';
import AvailabilityGrid from '../../components/AvailabilityGrid';
import ReportModal from '../../components/ReportModal';

export default function TutorProfileScreen({ route, navigation }) {
  const { tutor: initialTutor } = route.params;
  const { profile: myProfile }  = useAuthStore();

  const [tutor, setTutor]       = useState(initialTutor);
  const [reviews, setReviews]   = useState([]);
  const [availability, setAvail] = useState([]);
  const [selectedSlot, setSlot]  = useState(null);
  const [loading, setLoading]   = useState(true);
  const [reportVisible, setReportVisible] = useState(false);

  const initials = tutor.full_name?.split(' ').map((w) => w[0]).slice(0, 2).join('') ?? '?';
  const isSelf   = myProfile?.id === tutor.id;

  useEffect(() => {
    loadDetails();
  }, []);

  const loadDetails = async () => {
    const [profileRes, reviewsRes, availRes, subjectsRes] = await Promise.all([
      supabase.from('profiles').select('*').eq('id', tutor.id).single(),
      supabase.from('reviews').select('*, reviewer:profiles!reviews_reviewer_id_fkey(full_name,avatar_url)').eq('tutor_id', tutor.id).order('created_at', { ascending: false }).limit(5),
      supabase.from('tutor_availability').select('day,period').eq('tutor_id', tutor.id),
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

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" backgroundColor={colors.red} />

      {/* Nav bar */}
      <View style={styles.navBar}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={22} color={colors.white} />
          <Text style={styles.backText}>Back</Text>
        </TouchableOpacity>
        {!isSelf && (
          <View style={styles.navActions}>
            <TouchableOpacity
                style={styles.contactBtn}
                onPress={() => tutor.email && Linking.openURL(`mailto:${tutor.email}`)}
              >
              <Ionicons name="mail-outline" size={18} color={colors.white} />
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.contactBtn, { marginLeft: 8 }]}
              onPress={() => setReportVisible(true)}
            >
              <Ionicons name="flag-outline" size={18} color={colors.white} />
            </TouchableOpacity>
          </View>
        )}
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Profile hero */}
        <View style={styles.profileHero}>
          {tutor.avatar_url ? (
            <Image source={{ uri: tutor.avatar_url }} style={styles.heroAvatar} />
          ) : (
            <View style={styles.heroAvatarPlaceholder}>
              <Text style={styles.heroInitials}>{initials}</Text>
            </View>
          )}
          <Text style={styles.heroName}>{tutor.full_name}</Text>
          <Text style={styles.heroEmail}>{tutor.email}</Text>
          {tutor.phone && (
            <Text style={styles.heroPhone}>{tutor.phone}</Text>
          )}
          <RatingStars rating={tutor.avg_rating} count={tutor.review_count} size={15} />
        </View>

        {/* Stats bar */}
        <View style={styles.statsBar}>
          {[
            { icon: 'checkmark-circle-outline', val: tutor.session_count ?? 0, lbl: 'Sessions' },
            { icon: 'book-outline',             val: (tutor.subjects ?? []).length,  lbl: 'Subjects' },
            { icon: 'star-outline',             val: tutor.avg_rating ? Number(tutor.avg_rating).toFixed(1) : '—', lbl: 'Rating' },
          ].map((s, i) => (
            <React.Fragment key={s.lbl}>
              {i > 0 && <View style={styles.statDivider} />}
              <View style={styles.statItem}>
                <Ionicons name={s.icon} size={18} color={colors.red} />
                <Text style={styles.statVal}>{s.val}</Text>
                <Text style={styles.statLbl}>{s.lbl}</Text>
              </View>
            </React.Fragment>
          ))}
        </View>

        {/* Bio */}
        {tutor.bio && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>About</Text>
            <Text style={styles.bio}>{tutor.bio}</Text>
          </View>
        )}

        {/* Subjects */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Subjects</Text>
          <View style={styles.badgeRow}>
            {(tutor.subjects ?? []).map((s) => (
              <SubjectBadge
                key={typeof s === 'object' ? s.subject : s}
                subject={typeof s === 'object' ? s.subject : s}
                grade={typeof s === 'object' ? s.grade : undefined}
              />
            ))}
          </View>
        </View>

        {/* Availability grid */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Availability</Text>
          <Text style={styles.gridHint}>
            {isSelf ? 'Your free periods' : 'Tap a green slot to book a session'}
          </Text>
          {!loading && (
            <AvailabilityGrid
              availability={availability}
              highlightSlot={selectedSlot}
              onSelectSlot={isSelf ? undefined : (d, p) => setSlot({ day: d, period: p })}
            />
          )}
        </View>

        {/* Reviews */}
        {reviews.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Reviews</Text>
            {reviews.map((r) => {
              const revInitials = r.reviewer?.full_name?.split(' ').map((w) => w[0]).slice(0, 2).join('') ?? '?';
              return (
                <View key={r.id} style={styles.reviewCard}>
                  <View style={styles.reviewTop}>
                    {r.reviewer?.avatar_url ? (
                      <Image source={{ uri: r.reviewer.avatar_url }} style={styles.reviewAvatar} />
                    ) : (
                      <View style={styles.reviewAvatarPlaceholder}>
                        <Text style={styles.reviewInitials}>{revInitials}</Text>
                      </View>
                    )}
                    <View style={{ flex: 1 }}>
                      <Text style={styles.reviewAuthor}>{r.reviewer?.full_name ?? 'Anonymous'}</Text>
                      <RatingStars rating={r.rating} size={12} showCount={false} />
                    </View>
                  </View>
                  {r.comment && <Text style={styles.reviewComment}>{r.comment}</Text>}
                </View>
              );
            })}
          </View>
        )}

        <View style={{ height: 120 }} />
      </ScrollView>

      {/* Report / Block modal */}
      <ReportModal
        visible={reportVisible}
        onClose={() => setReportVisible(false)}
        reportedUser={tutor}
      />

      {/* Book CTA */}
      {!isSelf && (
        <View style={styles.bookBar}>
          <View>
            <Text style={styles.bookTitle}>
              {selectedSlot
                ? `${selectedSlot.day} · Period ${selectedSlot.period}`
                : 'Select a slot above'}
            </Text>
            <Text style={styles.bookSub}>
              {selectedSlot ? 'Ready to book!' : 'Tap a green cell in the grid'}
            </Text>
          </View>
          <TouchableOpacity
            style={[styles.bookBtn, !selectedSlot && styles.bookBtnDisabled]}
            disabled={!selectedSlot}
            onPress={() => navigation.navigate('BookSession', { tutor, slot: selectedSlot })}
          >
            <Text style={styles.bookBtnText}>Book Session</Text>
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.offWhite },

  navBar: {
    backgroundColor: colors.red,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  backBtn:    { flexDirection: 'row', alignItems: 'center', gap: 4 },
  backText:   { color: colors.white, fontSize: 15, fontWeight: '600' },
  navActions: { flexDirection: 'row', alignItems: 'center' },
  contactBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.25)',
    alignItems: 'center', justifyContent: 'center',
  },

  profileHero: {
    backgroundColor: colors.red,
    alignItems: 'center',
    paddingBottom: 28,
    paddingTop: 4,
  },
  heroAvatar: { width: 88, height: 88, borderRadius: 44, marginBottom: 12, borderWidth: 3, borderColor: colors.white },
  heroAvatarPlaceholder: {
    width: 88, height: 88, borderRadius: 44,
    backgroundColor: 'rgba(255,255,255,0.3)',
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 12,
  },
  heroInitials: { color: colors.white, fontSize: 30, fontWeight: '800' },
  heroName:   { color: colors.white, fontSize: 22, fontFamily: heading.lg.fontFamily, fontWeight: '800', marginBottom: 3 },
  heroEmail:  { color: colors.white, fontSize: 13, opacity: 0.8, marginBottom: 2 },
  heroPhone:  { color: colors.white, fontSize: 13, opacity: 0.7, marginBottom: 8 },

  statsBar: {
    flexDirection: 'row',
    backgroundColor: colors.white,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray100,
  },
  statItem:    { flex: 1, alignItems: 'center', gap: 3 },
  statVal:     { fontSize: 18, fontFamily: heading.md.fontFamily, fontWeight: '800', color: colors.black },
  statLbl:     { fontSize: 11, color: colors.gray500 },
  statDivider: { width: 1, backgroundColor: colors.gray100 },

  section: {
    backgroundColor: colors.white,
    marginTop: 10,
    paddingHorizontal: 20,
    paddingVertical: 18,
  },
  sectionTitle: { fontSize: 16, fontWeight: '800', color: colors.black, marginBottom: 12 },
  bio:          { fontSize: 14, color: colors.gray700, lineHeight: 22 },
  gridHint:     { fontSize: 12, color: colors.gray400, marginBottom: 12 },
  badgeRow:     { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },

  reviewCard: {
    backgroundColor: colors.offWhite,
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
  },
  reviewTop: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8 },
  reviewAvatar: { width: 36, height: 36, borderRadius: 18 },
  reviewAvatarPlaceholder: { width: 36, height: 36, borderRadius: 18, backgroundColor: colors.red, alignItems: 'center', justifyContent: 'center' },
  reviewInitials: { color: colors.white, fontWeight: '700', fontSize: 12 },
  reviewAuthor:   { fontSize: 13, fontWeight: '700', color: colors.black, marginBottom: 2 },
  reviewComment:  { fontSize: 13, color: colors.gray700, lineHeight: 19 },

  bookBar: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: colors.white,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: 28,
    borderTopWidth: 1,
    borderTopColor: colors.gray100,
    ...require('../../theme/shadows').modalShadow,
  },
  bookTitle: { fontSize: 15, fontWeight: '800', color: colors.black },
  bookSub:   { fontSize: 12, color: colors.gray400, marginTop: 2 },
  bookBtn:   { backgroundColor: colors.red, paddingHorizontal: 24, paddingVertical: 14, borderRadius: 14 },
  bookBtnDisabled: { backgroundColor: colors.gray300 },
  bookBtnText: { color: colors.white, fontWeight: '800', fontSize: 15 },
});
