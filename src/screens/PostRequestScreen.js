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
const URGENCY_OPTIONS = ['This week', 'Within 2 weeks', 'Flexible'];

export default function PostRequestScreen() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [subject, setSubject] = useState('');
  const [urgency, setUrgency] = useState('');
  const [details, setDetails] = useState('');
  const [budget, setBudget] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const [formError, setFormError] = useState('');

  const handleSubmit = () => {
    if (!name || !email || !subject) {
      setFormError('Please enter your name, email, and the subject you need help with.');
      return;
    }
    setFormError('');
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <SafeAreaView style={styles.safe}>
        <StatusBar barStyle="light-content" backgroundColor={colors.red} />
        <View style={styles.successScreen}>
          <View style={styles.successCircle}>
            <Ionicons name="search" size={40} color={colors.white} />
          </View>
          <Text style={styles.successTitle}>Request Posted!</Text>
          <Text style={styles.successSub}>
            Tutors who teach {subject} will be notified. Expect to hear back within 24 hours.
          </Text>
          <View style={styles.infoCard}>
            <View style={styles.infoRow}>
              <Ionicons name="book-outline" size={16} color={colors.red} />
              <Text style={styles.infoText}>{subject}</Text>
            </View>
            {urgency ? (
              <View style={styles.infoRow}>
                <Ionicons name="time-outline" size={16} color={colors.red} />
                <Text style={styles.infoText}>{urgency}</Text>
              </View>
            ) : null}
            {budget ? (
              <View style={styles.infoRow}>
                <Ionicons name="cash-outline" size={16} color={colors.red} />
                <Text style={styles.infoText}>Budget: ${budget}/hr</Text>
              </View>
            ) : null}
          </View>
          <TouchableOpacity style={styles.newRequestBtn} onPress={() => {
            setName(''); setEmail(''); setSubject(''); setUrgency('');
            setDetails(''); setBudget(''); setSubmitted(false);
          }}>
            <Text style={styles.newRequestBtnText}>Post Another Request</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" backgroundColor={colors.red} />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView showsVerticalScrollIndicator={false}>
          {/* Header */}
          <View style={styles.header}>
            <Ionicons name="search" size={28} color={colors.white} />
            <Text style={styles.headerTitle}>Find a Tutor</Text>
            <Text style={styles.headerSub}>Post your tutoring request and get matched</Text>
          </View>

          <View style={styles.form}>
            {/* Name */}
            <Text style={styles.label}>Your Name</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. Alex Morales"
              placeholderTextColor={colors.gray300}
              value={name}
              onChangeText={setName}
            />

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

            {/* Subject */}
            <Text style={styles.label}>Subject Needed</Text>
            <View style={styles.subjectGrid}>
              {SUBJECT_OPTIONS.map((s) => (
                <TouchableOpacity
                  key={s}
                  style={[styles.subjectChip, subject === s && styles.subjectChipActive]}
                  onPress={() => setSubject(s)}
                >
                  <Text style={[styles.subjectChipText, subject === s && styles.subjectChipTextActive]}>
                    {s}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Urgency */}
            <Text style={styles.label}>When do you need a tutor?</Text>
            <View style={styles.optionRow}>
              {URGENCY_OPTIONS.map((u) => (
                <TouchableOpacity
                  key={u}
                  style={[styles.optionChip, urgency === u && styles.optionChipActive]}
                  onPress={() => setUrgency(u)}
                >
                  <Text style={[styles.optionChipText, urgency === u && styles.optionChipTextActive]}>
                    {u}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Budget */}
            <Text style={styles.label}>Max Budget ($/hr) — Optional</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. 15"
              placeholderTextColor={colors.gray300}
              keyboardType="numeric"
              value={budget}
              onChangeText={setBudget}
            />

            {/* Details */}
            <Text style={styles.label}>Additional Details</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="What specific topics or assignments do you need help with?"
              placeholderTextColor={colors.gray300}
              multiline
              numberOfLines={4}
              value={details}
              onChangeText={setDetails}
            />

            {formError ? (
              <View style={styles.formErrorBanner}>
                <Ionicons name="alert-circle" size={15} color={colors.error} />
                <Text style={styles.formErrorText}>{formError}</Text>
              </View>
            ) : null}

            <TouchableOpacity style={styles.submitBtn} onPress={handleSubmit}>
              <Text style={styles.submitBtnText}>Post Request</Text>
              <Ionicons name="send" size={16} color={colors.white} />
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
    backgroundColor: colors.red,
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 28,
    gap: 6,
  },
  headerTitle: { color: colors.white, fontSize: 26, fontWeight: '800' },
  headerSub: { color: colors.white, fontSize: 13, opacity: 0.85 },

  form: { backgroundColor: colors.white, padding: 20 },

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

  subjectGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  subjectChip: {
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

  submitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.red,
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
  successCircle: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: colors.red,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  successTitle: { fontSize: 26, fontWeight: '800', color: colors.black, marginBottom: 12 },
  successSub: { fontSize: 15, color: colors.gray500, lineHeight: 23, textAlign: 'center', marginBottom: 24 },
  infoCard: {
    backgroundColor: colors.offWhite,
    borderRadius: 14,
    padding: 16,
    width: '100%',
    gap: 10,
    marginBottom: 28,
  },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  infoText: { fontSize: 14, color: colors.black, fontWeight: '600' },
  newRequestBtn: {
    borderWidth: 2,
    borderColor: colors.red,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  newRequestBtnText: { color: colors.red, fontWeight: '700', fontSize: 15 },
});
