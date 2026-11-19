// Leonida Ledger — the hand-in program for the gta6-trophy-guide-01 entry.
//
// What it does: takes the guide as it sits in this repository (app/ plus the
// screenshots/ renders) and hands it to make.fun's grader by writing it out to
// /output — or to $MAKEFUN_OUTPUT_DIR when that is set — together with
// dossier.json, the summary the judge reads, built by the vendored library in
// vendor/makefun-frontend.ts (that file is the kit's copy, unchanged; the
// scorer rebuilds the dossier from the same library and compares byte for
// byte, so nothing here may touch it).
//
// Node 22, standard library only, no build step, no network:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts

import { cpSync, existsSync, mkdirSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-frontend.ts';

const repoRoot = fileURLToPath(new URL('.', import.meta.url));
const outDir = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';
const appDir = join(repoRoot, 'app');
const shotsDir = join(repoRoot, 'screenshots');

function fail(message: string): never {
  throw new Error(`leonida-ledger: ${message}`);
}

if (!existsSync(appDir) || !statSync(appDir).isDirectory()) fail('app/ is missing');
if (!existsSync(join(appDir, 'index.html'))) fail('app/index.html is missing');

const shotNames = existsSync(shotsDir)
  ? readdirSync(shotsDir).filter((name) => !name.startsWith('.'))
  : [];
if (shotNames.length < 3 || shotNames.length > 4) {
  fail(`expected 3 or 4 screenshots, found ${shotNames.length}`);
}

mkdirSync(outDir, { recursive: true });
cpSync(appDir, join(outDir, 'app'), { recursive: true });
mkdirSync(join(outDir, 'screenshots'), { recursive: true });
cpSync(shotsDir, join(outDir, 'screenshots'), { recursive: true });

// Same caps the sealed scorer enforces: 4 screenshots at most, 256 KiB each,
// app/ at most 993 files and directories and 48 MiB, dossier text at most
// 160 KiB. buildDossier refuses anything past them, so a bad hand-in fails
// here, loudly, instead of silently reaching the judge.
const dossier = buildDossier(outDir, {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  app_max_files: 993,
  app_max_bytes: 50331648,
});
writeFileSync(join(outDir, 'dossier.json'), dossier);

console.log(`leonida-ledger: wrote ${outDir} (${shotNames.length} screenshots, dossier ${dossier.length} bytes)`);
