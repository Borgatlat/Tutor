export const DAYS    = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];
export const PERIODS = [1, 2, 3, 4, 5, 6, 7, 8];

export const SUBJECTS = [
  // SAT Prep
  'SAT Math',
  'SAT English',
  // AP Math & Computer Science
  'AP Precalculus',
  'AP Calculus AB',
  'AP Calculus BC',
  'AP Statistics',
  'AP Computer Science A',
  'AP Computer Science Principles',
  // AP Sciences
  'AP Chemistry',
  'AP Physics 1',
  'AP Physics C',
  'AP Biology',
  // AP Humanities
  'AP US History',
  'AP World History',
  'AP Government',
  'AP English Language',
  'AP English Literature',
  'AP Economics',
  'AP Spanish Language',
  'AP Spanish Literature',
];

export const SUBJECT_CATEGORIES = {
  'SAT Prep':        ['SAT Math', 'SAT English'],
  'AP Math & CS':    ['AP Precalculus', 'AP Calculus AB', 'AP Calculus BC', 'AP Statistics', 'AP Computer Science A', 'AP Computer Science Principles'],
  'AP Sciences':     ['AP Chemistry', 'AP Physics 1', 'AP Physics C', 'AP Biology'],
  'AP Humanities':   ['AP US History', 'AP World History', 'AP Government', 'AP English Language', 'AP English Literature', 'AP Economics', 'AP Spanish Language', 'AP Spanish Literature'],
};

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
  pending:   { label: 'Pending',   color: '#C9A547' }, // colors.warning / gold accent
  confirmed: { label: 'Confirmed', color: '#1B4D2E' }, // colors.red / forest green primary
  cancelled: { label: 'Cancelled', color: '#6B7074' }, // colors.gray500
  completed: { label: 'Completed', color: '#6B7074' }, // colors.gray500
};

export const SCHOOL_EMAIL_DOMAIN = '@mail.strakejesuit.org';
