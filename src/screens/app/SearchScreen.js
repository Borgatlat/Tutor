import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  SafeAreaView, StatusBar, FlatList,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { searchTutors } from '../../lib/supabase';
import useAuthStore from '../../store/useAuthStore';
import colors from '../../theme/colors';
import { heading } from '../../theme/fonts';
import TutorCard from '../../components/TutorCard';
import SkeletonCard from '../../components/SkeletonCard';
import { SUBJECT_CATEGORIES, DAYS, PERIODS } from '../../constants';

const ALL_DAYS = ['Any day', ...DAYS];

export default function SearchScreen({ navigation }) {
  const { profile } = useAuthStore();
  const isStudent = profile?.role === 'student' || profile?.role === 'both';

  const [query, setQuery]               = useState('');
  const [subject, setSubject]           = useState(null);
  const [day, setDay]                   = useState(null);
  const [period, setPeriod]             = useState(null);
  const [matchSchedule, setMatchSchedule] = useState(false);
  const [results, setResults]           = useState([]);
  const [loading, setLoading]           = useState(true);
  const [showFilters, setShowFilters]   = useState(false);

  // Debounce ref
  const debounceRef = React.useRef(null);

  const runSearch = useCallback(async (q, s, d, p, match) => {
    setLoading(true);
    try {
      const data = await searchTutors({
        query: q,
        subject: s,
        day: d,
        period: p,
        studentId:     match && isStudent ? profile?.id : null,
        matchSchedule: match && isStudent,
      });
      setResults(data);
    } catch (e) {
      if (__DEV__) console.warn('[SearchScreen]', e.message);
    } finally {
      setLoading(false);
    }
  }, [profile?.id, isStudent]);

  // Re-run whenever any filter changes (including match-schedule toggle)
  useEffect(() => {
    runSearch(query, subject, day, period, matchSchedule);
  }, [subject, day, period, matchSchedule]);

  // Debounce name search
  const handleQueryChange = (text) => {
    setQuery(text);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      runSearch(text, subject, day, period, matchSchedule);
    }, 300);
  };

  const clearFilters = () => {
    setSubject(null);
    setDay(null);
    setPeriod(null);
    setMatchSchedule(false);
  };

  const hasFilters = subject || day || period || matchSchedule;

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" backgroundColor={colors.red} />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Find a Tutor</Text>
        <Text style={styles.headerSub}>Strake Jesuit · SAT & AP Tutoring</Text>
      </View>

      {/* Search bar */}
      <View style={styles.searchRow}>
        <View style={styles.searchWrap}>
          <Ionicons name="search" size={18} color={colors.gray400} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by name…"
            placeholderTextColor={colors.gray300}
            value={query}
            onChangeText={handleQueryChange}
          />
          {query.length > 0 && (
            <TouchableOpacity onPress={() => handleQueryChange('')}>
              <Ionicons name="close-circle" size={18} color={colors.gray300} />
            </TouchableOpacity>
          )}
        </View>
        <TouchableOpacity
          style={[styles.filterToggle, hasFilters && styles.filterToggleActive]}
          onPress={() => setShowFilters(!showFilters)}
        >
          <Ionicons
            name="options"
            size={20}
            color={hasFilters ? colors.white : colors.gray600}
          />
        </TouchableOpacity>
      </View>

      {/* Match-my-schedule quick toggle (students only) */}
      {isStudent && (
        <View style={styles.matchRow}>
          <TouchableOpacity
            style={[styles.matchChip, matchSchedule && styles.matchChipActive]}
            onPress={() => setMatchSchedule(!matchSchedule)}
            activeOpacity={0.8}
          >
            <Ionicons
              name={matchSchedule ? 'calendar-number' : 'calendar-number-outline'}
              size={15}
              color={matchSchedule ? colors.white : colors.red}
            />
            <Text style={[styles.matchChipText, matchSchedule && styles.matchChipTextActive]}>
              Match my schedule
            </Text>
            {matchSchedule && (
              <Ionicons name="checkmark-circle" size={14} color="rgba(255,255,255,0.8)" />
            )}
          </TouchableOpacity>
          {matchSchedule && (
            <Text style={styles.matchNote}>
              Tutors sharing your free periods are ranked first
            </Text>
          )}
        </View>
      )}

      {/* Expandable filters */}
      {showFilters && (
        <View style={styles.filtersPanel}>
          {/* Subject */}
          <Text style={styles.filterLabel}>Subject</Text>
          {/* "All" chip */}
          <View style={[styles.chipRow, { marginBottom: 6 }]}>
            <TouchableOpacity
              style={[styles.chip, subject === null && styles.chipActive]}
              onPress={() => setSubject(null)}
            >
              <Text style={[styles.chipText, subject === null && styles.chipTextActive]}>All</Text>
            </TouchableOpacity>
          </View>
          {/* Category groups */}
          {Object.entries(SUBJECT_CATEGORIES).map(([cat, subjects]) => (
            <View key={cat} style={styles.filterCategoryBlock}>
              <Text style={styles.filterCategoryLabel}>{cat}</Text>
              <View style={styles.chipRow}>
                {subjects.map((s) => {
                  const active = subject === s;
                  return (
                    <TouchableOpacity
                      key={s}
                      style={[styles.chip, active && styles.chipActive]}
                      onPress={() => setSubject(active ? null : s)}
                    >
                      <Text style={[styles.chipText, active && styles.chipTextActive]}>{s}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          ))}

          {/* Day */}
          <Text style={[styles.filterLabel, { marginTop: 12 }]}>Day</Text>
          <View style={styles.chipRow}>
            {ALL_DAYS.map((d) => {
              const val    = d === 'Any day' ? null : d;
              const active = day === val;
              return (
                <TouchableOpacity
                  key={d}
                  style={[styles.chip, active && styles.chipActive]}
                  onPress={() => setDay(val)}
                >
                  <Text style={[styles.chipText, active && styles.chipTextActive]}>{d}</Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Period */}
          <Text style={[styles.filterLabel, { marginTop: 12 }]}>Free Period</Text>
          <View style={styles.chipRow}>
            <TouchableOpacity
              style={[styles.chip, period === null && styles.chipActive]}
              onPress={() => setPeriod(null)}
            >
              <Text style={[styles.chipText, period === null && styles.chipTextActive]}>Any</Text>
            </TouchableOpacity>
            {PERIODS.map((p) => (
              <TouchableOpacity
                key={p}
                style={[styles.chip, period === p && styles.chipActive]}
                onPress={() => setPeriod(p)}
              >
                <Text style={[styles.chipText, period === p && styles.chipTextActive]}>P{p}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {hasFilters && (
            <TouchableOpacity style={styles.clearBtn} onPress={clearFilters}>
              <Text style={styles.clearBtnText}>Clear filters</Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* Results meta */}
      {!loading && (
        <View style={styles.meta}>
          <Text style={styles.metaText}>
            {results.length} tutor{results.length !== 1 ? 's' : ''} found
            {matchSchedule ? ' · sorted by schedule overlap' : ''}
          </Text>
        </View>
      )}

      {/* Results */}
      <FlatList
        data={loading ? [1, 2, 3, 4] : results}
        keyExtractor={(item) => (loading ? String(item) : item.id)}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          !loading ? (
            <View style={styles.empty}>
              <Ionicons name="search-outline" size={52} color={colors.gray300} />
              <Text style={styles.emptyText}>No tutors found</Text>
              <Text style={styles.emptySubtext}>Try adjusting your search or filters</Text>
            </View>
          ) : null
        }
        renderItem={({ item }) =>
          loading ? (
            <SkeletonCard />
          ) : (
            <TutorCard
              tutor={item}
              onPress={() => navigation.navigate('TutorProfile', { tutor: item })}
            />
          )
        }
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
  headerTitle: { color: colors.white, fontSize: 26, fontFamily: heading.lg.fontFamily, fontWeight: '800' },
  headerSub:   { color: colors.white, fontSize: 12, opacity: 0.8, marginTop: 2 },

  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 10,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray100,
  },
  searchWrap: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.offWhite,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderWidth: 1.5,
    borderColor: colors.gray200,
  },
  searchIcon:  { marginRight: 8 },
  searchInput: { flex: 1, fontSize: 15, color: colors.black },
  filterToggle: {
    width: 44, height: 44, borderRadius: 12,
    backgroundColor: colors.gray100,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1.5, borderColor: colors.gray200,
  },
  filterToggleActive: { backgroundColor: colors.red, borderColor: colors.red },

  matchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray100,
  },
  matchChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: colors.red,
    backgroundColor: colors.white,
  },
  matchChipActive:     { backgroundColor: colors.red },
  matchChipText:       { fontSize: 13, fontWeight: '700', color: colors.red },
  matchChipTextActive: { color: colors.white },
  matchNote: { fontSize: 11, color: colors.gray500, flex: 1 },

  filtersPanel: {
    backgroundColor: colors.white,
    paddingHorizontal: 18,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray100,
  },
  filterLabel: { fontSize: 11, fontWeight: '700', color: colors.gray500, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 },
  chipRow:     { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    paddingHorizontal: 14, paddingVertical: 7,
    borderRadius: 20, borderWidth: 1.5, borderColor: colors.gray200,
    backgroundColor: colors.white,
  },
  chipActive:     { backgroundColor: colors.red, borderColor: colors.red },
  chipText:       { fontSize: 13, color: colors.gray700 },
  chipTextActive: { color: colors.white, fontWeight: '700' },

  filterCategoryBlock: { marginBottom: 10 },
  filterCategoryLabel: {
    fontSize: 10, fontWeight: '700', color: colors.red,
    textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 6,
  },
  clearBtn: { alignSelf: 'flex-start', marginTop: 12 },
  clearBtnText: { fontSize: 13, color: colors.red, fontWeight: '600', textDecorationLine: 'underline' },

  meta:     { paddingHorizontal: 18, paddingVertical: 8 },
  metaText: { fontSize: 13, color: colors.gray500 },

  list:  { paddingHorizontal: 14, paddingTop: 6, paddingBottom: 32 },
  empty: { alignItems: 'center', paddingTop: 72 },
  emptyText:    { fontSize: 16, fontWeight: '700', color: colors.gray500, marginTop: 14 },
  emptySubtext: { fontSize: 13, color: colors.gray300, marginTop: 4 },
});
