import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  SafeAreaView, StatusBar, ScrollView, ActivityIndicator, Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../lib/supabase';
import useAuthStore from '../../store/useAuthStore';
import colors from '../../theme/colors';
import { heading } from '../../theme/fonts';
import SubjectBadge from '../../components/SubjectBadge';

export default function BookSessionScreen({ route, navigation }) {
  const { tutor, slot } = route.params;
  const { profile }     = useAuthStore();

  // subjects may be array of strings or { subject, grade } objects
  const subjectList = (tutor.subjects ?? []).map((s) => (typeof s === 'object' ? s.subject : s));
  const [subject, setSubject] = useState(subjectList[0] ?? null);
  const [notes, setNotes]     = useState('');
  const [loading, setLoading] = useState(false);
  const [booked, setBooked]   = useState(false);
  const [bookError, setBookError] = useState('');

  const initials = tutor.full_name?.split(' ').map((w) => w[0]).slice(0, 2).join('') ?? '?';

  const handleBook = async () => {
    if (!subject) { setBookError('Please select a subject before continuing.'); return; }
    setLoading(true);
    setBookError('');
    const { error } = await supabase.from('sessions').insert({
      tutor_id:   tutor.id,
      student_id: profile.id,
      subject,
      day:    slot.day,
      period: slot.period,
      notes:  notes || null,
      status: 'pending',
    });
    setLoading(false);
    if (error) { setBookError(error.message); return; }
    setBooked(true);
  };

  if (booked) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.successScreen}>
          <View style={styles.successCircle}>
            <Ionicons name="checkmark" size={48} color={colors.white} />
          </View>
          <Text style={styles.successTitle}>Session Requested!</Text>
          <Text style={styles.successSub}>
            Your request has been sent to {tutor.full_name}.{'\n'}
            They'll confirm it shortly.
          </Text>
          <View style={styles.confirmCard}>
            <View style={styles.confirmRow}>
              <Ionicons name="person-outline" size={15} color={colors.gray500} />
              <Text style={styles.confirmText}>{tutor.full_name}</Text>
            </View>
            <View style={styles.confirmRow}>
              <Ionicons name="book-outline" size={15} color={colors.gray500} />
              <Text style={styles.confirmText}>{subject}</Text>
            </View>
            <View style={styles.confirmRow}>
              <Ionicons name="calendar-outline" size={15} color={colors.gray500} />
              <Text style={styles.confirmText}>{slot.day} · Period {slot.period}</Text>
            </View>
          </View>
          <TouchableOpacity
            style={styles.doneBtn}
            onPress={() => navigation.navigate('Sessions')}
          >
            <Text style={styles.doneBtnText}>View My Sessions</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.backLink}
            onPress={() => navigation.navigate('Search')}
          >
            <Text style={styles.backLinkText}>Find another tutor</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" backgroundColor={colors.green} />

      {/* Nav */}
      <View style={styles.navBar}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={22} color={colors.white} />
          <Text style={styles.backText}>Back</Text>
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Book a Session</Text>
        </View>

        <View style={styles.card}>
          {/* Tutor summary */}
          <View style={styles.tutorRow}>
            {tutor.avatar_url ? (
              <Image source={{ uri: tutor.avatar_url }} style={styles.avatar} />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Text style={styles.avatarInitials}>{initials}</Text>
              </View>
            )}
            <View>
              <Text style={styles.tutorName}>{tutor.full_name}</Text>
              <Text style={styles.tutorEmail}>{tutor.email}</Text>
            </View>
          </View>

          {/* Slot summary */}
          <View style={styles.slotBanner}>
            <Ionicons name="calendar" size={20} color={colors.green} />
            <Text style={styles.slotText}>{slot.day} · Period {slot.period}</Text>
          </View>

          {/* Subject */}
          <Text style={styles.label}>Subject</Text>
          <View style={styles.subjectRow}>
            {subjectList.map((s) => (
              <TouchableOpacity
                key={s}
                style={[styles.subjectOpt, subject === s && styles.subjectOptActive]}
                onPress={() => setSubject(s)}
              >
                <Text style={[styles.subjectOptText, subject === s && styles.subjectOptTextActive]}>
                  {s}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Notes */}
          <Text style={[styles.label, { marginTop: 20 }]}>Notes (optional)</Text>
          <TextInput
            style={styles.notesInput}
            placeholder="What topics do you need help with?"
            placeholderTextColor={colors.gray300}
            multiline
            numberOfLines={3}
            value={notes}
            onChangeText={setNotes}
          />

          {/* Contact info */}
          <View style={styles.contactNote}>
            <Ionicons name="information-circle-outline" size={15} color={colors.gray500} />
            <Text style={styles.contactNoteText}>
              After confirming, you and {tutor.full_name.split(' ')[0]} can contact each other at{' '}
              <Text style={styles.emailHighlight}>{tutor.email}</Text>
            </Text>
          </View>

          {/* Inline error */}
          {bookError ? (
            <View style={styles.errorBanner}>
              <Ionicons name="alert-circle" size={15} color={colors.white} />
              <Text style={styles.errorBannerText}>{bookError}</Text>
            </View>
          ) : null}

          {/* Submit */}
          <TouchableOpacity
            style={[styles.bookBtn, loading && styles.bookBtnDisabled]}
            onPress={handleBook}
            disabled={loading}
          >
            {loading
              ? <ActivityIndicator color={colors.white} />
              : <><Ionicons name="checkmark-circle" size={18} color={colors.white} /><Text style={styles.bookBtnText}>Send Request</Text></>
            }
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.offWhite },

  navBar: { backgroundColor: colors.green, paddingHorizontal: 16, paddingVertical: 10 },
  backBtn: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  backText: { color: colors.white, fontSize: 15, fontWeight: '600' },

  header: {
    backgroundColor: colors.green,
    paddingHorizontal: 20,
    paddingBottom: 24,
  },
  headerTitle: { color: colors.white, fontSize: 26, fontFamily: heading.lg.fontFamily, fontWeight: '800' },

  card: {
    backgroundColor: colors.white,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 24,
    flex: 1,
    paddingBottom: 48,
  },

  tutorRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 18 },
  avatar:   { width: 52, height: 52, borderRadius: 26 },
  avatarPlaceholder: { width: 52, height: 52, borderRadius: 26, backgroundColor: colors.red, alignItems: 'center', justifyContent: 'center' },
  avatarInitials: { color: colors.white, fontWeight: '800', fontSize: 18 },
  tutorName:  { fontSize: 16, fontWeight: '800', color: colors.black },
  tutorEmail: { fontSize: 12, color: colors.gray500, marginTop: 2 },

  slotBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: colors.greenMuted,
    borderRadius: 12, padding: 14, marginBottom: 22,
    borderWidth: 1.5, borderColor: colors.green,
  },
  slotText: { fontSize: 16, fontWeight: '700', color: colors.green },

  label: { fontSize: 12, fontWeight: '700', color: colors.gray600, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 10 },

  subjectRow: { flexDirection: 'row', gap: 10 },
  subjectOpt: {
    flex: 1, paddingVertical: 12, borderRadius: 12,
    borderWidth: 1.5, borderColor: colors.gray200,
    backgroundColor: colors.offWhite, alignItems: 'center',
  },
  subjectOptActive:     { backgroundColor: colors.red, borderColor: colors.red },
  subjectOptText:       { fontSize: 14, fontWeight: '600', color: colors.gray700 },
  subjectOptTextActive: { color: colors.white, fontWeight: '800' },

  notesInput: {
    borderWidth: 1.5, borderColor: colors.gray200, borderRadius: 14,
    paddingHorizontal: 14, paddingVertical: 12,
    fontSize: 15, color: colors.black,
    backgroundColor: colors.offWhite,
    height: 88, textAlignVertical: 'top',
  },

  contactNote: {
    flexDirection: 'row', gap: 8,
    backgroundColor: colors.offWhite,
    borderRadius: 10, padding: 12, marginTop: 20,
  },
  contactNoteText: { flex: 1, fontSize: 12, color: colors.gray500, lineHeight: 18 },
  emailHighlight:  { color: colors.red, fontWeight: '600' },

  errorBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: colors.error, borderRadius: 12,
    padding: 12, marginTop: 18,
  },
  errorBannerText: { flex: 1, color: colors.white, fontSize: 13, fontWeight: '600' },

  bookBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: colors.green, borderRadius: 14,
    paddingVertical: 16, marginTop: 16,
  },
  bookBtnDisabled: { opacity: 0.6 },
  bookBtnText: { color: colors.white, fontWeight: '800', fontSize: 16 },

  successScreen: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32, backgroundColor: colors.white },
  successCircle: { width: 90, height: 90, borderRadius: 45, backgroundColor: colors.green, alignItems: 'center', justifyContent: 'center', marginBottom: 20 },
  successTitle: { fontSize: 26, fontFamily: heading.lg.fontFamily, fontWeight: '800', color: colors.black, marginBottom: 10 },
  successSub: { fontSize: 15, color: colors.gray500, lineHeight: 22, textAlign: 'center', marginBottom: 24 },
  confirmCard: { backgroundColor: colors.offWhite, borderRadius: 14, padding: 16, width: '100%', gap: 10, marginBottom: 28 },
  confirmRow:  { flexDirection: 'row', alignItems: 'center', gap: 10 },
  confirmText: { fontSize: 14, color: colors.black, fontWeight: '600' },
  doneBtn:     { backgroundColor: colors.green, borderRadius: 14, paddingVertical: 14, paddingHorizontal: 32, marginBottom: 14 },
  doneBtnText: { color: colors.white, fontWeight: '800', fontSize: 15 },
  backLink:    {},
  backLinkText: { color: colors.red, fontWeight: '600', fontSize: 14, textDecorationLine: 'underline' },
});
