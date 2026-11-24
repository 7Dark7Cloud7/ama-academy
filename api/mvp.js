// CEU Academy / AMA — Serverless Multi-Turmas & School/University Cloud Database API
// Persistência automática invisível (zero UI de configuração):
//   1. Supabase REST (se SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY/SUPABASE_ANON_KEY estiverem nas env vars)
//   2. Cloud JSON Store privado (se GH_TOKEN estiver nas env vars -> repo privado 7Dark7Cloud7/ceu-academy-dados)
//   3. Fallback em memória efémera (para testes locais sem credenciais)

const RESOURCES = [
  'decks', 'profiles', 'classes', 'student_cards', 'quiz_attempts',
  'lessons', 'mentorships', 'internships', 'delegates', 'universities', 'online_classes',
];
const ALLOWED_RESOURCES = new Set(RESOURCES);
const memoryStore = Object.fromEntries(RESOURCES.map((r) => [r, []]));
const GH_REPO = process.env.CEU_DATA_REPO || '7Dark7Cloud7/ceu-academy-dados';

async function supabaseFetch(table, method = 'GET', body = null, query = '') {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  const endpoint = `${url.replace(/\/+$/, '')}/rest/v1/${table}${query}`;
  const res = await fetch(endpoint, {
    method,
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      'Content-Type': 'application/json',
      Prefer: method === 'POST' ? 'resolution=merge-duplicates,return=representation' : 'return=representation',
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) throw new Error(`Supabase HTTP ${res.status}`);
  return res.status === 204 ? [] : res.json();
}

async function ghGetCollection(resource) {
  const token = process.env.GH_TOKEN;
  if (!token) return null;
  const url = `https://api.github.com/repos/${GH_REPO}/contents/db/${resource}.json`;
  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/vnd.github+json',
      'User-Agent': 'ceu-academy-cloud',
    },
  });
  if (res.status === 404) return { records: [], sha: null };
  if (!res.ok) throw new Error(`Cloud store GET HTTP ${res.status}`);
  const file = await res.json();
  const text = Buffer.from(file.content || '', 'base64').toString('utf8');
  let records = [];
  try {
    const parsed = JSON.parse(text);
    records = Array.isArray(parsed) ? parsed : [];
  } catch { records = []; }
  return { records, sha: file.sha || null };
}

async function ghSaveCollection(resource, records, sha) {
  const token = process.env.GH_TOKEN;
  if (!token) return false;
  const url = `https://api.github.com/repos/${GH_REPO}/contents/db/${resource}.json`;
  const content = Buffer.from(JSON.stringify(records, null, 2), 'utf8').toString('base64');
  const body = {
    message: `sync(${resource}): update ${records.length} record(s)`,
    content,
    ...(sha ? { sha } : {}),
  };
  const res = await fetch(url, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/vnd.github+json',
      'Content-Type': 'application/json',
      'User-Agent': 'ceu-academy-cloud',
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`Cloud store PUT HTTP ${res.status}`);
  return true;
}

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  const hasSupabase = Boolean(process.env.SUPABASE_URL && (process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY));
  const hasCloudStore = Boolean(process.env.GH_TOKEN);
  const storageMode = hasSupabase ? 'supabase' : (hasCloudStore ? 'cloud-db' : 'edge-memory');

  try {
    if (req.method === 'GET') {
      const resource = String((req.query && req.query.resource) || 'health');
      if (resource === 'health') {
        return res.status(200).json({
          ok: true,
          service: 'ceu-academy-school-api',
          storage: storageMode,
          resources: RESOURCES,
          timestamp: new Date().toISOString(),
        });
      }
      if (!ALLOWED_RESOURCES.has(resource)) {
        return res.status(400).json({ ok: false, error: 'Recurso inválido.' });
      }
      if (hasSupabase) {
        const rows = await supabaseFetch(`mvp_${resource}`, 'GET', null, '?order=updated_at.desc&limit=80');
        const records = (rows || []).map((row) => (row && row.payload ? { ...row.payload, id: row.id, updatedAt: row.updated_at || row.payload.updatedAt } : row));
        return res.status(200).json({ ok: true, storage: storageMode, records });
      }
      if (hasCloudStore) {
        const col = await ghGetCollection(resource);
        return res.status(200).json({ ok: true, storage: storageMode, records: (col && col.records) || [] });
      }
      return res.status(200).json({ ok: true, storage: storageMode, records: memoryStore[resource] || [] });
    }

    if (req.method === 'POST') {
      const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
      const resource = String(body.resource || '');
      const action = String(body.action || 'upsert');
      if (!ALLOWED_RESOURCES.has(resource)) {
        return res.status(400).json({ ok: false, error: 'Recurso inválido.' });
      }

      if (action === 'delete') {
        const id = String(body.id || '');
        if (!id) return res.status(400).json({ ok: false, error: 'ID obrigatório.' });
        if (hasSupabase) {
          await supabaseFetch(`mvp_${resource}`, 'DELETE', null, `?id=eq.${encodeURIComponent(id)}`);
        } else if (hasCloudStore) {
          const col = await ghGetCollection(resource);
          const next = (col.records || []).filter((x) => String(x.id) !== id);
          await ghSaveCollection(resource, next, col.sha);
        } else {
          memoryStore[resource] = (memoryStore[resource] || []).filter((x) => String(x.id) !== id);
        }
        return res.status(200).json({ ok: true, storage: storageMode, deleted: id });
      }

      const record = body.record;
      if (!record || !record.id) {
        return res.status(400).json({ ok: false, error: 'Registo inválido.' });
      }
      const cleanRecord = {
        ...record,
        id: String(record.id).slice(0, 80),
        updatedAt: new Date().toISOString(),
      };
      if (hasSupabase) {
        await supabaseFetch(`mvp_${resource}`, 'POST', {
          id: cleanRecord.id,
          title: cleanRecord.title || cleanRecord.nome || cleanRecord.sigla || '',
          payload: cleanRecord,
          updated_at: cleanRecord.updatedAt,
        });
      } else if (hasCloudStore) {
        const col = await ghGetCollection(resource);
        const next = (col.records || []).filter((x) => String(x.id) !== cleanRecord.id);
        next.unshift(cleanRecord);
        await ghSaveCollection(resource, next.slice(0, 80), col.sha);
      } else {
        const list = (memoryStore[resource] || []).filter((x) => String(x.id) !== cleanRecord.id);
        list.unshift(cleanRecord);
        memoryStore[resource] = list.slice(0, 80);
      }
      return res.status(200).json({ ok: true, storage: storageMode, record: { id: cleanRecord.id, updatedAt: cleanRecord.updatedAt } });
    }

    return res.status(405).json({ ok: false, error: 'Método não suportado.' });
  } catch (err) {
    return res.status(500).json({ ok: false, error: err && err.message ? err.message : 'Erro interno.' });
  }
}
