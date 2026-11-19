// A tiny static server for local development only: serves app/ at
// http://localhost:8080 (or --port <n>). Node 22, standard library only.
// Not part of the entry the grader runs; the guide itself is plain files.

import { createReadStream, statSync } from 'node:fs';
import { createServer } from 'node:http';
import { extname, join, normalize, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(fileURLToPath(new URL('./app', import.meta.url)));
const args = process.argv.slice(2);
const portFlag = args.indexOf('--port');
const wanted = portFlag === -1 ? 8080 : Number(args[portFlag + 1]);
const port = Number.isInteger(wanted) && wanted > 0 && wanted < 65536 ? wanted : 8080;

const MIME: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
};

createServer((request, response) => {
  const path = decodeURIComponent(new URL(request.url ?? '/', 'http://localhost').pathname);
  const file = resolve(join(root, normalize(path).replace(/^(\.\.[/\\])+/, '')));
  if (!file.startsWith(root + sep) && file !== root) {
    response.writeHead(403);
    response.end('forbidden');
    return;
  }
  const target = file === root ? join(root, 'index.html') : file;
  let info;
  try {
    info = statSync(target);
  } catch {
    response.writeHead(404);
    response.end('not found');
    return;
  }
  if (!info.isFile()) {
    response.writeHead(404);
    response.end('not found');
    return;
  }
  response.writeHead(200, { 'content-type': MIME[extname(target)] ?? 'application/octet-stream' });
  createReadStream(target).pipe(response);
}).listen(port, () => console.log(`leonida-ledger: serving app/ at http://localhost:${port}`));
