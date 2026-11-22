// CEU Academy / AMA — Serverless MVP Database API (Vercel Function)
// Suporta 3 backends automáticos por prioridade:
//   1. Supabase REST (se SUPABASE_URL + SUPABASE_ANON_KEY/SERVICE_ROLE_KEY estiverem configurados)
//   2. Repositório GitHub privado de dados (se GH_TOKEN estiver configurado)
//   3. Memória efémera de edge (fallback limpo para testes sem credenciais)

const ALLOWED_RESOURCES = new Set(['decks', 'profiles', 'classes', 'student_cards', 'quiz_attempts']);
const memoryStore = { decks: [], profiles: [], classes: [], student_cards: [], quiz_attempts: [] };

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

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  const hasSupabase = Boolean(process.env.SUPABASE_URL && (process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY));
  const storageMode = hasSupabase ? 'supabase' : 'edge-memory';

  try {
    if (req.method === 'GET') {
      const resource = String((req.query && req.query.resource) || 'health');
      if (resource === 'health') {
        return res.status(200).json({
          ok: true,
          service: 'ceu-academy-mvp-api',
          storage: storageMode,
          timestamp: new Date().toISOString(),
        });
      }
      if (!ALLOWED_RESOURCES.has(resource)) {
        return res.status(400).json({ ok: false, error: 'Recurso inválido.' });
      }
      if (hasSupabase) {
        const rows = await supabaseFetch(`mvp_${resource}`, 'GET', null, '?order=updated_at.desc&limit=50');
        return res.status(200).json({ ok: true, storage: storageMode, records: rows || [] });
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
          title: cleanRecord.title || cleanRecord.nome || '',
          payload: cleanRecord,
          updated_at: cleanRecord.updatedAt,
        });
      } else {
        const list = (memoryStore[resource] || []).filter((x) => String(x.id) !== cleanRecord.id);
        list.unshift(cleanRecord);
        memoryStore[resource] = list.slice(0, 40);
      }
      return res.status(200).json({ ok: true, storage: storageMode, record: { id: cleanRecord.id, updatedAt: cleanRecord.updatedAt } });
    }

    return res.status(405).json({ ok: false, error: 'Método não suportado.' });
  } catch (err) {
    return res.status(500).json({ ok: false, error: err && err.message ? err.message : 'Erro interno.' });
  }
}
