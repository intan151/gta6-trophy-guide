// Leonida Ledger — boot and views. Loads app/data/trophies.json (a file of
// this app, fetched from the same server the page came from — nothing is
// fetched from the network), then renders the checklist, the roadmap, the
// missables page and the about page from it. Progress lives in store.js.

import { loadProgress, saveProgress, loadSpoilersOn, saveSpoilersOn, buildExportFile, parseImportFile, downloadTextFile } from './store.js';
import { makeFilterState, trophyPassesFilters, isSpoilerHidden, countByGrade, countByKind } from './filters.js';
import { ROADMAP_PHASES, phaseTrophies, phaseProgress, missableTrophies } from './roadmap.js';

const GRADE_LABELS = { platinum: 'Platinum', gold: 'Gold', silver: 'Silver', bronze: 'Bronze' };
const KIND_LABELS = { platinum: 'Platinum', story: 'Story', activities: 'Activities', collectibles: 'Collectibles', online: 'Online' };

let trophies = [];
let trophiesById = new Map();
let earnedIds = loadProgress();
let spoilersOn = loadSpoilersOn();
let filters = makeFilterState();
let selectedId = null;
let currentView = 'checklist';

const $ = (id) => document.getElementById(id);

function medalLetter(grade) {
  return { platinum: 'P', gold: 'G', silver: 'S', bronze: 'B' }[grade] || '?';
}

function gradeCountsText() {
  const counts = countByGrade(trophies, earnedIds);
  return Object.keys(GRADE_LABELS)
    .map((grade) => `${counts[grade][0]}/${counts[grade][1]} ${GRADE_LABELS[grade]}`)
    .join(' · ');
}

function renderProgress() {
  const total = trophies.length;
  const earned = earnedIds.size;
  const percent = total === 0 ? 0 : Math.round((earned / total) * 100);
  $('progress-count').textContent = `${earned} / ${total} earned`;
  $('progress-percent').textContent = `${percent}% to platinum`;
  $('progress-fill').style.width = `${percent}%`;
  $('progress-grades').textContent = gradeCountsText();
}

function trophyDisplayName(trophy) {
  return isSpoilerHidden(trophy, spoilersOn, earnedIds) ? 'Hidden story trophy' : trophy.name;
}

function trophyDisplayDescription(trophy) {
  return isSpoilerHidden(trophy, spoilersOn, earnedIds)
    ? 'Hidden until earned — turn spoilers off, or earn it, to reveal the name and description.'
    : trophy.description;
}

function renderList() {
  const list = $('trophy-list');
  const visible = trophies.filter((trophy) => trophyPassesFilters(trophy, filters, earnedIds));
  $('list-count').textContent = `${visible.length} of ${trophies.length} trophies shown`;
  if (visible.length === 0) {
    list.innerHTML = '<p class="empty-state">No trophies match these filters. Clear the search or widen a filter.</p>';
    return;
  }
  list.innerHTML = '';
  for (const trophy of visible) {
    const earned = earnedIds.has(trophy.id);
    const card = document.createElement('button');
    card.className = `trophy-card${earned ? ' earned' : ''}${selectedId === trophy.id ? ' selected' : ''}`;
    card.type = 'button';
    card.dataset.trophyId = String(trophy.id);
    card.setAttribute('aria-pressed', String(selectedId === trophy.id));

    const top = document.createElement('span');
    top.className = 'trophy-card-top';

    const box = document.createElement('input');
    box.type = 'checkbox';
    box.className = 'earned-box';
    box.checked = earned;
    box.setAttribute('aria-label', `Mark ${trophyDisplayName(trophy)} as earned`);
    box.addEventListener('click', (event) => {
      event.stopPropagation();
      toggleEarned(trophy.id);
    });

    const medal = document.createElement('span');
    medal.className = `grade-medal grade-${trophy.grade}`;
    medal.textContent = medalLetter(trophy.grade);

    const name = document.createElement('span');
    name.className = `trophy-name${earned ? ' earned-name' : ''}`;
    name.textContent = trophyDisplayName(trophy);

    top.append(box, medal, name);

    const desc = document.createElement('p');
    desc.className = 'trophy-desc';
    desc.textContent = trophyDisplayDescription(trophy);

    const meta = document.createElement('span');
    meta.className = 'trophy-meta';
    const tags = [GRADE_LABELS[trophy.grade]];
    if (KIND_LABELS[trophy.kind] !== GRADE_LABELS[trophy.grade]) tags.push(KIND_LABELS[trophy.kind]);
    if (trophy.target) tags.push(`Target: ${trophy.target.toLocaleString()}`);
    if (trophy.hidden) tags.push('Hidden on PS5');
    for (const label of tags) {
      const tag = document.createElement('span');
      tag.className = 'tag';
      tag.textContent = label;
      meta.appendChild(tag);
    }
    if (trophy.missable) {
      const tag = document.createElement('span');
      tag.className = 'tag missable-tag';
      tag.textContent = '⚠ MISSABLE';
      meta.appendChild(tag);
    }

    card.append(top, desc, meta);
    card.addEventListener('click', () => selectTrophy(trophy.id));
    list.appendChild(card);
  }
}

function renderDetail() {
  const pane = $('detail-pane');
  const trophy = trophiesById.get(selectedId);
  if (!trophy) {
    pane.innerHTML = '<p class="detail-empty">Pick a trophy on the left to read its guide, its sources and when it can be missed.</p>';
    return;
  }
  const earned = earnedIds.has(trophy.id);
  const hidden = isSpoilerHidden(trophy, spoilersOn, earnedIds);
  pane.innerHTML = '';
  const medal = document.createElement('span');
  medal.className = `grade-medal grade-${trophy.grade}`;
  medal.textContent = medalLetter(trophy.grade);
  pane.appendChild(medal);

  const title = document.createElement('h2');
  title.textContent = trophyDisplayName(trophy);
  pane.appendChild(title);

  const official = document.createElement('p');
  official.className = 'detail-official';
  official.textContent = hidden
    ? 'Official description hidden until this story trophy is earned.'
    : `“${trophy.description}” — ${GRADE_LABELS[trophy.grade]} trophy${trophy.target ? ` · PSN target: ${trophy.target.toLocaleString()}` : ''}`;
  pane.appendChild(official);

  if (trophy.missable && trophy.missableNote) {
    const banner = document.createElement('p');
    banner.className = 'missable-banner';
    banner.textContent = `⚠ MISSABLE — ${trophy.missableNote}`;
    pane.appendChild(banner);
  }

  const guide = document.createElement('div');
  guide.className = 'detail-guide';
  const para = document.createElement('p');
  para.textContent = hidden ? 'Turn spoilers off or earn this trophy to read its guide.' : trophy.guide;
  guide.appendChild(para);
  pane.appendChild(guide);

  if (!hidden && trophy.sources && trophy.sources.length > 0) {
    const box = document.createElement('div');
    box.className = 'sources-box';
    const heading = document.createElement('h3');
    heading.textContent = 'Sources — where each fact comes from';
    box.appendChild(heading);
    const list = document.createElement('ul');
    for (const source of trophy.sources) {
      const item = document.createElement('li');
      const link = document.createElement('a');
      link.href = source.url;
      link.target = '_blank';
      link.rel = 'noopener';
      link.textContent = source.name;
      item.appendChild(link);
      list.appendChild(item);
    }
    box.appendChild(list);
    pane.appendChild(box);
  }

  const earnedLine = document.createElement('p');
  earnedLine.className = 'section-note';
  earnedLine.textContent = earned ? '✓ You have earned this trophy.' : 'Not earned yet — tick the box in the list when you earn it.';
  pane.appendChild(earnedLine);
}

function renderRoadmap() {
  const root = $('roadmap-content');
  root.innerHTML = '';
  const intro = document.createElement('div');
  intro.className = 'callout';
  intro.innerHTML = '<h2>Roadmap to the platinum — Vice Got a Price!</h2><p>PowerPyx rates the platinum 4/10 at about 200 hours: 60–80 hours of story, then the 100% checklist, then strangers and cleanup. One playthrough is enough — there is free roam after the story and no mission replay.</p><p><strong>Do this first:</strong> in Chapter 1, meditate at Jason’s house the moment the game offers it. Positive Mental Attitude is the only trophy the guides call potentially missable.</p>';
  root.appendChild(intro);
  for (const phase of ROADMAP_PHASES) {
    const progress = phaseProgress(phase, earnedIds);
    const section = document.createElement('section');
    section.className = 'roadmap-phase';
    const title = document.createElement('h2');
    title.innerHTML = '';
    title.textContent = `${phase.title} — `;
    const count = document.createElement('span');
    count.className = 'phase-count';
    count.textContent = `${progress.earned}/${progress.total} earned · ${phase.hours}`;
    title.appendChild(count);
    section.appendChild(title);
    const note = document.createElement('p');
    note.textContent = phase.note;
    section.appendChild(note);
    const chips = document.createElement('div');
    chips.className = 'phase-trophies';
    for (const trophy of phaseTrophies(phase, trophiesById)) {
      const chip = document.createElement('button');
      chip.type = 'button';
      chip.className = `phase-trophy${earnedIds.has(trophy.id) ? ' earned' : ''}`;
      chip.textContent = `${trophy.missable ? '⚠ ' : ''}${trophyDisplayName(trophy)}`;
      chip.addEventListener('click', () => {
        selectedId = trophy.id;
        showView('checklist');
      });
      chips.appendChild(chip);
    }
    section.appendChild(chips);
    root.appendChild(section);
  }
}

function renderMissables() {
  const root = $('missables-content');
  root.innerHTML = '';
  const intro = document.createElement('div');
  intro.className = 'callout';
  intro.innerHTML = '<h2>Missable trophies — only one to fear</h2><p>PowerPyx and GTABase, the two guides that have played the launch build, flag exactly one trophy as potentially missable. Everything else can still be earned in free roam after the story, because the game keeps the whole map open and every activity repeatable.</p>';
  root.appendChild(intro);
  for (const trophy of missableTrophies(trophies)) {
    const section = document.createElement('section');
    section.className = 'roadmap-phase';
    const title = document.createElement('h2');
    title.textContent = `⚠ ${trophy.name} — ${GRADE_LABELS[trophy.grade]}`;
    section.appendChild(title);
    const note = document.createElement('p');
    note.textContent = trophy.missableNote || '';
    section.appendChild(note);
    const guide = document.createElement('p');
    guide.textContent = trophy.guide;
    section.appendChild(guide);
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'tool-button';
    button.textContent = 'Open its guide';
    button.addEventListener('click', () => {
      selectedId = trophy.id;
      showView('checklist');
    });
    section.appendChild(button);
    root.appendChild(section);
  }
  const safe = document.createElement('div');
  safe.className = 'about-block';
  safe.innerHTML = '<h2>Why nothing else is missable</h2><p>Story trophies unlock automatically as the chapters play out, and the game returns you to free roam after the credits. Races, robberies, collectibles, challenges and side strands are all repeatable or still open after the story, and there are no difficulty settings to worry about. Sources: PowerPyx’s trophy guide and roadmap.</p>';
  root.appendChild(safe);
}

function renderAbout() {
  const root = $('about-content');
  root.innerHTML = '';
  const stats = document.createElement('div');
  stats.className = 'about-block';
  const gradeCounts = countByGrade(trophies, earnedIds);
  const kindCounts = countByKind(trophies, earnedIds);
  stats.innerHTML = `<h2>The list at a glance</h2><p>55 trophies: 1 platinum, 2 gold, 6 silver, 46 bronze. 28 are hidden on PlayStation until earned. None are online — every trophy is single-player and offline.</p>`;
  const grid = document.createElement('div');
  grid.className = 'stat-grid';
  for (const [grade, label] of Object.entries(GRADE_LABELS)) {
    const cell = document.createElement('div');
    cell.className = 'stat-cell';
    cell.innerHTML = '';
    const value = document.createElement('span');
    value.textContent = `${gradeCounts[grade][0]} / ${gradeCounts[grade][1]}`;
    cell.appendChild(value);
    cell.appendChild(document.createTextNode(label));
    grid.appendChild(cell);
  }
  for (const [kind, label] of Object.entries(KIND_LABELS)) {
    if (!kindCounts[kind]) continue;
    const cell = document.createElement('div');
    cell.className = 'stat-cell';
    const value = document.createElement('span');
    value.textContent = `${kindCounts[kind][0]} / ${kindCounts[kind][1]}`;
    cell.appendChild(value);
    cell.appendChild(document.createTextNode(label));
    grid.appendChild(cell);
  }
  stats.appendChild(grid);
  root.appendChild(stats);

  const sources = document.createElement('div');
  sources.className = 'about-block';
  sources.innerHTML = '<h2>Sources</h2><p>Names, descriptions and grades come from the official list as Exophase and PSNProfiles published it — the two agree on all 55. How-to detail draws on PowerPyx’s trophy guide, GTA Zone’s list and GTA Vice’s trophies guide, each cited beside the trophy it informs. Where the community has not pinned a detail down yet, the guide says so instead of inventing it.</p><p>Fan-made guide. Grand Theft Auto, GTA and Vice City are trademarks of Rockstar Games / Take-Two Interactive. No Rockstar logo, artwork or game screenshot is used anywhere in this project.</p>';
  root.appendChild(sources);

  const danger = document.createElement('div');
  danger.className = 'about-block';
  danger.innerHTML = '<h2>Your progress</h2><p>Progress is saved in this browser only. Export it to a JSON file before clearing browser data, and import it back here.</p>';
  const reset = document.createElement('button');
  reset.type = 'button';
  reset.className = 'tool-button';
  reset.textContent = 'Reset all progress';
  reset.addEventListener('click', () => {
    if (window.confirm('Clear every earned tick? This cannot be undone.')) {
      earnedIds = new Set();
      saveProgress(earnedIds);
      renderAll();
    }
  });
  danger.appendChild(reset);
  root.appendChild(danger);
}

function showView(view) {
  currentView = view;
  for (const tab of document.querySelectorAll('.nav-tab')) {
    tab.setAttribute('aria-selected', String(tab.dataset.view === view));
  }
  $('checklist-view').hidden = view !== 'checklist';
  $('roadmap-view').hidden = view !== 'roadmap';
  $('missables-view').hidden = view !== 'missables';
  $('about-view').hidden = view !== 'about';
  $('toolbar').hidden = view !== 'checklist';
  if (view === 'roadmap') renderRoadmap();
  if (view === 'missables') renderMissables();
  if (view === 'about') renderAbout();
  if (window.location.hash !== `#/${view}`) {
    window.history.replaceState(null, '', `#/${view}`);
  }
}

function renderAll() {
  renderProgress();
  renderList();
  renderDetail();
  if (currentView === 'roadmap') renderRoadmap();
  if (currentView === 'missables') renderMissables();
  if (currentView === 'about') renderAbout();
}

function toggleEarned(id) {
  if (earnedIds.has(id)) earnedIds.delete(id);
  else earnedIds.add(id);
  saveProgress(earnedIds);
  renderAll();
}

function selectTrophy(id) {
  selectedId = id;
  renderList();
  renderDetail();
}

function applyChipGroup(container, getValue, onPick) {
  for (const chip of container.querySelectorAll('.chip')) {
    chip.setAttribute('aria-pressed', String(chip.dataset.value === getValue()));
    chip.addEventListener('click', () => {
      onPick(chip.dataset.value);
      for (const other of container.querySelectorAll('.chip')) {
        other.setAttribute('aria-pressed', String(other.dataset.value === getValue()));
      }
      renderAll();
    });
  }
}

function buildToolbar() {
  applyChipGroup($('grade-chips'), () => filters.grade, (value) => { filters.grade = value; });
  applyChipGroup($('kind-chips'), () => filters.kind, (value) => { filters.kind = value; });
  applyChipGroup($('earned-chips'), () => filters.earned, (value) => { filters.earned = value; });

  $('search-input').addEventListener('input', (event) => {
    filters.query = event.target.value.trim();
    renderList();
  });

  $('spoiler-toggle').checked = spoilersOn;
  $('spoiler-toggle').addEventListener('change', (event) => {
    spoilersOn = event.target.checked;
    saveSpoilersOn(spoilersOn);
    renderAll();
  });

  $('export-button').addEventListener('click', () => {
    downloadTextFile('gta6-trophies-progress.json', buildExportFile(earnedIds, new Date().toISOString()));
    $('import-status').textContent = 'Progress exported.';
  });

  $('import-button').addEventListener('click', () => $('import-file').click());
  $('import-file').addEventListener('change', async (event) => {
    const file = event.target.files[0];
    if (!file) return;
    const imported = parseImportFile(await file.text());
    if (imported === null) {
      $('import-status').textContent = 'That file is not a Leonida Ledger progress export.';
      return;
    }
    earnedIds = imported;
    saveProgress(earnedIds);
    $('import-status').textContent = `Imported ${earnedIds.size} earned trophies.`;
    renderAll();
  });
}

async function boot() {
  const response = await fetch('data/trophies.json');
  const data = await response.json();
  trophies = data.trophies;
  trophiesById = new Map(trophies.map((trophy) => [trophy.id, trophy]));

  const params = new URLSearchParams(window.location.search);
  if (params.get('spoilers') === 'off') {
    spoilersOn = false;
    saveSpoilersOn(false);
  }
  const startView = params.get('view') || (window.location.hash || '#/checklist').slice(2) || 'checklist';
  const startTrophy = Number(params.get('trophy'));
  if (Number.isInteger(startTrophy) && trophiesById.has(startTrophy)) selectedId = startTrophy;
  if (!selectedId) selectedId = 15; // Cunning Stunts: a meaty guide to open on first load.

  for (const tab of document.querySelectorAll('.nav-tab')) {
    tab.addEventListener('click', () => showView(tab.dataset.view));
  }
  window.addEventListener('hashchange', () => {
    const view = window.location.hash.slice(2);
    if (['checklist', 'roadmap', 'missables', 'about'].includes(view)) showView(view);
  });

  buildToolbar();
  showView(['checklist', 'roadmap', 'missables', 'about'].includes(startView) ? startView : 'checklist');
  renderAll();
}

boot();
