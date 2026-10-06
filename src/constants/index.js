import colors from '../theme/colors';

export const BLOCKS = [1, 2, 3, 4, 5, 6, 7, 8];

// Core classes lead the list - most students take these, so they should be the
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
  pending:   { label: 'Pending',   color: colors.pending, tint: colors.pendingTint },
  confirmed: { label: 'Confirmed', color: colors.accent,  tint: colors.accentTint  },
  cancelled: { label: 'Cancelled', color: colors.gray500, tint: colors.gray100     },
  completed: { label: 'Completed', color: colors.gray500, tint: colors.gray100     },
};

export const SCHOOL_EMAIL_DOMAIN = '@mail.strakejesuit.org';
