import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  SafeAreaView, StatusBar, FlatList, ScrollView, RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { searchTutors, supabase } from '../../lib/supabase';
import useAuthStore from '../../store/useAuthStore';
import colors from '../../theme/colors';
import { cardShadow } from '../../theme/shadows';
import { radii, space, border, press, hit, rule } from '../../theme/layout';
import { heading, label, type } from '../../theme/fonts';
import { school } from '../../theme/school';
import AppTextInput from '../../components/AppTextInput';
import TutorCard from '../../components/TutorCard';
import SkeletonCard from '../../components/SkeletonCard';
import InviteButton from '../../components/InviteButton';
import OllieButton from '../../components/OllieButton';
import {
  Chip, EmptyState, FadeIn, IconButton, SubjectPicker,
  OrganicBackdrop,
} from '../../components/ui';
import { BLOCKS } from '../../constants';
import { blockLabel, blockName } from '../../utils/schedule';
import { useResponsive } from '../../hooks/useResponsive';

export default function SearchScreen({ navigation, route }) {
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

  const runSearch = useCallback(async (q, s, b, match, silent = false) => {
    if (!silent) setLoading(true);
    try {
      const data = await searchTutors({
        query: q, subject: s, period: b,
        studentId:     match && isStudent ? profile?.id : null,
        matchSchedule: match && isStudent,
      });
      setResults(data);
      // Record subject searches (no names) so moderators can see where
      // students look for help and find nobody. Never blocks the screen.
      if (s && !silent && !q) {
        supabase.rpc('log_search', { subject: s, period: b ?? null, results: data?.length ?? 0 })
          .then(() => {}, () => {});
      }
    } catch (e) {
      if (__DEV__) console.warn('[SearchScreen]', e.message);
    } finally {
      setLoading(false);
    }
  }, [profile?.id, isStudent]);

  useEffect(() => {
    runSearch(query, subject, block, matchSchedule);
  }, [subject, block, matchSchedule]);

  // "See all in Search" from Ask Ollie opens here with Ollie's filters.
  const fromOllie = route?.params?.ollie;
  useEffect(() => {
    if (!fromOllie) return;
    setQuery('');
    setSubject(fromOllie.subject ?? null);
    setBlock(fromOllie.block ?? null);
    setMatchSchedule(!!fromOllie.matchSchedule && isStudent);
  }, [fromOllie?.at]);

  const handleQueryChange = (text) => {
    setQuery(text);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => runSearch(text, subject, block, matchSchedule), 300);
  };

  const [refreshing, setRefreshing] = useState(false);
  const onRefresh = async () => {
    setRefreshing(true);
    await runSearch(query, subject, block, matchSchedule, true);
    setRefreshing(false);
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
            label={blockLabel(b)}
            minWidth={52}
            selected={block === b}
            onPress={() => setBlock(block === b ? null : b)}
            accessibilityLabel={`Filter to ${blockName(b)}`}
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
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor={colors.brandText}
          colors={[colors.brand]}
        />
      }
      ListEmptyComponent={
        !loading ? (
          <EmptyState
            icon="search-outline"
            title={hasFilters || query ? 'No tutors found' : 'No tutors yet'}
            body={
              hasFilters || query
                ? `Try adjusting your search or clearing some filters. Or invite someone who knows ${subject ?? 'it'} to tutor.`
                : `Be the one who gets tutoring started: invite a friend who's strong in a class. Tutors earn service hours for every session.`
            }
            actionLabel={hasFilters ? 'Clear filters' : undefined}
            onAction={hasFilters ? clearFilters : undefined}
          >
            <InviteButton
              kind="recruit"
              subject={subject ?? undefined}
              label={subject ? `Invite someone to tutor ${subject}` : undefined}
              variant={hasFilters ? 'secondary' : 'primary'}
            />
          </EmptyState>
        ) : null
      }
      renderItem={({ item, index }) => (
        <View style={columns > 1 ? styles.gridItem : undefined}>
          {loading ? (
            <SkeletonCard />
          ) : (
            <FadeIn index={index}>
              <TutorCard
                tutor={item}
                onPress={() => navigation.navigate('TutorProfile', { tutor: item })}
              />
            </FadeIn>
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
        <OrganicBackdrop />
        <View style={styles.headerRule} />
        <Text style={styles.headerTitle}>Find a tutor</Text>
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
      {isStudent ? <OllieButton navigation={navigation} /> : null}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.offWhite },

  header: {
    overflow: 'hidden',
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
  headerTitle: { ...type.title, color: colors.white },
  headerSub:   { ...label.caps, color: colors.whiteAlpha[65], fontSize: 10, letterSpacing: 2.2, marginTop: space.xs },

  searchRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: space.lg, paddingVertical: space.md, gap: space.sm,
  },
  searchWrap: {
    flex: 1, flexDirection: 'row', alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radii.pill,
    paddingHorizontal: space.lg,
    borderWidth: border.control, borderColor: colors.line,
  },
  searchIcon:  { marginRight: space.sm },
  searchInput: { flex: 1, fontSize: 15, color: colors.black, paddingVertical: space.md },

  filterToggle: {
    width: 48, height: 48, borderRadius: radii.pill,
    backgroundColor: colors.surface,
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
    backgroundColor: colors.surface,
    borderRightWidth: border.hairline, borderRightColor: colors.gray200,
  },
  sidebarInner: { paddingHorizontal: space.lg, paddingVertical: space.xl },
  wideResults:  { flex: 1 },

  mobileFilterPanel: {
    backgroundColor: colors.surface,
    marginHorizontal: space.lg, marginBottom: space.sm,
    padding: space.lg,
    borderRadius: radii.lg,
    ...cardShadow,
  },

  filterLabel: { ...type.small, fontWeight: '600', color: colors.gray700, marginBottom: space.sm },
  filterLabelSpaced: { marginTop: space.lg },

  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm },

  clearBtn:     { alignSelf: 'flex-start', marginTop: space.lg },
  clearBtnText: {
    fontSize: 13, color: colors.brandText,
    fontWeight: '600', textDecorationLine: 'underline',
  },

  metaText: {
    ...label.caps, fontSize: 10, letterSpacing: 2, color: colors.gray500,
    paddingHorizontal: space.lg, paddingTop: space.md, paddingBottom: space.xs,
  },

  list:          { paddingHorizontal: space.lg, paddingTop: space.sm, paddingBottom: 88 },  // room for Ollie
  columnWrapper: { gap: space.md },
  gridItem:      { flex: 1 },
});
