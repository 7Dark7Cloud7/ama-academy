/* Kuzaya AI · Slide Studio — intake, geração, player, edição e exportação.
   Tudo local: nenhum ficheiro é enviado para um servidor. O motor é determinístico
   e a fonte continua a ser a verdade — sugestões aparecem sempre sinalizadas. */
(function () {
  'use strict';

  const KEY = 'ama-slide-studio-v1';
  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const escAttr = esc;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];

  const S = {
    deck: null, pending: null, shown: 0, timer: null,
    source: { text: '', filename: '', pages: [], headings: [], truncated: false, warnings: [] },
    brief: null, index: 0, reveal: 0, notesOpen: false, thumbsOpen: true,
    editing: false, warningsOpen: false, status: '', busy: false,
    activeId: '', store: null,
    /* v1.1 — investigação web OPCIONAL. Nada é pedido sem o docente activar. */
    web: { enabled: true, images: true, busy: false, status: '', controller: null, result: null, links: '' },
  };

  function engine() {
    return (window.Study && window.Study.SlideStudio) || null;
  }
  function waitForEngine(cb) {
    const e = engine();
    if (e) return cb(e);
    const onReady = () => { window.removeEventListener('study-ready', onReady); cb(engine()); };
    window.addEventListener('study-ready', onReady);
  }
  function store() {
    if (S.store) return S.store;
    try { S.store = JSON.parse(localStorage.getItem(KEY) || '{}'); } catch { S.store = {}; }
    S.store.decks = S.store.decks || {};
    return S.store;
  }
  function persist() {
    try { localStorage.setItem(KEY, JSON.stringify(store())); } catch { if (window.toast) toast('Sem espaço para guardar esta versão. Exporte o deck.'); }
  }
  function saveVersion(deck) {
    const st = store();
    const id = S.activeId || `ss-${Date.now().toString(36)}`;
    S.activeId = id;
    st.decks[id] = st.decks[id] || { id, title: deck.title, versions: [] };
    st.decks[id].title = deck.title;
    st.decks[id].course = (typeof courseName === 'function' ? courseName() : '');
    st.decks[id].owner = ((window.AMAState && window.AMAState.user && window.AMAState.user.nome) || '');
    st.decks[id].updatedAt = new Date().toISOString();
    const versions = st.decks[id].versions || [];
    versions.push(JSON.parse(JSON.stringify(deck)));
    st.decks[id].versions = versions.slice(-8);
    persist();
  }
  function courseName() {
    const el = $('#ss-course');
    return el ? el.value.trim() : '';
  }
  function undo() {
    const v = store().decks[S.activeId];
    if (!v || v.versions.length < 2) return toast('Não há uma versão anterior para restaurar.');
    v.versions.pop();
    S.deck = v.versions[v.versions.length - 1];
    S.index = Math.min(S.index, S.deck.slides.length - 1);
    persist(); render(); toast('Voltou à versão anterior.');
  }
  function deleteDeck() {
    if (!S.activeId) return;
    const st = store();
    if (!window.confirm('Apagar este deck e todas as versões guardadas neste navegador?')) return;
    delete st.decks[S.activeId];
    S.activeId = ''; S.deck = null; S.index = 0;
    persist(); render(); toast('Deck apagado deste navegador.');
  }

  /* ------------------------------------------------------------------ */
  /* Importação                                                         */
  /* ------------------------------------------------------------------ */

  function setStatus(msg) {
    S.status = msg;
    const el = $('#ss-status');
    if (el) el.textContent = msg;
  }

  async function handleFiles(files) {
    const list = [...(files || [])];
    if (!list.length) return;
    const fi = await import('./engine/file-import.js?v=4');
    const office = await import('./engine/office-import.js?v=1');
    const chunks = [];
    const pages = [];
    const headings = [];
    let truncated = false;
    for (const file of list) {
      setStatus(`A ler ${file.name}…`);
      try {
        let r;
        const kind = fi.fileKind(file);
        if (/\.(docx|pptx)$/i.test(file.name)) {
          r = await office.extractOfficeText(file);
          if (!r.ok) throw new Error(
            r.code === 'office-unsupported'
              ? 'Este navegador não lê DOCX/PPTX directamente. Exporte o ficheiro a PDF ou texto e tente outra vez.'
              : (r.code === 'size' ? 'Ficheiro acima de 20 MB.' : 'Não foi possível ler este ficheiro Word/PowerPoint.'));
        } else if (/\.(txt|md)$/i.test(file.name)) {
          const text = await file.text();
          r = { ok: true, text, pages: [{ page: 1, text }], filename: file.name, method: 'text' };
        } else if (kind) {
          r = await fi.extractFileText(file);
        } else {
          throw new Error('Formato não suportado. Use PDF, imagem, TXT, MD, DOCX ou PPTX.');
        }
        if (!r.ok || !r.text) throw new Error(fi.importErrorMessage(r.code || 'no-text', 'pt'));
        chunks.push(r.text);
        // O leitor de PDF devolve `pages` como contagem e `pageTexts` como array;
        // os outros leitores devolvem `pages` como array. Normalizar aqui evita
        // perder as páginas (e, com elas, os cabeçalhos e a numeração das fontes).
        const pageList = Array.isArray(r.pages) ? r.pages : (r.pageTexts || []);
        pages.push(...pageList);
        headings.push(...(r.headings || []));
        truncated = truncated || !!r.truncated;
        if (r.title && !chunks.title) chunks.title = r.title;
      } catch (err) {
        setStatus(`Erro em ${file.name}: ${err.message}`);
        toast(`Não foi possível ler ${file.name}.`);
      }
    }
    if (!chunks.length) return;
    const text = chunks.join('\n\n').slice(0, 20000);
    const names = list.map((f) => f.name).join(' + ');
    const ti = $('#ss-source-title');
    // Um título escrito pelo docente é sagrado; um título apenas inferido de um
    // ficheiro anterior pode (e deve) ser substituído pelo ficheiro novo.
    const replaceTitle = !S.source.text || !ti || !ti.value.trim()
      || S.source.autoTitle || ti.value.trim() === S.source.filename;
    S.source = {
      text, pages, headings, truncated, filename: names, autoTitle: replaceTitle,
      warnings: truncated ? ['Nem todas as páginas foram lidas — o limite é 30 páginas/20 000 caracteres.'] : [],
    };
    const prev = $('#ss-extract');
    if (prev) prev.value = text;
    if (replaceTitle && ti) {
      const inferred = chunks.title || fi.inferImportTitle({ filename: list[0].name, text, headingCandidates: headings.map((h) => (typeof h === 'string' ? h : h.text)) });
      ti.value = inferred || names.replace(/\.[^.]+$/g, '');
      S.source.autoTitle = true;
    }
    setStatus(`${list.length} ficheiro(s) lido(s) localmente · ${text.length} caracteres.`);
    render();
  }

  function usePaste() {
    const text = ($('#ss-paste')?.value || '').trim();
    if (!text) return toast('Cole o texto da aula primeiro.');
    S.source = { ...S.source, text: text.slice(0, 20000), filename: $('#ss-source-title')?.value.trim() || 'Texto colado', pages: [{ page: 1, text }], headings: [], warnings: [] };
    setStatus(`${text.length} caracteres prontos.`);
    render();
  }

  function readWebOpts() {
    const links = $('#ss-web-links');
    if (links) S.web.links = links.value;
  }
  function readBrief() {
    readWebOpts();
    const e = engine();
    const base = e ? e.defaultBrief() : {
      language: 'auto', level: 'universitário · intermédio', durationMin: 50, slideCount: 20,
      playfulness: 'balanced', use3d: 'auto', palette: 'auto', speakerNotes: true,
    };
    const val = (id, fallback) => { const el = $(`#${id}`); return el ? el.value : fallback; };
    return {
      ...base,
      language: val('ss-lang', base.language),
      level: val('ss-level', base.level) || base.level,
      durationMin: clampNum(val('ss-duration', 50), 10, 180, 50),
      slideCount: clampNum(val('ss-count', 20), 6, 40, 20),
      playfulness: val('ss-play', base.playfulness),
      use3d: val('ss-3d', base.use3d),
      palette: val('ss-palette', base.palette),
      speakerNotes: $('#ss-notes') ? $('#ss-notes').checked : true,
      scope: val('ss-scope', ''),
    };
  }
  function clampNum(v, lo, hi, fallback) {
    const n = Number(v);
    return Number.isFinite(n) ? Math.max(lo, Math.min(hi, Math.round(n))) : fallback;
  }

  function generate(sample = false) {
    const e = engine();
    if (!e) return setStatus('O motor ainda está a carregar. Tente dentro de um segundo.');
    if (sample) {
      S.deck = e.sampleDeck();
      S.activeId = `sample-${Date.now().toString(36)}`;
      saveVersion(S.deck);
      S.index = 0; S.notesOpen = false; S.shown = S.deck.slides.length;
      render(); toast('Amostra carregada — todos os tipos de slide.');
      return;
    }
    if (S.source.text.trim().length < 30) return toast('Adicione um ficheiro ou cole o texto da aula.');
    S.brief = readBrief();
    setStatus('A planear a aula e a gerar slides localmente…');
    const deck = e.generateDeck({
      text: S.source.text, filename: S.source.filename, pages: S.source.pages,
      headings: S.source.headings, truncated: S.source.truncated,
      title: $('#ss-source-title')?.value.trim() || '',
    }, S.brief);
    deck.sourceText = S.source.text.slice(0, 4000);
    S.pending = deck;
    S.deck = null;
    S.shown = 0;
    S.index = 0;
    S.busy = true;
    render();
    clearInterval(S.timer);
    S.timer = setInterval(() => {
      if (!S.pending) { clearInterval(S.timer); return; }
      S.shown = Math.min(S.pending.slides.length, S.shown + 2);
      render();
      if (S.shown >= S.pending.slides.length) {
        clearInterval(S.timer);
        S.busy = false;
        S.deck = S.pending;
        S.pending = null;
        S.activeId = `ss-${Date.now().toString(36)}`;
        saveVersion(S.deck);
        render();
        setStatus(`${S.deck.slides.length} slides gerados a partir da fonte.`);
        toast('Deck pronto. Verifique os avisos antes de apresentar.');
        enrichAfterGenerate();
      }
    }, 150);
  }
  function stopGeneration() {
    clearInterval(S.timer);
    S.busy = false;
    S.deck = S.pending || S.deck;
    S.pending = null;
    if (S.deck) { S.activeId = S.activeId || `ss-${Date.now().toString(36)}`; saveVersion(S.deck); }
    render();
    toast('Geração parada. O que já estava pronto foi guardado.');
  }

  /* ------------------------------------------------------------------ */
  /* Investigação web opcional (v1.1)                                   */
  /* ------------------------------------------------------------------ */

  function webOpt() {
    readWebOpts();
    render();
  }

  /* A web nunca substitui o ficheiro: só junta slides marcados EXTERNO,
     ligados à página de origem. Se falhar, o deck permanece exactamente
     como estava — nenhuma informação externa entra no quiz ou nas notas. */
  async function enrichDeck() {
    const e = engine();
    const web = window.Study && window.Study.SlideStudioWeb;
    readWebOpts();
    if (!e || !web || typeof web.enrichFromWeb !== 'function') {
      S.web.status = 'A camada de investigação ainda está a carregar. Tente dentro de um segundo.';
      render();
      return;
    }
    if (!S.deck || S.pending) return toast('Gere e conclua um deck antes de enriquecer.');
    if (S.web.busy) return;

    const before = S.deck;
    S.web.busy = true;
    S.web.status = 'A procurar termos do ficheiro na Wikipédia…';
    S.web.controller = new AbortController();
    render();

    const lang = S.deck.language === 'en' ? 'en' : 'pt';
    try {
      const sourceText = before.sourceText || S.source.text || '';
      const result = await web.enrichFromWeb(S.deck.analysis || {}, {
        language: lang,
        maxItems: 4,
        signal: S.web.controller.signal,
        sourceText,
        links: web.collectLinks(S.web.links, sourceText),
      });
      S.web.result = result;
      if (result && result.ok && (result.items.length || result.videos.length || result.places.length)) {
        S.deck = e.fuseEnrichment(before, result, { images: S.web.images, maxItems: 4 });
        S.index = Math.min(S.index, S.deck.slides.length - 1);
        saveVersion(S.deck);
        S.web.status = (result.note || 'Informação da web junta ao ficheiro.') + ' Verifique as origens antes de apresentar.';
        toast('Web fundida nos slides. Confirme as origens antes de leccionar.');
      } else {
        S.web.status = (result && result.note) || 'Não foi possível consultar a web. O deck mantém-se apenas com o ficheiro.';
        toast('Sem ligação — o deck mantém-se local.');
      }
    } catch (err) {
      S.web.status = `Pesquisa interrompida: ${err && err.message ? err.message : 'falha de ligação'}. O deck mantém-se como estava.`;
      toast('Pesquisa falhou; nada foi alterado no deck.');
    }
    S.web.busy = false;
    S.web.controller = null;
    render();
  }

  function stopEnrich() {
    if (S.web.controller) S.web.controller.abort();
    S.web.busy = false;
    S.web.controller = null;
    S.web.status = 'Pesquisa parada. O deck mantém-se como estava.';
    render();
  }

  /* Chamado quando o docente activou «procurar na web» no breve. */
  function enrichAfterGenerate() {
    if (!S.web.enabled) return;
    enrichDeck();
  }

  /* ------------------------------------------------------------------ */
  /* Player                                                             */
  /* ------------------------------------------------------------------ */

  function goTo(i, resetReveal = true) {
    if (!S.deck) return;
    S.index = Math.max(0, Math.min(S.deck.slides.length - 1, i));
    if (resetReveal) S.reveal = 0;
    render();
  }
  function next() {
    if (!S.deck) return;
    const steps = $$('.ss-stage [data-step]').filter((el) => !el.hidden).length;
    const total = $$('.ss-stage [data-step]').length;
    if (S.reveal < total - 1 && steps < total) {
      S.reveal += 1;
      applyReveal();
    } else goTo(S.index + 1);
  }
  function prev() { goTo(S.index - 1); }
  function applyReveal() {
    const nodes = $$('.ss-stage [data-step]');
    nodes.forEach((el) => { el.hidden = Number(el.dataset.step) > S.reveal; });
    const badge = $('#ss-reveal-badge');
    if (badge) badge.textContent = `${S.reveal + 1}/${nodes.length || 1}`;
    const n = $('.ss-stage .ss-slide');
    if (n) n.classList.toggle('ss-revealing', nodes.length > 1);
  }

  /* ------------------------------------------------------------------ */
  /* Exportação                                                         */
  /* ------------------------------------------------------------------ */

  function download(name, text, mime) {
    const blob = new Blob([text], { type: mime || 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = name; document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 2000);
  }
  function exportOffline() {
    if (!S.deck) return;
    const e = engine();
    download(`${slug(S.deck.title)}-offline.html`, e.standaloneHtml(S.deck), 'text/html;charset=utf-8');
    toast('Player offline descarregado — funciona sem internet.');
  }
  function exportJson() {
    if (!S.deck) return;
    download(`${slug(S.deck.title)}-deck.json`, JSON.stringify(S.deck, null, 2), 'application/json');
  }
  function exportPrint() {
    if (!S.deck) return;
    const e = engine();
    const w = window.open('', '_blank');
    if (!w) return toast('O navegador bloqueou a janela de impressão.');
    const pal = e.PALETTES[S.deck.palette] || e.PALETTES.ama;
    const html = `<!doctype html><html><head><meta charset="utf-8"><title>${esc(S.deck.title)}</title><style>
    @page{size:A4 landscape;margin:12mm}*{box-sizing:border-box}body{font:14px/1.45 system-ui;margin:0;color:#12221c}
    .p{page-break-after:always;height:170mm;border:1px solid #ccd6cf;border-radius:10px;padding:14px 18px;position:relative;background:#fff}
    .p h2{font-size:26px;margin:8px 0 14px;color:#15704c}.p .body{font-size:16px}.p ul{padding-left:20px}.p li{margin:6px 0}
    .hd,.ft{display:flex;justify-content:space-between;font:700 10px ui-monospace;color:#5c6f62;text-transform:uppercase;letter-spacing:.08em}
    .ft{position:absolute;left:18px;right:18px;bottom:10px;border-top:1px solid #e1e8e2;padding-top:6px;text-transform:none}
    .notes{margin-top:14px;border-top:1px dashed #ccd6cf;padding-top:8px;font-size:11px;color:#485b50}
    .big{font-size:34px;font-weight:800}.formula{font:800 30px ui-monospace;color:#15704c}.banner{background:${pal.bg};color:${pal.text};padding:8px 14px;border-radius:8px}
    .ss-webcard{display:grid;grid-template-columns:1fr 1fr;gap:10px}.ss-web-side{border:1px solid #ccd6cf;border-radius:6px;padding:10px;font-size:14px}.ss-web-local{border-left:3px solid #1f7a8c}.ss-web-external{border-left:3px solid #15704c;background:#f6f9f7}.ss-web-tag{display:block;font:800 10px ui-monospace;color:#5c6f62;margin-bottom:5px}.ss-web-tag-ext{color:#15704c}.ss-web-thumb{max-width:100%;max-height:110px;object-fit:cover;border-radius:4px;margin-top:8px}.ss-web-link{font-size:11px;color:#15704c}
    .ss-spotlight{display:grid;grid-template-columns:1.2fr 1fr;gap:14px;align-items:center}.ss-spot-figure{margin:0;border:1px solid #ccd6cf;border-radius:6px;overflow:hidden}.ss-spot-figure img{width:100%;max-height:130px;object-fit:cover}.ss-caption{font-weight:700;margin:0 0 8px}.ss-credit{font-size:11px;color:#5c6f62;overflow-wrap:anywhere}
    .ss-ad-flow{display:flex;flex-wrap:wrap;gap:6px;align-items:center}.ss-ad-node{border:1px solid #ccd6cf;border-radius:5px;padding:6px 8px;font-weight:700}.ss-ad-link{width:16px;color:#15704c}
    </style></head><body>${S.deck.slides.map((s, i) => `<section class="p"><div class="hd"><span>KUZAYA AI · SLIDE STUDIO · AMA</span><span>${esc(s.type)} · ${s.min} min${s.external ? ' · EXTERNO' : ''}</span></div>
    <h2>${esc(s.title)}</h2><div class="body">${e.slideBody(s, S.deck, {}).replace(/<button[^>]*>/g, '<span>').replace(/<\/button>/g, '</span>').replace(/<[^>]*hidden[^>]*>/g, '')}</div>
    ${s.notes ? `<div class="notes"><b>Notas do docente:</b> ${esc(s.notes)}</div>` : ''}
    <div class="ft"><span>Fonte: ${esc(s.source?.anchor || S.deck.sourceName)}${s.external && s.sourceUrl ? ` · EXTERNO: ${esc(s.sourceUrl)}` : ''}</span><span>AMA · ${String(i + 1).padStart(2, '0')} / ${S.deck.slides.length}</span></div></section>`).join('')}
    <section class="p"><h2>Guia do docente</h2><p>${esc(S.deck.title)} · ${S.deck.stats.slides} slides · ~${S.deck.stats.durationMin} min · ${esc(S.deck.language)}</p>
    <h3>Plano</h3><ol>${S.deck.blueprint.map((b) => `<li><b>${esc(b.title)}</b> — ${esc(b.type)} · ${b.min} min · ${esc(b.purpose)}</li>`).join('')}</ol>
    <h3>Suposições e verificações</h3><ul>${[...S.deck.assumptions, ...S.deck.flags].map((f) => `<li>${esc(f)}</li>`).join('')}</ul></section>
    </body></html>`;
    w.document.write(html); w.document.close();
    setTimeout(() => w.print(), 500);
  }
  function publishToClass() {
    if (!S.deck) return;
    const text = [S.deck.title, S.deck.analysis?.centralIdea, ...S.deck.slides.slice(0, 8).map((s) => `${s.title}. ${s.notes}`)]
      .filter(Boolean).join('\n').slice(0, 6000);
    if (text.length < 60) return toast('Não há conteúdo suficiente para publicar.');
    try {
      sessionStorage.setItem('ama-uni-deck-prefill', JSON.stringify({
        title: S.deck.title, text, sourceName: `Slide Studio · ${S.deck.sourceName}`,
        deckId: S.activeId, studio: true,
      }));
    } catch { }
    go('/turmas');
    toast('Escolha a turma para publicar a matéria local.');
  }
  const slug = (s) => String(s || 'deck').toLowerCase().replace(/[^a-z0-9]+/gi, '-').replace(/^-|-$/g, '').slice(0, 50) || 'deck';

  /* ------------------------------------------------------------------ */
  /* Edição                                                             */
  /* ------------------------------------------------------------------ */

  const EDIT_KEYS = {
    concept: ['statement', 'support'], bullets: ['bullets'], definition: ['term', 'definition', 'example'],
    process: ['steps'], 'worked-example': ['problem', 'steps', 'answer', 'units'],
    formula: ['equation', 'legend', 'applies'], diagram: ['parts', 'alt'],
    'data-chart': ['message', 'data', 'sourceLine'], compare: ['leftLabel', 'rightLabel', 'rows', 'difference'],
    timeline: ['events'], 'case-study': ['situation', 'decision', 'result', 'lesson'], quote: ['text', 'attribution'],
    summary: ['takeaways'], 'next-steps': ['items'], break: ['prompt'],
    hook: ['prompt'], objectives: ['items'], title: ['subtitle', 'course'],
    'scene-3d': ['goal', 'parts', 'task', 'fallback'], quiz: ['question', 'options', 'answer', 'explanation'],
    match: ['pairs'], sort: ['categories', 'items'], 'flip-cards': ['cards'], poll: ['question', 'options'],
    'think-first': ['prompt', 'seconds', 'reveal'],
  };
  function editPanel(slide) {
    const keys = EDIT_KEYS[slide.type] || [];
    const field = (key) => {
      const v = slide[key];
      const label = key.replace(/-/g, ' ');
      if (Array.isArray(v) && v.length && typeof v[0] === 'object') {
        return `<label class="ss-field"><span>${esc(label)} (JSON)</span><textarea rows="4" data-edit-key="${escAttr(key)}" data-json="1">${esc(JSON.stringify(v, null, 1))}</textarea></label>`;
      }
      if (Array.isArray(v)) {
        return `<label class="ss-field"><span>${esc(label)} (uma por linha)</span><textarea rows="3" data-edit-key="${escAttr(key)}" data-list="1">${esc(v.map((x) => (typeof x === 'object' ? x.text || x.label || '' : x)).join('\n'))}</textarea></label>`;
      }
      if (typeof v === 'number') return `<label class="ss-field"><span>${esc(label)}</span><input type="number" data-edit-key="${escAttr(key)}" data-num="1" value="${esc(v)}"></label>`;
      return `<label class="ss-field"><span>${esc(label)}</span><textarea rows="2" data-edit-key="${escAttr(key)}">${esc(v || '')}</textarea></label>`;
    };
    return `<div class="ss-edit">
      <h3>Editar slide ${S.index + 1}</h3>
      <label class="ss-field"><span>Título (afirmação)</span><textarea rows="2" data-edit-key="title">${esc(slide.title)}</textarea></label>
      ${keys.map(field).join('')}
      <label class="ss-field"><span>Notas do docente (60–120 palavras)</span><textarea rows="6" data-edit-key="notes">${esc(slide.notes)}</textarea></label>
      <div class="ss-edit-actions"><button class="btn btn-p btn-sm" onclick="AMASlideStudio.applyEdit()">Guardar alterações</button>
      <input id="ss-rework-instruction" placeholder="Ex.: tornar este slide um quiz" aria-label="Pedido de rework">
      <button class="btn btn-o btn-sm" onclick="AMASlideStudio.rework()">Rework Kuzaya</button></div>
    </div>`;
  }
  function applyEdit() {
    if (!S.deck) return;
    const sl = { ...S.deck.slides[S.index] };
    $$('.ss-edit [data-edit-key]').forEach((el) => {
      const key = el.dataset.editKey;
      try {
        if (el.dataset.json) sl[key] = JSON.parse(el.value);
        else if (el.dataset.list) sl[key] = el.value.split('\n').map((x) => x.trim()).filter(Boolean);
        else if (el.dataset.num) sl[key] = Number(el.value) || 0;
        else sl[key] = el.value.trim();
      } catch { toast(`Não foi possível interpretar «${key}». Verifique o formato.`); }
    });
    const slides = S.deck.slides.slice();
    slides[S.index] = sl;
    S.deck = { ...S.deck, slides, validation: { errors: [], warnings: engine() ? engine().qualityCheck(S.deck) : [] } };
    saveVersion(S.deck); render(); toast('Alterações guardadas como nova versão.');
  }
  function rework() {
    const cmd = $('#ss-rework-instruction')?.value.trim();
    if (!cmd) return toast('Escreva o que quer mudar neste slide.');
    const e = engine();
    S.deck = e.reworkSlide(S.deck, S.index, cmd);
    saveVersion(S.deck); render(); toast('Slide reworked. Confirme o resultado.');
  }
  function move(i, delta) {
    if (!S.deck) return;
    const j = i + delta;
    if (j < 0 || j >= S.deck.slides.length) return;
    const slides = S.deck.slides.slice();
    [slides[i], slides[j]] = [slides[j], slides[i]];
    S.deck = { ...S.deck, slides };
    S.index = j; saveVersion(S.deck); render();
  }
  function removeSlide(i) {
    if (!S.deck || S.deck.slides.length <= 4) return toast('Um deck precisa de pelo menos quatro slides.');
    const slides = S.deck.slides.slice();
    slides.splice(i, 1);
    S.deck = { ...S.deck, slides, stats: { ...S.deck.stats, slides: slides.length } };
    S.index = Math.min(S.index, slides.length - 1);
    saveVersion(S.deck); render();
  }
  function setPalette(value) {
    if (!S.deck) return;
    S.deck = { ...S.deck, palette: value };
    saveVersion(S.deck); render();
  }

  /* ------------------------------------------------------------------ */
  /* Interface                                                          */
  /* ------------------------------------------------------------------ */

  function intakeView(e) {
    const b = S.brief || (e ? e.defaultBrief() : { language: 'auto', level: '', durationMin: 50, slideCount: 20, playfulness: 'balanced', use3d: 'auto', palette: 'auto', speakerNotes: true });
    const palettes = e ? e.PALETTES : {};
    const opts = (list, cur) => list.map(([v, l]) => `<option value="${escAttr(v)}" ${v === cur ? 'selected' : ''}>${esc(l)}</option>`).join('');
    return `<div class="ss-intake">
      <div class="ss-topline"><div><span class="eyebrow-t">KUZAYA AI · SLIDE STUDIO</span>
        <h1>De ficheiro a aula: deck pronto a leccionar</h1>
        <p>Traga o material, confirme o breve e deixe a Kuzaya AI planear a aula. Tudo fica neste navegador.</p></div></div>
      <div class="ss-intake-grid">
        <section class="ss-card">
          <h2>1. Material de aula</h2>
          <label class="ss-drop" id="ss-drop">
            <input type="file" id="ss-file" multiple accept=".pdf,.txt,.md,.png,.jpg,.jpeg,.webp,.docx,.pptx" onchange="AMASlideStudio.files(this.files)">
            <b>Arraste ficheiros para aqui ou escolha no dispositivo</b>
            <span>PDF, imagem, TXT, MD, DOCX, PPTX · até 20 MB cada · processamento local</span>
          </label>
          <p class="ss-hint" id="ss-status" role="status">${esc(S.status || 'Nenhum ficheiro carregado.')}</p>
          <label class="ss-field"><span>Título da aula (opcional)</span><input id="ss-source-title" maxlength="90" placeholder="Ex.: Energia solar em Angola"></label>
          <label class="ss-field"><span>Ou cole o texto da aula</span><textarea id="ss-paste" rows="5" placeholder="Cole aqui as notas, o enunciado ou o texto do ficheiro…"></textarea></label>
          <div class="ss-row"><button class="btn btn-o btn-sm" onclick="AMASlideStudio.paste()">Usar texto colado</button>
          <button class="btn btn-ghost btn-sm" onclick="AMASlideStudio.sample()">Carregar amostra (todos os tipos)</button></div>
          ${S.source.text ? `<details class="ss-extract"><summary>Texto extraído (${S.source.text.length} caracteres) — confirme antes de gerar</summary><textarea id="ss-extract" rows="9" onchange="AMASlideStudio.editExtract()">${esc(S.source.text)}</textarea></details>` : ''}
          ${S.source.warnings.map((w) => `<p class="ss-flag">${esc(w)}</p>`).join('')}
        </section>
        <section class="ss-card">
          <h2>2. Breve da aula</h2>
          <div class="ss-form-grid">
            <label class="ss-field"><span>Idioma</span><select id="ss-lang">${opts([['auto', 'Mesmo da fonte'], ['pt', 'Português'], ['en', 'English']], b.language)}</select></label>
            <label class="ss-field"><span>Nível</span><input id="ss-level" value="${escAttr(b.level)}"></label>
            <label class="ss-field"><span>Duração (min)</span><input id="ss-duration" type="number" min="10" max="180" value="${b.durationMin}"></label>
            <label class="ss-field"><span>Slides (≈0,4/min)</span><input id="ss-count" type="number" min="6" max="40" value="${b.slideCount}"></label>
            <label class="ss-field"><span>Ritmo</span><select id="ss-play">${opts([['straight', 'Aula directa'], ['balanced', 'Equilibrado'], ['gameshow', 'Mais interactivo']], b.playfulness)}</select></label>
            <label class="ss-field"><span>Cenas 3D</span><select id="ss-3d">${opts([['auto', 'Quando fizer sentido'], ['on', 'Activar'], ['off', 'Desactivar']], b.use3d)}</select></label>
            <label class="ss-field"><span>Paleta</span><select id="ss-palette">${opts([['auto', 'Automática'], ...Object.entries(palettes).map(([k, v]) => [k, v.label])], b.palette)}</select></label>
            <label class="ss-field ss-check"><input type="checkbox" id="ss-notes" ${b.speakerNotes ? 'checked' : ''}><span>Notas do docente em todos os slides</span></label>
          </div>
          <label class="ss-field"><span>Âmbito / capítulos (se o ficheiro for um livro)</span><input id="ss-scope" placeholder="Ex.: capítulos 3 e 4"></label>
          <div class="ss-web-opts">
            <b>3. A Kuzaya AI junta a web automaticamente</b>
            <p class="ss-hint">Pesquisa a Wikipédia, encontra bairros no mapa e vídeos colados, e funde tudo nos slides com a origem indicada. Só o ficheiro manda.</p>
            <label class="ss-field"><span>Links extra (opcional)</span><textarea id="ss-web-links" rows="2" placeholder="Cole links de Wikipédia ou vídeos…" onchange="AMASlideStudio.webOpt()">${esc(S.web.links || '')}</textarea></label>
          </div>
          <p class="ss-hint">O que não for indicado usa os valores por omissão: 50 min, nível universitário intermédio, ritmo equilibrado, ≈20 slides. Tudo o que for inferido vem marcado no deck.</p>
          ${S.deck ? `<button class="btn btn-o btn-sm" onclick="AMASlideStudio.backToIntake()">Voltar ao deck actual</button>` : ''}
        </section>
      </div>
      <div class="ss-generate">
        <button class="btn btn-p" onclick="AMASlideStudio.generate()">Gerar deck a partir da fonte</button>
        <p class="ss-hint">A fonte é a verdade. O motor local reorganiza o material e sinaliza o que inferiu — não inventa factos nem apaga o que o docente escreveu.</p>
      </div>
    </div>`;
  }

  function deckView(e) {
    const deck = S.deck || S.pending;
    const slide = deck.slides[Math.min(S.index, deck.slides.length - 1)];
    const list = (S.pending ? deck.slides.slice(0, S.shown) : deck.slides);
    const warnings = e ? e.qualityCheck(deck) : [];
    const pal = (e && e.PALETTES[deck.palette]) || { label: deck.palette };
    const thumb = (sl, i) => `<button type="button" class="ss-thumb ${i === S.index ? 'on' : ''}" onclick="AMASlideStudio.go(${i})" aria-label="Slide ${i + 1}: ${escAttr(sl.title)}">
      <span class="ss-thumb-n">${String(i + 1).padStart(2, '0')}</span><b>${esc(sl.title)}</b><small>${esc((e && e.SLIDE_TYPES[sl.type] && e.SLIDE_TYPES[sl.type].label) || sl.type)} · ${sl.min} min</small>
      <span class="ss-thumb-actions"><i role="button" tabindex="0" title="Subir" onclick="event.stopPropagation();AMASlideStudio.move(${i},-1)">↑</i><i role="button" tabindex="0" title="Descer" onclick="event.stopPropagation();AMASlideStudio.move(${i},1)">↓</i><i role="button" tabindex="0" title="Apagar" onclick="event.stopPropagation();AMASlideStudio.remove(${i})">×</i></span>
    </button>`;
    return `<div class="ss-workspace">
      <div class="ss-topline">
        <div><span class="eyebrow-t">KUZAYA AI · SLIDE STUDIO</span><h1>${esc(deck.title)}</h1>
          <p>${deck.stats.slides} slides · ~${deck.stats.durationMin} min · ${esc(deck.language)} · paleta ${esc(pal.label)} · fonte: ${esc(deck.sourceName)}</p>
          ${S.status ? `<p class="ss-hint">${esc(S.status)}</p>` : ''}</div>
        <div class="flex wrap" style="gap:8px"><a class="btn btn-o btn-sm" href="#/projetor">Projetor AMA</a><a class="btn btn-o btn-sm" href="#/turmas">Universidade</a></div>
      </div>
      ${S.pending ? `<div class="ss-progress"><div style="width:${Math.round((S.shown / deck.slides.length) * 100)}%"></div><span>A mostrar slides… ${S.shown}/${deck.slides.length}</span><button class="btn btn-ghost btn-sm" onclick="AMASlideStudio.stop()">Parar</button></div>` : ''}
      ${warnings.length ? `<div class="ss-warnings ${S.warningsOpen ? 'open' : ''}"><button type="button" onclick="AMASlideStudio.toggleWarnings()"><b>${warnings.length} verificação(ões) de qualidade</b><span>${S.warningsOpen ? 'Fechar' : 'Ver antes de exportar'}</span></button>
        ${S.warningsOpen ? `<ul>${warnings.map((w) => `<li class="ss-${esc(w.level)}">${w.slide ? `Slide ${w.slide}: ` : ''}${esc(w.text)}</li>`).join('')}</ul>` : ''}</div>` : ''}
      <div class="ss-toolbar" role="toolbar" aria-label="Comandos do Slide Studio">
        <button class="btn btn-o btn-sm" onclick="AMASlideStudio.prev()" aria-label="Slide anterior">←</button>
        <span class="ss-counter">${S.index + 1} / ${deck.slides.length}</span>
        <button class="btn btn-o btn-sm" onclick="AMASlideStudio.next()" aria-label="Slide seguinte">→</button>
        <button class="btn btn-ghost btn-sm" onclick="AMASlideStudio.revealBadge()" title="Revelação passo a passo">Revelar <b id="ss-reveal-badge">1/1</b></button>
        <button class="btn btn-ghost btn-sm" onclick="AMASlideStudio.toggleNotes()">${S.notesOpen ? 'Ocultar notas' : 'Notas'}</button>
        <button class="btn btn-ghost btn-sm" onclick="AMASlideStudio.toggleThumbs()">${S.thumbsOpen ? 'Ocultar grelha' : 'Grelha'}</button>
        <button class="btn btn-ghost btn-sm" onclick="AMASlideStudio.fullscreen()">Ecrã inteiro</button>
        <select aria-label="Paleta" onchange="AMASlideStudio.palette(this.value)">${Object.entries((e && e.PALETTES) || {}).map(([k, v]) => `<option value="${k}" ${k === deck.palette ? 'selected' : ''}>${esc(v.label)}</option>`).join('')}</select>
        <button class="btn btn-ghost btn-sm" onclick="AMASlideStudio.toggleEdit()">${S.editing ? 'Fechar edição' : 'Editar'}</button>
        <button class="btn btn-ghost btn-sm" onclick="AMASlideStudio.undo()">Desfazer</button>
        <button class="btn btn-o btn-sm" onclick="AMASlideStudio.enrich()" ${S.web.busy ? 'disabled' : ''} title="Acrescentar contexto da Wikipédia, marcado como EXTERNO">${S.web.busy ? 'A pesquisar…' : 'Enriquecer com a web'}</button>
        <span class="ss-ext-badge" title="Slides com informação externa verificável">${deck.slides.filter((s) => s.external || (s.flags || []).some((f) => /externo|wikipédia/i.test(f))).length} EXTERNO</span>
        <button class="btn btn-ghost btn-sm" onclick="AMASlideStudio.exportMenu()">Exportar</button>
        <button class="btn btn-p btn-sm" onclick="AMASlideStudio.publish()">Publicar na turma</button>
      </div>
      ${S.web.status ? `<div class="ss-web-status" role="status"><span>${esc(S.web.status)}</span>${S.web.busy ? `<button class="btn btn-ghost btn-sm" onclick="AMASlideStudio.stopEnrich()">Parar</button>` : ''}</div>` : ''}
      ${S.exportOpen ? `<div class="ss-export-menu"><button onclick="AMASlideStudio.exportOffline()">Player offline (HTML)</button><button onclick="AMASlideStudio.exportPrint()">Imprimir / PDF</button><button onclick="AMASlideStudio.exportJson()">Deck JSON (AMA)</button><button onclick="AMASlideStudio.backToIntake()">Novo deck</button><button class="danger" onclick="AMASlideStudio.delete()">Apagar este deck</button></div>` : ''}
      <div class="ss-main ${S.thumbsOpen ? '' : 'no-thumbs'}">
        <div class="ss-stage-wrap">
          <div class="ss-stage" id="ss-stage" tabindex="0">${S.pending ? (S.shown ? e.renderSlide(slide, deck, S.index) : '<div class="ss-empty">A preparar o primeiro slide…</div>') : e.renderSlide(slide, deck, S.index)}</div>
          <p class="ss-swipe-hint">Setas / espaço para revelar e avançar · deslize para o lado no telemóvel · N alterna notas</p>
          ${S.notesOpen ? e.renderNotes(slide, deck, S.index) : ''}
          ${S.editing ? editPanel(slide) : ''}
          <details class="ss-blueprint"><summary>Plano da aula (blueprint) e suposições</summary>
            <table><thead><tr><th>#</th><th>Título (afirmação)</th><th>Tipo</th><th>Objectivo</th><th>Min</th></tr></thead><tbody>${deck.blueprint.map((b) => `<tr><td>${b.n}</td><td>${esc(b.title)}</td><td>${esc(b.type)}</td><td>${esc(b.purpose)}</td><td>${b.min}</td></tr>`).join('')}</tbody></table>
            <ul>${deck.assumptions.map((a) => `<li>${esc(a)}</li>`).join('')}</ul>
          </details>
        </div>
        ${S.thumbsOpen ? `<aside class="ss-thumbs" aria-label="Miniaturas">${list.map(thumb).join('')}</aside>` : ''}
      </div>
    </div>`;
  }

  let lastHash = '';
  function slideStudioView() {
    if (!engine()) {
      waitForEngine(() => { if (/^#\/slide-studio/.test(location.hash)) render(); });
      return shellPublic('<div class="spinner"></div>', 'universidade');
    }
    const e = engine();
    if (!S.brief) S.brief = e.defaultBrief();
    const hasDeck = !!(S.deck || S.pending);
    const body = hasDeck ? deckView(e) : intakeView(e);
    return shellPublic(`<div class="ss-public">${body}</div>`, 'universidade');
  }

  /* ------------------------------------------------------------------ */
  /* Eventos globais (delegação sobrevive a re-render)                   */
  /* ------------------------------------------------------------------ */

  document.addEventListener('keydown', (ev) => {
    if (!/^#\/slide-studio/.test(location.hash) || !S.deck) return;
    const tag = (ev.target.tagName || '').toLowerCase();
    if (['input', 'textarea', 'select'].includes(tag)) return;
    if (ev.key === 'ArrowRight' || ev.key === 'PageDown' || ev.key === ' ') { ev.preventDefault(); next(); }
    if (ev.key === 'ArrowLeft' || ev.key === 'PageUp') { ev.preventDefault(); prev(); }
    if (ev.key.toLowerCase() === 'n') { ev.preventDefault(); toggleNotes(); }
    if (ev.key === 'f') { ev.preventDefault(); fullscreen(); }
    if (ev.key === 'Escape' && document.fullscreenElement) document.exitFullscreen();
  });

  let touchX = null;
  document.addEventListener('touchstart', (ev) => {
    if (!$('.ss-stage')) return;
    touchX = ev.touches[0]?.clientX ?? null;
  }, { passive: true });
  document.addEventListener('touchend', (ev) => {
    if (touchX === null || !$('.ss-stage')) return;
    const dx = (ev.changedTouches[0]?.clientX ?? touchX) - touchX;
    if (Math.abs(dx) > 60) { dx < 0 ? next() : prev(); }
    touchX = null;
  }, { passive: true });

  document.addEventListener('change', (ev) => {
    if (ev.target && ev.target.id === 'ss-drop') { /* handled by input */ }
  });

  /* Drag & drop na zona de upload (depois de cada render) */
  document.addEventListener('dragover', (ev) => {
    if (!$('#ss-drop') || !ev.target.closest) return;
    if (ev.target.closest('#ss-drop')) { ev.preventDefault(); $('#ss-drop').classList.add('over'); }
  });
  document.addEventListener('dragleave', (ev) => {
    if (ev.target.closest && ev.target.closest('#ss-drop')) $('#ss-drop').classList.remove('over');
  });
  document.addEventListener('drop', (ev) => {
    const zone = ev.target.closest && ev.target.closest('#ss-drop');
    if (!zone) return;
    ev.preventDefault(); zone.classList.remove('over');
    AMASlideStudio.files(ev.dataTransfer.files);
  });

  document.addEventListener('click', (ev) => {
    if (!/^#\/slide-studio/.test(location.hash)) return;
    const t = ev.target;
    const opt = t.closest && t.closest('.ss-option');
    if (opt && $('.ss-stage')) {
      const quiz = opt.closest('.ss-quiz');
      if (!quiz) return;
      $$('.ss-option', quiz).forEach((b) => b.classList.remove('correct', 'wrong'));
      opt.classList.add(opt.dataset.correct === '1' ? 'correct' : 'wrong');
      const reveal = $('.ss-reveal', quiz);
      if (reveal) reveal.hidden = false;
      return;
    }
    const flip = t.closest && t.closest('.ss-flip');
    if (flip && $('.ss-stage')) {
      const a = $('.ss-front', flip), b = $('.ss-back', flip);
      if (a && b) { a.hidden = !a.hidden; b.hidden = !b.hidden; }
      return;
    }
    const part = t.closest && t.closest('.ss-layer');
    if (part && $('.ss-stage')) {
      const note = $('.ss-layer small[data-part-note]', part.parentElement.parentElement);
      $$('.ss-layer small', part.parentElement).forEach((n) => { n.hidden = true; });
      const own = $('small', part);
      if (own) {
        own.hidden = false;
        if (!own.textContent) own.textContent = 'Parte identificada — descreva a sua função com as palavras da fonte.';
      }
      $$('.ss-layer', part.parentElement).forEach((b) => b.classList.toggle('active', b === part));
      return;
    }
    if (t.closest && t.closest('[data-reset-view]')) {
      $$('.ss-layer.active').forEach((b) => b.classList.remove('active'));
      $$('.ss-layer small').forEach((n) => { n.hidden = true; });
      return;
    }
    /* v1.1 — modelo 3D animado: camada activa, pausa e rotação manual. */
    const modelLayer = t.closest && t.closest('.ss-model-layer');
    if (modelLayer && $('.ss-stage')) {
      $$('.ss-model-layer', modelLayer.parentElement).forEach((b) => b.classList.toggle('active', b === modelLayer));
      return;
    }
    const modelToggle = t.closest && t.closest('[data-model-toggle]');
    if (modelToggle && $('.ss-stage')) {
      const model = modelToggle.closest('.ss-model');
      if (model) {
        model.classList.toggle('paused');
        modelToggle.textContent = model.classList.contains('paused') ? 'Retomar rotação' : 'Pausar rotação';
      }
      return;
    }
    const modelSpin = t.closest && t.closest('[data-model-left],[data-model-right]');
    if (modelSpin && $('.ss-stage')) {
      const model = modelSpin.closest('.ss-model');
      if (model) {
        const current = parseFloat(model.style.getPropertyValue('--manual-rot')) || 0;
        const delta = modelSpin.hasAttribute('data-model-left') ? -45 : 45;
        model.classList.add('manual');
        model.classList.remove('paused');
        model.style.setProperty('--manual-rot', `${current + delta}deg`);
        const toggle = $('[data-model-toggle]', model);
        if (toggle) toggle.textContent = 'Pausar rotação';
      }
      return;
    }
    const matchBtn = t.closest && t.closest('[data-match]');
    if (matchBtn && $('.ss-stage')) {
      matchBtn.classList.toggle('picked');
      return;
    }
    const drop = t.closest && t.closest('[data-drop]');
    if (drop && $('.ss-stage')) {
      const picked = $('.ss-pair .picked');
      if (picked) {
        picked.classList.remove('picked');
        picked.classList.toggle('matched', picked.dataset.match === drop.dataset.drop);
        drop.classList.add(picked.dataset.match === drop.dataset.drop ? 'matched' : 'missed');
      }
      return;
    }
    const sortItem = t.closest && t.closest('.ss-sort-item');
    if (sortItem && $('.ss-stage')) sortItem.classList.toggle('picked');
  });

  /* Aplicar revelação após cada render da rota */
  const originalRender = window.render;
  window.addEventListener('hashchange', () => { lastHash = location.hash; });
  function afterRender() {
    if (!/^#\/slide-studio/.test(location.hash)) return;
    applyReveal();
    lastHash = location.hash;
  }
  if (typeof MutationObserver === 'function') {
    const obs = new MutationObserver(() => {
      if ($('.ss-stage') && !$('.ss-stage').dataset.bound) {
        $('.ss-stage').dataset.bound = '1';
        afterRender();
      }
    });
    obs.observe(document.documentElement, { childList: true, subtree: true });
  }

  /* ------------------------------------------------------------------ */
  /* API pública                                                        */
  /* ------------------------------------------------------------------ */

  function toggleNotes() { S.notesOpen = !S.notesOpen; render(); }
  function toggleThumbs() { S.thumbsOpen = !S.thumbsOpen; render(); }
  function toggleEdit() { S.editing = !S.editing; render(); }
  function toggleWarnings() { S.warningsOpen = !S.warningsOpen; render(); }
  function exportMenu() { S.exportOpen = !S.exportOpen; render(); }
  function backToIntake() {
    S.exportOpen = false; S.deck = null; S.pending = null;
    S.source = { text: '', filename: '', pages: [], headings: [], truncated: false, warnings: [] };
    S.status = '';
    render();
  }
  function fullscreen() {
    const el = $('.ss-stage');
    if (!el) return;
    if (document.fullscreenElement) document.exitFullscreen();
    else if (el.requestFullscreen) el.requestFullscreen().catch(() => toast('Ecrã inteiro indisponível neste navegador.'));
  }
  function editExtract() { S.source.text = $('#ss-extract').value.slice(0, 20000); setStatus('Texto extraído editado manualmente.'); }
  function revealBadge() { S.reveal = 0; applyReveal(); }

  const API = {
    files: (files) => handleFiles(files),
    paste: usePaste,
    sample: () => generate(true),
    generate: () => generate(false),
    stop: stopGeneration,
    go: goTo,
    next, prev, toggleNotes, toggleThumbs, toggleEdit, toggleWarnings, exportMenu,
    fullscreen, undo, delete: deleteDeck, publish: publishToClass,
    exportOffline, exportPrint, exportJson,
    move, remove: removeSlide, applyEdit, rework, palette: setPalette,
    backToIntake, editExtract, revealBadge,
    webOpt, enrich: enrichDeck, stopEnrich,
    state: () => ({
      hasDeck: !!S.deck, pending: !!S.pending, busy: S.busy, index: S.index,
      slides: S.deck ? S.deck.slides.length : 0, status: S.status, activeId: S.activeId,
      webBusy: S.web.busy, webStatus: S.web.status,
      external: S.deck ? S.deck.slides.filter((s) => s.external || (s.flags || []).some((f) => /externo|wikipédia/i.test(f))).length : 0,
    }),
  };
  window.AMASlideStudio = API;

  // O PDF→slides e o projetor são a mesma ferramenta. A rota antiga passa a
  // abrir o projetor; `?studio=1` mantém o estúdio acessível para diagnóstico.
  on('/slide-studio', () => {
    if (/studio=1/.test(location.hash)) return slideStudioView();
    location.hash = '#/projetor';
    return '<div class="spinner"></div>';
  });

  /* A rota antiga já não cria um segundo link: «Projetor & Slides» é a única
     porta de entrada para PDF, slides, notas e projecção. */

})();
