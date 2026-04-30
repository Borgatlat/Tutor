import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import colors from '../theme/colors';
import { TUTORS } from '../data/tutors';

const STATS = [
  { label: 'Active Tutors', value: '24+' },
  { label: 'Subjects', value: '12' },
  { label: 'Sessions Done', value: '300+' },
];

export default function HomeScreen({ navigation }) {
  const topTutors = TUTORS.slice(0, 3);

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" backgroundColor={colors.red} />
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Hero */}
        <View style={styles.hero}>
          <View style={styles.heroTopRow}>
            <View>
              <Text style={styles.schoolLabel}>STRAKE JESUIT</Text>
              <Text style={styles.heroTitle}>Tutor{'\n'}Marketplace</Text>
            </View>
            <View style={styles.crossBadge}>
              <Text style={styles.crossText}>✝</Text>
            </View>
          </View>
          <Text style={styles.heroSubtitle}>
            Connect with fellow Crusaders for peer tutoring across all subjects.
          </Text>
          <TouchableOpacity
            style={styles.heroCta}
            onPress={() => navigation.navigate('Tutors')}
          >
            <Text style={styles.heroCtaText}>Browse Tutors</Text>
            <Ionicons name="arrow-forward" size={18} color={colors.red} />
          </TouchableOpacity>
        </View>

        {/* Stats */}
        <View style={styles.statsRow}>
          {STATS.map((s) => (
            <View key={s.label} style={styles.statCard}>
              <Text style={styles.statValue}>{s.value}</Text>
              <Text style={styles.statLabel}>{s.label}</Text>
            </View>
          ))}
        </View>

        {/* How it works */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>How It Works</Text>
          {[
            { icon: 'search-outline', title: 'Find a Tutor', desc: 'Browse by subject, grade, or availability.' },
            { icon: 'chatbubble-outline', title: 'Book a Session', desc: 'Message your tutor and pick a time that works.' },
            { icon: 'checkmark-circle-outline', title: 'Get Better Grades', desc: 'Learn from a fellow Crusader who's been there.' },
          ].map((step, i) => (
            <View key={i} style={styles.stepRow}>
              <View style={styles.stepIconWrap}>
                <Ionicons name={step.icon} size={22} color={colors.white} />
              </View>
              <View style={styles.stepText}>
                <Text style={styles.stepTitle}>{step.title}</Text>
                <Text style={styles.stepDesc}>{step.desc}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* Top Tutors preview */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Top Tutors</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Tutors')}>
              <Text style={styles.seeAll}>See all</Text>
            </TouchableOpacity>
          </View>
          {topTutors.map((tutor) => (
            <TouchableOpacity
              key={tutor.id}
              style={styles.tutorRow}
              onPress={() => navigation.navigate('TutorProfile', { tutor })}
            >
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{tutor.initials}</Text>
              </View>
              <View style={styles.tutorInfo}>
                <Text style={styles.tutorName}>{tutor.name}</Text>
                <Text style={styles.tutorSubjects}>{tutor.subjects.slice(0, 2).join(' · ')}</Text>
              </View>
              <View style={styles.ratingBadge}>
                <Ionicons name="star" size={13} color={colors.red} />
                <Text style={styles.ratingText}>{tutor.rating}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* CTA Banner */}
        <TouchableOpacity
          style={styles.banner}
          onPress={() => navigation.navigate('Be a Tutor')}
        >
          <View>
            <Text style={styles.bannerTitle}>Are you a strong student?</Text>
            <Text style={styles.bannerSub}>Join as a tutor and help your fellow Crusaders.</Text>
          </View>
          <Ionicons name="chevron-forward" size={22} color={colors.white} />
        </TouchableOpacity>

        <View style={{ height: 24 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.red },
  hero: {
    backgroundColor: colors.red,
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 32,
  },
  heroTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  schoolLabel: {
    color: colors.white,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 2,
    opacity: 0.85,
    marginBottom: 4,
  },
  heroTitle: {
    color: colors.white,
    fontSize: 36,
    fontWeight: '800',
    lineHeight: 42,
  },
  crossBadge: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.green,
    alignItems: 'center',
    justifyContent: 'center',
  },
  crossText: { color: colors.white, fontSize: 26 },
  heroSubtitle: {
    color: colors.white,
    fontSize: 15,
    opacity: 0.9,
    lineHeight: 22,
    marginBottom: 20,
  },
  heroCta: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    alignSelf: 'flex-start',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 30,
    gap: 8,
  },
  heroCtaText: { color: colors.red, fontWeight: '700', fontSize: 15 },

  statsRow: {
    flexDirection: 'row',
    backgroundColor: colors.white,
    paddingVertical: 20,
    paddingHorizontal: 16,
    justifyContent: 'space-around',
    borderBottomWidth: 1,
    borderBottomColor: colors.gray100,
  },
  statCard: { alignItems: 'center' },
  statValue: { fontSize: 22, fontWeight: '800', color: colors.red },
  statLabel: { fontSize: 11, color: colors.gray500, marginTop: 2, textAlign: 'center' },

  section: {
    backgroundColor: colors.white,
    marginTop: 10,
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: { fontSize: 18, fontWeight: '800', color: colors.black, marginBottom: 16 },
  seeAll: { fontSize: 13, color: colors.red, fontWeight: '600' },

  stepRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 16 },
  stepIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.green,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
    marginTop: 2,
  },
  stepText: { flex: 1 },
  stepTitle: { fontSize: 15, fontWeight: '700', color: colors.black, marginBottom: 2 },
  stepDesc: { fontSize: 13, color: colors.gray500, lineHeight: 19 },

  tutorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray100,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.redLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  avatarText: { color: colors.white, fontWeight: '700', fontSize: 15 },
  tutorInfo: { flex: 1 },
  tutorName: { fontSize: 15, fontWeight: '700', color: colors.black },
  tutorSubjects: { fontSize: 12, color: colors.gray500, marginTop: 2 },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.offWhite,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 3,
  },
  ratingText: { fontSize: 12, fontWeight: '700', color: colors.black },

  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.green,
    marginHorizontal: 16,
    marginTop: 10,
    borderRadius: 16,
    padding: 20,
  },
  bannerTitle: { color: colors.white, fontWeight: '800', fontSize: 16, marginBottom: 4 },
  bannerSub: { color: colors.white, fontSize: 12, opacity: 0.85 },
});
