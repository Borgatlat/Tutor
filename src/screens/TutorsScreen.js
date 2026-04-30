import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  FlatList,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import colors from '../theme/colors';
import { TUTORS, SUBJECTS } from '../data/tutors';

export default function TutorsScreen({ navigation }) {
  const [search, setSearch] = useState('');
  const [activeSubject, setActiveSubject] = useState('All');

  const filtered = useMemo(() => {
    return TUTORS.filter((t) => {
      const matchesSubject =
        activeSubject === 'All' || t.subjects.includes(activeSubject);
      const q = search.toLowerCase();
      const matchesSearch =
        q === '' ||
        t.name.toLowerCase().includes(q) ||
        t.subjects.some((s) => s.toLowerCase().includes(q));
      return matchesSubject && matchesSearch;
    });
  }, [search, activeSubject]);

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" backgroundColor={colors.red} />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Find a Tutor</Text>
        <Text style={styles.headerSub}>Strake Jesuit Crusaders</Text>
      </View>

      {/* Search Bar */}
      <View style={styles.searchWrap}>
        <Ionicons name="search" size={18} color={colors.gray500} style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search by name or subject…"
          placeholderTextColor={colors.gray300}
          value={search}
          onChangeText={setSearch}
        />
        {search.length > 0 && (
          <TouchableOpacity onPress={() => setSearch('')}>
            <Ionicons name="close-circle" size={18} color={colors.gray300} />
          </TouchableOpacity>
        )}
      </View>

      {/* Subject filter chips */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.chipRow}
      >
        {SUBJECTS.map((s) => (
          <TouchableOpacity
            key={s}
            style={[styles.chip, activeSubject === s && styles.chipActive]}
            onPress={() => setActiveSubject(s)}
          >
            <Text style={[styles.chipText, activeSubject === s && styles.chipTextActive]}>
              {s}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Results count */}
      <View style={styles.resultsMeta}>
        <Text style={styles.resultsCount}>
          {filtered.length} tutor{filtered.length !== 1 ? 's' : ''} available
        </Text>
      </View>

      {/* Tutor Cards */}
      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="search-outline" size={48} color={colors.gray300} />
            <Text style={styles.emptyText}>No tutors found.</Text>
            <Text style={styles.emptySubtext}>Try a different subject or search term.</Text>
          </View>
        }
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.card}
            onPress={() => navigation.navigate('TutorProfile', { tutor: item })}
            activeOpacity={0.85}
          >
            <View style={styles.cardTop}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{item.initials}</Text>
              </View>
              <View style={styles.cardInfo}>
                <Text style={styles.cardName}>{item.name}</Text>
                <Text style={styles.cardGrade}>{item.grade}</Text>
                <View style={styles.ratingRow}>
                  <Ionicons name="star" size={13} color={colors.red} />
                  <Text style={styles.ratingText}>{item.rating}</Text>
                  <Text style={styles.reviewCount}>({item.reviews} reviews)</Text>
                </View>
              </View>
              <View style={styles.rateBox}>
                <Text style={styles.rateValue}>${item.rate}</Text>
                <Text style={styles.rateLabel}>/hr</Text>
              </View>
            </View>

            {/* Subject tags */}
            <View style={styles.tagRow}>
              {item.subjects.map((s) => (
                <View key={s} style={styles.tag}>
                  <Text style={styles.tagText}>{s}</Text>
                </View>
              ))}
            </View>

            {/* Availability */}
            <View style={styles.availRow}>
              <Ionicons name="time-outline" size={13} color={colors.green} />
              <Text style={styles.availText}>{item.availability}</Text>
            </View>

            <View style={styles.viewBtn}>
              <Text style={styles.viewBtnText}>View Profile</Text>
              <Ionicons name="arrow-forward" size={14} color={colors.white} />
            </View>
          </TouchableOpacity>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.offWhite },
  header: {
    backgroundColor: colors.red,
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 20,
  },
  headerTitle: { color: colors.white, fontSize: 26, fontWeight: '800' },
  headerSub: { color: colors.white, fontSize: 12, opacity: 0.8, marginTop: 2 },

  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    marginHorizontal: 16,
    marginTop: -14,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
  searchIcon: { marginRight: 8 },
  searchInput: { flex: 1, fontSize: 14, color: colors.black },

  chipRow: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.gray300,
  },
  chipActive: {
    backgroundColor: colors.red,
    borderColor: colors.red,
  },
  chipText: { fontSize: 13, color: colors.gray700, fontWeight: '500' },
  chipTextActive: { color: colors.white, fontWeight: '700' },

  resultsMeta: {
    paddingHorizontal: 20,
    paddingBottom: 8,
  },
  resultsCount: { fontSize: 13, color: colors.gray500 },

  list: { paddingHorizontal: 16, paddingBottom: 24 },

  card: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  cardTop: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 12 },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: colors.red,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  avatarText: { color: colors.white, fontWeight: '800', fontSize: 16 },
  cardInfo: { flex: 1 },
  cardName: { fontSize: 16, fontWeight: '800', color: colors.black },
  cardGrade: { fontSize: 12, color: colors.gray500, marginTop: 1 },
  ratingRow: { flexDirection: 'row', alignItems: 'center', marginTop: 4, gap: 3 },
  ratingText: { fontSize: 13, fontWeight: '700', color: colors.black },
  reviewCount: { fontSize: 11, color: colors.gray500 },

  rateBox: { alignItems: 'flex-end' },
  rateValue: { fontSize: 20, fontWeight: '800', color: colors.green },
  rateLabel: { fontSize: 11, color: colors.gray500 },

  tagRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 10 },
  tag: {
    backgroundColor: colors.offWhite,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  tagText: { fontSize: 12, color: colors.redDark, fontWeight: '600' },

  availRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginBottom: 14 },
  availText: { fontSize: 12, color: colors.green, fontWeight: '500' },

  viewBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.red,
    borderRadius: 10,
    paddingVertical: 10,
    gap: 6,
  },
  viewBtnText: { color: colors.white, fontWeight: '700', fontSize: 14 },

  empty: { alignItems: 'center', paddingTop: 60 },
  emptyText: { fontSize: 16, fontWeight: '700', color: colors.gray500, marginTop: 12 },
  emptySubtext: { fontSize: 13, color: colors.gray300, marginTop: 4 },
});
