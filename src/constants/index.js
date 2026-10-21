import colors from '../theme/colors';

// The free times people can pick: B1–B8 with Community Time (CT) between B1
// and B2, then A and B Lunch. CT and the lunches are saved as 9, 10 and 11 in
// the database (see utils/schedule) but always shown by name.
export const BLOCKS = [1, 9, 2, 3, 4, 5, 6, 7, 8, 10, 11];

// Core classes lead the list: most students take these, so they should be the
// first thing in the picker. AP entries keep their 'AP ' prefix, which is what
// lets SubjectBadge tell 'US History' apart from 'AP US History'.
export const SUBJECT_CATEGORIES = {
  'Math': [
    'Algebra 1',
    'Geometry',
    'Algebra 2',
    'Precalculus',
    'Calculus',
  ],
  'Science': [
    'Biology',
    'Chemistry',
    'Physics',
    'Anatomy & Physiology',
    'Environmental Science',
  ],
  'English': [
    'English 1',
    'English 2',
    'English 3',
    'English 4',
  ],
  'Social Studies': [
    'World History',
    'US History',
    'Government',
    'Economics',
    'Geography',
  ],
  'Languages': [
    'Spanish 1',
    'Spanish 2',
    'Spanish 3',
    'Latin 1',
    'Latin 2',
    'French 1',
    'French 2',
  ],
  'SAT Prep': [
    'SAT Math',
    'SAT English',
  ],
  'AP Math & CS': [
    'AP Precalculus',
    'AP Calculus AB',
    'AP Calculus BC',
    'AP Statistics',
    'AP Computer Science A',
    'AP Computer Science Principles',
  ],
  'AP Sciences': [
    'AP Chemistry',
    'AP Physics 1',
    'AP Physics C',
    'AP Biology',
  ],
  'AP Humanities': [
    'AP US History',
    'AP World History',
    'AP Government',
    'AP English Language',
    'AP English Literature',
    'AP Economics',
    'AP Spanish Language',
    'AP Spanish Literature',
  ],
};

// Derived, so the flat list can never drift out of sync with the categories.
export const SUBJECTS = Object.values(SUBJECT_CATEGORIES).flat();

export const ROLES = [
  {
    key: 'student',
    label: 'Student',
    icon: 'school-outline',
    description: 'I want to find a tutor',
  },
  {
    key: 'tutor',
    label: 'Tutor',
    icon: 'book-outline',
    description: 'I want to help others',
  },
  {
    key: 'both',
    label: 'Both',
    icon: 'people-outline',
    description: 'I do both',
  },
];

export const SESSION_STATUS = {
  // Solid tags, like the school site's maroon date labels.
  pending:   { label: 'Pending',   color: colors.white,   tint: colors.maroon },
  confirmed: { label: 'Confirmed', color: colors.white,   tint: colors.brand  },
  cancelled: { label: 'Cancelled', color: colors.gray600, tint: colors.cream  },
  completed: { label: 'Completed', color: colors.gray600, tint: colors.cream  },
};

export const SCHOOL_EMAIL_DOMAIN = '@mail.strakejesuit.org';

// Shown next to the email opt-in box. Keep it the same as
// email_consent_wording() in supabase/migrations/007_email_notifications.sql.
export const EMAIL_CONSENT_TEXT =
  'I agree to receive emails about my tutoring sessions (new requests, confirmations '
  + 'and cancellations) from BetterU LLC. I can turn them off anytime in Profile.';
