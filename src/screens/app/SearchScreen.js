import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  SafeAreaView, StatusBar, FlatList, Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { searchTutors } from '../../lib/supabase';
import useAuthStore from '../../store/useAuthStore';
import useResponsive from '../../hooks/useResponsive';
import colors from '../../theme/colors';
import { heading } from '../../theme/fonts';
import TutorCard from '../../components/TutorCard';
import SkeletonCard from '../../components/SkeletonCard';
import { SUBJECT_CATEGORIES, DAYS, PERIODS } from '../../constants';

const ALL_DAYS = ['Any day', ...DAYS];

export default function SearchScreen({ navigation }) {
  const { profile } = useAuthStore();
  const { isPhone, isTablet, isDesktop, columns, padding, screenWidth } = useResponsive();
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

  // Calculate number of columns for grid
  const numColumns = columns;
  const key = `grid-${numColumns}`; // Force re-render when columns change

  const renderItem = ({ item, index }) => {
    if (loading) {
      return (
        <View style={[
          styles.gridItem,
          numColumns > 1 && { width: `${100 / numColumns - 2}%`, marginHorizontal: '1%' }
        ]}>
          <SkeletonCard />
        </View>
      );
    }
    return (
      <View style={[
        styles.gridItem,
        numColumns > 1 && { width: `${100 / numColumns - 2}%`, marginHorizontal: '1%' }
      ]}>
        <TutorCard
          tutor={item}
          onPress={() => navigation.navigate('TutorProfile', { tutor: item })}
        />
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" backgroundColor={colors.red} />

      {/* Header */}
      <View style={[styles.header, !isPhone && styles.headerWide]}>
        <View style={[!isPhone && styles.headerContent]}>
          <Text style={[styles.headerTitle, !isPhone && styles.headerTitleLarge]}>Find a Tutor</Text>
          <Text style={[styles.headerSub, !isPhone && styles.headerSubLarge]}>Strake Jesuit · SAT & AP Tutoring</Text>
        </View>
      </View>

      {/* Search bar */}
      <View style={[styles.searchRow, !isPhone && styles.searchRowWide]}>
        <View style={[!isPhone && styles.searchContent]}>
          <View style={styles.searchInner}>
            <View style={[styles.searchWrap, !isPhone && styles.searchWrapWide]}>
              <Ionicons name="search" size={18} color={colors.gray400} style={styles.searchIcon} />
              <TextInput
                style={[styles.searchInput, !isPhone && styles.searchInputWide]}
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
        </View>
      </View>

      {/* Match-my-schedule quick toggle (students only) */}
      {isStudent && (
        <View style={[styles.matchRow, !isPhone && styles.matchRowWide]}>
          <View style={[!isPhone && styles.matchContent]}>
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
        </View>
      )}

      {/* Expandable filters */}
      {showFilters && (
        <View style={[styles.filtersPanel, !isPhone && styles.filtersPanelWide]}>
          <View style={[!isPhone && styles.filtersContent]}>
            {/* Filters arranged in columns on larger screens */}
            <View style={[!isPhone && styles.filtersGrid]}>
              {/* Subject */}
              <View style={[!isPhone && styles.filterColumn]}>
                <Text style={styles.filterLabel}>Subject</Text>
                <View style={[styles.chipRow, { marginBottom: 6 }]}>
                  <TouchableOpacity
                    style={[styles.chip, subject === null && styles.chipActive]}
                    onPress={() => setSubject(null)}
                  >
                    <Text style={[styles.chipText, subject === null && styles.chipTextActive]}>All</Text>
                  </TouchableOpacity>
                </View>
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
              </View>

              {/* Day & Period in a row on larger screens */}
              <View style={[!isPhone && styles.filterColumn]}>
                <Text style={[styles.filterLabel, isPhone && { marginTop: 12 }]}>Day</Text>
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
              </View>
            </View>

            {hasFilters && (
              <TouchableOpacity style={styles.clearBtn} onPress={clearFilters}>
                <Text style={styles.clearBtnText}>Clear filters</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      )}

      {/* Results meta */}
      {!loading && (
        <View style={[styles.meta, { paddingHorizontal: padding }]}>
          <Text style={styles.metaText}>
            {results.length} tutor{results.length !== 1 ? 's' : ''} found
            {matchSchedule ? ' · sorted by schedule overlap' : ''}
          </Text>
        </View>
      )}

      {/* Results */}
      <FlatList
        key={key}
        data={loading ? Array(numColumns * 2).fill(null).map((_, i) => i + 1) : results}
        keyExtractor={(item) => (loading ? String(item) : item.id)}
        numColumns={numColumns}
        contentContainerStyle={[styles.list, { paddingHorizontal: padding }]}
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
        renderItem={renderItem}
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
  headerWide: {
    paddingHorizontal: 32,
    paddingTop: 16,
    paddingBottom: 28,
  },
  headerContent: {
    maxWidth: 1100,
    marginHorizontal: 'auto',
    width: '100%',
  },
  headerTitle: { color: colors.white, fontSize: 26, fontFamily: heading.lg.fontFamily, fontWeight: '800' },
  headerTitleLarge: { fontSize: 32 },
  headerSub: { color: colors.white, fontSize: 12, opacity: 0.8, marginTop: 2 },
  headerSubLarge: { fontSize: 14 },

  searchRow: {
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray100,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  searchRowWide: {
    paddingHorizontal: 32,
    paddingVertical: 16,
  },
  searchContent: {
    maxWidth: 1100,
    marginHorizontal: 'auto',
    width: '100%',
  },
  searchInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
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
  searchWrapWide: {
    maxWidth: 500,
    paddingVertical: 12,
  },
  searchIcon:  { marginRight: 8 },
  searchInput: { flex: 1, fontSize: 15, color: colors.black },
  searchInputWide: { fontSize: 16 },
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
  matchRowWide: {
    paddingHorizontal: 32,
    paddingVertical: 14,
  },
  matchContent: {
    maxWidth: 1100,
    marginHorizontal: 'auto',
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
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
  filtersPanelWide: {
    paddingHorizontal: 32,
    paddingVertical: 24,
  },
  filtersContent: {
    maxWidth: 1100,
    marginHorizontal: 'auto',
    width: '100%',
  },
  filtersGrid: {
    flexDirection: 'row',
    gap: 40,
  },
  filterColumn: {
    flex: 1,
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
  gridItem: {
    marginBottom: 14,
  },
  empty: { alignItems: 'center', paddingTop: 72 },
  emptyText:    { fontSize: 16, fontWeight: '700', color: colors.gray500, marginTop: 14 },
  emptySubtext: { fontSize: 13, color: colors.gray300, marginTop: 4 },
});
