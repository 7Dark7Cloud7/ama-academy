// AMA / CEU Academy — Motor de IA & Síntese Pedagógica (v2).
// Suporta 3 camadas em cascata automática:
//   1. Chrome Built-in AI (Prompt API / Gemini Nano no dispositivo)
//   2. Google Gemini API (opcional, chave do docente em localStorage)
//   3. Sintetizador Pedagógico Local (activo em 100% dos navegadores)
//
// Regra central: NUNCA entrega o texto do PDF «cru» como veio.
// A IA recebe o PDF + os resultados da web (Wikipédia, Wikimedia Commons,
// YouTube, mapas), FUNDE tudo num só discurso coerente, melhora a clareza
// com intuição visual estilo Ingenium 3.0 e embute imagens, vídeos e cenas 3D
// directamente nos slides, mantendo sempre os chips de origem visíveis.

const GEMINI_KEY_STORAGE = 'ama-gemini-api-key';

const SYSTEM_PROMPT = `És o arquitecto pedagógico visual da CEU Academy / AMA (Angola), inspirado na didáctica visual da Ingenium 3.0.
Recebes: (A) blocos extraídos do PDF/apontamentos do docente e (B) informação complementar obtida da web (Wikipédia, definições, contextos).
A tua missão é FUNDIR (A) e (B) numa aula NOVA, mais clara, mais visual e fácil de compreender — NUNCA devolver o texto cru como veio.

Regras obrigatórias:
- Português de Angola claro, moderno e universitário.
- Estrutura Ingenium 3.0 em cada bloco: 1) Intuição simples ("Em palavras simples"), 2) Pontos curtos com gancho em negrito ("Termo: explicação directa", máx. 16 palavras), 3) Aplicação concreta em Angola ou na vida real.
- Integra factos úteis da web directamente nas explicações para enriquecer o PDF (sem contrariar o ficheiro do docente).
- Sugere uma legenda manuscrita curta ("handnote", 3-6 palavras, ex: "Pensa nisto no dia a dia!") e uma pergunta de verificação rápida.
- Responde APENAS com JSON válido (sem markdown nem texto fora do JSON):
{
  "summary": "síntese envolvente da aula em 1 frase",
  "blocks": [
    {
      "title": "título claro e memorável (máx 65 car.)",
      "intuition": "explicação intuitiva em 1 frase simples (sem jargão)",
      "points": ["Conceito-chave: explicação directa e clara", "..."],
      "angolaConnection": "aplicação ou exemplo concreto no contexto angolano",
      "objective": "Verbo no infinitivo + meta clara",
      "handnote": "nota curta manuscrita (3-5 palavras)",
      "note": "guia prático para o docente apresentar este slide (65-95 palavras)"
    }
  ]
}`;

const clean = (s, max = 260) => String(s ?? '').replace(/\s+/g, ' ').trim().slice(0, max);

function timeout(ms) {
  return new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), ms));
}

function extractJson(text) {
  const s = String(text || '').trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '');
  const start = s.indexOf('{');
  const end = s.lastIndexOf('}');
  if (start < 0 || end <= start) throw new Error('sem JSON');
  return JSON.parse(s.slice(start, end + 1));
}

function cleanPoint(value, maxWords = 18) {
  const s = String(value || '').replace(/\s+/g, ' ').replace(/^[-•*\d.)\s]+/, '').trim();
  const words = s.split(' ').filter(Boolean);
  return words.length > maxWords ? `${words.slice(0, maxWords).join(' ')}…` : s;
}

export function getGeminiKey() {
  try { return (localStorage.getItem(GEMINI_KEY_STORAGE) || '').trim(); } catch { return ''; }
}

export function setGeminiKey(key) {
  try {
    const v = String(key || '').trim();
    if (v) localStorage.setItem(GEMINI_KEY_STORAGE, v);
    else localStorage.removeItem(GEMINI_KEY_STORAGE);
    return true;
  } catch { return false; }
}

export async function aiStatus() {
  const geminiKey = getGeminiKey();
  const LM = (typeof self !== 'undefined' && (self.LanguageModel || (self.ai && self.ai.languageModel))) || null;
  let chromeState = 'unavailable';
  if (LM) {
    try {
      chromeState = typeof LM.availability === 'function'
        ? await LM.availability()
        : (typeof LM.capabilities === 'function' ? (await LM.capabilities())?.available || 'unknown' : 'unknown');
    } catch { chromeState = 'unavailable'; }
  }
  const chromeReady = ['readily', 'available', 'after-download', 'downloadable', 'downloading'].includes(String(chromeState).toLowerCase());
  return {
    available: chromeReady || !!geminiKey,
    chromeReady,
    chromeState,
    hasGeminiKey: !!geminiKey,
    engine: geminiKey ? 'gemini-api' : (chromeReady ? 'chrome-language-model' : 'pedagogical-synthesizer'),
  };
}

/* ------------------------------------------------------------------ */
/* Helpers de correspondência semântica (PDF <-> Web/Imagens/Vídeos)  */
/* ------------------------------------------------------------------ */
const STOP = new Set([
  'para', 'como', 'quando', 'porque', 'também', 'sobre', 'entre', 'pelo', 'pela', 'pelos', 'pelas',
  'este', 'esta', 'estes', 'estas', 'esse', 'essa', 'isso', 'aquilo', 'numa', 'numas', 'muito',
  'mais', 'menos', 'onde', 'qual', 'quais', 'cada', 'todo', 'toda', 'todos', 'todas', 'aula',
  'página', 'bloco', 'slide', 'ficheiro', 'texto', 'tema', 'secção', 'capítulo', 'unidade',
]);

function tokenize(text) {
  return [...new Set(
    String(text || '')
      .toLowerCase()
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .split(/[^a-z0-9]+/)
      .filter((w) => w.length >= 4 && !STOP.has(w))
  )];
}

function overlapScore(aText, bText) {
  const a = tokenize(aText);
  const b = new Set(tokenize(bText));
  if (!a.length || !b.size) return 0;
  let hits = 0;
  for (const w of a) {
    if (b.has(w)) hits += 2;
    else if ([...b].some((bw) => bw.startsWith(w.slice(0, 5)) || w.startsWith(bw.slice(0, 5)))) hits += 1;
  }
  return hits;
}

/* Reescreve uma frase densa de PDF num ponto claro e escaneável (estilo Ingenium). */
function transformBullet(raw, fallbackTerm = '') {
  let s = clean(raw, 220)
    .replace(/^(por exemplo|ou seja|isto é|além disso|portanto|assim|em suma|note-se que|cabe referir que|importa salientar que)[,:\s]+/i, '')
    .replace(/\s*\([^)]{36,}\)/g, '')
    .trim();
  if (!s) return '';
  // Se já tem estrutura "Termo: explicação", manter e condensar
  if (/^[^:]{3,36}:\s+\S/.test(s)) {
    const [head, ...rest] = s.split(':');
    return `${clean(head, 36)}: ${cleanPoint(rest.join(':'), 15)}`;
  }
  // Detectar padrão de definição "X é/consiste em/representa Y"
  const def = s.match(/^([A-ZÁÀÂÃÉÈÊÍÌÓÒÔÕÚÙÇ][^.,;:]{2,34}?)\s+(?:é|são|significa|consiste em|representa|determina|relaciona|permite)\s+(.+)$/i);
  if (def) {
    return `${clean(def[1], 34)} → ${cleanPoint(def[2], 15)}`;
  }
  const words = s.split(/\s+/);
  if (words.length > 18) {
    const firstClause = s.split(/[;—–]/)[0];
    s = cleanPoint(firstClause.length >= 30 ? firstClause : s, 16);
  }
  if (fallbackTerm && !s.toLowerCase().includes(fallbackTerm.toLowerCase()) && words.length <= 12) {
    return `${clean(fallbackTerm, 26)}: ${s.charAt(0).toLowerCase()}${s.slice(1)}`;
  }
  return s.charAt(0).toUpperCase() + s.slice(1);
}

/* Cria uma explicação intuitiva ("Em palavras simples") fundindo PDF + Wikipédia. */
function buildIntuition(slide, webItem, subject) {
  const title = clean(slide.title || 'este conceito', 58);
  const srcText = slide.subtitle || (slide.bullets && slide.bullets[0]) || '';
  if (webItem && Array.isArray(webItem.sentences) && webItem.sentences.length) {
    const bestSent = webItem.sentences.find((s) => s.length >= 35 && s.length <= 190) || webItem.sentences[0];
    if (bestSent) {
      return clean(bestSent.replace(/\s*\([^)]{20,}\)/g, ''), 185);
    }
  }
  if (srcText) {
    const short = srcText.split(/[.;]/)[0].replace(/\s*\([^)]{20,}\)/g, '').trim();
    if (short.length >= 24) {
      return clean(`Em termos práticos: ${short.charAt(0).toLowerCase()}${short.slice(1)}.`, 185);
    }
  }
  const subjectHints = {
    fisica: `Pensa em «${title}» como a regra invisível que governa o movimento à tua volta.`,
    matematica: `«${title}» é uma ferramenta visual para transformar relações entre números em previsões exactas.`,
    financas: `«${title}» mostra como o dinheiro em Kwanzas cresce ou perde poder de compra com o tempo.`,
    programacao: `«${title}» organiza passos lógicos para o computador resolver tarefas grandes em milissegundos.`,
    biologia: `«${title}» descreve o mecanismo vivo que mantém o equilíbrio da natureza.`,
    historia: `«${title}» liga decisões do passado à construção da Angola contemporânea.`,
  };
  return subjectHints[subject] || `A ideia essencial de «${title}» é ligar teoria e aplicação real num só raciocínio.`;
}

/* Constrói handnote estilo Ingenium 3.0 contextual por tipo de slide. */
function pickHandnote(slide, index) {
  const byLayout = {
    cover: ['Começa pela intuição!', 'Pronto a explorar ✦', 'Aula visual & 3D'],
    agenda: ['O mapa da aula →', 'Passo a passo!'],
    objectives: ['Meta clara = foco!', 'O que vais dominar ✓'],
    formula: ['Clica nas variáveis!', 'Vê como se ligam →', 'Cada letra tem sentido!'],
    concept: ['Guarda esta intuição!', 'PDF + Web fundidos ✦', 'Ideia-chave aqui!'],
    comparison: ['Nota a diferença ⚖', 'Compara os dois lados!'],
    'animated-flow': ['Segue a sequência →', 'Cada passo prepara o próximo'],
    timeline: ['Ordem importa →', 'Linha do tempo clara'],
    mindmap: ['Tudo se conecta ✦', 'Visão panorâmica'],
    'scene-3d': ['Arrasta para rodar 3D ↻', 'Explora as camadas!'],
    quote: ['Número que marca!', 'Repara neste dado!'],
    quiz: ['Pensa antes de clicar!', 'Testa o que ficou!'],
    closing: ['Leva isto contigo ✓', 'Revê em 2 minutos!'],
  };
  const list = byLayout[slide.layout] || ['Repara nisto ✎', 'Ponto essencial!', 'Liga ao teu dia a dia'];
  return list[index % list.length];
}

/* Extrai variáveis interactivas de uma fórmula (para o Laboratório de Fórmulas Ingenium). */
export function parseFormulaVariables(formulaText = '', contextText = '') {
  const expr = String(formulaText || '').trim();
  if (!expr) return [];
  const KNOWN = {
    F: { name: 'Força resultante', unit: 'N (Newton)', hint: 'Empurrão ou tracção líquida sobre o corpo.' },
    m: { name: 'Massa', unit: 'kg', hint: 'Quantidade de matéria — mede a resistência à mudança de movimento.' },
    a: { name: 'Aceleração', unit: 'm/s²', hint: 'Ritmo a que a velocidade muda a cada segundo.' },
    v: { name: 'Velocidade', unit: 'm/s', hint: 'Distância percorrida por unidade de tempo.' },
    d: { name: 'Distância', unit: 'm', hint: 'Espaço percorrido pelo corpo.' },
    t: { name: 'Tempo', unit: 's', hint: 'Duração do fenómeno.' },
    M: { name: 'Montante final', unit: 'Kz', hint: 'Capital inicial somado a todos os juros acumulados.' },
    C: { name: 'Capital inicial', unit: 'Kz', hint: 'Valor investido ou poupado no arranque.' },
    i: { name: 'Taxa de juro', unit: '% / período', hint: 'Percentagem de rendimento em cada período.' },
    n: { name: 'Períodos / Tamanho', unit: 'un.', hint: 'Número de ciclos de capitalização ou elementos da lista.' },
    E: { name: 'Energia', unit: 'J (Joule)', hint: 'Capacidade de realizar trabalho.' },
    P: { name: 'Potência / Peso', unit: 'W ou N', hint: 'Energia por segundo ou força gravitacional.' },
    V: { name: 'Tensão / Volume', unit: 'V ou m³', hint: 'Diferença de potencial ou espaço ocupado.' },
    I: { name: 'Corrente eléctrica', unit: 'A', hint: 'Fluxo de carga por segundo.' },
    R: { name: 'Resistência', unit: 'Ω', hint: 'Oposição à passagem da corrente.' },
    x: { name: 'Incógnita / Entrada', unit: 'valor', hint: 'Variável independente que controlas.' },
    y: { name: 'Saída / Resultado', unit: 'valor', hint: 'Valor resultante da função.' },
    f: { name: 'Frequência', unit: 'Hz', hint: 'Número de ciclos por segundo.' },
    λ: { name: 'Comprimento de onda', unit: 'm', hint: 'Distância entre duas cristas consecutivas.' },
  };
  // Apanha símbolos isolados na expressão (ex: F = m × a, M = C × (1 + i)^n)
  const coreExpr = expr.split(/[.,;]/)[0].slice(0, 64);
  const tokens = [...new Set((coreExpr.match(/\b[A-Za-zλΔΩ]\b/g) || []))];
  return tokens.slice(0, 5).map((sym) => {
    const k = KNOWN[sym] || KNOWN[sym.toLowerCase()] || null;
    return {
      symbol: sym,
      name: k ? k.name : `Variável ${sym}`,
      unit: k ? k.unit : 'un.',
      hint: k ? k.hint : `Grandeza «${sym}» presente na relação do ficheiro.`,
    };
  });
}

/* ------------------------------------------------------------------ */
/* 1. Chamada à Chrome Built-in AI (Prompt API)                       */
/* ------------------------------------------------------------------ */
async function callChromeAI(payload, onProgress) {
  const LM = (typeof self !== 'undefined' && (self.LanguageModel || (self.ai && self.ai.languageModel))) || null;
  if (!LM) throw new Error('IA do Chrome indisponível');
  const state = typeof LM.availability === 'function' ? await LM.availability() : 'unknown';
  if (state === 'unavailable' || state === 'unknown') throw new Error(`IA do Chrome: ${state}`);

  const createOpts = {
    temperature: 0.3,
    topK: 4,
    systemPrompt: SYSTEM_PROMPT,
    monitor(m) {
      if (m && typeof m.addEventListener === 'function') {
        m.addEventListener('downloadprogress', (e) => {
          const pct = Math.round(((e.loaded || 0) / Math.max(1, e.total || 1)) * 100);
          if (onProgress) onProgress(`A descarregar modelo IA do Chrome (${pct}%)…`);
        });
      }
    },
  };
  const session = await Promise.race([LM.create(createOpts), timeout(22000)]);
  try {
    const raw = await Promise.race([
      session.prompt(`Funde o ficheiro do docente com o contexto web e transforma numa aula visual Ingenium 3.0:\n${JSON.stringify(payload)}`),
      timeout(32000),
    ]);
    return { parsed: extractJson(raw), engine: 'chrome-language-model', state };
  } finally {
    try { if (session && session.destroy) session.destroy(); } catch { }
  }
}

/* ------------------------------------------------------------------ */
/* 2. Chamada à Google Gemini API (se o docente configurar chave)     */
/* ------------------------------------------------------------------ */
async function callGeminiAPI(payload, apiKey) {
  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${encodeURIComponent(apiKey)}`;
  const res = await Promise.race([
    fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
        contents: [{
          role: 'user',
          parts: [{ text: `Funde o ficheiro do docente com o contexto web e transforma numa aula visual Ingenium 3.0:\n${JSON.stringify(payload)}` }],
        }],
        generationConfig: {
          temperature: 0.35,
          responseMimeType: 'application/json',
        },
      }),
    }),
    timeout(25000),
  ]);
  if (!res.ok) throw new Error(`Gemini HTTP ${res.status}`);
  const data = await res.json();
  const txt = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
  return { parsed: extractJson(txt), engine: 'gemini-api', state: 'gemini-2.5-flash' };
}

/* ------------------------------------------------------------------ */
/* 3. API unificada: improvePlan (com contexto web incluído!)         */
/* ------------------------------------------------------------------ */
export async function improvePlan(plan, meta = {}) {
  const blocks = Array.isArray(plan?.blocks) ? plan.blocks.slice(0, 8) : [];
  if (!blocks.length) throw new Error('sem blocos para melhorar');

  const webItems = Array.isArray(meta.web?.items) ? meta.web.items.slice(0, 5) : [];
  const payload = {
    title: String(meta.title || ''),
    subject: String(meta.subject || ''),
    webContext: webItems.map((w) => ({ title: w.title, summary: clean(w.text, 220), source: w.source || 'Wikipédia' })),
    blocks: blocks.map((b) => ({
      heading: b.heading,
      source: (b.source || []).slice(0, 4),
    })),
  };

  let out = null;
  const apiKey = getGeminiKey();
  if (apiKey) {
    try { out = await callGeminiAPI(payload, apiKey); } catch { out = null; }
  }
  if (!out) {
    out = await callChromeAI(payload, meta.onProgress);
  }

  const parsed = out.parsed || {};
  const improved = Array.isArray(parsed.blocks) ? parsed.blocks : [];
  if (!improved.length) throw new Error('IA devolveu zero blocos');

  return {
    summary: clean(parsed.summary || '', 240),
    blocks: blocks.map((original, i) => {
      const ai = improved[i] || improved.find((x) => String(x.heading || x.title || '').toLowerCase() === String(original.heading || '').toLowerCase()) || {};
      const points = Array.isArray(ai.points) ? ai.points.map((p) => cleanPoint(p)).filter(Boolean).slice(0, 4) : [];
      return {
        key: original.key,
        heading: clean(ai.title || original.heading, 72),
        intuition: clean(ai.intuition || '', 200),
        points: points.length ? points : (original.source || []).slice(0, 4),
        angolaConnection: clean(ai.angolaConnection || '', 170),
        objective: clean(ai.objective || original.objective || '', 110),
        handnote: clean(ai.handnote || '', 42),
        note: clean(ai.note || '', 340),
      };
    }),
    engine: out.engine,
    state: out.state,
    retrieved: new Date().toISOString(),
  };
}

export function applyImprovement(deck, result) {
  if (!deck || !result || !Array.isArray(result.blocks)) return false;
  const plan = deck.plan;
  if (!plan || !Array.isArray(plan.blocks)) return false;
  let changed = 0;

  result.blocks.forEach((block, i) => {
    const original = plan.blocks[i];
    if (!original) return;
    const targetSlides = (deck.slides || []).filter(
      (s) => s.clusterKey === original.key && !['cover', 'agenda', 'objectives', 'quiz', 'closing', 'web-spotlight', 'scene-3d'].includes(s.layout)
    );
    block.points = (block.points || []).slice(0, 4);
    if (targetSlides.length) {
      let cursor = 0;
      targetSlides.forEach((slide) => {
        const count = Math.max(1, Math.min(4, slide.bullets?.length || 3));
        const next = block.points.slice(cursor, cursor + count);
        if (next.length) slide.bullets = next;
        if (block.intuition && !slide.intuition) slide.intuition = block.intuition;
        if (block.angolaConnection) slide.angolaNote = block.angolaConnection;
        if (block.handnote) slide.handnote = block.handnote;
        slide.aiRewritten = true;
        cursor += next.length;
      });
      const first = targetSlides[0];
      first.title = block.heading;
      if (block.note) first.notes = `${block.note} ${first.notes || ''}`.trim().slice(0, 560);
      changed += targetSlides.length;
    }
    original.heading = block.heading;
    original.objective = block.objective || original.objective;
    original.ai = { points: block.points, intuition: block.intuition, note: block.note };
    const objSlide = (deck.slides || []).find((s) => s.layout === 'objectives');
    if (objSlide && objSlide.bullets && objSlide.bullets[i]) objSlide.bullets[i] = block.objective || objSlide.bullets[i];
    const agendaSlide = (deck.slides || []).find((s) => s.layout === 'agenda');
    if (agendaSlide && agendaSlide.bullets && agendaSlide.bullets[i]) agendaSlide.bullets[i] = block.heading;
  });

  if (result.summary) {
    const cover = (deck.slides || []).find((s) => s.layout === 'cover');
    if (cover) cover.subtitle = result.summary;
  }
  deck.ai = {
    engine: result.engine,
    state: result.state,
    retrieved: result.retrieved,
    blocksImproved: result.blocks.length,
  };
  if (Array.isArray(plan.steps)) {
    const label = result.engine === 'gemini-api' ? 'Gemini AI' : `IA do Chrome (${result.state})`;
    plan.steps.unshift(`${label} fundiu o PDF com a web e reescreveu ${result.blocks.length} bloco(s) para máxima clareza visual.`);
    plan.steps = plan.steps.slice(0, 7);
  }
  return changed > 0;
}

/* ------------------------------------------------------------------ */
/* 4. FUSÃO & TRANSFORMAÇÃO PROFUNDA (PDF + Web + Imagens + Vídeo + 3D)*/
/*    Corre SEMPRE por defeito — garante slides novos, fundidos e       */
/*    visuais estilo Ingenium 3.0 mesmo sem Chrome AI!                  */
/* ------------------------------------------------------------------ */
export function synthesizeAndFuseDeck(deck, web = null) {
  if (!deck || !Array.isArray(deck.slides)) return deck;
  const items = Array.isArray(web?.items) ? web.items : [];
  const images = Array.isArray(web?.images) ? web.images : [];
  const videos = Array.isArray(web?.videos) ? web.videos : [];
  const searchVideos = Array.isArray(web?.searchVideos) ? web.searchVideos : [];
  const places = Array.isArray(web?.places) ? web.places : [];

  const usedImgUrls = new Set();
  const usedWebTitles = new Set();

  // Escolhe a melhor imagem da web para um slide (sem repetir).
  const pickWebImage = (slideText, preferDiagram = false) => {
    if (!images.length) return null;
    const scored = images
      .filter((img) => img && img.url && !usedImgUrls.has(img.url))
      .map((img) => ({
        img,
        score: overlapScore(slideText, `${img.term || ''} ${img.title || ''} ${img.alt || ''}`) + (preferDiagram && img.isDiagram ? 2 : 0),
      }))
      .sort((a, b) => b.score - a.score);
    const chosen = scored[0]?.img || images.find((img) => img && img.url && !usedImgUrls.has(img.url)) || null;
    if (chosen) usedImgUrls.add(chosen.url);
    return chosen;
  };

  // Escolhe o melhor artigo Wikipédia para fundir neste slide.
  const pickWebItem = (slideText) => {
    if (!items.length) return null;
    const scored = items
      .map((item) => ({
        item,
        score: overlapScore(slideText, `${item.term || ''} ${item.title || ''} ${item.text || ''}`) + (usedWebTitles.has(item.title) ? -1.5 : 0.5),
      }))
      .sort((a, b) => b.score - a.score);
    const top = scored[0];
    if (!top) return null;
    usedWebTitles.add(top.item.title);
    return top.item;
  };

  let fusedCount = 0;
  let imagesEmbedded = 0;
  let videosEmbedded = 0;

  // 1. Percorrer todos os slides e TRANSFORMAR + FUNDIR directamente no conteúdo
  deck.slides.forEach((slide, idx) => {
    const slideHay = `${slide.title || ''} ${slide.subtitle || ''} ${(slide.bullets || []).join(' ')} ${(slide.steps || []).join(' ')} ${slide.formula || ''}`;

    // Handnote estilo Ingenium 3.0 contextual
    slide.handnote = slide.handnote || pickHandnote(slide, idx);

    // Fórmula → extrair variáveis interactivas
    if (slide.layout === 'formula' || slide.layout === 'highlight') {
      const vars = parseFormulaVariables(slide.formula || slide.highlight || '', slideHay);
      if (vars.length) slide.formulaVars = vars;
    }

    // Capa → usa imagem real de alta resolução apenas se houver fotos suficientes (não roubar dos slides de conteúdo)
    if (slide.layout === 'cover') {
      if (images.length >= 2) {
        const heroImg = pickWebImage(deck.title, false);
        if (heroImg && !heroImg.isDiagram) {
          slide.webHero = heroImg;
        }
      }
      if (items[0] && items[0].sentences && items[0].sentences[0] && (!slide.subtitle || slide.subtitle.length < 40)) {
        slide.subtitle = clean(items[0].sentences[0], 175);
      }
      return;
    }

    if (['agenda', 'objectives', 'quiz', 'closing', 'web-spotlight', 'scene-3d'].includes(slide.layout)) {
      return;
    }

    // Transformar os bullets para não ficarem texto cru do PDF
    if (Array.isArray(slide.bullets) && slide.bullets.length && !slide.aiRewritten) {
      const term = (slide.chips && slide.chips[0]) || slide.term || '';
      slide.bullets = slide.bullets.map((b, bi) => transformBullet(b, bi === 0 ? term : '')).filter(Boolean);
    }

    // Fundir conhecimento da Wikipédia directamente no slide!
    const matchedWeb = pickWebItem(slideHay);
    slide.intuition = slide.intuition || buildIntuition(slide, matchedWeb, deck.subject);

    if (matchedWeb) {
      const extraFact = (matchedWeb.sentences || []).find((s) => overlapScore(s, slideHay) < 4)
        || (matchedWeb.sentences && matchedWeb.sentences[0])
        || clean(matchedWeb.text, 165);
      if (extraFact) {
        slide.fusedInsight = {
          heading: clean(matchedWeb.title, 60),
          text: clean(extraFact, 190),
          url: matchedWeb.url,
          source: matchedWeb.source || 'Wikipédia',
        };
        // Fundir também um ponto enriquecido nos bullets se o slide tiver espaço (< 4 bullets)
        if (Array.isArray(slide.bullets) && slide.bullets.length < 4 && extraFact.length >= 28) {
          const synthBullet = transformBullet(extraFact, matchedWeb.title);
          if (synthBullet && !slide.bullets.some((b) => overlapScore(b, synthBullet) >= 4)) {
            slide.bullets.push(synthBullet);
          }
        }
        // Enriquecer notas do docente com a síntese fundida
        if (slide.notes && !slide.notes.includes(matchedWeb.title)) {
          slide.notes = `${slide.notes} Contexto web (${matchedWeb.title}): ${clean(extraFact, 130)}`.trim();
        }
        slide.sources = [
          { label: slide.page ? `PDF p.${slide.page}` : 'Ficheiro', kind: 'pdf' },
          { label: matchedWeb.source || 'Wikipédia', url: matchedWeb.url, kind: 'web' },
        ];
        fusedCount += 1;
      }
    } else if (!slide.sources) {
      slide.sources = [{ label: slide.page ? `PDF p.${slide.page}` : 'Ficheiro', kind: 'pdf' }];
    }

    // Embutir imagem real da web (Wikimedia Commons / Wikipédia) em slides visuais
    const wantsPhoto = ['concept', 'split', 'bullets', 'quote', 'comparison'].includes(slide.layout);
    const hasGenericLocalArt = !slide.visual || /^media\/nucleo-/.test(String(slide.visual));
    if (wantsPhoto && (hasGenericLocalArt || !slide.visualCredit)) {
      const img = pickWebImage(slideHay, slide.layout === 'concept' || slide.layout === 'formula');
      if (img) {
        slide.visual = img.url;
        slide.visualAlt = img.alt || slide.title;
        slide.visualCredit = { text: img.credit || 'Wikimedia Commons', url: img.page || '' };
        imagesEmbedded += 1;
      }
    }

    // Embutir vídeo YouTube (real ou pesquisa directa) num dos primeiros slides de conteúdo
    if (videosEmbedded === 0 && (idx >= 2 && idx <= 5)) {
      const vid = videos[0] || searchVideos[0] || null;
      if (vid) {
        slide.embeddedVideo = vid;
        videosEmbedded += 1;
      }
    } else if (videosEmbedded === 1 && videos[1] && idx >= 6) {
      slide.embeddedVideo = videos[1];
      videosEmbedded += 1;
    }
  });

  // 2. Garantir um Slide 3D Interactivo Real (Núcleo 3D Canvas) com os conceitos REAIS do PDF!
  const has3DSlide = deck.slides.some((s) => s.layout === 'scene-3d');
  if (!has3DSlide && deck.slides.length >= 3) {
    const defs = (deck.reading && deck.reading.definitions) || [];
    const kws = (deck.stats && deck.stats.keywords) || [];
    const sections = (deck.reading && deck.reading.sections) || [];
    const nodes = [];
    const seenN = new Set();
    const pushNode = (label, note) => {
      const lbl = clean(label, 28);
      if (!lbl || seenN.has(lbl.toLowerCase())) return;
      seenN.add(lbl.toLowerCase());
      nodes.push({ label: lbl, short: lbl.slice(0, 6), note: clean(note || `Conceito central da aula «${deck.title}».`, 160) });
    };
    defs.forEach((d) => pushNode(d.term, d.sentence));
    sections.forEach((sec) => pushNode(sec.heading, sec.sourceAnchor || sec.angola_example));
    kws.forEach((k) => pushNode(k, `Termo-chave extraído de ${deck.sourceName || deck.title}.`));
    while (nodes.length < 4) {
      pushNode(`Conceito ${nodes.length + 1}`, `Elemento estrutural de ${deck.title}.`);
    }

    const modeMap = {
      fisica: 'gyro',
      matematica: 'wave',
      financas: 'finance',
      programacao: 'core',
      biologia: 'core',
      historia: 'core',
    };
    const insertAt = Math.min(deck.slides.length - 1, Math.max(3, Math.ceil(deck.slides.length * 0.45)));
    deck.slides.splice(insertAt, 0, {
      id: 's-3d-lab',
      layout: 'scene-3d',
      scene3d: true,
      mode3d: modeMap[deck.subject] || 'core',
      kicker: 'Laboratório 3D Interactivo · Ingenium Visual',
      title: `Explorar em 3D: ${clean(deck.title, 48)}`,
      subtitle: 'Arraste o modelo 3D para rodar, clique nos nós orbitais para ver a explicação fundida (PDF + Web) ou use «Explodir camadas».',
      nodes3d: nodes.slice(0, 6),
      handnote: 'Arrasta para rodar 3D ↻',
      strategy: 'practice',
      durationMin: 4,
      page: null,
      notes: `Use este modelo 3D interactivo para visualizar como os ${nodes.slice(0, 6).length} conceitos principais de «${deck.title}» se ligam entre si. Rode o modelo em sala, clique em cada nó orbital e peça à turma que explique a ligação antes de avançar.`,
      sources: [{ label: 'Síntese 3D · PDF + Web', kind: 'ai' }],
    });
  }

  // 3. Se houver vídeo YouTube real (embed) ou mapa de Angola, incorporar como slide multimédia dedicado + já integrado!
  if (places.length && !deck.slides.some((s) => s.layout === 'map-spotlight')) {
    const p = places[0];
    const at = Math.max(3, deck.slides.length - 2);
    deck.slides.splice(at, 0, {
      id: 's-map-angola',
      layout: 'map-spotlight',
      kicker: 'Contexto Geográfico · Mapa Interactivo',
      title: `No mapa: ${clean(p.name || p.title, 54)}`,
      place: p,
      otherPlaces: places.slice(1, 5),
      handnote: 'Localiza em Angola 🇦🇴',
      strategy: 'example',
      durationMin: 3,
      page: null,
      external: true,
      web: { url: p.url, source: p.source || 'Google Maps / OSM', text: p.text },
      notes: `Mostre no mapa onde fica ${clean(p.name || p.title, 50)} e ligue directamente ao tema da aula «${deck.title}». Pergunte à turma quem conhece ou vive perto deste local.`,
    });
  }

  // Re-indexar tudo
  deck.slides.forEach((s, i) => { s.index = i + 1; });
  if (deck.stats) deck.stats.slides = deck.slides.length;
  deck.synthesis = {
    fusedSlides: fusedCount,
    imagesEmbedded,
    videosEmbedded,
    has3D: true,
    at: new Date().toISOString(),
  };

  if (deck.plan && Array.isArray(deck.plan.steps)) {
    deck.plan.steps.unshift(
      `Síntese visual Ingenium 3.0: ${fusedCount} slide(s) fundidos com a Wikipédia, ${imagesEmbedded} imagem(ns) da net embutida(s), ${videosEmbedded} vídeo(s) e 1 laboratório 3D interactivo.`
    );
    deck.plan.steps = deck.plan.steps.slice(0, 8);
  }
  return deck;
}
