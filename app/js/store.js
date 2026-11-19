// Saved progress for the Leonida Ledger: which trophies the reader has earned,
// kept in localStorage, exportable to a JSON file and importable back.
// Nothing leaves the browser: there is no account and no network call.

export const STORAGE_KEY = 'leonida-ledger-progress-v1';
export const SPOILER_KEY = 'leonida-ledger-spoilers-v1';

// Read the saved set of earned trophy ids. A corrupt or foreign value is
// treated as empty rather than crashing the page.
export function loadProgress() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return new Set();
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return new Set();
    return new Set(parsed.filter((id) => Number.isInteger(id)));
  } catch {
    return new Set();
  }
}

export function saveProgress(earnedIds) {
  const ids = [...earnedIds].sort((a, b) => a - b);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
}

// The spoiler setting: true hides story trophies until they are earned.
export function loadSpoilersOn() {
  return localStorage.getItem(SPOILER_KEY) !== 'off';
}

export function saveSpoilersOn(on) {
  localStorage.setItem(SPOILER_KEY, on ? 'on' : 'off');
}

// Build the file the Export button downloads: the earned ids plus the date,
// so an imported file is recognisable later.
export function buildExportFile(earnedIds, earnedAt) {
  return JSON.stringify(
    { app: 'leonida-ledger', version: 1, exportedAt: earnedAt, earned: [...earnedIds].sort((a, b) => a - b) },
    null,
    2,
  );
}

// Read an imported file back into a set of ids. Returns null when the file is
// not a progress file this app wrote (or a plain array of ids, which the
// earliest exports used), so the caller can show an error instead of wiping
// the reader's progress.
export function parseImportFile(text) {
  try {
    const parsed = JSON.parse(text);
    const ids = Array.isArray(parsed) ? parsed : parsed.earned;
    if (!Array.isArray(ids)) return null;
    const clean = ids.filter((id) => Number.isInteger(id));
    if (clean.length === 0 && ids.length > 0) return null;
    return new Set(clean);
  } catch {
    return null;
  }
}

export function downloadTextFile(filename, text) {
  const blob = new Blob([text], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}
