/**
 * GettingStarted: the "Get started" checklist card on Home (see
 * utils/gettingStarted.js for the steps). Each row jumps to where the step is
 * done; the card disappears for good once every step is checked or the user
 * closes it.
 */
import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../lib/supabase';
import colors from '../theme/colors';
import { radii, space, press, hit } from '../theme/layout';
import { type, label } from '../theme/fonts';
import { cardShadow } from '../theme/shadows';
import { gettingStartedSteps } from '../utils/gettingStarted';
import { shareInvite } from '../utils/invite';
import { success } from '../utils/haptics';
import { FadeIn } from './ui';

const key = (name, userId) => `gettingStarted.${name}.v1:${userId}`;

export default function GettingStarted({ profile, isTutor, navigation }) {
  const userId = profile?.id;
  const [ready, setReady]         = useState(false);
  const [hidden, setHidden]       = useState(false);
  const [invited, setInvited]     = useState(false);
  const [sessionCount, setCount]  = useState(0);
  const [note, setNote]           = useState('');

  useEffect(() => {
    if (!userId) return;
    let alive = true;
    (async () => {
      const [dismissed, sent] = await Promise.all([
        AsyncStorage.getItem(key('dismissed', userId)).catch(() => null),
        AsyncStorage.getItem(key('invited', userId)).catch(() => null),
      ]);
      const { data } = await supabase
        .from('sessions')
        .select('id')
        .or(`tutor_id.eq.${userId},student_id.eq.${userId}`)
        .in('status', isTutor ? ['confirmed', 'completed'] : ['pending', 'confirmed', 'completed'])
        .limit(1);
      if (!alive) return;
      setHidden(!!dismissed);
      setInvited(!!sent);
      setCount(data?.length ?? 0);
      setReady(true);
    })();
    return () => { alive = false; };
  }, [userId, isTutor]);

  const steps = gettingStartedSteps({ profile, isTutor, invited, sessionCount });
  const done  = steps.filter((s) => s.done).length;

  const dismiss = useCallback(() => {
    setHidden(true);
    AsyncStorage.setItem(key('dismissed', userId), '1').catch(() => {});
  }, [userId]);

  const run = async (step) => {
    if (step.action === 'profile')  return navigation.navigate('Profile');
    if (step.action === 'search')   return navigation.navigate('Search');
    if (step.action === 'sessions') return navigation.navigate('Sessions');
    const result = await shareInvite(isTutor);
    if (result === 'shared' || result === 'copied') {
      success();
      setInvited(true);
      setNote(result === 'copied' ? 'Invite link copied. Paste it to a friend!' : 'Thanks for spreading the word!');
      AsyncStorage.setItem(key('invited', userId), '1').catch(() => {});
    } else if (result === 'failed') {
      setNote("Couldn't open sharing on this device.");
    }
  };

  if (!ready || hidden || done === steps.length) return null;

  return (
    <FadeIn style={styles.card}>
      <View style={styles.head}>
        <View style={{ flex: 1 }}>
          <Text style={styles.eyebrow}>Get started</Text>
          <Text style={styles.title}>{done} of {steps.length} done</Text>
        </View>
        <TouchableOpacity
          onPress={dismiss}
          hitSlop={hit.slop}
          activeOpacity={press.opacity}
          accessibilityRole="button"
          accessibilityLabel="Hide the get started checklist"
        >
          <Ionicons name="close" size={20} color={colors.gray500} />
        </TouchableOpacity>
      </View>

      <View style={styles.track} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
        <View style={[styles.fill, { width: `${(done / steps.length) * 100}%` }]} />
      </View>

      {steps.map((s, i) => (
        <TouchableOpacity
          key={s.key}
          style={[styles.row, i === steps.length - 1 && styles.rowLast]}
          onPress={() => run(s)}
          activeOpacity={press.opacity}
          accessibilityRole="button"
          accessibilityLabel={`${s.label}${s.done ? ', done' : ''}`}
          accessibilityState={{ checked: s.done }}
        >
          <View style={[styles.check, s.done && styles.checkDone]}>
            {s.done ? <Ionicons name="checkmark" size={14} color={colors.white} /> : null}
          </View>
          <View style={styles.rowText}>
            <Text style={[styles.rowLabel, s.done && styles.rowLabelDone]}>{s.label}</Text>
            {!s.done ? <Text style={styles.rowHint}>{s.hint}</Text> : null}
          </View>
          {!s.done ? (
            <Ionicons
              name={s.action === 'invite' ? 'share-outline' : 'chevron-forward'}
              size={18}
              color={colors.brandText}
            />
          ) : null}
        </TouchableOpacity>
      ))}

      {note ? <Text style={styles.note} accessibilityLiveRegion="polite">{note}</Text> : null}
    </FadeIn>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    padding: space.xl,
    ...cardShadow,
  },
  head:    { flexDirection: 'row', alignItems: 'flex-start', marginBottom: space.md },
  eyebrow: { ...type.eyebrow, color: colors.gray500, marginBottom: 2 },
  title:   { ...type.heading, color: colors.black },

  track: { height: 6, borderRadius: 3, backgroundColor: colors.gray200, overflow: 'hidden', marginBottom: space.sm },
  fill:  { height: 6, borderRadius: 3, backgroundColor: colors.gold },

  row: {
    flexDirection: 'row', alignItems: 'center', gap: space.md,
    paddingVertical: space.md,
    borderBottomWidth: 1, borderBottomColor: colors.lineSoft,
  },
  rowLast: { borderBottomWidth: 0, paddingBottom: 0 },
  check: {
    width: 24, height: 24, borderRadius: 12,
    borderWidth: 2, borderColor: colors.line,
    alignItems: 'center', justifyContent: 'center',
  },
  checkDone: { backgroundColor: colors.brand, borderColor: colors.brand },
  rowText:   { flex: 1 },
  rowLabel:  { ...type.body, fontWeight: '600', color: colors.black },
  rowLabelDone: { color: colors.gray500, textDecorationLine: 'line-through', fontWeight: '400' },
  rowHint:   { ...type.small, color: colors.gray500 },

  note: { ...label.ui, fontSize: 13, color: colors.brandText, marginTop: space.md },
});
