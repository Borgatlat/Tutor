import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, StatusBar,
  FlatList, TouchableOpacity, ActivityIndicator, Animated, Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../lib/supabase';
import { toUserMessage } from '../../utils/errors';
import useAuthStore from '../../store/useAuthStore';
import colors from '../../theme/colors';
import { radii, space, border, press, hit } from '../../theme/layout';
import { sheetShadow } from '../../theme/shadows';
import { heading } from '../../theme/fonts';
import SessionCard from '../../components/SessionCard';
import {
  Button, EmptyState, ErrorBanner, Field, Sheet,
} from '../../components/ui';
import { addSessionToCalendar, getSessionTimeLabel } from '../../utils/calendar';
import { useResponsive } from '../../hooks/useResponsive';

const TABS = ['Upcoming', 'Past'];
const useNativeDriver = Platform.OS !== 'web';

export default function SessionsScreen({ navigation }) {
  const { profile } = useAuthStore();
  const { isWide, columns } = useResponsive();
  const [tab, setTab]           = useState('Upcoming');
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading]   = useState(true);

  // Which session has a request in flight - disables that card's actions so
  // Confirm/Decline can't be double-tapped.
  const [busyId, setBusyId] = useState(null);

  // Cancel confirm sheet
  const [cancelConfirmId, setCancelConfirmId] = useState(null);
  const [cancelling, setCancelling]           = useState(false);

  // Review modal state
  const [reviewSession, setReviewSession] = useState(null);
  const [stars, setStars]                 = useState(5);
  const [comment, setComment]             = useState('');
  const [submitting, setSubmitting]       = useState(false);
  const [reviewError, setReviewError]     = useState('');

  // Calendar - tracks which session IDs have been added
  const [calendarAdded, setCalendarAdded] = useState(new Set());
  const [toast, setToast]                 = useState(null); // { message, isError }
  const toastOpacity = useRef(new Animated.Value(0)).current;

  const showToast = (message, isError = false) => {
    setToast({ message, isError });
    Animated.sequence([
      Animated.timing(toastOpacity, { toValue: 1, duration: 200, useNativeDriver }),
      Animated.delay(2800),
      Animated.timing(toastOpacity, { toValue: 0, duration: 300, useNativeDriver }),
    ]).start(() => setToast(null));
  };

  const handleAddToCalendar = async (session) => {
    const isTutor   = session.tutor_id === profile?.id;
    const otherUser = isTutor ? session.student : session.tutor;
    const otherName = otherUser?.full_name ?? 'your tutor';

    const { success, error } = await addSessionToCalendar(session, otherName);
    if (success) {
      setCalendarAdded((prev) => new Set([...prev, session.id]));
      const timeLabel = getSessionTimeLabel(session.session_date, session.period);
      const msg = Platform.OS === 'web'
        ? `Calendar file downloaded · ${timeLabel}`
        : `Added to calendar · ${timeLabel}`;
      showToast(msg);
    } else {
      showToast(error ?? 'Could not add to calendar.', true);
    }
  };

  useEffect(() => { loadSessions(); }, [tab, profile?.id]);

  const loadSessions = useCallback(async () => {
    if (!profile?.id) return;
    setLoading(true);
    const statuses = tab === 'Upcoming'
      ? ['pending', 'confirmed']
      : ['completed', 'cancelled'];

    const { data, error } = await supabase
      .from('sessions')
      .select('*, tutor:profiles!sessions_tutor_id_fkey(id,full_name,avatar_url,email), student:profiles!sessions_student_id_fkey(id,full_name,avatar_url,email)')
      .or(`tutor_id.eq.${profile.id},student_id.eq.${profile.id}`)
      .in('status', statuses)
      // Upcoming reads soonest-first; history reads most-recent-first.
      .order('session_date', { ascending: tab === 'Upcoming' })
      .order('period',       { ascending: true });

    if (error && __DEV__) console.warn('[SessionsScreen] loadSessions:', error);

    // Check which past sessions the user has reviewed
    if (tab === 'Past' && data?.length) {
      const sessionIds = data.map((s) => s.id);
      const { data: myReviews } = await supabase
        .from('reviews')
        .select('session_id')
        .in('session_id', sessionIds)
        .eq('reviewer_id', profile.id);
      const reviewed = new Set(myReviews?.map((r) => r.session_id) ?? []);
      setSessions(data.map((s) => ({ ...s, reviewed: reviewed.has(s.id) })));
    } else {
      setSessions(data ?? []);
    }
    setLoading(false);
  }, [tab, profile?.id]);

  const handleConfirm = async (sessionId) => {
    setBusyId(sessionId);
    const { error } = await supabase
      .from('sessions').update({ status: 'confirmed' }).eq('id', sessionId);
    setBusyId(null);
    // Without this a rejected update just re-rendered the old row, so the tutor
    // tapped Confirm and nothing happened, with nothing explaining why.
    if (error) {
      showToast(toUserMessage(error, "We couldn't confirm that session."), true);
      return;
    }
    showToast('Session confirmed');
    loadSessions();
  };

  const handleCancel = (sessionId) => setCancelConfirmId(sessionId);

  const confirmCancel = async () => {
    if (!cancelConfirmId) return;
    setCancelling(true);
    const { error } = await supabase
      .from('sessions').update({ status: 'cancelled' }).eq('id', cancelConfirmId);
    setCancelling(false);
    setCancelConfirmId(null);
    if (error) {
      showToast(toUserMessage(error, "We couldn't cancel that session."), true);
      return;
    }
    showToast('Session cancelled');
    loadSessions();
  };

  const closeReview = () => {
    setReviewSession(null);
    setStars(5);
    setComment('');
    setReviewError('');
  };

  const handleReviewSubmit = async () => {
    if (!reviewSession) return;
    setSubmitting(true);
    setReviewError('');
    const { error } = await supabase.from('reviews').insert({
      session_id:  reviewSession.id,
      reviewer_id: profile.id,
      tutor_id:    reviewSession.tutor_id,
      rating:      stars,
      comment:     comment || null,
    });
    setSubmitting(false);
    // 23505 here means the one-review-per-session unique index fired.
    if (error) {
      setReviewError(toUserMessage(error, "You've already reviewed this session."));
      return;
    }
    closeReview();
    loadSessions();
  };

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" backgroundColor={colors.brand} />

      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Sessions</Text>
      </View>

      {/* Tabs */}
      <View style={styles.tabBar}>
        {TABS.map((t) => (
          <TouchableOpacity
            key={t}
            style={[styles.tab, tab === t && styles.tabActive]}
            onPress={() => setTab(t)}
            activeOpacity={press.opacity}
            accessibilityRole="tab"
            accessibilityLabel={`${t} sessions`}
            accessibilityState={{ selected: tab === t }}
          >
            <Text style={[styles.tabText, tab === t && styles.tabTextActive]}>{t}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading ? (
        <View style={styles.loader}>
          <ActivityIndicator color={colors.accent} size="large" />
        </View>
      ) : (
        <FlatList
          data={sessions}
          keyExtractor={(s) => s.id}
          key={columns}
          numColumns={columns}
          columnWrapperStyle={columns > 1 ? styles.columnWrapper : undefined}
          contentContainerStyle={[styles.list, isWide && styles.listWide]}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <EmptyState
              icon="calendar-outline"
              title={`No ${tab.toLowerCase()} sessions`}
              body={
                tab === 'Upcoming'
                  ? 'Book a session with a tutor and it will show up here.'
                  : 'Completed and cancelled sessions will appear here.'
              }
              actionLabel={tab === 'Upcoming' ? 'Find a Tutor' : undefined}
              onAction={tab === 'Upcoming' ? () => navigation.navigate('Search') : undefined}
            />
          }
          renderItem={({ item }) => (
            <View style={columns > 1 ? styles.gridItem : undefined}>
              <SessionCard
                session={item}
                currentUserId={profile?.id}
                busy={busyId === item.id}
                onConfirm={handleConfirm}
                onCancel={handleCancel}
                onReview={(s) => setReviewSession(s)}
                onAddToCalendar={handleAddToCalendar}
                calendarAdded={calendarAdded.has(item.id)}
              />
            </View>
          )}
        />
      )}

      {/* Cancel confirm sheet */}
      <Sheet
        visible={!!cancelConfirmId}
        onClose={() => setCancelConfirmId(null)}
      >
        <Ionicons
          name="alert-circle-outline"
          size={40}
          color={colors.error}
          style={styles.cancelIcon}
        />
        <Text style={styles.centerTitle}>Cancel this session?</Text>
        <Text style={styles.centerSub}>
          This action cannot be undone. The other person will be notified.
        </Text>
        <View style={styles.rowActions}>
          <Button
            label="Keep It"
            variant="neutral"
            onPress={() => setCancelConfirmId(null)}
            disabled={cancelling}
            style={styles.grow}
          />
          <Button
            label="Yes, Cancel"
            variant="dangerSolid"
            onPress={confirmCancel}
            loading={cancelling}
            style={styles.grow}
          />
        </View>
      </Sheet>

      {/* Review sheet */}
      <Sheet
        visible={!!reviewSession}
        onClose={closeReview}
        title="Leave a Review"
        subtitle={`How was your session with ${reviewSession?.tutor?.full_name ?? 'your tutor'}?`}
      >
        <View
          style={styles.starsRow}
          accessibilityRole="radiogroup"
          accessibilityLabel="Star rating"
        >
          {[1, 2, 3, 4, 5].map((s) => (
            <TouchableOpacity
              key={s}
              onPress={() => setStars(s)}
              hitSlop={hit.slop}
              activeOpacity={press.opacity}
              accessibilityRole="radio"
              accessibilityLabel={`${s} star${s === 1 ? '' : 's'}`}
              accessibilityState={{ selected: stars === s }}
            >
              <Ionicons
                name={s <= stars ? 'star' : 'star-outline'}
                size={32}
                color={colors.star}
              />
            </TouchableOpacity>
          ))}
        </View>

        <ErrorBanner message={reviewError} />

        <Field
          placeholder="Write a comment (optional)…"
          multiline
          numberOfLines={3}
          value={comment}
          onChangeText={setComment}
          accessibilityLabel="Review comment"
        />

        <View style={styles.rowActions}>
          <Button
            label="Cancel"
            variant="neutral"
            onPress={closeReview}
            disabled={submitting}
            style={styles.grow}
          />
          <Button
            label="Submit"
            onPress={handleReviewSubmit}
            loading={submitting}
            style={styles.grow}
          />
        </View>
      </Sheet>

      {/* Calendar toast */}
      {toast ? (
        <Animated.View
          style={[styles.toast, toast.isError && styles.toastError, { opacity: toastOpacity }]}
          accessibilityRole="alert"
        >
          <Ionicons
            name={toast.isError ? 'alert-circle' : 'checkmark-circle'}
            size={16}
            color={colors.white}
          />
          <Text style={styles.toastText} numberOfLines={2}>{toast.message}</Text>
        </Animated.View>
      ) : null}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.offWhite },

  header: {
    backgroundColor: colors.brand,
    paddingHorizontal: space.xl,
    paddingTop: space.sm,
    paddingBottom: space.lg,
  },
  headerTitle: { ...heading.lg, color: colors.white, fontSize: 26 },

  tabBar: {
    flexDirection: 'row',
    backgroundColor: colors.white,
    borderBottomWidth: border.hairline,
    borderBottomColor: colors.gray200,
  },
  tab:       { flex: 1, paddingVertical: space.lg, alignItems: 'center' },
  tabActive: { borderBottomWidth: 2, borderBottomColor: colors.accent },
  tabText:       { fontSize: 14, fontWeight: '600', color: colors.gray400 },
  tabTextActive: { color: colors.accent, fontWeight: '800' },

  loader: { flex: 1, alignItems: 'center', justifyContent: 'center' },

  list:          { padding: space.lg, paddingBottom: space.xxxl },
  listWide:      { maxWidth: 1100, alignSelf: 'center', width: '100%' },
  columnWrapper: { gap: space.md },
  gridItem:      { flex: 1 },

  // ── Sheet content ─────────────────────────────────────────────────────────
  cancelIcon:  { alignSelf: 'center', marginBottom: space.md },
  centerTitle: {
    ...heading.lg, fontSize: 20, color: colors.black,
    textAlign: 'center', marginBottom: space.sm,
  },
  centerSub: {
    fontSize: 14, color: colors.gray500,
    textAlign: 'center', lineHeight: 20, marginBottom: space.xxl,
  },
  rowActions: { flexDirection: 'row', gap: space.md },
  grow:       { flex: 1 },

  starsRow: {
    flexDirection: 'row',
    gap: space.sm,
    marginBottom: space.xl,
    justifyContent: 'center',
  },

  // ── Toast ─────────────────────────────────────────────────────────────────
  toast: {
    position: 'absolute',
    bottom: space.xxl,
    left: space.xl,
    right: space.xl,
    backgroundColor: colors.brand,
    borderRadius: radii.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
    paddingHorizontal: space.lg,
    paddingVertical: space.lg,
    zIndex: 99,
    ...sheetShadow,
  },
  toastError: { backgroundColor: colors.error },
  toastText: {
    flex: 1, color: colors.white, fontSize: 13,
    fontWeight: '600', lineHeight: 18,
  },
});
