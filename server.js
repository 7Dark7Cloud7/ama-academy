import express from 'express';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import webSearchHandler from './api/web-search.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;
const HOST = '0.0.0.0';

app.use(express.json({ limit: '6mb' }));

// Persistent local MVP JSON database (data/mvp-db.json)
const DATA_DIR = path.join(__dirname, 'data');
const DB_FILE = path.join(DATA_DIR, 'mvp-db.json');
const ALLOWED_RESOURCES = new Set(['decks', 'profiles', 'classes', 'student_cards', 'quiz_attempts']);

function readMvpDb() {
  try {
    if (fs.existsSync(DB_FILE)) {
      const parsed = JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
      return {
        decks: Array.isArray(parsed.decks) ? parsed.decks : [],
        profiles: Array.isArray(parsed.profiles) ? parsed.profiles : [],
        classes: Array.isArray(parsed.classes) ? parsed.classes : [],
        student_cards: Array.isArray(parsed.student_cards) ? parsed.student_cards : [],
        quiz_attempts: Array.isArray(parsed.quiz_attempts) ? parsed.quiz_attempts : [],
      };
    }
  } catch { }
  return { decks: [], profiles: [], classes: [], student_cards: [], quiz_attempts: [] };
}

function writeMvpDb(db) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), 'utf8');
}

app.get('/api/web-search', (req, res) => webSearchHandler(req, res));

app.get('/api/mvp', (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  const resource = String((req.query && req.query.resource) || 'health');
  if (resource === 'health') {
    const db = readMvpDb();
    return res.json({
      ok: true,
      service: 'ceu-academy-mvp-api',
      storage: 'local-file-db',
      counts: {
        decks: db.decks.length,
        profiles: db.profiles.length,
        classes: db.classes.length,
        student_cards: db.student_cards.length,
        quiz_attempts: db.quiz_attempts.length,
      },
      timestamp: new Date().toISOString(),
    });
  }
  if (!ALLOWED_RESOURCES.has(resource)) {
    return res.status(400).json({ ok: false, error: 'Recurso inválido.' });
  }
  const db = readMvpDb();
  return res.json({ ok: true, storage: 'local-file-db', records: db[resource] || [] });
});

app.post('/api/mvp', (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  const body = req.body || {};
  const resource = String(body.resource || '');
  const action = String(body.action || 'upsert');
  if (!ALLOWED_RESOURCES.has(resource)) {
    return res.status(400).json({ ok: false, error: 'Recurso inválido.' });
  }
  const db = readMvpDb();
  if (action === 'delete') {
    const id = String(body.id || '');
    db[resource] = (db[resource] || []).filter((r) => String(r.id) !== id);
    writeMvpDb(db);
    return res.json({ ok: true, storage: 'local-file-db', deleted: id });
  }
  const rec = body.record;
  if (!rec || !rec.id) return res.status(400).json({ ok: false, error: 'Registo inválido.' });
  const cleanRec = { ...rec, id: String(rec.id).slice(0, 80), updatedAt: new Date().toISOString() };
  db[resource] = (db[resource] || []).filter((r) => String(r.id) !== cleanRec.id);
  db[resource].unshift(cleanRec);
  db[resource] = db[resource].slice(0, 80);
  writeMvpDb(db);
  return res.json({ ok: true, storage: 'local-file-db', record: { id: cleanRec.id, updatedAt: cleanRec.updatedAt } });
});

const BLOCKED_ROOT_FILES = new Set([
  '/package.json',
  '/package-lock.json',
  '/server.js',
  '/metadata.json',
  '/vercel.json',
]);

// Prevent exposing server files, dotfiles, data/, or node_modules as public static assets.
app.use((req, res, next) => {
  const normalizedPath = path.posix.normalize(req.path);
  if (
    BLOCKED_ROOT_FILES.has(normalizedPath) ||
    normalizedPath === '/node_modules' ||
    normalizedPath.startsWith('/node_modules/') ||
    normalizedPath === '/data' ||
    normalizedPath.startsWith('/data/') ||
    normalizedPath.split('/').some((segment) => segment.startsWith('.') && segment.length > 1)
  ) {
    return res.status(404).type('text/plain').send('Not found');
  }
  next();
});

// Serve static assets from project root with cache rules matching vercel.json.
app.use(
  express.static(__dirname, {
    index: 'index.html',
    dotfiles: 'ignore',
    setHeaders(res, filePath) {
      if (/\.(css|js)$/i.test(filePath)) {
        res.setHeader('Cache-Control', 'no-cache');
      }
    },
  })
);

// SPA fallback for navigation routes while keeping missing asset requests as 404.
app.use((req, res, next) => {
  if (req.method !== 'GET') return next();
  if (path.extname(req.path)) {
    return res.status(404).type('text/plain').send('Not found');
  }
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, HOST, () => {
  console.log(`CEU / AMA MVP server running at http://${HOST}:${PORT}`);
});
