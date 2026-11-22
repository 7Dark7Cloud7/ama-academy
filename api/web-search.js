// CEU Academy / AMA — Multi-Source Open Educational Web Search & Image Aggregator (/api/web-search)
// Fontes reais abertas verificadas (HTTP 200, zero API keys obrigatórias):
//   Imagens: Flickr Public Photos Feed (toda a web), NASA Image Library, Wikimedia Commons
//   Informação & Referências: Crossref Académico, OpenAlex, OpenLibrary, DuckDuckGo Web

const clean = (v, max = 280) => String(v || '').replace(/\s+/g, ' ').trim().slice(0, max);

async function safeJson(url, ms = 8500) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), ms);
  try {
    const r = await fetch(url, {
      signal: ctrl.signal,
      headers: {
        Accept: 'application/json',
        'User-Agent': 'CEUAcademy/1.0 (https://ceu-academy.com; mailto:geral@ceu.ao)',
      },
    });
    if (!r.ok) return null;
    const text = await r.text();
    // Flickr public feed occasionally escapes single quotes as \' which breaks strict JSON.parse
    const fixed = text.replace(/\\'/g, "'");
    return JSON.parse(fixed);
  } catch {
    return null;
  } finally {
    clearTimeout(t);
  }
}

async function fetchFlickrImages(q, limit = 6) {
  const tags = String(q || '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]+/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length >= 3 && !/^(the|and|for|with|from|photo|image|diagram)$/.test(w))
    .slice(0, 3)
    .join(',');
  if (!tags) return [];
  const url = `https://www.flickr.com/services/feeds/photos_public.gne?format=json&nojsoncallback=1&tagmode=all&tags=${encodeURIComponent(tags)}`;
  let data = await safeJson(url, 8000);
  let items = Array.isArray(data?.items) ? data.items : [];
  if (!items.length && tags.includes(',')) {
    const fallbackUrl = `https://www.flickr.com/services/feeds/photos_public.gne?format=json&nojsoncallback=1&tagmode=any&tags=${encodeURIComponent(tags)}`;
    data = await safeJson(fallbackUrl, 7500);
    items = Array.isArray(data?.items) ? data.items : [];
  }
  return items
    .filter((it) => it && it.media && it.media.m)
    .slice(0, limit)
    .map((it) => {
      const hiRes = String(it.media.m).replace(/_m\.([a-z]+)$/i, '_b.$1');
      const author = clean(String(it.author || 'Flickr').replace(/^nobody@flickr\.com\s*\("?|"?\)$/g, ''), 42);
      return {
        url: hiRes,
        alt: clean(it.title || q, 110),
        title: clean(it.title || q, 72),
        credit: `Flickr Web · ${author || 'Comunidade'}`,
        page: String(it.link || 'https://www.flickr.com/'),
        source: 'Flickr',
        term: q,
        isDiagram: false,
      };
    });
}

async function fetchNasaImages(q, limit = 4) {
  if (!/rocket|space|physics|force|earth|energy|planet|solar|orbit|forest|climate|satellite|motion|tech|science|foguet|f[ií]sic|planeta|energia|nature/i.test(q)) {
    return [];
  }
  const url = `https://images-api.nasa.gov/search?q=${encodeURIComponent(q)}&media_type=image&page_size=${limit}`;
  const data = await safeJson(url, 8000);
  const items = Array.isArray(data?.collection?.items) ? data.collection.items : [];
  const out = [];
  for (const it of items.slice(0, limit)) {
    const link = (it.links || []).find((l) => l.href && /image/i.test(l.render || 'image'));
    const meta = (it.data || [])[0] || {};
    if (!link) continue;
    out.push({
      url: String(link.href),
      alt: clean(meta.title || q, 110),
      title: clean(meta.title || q, 72),
      credit: `NASA Image Library · ${clean(meta.center || 'NASA', 30)}`,
      page: meta.nasa_id ? `https://images.nasa.gov/details/${encodeURIComponent(meta.nasa_id)}` : 'https://images.nasa.gov/',
      source: 'NASA',
      term: q,
      isDiagram: false,
    });
  }
  return out;
}

async function fetchCrossrefInfo(q) {
  const url = `https://api.crossref.org/works?query=${encodeURIComponent(q)}&rows=2&select=title,author,published-print,container-title,URL`;
  const data = await safeJson(url, 7500);
  const items = Array.isArray(data?.message?.items) ? data.message.items : [];
  return items
    .filter((w) => Array.isArray(w.title) && w.title[0])
    .map((w) => {
      const title = clean(w.title[0], 92);
      const journal = clean((w['container-title'] && w['container-title'][0]) || 'Publicação Académica', 40);
      const yr = w['published-print']?.['date-parts']?.[0]?.[0] || '';
      return {
        kind: 'insight',
        term: q,
        title,
        text: clean(`Referência científica (${journal}${yr ? ', ' + yr : ''}): ${title}.`, 260),
        sentences: [clean(`Artigo académico publicado em ${journal}${yr ? ' (' + yr + ')' : ''}: ${title}.`, 200)],
        source: `Crossref · ${journal}`,
        url: String(w.URL || 'https://www.crossref.org/'),
        image: null,
      };
    });
}

async function fetchOpenLibraryInfo(q) {
  const url = `https://openlibrary.org/search.json?q=${encodeURIComponent(q)}&limit=2&fields=title,author_name,first_publish_year,key`;
  const data = await safeJson(url, 7500);
  const docs = Array.isArray(data?.docs) ? data.docs : [];
  return docs
    .filter((d) => d && d.title)
    .map((d) => {
      const author = (d.author_name && d.author_name[0]) || 'Autor académico';
      const title = clean(d.title, 86);
      return {
        kind: 'insight',
        term: q,
        title,
        text: clean(`Livro de referência (${clean(author, 40)}${d.first_publish_year ? ', ' + d.first_publish_year : ''}): «${title}».`, 240),
        sentences: [clean(`Obra recomendada para aprofundar o tema: «${title}» por ${clean(author, 40)}.`, 190)],
        source: 'OpenLibrary · Livros',
        url: d.key ? `https://openlibrary.org${d.key}` : 'https://openlibrary.org/',
        image: null,
      };
    });
}

async function fetchDuckDuckGoInfo(q) {
  const url = `https://api.duckduckgo.com/?q=${encodeURIComponent(q)}&format=json&no_html=1&skip_disambig=1`;
  const data = await safeJson(url, 6500);
  if (!data) return [];
  const out = [];
  if (data.AbstractText && data.AbstractText.length > 35) {
    out.push({
      kind: 'insight',
      term: q,
      title: clean(data.Heading || q, 80),
      text: clean(data.AbstractText, 420),
      sentences: String(data.AbstractText).split(/(?<=[.!?])\s+/).map((s) => clean(s, 200)).filter((s) => s.length >= 24).slice(0, 3),
      source: clean(data.AbstractSource || 'Web Educativa', 40),
      url: String(data.AbstractURL || `https://duckduckgo.com/?q=${encodeURIComponent(q)}`),
      image: null,
    });
  }
  return out;
}

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'public, max-age=300');
  const q = clean((req.query && req.query.q) || '', 90);
  const kind = String((req.query && req.query.kind) || 'all');
  if (!q || q.length < 2) {
    return res.status(400).json({ ok: false, error: 'Parâmetro q obrigatório.' });
  }
  try {
    const [nasaImgs, flickrImgs, crInfo, olInfo, ddgInfo] = await Promise.all([
      kind === 'info' ? [] : fetchNasaImages(q, 4),
      kind === 'info' ? [] : fetchFlickrImages(q, 5),
      kind === 'images' ? [] : fetchCrossrefInfo(q),
      kind === 'images' ? [] : fetchOpenLibraryInfo(q),
      kind === 'images' ? [] : fetchDuckDuckGoInfo(q),
    ]);
    return res.status(200).json({
      ok: true,
      query: q,
      sources: ['NASA', 'Flickr Web', 'Crossref', 'OpenLibrary', 'DuckDuckGo'],
      images: [...nasaImgs, ...flickrImgs].slice(0, 8),
      items: [...ddgInfo, ...crInfo, ...olInfo].slice(0, 5),
    });
  } catch (err) {
    return res.status(500).json({ ok: false, error: err && err.message ? err.message : 'Erro na pesquisa web.' });
  }
}
