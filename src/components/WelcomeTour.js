/**
 * WelcomeTour — three short cards from Ollie the first time someone reaches
 * Home: find a tutor → book a free block → track it. Shown once per device
 * (AsyncStorage flag); "Skip" and "Get started" both mark it seen.
 */
import React, { useEffect, useState } from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import colors from '../theme/colors';
import { radii, space, press, hit } from '../theme/layout';
import { type, label } from '../theme/fonts';
import { sheetShadow } from '../theme/shadows';
import { school } from '../theme/school';
import { Button, Mascot } from './ui';

export const TOUR_KEY = 'welcomeTour.seen.v1';

const STEPS = [
  {
    mood: 'default',
    title: `Hi, I'm ${school.mascotName}!`,
    body: `I'll help you find a fellow ${school.memberName} who can explain it — Algebra to AP Calc, SAT to Spanish.`,
  },
  {
    mood: 'thinking',
    title: 'Book a free block',
    body: 'Tutors list the blocks they are free. Pick one that matches yours and send a request — no swapping texts.',
  },
  {
    mood: 'happy',
    title: 'Track what you learn — and give back',
    body: 'Tutors confirm, you meet, and every finished session counts toward their service hours.',
  },
];

export default function WelcomeTour() {
  const [visible, setVisible] = useState(false);
  const [step, setStep]       = useState(0);

  useEffect(() => {
    AsyncStorage.getItem(TOUR_KEY)
      .then((seen) => { if (!seen) setVisible(true); })
      .catch(() => {});
  }, []);

  const finish = () => {
    setVisible(false);
    AsyncStorage.setItem(TOUR_KEY, '1').catch(() => {});
  };

  const s    = STEPS[step];
  const last = step === STEPS.length - 1;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={finish}>
      <View style={styles.overlay}>
        <View style={styles.card} accessibilityViewIsModal>
          <TouchableOpacity
            style={styles.skip}
            onPress={finish}
            hitSlop={hit.slop}
            activeOpacity={press.opacity}
            accessibilityRole="button"
            accessibilityLabel="Skip the tour"
          >
            <Text style={styles.skipText}>Skip</Text>
          </TouchableOpacity>

          <Mascot size={120} mood={s.mood} style={styles.owl} />
          <Text style={styles.title} accessibilityRole="header">{s.title}</Text>
          <Text style={styles.body}>{s.body}</Text>

          <View style={styles.dots} accessibilityLabel={`Step ${step + 1} of ${STEPS.length}`}>
            {STEPS.map((_, i) => (
              <View key={i} style={[styles.dot, i === step && styles.dotActive]} />
            ))}
          </View>

          <Button
            label={last ? 'Get started' : 'Next'}
            onPress={last ? finish : () => setStep(step + 1)}
            fullWidth
          />
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,36,23,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: space.xl,
  },
  card: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: colors.white,
    borderRadius: radii.xl,
    padding: space.xxl,
    alignItems: 'center',
    ...sheetShadow,
  },
  skip:     { alignSelf: 'flex-end' },
  skipText: { ...label.ui, fontSize: 14, color: colors.gray500 },
  owl:      { marginBottom: space.lg },
  title:    { ...type.heading, color: colors.brand, textAlign: 'center', marginBottom: space.sm },
  body:     { ...type.body, color: colors.gray600, textAlign: 'center', marginBottom: space.xl },
  dots:     { flexDirection: 'row', gap: space.sm, marginBottom: space.xl },
  dot:      { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.gray200 },
  dotActive:{ width: 22, backgroundColor: colors.gold },
});
