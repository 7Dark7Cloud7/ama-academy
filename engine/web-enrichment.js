// AMA / CEU Academy · Motor de Investigação Web & Multimédia (activo por omissão).
// Lê o ficheiro do docente, pesquisa na Wikipédia (PT + EN), Wikimedia Commons
// (imagens e diagramas reais), Wikidata (vídeos YouTube verificados P1651),
// OpenStreetMap/Google Maps e links colados — e devolve tudo pronto para a IA
// FUNDIR e EMBUTIR directamente nos slides (com origem indicada).
// Zero chaves de API obrigatórias. Se não houver rede, o deck continua local.

const WIKI = {
  pt: 'https://pt.wikipedia.org/w/api.php',
  en: 'https://en.wikipedia.org/w/api.php',
};
const COMMONS_API = 'https://commons.wikimedia.org/w/api.php';
const WIKIDATA_API = 'https://www.wikidata.org/w/api.php';

const clean = (v, max = 320) => String(v || '').replace(/\s+/g, ' ').trim().slice(0, max);
const stripHtml = (v) => String(v || '').replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();

export function researchTerms(analysis = {}, title = '', sections = []) {
  const full = clean(title || analysis.title || '', 80);
  const secHeads = (Array.isArray(sections) ? sections : [])
    .map((s) => clean(typeof s === 'string' ? s : (s.heading || s.title || ''), 60))
    .filter((t) => t.length >= 4 && !/^(bloco|tópico|slide|página|introdução|resumo|síntese)\b/i.test(t));
  const raw = [
    full,
    ...(Array.isArray(analysis.keyTerms) ? analysis.keyTerms : []),
    ...secHeads,
    clean(String(analysis.centralIdea || '').split(/[.!?]/)[0], 70),
  ];
  const seen = new Set();
  const out = [];
  for (const item of raw) {
    const t = clean(item.replace(/^(o que é|como funciona|introdução a[o]?|aula \d+[:\-]?)\s+/i, ''), 64);
    if (!t || t.length < 4 || seen.has(t.toLowerCase())) continue;
    seen.add(t.toLowerCase());
    out.push(t);
    if (out.length >= 6) break;
  }
  const pool = [full, ...(Array.isArray(analysis.keyTerms) ? analysis.keyTerms : []), ...secHeads].join(' ');
  for (const w of pool.split(/\s+/)) {
    const t = clean(w.replace(/[^\p{L}\p{N}]/gu, ''), 40);
    if (t.length < 5 || /^(sobre|para|como|quando|porque|também|capítulo|secção|objectivo|aula|tema|página|bloco|exemplo|estudo)$/i.test(t)) continue;
    if (seen.has(t.toLowerCase())) continue;
    seen.add(t.toLowerCase());
    out.push(t);
    if (out.length >= 8) break;
  }
  return out.slice(0, 8);
}

export function detectVideos(text = '') {
  const src = String(text || '');
  const out = [];
  const seen = new Set();
  const re = /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:watch\?(?:[^#\s]*?\bv=)|embed\/|shorts\/)|youtu\.be\/)([A-Za-z0-9_-]{11})/gi;
  let m;
  while ((m = re.exec(src))) {
    const id = m[1];
    if (seen.has(id)) continue;
    seen.add(id);
    out.push(makeYouTubeVideo(id, `Vídeo da aula · ${id}`, 'Vídeo YouTube citado no material — pronto a reproduzir no slide.'));
  }
  const vre = /https?:\/\/(?:www\.)?vimeo\.com\/(\d+)/gi;
  while ((m = vre.exec(src))) {
    const id = m[1];
    if (seen.has(`v${id}`)) continue;
    seen.add(`v${id}`);
    out.push({
      kind: 'video',
      id: `v${id}`,
      title: `Vídeo Vimeo · ${id}`,
      text: 'Vídeo citado no material do docente — pronto a ver no slide.',
      url: `https://vimeo.com/${id}`,
      embed: `https://player.vimeo.com/video/${id}`,
      image: { url: '', alt: `Vídeo Vimeo ${id}`, credit: 'Vimeo', page: `https://vimeo.com/${id}` },
      source: 'Vimeo',
      retrieved: new Date().toISOString(),
    });
  }
  return out.slice(0, 5);
}

function makeYouTubeVideo(id, title, text, term = '', source = 'YouTube') {
  return {
    kind: 'video',
    id,
    term,
    title: clean(title || `Vídeo YouTube · ${id}`, 90),
    text: clean(text || 'Vídeo explicativo associado ao tema do slide.', 180),
    url: `https://www.youtube.com/watch?v=${id}`,
    embed: `https://www.youtube-nocookie.com/embed/${id}?rel=0`,
    image: {
      url: `https://i.ytimg.com/vi/${id}/hqdefault.jpg`,
      alt: `Miniatura de vídeo: ${clean(title || id, 60)}`,
      credit: `${source} · miniatura`,
      page: `https://www.youtube.com/watch?v=${id}`,
    },
    source,
    retrieved: new Date().toISOString(),
  };
}

function withTimeout(signal, ms = 7500) {
  if (typeof AbortSignal !== 'undefined' && typeof AbortSignal.any === 'function' && typeof AbortSignal.timeout === 'function') {
    const signals = [AbortSignal.timeout(ms)];
    if (signal) signals.unshift(signal);
    return AbortSignal.any(signals);
  }
  return signal || undefined;
}

function wikiUrl(lang, title) {
  return `https://${lang}.wikipedia.org/wiki/${encodeURIComponent(String(title).replace(/\s+/g, '_'))}`;
}

async function jsonFetch(url, signal, ms = 7500) {
  const r = await fetch(url.toString(), { signal: withTimeout(signal, ms), headers: { Accept: 'application/json' } });
  if (!r.ok) throw new Error(`HTTP ${r.status}`);
  return r.json();
}

function splitCleanSentences(text) {
  return String(text || '')
    .split(/(?<=[.!?])\s+/)
    .map((s) => clean(s, 220))
    .filter((s) => s.length >= 24);
}

const JUNK_MEDIA_RE = /\b(icon|logo|logotipo|flag_of|stub|edit|arrow|button|page_\d|djvu|signature|seal|emblem|coat_of_arms|insignia|crest|patch|badge|air_force|força_aérea|forca_aerea|military|army|navy|usaf|bandeira|brasão|brasao|gravestone|tombstone|memorial_plaque|book_cover|title_page|frontispiece|newspaper|manuscript|scan|stamp|postage|coin_obverse|poster|album_cover|dvd_cover|telenovela|novela)\b/i;
const POP_CULTURE_WIKI_RE = /\b(telenovela|s[ée]rie de televis[aã]o|filme de \d{4}|[áa]lbum de|can[çc][aã]o de|single de|banda de rock|futebolista|cantor[a]? brasileir|atriz|ator|soap opera|television series|studio album|video game)\b/i;

function pageToItem(p, lang, term, url) {
  if (!p || !p.title || !p.extract) return null;
  if (POP_CULTURE_WIKI_RE.test(`${p.title} ${p.extract}`)) return null;
  const link = url || wikiUrl(lang, p.title);
  const sentences = splitCleanSentences(p.extract);
  const ytLinks = Array.isArray(p.extlinks)
    ? p.extlinks.map((e) => e['*'] || e.url || '').filter((u) => /youtube\.com|youtu\.be/i.test(u))
    : [];
  const thumbUrl = p.thumbnail?.source ? String(p.thumbnail.source) : '';
  const validThumb = thumbUrl && !JUNK_MEDIA_RE.test(decodeURIComponent(thumbUrl));
  return {
    kind: 'insight',
    term,
    title: clean(p.title, 90),
    text: clean(p.extract, 460),
    sentences: sentences.slice(0, 4),
    wiki: lang,
    source: `Wikipédia (${lang.toUpperCase()})`,
    url: link,
    youtubeLinks: ytLinks,
    image: validThumb
      ? {
          url: thumbUrl,
          alt: `Ilustração de «${clean(p.title, 70)}»`,
          credit: `Wikimedia Commons · ${clean(p.title, 50)}`,
          page: link,
          term,
        }
      : null,
    retrieved: new Date().toISOString(),
  };
}

async function wikiSearch(term, lang, signal) {
  const url = new URL(WIKI[lang] || WIKI.pt);
  const params = {
    origin: '*', action: 'query', format: 'json', generator: 'search',
    gsrsearch: term, gsrlimit: '3', gsrnamespace: '0',
    prop: 'extracts|pageimages|extlinks', exintro: '1', explaintext: '1', exsentences: '4',
    piprop: 'thumbnail', pithumbsize: '1000', ellimit: '10',
  };
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  const json = await jsonFetch(url, signal);
  const pages = json?.query?.pages ? Object.values(json.query.pages) : [];
  return pages
    .sort((a, b) => (a.index || 99) - (b.index || 99))
    .map((p) => pageToItem(p, lang, term))
    .filter(Boolean);
}

/* Traduz e expande pedidos visuais em PT/EN para pesquisas de alta precisão na Wikimedia Commons. */
const VISUAL_DICT = [
  [/foguet[aã]o|foguete|rocket|lan[cç]amento/i, 'rocket launch thrust physics'],
  [/in[eé]rcia|cinto de seguran[cç]a|trava[gr]|carro|autom[oó]vel/i, 'Newton cradle physics inertia'],
  [/segunda lei|for[cç]a resultante|f\s*=\s*m|acelera[cç][aã]o|din[aâ]mica|diagrama de for[cç]as/i, 'free body diagram force vector physics'],
  [/terceira lei|ac[cç][aã]o e rea[cç][aã]o/i, 'rocket launch action reaction thrust'],
  [/juro composto|capitaliza[cç][aã]o|exponencial|poupan[cç]a/i, 'compound interest exponential growth graph'],
  [/kwanza|infla[cç][aã]o|finan[cç]as|or[cç]amento|dinheiro/i, 'Angolan kwanza currency finance'],
  [/pesquisa bin[aá]ria|binary search|algoritmo|[aá]rvore/i, 'binary search tree algorithm diagram'],
  [/python|programa[cç][aã]o|c[oó]digo|estruturas de dados/i, 'computer programming code screen'],
  [/fotoss[ií]ntese|clorofila|cloroplasto|ciclo de calvin/i, 'photosynthesis chloroplast diagram'],
  [/maiombe|floresta|ecossistema|biodiversidade|planta/i, 'tropical rainforest canopy green leaves'],
  [/c[eé]lula|adn|dna|gen[eé]tica|biologia/i, 'plant cell biology diagram'],
  [/fun[cç][aã]o|derivada|c[aá]lculo|par[aá]bola|gr[aá]fico/i, 'mathematical function graph derivative'],
  [/reuni[aã]o|ata|direc[cç][aã]o|equipa|gest[aã]o/i, 'business meeting conference room'],
  [/projetor|sala de aula|universidade|estudante|campus/i, 'university lecture hall classroom'],
  [/luanda|angola/i, 'Luanda Angola skyline'],
  [/mapa|geografia|bairro/i, 'Angola Luanda map geography'],
  [/energia|electricidade|circuito|ohm/i, 'electric circuit physics diagram'],
  [/onda|frequ[eê]ncia|som|luz/i, 'sine wave physics frequency diagram'],
];

export function buildCoherentImageQueries({ title = '', text = '', sections = [], briefQueries = [], visualStyle = 'auto' } = {}) {
  const queries = [];
  const seen = new Set();
  const pushQ = (q, tag = '') => {
    const s = clean(q, 72);
    if (!s || s.length < 3) return;
    const key = s.toLowerCase();
    if (seen.has(key)) return;
    seen.add(key);
    queries.push({ query: s, tag: tag || s });
  };

  // 1. PRIORIDADE MÁXIMA: pedidos explícitos da descrição (áudio ou texto) do docente
  (Array.isArray(briefQueries) ? briefQueries : []).forEach((bq) => {
    const raw = clean(bq, 64);
    if (!raw) return;
    let translated = '';
    for (const [re, en] of VISUAL_DICT) {
      if (re.test(raw)) { translated = en; break; }
    }
    if (translated) pushQ(translated, raw);
    pushQ(visualStyle === 'diagrams' ? `${raw} diagram` : raw, raw);
  });

  // 2. Conceitos científicos/temáticos coerentes extraídos do título e secções
  const secStr = (Array.isArray(sections) ? sections : [])
    .map((s) => (typeof s === 'string' ? s : (s.heading || s.title || '')))
    .join(' ');
  const combined = `${title} ${secStr} ${String(text || '').slice(0, 700)}`;
  for (const [re, en] of VISUAL_DICT) {
    if (re.test(combined)) {
      pushQ(visualStyle === 'diagrams' ? `${en} diagram` : en, en);
    }
    if (queries.length >= 7) break;
  }

  return queries.slice(0, 8);
}

/* Pesquisa aberta na web educativa (Openverse, NASA, OpenAlex, DuckDuckGo via /api/web-search ou CORS directo). */
export async function openWebSearch(term, { kind = 'all', signal } = {}) {
  const q = clean(term, 72);
  if (!q || q.length < 2) return { images: [], items: [] };
  // 1. Tenta o agregador multi-fonte /api/web-search (Express local / Vercel Serverless)
  if (typeof location !== 'undefined' && /^https?:/i.test(location.protocol)) {
    try {
      const apiUrl = new URL('/api/web-search', location.origin);
      apiUrl.searchParams.set('q', q);
      apiUrl.searchParams.set('kind', kind);
      const data = await jsonFetch(apiUrl, signal, 6500);
      if (data && data.ok && ((data.images && data.images.length) || (data.items && data.items.length))) {
        return { images: data.images || [], items: data.items || [] };
      }
    } catch { /* fallback para chamadas CORS directas abaixo */ }
  }
  // 2. Fallback directo por CORS (Openverse + NASA + OpenAlex — 100% abertos sem chave)
  const images = [];
  const items = [];
  const tasks = [];
  if (kind !== 'info') {
    tasks.push(
      jsonFetch(new URL(`https://api.openverse.org/v1/images/?q=${encodeURIComponent(q)}&page_size=4&mature=false`), signal, 5500)
        .then((d) => {
          (d?.results || []).forEach((r) => {
            if (!r || !(r.thumbnail || r.url)) return;
            images.push({
              url: String(r.thumbnail || r.url),
              alt: clean(r.title || q, 110),
              title: clean(r.title || q, 72),
              credit: `Openverse · ${clean(r.creator || r.source || 'Web', 40)}`,
              page: String(r.foreign_landing_url || r.url || ''),
              term: q,
              isDiagram: /diagram|chart|graph|vector|schema/i.test(`${r.title || ''} ${q}`),
            });
          });
        }).catch(() => {})
    );
    if (/rocket|space|physics|force|earth|energy|planet|solar|orbit|forest|climate|foguet|f[ií]sic|planeta/i.test(q)) {
      tasks.push(
        jsonFetch(new URL(`https://images-api.nasa.gov/search?q=${encodeURIComponent(q)}&media_type=image&page_size=2`), signal, 5500)
          .then((d) => {
            (d?.collection?.items || []).slice(0, 2).forEach((it) => {
              const link = (it.links || []).find((l) => l.href);
              const meta = (it.data || [])[0] || {};
              if (link) {
                images.push({
                  url: String(link.href),
                  alt: clean(meta.title || q, 110),
                  title: clean(meta.title || q, 72),
                  credit: 'NASA Image Library',
                  page: meta.nasa_id ? `https://images.nasa.gov/details/${encodeURIComponent(meta.nasa_id)}` : 'https://images.nasa.gov/',
                  term: q,
                  isDiagram: false,
                });
              }
            });
          }).catch(() => {})
      );
    }
  }
  if (kind !== 'images') {
    tasks.push(
      jsonFetch(new URL(`https://api.openalex.org/works?search=${encodeURIComponent(q)}&per-page=2&select=id,display_name,publication_year,doi,primary_location`), signal, 5500)
        .then((d) => {
          (d?.results || []).forEach((w) => {
            const srcName = w?.primary_location?.source?.display_name || 'OpenAlex Académico';
            items.push({
              kind: 'insight',
              term: q,
              title: clean(w.display_name || q, 90),
              text: clean(`Referência académica (${w.publication_year || ''}, ${srcName}): ${w.display_name}.`, 260),
              sentences: [clean(`Estudo académico (${w.publication_year || ''}) publicado em ${srcName}: ${w.display_name}.`, 200)],
              source: `OpenAlex · ${clean(srcName, 30)}`,
              url: String(w.doi || w.id || 'https://openalex.org/'),
              image: null,
            });
          });
        }).catch(() => {})
    );
  }
  await Promise.allSettled(tasks);
  return { images, items };
}

/* Pesquisa múltipla de até 6 imagens coerentes em TODA A WEB (NASA + Flickr Web + Wikimedia Commons) para galeria de escolha rápida */
export async function searchCoherentImages(query, { signal, limit = 6 } = {}) {
  const qList = buildCoherentImageQueries({ briefQueries: [query] });
  const target = qList[0]?.query || clean(query, 64);
  if (!target) return [];
  const [openRes, wikiImgs] = await Promise.all([
    openWebSearch(target, { kind: 'images', signal }).catch(() => ({ images: [] })),
    commonsImageSearch(target, signal, 4).catch(() => []),
  ]);
  const seen = new Set();
  const out = [];
  const push = (im) => {
    if (!im || !im.url || seen.has(im.url)) return;
    seen.add(im.url);
    out.push(im);
  };
  (openRes.images || []).forEach(push);
  (wikiImgs || []).forEach(push);
  if (out.length < 3 && target !== query) {
    const [openFb, wikiFb] = await Promise.all([
      openWebSearch(clean(query, 64), { kind: 'images', signal }).catch(() => ({ images: [] })),
      commonsImageSearch(clean(query, 64), signal, 3).catch(() => []),
    ]);
    (openFb.images || []).forEach(push);
    (wikiFb || []).forEach(push);
  }
  return out.slice(0, limit);
}

/* Pesquisa directa de 1 imagem coerente em TODA A WEB (NASA + Flickr Web + Wikimedia Commons) */
export async function searchCoherentImage(query, signal) {
  const list = await searchCoherentImages(query, { signal, limit: 3 });
  return list[0] || null;
}

/* Imagens e diagramas educacionais reais da Wikimedia Commons (sem API key). */
export async function commonsImageSearch(term, signal, limit = 4) {
  const cleanTerm = clean(term, 60);
  if (!cleanTerm || cleanTerm.length < 3) return [];
  const url = new URL(COMMONS_API);
  Object.entries({
    origin: '*',
    action: 'query',
    format: 'json',
    generator: 'search',
    gsrnamespace: '6',
    gsrsearch: `${cleanTerm} filetype:bitmap|drawing`,
    gsrlimit: String(Math.max(6, limit * 3)),
    prop: 'imageinfo',
    iiprop: 'url|extmetadata|mime|size',
    iiurlwidth: '960',
  }).forEach(([k, v]) => url.searchParams.set(k, v));
  try {
    const json = await jsonFetch(url, signal, 6500);
    const pages = json?.query?.pages ? Object.values(json.query.pages) : [];
    const out = [];
    for (const p of pages.sort((a, b) => (a.index || 99) - (b.index || 99))) {
      const info = Array.isArray(p.imageinfo) ? p.imageinfo[0] : null;
      if (!info) continue;
      const mime = String(info.mime || '').toLowerCase();
      if (!/^image\/(jpeg|png|svg\+xml|webp)$/.test(mime)) continue;
      const title = String(p.title || '').replace(/^File:/i, '');
      // Ignorar ícones, logotipos, brasões, selos militares/institucionais, documentos digitalizados ou capas irrelevantes.
      if (JUNK_MEDIA_RE.test(title)) continue;
      if ((info.width && info.width < 320) || (info.height && info.height < 200)) continue;
      if (info.width && info.height) {
        const ratio = info.width / info.height;
        if (ratio > 2.6 || ratio < 0.5) continue;
      }
      const thumb = info.thumburl || info.url;
      if (!thumb) continue;
      const meta = info.extmetadata || {};
      const desc = clean(stripHtml(meta.ImageDescription?.value || title.replace(/\.[^.]+$/, '').replace(/[_-]+/g, ' ')), 120);
      const author = clean(stripHtml(meta.Artist?.value || 'Wikimedia Commons'), 50);
      out.push({
        url: String(thumb),
        alt: desc || cleanTerm,
        credit: `Wikimedia Commons · ${author}`,
        page: info.descriptionurl || `https://commons.wikimedia.org/wiki/${encodeURIComponent(p.title || '')}`,
        term: cleanTerm,
        title: clean(title.replace(/\.[^.]+$/, '').replace(/[_-]+/g, ' '), 72),
        isDiagram: mime === 'image/svg+xml' || /\b(diagram|schema|graph|chart|cycle|model|vector|force|wave|tree)\b/i.test(title),
      });
      if (out.length >= limit) break;
    }
    return out;
  } catch (err) {
    if (err && err.name === 'AbortError') throw err;
    return [];
  }
}

/* Vídeos YouTube verificados via Wikidata (P1651) — API aberta, sem chave. */
export async function wikidataVideos(term, lang = 'pt', signal) {
  const cleanTerm = clean(term, 60);
  if (!cleanTerm || cleanTerm.length < 3) return [];
  try {
    const searchUrl = new URL(WIKIDATA_API);
    Object.entries({
      origin: '*', action: 'wbsearchentities', format: 'json',
      language: lang, uselang: lang, search: cleanTerm, limit: '3',
    }).forEach(([k, v]) => searchUrl.searchParams.set(k, v));
    const sJson = await jsonFetch(searchUrl, signal, 6000);
    const ids = (sJson?.search || []).map((x) => x.id).filter(Boolean).slice(0, 3);
    if (!ids.length) return [];

    const entUrl = new URL(WIKIDATA_API);
    Object.entries({
      origin: '*', action: 'wbgetentities', format: 'json',
      ids: ids.join('|'), props: 'claims|labels|descriptions', languages: `${lang}|en`,
    }).forEach(([k, v]) => entUrl.searchParams.set(k, v));
    const eJson = await jsonFetch(entUrl, signal, 6000);
    const entities = eJson?.entities || {};
    const out = [];
    for (const id of ids) {
      const ent = entities[id];
      const ytClaims = ent?.claims?.P1651 || [];
      const label = ent?.labels?.[lang]?.value || ent?.labels?.en?.value || cleanTerm;
      const desc = ent?.descriptions?.[lang]?.value || ent?.descriptions?.en?.value || '';
      for (const claim of ytClaims.slice(0, 1)) {
        const ytId = claim?.mainsnak?.datavalue?.value;
        if (typeof ytId === 'string' && /^[A-Za-z0-9_-]{11}$/.test(ytId)) {
          out.push(makeYouTubeVideo(ytId, `${label} — vídeo explicativo`, desc || `Vídeo verificado via Wikidata sobre ${label}.`, cleanTerm, 'YouTube · Wikidata'));
        }
      }
    }
    return out;
  } catch (err) {
    if (err && err.name === 'AbortError') throw err;
    return [];
  }
}

/* Links de Wikipédia colados pelo docente (ou que aparecem no ficheiro). */
async function wikiFromLink(url, signal) {
  const m = String(url).match(/^https?:\/\/(pt|en)\.wikipedia\.org\/wiki\/(.+)$/i);
  if (!m) return null;
  const lang = m[1];
  const title = decodeURIComponent(m[2].replace(/_/g, ' '));
  const api = new URL(WIKI[lang] || WIKI.pt);
  Object.entries({
    origin: '*', action: 'query', format: 'json', titles: title,
    prop: 'extracts|pageimages|extlinks', exintro: '1', explaintext: '1', exsentences: '4',
    piprop: 'thumbnail', pithumbsize: '1000', ellimit: '10',
  }).forEach(([k, v]) => api.searchParams.set(k, v));
  const json = await jsonFetch(api, signal);
  const pages = json?.query?.pages ? Object.values(json.query.pages) : [];
  const p = pages.find((x) => x.extract);
  return p ? pageToItem(p, lang, 'link colado', String(url)) : null;
}

/* Mapa do Google sem chave: o embed público por pesquisa funciona sem API key. */
export function googleMapEmbed(query) {
  return `https://www.google.com/maps?q=${encodeURIComponent(String(query || 'Luanda, Angola'))}&output=embed`;
}

/* Locais reais a partir do OpenStreetMap (sem chave, CORS aberto). */
export async function searchPlaces(query, { signal, limit = 3 } = {}) {
  const url = new URL('https://nominatim.openstreetmap.org/search');
  Object.entries({ format: 'jsonv2', q: String(query || ''), limit: String(limit), 'accept-language': 'pt' })
    .forEach(([k, v]) => url.searchParams.set(k, v));
  try {
    const r = await fetch(url.toString(), { signal: withTimeout(signal, 6500), headers: { Accept: 'application/json' } });
    if (!r.ok) return [];
    const rows = await r.json();
    return (Array.isArray(rows) ? rows : []).map((row) => ({
      kind: 'place',
      title: clean(row.display_name || row.name, 110),
      name: clean(row.name || row.display_name, 70),
      lat: Number(row.lat),
      lon: Number(row.lon),
      type: clean(row.type || row.category, 40),
      text: clean(`${row.name || row.display_name} — ${row.type || 'local'} em ${row.display_name || 'Angola'}.`, 220),
      url: `https://www.openstreetmap.org/?mlat=${row.lat}&mlon=${row.lon}#map=15/${row.lat}/${row.lon}`,
      map: googleMapEmbed(`${row.name || row.display_name}, Angola`),
      image: null,
      source: 'OpenStreetMap / Nominatim',
      retrieved: new Date().toISOString(),
    }));
  } catch (err) {
    if (err && err.name === 'AbortError') throw err;
    return [];
  }
}

export async function wikiCategoryPlaces(category = 'Bairros de Luanda', lang = 'pt', signal) {
  const url = new URL(WIKI[lang] || WIKI.pt);
  Object.entries({
    origin: '*', action: 'query', format: 'json', list: 'categorymembers',
    cmtitle: `Categoria:${category}`, cmlimit: '10', cmtype: 'page',
  }).forEach(([k, v]) => url.searchParams.set(k, v));
  try {
    const json = await jsonFetch(url, signal);
    const members = json?.query?.categorymembers || [];
    if (members.length) {
      return members.slice(0, 8).map((p) => {
        const name = clean(p.title, 80);
        return {
          kind: 'place',
          title: name,
          name,
          text: clean(`${name} — local em Luanda, Angola.`, 220),
          url: wikiUrl(lang, name),
          map: googleMapEmbed(`${name}, Luanda, Angola`),
          image: null,
          source: 'Wikipédia · ' + category,
          retrieved: new Date().toISOString(),
        };
      });
    }
    const found = await wikiSearch(`bairros ${category.replace(/^Bairros de\s*/i, '')}`, lang, signal);
    return found.slice(0, 6).map((p) => ({
      kind: 'place',
      title: p.title,
      name: p.title,
      text: p.text,
      url: p.url,
      map: googleMapEmbed(`${p.title}, Luanda, Angola`),
      image: p.image,
      source: 'Wikipédia · pesquisa ' + category,
      retrieved: new Date().toISOString(),
    }));
  } catch (err) {
    if (err && err.name === 'AbortError') throw err;
    return [];
  }
}

export function collectLinks(...sources) {
  const text = sources.filter(Boolean).join(' ');
  const out = [];
  const seen = new Set();
  const re = /https?:\/\/[^\s<>"')]+/gi;
  let m;
  while ((m = re.exec(text))) {
    const u = m[0].replace(/[.,;]$/, '');
    if (seen.has(u)) continue;
    seen.add(u);
    out.push(u);
  }
  return out.slice(0, 20);
}

/* Pesquisa completa em paralelo: Wikipédia + Wikimedia Commons + YouTube/Wikidata + Mapas. */
export async function enrichFromWeb(analysis = {}, opts = {}) {
  const { language = 'pt', maxItems = 6, signal, sourceText = '', links = [], sections = [], brief = null } = opts;
  const lang = language === 'en' ? 'en' : 'pt';
  const items = [];
  const images = [];
  const videos = [];
  const errors = [];
  const seenItems = new Set();
  const seenImgs = new Set();
  const seenVids = new Set();

  const pushItem = (item) => {
    if (!item || !item.title) return;
    const key = item.title.toLowerCase();
    if (seenItems.has(key)) return;
    seenItems.add(key);
    items.push(item);
    if (item.image && item.image.url && !seenImgs.has(item.image.url)) {
      seenImgs.add(item.image.url);
      images.push(item.image);
    }
    if (Array.isArray(item.youtubeLinks)) {
      detectVideos(item.youtubeLinks.join(' ')).forEach(pushVideo);
    }
  };

  const pushImage = (img) => {
    if (!img || !img.url || seenImgs.has(img.url)) return;
    seenImgs.add(img.url);
    images.push(img);
  };

  const pushVideo = (v) => {
    if (!v || !v.id || seenVids.has(v.id)) return;
    seenVids.add(v.id);
    videos.push(v);
  };

  // 1. Vídeos explícitos já colados no texto/links
  detectVideos(`${sourceText || ''} ${links.join(' ')}`).forEach(pushVideo);

  // 2. Links de Wikipédia colados pelo docente
  const linkTasks = links.slice(0, 4).map((link) =>
    wikiFromLink(link, signal).then((f) => { if (f) pushItem(f); }).catch((err) => {
      if (err && err.name !== 'AbortError') errors.push(`${clean(link, 40)}: ${err.message}`);
    })
  );

  // 3. Termos centrais do ficheiro + títulos das secções
  const terms = researchTerms(analysis, analysis.title, sections);
  const primaryTerms = terms.slice(0, 6);

  const wikiTasks = primaryTerms.map((term) =>
    wikiSearch(term, lang, signal)
      .then(async (found) => {
        if (found.length) {
          found.forEach(pushItem);
        } else if (lang === 'pt') {
          const enFound = await wikiSearch(term, 'en', signal).catch(() => []);
          enFound.forEach(pushItem);
        }
      })
      .catch((err) => {
        if (err && err.name !== 'AbortError') errors.push(`${term}: ${err.message}`);
      })
  );

  // 4. Imagens e informação aberta de TODA A WEB (Openverse, NASA, DuckDuckGo, OpenAlex + Wikimedia Commons)
  const coherentQs = buildCoherentImageQueries({
    title: analysis.title || '',
    text: sourceText || '',
    sections,
    briefQueries: (brief && brief.imageQueries) || [],
    visualStyle: (brief && brief.visualStyle) || 'auto',
  });
  const imageSearchTerms = coherentQs.length
    ? coherentQs
    : primaryTerms.slice(0, 5).map((t) => ({ query: t, tag: t }));
  const briefLen = (brief && brief.imageQueries && brief.imageQueries.length) || 0;

  const openWebTasks = imageSearchTerms.slice(0, 4).map(({ query, tag }, qIdx) =>
    openWebSearch(query, { kind: 'all', signal })
      .then((res) => {
        (res.images || []).forEach((im) => pushImage({ ...im, tag, fromBrief: qIdx < briefLen }));
        (res.items || []).forEach((it) => pushItem(it));
      })
      .catch(() => {})
  );

  const imageTasks = imageSearchTerms.slice(0, 5).map(({ query, tag }, qIdx) =>
    commonsImageSearch(query, signal, 3)
      .then((imgs) => imgs.forEach((im) => pushImage({ ...im, tag, fromBrief: qIdx < briefLen })))
      .catch((err) => {
        if (err && err.name !== 'AbortError') errors.push(`imagens ${query}: ${err.message}`);
      })
  );

  // 5. Descoberta de vídeos YouTube verificados via Wikidata (P1651)
  const videoTasks = primaryTerms.slice(0, 3).map((term) =>
    wikidataVideos(term, lang, signal)
      .then((vids) => vids.forEach(pushVideo))
      .catch(() => {})
  );

  await Promise.allSettled([...linkTasks, ...wikiTasks, ...openWebTasks, ...imageTasks, ...videoTasks]);

  // 6. Locais reais (quando o ficheiro cita Luanda/Angola ou geografia)
  const places = [];
  const placeSeen = new Set();
  const addPlaces = (rows) => rows.forEach((row) => {
    if (!row || placeSeen.has(row.name.toLowerCase())) return;
    placeSeen.add(row.name.toLowerCase());
    places.push(row);
  });
  const localText = `${sourceText || ''} ${analysis.title || ''}`.toLowerCase();
  if (!signal?.aborted && /luanda|angola|bairro|prov[ií]ncia|munic[ií]pio|distrito|huambo|benguela|cabinda|namibe|malanje/.test(localText)) {
    const city = /luanda/.test(localText) ? 'Luanda' : 'Angola';
    await Promise.allSettled([
      wikiCategoryPlaces(`Bairros de ${city}`, lang, signal).then(addPlaces),
      searchPlaces(`${city}, Angola`, { signal, limit: 3 }).then(addPlaces),
    ]);
  }

  // 7. Links directos de vídeo-aula no YouTube por tópico (para reforço imediato quando não há embed P1651)
  const searchVideos = primaryTerms.slice(0, 3).map((term) => ({
    kind: 'video-search',
    term,
    title: `Aulas em vídeo: ${term}`,
    text: `Pesquisa directa de aulas explicativas sobre «${term}» no YouTube.`,
    url: `https://www.youtube.com/results?search_query=${encodeURIComponent(`${term} aula explicação português`)}`,
    source: 'YouTube · Pesquisa Educativa',
  }));

  return finish(items, images, errors, videos, searchVideos, places, lang, maxItems);
}

function finish(items, images, errors, videos, searchVideos, places, lang, maxItems) {
  const content = items.slice(0, Math.max(8, maxItems));
  const imgList = images.slice(0, 14);
  const mapPlaces = places.slice(0, 6);
  const ok = content.length > 0 || imgList.length > 0 || videos.length > 0 || mapPlaces.length > 0;
  return {
    ok,
    offline: !ok,
    items: content,
    images: imgList,
    videos,
    searchVideos,
    places: mapPlaces,
    errors,
    language: lang,
    note: ok
      ? `Fusão web concluída: ${content.length} artigo(s) Wikipédia, ${imgList.length} imagem(ns)/diagrama(s), ${videos.length} vídeo(s) embebido(s)${mapPlaces.length ? ` e ${mapPlaces.length} mapa(s)` : ''} integrados directamente nos slides.`
      : 'Sem ligação: a aula foi sintetizada localmente com diagramas visuais e cenas 3D.',
  };
}

export function imageProxySrc(url) {
  return String(url || '');
}
