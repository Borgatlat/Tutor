/**
 * OllieChat: "Ask Ollie" in a bottom sheet.
 *
 * The student types what they need ("chem during B3", "APUSH at lunch") and
 * ask_ollie (migration 008) answers with a fixed sentence and up to three
 * tutors. Ollie's AI (OpenAI) only reads the message once the student ticks
 * the consent box; without it Ollie still works by matching keywords. The
 * chat lives in this component only and is never saved.
 */
import React, { useEffect, useRef, useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../lib/supabase';
import useAuthStore from '../store/useAuthStore';
import colors from '../theme/colors';
import { radii, space, press, hit } from '../theme/layout';
import { type } from '../theme/fonts';
import { school } from '../theme/school';
import { OLLIE_CONSENT_TEXT } from '../constants';
import { blockLabel } from '../utils/schedule';
import AppTextInput from './AppTextInput';
import { Avatar, Button, IconButton, Mascot, Sheet } from './ui';

const GREETING = {
  from: 'ollie',
  text: `Hi, I'm ${school.mascotName}! Tell me the class you need help with and when you're free, `
    + 'like "Chemistry during B3", and I\'ll find tutors for you.',
};

function TutorRow({ tutor, onPress }) {
  const subjects = (tutor.subjects ?? []).map((s) => s.subject).slice(0, 2).join(', ');
  const blocks = (tutor.availability ?? []).map((a) => blockLabel(a.period)).join(', ');
  const rating = Number(tutor.avg_rating) > 0 ? `★ ${Number(tutor.avg_rating).toFixed(1)} · ` : '';
  return (
    <TouchableOpacity
      style={styles.tutor}
      onPress={onPress}
      activeOpacity={press.opacity}
      accessibilityRole="button"
      accessibilityLabel={`View ${tutor.full_name}'s profile`}
    >
      <Avatar uri={tutor.avatar_url} name={tutor.full_name} size={36} />
      <View style={styles.flex}>
        <Text style={styles.tutorName} numberOfLines={1}>{tutor.full_name}</Text>
        <Text style={styles.tutorMeta} numberOfLines={1}>
          {rating}{subjects}{blocks ? ` · Free ${blocks}` : ''}
        </Text>
      </View>
      <Ionicons name="chevron-forward" size={18} color={colors.gray400} />
    </TouchableOpacity>
  );
}

export default function OllieChat({ visible, onClose, navigation }) {
  const { profile, refreshProfile } = useAuthStore();
  const aiOn = !!profile?.ai_opt_in;

  // The consent step shows until the student chooses, once per app session.
  const [chose, setChose]       = useState(aiOn);
  const [agree, setAgree]       = useState(false);
  const [saving, setSaving]     = useState(false);
  const [saveError, setSaveError] = useState('');
  const [messages, setMessages] = useState([GREETING]);
  const [draft, setDraft]       = useState('');
  const [busy, setBusy]         = useState(false);
  const scrollRef = useRef(null);

  useEffect(() => { if (aiOn) setChose(true); }, [aiOn]);

  const setAi = async (on) => {
    setSaving(true);
    setSaveError('');
    const { error } = await supabase.from('profiles').update({ ai_opt_in: on }).eq('id', profile?.id);
    setSaving(false);
    if (error) {
      setSaveError(`Couldn't save that: ${error.message}`);
      return false;
    }
    refreshProfile();
    return true;
  };

  const start = async (withAi) => {
    if (withAi && !(await setAi(true))) return;
    setChose(true);
  };

  const turnOff = async () => {
    if (await setAi(false)) { setAgree(false); setChose(false); }
  };

  const send = async () => {
    const text = draft.trim();
    if (!text || busy) return;
    setDraft('');
    setMessages((m) => [...m, { from: 'me', text }]);
    setBusy(true);
    const { data, error } = await supabase.rpc('ask_ollie', { message: text });
    setBusy(false);
    setMessages((m) => [...m, error
      ? { from: 'ollie', text: error.message || 'Something went wrong. Try again in a moment.' }
      : { from: 'ollie', text: data.reply, result: data }]);
  };

  const openTutor = (tutor) => {
    onClose();
    navigation.navigate('TutorProfile', { tutor });
  };

  const seeAll = (r) => {
    onClose();
    navigation.navigate('Search', {
      screen: 'SearchMain',
      params: {
        ollie: {
          subject: r.subject ?? null,
          block: r.blocks?.length === 1 ? r.blocks[0] : null,
          matchSchedule: !!r.match_schedule,
          at: Date.now(),
        },
      },
    });
  };

  return (
    <Sheet
      visible={visible}
      onClose={onClose}
      title={`Ask ${school.mascotName}`}
      subtitle="Tell Ollie what you need and Ollie finds you a tutor."
      style={styles.sheet}
    >
      <IconButton icon="close" label={`Close ${school.mascotName}`} onPress={onClose} style={styles.close} />

      {!chose ? (
        <ScrollView contentContainerStyle={styles.consent}>
          <Mascot size={72} style={styles.center} />
          <Text style={styles.consentLead}>
            Ollie is an AI helper. To understand what you need, Ollie sends what you type (and only that) to
            OpenAI. Ollie never sends your name or email, and the chat isn't saved.
          </Text>
          <TouchableOpacity
            style={styles.check}
            onPress={() => setAgree(!agree)}
            hitSlop={hit.slop}
            activeOpacity={press.opacity}
            accessibilityRole="checkbox"
            accessibilityState={{ checked: agree }}
            accessibilityLabel="Use Ollie's AI"
            accessibilityHint={OLLIE_CONSENT_TEXT}
          >
            <Ionicons name={agree ? 'checkbox' : 'square-outline'} size={22} color={agree ? colors.brand : colors.gray500} />
            <Text style={[styles.flex, styles.checkText]}>{OLLIE_CONSENT_TEXT}</Text>
          </TouchableOpacity>
          <Button label="Start chatting" icon="chatbubbles-outline" onPress={() => start(true)}
                  disabled={!agree} loading={saving} fullWidth />
          {saveError ? <Text style={styles.error}>{saveError}</Text> : null}
          <TouchableOpacity
            onPress={() => start(false)}
            hitSlop={hit.slop}
            accessibilityRole="button"
            style={styles.linkWrap}
          >
            <Text style={styles.link}>Use Ollie without AI (keywords only)</Text>
          </TouchableOpacity>
        </ScrollView>
      ) : (
        <>
          <ScrollView
            ref={scrollRef}
            style={styles.flex}
            contentContainerStyle={styles.chat}
            onContentSizeChange={() => scrollRef.current?.scrollToEnd?.({ animated: true })}
            accessibilityLiveRegion="polite"
          >
            {messages.map((m, i) => (m.from === 'me' ? (
              <View key={i} style={[styles.bubble, styles.mine]}>
                <Text style={styles.mineText}>{m.text}</Text>
              </View>
            ) : (
              <View key={i} style={styles.ollieRow}>
                <Mascot size={28} />
                <View style={[styles.flex, styles.bubble, styles.theirs]}>
                  <Text style={styles.theirsText}>{m.text}</Text>
                  {m.result?.tutors?.map((t) => (
                    <TutorRow key={t.id} tutor={t} onPress={() => openTutor(t)} />
                  ))}
                  {m.result?.total > 3 ? (
                    <TouchableOpacity onPress={() => seeAll(m.result)} accessibilityRole="button" hitSlop={hit.slop}>
                      <Text style={styles.link}>See all {m.result.total} in Search</Text>
                    </TouchableOpacity>
                  ) : null}
                </View>
              </View>
            )))}
            {busy ? (
              <View style={styles.ollieRow}>
                <Mascot size={28} mood="thinking" />
                <Text style={styles.typing}>Ollie is looking…</Text>
              </View>
            ) : null}
          </ScrollView>

          <View style={styles.inputRow}>
            <View style={styles.inputWrap}>
              <AppTextInput
                style={styles.input}
                value={draft}
                onChangeText={setDraft}
                placeholder="e.g. Chemistry during B3"
                placeholderTextColor={colors.gray400}
                maxLength={500}
                onSubmitEditing={send}
                returnKeyType="send"
                accessibilityLabel={`Message ${school.mascotName}`}
              />
            </View>
            <IconButton icon="send" label="Send" onPress={send} tinted color={colors.brandText}
                        disabled={!draft.trim() || busy} />
          </View>
          {saveError ? <Text style={styles.error}>{saveError}</Text> : null}
          <Text style={styles.footnote}>
            {aiOn ? 'Ollie uses AI to read your message. Don\'t share personal info. ' : 'AI is off: Ollie matches keywords. '}
            <Text style={styles.link} onPress={aiOn ? turnOff : () => setChose(false)} accessibilityRole="button">
              {aiOn ? 'Turn off AI' : 'Turn on AI'}
            </Text>
          </Text>
        </>
      )}
    </Sheet>
  );
}

const styles = StyleSheet.create({
  sheet:   { height: '85%', paddingBottom: space.xl },
  close:   { position: 'absolute', top: space.md, right: space.md },
  flex:    { flex: 1 },
  center:  { alignSelf: 'center', marginBottom: space.md },

  consent:     { paddingBottom: space.xl, gap: space.lg },
  consentLead: { ...type.body, color: colors.gray700 },
  check:       { flexDirection: 'row', alignItems: 'flex-start', gap: space.md },
  checkText:   { ...type.small, color: colors.gray700 },
  linkWrap:    { alignSelf: 'center' },
  link:        { ...type.small, color: colors.brandText, fontWeight: '700', textDecorationLine: 'underline' },

  chat:       { paddingBottom: space.md, gap: space.md },
  ollieRow:   { flexDirection: 'row', alignItems: 'flex-end', gap: space.sm },
  bubble:     { borderRadius: radii.lg, paddingHorizontal: space.md, paddingVertical: space.sm, maxWidth: '88%' },
  mine:       { alignSelf: 'flex-end', backgroundColor: colors.brand, borderBottomRightRadius: 6 },
  mineText:   { ...type.body, color: colors.white },
  theirs:     { backgroundColor: colors.offWhite, borderBottomLeftRadius: 6, gap: space.sm },
  theirsText: { ...type.body, color: colors.black },
  typing:     { ...type.small, color: colors.gray500, marginBottom: space.xs },

  tutor:     {
    flexDirection: 'row', alignItems: 'center', gap: space.sm,
    backgroundColor: colors.surface, borderRadius: radii.md, padding: space.sm,
  },
  tutorName: { ...type.body, fontWeight: '700', color: colors.black },
  tutorMeta: { ...type.small, color: colors.gray600 },

  inputRow: {
    flexDirection: 'row', alignItems: 'center', gap: space.sm,
    borderTopWidth: 1, borderTopColor: colors.lineSoft, paddingTop: space.md,
  },
  inputWrap: {
    flex: 1, flexDirection: 'row', alignItems: 'center',
    backgroundColor: colors.offWhite, borderRadius: radii.pill, paddingHorizontal: space.lg,
  },
  input: { flex: 1, ...type.body, color: colors.black, paddingVertical: space.sm },
  footnote: { ...type.small, color: colors.gray500, marginTop: space.sm },
  error:    { ...type.small, color: colors.errorText, marginTop: space.sm },
});
