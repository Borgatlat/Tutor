/**
 * ModerationScreen: tools for school moderators (profiles.is_moderator).
 *
 *   Hours    completed sessions waiting for a moderator to verify, so the
 *            service-hours log is officially signed in the app.
 *   Reports  reports students filed, to look into and mark reviewed.
 *
 * Everything here is also enforced by the database (moderator-only policies
 * and the check_session_update trigger), so the screen is a convenience,
 * not the security boundary.
 */
import React, { useCallback, useEffect, useState } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet, SafeAreaView, StatusBar, RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../lib/supabase';
import useAuthStore from '../../store/useAuthStore';
import colors from '../../theme/colors';
import { radii, space, press, hit } from '../../theme/layout';
import { type, label } from '../../theme/fonts';
import { cardShadow } from '../../theme/shadows';
import { sessionWhen } from '../../utils/schedule';
import { BLOCK_MINUTES, minutesToHours } from '../../utils/hours';
import { success, warn } from '../../utils/haptics';
import { Button, EmptyState, ErrorBanner, FadeIn } from '../../components/ui';

const TABS = ['Hours', 'Reports'];

export default function ModerationScreen({ navigation }) {
  const { profile } = useAuthStore();
  const [tab, setTab]         = useState('Hours');
  const [rows, setRows]       = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [busyId, setBusyId]   = useState(null);
  const [error, setError]     = useState('');

  const load = useCallback(async () => {
    setError('');
    const query = tab === 'Hours'
      ? supabase
          .from('sessions')
          .select('*, tutor:profiles!sessions_tutor_id_fkey(full_name), student:profiles!sessions_student_id_fkey(full_name)')
          .eq('status', 'completed')
          .is('verified_at', null)
          .order('session_date', { ascending: false })
      : supabase
          .from('reports')
          .select('*, reporter:profiles!reports_reporter_id_fkey(full_name), reported:profiles!reports_reported_user_id_fkey(full_name)')
          .eq('reviewed', false)
          .order('created_at', { ascending: false });
    const { data, error: e } = await query;
    if (e) setError(e.message);
    setRows(data ?? []);
    setLoading(false);
  }, [tab]);

  useEffect(() => { setLoading(true); load(); }, [load]);

  const onRefresh = async () => { setRefreshing(true); await load(); setRefreshing(false); };

  const act = async (id, update, table) => {
    setBusyId(id);
    const { error: e } = await supabase.from(table).update(update).eq('id', id);
    setBusyId(null);
    if (e) { warn(); setError(e.message); return; }
    success();
    setRows((list) => list.filter((r) => r.id !== id));
  };

  const verify   = (s) => act(s.id, { verified_at: new Date().toISOString() }, 'sessions');
  const resolve  = (r) => act(r.id, { reviewed: true, reviewed_by: profile.id, reviewed_at: new Date().toISOString() }, 'reports');

  const renderHours = ({ item, index }) => (
    <FadeIn index={index} style={styles.card}>
      <View style={styles.cardTop}>
        <View style={styles.flex}>
          <Text style={styles.title}>{item.tutor?.full_name ?? 'Tutor'}</Text>
          <Text style={styles.meta}>
            Tutored {item.student?.full_name ?? 'a student'} · {item.subject}
          </Text>
          <Text style={styles.meta}>{sessionWhen(item)} · {minutesToHours(BLOCK_MINUTES)} h</Text>
        </View>
      </View>
      <Button
        label="Verify hours"
        icon="checkmark-done"
        size="sm"
        loading={busyId === item.id}
        onPress={() => verify(item)}
        accessibilityLabel={`Verify ${item.tutor?.full_name ?? 'tutor'}'s session on ${sessionWhen(item)}`}
      />
    </FadeIn>
  );

  const renderReport = ({ item, index }) => (
    <FadeIn index={index} style={styles.card}>
      <View style={styles.cardTop}>
        <View style={styles.flex}>
          <Text style={styles.title}>{item.reported?.full_name ?? 'A user'}</Text>
          <Text style={styles.reason}>{item.reason}</Text>
          {item.details ? <Text style={styles.details}>“{item.details}”</Text> : null}
          <Text style={styles.meta}>
            Reported by {item.reporter?.full_name ?? 'a student'} · {new Date(item.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
          </Text>
        </View>
      </View>
      <Button
        label="Mark reviewed"
        icon="checkmark"
        size="sm"
        variant="secondary"
        loading={busyId === item.id}
        onPress={() => resolve(item)}
        accessibilityLabel={`Mark the report about ${item.reported?.full_name ?? 'this user'} as reviewed`}
      />
    </FadeIn>
  );

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" backgroundColor={colors.brand} />
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.back}
          onPress={() => navigation.goBack()}
          hitSlop={hit.slop}
          activeOpacity={press.opacity}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <Ionicons name="chevron-back" size={22} color={colors.white} />
          <Text style={styles.backText}>Profile</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Moderator tools</Text>
        <Text style={styles.headerSub}>Verify service hours and review reports</Text>
      </View>

      {!profile?.is_moderator ? (
        <EmptyState icon="lock-closed-outline" title="Moderators only" body="Ask a teacher to give your account moderator access." />
      ) : (
        <>
          <View style={styles.tabBar} accessibilityRole="tablist">
            {TABS.map((t) => (
              <TouchableOpacity
                key={t}
                style={[styles.tab, tab === t && styles.tabActive]}
                onPress={() => setTab(t)}
                activeOpacity={press.opacity}
                accessibilityRole="tab"
                accessibilityState={{ selected: tab === t }}
              >
                <Text style={[styles.tabText, tab === t && styles.tabTextActive]}>{t}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <ErrorBanner message={error} style={styles.error} />

          <FlatList
            data={loading ? [] : rows}
            keyExtractor={(r) => r.id}
            renderItem={tab === 'Hours' ? renderHours : renderReport}
            contentContainerStyle={styles.list}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.brandText} />}
            ListHeaderComponent={!loading && rows.length ? (
              <Text style={styles.count}>
                {rows.length} {tab === 'Hours' ? `session${rows.length === 1 ? '' : 's'} to verify` : `open report${rows.length === 1 ? '' : 's'}`}
              </Text>
            ) : null}
            ListEmptyComponent={!loading ? (
              <EmptyState
                icon={tab === 'Hours' ? 'checkmark-done-outline' : 'shield-checkmark-outline'}
                title={tab === 'Hours' ? 'All hours verified' : 'No open reports'}
                body={tab === 'Hours'
                  ? 'Completed sessions will appear here for you to verify.'
                  : 'Reports from students will appear here.'}
              />
            ) : null}
          />
        </>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.offWhite },
  flex: { flex: 1 },

  header: {
    backgroundColor: colors.brand,
    paddingHorizontal: space.xl, paddingTop: space.md, paddingBottom: space.xl,
    borderBottomLeftRadius: radii.xxl, borderBottomRightRadius: radii.xxl,
  },
  back:        { flexDirection: 'row', alignItems: 'center', gap: space.xs, marginBottom: space.md },
  backText:    { ...label.ui, color: colors.white, fontSize: 15 },
  headerTitle: { ...type.title, color: colors.white },
  headerSub:   { ...type.small, color: colors.whiteAlpha[80], marginTop: 2 },

  tabBar: {
    flexDirection: 'row', backgroundColor: colors.cream,
    borderRadius: radii.pill, padding: space.xs,
    marginHorizontal: space.lg, marginTop: space.lg,
  },
  tab:           { flex: 1, paddingVertical: space.md, alignItems: 'center', borderRadius: radii.pill },
  tabActive:     { backgroundColor: colors.surface, ...cardShadow },
  tabText:       { ...label.ui, fontSize: 14, color: colors.gray500 },
  tabTextActive: { color: colors.brandText, fontWeight: '700' },

  error: { marginHorizontal: space.lg, marginTop: space.md },
  list:  { padding: space.lg, gap: space.md, paddingBottom: space.xxxl },
  count: { ...type.eyebrow, color: colors.gray500, marginBottom: space.xs },

  card: {
    backgroundColor: colors.surface, borderRadius: radii.lg,
    padding: space.lg, gap: space.md, ...cardShadow,
  },
  cardTop: { flexDirection: 'row' },
  title:   { ...type.body, fontWeight: '700', color: colors.black },
  meta:    { ...type.small, color: colors.gray500, marginTop: 2 },
  reason:  { ...type.small, fontWeight: '700', color: colors.errorText, marginTop: 2 },
  details: { ...type.small, color: colors.gray600, marginTop: 2 },
});
