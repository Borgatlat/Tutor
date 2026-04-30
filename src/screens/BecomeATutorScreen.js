import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import colors from '../theme/colors';
import { SUBJECTS } from '../data/tutors';

const SUBJECT_OPTIONS = SUBJECTS.filter((s) => s !== 'All');
const GRADE_OPTIONS = ['Freshman', 'Sophomore', 'Junior', 'Senior'];

export default function BecomeATutorScreen() {
  const [name, setName] = useState('');
  const [grade, setGrade] = useState('');
  const [email, setEmail] = useState('');
  const [rate, setRate] = useState('');
  const [bio, setBio] = useState('');
  const [selectedSubjects, setSelectedSubjects] = useState([]);
  const [availability, setAvailability] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const toggleSubject = (s) => {
    setSelectedSubjects((prev) =>
      prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]
    );
  };

  const [formError, setFormError] = useState('');

  const handleSubmit = () => {
    if (!name || !grade || !email || selectedSubjects.length === 0) {
      setFormError('Please fill in your name, grade, email, and at least one subject.');
      return;
    }
    setFormError('');
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <SafeAreaView style={styles.safe}>
        <StatusBar barStyle="light-content" backgroundColor={colors.green} />
        <View style={styles.successScreen}>
          <View style={styles.successIcon}>
            <Ionicons name="checkmark-circle" size={72} color={colors.green} />
          </View>
          <Text style={styles.successTitle}>Application Submitted!</Text>
          <Text style={styles.successSub}>
            Welcome to the Strake Jesuit Tutor Network. You'll be visible to students looking for help in your subjects.
          </Text>
          <View style={styles.successBadge}>
            <Text style={styles.successBadgeText}>🎓 Crusader Tutor</Text>
          </View>
          <TouchableOpacity style={styles.successBtn} onPress={() => setSubmitted(false)}>
            <Text style={styles.successBtnText}>Edit My Profile</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" backgroundColor={colors.green} />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView showsVerticalScrollIndicator={false}>
          {/* Header */}
          <View style={styles.header}>
            <Ionicons name="school" size={28} color={colors.white} />
            <Text style={styles.headerTitle}>Become a Tutor</Text>
            <Text style={styles.headerSub}>Share your knowledge with fellow Crusaders</Text>
          </View>

          <View style={styles.form}>
            {/* Name */}
            <Text style={styles.label}>Full Name</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. Michael Torres"
              placeholderTextColor={colors.gray300}
              value={name}
              onChangeText={setName}
            />

            {/* Grade */}
            <Text style={styles.label}>Grade</Text>
            <View style={styles.optionRow}>
              {GRADE_OPTIONS.map((g) => (
                <TouchableOpacity
                  key={g}
                  style={[styles.optionChip, grade === g && styles.optionChipActive]}
                  onPress={() => setGrade(g)}
                >
                  <Text style={[styles.optionChipText, grade === g && styles.optionChipTextActive]}>
                    {g}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Email */}
            <Text style={styles.label}>School Email</Text>
            <TextInput
              style={styles.input}
              placeholder="name@strakejesuit.org"
              placeholderTextColor={colors.gray300}
              keyboardType="email-address"
              autoCapitalize="none"
              value={email}
              onChangeText={setEmail}
            />

            {/* Hourly Rate */}
            <Text style={styles.label}>Hourly Rate ($)</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. 12"
              placeholderTextColor={colors.gray300}
              keyboardType="numeric"
              value={rate}
              onChangeText={setRate}
            />
            <Text style={styles.hint}>Typical range: $10–$20/hr</Text>

            {/* Subjects */}
            <Text style={styles.label}>Subjects You Can Teach</Text>
            <View style={styles.subjectGrid}>
              {SUBJECT_OPTIONS.map((s) => {
                const active = selectedSubjects.includes(s);
                return (
                  <TouchableOpacity
                    key={s}
                    style={[styles.subjectChip, active && styles.subjectChipActive]}
                    onPress={() => toggleSubject(s)}
                  >
                    {active && <Ionicons name="checkmark" size={12} color={colors.white} />}
                    <Text style={[styles.subjectChipText, active && styles.subjectChipTextActive]}>
                      {s}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Availability */}
            <Text style={styles.label}>Availability</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. Mon, Wed, Fri after 3:30 PM"
              placeholderTextColor={colors.gray300}
              value={availability}
              onChangeText={setAvailability}
            />

            {/* Bio */}
            <Text style={styles.label}>Short Bio</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Tell students a bit about yourself and your tutoring style…"
              placeholderTextColor={colors.gray300}
              multiline
              numberOfLines={4}
              value={bio}
              onChangeText={setBio}
            />

            {formError ? (
              <View style={styles.formErrorBanner}>
                <Ionicons name="alert-circle" size={15} color={colors.error} />
                <Text style={styles.formErrorText}>{formError}</Text>
              </View>
            ) : null}

            <TouchableOpacity style={styles.submitBtn} onPress={handleSubmit}>
              <Text style={styles.submitBtnText}>Join as a Tutor</Text>
              <Ionicons name="arrow-forward" size={18} color={colors.white} />
            </TouchableOpacity>

            <View style={{ height: 32 }} />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.offWhite },
  header: {
    backgroundColor: colors.green,
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 28,
    alignItems: 'flex-start',
    gap: 6,
  },
  headerTitle: { color: colors.white, fontSize: 26, fontWeight: '800' },
  headerSub: { color: colors.white, fontSize: 13, opacity: 0.85 },

  form: {
    backgroundColor: colors.white,
    marginTop: 0,
    padding: 20,
  },

  label: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.gray700,
    marginTop: 18,
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  input: {
    borderWidth: 1.5,
    borderColor: colors.gray100,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: colors.black,
    backgroundColor: colors.offWhite,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
    paddingTop: 12,
  },
  hint: { fontSize: 11, color: colors.gray500, marginTop: 4 },

  optionRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  optionChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: colors.gray300,
    backgroundColor: colors.white,
  },
  optionChipActive: { backgroundColor: colors.green, borderColor: colors.green },
  optionChipText: { fontSize: 13, color: colors.gray700, fontWeight: '500' },
  optionChipTextActive: { color: colors.white, fontWeight: '700' },

  subjectGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  subjectChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: colors.gray300,
    backgroundColor: colors.white,
  },
  subjectChipActive: { backgroundColor: colors.red, borderColor: colors.red },
  subjectChipText: { fontSize: 13, color: colors.gray700 },
  subjectChipTextActive: { color: colors.white, fontWeight: '700' },

  submitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.green,
    borderRadius: 14,
    paddingVertical: 16,
    marginTop: 28,
    gap: 8,
  },
  submitBtnText: { color: colors.white, fontWeight: '800', fontSize: 16 },

  formErrorBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: colors.errorMuted, borderRadius: 10,
    padding: 12, marginTop: 16,
    borderWidth: 1, borderColor: colors.errorBorder,
  },
  formErrorText: { flex: 1, fontSize: 13, color: colors.error, fontWeight: '600' },

  successScreen: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    backgroundColor: colors.white,
  },
  successIcon: { marginBottom: 20 },
  successTitle: { fontSize: 26, fontWeight: '800', color: colors.black, marginBottom: 12, textAlign: 'center' },
  successSub: { fontSize: 15, color: colors.gray500, lineHeight: 23, textAlign: 'center', marginBottom: 24 },
  successBadge: {
    backgroundColor: colors.green,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 30,
    marginBottom: 32,
  },
  successBadgeText: { color: colors.white, fontWeight: '700', fontSize: 15 },
  successBtn: {
    borderWidth: 2,
    borderColor: colors.green,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  successBtnText: { color: colors.green, fontWeight: '700', fontSize: 15 },
});
