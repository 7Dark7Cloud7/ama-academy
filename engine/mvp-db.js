// CEU Academy / AMA — Camada de Base de Dados MVP (IndexedDB + Sync /api/mvp)
// Armazena decks grandes (PDFs, imagens, 3D, notas, anotações), cartões de estudante,
// turmas, inscrições e tentativas de quiz sem limite de 5 MB do localStorage.
// Sincroniza automaticamente com /api/mvp quando há servidor disponível.

const DB_NAME = 'ceu_academy_mvp_v1';
const DB_VERSION = 1;
const STORES = ['decks', 'profiles', 'classes', 'student_cards', 'quiz_attempts', 'meta'];

let dbPromise = null;

function hasIDB() {
  return typeof indexedDB !== 'undefined';
}

export function openMvpDb() {
  if (!hasIDB()) return Promise.resolve(null);
  if (dbPromise) return dbPromise;
  dbPromise = new Promise((resolve) => {
    try {
      const req = indexedDB.open(DB_NAME, DB_VERSION);
      req.onupgradeneeded = () => {
        const db = req.result;
        for (const name of STORES) {
          if (!db.objectStoreNames.contains(name)) {
            db.createObjectStore(name, { keyPath: 'id' });
          }
        }
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => resolve(null);
    } catch {
      resolve(null);
    }
  });
  return dbPromise;
}

async function txPut(storeName, record) {
  const db = await openMvpDb();
  if (!db || !record || !record.id) return false;
  return new Promise((resolve) => {
    try {
      const tx = db.transaction(storeName, 'readwrite');
      tx.objectStore(storeName).put({ ...record, updatedAt: new Date().toISOString() });
      tx.oncomplete = () => resolve(true);
      tx.onerror = () => resolve(false);
    } catch { resolve(false); }
  });
}

async function txGetAll(storeName) {
  const db = await openMvpDb();
  if (!db) return [];
  return new Promise((resolve) => {
    try {
      const tx = db.transaction(storeName, 'readonly');
      const req = tx.objectStore(storeName).getAll();
      req.onsuccess = () => resolve(Array.isArray(req.result) ? req.result : []);
      req.onerror = () => resolve([]);
    } catch { resolve([]); }
  });
}

async function txDelete(storeName, id) {
  const db = await openMvpDb();
  if (!db || !id) return false;
  return new Promise((resolve) => {
    try {
      const tx = db.transaction(storeName, 'readwrite');
      tx.objectStore(storeName).delete(id);
      tx.oncomplete = () => resolve(true);
      tx.onerror = () => resolve(false);
    } catch { resolve(false); }
  });
}

/* ------------------------------------------------------------------ */
/* Decks (Apresentações PDF -> Slides)                                */
/* ------------------------------------------------------------------ */
export async function saveDeckRecord(deck) {
  if (!deck || !deck.id) return false;
  const payload = {
    id: String(deck.id),
    title: String(deck.title || 'Apresentação'),
    subject: String(deck.subject || 'geral'),
    docType: String(deck.docType || 'aula'),
    sourceName: String(deck.sourceName || ''),
    brand: String(deck.brand || 'Núcleo CEU'),
    slideCount: Array.isArray(deck.slides) ? deck.slides.length : 0,
    data: deck,
    updatedAt: new Date().toISOString(),
  };
  const ok = await txPut('decks', payload);
  // Background sync to /api/mvp (non-blocking, resilient offline)
  pushRemote('decks', payload).catch(() => {});
  return ok;
}

export async function listDeckRecords() {
  const rows = await txGetAll('decks');
  rows.sort((a, b) => String(b.updatedAt || '').localeCompare(String(a.updatedAt || '')));
  return rows.map((r) => r.data || r);
}

export async function deleteDeckRecord(id) {
  const ok = await txDelete('decks', String(id));
  deleteRemote('decks', String(id)).catch(() => {});
  return ok;
}

/* ------------------------------------------------------------------ */
/* Cartão de Estudante Digital + Perfis + Quiz                        */
/* ------------------------------------------------------------------ */
export async function saveStudentCard(card) {
  const rec = {
    id: String(card?.id || 'card-primary'),
    nome: String(card?.nome || 'Estudante CEU'),
    universidade: String(card?.universidade || 'Universidade de Luanda'),
    curso: String(card?.curso || 'Engenharia Informática'),
    numero: String(card?.numero || `CEU-${String(Date.now()).slice(-6)}`),
    ano: String(card?.ano || '2.º Ano'),
    estado: 'ACTIVO',
    updatedAt: new Date().toISOString(),
  };
  await txPut('student_cards', rec);
  pushRemote('student_cards', rec).catch(() => {});
  return rec;
}

export async function getStudentCards() {
  return txGetAll('student_cards');
}

export async function saveQuizAttempt(attempt) {
  const rec = {
    id: String(attempt?.id || `qa-${Date.now()}`),
    deckId: String(attempt?.deckId || ''),
    title: String(attempt?.title || 'Quiz'),
    score: Number(attempt?.score || 0),
    total: Number(attempt?.total || 0),
    createdAt: new Date().toISOString(),
  };
  await txPut('quiz_attempts', rec);
  pushRemote('quiz_attempts', rec).catch(() => {});
  return rec;
}

export async function getMvpStats() {
  const [decks, cards, attempts] = await Promise.all([
    txGetAll('decks'),
    txGetAll('student_cards'),
    txGetAll('quiz_attempts'),
  ]);
  const remote = await checkRemoteHealth();
  return {
    engine: hasIDB() ? 'IndexedDB + API Sync' : 'localStorage',
    decks: decks.length,
    studentCards: cards.length,
    quizAttempts: attempts.length,
    cloudConnected: !!remote.ok,
    cloudMode: remote.mode || 'local-first',
  };
}

/* ------------------------------------------------------------------ */
/* Sincronização com Backend REST (/api/mvp)                          */
/* ------------------------------------------------------------------ */
async function checkRemoteHealth() {
  if (typeof fetch !== 'function') return { ok: false, mode: 'offline' };
  try {
    const r = await fetch('/api/mvp?resource=health', { headers: { Accept: 'application/json' } });
    if (!r.ok) return { ok: false, mode: 'local-first' };
    const data = await r.json();
    return { ok: !!data?.ok, mode: data?.storage || 'api' };
  } catch {
    return { ok: false, mode: 'local-first' };
  }
}

async function pushRemote(resource, record) {
  if (typeof fetch !== 'function') return null;
  try {
    const res = await fetch('/api/mvp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ resource, action: 'upsert', record }),
    });
    return res.ok ? res.json() : null;
  } catch {
    return null;
  }
}

async function deleteRemote(resource, id) {
  if (typeof fetch !== 'function') return null;
  try {
    const res = await fetch('/api/mvp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ resource, action: 'delete', id }),
    });
    return res.ok ? res.json() : null;
  } catch {
    return null;
  }
}

export async function syncWithServer() {
  const health = await checkRemoteHealth();
  if (!health.ok) return { ok: false, synced: 0, mode: 'local-first' };
  try {
    const r = await fetch('/api/mvp?resource=decks', { headers: { Accept: 'application/json' } });
    if (!r.ok) return { ok: false, synced: 0, mode: health.mode };
    const json = await r.json();
    const remoteDecks = Array.isArray(json?.records) ? json.records : [];
    const localDecks = await txGetAll('decks');
    const localMap = new Map(localDecks.map((d) => [d.id, d]));
    let synced = 0;
    for (const rd of remoteDecks) {
      if (!rd || !rd.id) continue;
      const cur = localMap.get(rd.id);
      if (!cur || String(rd.updatedAt || '') > String(cur.updatedAt || '')) {
        await txPut('decks', rd);
        synced += 1;
      }
    }
    return { ok: true, synced, mode: health.mode, totalRemote: remoteDecks.length };
  } catch {
    return { ok: false, synced: 0, mode: 'local-first' };
  }
}

/* Migração automática de localStorage -> IndexedDB na primeira abertura */
export async function migrateLocalStorageDecks() {
  try {
    const raw = JSON.parse(localStorage.getItem('ama-projector-v1') || '[]');
    if (Array.isArray(raw) && raw.length) {
      for (const dk of raw) {
        if (dk && dk.id) await txPut('decks', {
          id: String(dk.id),
          title: String(dk.title || 'Apresentação'),
          subject: String(dk.subject || 'geral'),
          docType: String(dk.docType || 'aula'),
          sourceName: String(dk.sourceName || ''),
          slideCount: Array.isArray(dk.slides) ? dk.slides.length : 0,
          data: dk,
          updatedAt: dk.createdAt || new Date().toISOString(),
        });
      }
    }
  } catch { }
}

export async function exportFullBackup() {
  const [decks, profiles, classes, student_cards, quiz_attempts] = await Promise.all([
    txGetAll('decks'), txGetAll('profiles'), txGetAll('classes'), txGetAll('student_cards'), txGetAll('quiz_attempts'),
  ]);
  let localDb = null;
  try { localDb = JSON.parse(localStorage.getItem('ama-v1-db') || 'null'); } catch { }
  return {
    version: 1,
    exportedAt: new Date().toISOString(),
    brand: typeof document !== 'undefined' ? (document.documentElement.dataset.brand || 'ceu') : 'ceu',
    indexedDb: { decks, profiles, classes, student_cards, quiz_attempts },
    localDb,
  };
}
