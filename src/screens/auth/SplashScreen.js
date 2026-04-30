import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import colors from '../../theme/colors';
import { heading } from '../../theme/fonts';

const useNativeDriver = Platform.OS !== 'web';

export default function SplashScreen() {
  const opacity = useRef(new Animated.Value(0)).current;
  const scale   = useRef(new Animated.Value(0.8)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, { toValue: 1, duration: 700, useNativeDriver }),
      Animated.spring(scale,  { toValue: 1, tension: 60, friction: 8, useNativeDriver }),
    ]).start();
  }, []);

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.content, { opacity, transform: [{ scale }] }]}>
        <View style={styles.iconWrap}>
          <Ionicons name="school" size={56} color={colors.white} />
        </View>
        <Text style={styles.school}>STRAKE JESUIT</Text>
        <Text style={styles.title}>Tutor{'\n'}Marketplace</Text>
        <Text style={styles.sub}>Crusaders helping Crusaders</Text>
        <View style={styles.dot} />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.red,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: { alignItems: 'center' },
  iconWrap: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: colors.green,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  school: {
    color: colors.white,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 3,
    opacity: 0.8,
    marginBottom: 8,
  },
  title: {
    color: colors.white,
    fontSize: 42,
    fontFamily: heading.xl.fontFamily,
    fontWeight: '800',
    textAlign: 'center',
    lineHeight: 48,
    marginBottom: 12,
  },
  sub: {
    color: colors.white,
    fontSize: 15,
    opacity: 0.75,
    marginBottom: 32,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.white,
    opacity: 0.5,
  },
});
