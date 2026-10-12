/**
 * gettingStarted.js: the first-steps checklist on Home.
 *
 *   Tutors / both              Students
 *   1 Set up your profile      1 Set up your profile
 *   2 Add the classes you teach 2 Set your free blocks
 *   3 Invite a friend          3 Invite a friend
 *   4 Host your first session  4 Book your first session
 *
 * Pure: every "done" comes from data passed in, so it is unit-tested and the
 * card always reflects reality (except the invite, which is remembered on the
 * device once sent).
 */
export function gettingStartedSteps({ profile, isTutor, invited, sessionCount }) {
  const subjects     = profile?.subjects?.length ?? 0;
  const availability = profile?.availability?.length ?? 0;
  const firstSession = (sessionCount ?? 0) > 0 || (profile?.session_count ?? 0) > 0;

  return [
    {
      key: 'profile',
      label: 'Set up your profile',
      hint: 'Add a photo and a short bio',
      done: !!(profile?.bio || profile?.avatar_url),
      action: 'profile',
    },
    isTutor
      ? { key: 'teach', label: 'Add the classes you teach', hint: 'So students can find you', done: subjects > 0, action: 'profile' }
      : { key: 'free',  label: 'Set your free blocks', hint: 'Tutors who share them show up first', done: availability > 0, action: 'profile' },
    {
      key: 'invite',
      label: 'Invite a friend',
      hint: isTutor ? 'Someone you could help, or a fellow tutor' : 'Someone who could use help too',
      done: !!invited,
      action: 'invite',
    },
    isTutor
      ? { key: 'session', label: 'Host your first session', hint: 'Confirm a request when one comes in', done: firstSession, action: 'sessions' }
      : { key: 'session', label: 'Book your first session', hint: 'Find a tutor free in one of your blocks', done: firstSession, action: 'search' },
  ];
}
