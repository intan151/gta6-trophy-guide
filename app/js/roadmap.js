// The roadmap to the platinum and the missables page, built from the official
// trophy descriptions alone: which story chapters and missions, which
// collectibles and counts, in what order. The phases run in the order a player
// should take them; the platinum itself is the reward for finishing them all.

export const ROADMAP_PHASES = [
  {
    id: 'story',
    title: 'Phase 1 — Play the story',
    hours: 'about 60–80 hours',
    note: 'Five chapters, twelve story trophies, all unmissable. Start meditating the moment Chapter 1 offers it — see the Missables page.',
    trophyIds: [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13],
  },
  {
    id: 'strangers',
    title: 'Phase 2 — Strangers and side stories',
    hours: 'about 10 hours',
    note: 'Eight stranger strands plus the side-character finales for Andy, Kenton, Billy, Randy and Tyrone, and Bret’s hunt. All stay open in free roam.',
    trophyIds: [22, 23, 24, 25, 26, 27, 29],
  },
  {
    id: 'races',
    title: 'Phase 3 — Races, stunts and ranges',
    hours: 'about 20 hours',
    note: '250 stunts, 42 Shooting Range challenges to gold, 14 drone race locations, 20 different race wins, and 50 of the 80 challenges.',
    trophyIds: [15, 17, 18, 19, 32],
  },
  {
    id: 'robberies',
    title: 'Phase 4 — Robberies and wanted chaos',
    hours: 'about 15 hours',
    note: 'Five bank vaults, one armored truck, one illegal operation for each of the 9 gangs, and the partner and stealth robbery trophies.',
    trophyIds: [33, 34, 36, 37, 38, 39, 40, 41, 43, 45, 51],
  },
  {
    id: 'collectibles',
    title: 'Phase 5 — Collectibles and exploration',
    hours: 'about 40 hours',
    note: 'Three card sets, 100 WAiNK locations, 100 vehicles discovered, all 52 areas of Leonida, 8 garages and 10 vehicles registered.',
    trophyIds: [28, 30, 31, 35, 42, 54, 55],
  },
  {
    id: 'cleanup',
    title: 'Phase 6 — Money, habits and cleanup',
    hours: 'about 50 hours',
    note: 'The 100% checklist (gold), all 9 activity types, fishing, arcade, bowling, the cocktail on Ocean Beach, and the money trophies.',
    trophyIds: [14, 16, 20, 21, 44, 46, 47, 48, 49, 50, 52, 53],
  },
];

// Trophies per phase, looked up from the trophy list, in phase order.
export function phaseTrophies(phase, trophiesById) {
  return phase.trophyIds.map((id) => trophiesById.get(id)).filter(Boolean);
}

// How far along one phase is, as earned / total.
export function phaseProgress(phase, earnedIds) {
  const earned = phase.trophyIds.filter((id) => earnedIds.has(id)).length;
  return { earned, total: phase.trophyIds.length };
}

// Every trophy flagged missable, with its warning note, for the Missables page.
export function missableTrophies(trophies) {
  return trophies.filter((trophy) => trophy.missable);
}
