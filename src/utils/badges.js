/**
 * badges.js: small achievements shown on tutor cards and profiles.
 *
 *   Top tutor   rated 4.8+ across at least 3 reviews
 *   N+ hours    service-hour milestones (5, 10, 25, 50), highest one only
 *   New tutor   no completed sessions yet, so a fresh face doesn't look inactive
 *
 * Derived from numbers already on the tutor row (avg_rating, review_count,
 * session_count), so there's nothing extra to store or keep in sync.
 */
import { BLOCK_MINUTES } from './hours';

export const HOUR_MILESTONES = [50, 25, 10, 5];

export function getTutorBadges(tutor = {}) {
  const rating   = Number(tutor.avg_rating ?? 0);
  const reviews  = Number(tutor.review_count ?? 0);
  const sessions = Number(tutor.session_count ?? 0);
  const hours    = (sessions * BLOCK_MINUTES) / 60;

  const badges = [];
  if (rating >= 4.8 && reviews >= 3) {
    badges.push({ key: 'top', label: 'Top tutor', icon: 'ribbon' });
  }
  const milestone = HOUR_MILESTONES.find((m) => hours >= m);
  if (milestone) {
    badges.push({ key: `hours-${milestone}`, label: `${milestone}+ hours`, icon: 'heart' });
  }
  if (sessions === 0) {
    badges.push({ key: 'new', label: 'New tutor', icon: 'sparkles' });
  }
  return badges;
}
