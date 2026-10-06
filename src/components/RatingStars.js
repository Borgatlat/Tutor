import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import colors from '../theme/colors';

// colors.star is the ONLY place gold appears in the app - stars are a universal
// convention, so they keep it. Everything else is green.
export default function RatingStars({ rating, count, size = 14, showCount = true }) {
  const rounded = Math.round(rating ?? 0);
  const hasRating = rating != null && Number(rating) > 0;

  return (
    <View
      style={styles.row}
      accessibilityLabel={
        hasRating
          ? `Rated ${Number(rating).toFixed(1)} out of 5${count != null ? `, ${count} reviews` : ''}`
          : 'No ratings yet'
      }
    >
      {[1, 2, 3, 4, 5].map((i) => (
        <Ionicons
          key={i}
          name={i <= rounded ? 'star' : 'star-outline'}
          size={size}
          color={hasRating ? colors.star : colors.gray300}
        />
      ))}

      {showCount && (
        <Text style={[styles.val, { fontSize: size }]}>
          {hasRating ? ` ${Number(rating).toFixed(1)}` : ' -'}
          {count != null && <Text style={styles.count}> ({count})</Text>}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  row:   { flexDirection: 'row', alignItems: 'center' },
  val:   { fontWeight: '700', color: colors.black, marginLeft: 2 },
  count: { fontWeight: '400', color: colors.gray500 },
});
