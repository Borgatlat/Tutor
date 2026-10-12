/**
 * ChatScreen: the message thread for one session.
 *
 * Students and tutors talk here instead of swapping phone numbers or emails.
 * New messages arrive live (Supabase Realtime); sending is optimistic so the
 * bubble appears instantly and is swapped for the saved row a moment later.
 * Opened with { session } from a session card, or { sessionId } from a push
 * notification.
 */
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View, Text, FlatList, TextInput, TouchableOpacity, StyleSheet,
  SafeAreaView, StatusBar, KeyboardAvoidingView, Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../lib/supabase';
import useAuthStore from '../../store/useAuthStore';
import colors from '../../theme/colors';
import { radii, space, press, hit } from '../../theme/layout';
import { type, label } from '../../theme/fonts';
import { sessionWhen } from '../../utils/schedule';
import { tap, warn } from '../../utils/haptics';
import ReportModal from '../../components/ReportModal';
import { Avatar, ErrorBanner, IconButton, Mascot } from '../../components/ui';

const SESSION_SELECT =
  '*, tutor:profiles!sessions_tutor_id_fkey(id,full_name,avatar_url), student:profiles!sessions_student_id_fkey(id,full_name,avatar_url)';

const timeOf = (iso) =>
  new Date(iso).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });

export default function ChatScreen({ route, navigation }) {
  const { profile } = useAuthStore();
  const me = profile?.id;

  const [session, setSession]   = useState(route.params?.session ?? null);
  const sessionId               = session?.id ?? route.params?.sessionId;
  const [messages, setMessages] = useState([]);
  const [loaded, setLoaded]     = useState(false);
  const [draft, setDraft]       = useState('');
  const [error, setError]       = useState('');
  const [reportOpen, setReportOpen] = useState(false);
  const listRef = useRef(null);

  const other = session ? (session.tutor_id === me ? session.student : session.tutor) : null;
  const closed = session?.status === 'cancelled';

  // Load the session (when opened from a notification) and its messages.
  useEffect(() => {
    if (!sessionId) return;
    let alive = true;
    (async () => {
      if (!session) {
        const { data } = await supabase.from('sessions').select(SESSION_SELECT).eq('id', sessionId).single();
        if (alive && data) setSession(data);
      }
      const { data, error: e } = await supabase
        .from('messages')
        .select('*')
        .eq('session_id', sessionId)
        .order('created_at', { ascending: true });
      if (!alive) return;
      if (e) setError(`Couldn't load messages. ${e.message}`);
      setMessages(data ?? []);
      setLoaded(true);
    })();
    return () => { alive = false; };
  }, [sessionId]);

  // Live updates: add messages the other person sends while this is open.
  useEffect(() => {
    if (!sessionId) return undefined;
    const channel = supabase
      .channel(`messages:${sessionId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages', filter: `session_id=eq.${sessionId}` },
        ({ new: row }) => setMessages((list) => (list.some((m) => m.id === row.id) ? list : [...list, row])),
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [sessionId]);

  const scrollToEnd = useCallback(() => {
    requestAnimationFrame(() => listRef.current?.scrollToEnd?.({ animated: true }));
  }, []);
  useEffect(scrollToEnd, [messages.length]);

  const send = async () => {
    const body = draft.trim();
    if (!body || !me || !sessionId) return;
    tap();
    setError('');
    setDraft('');
    const temp = { id: `temp-${Date.now()}`, session_id: sessionId, sender_id: me, body, created_at: new Date().toISOString(), pending: true };
    setMessages((list) => [...list, temp]);

    const { data, error: e } = await supabase
      .from('messages')
      .insert({ session_id: sessionId, sender_id: me, body })
      .select()
      .single();

    if (e) {
      warn();
      setMessages((list) => list.filter((m) => m.id !== temp.id));
      setDraft(body);
      setError(`Message not sent. ${e.message}`);
      return;
    }
    const saved = data?.id ? data : { ...temp, pending: false };
    setMessages((list) => {
      const withoutTemp = list.filter((m) => m.id !== temp.id);
      // Realtime may already have delivered the saved row.
      return withoutTemp.some((m) => m.id === saved.id) ? withoutTemp : [...withoutTemp, saved];
    });
  };

  const renderItem = ({ item, index }) => {
    const mine = item.sender_id === me;
    const prev = messages[index - 1];
    const grouped = prev && prev.sender_id === item.sender_id;
    return (
      <View style={[styles.row, mine ? styles.rowMine : styles.rowTheirs, grouped && styles.rowGrouped]}>
        <View
          style={[styles.bubble, mine ? styles.bubbleMine : styles.bubbleTheirs, item.pending && styles.bubblePending]}
          accessible
          accessibilityLabel={`${mine ? 'You' : other?.full_name ?? 'They'}: ${item.body}. ${timeOf(item.created_at)}`}
        >
          <Text style={[styles.body, mine && styles.bodyMine]}>{item.body}</Text>
          <Text style={[styles.time, mine && styles.timeMine]}>{item.pending ? 'Sending…' : timeOf(item.created_at)}</Text>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" backgroundColor={colors.brand} />

      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          hitSlop={hit.slop}
          activeOpacity={press.opacity}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <Ionicons name="chevron-back" size={24} color={colors.white} />
        </TouchableOpacity>
        <Avatar uri={other?.avatar_url} name={other?.full_name} size={38} color={colors.accentLight} />
        <View style={styles.headerText}>
          <Text style={styles.headerName} numberOfLines={1}>{other?.full_name ?? 'Messages'}</Text>
          {session ? (
            <Text style={styles.headerSub} numberOfLines={1}>{session.subject} · {sessionWhen(session)}</Text>
          ) : null}
        </View>
        {other ? (
          <IconButton
            icon="flag-outline"
            label={`Report ${other.full_name}`}
            onPress={() => setReportOpen(true)}
            size={18}
            color={colors.white}
          />
        ) : null}
      </View>

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <FlatList
          ref={listRef}
          data={messages}
          keyExtractor={(m) => String(m.id)}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          onContentSizeChange={scrollToEnd}
          ListHeaderComponent={
            <View style={styles.notice}>
              <Ionicons name="shield-checkmark-outline" size={14} color={colors.gray500} />
              <Text style={styles.noticeText}>
                Keep it about tutoring. Never share passwords. Reported chats can be read by a moderator.
              </Text>
            </View>
          }
          ListEmptyComponent={loaded ? (
            <View style={styles.empty}>
              <Mascot size={72} mood="happy" />
              <Text style={styles.emptyText}>
                Say hi and share what you'd like to work on.
              </Text>
            </View>
          ) : null}
        />

        <ErrorBanner message={error} />

        {closed ? (
          <Text style={styles.closed}>This session was cancelled, so the chat is closed.</Text>
        ) : (
          <View style={styles.composer}>
            <TextInput
              style={styles.input}
              value={draft}
              onChangeText={setDraft}
              placeholder="Write a message…"
              placeholderTextColor={colors.gray400}
              multiline
              maxLength={1000}
              accessibilityLabel="Message"
              onSubmitEditing={send}
              blurOnSubmit={false}
            />
            <TouchableOpacity
              style={[styles.send, !draft.trim() && styles.sendOff]}
              onPress={send}
              disabled={!draft.trim()}
              activeOpacity={press.opacity}
              accessibilityRole="button"
              accessibilityLabel="Send message"
            >
              <Ionicons name="arrow-up" size={20} color={colors.white} />
            </TouchableOpacity>
          </View>
        )}
      </KeyboardAvoidingView>

      {other ? (
        <ReportModal visible={reportOpen} onClose={() => setReportOpen(false)} reportedUser={other} />
      ) : null}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.offWhite },
  flex: { flex: 1 },

  header: {
    backgroundColor: colors.brand,
    flexDirection: 'row', alignItems: 'center', gap: space.md,
    paddingHorizontal: space.lg, paddingVertical: space.md,
  },
  headerText: { flex: 1 },
  headerName: { ...type.body, fontWeight: '700', color: colors.white },
  headerSub:  { ...type.small, color: colors.whiteAlpha[80] },

  list: { padding: space.lg, paddingBottom: space.md, flexGrow: 1 },

  notice: {
    flexDirection: 'row', gap: space.xs, alignItems: 'flex-start',
    backgroundColor: colors.cream, borderRadius: radii.sm,
    padding: space.md, marginBottom: space.lg,
  },
  noticeText: { ...type.small, color: colors.gray600, flex: 1 },

  empty:     { alignItems: 'center', marginTop: space.xxxl, gap: space.md },
  emptyText: { ...type.body, color: colors.gray500, textAlign: 'center' },

  row:        { flexDirection: 'row', marginTop: space.md },
  rowGrouped: { marginTop: 3 },
  rowMine:    { justifyContent: 'flex-end' },
  rowTheirs:  { justifyContent: 'flex-start' },
  bubble: {
    maxWidth: '80%',
    paddingHorizontal: space.md, paddingVertical: space.sm,
    borderRadius: radii.lg,
  },
  bubbleMine:    { backgroundColor: colors.brand, borderBottomRightRadius: 6 },
  bubbleTheirs:  { backgroundColor: colors.surface, borderBottomLeftRadius: 6 },
  bubblePending: { opacity: 0.6 },
  body:     { ...type.body, color: colors.black },
  bodyMine: { color: colors.white },
  time:     { fontSize: 11, color: colors.gray500, marginTop: 2, alignSelf: 'flex-end' },
  timeMine: { color: colors.whiteAlpha[80] },

  composer: {
    flexDirection: 'row', alignItems: 'flex-end', gap: space.sm,
    padding: space.md,
    backgroundColor: colors.surface,
    borderTopWidth: 1, borderTopColor: colors.lineSoft,
  },
  input: {
    ...type.body,
    flex: 1, maxHeight: 120,
    color: colors.black,
    backgroundColor: colors.offWhite,
    borderRadius: radii.lg,
    paddingHorizontal: space.lg, paddingTop: 10, paddingBottom: 10,
  },
  send: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: colors.brand,
    alignItems: 'center', justifyContent: 'center',
  },
  sendOff: { opacity: 0.4 },

  closed: { ...label.ui, fontSize: 13, color: colors.gray500, textAlign: 'center', padding: space.lg },
});
