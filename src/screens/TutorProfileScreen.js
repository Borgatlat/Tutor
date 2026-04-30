import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import colors from '../theme/colors';

const REVIEWS = [
  { author: 'A.M.', text: 'Super helpful! Made calc way easier to understand.', stars: 5 },
  { author: 'J.K.', text: 'Very patient and explains things multiple ways.', stars: 5 },
  { author: 'R.T.', text: 'My grade went up a full letter after just 3 sessions.', stars: 4 },
];

export default function TutorProfileScreen({ route, navigation }) {
  const { tutor } = route.params;
  const [requested, setRequested] = useState(false);

  const handleBook = () => {
    setRequested(true);
  };

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" backgroundColor={colors.red} />

      {/* Back button */}
      <View style={styles.navBar}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={22} color={colors.white} />
          <Text style={styles.backText}>Back</Text>
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Profile Header */}
        <View style={styles.profileHeader}>
          <View style={styles.avatarLarge}>
            <Text style={styles.avatarText}>{tutor.initials}</Text>
          </View>
          <Text style={styles.name}>{tutor.name}</Text>
          <Text style={styles.grade}>{tutor.grade} · Strake Jesuit</Text>
          <View style={styles.ratingRow}>
            {[1, 2, 3, 4, 5].map((i) => (
              <Ionicons
                key={i}
                name={i <= Math.round(tutor.rating) ? 'star' : 'star-outline'}
                size={16}
                color={colors.white}
              />
            ))}
            <Text style={styles.ratingVal}>{tutor.rating} ({tutor.reviews} reviews)</Text>
          </View>
        </View>

        {/* Stats bar */}
        <View style={styles.statsBar}>
          <View style={styles.statItem}>
            <Text style={styles.statVal}>${tutor.rate}</Text>
            <Text style={styles.statLbl}>Per Hour</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statVal}>{tutor.sessionsDone}</Text>
            <Text style={styles.statLbl}>Sessions</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statVal}>{tutor.subjects.length}</Text>
            <Text style={styles.statLbl}>Subjects</Text>
          </View>
        </View>

        {/* About */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>About</Text>
          <Text style={styles.bio}>{tutor.bio}</Text>
        </View>

        {/* Subjects */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Subjects</Text>
          <View style={styles.tagRow}>
            {tutor.subjects.map((s) => (
              <View key={s} style={styles.tag}>
                <Text style={styles.tagText}>{s}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Availability */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Availability</Text>
          <View style={styles.availRow}>
            <Ionicons name="calendar-outline" size={18} color={colors.green} />
            <Text style={styles.availText}>{tutor.availability}</Text>
          </View>
        </View>

        {/* Reviews */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recent Reviews</Text>
          {REVIEWS.map((r, i) => (
            <View key={i} style={styles.reviewCard}>
              <View style={styles.reviewTop}>
                <View style={styles.reviewAvatar}>
                  <Text style={styles.reviewAvatarText}>{r.author}</Text>
                </View>
                <View style={styles.starsRow}>
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Ionicons
                      key={s}
                      name={s <= r.stars ? 'star' : 'star-outline'}
                      size={13}
                      color={colors.red}
                    />
                  ))}
                </View>
              </View>
              <Text style={styles.reviewText}>{r.text}</Text>
            </View>
          ))}
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Book CTA */}
      <View style={styles.bookBar}>
        <View>
          <Text style={styles.bookRate}>${tutor.rate}/hr</Text>
          <Text style={styles.bookAvail}>Available: {tutor.availability}</Text>
        </View>
        <TouchableOpacity
          style={[styles.bookBtn, requested && styles.bookBtnDone]}
          onPress={handleBook}
          disabled={requested}
        >
          <Text style={styles.bookBtnText}>
            {requested ? '✓ Requested' : 'Request Session'}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.offWhite },
  navBar: {
    backgroundColor: colors.red,
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  backBtn: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  backText: { color: colors.white, fontSize: 15, fontWeight: '600' },

  profileHeader: {
    backgroundColor: colors.red,
    alignItems: 'center',
    paddingBottom: 28,
    paddingTop: 8,
  },
  avatarLarge: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  avatarText: { color: colors.red, fontSize: 26, fontWeight: '800' },
  name: { color: colors.white, fontSize: 22, fontWeight: '800', marginBottom: 4 },
  grade: { color: colors.white, fontSize: 13, opacity: 0.85, marginBottom: 8 },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  ratingVal: { color: colors.white, fontSize: 13, marginLeft: 4 },

  statsBar: {
    flexDirection: 'row',
    backgroundColor: colors.white,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray100,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  statItem: { flex: 1, alignItems: 'center' },
  statVal: { fontSize: 20, fontWeight: '800', color: colors.black },
  statLbl: { fontSize: 11, color: colors.gray500, marginTop: 2 },
  statDivider: { width: 1, backgroundColor: colors.gray100 },

  section: {
    backgroundColor: colors.white,
    marginTop: 10,
    paddingHorizontal: 20,
    paddingVertical: 18,
  },
  sectionTitle: { fontSize: 16, fontWeight: '800', color: colors.black, marginBottom: 10 },
  bio: { fontSize: 14, color: colors.gray700, lineHeight: 22 },

  tagRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  tag: {
    backgroundColor: colors.offWhite,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: colors.gray100,
  },
  tagText: { fontSize: 13, color: colors.redDark, fontWeight: '600' },

  availRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  availText: { fontSize: 14, color: colors.green, fontWeight: '600' },

  reviewCard: {
    backgroundColor: colors.offWhite,
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
  },
  reviewTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 },
  reviewAvatar: {
    backgroundColor: colors.red,
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  reviewAvatarText: { color: colors.white, fontWeight: '700', fontSize: 12 },
  starsRow: { flexDirection: 'row', gap: 2 },
  reviewText: { fontSize: 13, color: colors.gray700, lineHeight: 19 },

  bookBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.white,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
    paddingBottom: 28,
    borderTopWidth: 1,
    borderTopColor: colors.gray100,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
  },
  bookRate: { fontSize: 18, fontWeight: '800', color: colors.black },
  bookAvail: { fontSize: 11, color: colors.gray500, marginTop: 2 },
  bookBtn: {
    backgroundColor: colors.red,
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 14,
  },
  bookBtnDone: { backgroundColor: colors.green },
  bookBtnText: { color: colors.white, fontWeight: '800', fontSize: 15 },
});
