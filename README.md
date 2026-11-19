# GTA 6 Trophy Guide — Leonida Ledger

[![make.fun](https://img.shields.io/badge/make.fun-gta6--trophy--guide--01-7c3aed)](https://make.fun/c/gta6-trophy-guide-01/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://github.com/intan151/gta6-trophy-guide/blob/main/LICENSE)
[![Trophies](https://img.shields.io/badge/trophies-55-blue)](https://github.com/intan151/gta6-trophy-guide)
[![Offline](https://img.shields.io/badge/offline-static%20app-brightgreen)](https://github.com/intan151/gta6-trophy-guide)

An offline guide and tracker for every one of the **55 PlayStation 5 trophies** of
**Grand Theft Auto VI** (1 platinum, 2 gold, 6 silver, 46 bronze) — built for the
[make.fun bounty "Build the best GTA 6 trophy guide"](https://make.fun/c/gta6-trophy-guide-01/).

No account, no network, no ads. Open `app/index.html` in any desktop browser and it
works with the network off: every file it loads lives under `app/`.

## What it does

- **Checklist tracker** — tick each trophy as you earn it. Progress is saved in your
  browser (`localStorage`), with an overall percentage and counts per grade and per
  kind. Export your progress to a JSON file and import it back any time.
- **A guide for every trophy** — each of the 55 trophies shows its official name,
  description and grade exactly as PlayStation publishes them, plus a guide written
  for this project in our own words (what to do, where, when it can be missed) and
  the sources each fact comes from. Sources are cited, never copied.
- **Filters** — by grade (platinum / gold / silver / bronze), by kind (story,
  missable, collectibles, activities, online), by text search, and earned-only /
  unearned-only.
- **Spoiler setting** — hides the names and descriptions of story trophies until you
  earn them (or turn the setting off). Hidden trophies stay hidden.
- **Roadmap to the platinum** — ordered phases (story, side content, activities,
  collectibles, money, cleanup) with the trophies in each phase and their counts,
  built from the official descriptions. PowerPyx rates the platinum 4/10 at about
  200 hours.
- **Missable flags** — every missable trophy is flagged in the list, in its guide
  and on the Missables page. As of launch, the guides report exactly one
  potentially missable trophy: **Positive Mental Attitude** (a meditation spot in
  Chapter 1 can be lost). Everything else can still be earned in free roam after
  the story.

## The trophy list

The official list as frozen on 2026-11-18, cross-checked between
[Exophase](https://www.exophase.com/game/grand-theft-auto-vi-psn/trophies/) and
[PSNProfiles](https://psnprofiles.com/trophies/43531-grand-theft-auto-vi), which agree
on every name, description and grade. How-to detail draws on
[PowerPyx's GTA 6 trophy guide](https://www.powerpyx.com/gta-6-grand-theft-auto-vi-trophy-guide-roadmap/),
[GTA Zone's trophy list](https://gta-zone.com/news/gta-6-trophies-achievements/) and
[GTA Vice's trophies guide](https://www.gtavice.net/guides/trophies-and-achievements),
each cited beside the trophy it informs. Where the community has not pinned a
detail down yet, the guide says so instead of inventing it.

## Run it locally

```sh
node serve.ts        # serves app/ at http://localhost:8080
```

Or any static server with `app/` at its root:

```sh
python3 -m http.server 8080 --directory app
```

## Hand in (make.fun)

```sh
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```

`main.ts` (Node 22, standard library only) copies `app/` and `screenshots/` to the
output directory and writes `dossier.json` with `buildDossier` from
`vendor/makefun-frontend.ts`.

## Layout

```
app/
  index.html            the guide (single page)
  css/style.css         the whole look
  js/main.js            boot, views, rendering
  js/store.js           saved progress, export / import
  js/filters.js         grade / kind / search / earned filters, spoiler rule
  js/roadmap.js         roadmap phases and missable list
  data/trophies.json    the 55 trophies: official name, description, grade,
                        kind, missable flag, guide and sources
screenshots/           3–4 real renders of the app running locally
main.ts                 hands the entry in (copies app/ + screenshots/, writes dossier.json)
serve.ts                tiny local static server for development
vendor/
  makefun-frontend.ts   make.fun's dossier library, unchanged from the kit
```

## License

MIT — see [LICENSE](LICENSE). This is a fan-made guide. Grand Theft Auto, GTA and
Vice City are trademarks of Rockstar Games / Take-Two Interactive. No Rockstar
logo, artwork or game screenshot is used anywhere in this project.
