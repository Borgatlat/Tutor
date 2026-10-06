import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  SafeAreaView, StatusBar, FlatList, ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { searchTutors } from '../../lib/supabase';
import useAuthStore from '../../store/useAuthStore';
import colors from '../../theme/colors';
import { radii, space, border, press, hit, rule } from '../../theme/layout';
import { heading, label } from '../../theme/fonts';
import AppTextInput from '../../components/AppTextInput';
import TutorCard from '../../components/TutorCard';
import SkeletonCard from '../../components/SkeletonCard';
import {
  Chip, EmptyState, IconButton, SubjectPicker,
} from '../../components/ui';
import { BLOCKS } from '../../constants';
import { useResponsive } from '../../hooks/useResponsive';

export default function SearchScreen({ navigation }) {
  const { profile } = useAuthStore();
  const { isWide, columns } = useResponsive();
  const isStudent = profile?.role === 'student' || profile?.role === 'both';

  const [query, setQuery]                 = useState('');
  const [subject, setSubject]             = useState(null);
  const [block, setBlock]                 = useState(null);
  const [matchSchedule, setMatchSchedule] = useState(false);
  const [results, setResults]             = useState([]);
  const [loading, setLoading]             = useState(true);
  const [showFilters, setShowFilters]     = useState(false);

  const debounceRef = React.useRef(null);

  const runSearch = useCallback(async (q, s, b, match) => {
    setLoading(true);
    try {
      const data = await searchTutors({
        query: q, subject: s, period: b,
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

  useEffect(() => {
    runSearch(query, subject, block, matchSchedule);
  }, [subject, block, matchSchedule]);

  const handleQueryChange = (text) => {
    setQuery(text);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => runSearch(text, subject, block, matchSchedule), 300);
  };

  const clearFilters = () => { setSubject(null); setBlock(null); setMatchSchedule(false); };
  const hasFilters = !!subject || block != null || matchSchedule;

  // ── Filter panel ────────────────────────────────────────────────────────────
  const filters = (containerStyle) => (
    <View style={containerStyle}>
      <Text style={styles.filterLabel}>Subject</Text>
      <SubjectPicker
        selected={subject}
        onToggle={(s) => setSubject(subject === s ? null : s)}
        allLabel="All subjects"
        onSelectAll={() => setSubject(null)}
      />

      <Text style={[styles.filterLabel, styles.filterLabelSpaced]}>Free Block</Text>
      <View style={styles.chipRow}>
        <Chip label="Any" selected={block === null} onPress={() => setBlock(null)} />
        {BLOCKS.map((b) => (
          <Chip
            key={b}
            label={`B${b}`}
            minWidth={52}
            selected={block === b}
            onPress={() => setBlock(block === b ? null : b)}
            accessibilityLabel={`Filter to block ${b}`}
          />
        ))}
      </View>

      {hasFilters ? (
        <TouchableOpacity
          style={styles.clearBtn}
          onPress={clearFilters}
          hitSlop={hit.slop}
          activeOpacity={press.opacity}
          accessibilityRole="button"
          accessibilityLabel="Clear all filters"
        >
          <Text style={styles.clearBtnText}>Clear filters</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );

  const matchToggle = isStudent ? (
    <Chip
      label="Match my schedule"
      selected={matchSchedule}
      showCheck
      onPress={() => setMatchSchedule(!matchSchedule)}
    />
  ) : null;

  const results_ = (
    <FlatList
      key={columns}
      data={loading ? [1, 2, 3, 4] : results}
      keyExtractor={(item) => (loading ? String(item) : item.id)}
      numColumns={columns}
      columnWrapperStyle={columns > 1 ? styles.columnWrapper : undefined}
      contentContainerStyle={styles.list}
      showsVerticalScrollIndicator={false}
      ListEmptyComponent={
        !loading ? (
          <EmptyState
            icon="search-outline"
            title="No tutors found"
            body={
              hasFilters || query
                ? 'Try adjusting your search or clearing some filters.'
                : 'No Crusaders have listed subjects yet. Check back soon.'
            }
            actionLabel={hasFilters ? 'Clear filters' : undefined}
            onAction={hasFilters ? clearFilters : undefined}
          />
        ) : null
      }
      renderItem={({ item }) => (
        <View style={columns > 1 ? styles.gridItem : undefined}>
          {loading ? (
            <SkeletonCard />
          ) : (
            <TutorCard
              tutor={item}
              onPress={() => navigation.navigate('TutorProfile', { tutor: item })}
            />
          )}
        </View>
      )}
    />
  );

  const metaLine = !loading ? (
    <Text style={styles.metaText}>
      {results.length} tutor{results.length === 1 ? '' : 's'} found
      {matchSchedule ? ' · sorted by block overlap' : ''}
    </Text>
  ) : null;

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" backgroundColor={colors.brand} />

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerRule} />
        <Text style={styles.headerTitle}>Find a Tutor</Text>
        <Text style={styles.headerSub}>Core classes · SAT · AP</Text>
      </View>

      {/* Search row */}
      <View style={styles.searchRow}>
        <View style={styles.searchWrap}>
          <Ionicons name="search" size={18} color={colors.gray400} style={styles.searchIcon} />
          <AppTextInput
            style={styles.searchInput}
            placeholder="Search by name…"
            placeholderTextColor={colors.gray400}
            value={query}
            onChangeText={handleQueryChange}
            accessibilityLabel="Search tutors by name"
          />
          {query.length > 0 ? (
            <IconButton
              icon="close-circle"
              label="Clear search"
              onPress={() => handleQueryChange('')}
              size={18}
              color={colors.gray400}
            />
          ) : null}
        </View>

        {/* Desktop keeps the schedule toggle inline; mobile gets a filter
            disclosure button because there is no room for a sidebar. */}
        {isWide ? matchToggle : (
          <TouchableOpacity
            style={[styles.filterToggle, hasFilters && styles.filterToggleActive]}
            onPress={() => setShowFilters(!showFilters)}
            activeOpacity={press.opacity}
            accessibilityRole="button"
            accessibilityLabel={showFilters ? 'Hide filters' : 'Show filters'}
            accessibilityState={{ expanded: showFilters }}
          >
            <Ionicons
              name="options"
              size={20}
              color={hasFilters ? colors.white : colors.gray600}
            />
          </TouchableOpacity>
        )}
      </View>

      {/* Mobile-only schedule toggle row */}
      {!isWide && matchToggle ? (
        <View style={styles.matchRow}>
          {matchToggle}
          {matchSchedule ? (
            <Text style={styles.matchNote}>
              Tutors sharing your free blocks are ranked first
            </Text>
          ) : null}
        </View>
      ) : null}

      {/* Body: sidebar + results on desktop, stacked on mobile */}
      {isWide ? (
        <View style={styles.wideBody}>
          <ScrollView style={styles.sidebar} showsVerticalScrollIndicator={false}>
            {filters(styles.sidebarInner)}
          </ScrollView>
          <View style={styles.wideResults}>
            {metaLine}
            {results_}
          </View>
        </View>
      ) : (
        <>
          {showFilters ? filters(styles.mobileFilterPanel) : null}
          {metaLine}
          {results_}
        </>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.offWhite },

  header: {
    backgroundColor: colors.brand,
    paddingHorizontal: space.xl,
    paddingTop: space.lg,
    paddingBottom: space.xl,
    borderBottomLeftRadius: radii.xxl,
    borderBottomRightRadius: radii.xxl,
  },
  // Short gold rule above the screen title (school-site heading treatment).
  headerRule: {
    width: rule.width, height: rule.height, borderRadius: rule.radius,
    backgroundColor: colors.gold,
    marginBottom: space.md,
  },
  headerTitle: { ...heading.xl, color: colors.white, fontSize: 28 },
  headerSub:   { ...label.caps, color: colors.whiteAlpha[65], fontSize: 10, letterSpacing: 2.2, marginTop: space.xs },

  searchRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: space.lg, paddingVertical: space.md, gap: space.sm,
  },
  searchWrap: {
    flex: 1, flexDirection: 'row', alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: radii.pill,
    paddingHorizontal: space.lg,
    borderWidth: border.control, borderColor: colors.line,
  },
  searchIcon:  { marginRight: space.sm },
  searchInput: { flex: 1, fontSize: 15, color: colors.black, paddingVertical: space.md },

  filterToggle: {
    width: 48, height: 48, borderRadius: radii.pill,
    backgroundColor: colors.white,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: border.control, borderColor: colors.line,
  },
  filterToggleActive: { backgroundColor: colors.accent, borderColor: colors.accent },

  matchRow: {
    flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: space.sm,
    paddingHorizontal: space.lg, paddingVertical: space.sm,
  },
  matchNote: { fontSize: 11, color: colors.gray500, flex: 1 },

  // Desktop two-panel
  wideBody: { flex: 1, flexDirection: 'row' },
  // flexGrow/flexShrink 0: a ScrollView grows by default on web, which
  // stretched this panel across the page and squeezed the results.
  sidebar: {
    width: 300,
    flexGrow: 0,
    flexShrink: 0,
    backgroundColor: colors.white,
    borderRightWidth: border.hairline, borderRightColor: colors.gray200,
  },
  sidebarInner: { paddingHorizontal: space.lg, paddingVertical: space.xl },
  wideResults:  { flex: 1 },

  mobileFilterPanel: {
    backgroundColor: colors.white,
    marginHorizontal: space.lg, marginBottom: space.sm,
    padding: space.lg,
    borderRadius: radii.lg,
    borderWidth: 1, borderColor: colors.lineSoft,
  },

  filterLabel: {
    ...label.caps, fontSize: 11, letterSpacing: 1.6,
    color: colors.gray600, marginBottom: space.sm,
  },
  filterLabelSpaced: { marginTop: space.lg },

  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm },

  clearBtn:     { alignSelf: 'flex-start', marginTop: space.lg },
  clearBtnText: {
    fontSize: 13, color: colors.accent,
    fontWeight: '600', textDecorationLine: 'underline',
  },

  metaText: {
    ...label.caps, fontSize: 10, letterSpacing: 2, color: colors.gray500,
    paddingHorizontal: space.lg, paddingTop: space.md, paddingBottom: space.xs,
  },

  list:          { paddingHorizontal: space.lg, paddingTop: space.sm, paddingBottom: space.xxxl },
  columnWrapper: { gap: space.md },
  gridItem:      { flex: 1 },
});
