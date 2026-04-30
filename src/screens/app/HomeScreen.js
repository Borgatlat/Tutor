import React, { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  SafeAreaView, StatusBar, FlatList, Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { supabase, searchTutors } from '../../lib/supabase';
import useAuthStore from '../../store/useAuthStore';
import colors from '../../theme/colors';
import { heading } from '../../theme/fonts';
import TutorCard from '../../components/TutorCard';

export default function HomeScreen({ navigation }) {
  const { profile } = useAuthStore();
  const [topTutors, setTopTutors]       = useState([]);
  const [upcomingSessions, setUpcoming] = useState([]);
  const [loadingTutors, setLoadingTutors] = useState(true);

  const firstName = profile?.full_name?.split(' ')[0] ?? 'Crusader';

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  useEffect(() => {
    loadTopTutors();
    loadUpcomingSessions();
  }, []);

  const loadTopTutors = async () => {
    try {
      const data = await searchTutors({});
      setTopTutors(data.slice(0, 5));
    } catch (e) {
      if (__DEV__) console.warn('[HomeScreen] loadTopTutors:', e);
    } finally {
      setLoadingTutors(false);
    }
  };

  const loadUpcomingSessions = async () => {
    if (!profile?.id) return;
    const { data } = await supabase
      .from('sessions')
      .select('*, tutor:profiles!sessions_tutor_id_fkey(full_name,avatar_url), student:profiles!sessions_student_id_fkey(full_name,avatar_url)')
      .or(`tutor_id.eq.${profile.id},student_id.eq.${profile.id}`)
      .in('status', ['pending', 'confirmed'])
      .limit(3);
    setUpcoming(data ?? []);
  };

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" backgroundColor={colors.red} />
      <ScrollView showsVerticalScrollIndicator={false}>

        {/* Hero Header */}
        <View style={styles.hero}>
          <View style={styles.heroRow}>
            <View>
              <Text style={styles.heroGreeting}>{greeting},</Text>
              <Text style={styles.heroName}>{firstName} 👋</Text>
            </View>
            <TouchableOpacity
              style={styles.heroBadge}
              onPress={() => navigation.navigate('Profile')}
            >
              {profile?.avatar_url ? (
                <Image source={{ uri: profile.avatar_url }} style={styles.heroAvatar} />
              ) : (
                <Ionicons name="person" size={22} color={colors.white} />
              )}
            </TouchableOpacity>
          </View>

          {/* Quick actions */}
          <View style={styles.quickActions}>
            <TouchableOpacity
              style={styles.qBtn}
              onPress={() => navigation.navigate('Search')}
            >
              <Ionicons name="search" size={18} color={colors.redDark} />
              <Text style={styles.qBtnText}>Find a Tutor</Text>
            </TouchableOpacity>
            {(profile?.role === 'tutor' || profile?.role === 'both') && (
              <TouchableOpacity
                style={[styles.qBtn, styles.qBtnGreen]}
                onPress={() => navigation.navigate('Sessions')}
              >
                <Ionicons name="calendar" size={18} color={colors.green} />
                <Text style={[styles.qBtnText, { color: colors.green }]}>My Sessions</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Upcoming Sessions */}
        {upcomingSessions.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Upcoming Sessions</Text>
              <TouchableOpacity onPress={() => navigation.navigate('Sessions')}>
                <Text style={styles.seeAll}>See all</Text>
              </TouchableOpacity>
            </View>
            {upcomingSessions.map((s) => {
              const other = s.tutor_id === profile?.id ? s.student : s.tutor;
              const initials = other?.full_name?.split(' ').map((w) => w[0]).slice(0, 2).join('') ?? '?';
              return (
                <View key={s.id} style={styles.sessionRow}>
                  {other?.avatar_url ? (
                    <Image source={{ uri: other.avatar_url }} style={styles.sessionAvatar} />
                  ) : (
                    <View style={[styles.sessionAvatarPlaceholder, { backgroundColor: s.tutor_id === profile?.id ? colors.green : colors.red }]}>
                      <Text style={styles.sessionInitials}>{initials}</Text>
                    </View>
                  )}
                  <View style={styles.sessionInfo}>
                    <Text style={styles.sessionName}>{other?.full_name}</Text>
                    <Text style={styles.sessionDetail}>{s.subject} · {s.day} P{s.period}</Text>
                  </View>
                  <View style={[styles.statusPill, { backgroundColor: s.status === 'confirmed' ? colors.greenMuted : colors.gray100 }]}>
                    <Text style={[styles.statusPillText, { color: s.status === 'confirmed' ? colors.green : colors.gray500 }]}>
                      {s.status}
                    </Text>
                  </View>
                </View>
              );
            })}
          </View>
        )}

        {/* SAT + AP Banner */}
        <TouchableOpacity style={styles.satBanner} onPress={() => navigation.navigate('Search')}>
          <View>
            <Text style={styles.satLabel}>NOW AVAILABLE</Text>
            <Text style={styles.satTitle}>SAT & AP Tutoring</Text>
            <Text style={styles.satSub}>Prep help from fellow Crusaders</Text>
          </View>
          <View style={styles.satIcon}>
            <Ionicons name="ribbon" size={32} color={colors.white} />
          </View>
        </TouchableOpacity>

        {/* Top Tutors */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Top Tutors</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Search')}>
              <Text style={styles.seeAll}>Browse all</Text>
            </TouchableOpacity>
          </View>
          {loadingTutors ? (
            [1, 2, 3].map((i) => <View key={i} style={styles.skeletonCard} />)
          ) : (
            topTutors.map((t) => (
              <TutorCard
                key={t.id}
                tutor={t}
                onPress={() => navigation.navigate('TutorProfile', { tutor: t })}
              />
            ))
          )}
        </View>

        <View style={{ height: 32 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.offWhite },

  hero: {
    backgroundColor: colors.red,
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 28,
  },
  heroRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  heroGreeting: { color: colors.white, opacity: 0.8, fontSize: 14 },
  heroName:     { color: colors.white, fontSize: 26, fontFamily: heading.lg.fontFamily, fontWeight: '800' },
  heroBadge: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.25)',
    alignItems: 'center', justifyContent: 'center',
  },
  heroAvatar: { width: 44, height: 44, borderRadius: 22 },

  quickActions: { flexDirection: 'row', gap: 10 },
  qBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.white,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 30,
  },
  qBtnGreen: { backgroundColor: colors.greenMuted },
  qBtnText: { fontWeight: '700', fontSize: 14, color: colors.redDark },

  section: {
    backgroundColor: colors.white,
    marginTop: 10,
    paddingHorizontal: 18,
    paddingVertical: 18,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  sectionTitle: { fontSize: 17, fontWeight: '800', color: colors.black },
  seeAll: { fontSize: 13, color: colors.redDark, fontWeight: '600' },

  sessionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray100,
  },
  sessionAvatar: { width: 40, height: 40, borderRadius: 20, marginRight: 10 },
  sessionAvatarPlaceholder: { width: 40, height: 40, borderRadius: 20, marginRight: 10, alignItems: 'center', justifyContent: 'center' },
  sessionInitials: { color: colors.white, fontWeight: '700', fontSize: 13 },
  sessionInfo: { flex: 1 },
  sessionName: { fontSize: 14, fontWeight: '700', color: colors.black },
  sessionDetail: { fontSize: 12, color: colors.gray500, marginTop: 1 },
  statusPill: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  statusPillText: { fontSize: 11, fontWeight: '700' },

  satBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.green,
    marginHorizontal: 14,
    marginTop: 10,
    borderRadius: 18,
    padding: 20,
  },
  satLabel: { color: colors.white, fontSize: 10, fontWeight: '700', letterSpacing: 1.5, opacity: 0.8, marginBottom: 4 },
  satTitle: { color: colors.white, fontSize: 20, fontWeight: '800', marginBottom: 2 },
  satSub:   { color: colors.white, fontSize: 12, opacity: 0.85 },
  satIcon:  { width: 56, height: 56, borderRadius: 28, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' },

  skeletonCard: { height: 90, backgroundColor: colors.gray100, borderRadius: 16, marginBottom: 12 },
});
