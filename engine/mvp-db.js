// CEU Academy / AMA — Camada de Base de Dados Multi-Turmas (IndexedDB + /api/mvp + Supabase Cloud)
// Suporta escolas, institutos médios e universidades com multi-turmas, publicação de aulas,
// delegados/presidentes AE, mentorias, estágios, universidades parceiras, cartões CEU e decks 3D.

const DB_NAME = 'ceu_academy_mvp_v1';
const DB_VERSION = 3;
const RESOURCES = [
  'decks', 'profiles', 'classes', 'student_cards', 'quiz_attempts',
  'lessons', 'mentorships', 'internships', 'delegates', 'universities', 'online_classes',
];
const STORES = [...RESOURCES, 'meta'];
const SUPA_KEY = 'ceu-supabase-config-v1';

let dbPromise = null;

function hasIDB() {
  return typeof indexedDB !== 'undefined';
}

export function getSupabaseConfig() {
  try {
    const raw = JSON.parse(localStorage.getItem(SUPA_KEY) || 'null');
    if (raw && raw.url && raw.anonKey) {
      return { url: String(raw.url).trim().replace(/\/+$/, ''), anonKey: String(raw.anonKey).trim() };
    }
  } catch { }
  return null;
}

export function saveSupabaseConfig(cfg) {
  try {
    if (!cfg || !cfg.url || !cfg.anonKey) {
      localStorage.removeItem(SUPA_KEY);
      return null;
    }
    const clean = {
      url: String(cfg.url).trim().replace(/\/+$/, ''),
      anonKey: String(cfg.anonKey).trim(),
      savedAt: new Date().toISOString(),
    };
    localStorage.setItem(SUPA_KEY, JSON.stringify(clean));
    return clean;
  } catch {
    return null;
  }
}

async function directSupabase(resource, method = 'GET', record = null, query = '') {
  const cfg = getSupabaseConfig();
  if (!cfg || typeof fetch !== 'function') return null;
  const table = `mvp_${resource}`;
  const url = `${cfg.url}/rest/v1/${table}${query}`;
  const headers = {
    apikey: cfg.anonKey,
    Authorization: `Bearer ${cfg.anonKey}`,
    'Content-Type': 'application/json',
  };
  if (method === 'POST') headers.Prefer = 'resolution=merge-duplicates,return=representation';
  const body = method === 'POST' && record ? JSON.stringify({
    id: String(record.id).slice(0, 80),
    title: String(record.title || record.nome || record.sigla || ''),
    payload: record,
    updated_at: record.updatedAt || new Date().toISOString(),
  }) : undefined;
  const res = await fetch(url, { method, headers, body });
  if (!res.ok) throw new Error(`Supabase HTTP ${res.status}`);
  if (res.status === 204) return [];
  const data = await res.json();
  if (method === 'GET' && Array.isArray(data)) {
    return data.map((row) => (row && row.payload ? { ...row.payload, id: row.id, updatedAt: row.updated_at || row.payload.updatedAt } : row));
  }
  return data;
}

export async function testSupabaseConnection(customCfg = null) {
  const cfg = customCfg && customCfg.url && customCfg.anonKey
    ? { url: String(customCfg.url).trim().replace(/\/+$/, ''), anonKey: String(customCfg.anonKey).trim() }
    : getSupabaseConfig();
  if (!cfg) return { ok: false, error: 'Introduza o Supabase URL e a Anon Key.' };
  try {
    const r = await fetch(`${cfg.url}/rest/v1/mvp_classes?select=id&limit=1`, {
      headers: { apikey: cfg.anonKey, Authorization: `Bearer ${cfg.anonKey}` },
    });
    if (r.ok) return { ok: true, mode: 'supabase-cloud', message: 'Ligado ao Supabase! Tabelas multi-turmas detetadas.' };
    if (r.status === 404) return { ok: false, error: 'Projeto acessível, mas falta executar supabase/schema.sql no SQL Editor.' };
    return { ok: false, error: `Supabase respondeu HTTP ${r.status}. Verifique a Anon Key e políticas RLS.` };
  } catch (e) {
    return { ok: false, error: e && e.message ? e.message : 'Sem ligação ao endpoint Supabase.' };
  }
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
      tx.objectStore(storeName).put({ ...record, updatedAt: record.updatedAt || new Date().toISOString() });
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
/* Coleções genéricas multi-turmas / escola / universidade            */
/* ------------------------------------------------------------------ */
export async function saveCollectionRecord(resource, record) {
  if (!RESOURCES.includes(resource) || !record || !record.id) return null;
  const clean = { ...record, id: String(record.id).slice(0, 80), updatedAt: new Date().toISOString() };
  await txPut(resource, clean);
  pushRemote(resource, clean).catch(() => {});
  return clean;
}

export async function listCollectionRecords(resource) {
  if (!RESOURCES.includes(resource)) return [];
  const rows = await txGetAll(resource);
  rows.sort((a, b) => String(b.updatedAt || '').localeCompare(String(a.updatedAt || '')));
  return rows;
}

export async function deleteCollectionRecord(resource, id) {
  if (!RESOURCES.includes(resource) || !id) return false;
  const ok = await txDelete(resource, String(id));
  deleteRemote(resource, String(id)).catch(() => {});
  return ok;
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
  const [decks, cards, attempts, classes, lessons, delegates] = await Promise.all([
    txGetAll('decks'),
    txGetAll('student_cards'),
    txGetAll('quiz_attempts'),
    txGetAll('classes'),
    txGetAll('lessons'),
    txGetAll('delegates'),
  ]);
  const supa = getSupabaseConfig();
  const remote = await checkRemoteHealth();
  return {
    engine: supa ? 'Supabase Cloud + IndexedDB' : (hasIDB() ? 'IndexedDB + API Sync' : 'localStorage'),
    decks: decks.length,
    studentCards: cards.length,
    quizAttempts: attempts.length,
    classes: classes.length,
    lessons: lessons.length,
    delegates: delegates.length,
    cloudConnected: Boolean(supa || remote.ok),
    cloudMode: supa ? 'supabase-client' : (remote.mode || 'local-first'),
  };
}

/* ------------------------------------------------------------------ */
/* Sincronização com Backend REST (/api/mvp) + Supabase Direto        */
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
  if (getSupabaseConfig()) {
    try { await directSupabase(resource, 'POST', record); } catch { }
  }
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
  if (getSupabaseConfig()) {
    try { await directSupabase(resource, 'DELETE', null, `?id=eq.${encodeURIComponent(id)}`); } catch { }
  }
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

export async function syncResource(resource) {
  if (!RESOURCES.includes(resource)) return { ok: false, synced: 0 };
  let remoteRows = null;
  let mode = 'local-first';
  if (getSupabaseConfig()) {
    try {
      remoteRows = await directSupabase(resource, 'GET', null, '?order=updated_at.desc&limit=80');
      mode = 'supabase-cloud';
    } catch { }
  }
  if (!remoteRows && typeof fetch === 'function') {
    try {
      const r = await fetch(`/api/mvp?resource=${encodeURIComponent(resource)}`, { headers: { Accept: 'application/json' } });
      if (r.ok) {
        const json = await r.json();
        remoteRows = Array.isArray(json?.records) ? json.records : [];
        mode = json?.storage || 'api';
      }
    } catch { }
  }
  if (!Array.isArray(remoteRows)) return { ok: false, synced: 0, mode };
  const localRows = await txGetAll(resource);
  const localMap = new Map(localRows.map((d) => [d.id, d]));
  let synced = 0;
  for (const rd of remoteRows) {
    if (!rd || !rd.id) continue;
    const cur = localMap.get(rd.id);
    if (!cur || String(rd.updatedAt || '') > String(cur.updatedAt || '')) {
      await txPut(resource, rd);
      synced += 1;
    }
  }
  return { ok: true, synced, mode, totalRemote: remoteRows.length };
}

export async function syncWithServer() {
  const targets = ['decks', 'classes', 'lessons', 'delegates', 'mentorships', 'internships', 'universities'];
  const results = await Promise.all(targets.map((r) => syncResource(r).catch(() => ({ ok: false, synced: 0 }))));
  const synced = results.reduce((acc, x) => acc + (x.synced || 0), 0);
  const firstOk = results.find((x) => x.ok);
  return { ok: !!firstOk, synced, mode: firstOk ? firstOk.mode : 'local-first' };
}

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
  const entries = await Promise.all(RESOURCES.map(async (r) => [r, await txGetAll(r)]));
  const indexedDb = Object.fromEntries(entries);
  let localDb = null;
  try { localDb = JSON.parse(localStorage.getItem('ama-v1-db') || 'null'); } catch { }
  return {
    version: 2,
    exportedAt: new Date().toISOString(),
    brand: typeof document !== 'undefined' ? (document.documentElement.dataset.brand || 'ceu') : 'ceu',
    indexedDb,
    localDb,
  };
}
