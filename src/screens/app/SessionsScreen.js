import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, StatusBar,
  FlatList, TouchableOpacity, Modal, TextInput,
  ActivityIndicator, Animated, Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../lib/supabase';
import useAuthStore from '../../store/useAuthStore';
import colors from '../../theme/colors';
import { heading } from '../../theme/fonts';
import SessionCard from '../../components/SessionCard';
import { addSessionToCalendar, getSessionTimeLabel } from '../../utils/calendar';
import { useResponsive } from '../../hooks/useResponsive';

const TABS = ['Upcoming', 'Past'];
const useNativeDriver = Platform.OS !== 'web';

export default function SessionsScreen({ navigation }) {
  const { profile } = useAuthStore();
  const { isWide, columns } = useResponsive();
  const [tab, setTab]         = useState('Upcoming');
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);

  // Cancel confirm sheet
  const [cancelConfirmId, setCancelConfirmId] = useState(null);
  const [cancelling, setCancelling] = useState(false);

  // Review modal state
  const [reviewSession, setReviewSession] = useState(null);
  const [stars, setStars]       = useState(5);
  const [comment, setComment]   = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [reviewError, setReviewError] = useState('');

  // Calendar — tracks which session IDs have been added
  const [calendarAdded, setCalendarAdded] = useState(new Set());
  const [toast, setToast] = useState(null);   // { message, isError }
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
    const isTutor   = session.tutor_id  === profile?.id;
    const otherUser = isTutor ? session.student : session.tutor;
    const otherName = otherUser?.full_name ?? 'your tutor';

    const { success, error } = await addSessionToCalendar(session, otherName);
    if (success) {
      setCalendarAdded((prev) => new Set([...prev, session.id]));
      const timeLabel = getSessionTimeLabel(session.day, session.period);
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
    const upcoming = ['pending', 'confirmed'];
    const past     = ['completed', 'cancelled'];
    const statuses = tab === 'Upcoming' ? upcoming : past;

    const { data, error } = await supabase
      .from('sessions')
      .select('*, tutor:profiles!sessions_tutor_id_fkey(id,full_name,avatar_url,email), student:profiles!sessions_student_id_fkey(id,full_name,avatar_url,email)')
      .or(`tutor_id.eq.${profile.id},student_id.eq.${profile.id}`)
      .in('status', statuses)
      .order('created_at', { ascending: tab !== 'Upcoming' });

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
    await supabase.from('sessions').update({ status: 'confirmed' }).eq('id', sessionId);
    loadSessions();
  };

  const handleCancel = (sessionId) => {
    setCancelConfirmId(sessionId);
  };

  const confirmCancel = async () => {
    if (!cancelConfirmId) return;
    setCancelling(true);
    await supabase.from('sessions').update({ status: 'cancelled' }).eq('id', cancelConfirmId);
    setCancelling(false);
    setCancelConfirmId(null);
    loadSessions();
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
    if (error) { setReviewError(error.message); return; }
    setReviewSession(null);
    setStars(5);
    setComment('');
    setReviewError('');
    loadSessions();
  };

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" backgroundColor={colors.red} />

      {/* Header */}
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
          >
            <Text style={[styles.tabText, tab === t && styles.tabTextActive]}>{t}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* List */}
      {loading ? (
        <View style={styles.loader}>
          <ActivityIndicator color={colors.red} size="large" />
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
            <View style={styles.empty}>
              <Ionicons name="calendar-outline" size={52} color={colors.gray300} />
              <Text style={styles.emptyText}>No {tab.toLowerCase()} sessions</Text>
              {tab === 'Upcoming' && (
                <TouchableOpacity
                  style={styles.findBtn}
                  onPress={() => navigation.navigate('Search')}
                >
                  <Text style={styles.findBtnText}>Find a Tutor</Text>
                </TouchableOpacity>
              )}
            </View>
          }
          renderItem={({ item }) => (
            <View style={columns > 1 ? styles.gridItem : undefined}>
            <SessionCard
              session={item}
              currentUserId={profile?.id}
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
      <Modal visible={!!cancelConfirmId} transparent animationType="slide" onRequestClose={() => setCancelConfirmId(null)}>
        <View style={styles.modalOverlay}>
          <View style={styles.cancelSheet}>
            <View style={styles.cancelHandle} />
            <Ionicons name="alert-circle-outline" size={40} color={colors.error} style={{ alignSelf: 'center', marginBottom: 12 }} />
            <Text style={styles.cancelTitle}>Cancel this session?</Text>
            <Text style={styles.cancelSub}>This action cannot be undone. The tutor will be notified.</Text>
            <View style={styles.cancelBtns}>
              <TouchableOpacity
                style={styles.keepBtn}
                onPress={() => setCancelConfirmId(null)}
              >
                <Text style={styles.keepBtnText}>Keep It</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.cancelConfirmBtn, cancelling && { opacity: 0.6 }]}
                onPress={confirmCancel}
                disabled={cancelling}
              >
                {cancelling
                  ? <ActivityIndicator color={colors.white} size="small" />
                  : <Text style={styles.cancelConfirmBtnText}>Yes, Cancel</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Calendar toast notification */}
      {toast && (
        <Animated.View style={[styles.toast, toast.isError && styles.toastError, { opacity: toastOpacity }]}>
          <Ionicons
            name={toast.isError ? 'alert-circle' : 'checkmark-circle'}
            size={16}
            color={colors.white}
          />
          <Text style={styles.toastText} numberOfLines={2}>{toast.message}</Text>
        </Animated.View>
      )}

      {/* Review modal */}
      <Modal visible={!!reviewSession} transparent animationType="slide" onRequestClose={() => setReviewSession(null)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Leave a Review</Text>
            <Text style={styles.modalSub}>
              How was your session with {reviewSession?.tutor?.full_name}?
            </Text>

            {/* Stars picker */}
            <View style={styles.starsRow}>
              {[1, 2, 3, 4, 5].map((s) => (
                <TouchableOpacity key={s} onPress={() => setStars(s)}>
                  <Ionicons
                    name={s <= stars ? 'star' : 'star-outline'}
                    size={32}
                    color={colors.warning}
                  />
                </TouchableOpacity>
              ))}
            </View>

            <TextInput
              style={styles.commentInput}
              placeholder="Write a comment (optional)…"
              placeholderTextColor={colors.gray300}
              multiline
              numberOfLines={3}
              value={comment}
              onChangeText={setComment}
            />

            {reviewError ? (
              <View style={styles.reviewErrorBanner}>
                <Ionicons name="alert-circle" size={14} color={colors.error} />
                <Text style={styles.reviewErrorText}>{reviewError}</Text>
              </View>
            ) : null}

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.modalCancel}
                onPress={() => { setReviewSession(null); setReviewError(''); }}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalSubmit, submitting && { opacity: 0.6 }]}
                onPress={handleReviewSubmit}
                disabled={submitting}
              >
                {submitting
                  ? <ActivityIndicator color={colors.white} />
                  : <Text style={styles.modalSubmitText}>Submit</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:   { flex: 1, backgroundColor: colors.offWhite },
  header: { backgroundColor: colors.red, paddingHorizontal: 20, paddingTop: 10, paddingBottom: 18 },
  headerTitle: { color: colors.white, fontSize: 26, fontFamily: heading.lg.fontFamily, fontWeight: '800' },

  tabBar: {
    flexDirection: 'row',
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray100,
  },
  tab: { flex: 1, paddingVertical: 14, alignItems: 'center' },
  tabActive: { borderBottomWidth: 2.5, borderBottomColor: colors.red },
  tabText:       { fontSize: 14, fontWeight: '600', color: colors.gray400 },
  tabTextActive: { color: colors.red, fontWeight: '800' },

  loader: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  list:      { padding: 14, paddingBottom: 32 },
  listWide:  { maxWidth: 1100, alignSelf: 'center', width: '100%' },
  columnWrapper: { gap: 12 },
  gridItem:  { flex: 1 },
  empty:  { alignItems: 'center', paddingTop: 72 },
  emptyText: { fontSize: 16, fontWeight: '700', color: colors.gray500, marginTop: 14, marginBottom: 20 },
  findBtn:  { backgroundColor: colors.red, borderRadius: 14, paddingHorizontal: 24, paddingVertical: 12 },
  findBtnText: { color: colors.white, fontWeight: '800', fontSize: 14 },

  // Calendar toast
  toast: {
    position: 'absolute',
    bottom: 24,
    left: 20,
    right: 20,
    backgroundColor: colors.red,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 14,
    zIndex: 99,
    ...Platform.select({
      web:     { boxShadow: '0 3px 16px rgba(0,0,0,0.22)' },
      default: { shadowColor: '#000', shadowOpacity: 0.18, shadowRadius: 8, shadowOffset: { width: 0, height: 3 }, elevation: 6 },
    }),
  },
  toastError: { backgroundColor: colors.error },
  toastText: { flex: 1, color: colors.white, fontSize: 13, fontWeight: '600', lineHeight: 18 },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },

  // Cancel confirm sheet
  cancelSheet: {
    backgroundColor: colors.white,
    borderTopLeftRadius: 28, borderTopRightRadius: 28,
    padding: 28, paddingBottom: 40,
    alignItems: 'stretch',
  },
  cancelHandle: {
    width: 40, height: 4, borderRadius: 2,
    backgroundColor: colors.gray200,
    alignSelf: 'center', marginBottom: 20,
  },
  cancelTitle: { fontSize: 20, fontWeight: '800', color: colors.black, textAlign: 'center', marginBottom: 8 },
  cancelSub:   { fontSize: 14, color: colors.gray500, textAlign: 'center', lineHeight: 20, marginBottom: 24 },
  cancelBtns:  { flexDirection: 'row', gap: 12 },
  keepBtn: {
    flex: 1, borderWidth: 2, borderColor: colors.gray200, borderRadius: 14,
    paddingVertical: 14, alignItems: 'center',
  },
  keepBtnText: { color: colors.gray600, fontWeight: '700', fontSize: 15 },
  cancelConfirmBtn: {
    flex: 1, backgroundColor: colors.error, borderRadius: 14,
    paddingVertical: 14, alignItems: 'center',
  },
  cancelConfirmBtnText: { color: colors.white, fontWeight: '800', fontSize: 15 },

  reviewErrorBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: colors.errorMuted, borderRadius: 10,
    padding: 10, marginBottom: 12,
    borderWidth: 1, borderColor: colors.errorBorder,
  },
  reviewErrorText: { flex: 1, fontSize: 12, color: colors.error, fontWeight: '600' },

  modalCard: {
    backgroundColor: colors.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 28,
    paddingBottom: 40,
  },
  modalTitle: { fontSize: 20, fontWeight: '800', color: colors.black, marginBottom: 6 },
  modalSub:   { fontSize: 14, color: colors.gray500, marginBottom: 20 },
  starsRow:   { flexDirection: 'row', gap: 8, marginBottom: 20 },
  commentInput: {
    borderWidth: 1.5, borderColor: colors.gray200, borderRadius: 14,
    paddingHorizontal: 14, paddingVertical: 12,
    fontSize: 15, color: colors.black, backgroundColor: colors.offWhite,
    height: 88, textAlignVertical: 'top', marginBottom: 20,
  },
  modalActions:     { flexDirection: 'row', gap: 12 },
  modalCancel:      { flex: 1, borderWidth: 2, borderColor: colors.gray200, borderRadius: 14, paddingVertical: 14, alignItems: 'center' },
  modalCancelText:  { color: colors.gray500, fontWeight: '700', fontSize: 15 },
  modalSubmit:      { flex: 1, backgroundColor: colors.green, borderRadius: 14, paddingVertical: 14, alignItems: 'center' },
  modalSubmitText:  { color: colors.white, fontWeight: '800', fontSize: 15 },
});
