/**
 * SplashScreen: the animated loading screen.
 *
 * The logo builds itself: the book opens, the two people slide in and meet
 * to form the heart, then the heart beats gently while the session loads.
 * With Reduce Motion on, everything simply appears.
 */
import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Easing, Platform, AccessibilityInfo } from 'react-native';
import { Logo, OrganicBackdrop } from '../../components/ui';
import colors from '../../theme/colors';
import { space, rule } from '../../theme/layout';
import { heading, label, type } from '../../theme/fonts';
import { school } from '../../theme/school';

const useNativeDriver = Platform.OS !== 'web';
const MARK = 148;

export default function SplashScreen() {
  const book   = useRef(new Animated.Value(0)).current;  // 0 closed → 1 open
  const join   = useRef(new Animated.Value(0)).current;  // 0 apart  → 1 heart
  const words  = useRef(new Animated.Value(0)).current;  // wordmark fade-up
  const beat   = useRef(new Animated.Value(0)).current;  // looping heartbeat
  const dots   = useRef(new Animated.Value(0)).current;  // looping loader

  useEffect(() => {
    let loops = [];
    let cancelled = false;

    const startLoops = () => {
      const heartbeat = Animated.loop(Animated.sequence([
        Animated.timing(beat, { toValue: 1, duration: 180, easing: Easing.out(Easing.quad), useNativeDriver }),
        Animated.timing(beat, { toValue: 0, duration: 220, easing: Easing.in(Easing.quad), useNativeDriver }),
        Animated.timing(beat, { toValue: 0.6, duration: 160, easing: Easing.out(Easing.quad), useNativeDriver }),
        Animated.timing(beat, { toValue: 0, duration: 260, easing: Easing.in(Easing.quad), useNativeDriver }),
        Animated.delay(700),
      ]));
      const loader = Animated.loop(
        Animated.timing(dots, { toValue: 1, duration: 1200, easing: Easing.linear, useNativeDriver }),
      );
      loops = [heartbeat, loader];
      loops.forEach((l) => l.start());
    };

    AccessibilityInfo.isReduceMotionEnabled()
      .catch(() => false)
      .then((reduce) => {
        if (cancelled) return;
        if (reduce) {
          book.setValue(1); join.setValue(1); words.setValue(1);
          return;
        }
        Animated.sequence([
          Animated.timing(book, { toValue: 1, duration: 450, easing: Easing.out(Easing.cubic), useNativeDriver }),
          Animated.spring(join, { toValue: 1, tension: 70, friction: 9, useNativeDriver }),
          Animated.timing(words, { toValue: 1, duration: 400, easing: Easing.out(Easing.quad), useNativeDriver }),
        ]).start(({ finished }) => { if (finished && !cancelled) startLoops(); });
      });

    return () => { cancelled = true; loops.forEach((l) => l.stop()); };
  }, []);

  const bookStyle = {
    opacity: book,
    transform: [
      { translateY: book.interpolate({ inputRange: [0, 1], outputRange: [10, 0] }) },
      { scaleX: book.interpolate({ inputRange: [0, 1], outputRange: [0.15, 1] }) },
    ],
  };
  const person = (from) => ({
    opacity: join.interpolate({ inputRange: [0, 0.4, 1], outputRange: [0, 1, 1] }),
    transform: [
      { translateX: join.interpolate({ inputRange: [0, 1], outputRange: [from, 0] }) },
      { translateY: join.interpolate({ inputRange: [0, 1], outputRange: [14, 0] }) },
    ],
  });
  const heartStyle = {
    transform: [{ scale: beat.interpolate({ inputRange: [0, 1], outputRange: [1, 1.07] }) }],
  };
  const wordStyle = {
    opacity: words,
    transform: [{ translateY: words.interpolate({ inputRange: [0, 1], outputRange: [12, 0] }) }],
  };
  const dot = (i) => ({
    opacity: dots.interpolate({
      inputRange: [0, (i + 0.5) / 4, (i + 1.5) / 4, 1],
      outputRange: [0.35, 1, 0.35, 0.35],
      extrapolate: 'clamp',
    }),
  });

  return (
    <View style={styles.container}>
      <OrganicBackdrop />

      <View
        style={styles.content}
        accessible
        accessibilityRole="progressbar"
        accessibilityLabel={`${school.appName} is loading`}
      >
        <Animated.View style={[styles.mark, heartStyle]}>
          <Animated.View style={[styles.layer, bookStyle]}>
            <Logo size={MARK} onDark layer="book" />
          </Animated.View>
          <Animated.View style={[styles.layer, person(-28)]}>
            <Logo size={MARK} onDark layer="left" />
          </Animated.View>
          <Animated.View style={[styles.layer, person(28)]}>
            <Logo size={MARK} onDark layer="right" />
          </Animated.View>
        </Animated.View>

        <Animated.View style={[styles.words, wordStyle]}>
          <Text style={styles.school}>{school.name.toUpperCase()}</Text>
          <Text style={styles.title}>{school.appName}</Text>
          <View style={styles.rule} />
          <Text style={styles.sub}>{school.memberPlural} helping {school.memberPlural}</Text>
        </Animated.View>

        <View style={styles.dots}>
          {[0, 1, 2].map((i) => (
            <Animated.View key={i} style={[styles.dot, dot(i)]} />
          ))}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
    flex: 1,
    backgroundColor: colors.brand,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: { alignItems: 'center' },

  mark:  { width: MARK, height: MARK, marginBottom: space.xl },
  layer: { position: 'absolute', top: 0, left: 0 },

  words:  { alignItems: 'center' },
  school: { ...label.caps, color: colors.whiteAlpha[80], fontSize: 12, letterSpacing: 3 },
  title:  { ...heading.xl, color: colors.white, fontSize: 38, lineHeight: 46, marginTop: space.xs, textAlign: 'center' },
  rule: {
    width: rule.width, height: rule.height, borderRadius: rule.radius,
    backgroundColor: colors.gold,
    marginTop: space.md, marginBottom: space.md,
  },
  sub: { ...type.body, color: colors.whiteAlpha[80] },

  dots: { flexDirection: 'row', gap: space.sm, marginTop: space.xxxl },
  dot:  { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.gold },
});
