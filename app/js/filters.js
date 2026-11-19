// Filtering and the spoiler rule for the trophy list.
// A trophy is shown when it passes every active filter at once: grade, kind
// (or the missable flag), the search text, and the earned / unearned switch.
// The spoiler rule never removes a trophy from the list — it only hides the
// name and description of a story trophy the reader has not earned yet.

export function makeFilterState() {
  return { grade: 'all', kind: 'all', query: '', earned: 'all' };
}

// One trophy against one filter state. `earnedIds` is the set of earned ids.
export function trophyPassesFilters(trophy, filters, earnedIds) {
  if (filters.grade !== 'all' && trophy.grade !== filters.grade) return false;
  if (filters.kind === 'missable' && !trophy.missable) return false;
  if (filters.kind === 'online' && trophy.kind !== 'online') return false;
  if (filters.kind !== 'all' && filters.kind !== 'missable' && filters.kind !== 'online' && trophy.kind !== filters.kind) return false;
  const isEarned = earnedIds.has(trophy.id);
  if (filters.earned === 'earned' && !isEarned) return false;
  if (filters.earned === 'unearned' && isEarned) return false;
  if (filters.query) {
    const haystack = `${trophy.name} ${trophy.description} ${trophy.guide}`.toLowerCase();
    if (!haystack.includes(filters.query.toLowerCase())) return false;
  }
  return true;
}

// A story trophy the reader has not earned is spoiler-hidden while the
// spoiler setting is on. Earned story trophies always show, and so do
// non-story trophies.
export function isSpoilerHidden(trophy, spoilersOn, earnedIds) {
  return spoilersOn && trophy.kind === 'story' && !earnedIds.has(trophy.id);
}

// Per-grade and per-kind counts for the progress header.
export function countByGrade(trophies, earnedIds) {
  const counts = { platinum: [0, 0], gold: [0, 0], silver: [0, 0], bronze: [0, 0] };
  for (const trophy of trophies) {
    counts[trophy.grade][1] += 1;
    if (earnedIds.has(trophy.id)) counts[trophy.grade][0] += 1;
  }
  return counts;
}

export function countByKind(trophies, earnedIds) {
  const counts = {};
  for (const trophy of trophies) {
    counts[trophy.kind] = counts[trophy.kind] || [0, 0];
    counts[trophy.kind][1] += 1;
    if (earnedIds.has(trophy.id)) counts[trophy.kind][0] += 1;
  }
  return counts;
}
