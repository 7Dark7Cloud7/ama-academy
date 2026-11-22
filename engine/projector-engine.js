// AMA Projector Engine v2 — World-class PDF-to-Slide engine for Angolan classrooms.
// 10 rich slide layouts, smart content detection, Angola-grounded speaker notes,
// mnemonics, topic clusters, reading level, and enriched reading-mode sections.

import { analyzeSummary } from './summary-engine.js?v=3';

/* ─── Helpers ─────────────────────────────────────────────────────────────── */
const clean = (v, max = 320) => String(v ?? '').replace(/\s+/g, ' ').trim().slice(0, max);

/* ─── Detection Patterns ──────────────────────────────────────────────────── */
const FORMULA_PATTERN = /(?:[A-Za-zÀ-ÿ]\s*=\s*[^.,;]{2,42}|[∑∫√ΔπλΩ]|->|→|\^2|\^\d)/;
const HEADING_LINE    = /^(?:(?:\d+(?:\.\d+)?[.)]?\s+)?[A-ZÁÀÂÃÉÈÊÍÌÓÒÔÕÚÙÇ][^\n]{2,64})$/;

// Comparison: "vs", "diferença entre", "ao contrário", "enquanto que", "X ou Y"
const COMPARISON_PATTERN = /\b(vs\.?|versus|diferença entre|ao contrário|enquanto que|em vez de|oposto de|comparando|por outro lado)\b/i;
// Sequential steps: numbered lists, "passo", "etapa", "primeiro…depois…finalmente"
const TIMELINE_PATTERN   = /(?:(?:1\.|2\.|3\.)|(?:\bprimeiro\b.*\bdepois\b)|(?:\bpasso\b|\betapa\b|\bfinalmente\b|\bde seguida\b))/i;
// Ordinais usados em manuais angolanos ("Primeira Lei", "Segunda etapa", "3.º passo").
const ORDINAL_PATTERN    = /\b(primeir[ao]s?|segund[ao]s?|terceir[ao]s?|quart[ao]s?|quint[ao]s?|1\.º|2\.º|3\.º)\b/i;
// Big statistics
const STAT_PATTERN       = /\b\d+\s*%|\b\d+[xX]\b|\b\d+\s*vezes\s*mais\b|\b\d{2,}\s*mil\b/i;

/* ─── Subject art ─────────────────────────────────────────────────────────── */
const SUBJECT_VISUALS = {
  matematica:      'media/nucleo-math-3d.jpg?v=71',
  fisica:          'media/nucleo-physics-3d.jpg?v=71',
  programacao:     'media/nucleo-code-fin-3d.jpg?v=71',
  financas:        'media/nucleo-code-fin-3d.jpg?v=71',
  biologia:        'media/nucleo-3d-hero.jpg?v=71',
  historia:        'media/nucleo-3d-hero.jpg?v=71',
  empreendedorismo:'media/nucleo-3d-hero.jpg?v=71',
  geral:           'media/nucleo-3d-hero.jpg?v=71',
};

/* ─── Angola-rooted examples by subject ──────────────────────────────────── */
const ANGOLA_EXAMPLES = {
  fisica:      'os passageiros de um candongueiro em Luanda ao travar bruscamente na Mutamba',
  matematica:  'o mercado informal do Roque Santeiro com cálculos de lucro em Kwanzas',
  financas:    'uma poupança de 100.000 Kz na BFA com juros compostos anuais',
  programacao: 'um sistema de registo de estudantes para uma escola em Viana',
  biologia:    'as plantas da Floresta do Maiombe ou a bacia hidrográfica do rio Congo',
  historia:    'a proclamação da independência em Luanda a 11 de Novembro de 1975',
  empreendedorismo: 'um negócio de agronegócio em Malanje ou de telecomunicações em Luanda',
  geral:       'uma situação do quotidiano angolano num bairro de Luanda',
};

/* ─── Teaching strategies (cycle) ───────────────────────────────────────────*/
const STRATEGIES = ['direct', 'example', 'question', 'analogy', 'practice'];

/* ─── Adaptação ao nível da turma ───────────────────────────────────────────
   O mesmo ficheiro pode ser explicado de três formas. O nível altera as notas
   do docente e a orientação pedagógica, sem inventar conteúdo fora do texto. */
const LEVEL_GUIDANCE = {
  basico: {
    label: 'Básico',
    note: 'Nível básico: frases curtas, repetir o termo novo e começar pelo exemplo concreto. ',
    tip: 'Fale devagar. Apresente primeiro o exemplo angolano, só depois a definição. Repita cada termo novo e peça aos alunos que o digam por palavras suas.',
  },
  intermediario: {
    label: 'Intermédio',
    note: '',
    tip: 'Ligue a definição ao exemplo e convide a turma a reformular. Faça uma pergunta socrática por bloco antes de avançar.',
  },
  avancado: {
    label: 'Avançado',
    note: 'Nível avançado: acrescentar formalização, relações causais e uma aplicação nova. ',
    tip: 'Introduza a formalização e discuta os limites do conceito. Use as comparações do texto como exercício de argumentação e peça uma aplicação nunca vista.',
  },
};

/* ─── Utility ─────────────────────────────────────────────────────────────── */
function splitSentences(text) {
  return String(text || '')
    .replace(/\r\n?/g, '\n')
    .split(/(?<=[.!?])\s+|\n+/)
    .map((s) => s.replace(/\s+/g, ' ').trim())
    .filter((s) => s.length >= 16);
}

function inferHeading(block, index) {
  const lines = String(block || '').split('\n').map((l) => l.trim()).filter(Boolean);
  if (lines.length >= 2 && lines[0].length <= 68 && !/[.!?]$/.test(lines[0])) {
    return { heading: clean(lines[0].replace(/^[-•*\d.)\s]+/, ''), 72), body: lines.slice(1).join('\n') };
  }
  const firstLine = lines[0] || '';
  if (firstLine.length <= 60 && HEADING_LINE.test(firstLine) && !/[.!?]$/.test(firstLine)) {
    return { heading: clean(firstLine.replace(/^[-•*\d.)\s]+/, ''), 72), body: lines.slice(1).join('\n') };
  }
  const clause = clean(firstLine.split(/[:—–.,;]/)[0] || '', 56);
  return { heading: clause.length >= 6 ? clause : `Tópico ${index + 1}`, body: lines.join('\n') };
}

function chunkList(items, size) {
  const out = [];
  for (let i = 0; i < items.length; i += size) out.push(items.slice(i, i + size));
  return out;
}

/* PDFs often produce one very long sentence. Truncating it with clean() would
   silently drop information from the source, so split it at natural clauses
   first and only then at a word boundary. */
function splitLongSentences(sentences, max = 155) {
  const out = [];
  const push = (text) => { const t = clean(text, max); if (t) out.push(t); };
  const splitWords = (text) => {
    let buf = '';
    for (const word of clean(text, 4000).split(/\s+/)) {
      const candidate = buf ? `${buf} ${word}` : word;
      if (buf && candidate.length > max) { push(buf); buf = word; }
      else buf = candidate;
    }
    if (buf) push(buf);
  };
  for (const raw of sentences) {
    const text = clean(raw, 4000);
    if (!text) continue;
    if (text.length <= max) { push(text); continue; }
    const clauses = text.split(/;\s+|:\s+|,\s+/).map((c) => clean(c, 4000)).filter(Boolean);
    let buf = '';
    for (const clause of (clauses.length > 1 ? clauses : [text])) {
      if (clause.length > max) {
        if (buf) { push(buf); buf = ''; }
        splitWords(clause);
        continue;
      }
      const candidate = buf ? `${buf}; ${clause}` : clause;
      if (buf && candidate.length > max) { push(buf); buf = clause; }
      else buf = candidate;
    }
    if (buf) push(buf);
  }
  return out;
}

function normCmp(s) { return String(s || '').toLowerCase().replace(/[^a-zà-ÿ0-9]+/g, ' ').trim(); }
function isSameSentence(a, b) {
  const na = normCmp(a); const nb = normCmp(b);
  if (!na || !nb) return false;
  return na === nb || na.includes(nb.slice(0, 48)) || nb.includes(na.slice(0, 48));
}

/* ─── Mnemonic generation ─────────────────────────────────────────────────── */
const MNEMONIC_TEMPLATES = [
  (term) => `Lembra: "${term}" é como a vida no Zango — tudo tem uma causa e um efeito direto.`,
  (term) => `Para não esquecer "${term}": pensa num vendedor do mercado de Luanda que usa este conceito todos os dias.`,
  (term) => `Memoriza "${term}" como as estradas de Luanda — cada passo tem uma direção e uma regra.`,
  (term) => `"${term}" é como plantar no Huambo: semeia (aprende) e colhe (aplicas) com tempo.`,
  (term) => `Associa "${term}" a um candongueiro: segue uma rota definida, sempre no mesmo sentido.`,
];

function generateMnemonic(term, index) {
  if (!term || term.length < 3) return null;
  const tpl = MNEMONIC_TEMPLATES[index % MNEMONIC_TEMPLATES.length];
  return { term: clean(term, 48), mnemonic: tpl(clean(term, 32)) };
}

/* ─── Speaker notes factory ───────────────────────────────────────────────── */
function buildNotes(heading, strategy, subject, extraHint = '') {
  const angola = ANGOLA_EXAMPLES[subject] || ANGOLA_EXAMPLES.geral;
  const strategyPhrases = {
    direct:   `Explique diretamente o conceito de «${heading}».`,
    example:  `Dê um exemplo local: ${angola}.`,
    question: `Pergunta socrática à turma: "O que já conhecem sobre ${heading}?"`,
    analogy:  `Compare «${heading}» com algo familiar: ${angola}.`,
    practice: `Peça à turma um exercício rápido relacionado com «${heading}».`,
  };
  const main   = strategyPhrases[strategy] || strategyPhrases.direct;
  const check  = `Verifica a compreensão: "Alguém consegue reformular ${heading} por palavras suas?"`;
  return `${main}${extraHint ? ' ' + extraHint : ''} ${check}`;
}

/* ─── Reading level ───────────────────────────────────────────────────────── */
function computeReadingLevel(avgWordsPerSentence) {
  if (avgWordsPerSentence <= 12) return 'básico';
  if (avgWordsPerSentence <= 22) return 'intermédio';
  return 'avançado';
}

/* ─── Topic cluster detection ─────────────────────────────────────────────── */
function buildTopicClusters(slides) {
  const clusters = new Map();
  for (const slide of slides) {
    if (slide.layout === 'cover' || slide.layout === 'agenda' || slide.layout === 'closing') continue;
    const key = slide.clusterKey || 'Geral';
    if (!clusters.has(key)) clusters.set(key, []);
    clusters.get(key).push(slide.id);
  }
  return [...clusters.entries()].map(([label, ids]) => ({ label, slideIds: ids }));
}

/* ─── Layout selection per section ───────────────────────────────────────── */
function pickLayout(sectionText, defs, defCursor, i, ci, part) {
  const formulaLine = part.find((s) => FORMULA_PATTERN.test(s));
  const hasComparison = COMPARISON_PATTERN.test(sectionText);
  const hasTimeline   = hasSequence(sectionText);
  const hasStatistic  = STAT_PATTERN.test(sectionText);
  // Só usar «conceito» quando a definição pertence mesmo a este bloco.
  const matchedDef    = (defs || []).find((d) => d && d.term
    && String(sectionText).toLowerCase().includes(String(d.term).toLowerCase()));

  if (formulaLine && ci === 0 && part.length <= 3) return { layout: 'formula', formulaLine };
  if (hasComparison && ci === 0) return { layout: 'comparison', formulaLine: null };
  if (hasTimeline && ci === 0)   return { layout: 'animated-flow', formulaLine: null };
  if (hasStatistic && ci === 0)  return { layout: 'quote',      formulaLine: null };
  if (defs.length >= 3 && i % 4 === 0 && ci === 0) return { layout: 'mindmap', formulaLine: null };
  if (matchedDef && (i % 3 === 0) && ci === 0) return { layout: 'concept', formulaLine: null, matchedDef };
  if (i % 2 === 1 && ci === 0)   return { layout: 'split',     formulaLine: null };
  return { layout: 'bullets', formulaLine: null };
}

/* ─── Comparison pair extractor ──────────────────────────────────────────── */
function extractComparisonPair(text) {
  // "Ao contrário do juro simples, o crescimento acelera…" — o contraste vem
  // primeiro e o sujeito principal depois da vírgula.
  const contraMatch = text.match(/ao contrário (?:do|da|dos|das|de)\s+([^,.;]{3,52})\s*,\s*([^,.;]{3,70})/i);
  if (contraMatch) return { left: clean(contraMatch[2], 60), right: clean(contraMatch[1], 60) };
  const vsMatch = text.match(/([A-ZÀ-ÿa-z][^.;,]{3,40}?)\s+(?:vs\.?|versus|ao contrário (?:do|da|de)|enquanto que|por outro lado)\s+([A-ZÀ-ÿa-z][^.;,]{3,40})/i);
  if (vsMatch) return { left: clean(vsMatch[1], 60), right: clean(vsMatch[2], 60) };
  const ouMatch = text.match(/(?:diferença entre)\s+(.{3,40}?)\s+e\s+(.{3,40}?)(?:[.,;]|$)/i);
  if (ouMatch) return { left: clean(ouMatch[1], 60), right: clean(ouMatch[2], 60) };
  return { left: 'Conceito A', right: 'Conceito B' };
}

/* ─── Timeline step extractor ────────────────────────────────────────────── */
function hasSequence(text) {
  const numbered = (String(text || '').match(/(?:^|\n)\s*\d+[.)]\s/g) || []).length;
  if (numbered >= 2) return true;
  const ordinais = new Set((String(text || '').toLowerCase().match(/\b(primeir[ao]|segund[ao]|terceir[ao]|quart[ao]|quint[ao])\b/g) || []));
  if (ordinais.size >= 2) return true;
  return TIMELINE_PATTERN.test(text);
}

function extractTimelineSteps(sentences) {
  // Prefer numbered items; then ordinais; then sentences with sequence words
  const numbered = sentences.filter((s) => /^\d+[.)]\s/.test(s.trim()));
  if (numbered.length >= 2) return numbered.slice(0, 5).map((s) => clean(s.replace(/^\d+[.)]\s*/, ''), 160));
  const ordinalSteps = sentences.filter((s) => ORDINAL_PATTERN.test(s));
  if (ordinalSteps.length >= 2) return ordinalSteps.slice(0, 5).map((s) => clean(s, 160));
  const sequenced = sentences.filter((s) =>
    /\b(primeiro|segundo|terceiro|depois|em seguida|de seguida|finalmente|passo|etapa)\b/i.test(s)
  );
  if (sequenced.length >= 2) return sequenced.slice(0, 5).map((s) => clean(s, 160));
  return sentences.slice(0, 4).map((s) => clean(s, 160));
}

/* ─── Planeador pedagógico local ─────────────────────────────────────────────
   Não é um LLM: é uma camada determinística que lê, limpa, pontua e condensa o
   texto do PDF antes de o transformar em slides. O objectivo é nunca despejar
   parágrafos inteiros no ecrã — cada slide leva uma ideia, um exemplo e uma
   verificação, sempre ancorados numa passagem real do ficheiro. */
const FILLER_START = /^(por exemplo|em resumo|além disso|desta forma|assim|então|ou seja|de seguida|por outro lado|no entanto|contudo|também|já|finalmente|em primeiro lugar)[,:\s]+/i;
const NOISE_LINE = /^(página|page|slide|figura|fig\.|tabela|fonte|source|www\.|https?:|\d+\s*\/\s*\d+|\d{1,3})$/i;

function condensePoint(text, maxWords = 16) {
  let s = clean(text, 280)
    .replace(FILLER_START, '')
    .replace(/\([^)]{0,90}\)/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  if (!s) return '';
  // Cortar num limite natural antes de partir palavras a meio.
  const clause = s.match(/^(.{48,}?)[;:]\s/);
  if (clause) s = clause[1];
  const words = s.split(/\s+/).filter(Boolean);
  if (words.length > maxWords) {
    let cut = words.slice(0, maxWords).join(' ');
    // Preferir uma vírgula próxima do limite, para não cortar a meio de uma ideia.
    const comma = Math.max(cut.lastIndexOf(','), cut.lastIndexOf(';'));
    if (comma > cut.length * 0.55) cut = cut.slice(0, comma);
    // Nunca terminar numa palavra de ligação solta ("numa", "de", "para"…).
    cut = cut.replace(/\s+(?:e|ou|mas|que|de|da|do|das|dos|em|no|na|nos|nas|num|numa|por|para|com|sem|ao|à|a|o|as|os|um|uma)$/i, '');
    s = `${cut.replace(/[,;:]+$/, '')}…`;
  }
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function sentenceWeight(sentence, keywords, index) {
  const low = String(sentence).toLowerCase();
  let score = 0;
  for (const k of keywords || []) {
    const term = String(k.term || '').toLowerCase();
    if (term.length >= 4 && low.includes(term)) score += 2;
  }
  if (/\b(é|são|significa|consiste|define-se|chama-se)\b/i.test(low)) score += 3;
  if (/\b(por exemplo|exemplo|em angola|em luanda|escola|empresa|hospital|mercado)\b/i.test(low)) score += 2;
  if (/\d/.test(low)) score += 1;
  const n = low.split(/\s+/).filter(Boolean).length;
  if (n >= 8 && n <= 32) score += 2;
  if (n > 44) score -= 3;
  if (index < 3) score += 1;
  return score;
}

function buildSmartPoints(sec, analysis = {}) {
  const raw = String(sec.raw || '');
  const source = (sec.sentences && sec.sentences.length ? sec.sentences : splitSentences(raw))
    .map((s) => clean(s, 300))
    .filter((s) => s.length >= 20 && !NOISE_LINE.test(s));
  const scored = source.map((sentence, index) => ({
    sentence,
    index,
    score: sentenceWeight(sentence, analysis.keywords, index),
  })).filter((row) => row.score > 0);
  const ordered = (scored.length ? scored : source.map((sentence, index) => ({ sentence, index, score: 0 })))
    .sort((a, b) => b.score - a.score || a.index - b.index)
    .slice(0, 4)
    .sort((a, b) => a.index - b.index);
  const seen = new Set();
  return ordered.map((row) => condensePoint(row.sentence, 17)).filter((point) => {
    const key = normCmp(point).slice(0, 60);
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function smartTitle(heading, points, analysis = {}) {
  const h = clean(heading, 64);
  if (h && !/^(bloco|t[óo]pico|sec[çc][ãa]o)\s*\d+/i.test(h)) return h;
  return clean(points[0] || analysis.centralIdea || 'Ideia principal', 64);
}

function detectShape(raw) {
  if (COMPARISON_PATTERN.test(raw)) return 'comparison';
  if (hasSequence(raw)) return 'animated-flow';
  if (FORMULA_PATTERN.test(raw)) return 'formula';
  return 'concept';
}

function buildObjective(heading, layout) {  const h = clean(heading, 52);
  if (layout === 'comparison') return `Comparar «${h}» com o conceito oposto`;
  if (layout === 'animated-flow' || layout === 'timeline') return `Explicar a ordem de «${h}»`;
  if (layout === 'formula') return `Aplicar a relação de «${h}» num exercício`;
  if (layout === 'mindmap') return `Relacionar «${h}» com os restantes conceitos`;
  return `Explicar «${h}» por palavras próprias`;
}

/* ─── Main engine ─────────────────────────────────────────────────────────── */
/**
 * buildProjectorDeck — PDF → Slides + Reading Mode.
 * Returns a deck object with 10 possible layouts, Angola speaker notes, mnemonics,
 * readingLevel, topicClusters, and enriched reading sections.
 */
export function buildProjectorDeck({
  title      = '',
  subject    = 'geral',
  text       = '',
  pageTexts  = [],
  sourceName = '',
  theme      = 'editorial',
  author     = '',
  level      = 'auto',
} = {}) {
  const hasPages = Array.isArray(pageTexts) && pageTexts.some((p) => String(p?.text || '').trim().length > 12);
  const fullText = clean(
    text || (hasPages ? pageTexts.map((p) => p.text).join('\n\n') : ''),
    24000
  );
  if (fullText.length < 60) return { ok: false, reason: 'too_short' };

  /* ── Build raw sections ────────────────────────────────────────────── */
  let rawSections = [];
  if (hasPages) {
    rawSections = pageTexts
      .filter((p) => String(p?.text || '').trim().length >= 20)
      .map((p, idx) => {
        const parsed = inferHeading(p.text, idx);
        // Quando o PDF traz um título em fonte maior, ele vem em p.heading e
        // prevalece sobre a simples primeira linha detetada heuristically.
        const pageHeading = typeof p.heading === 'string' ? clean(p.heading, 72) : '';
        return {
          heading: pageHeading || parsed.heading,
          page: p.page || idx + 1,
          raw: p.text.trim(),
          sentences: splitLongSentences(splitSentences(parsed.body || p.text)),
        };
      });
  } else {
    const rawParas = String(text || '')
      .replace(/\r\n?/g, '\n')
      .split(/\n{2,}/)
      .map((p) => p.trim())
      .filter((p) => p.length >= 6);
    const paragraphs = [];
    for (let i = 0; i < rawParas.length; i += 1) {
      const cur = rawParas[i]; const next = rawParas[i + 1];
      const isHeadingOnly = !cur.includes('\n') && cur.length <= 72 && !/[.!?]$/.test(cur);
      if (isHeadingOnly && next && next.length >= 20) { paragraphs.push(`${cur}\n${next}`); i += 1; }
      else if (cur.length >= 20) paragraphs.push(cur);
    }
    if (paragraphs.length >= 2) {
      rawSections = paragraphs.map((p, idx) => {
        const parsed = inferHeading(p, idx);
        return { heading: parsed.heading, page: idx + 1, raw: p, sentences: splitLongSentences(splitSentences(parsed.body || p)) };
      });
    } else {
      const sents = splitSentences(fullText);
      rawSections = chunkList(splitLongSentences(sents), 3).map((g, idx) => ({
        heading: `Bloco ${idx + 1}`, page: idx + 1, raw: g.join(' '), sentences: g,
      }));
    }
  }

  /* ── Analyze ────────────────────────────────────────────────────────── */
  const cleanProse = rawSections.map((sec) => sec.sentences.join(' ')).filter(Boolean).join('\n\n') || fullText;
  const analysis = analyzeSummary({ text: cleanProse, title: title || sourceName, subject });

  // Backfill headings
  rawSections.forEach((sec, idx) => {
    if (/^Bloco \d+$/.test(sec.heading)) {
      const fallback = (analysis.definitions?.[idx]?.term) || (analysis.keywords?.[idx]?.term);
      if (fallback) sec.heading = clean(fallback, 64);
    }
  });

  // A camada "AI" local: condensa cada bloco antes de o transformar em slide.
  rawSections.forEach((sec) => {
    sec.points = buildSmartPoints(sec, analysis);
    sec.smartHeading = smartTitle(sec.heading, sec.points, analysis);
  });

  const deckTitle  = clean(title || analysis.title || sourceName || 'Apresentação de Aula', 90);
  const visual     = SUBJECT_VISUALS[subject] || SUBJECT_VISUALS.geral;
  const wordCount  = (fullText.match(/[\p{L}\p{N}]+/gu) || []).length;
  const sentCount  = analysis.stats?.sentences || Math.max(1, fullText.split(/[.!?]+/).length);
  const avgWPS     = Math.round((wordCount / sentCount) * 10) / 10;
  const readingLevel = computeReadingLevel(avgWPS);
  const effectiveLevel = ['basico', 'intermediario', 'avancado'].includes(level) ? level : readingLevel;
  const guidance = LEVEL_GUIDANCE[effectiveLevel] || LEVEL_GUIDANCE.intermediario;
  const estMinutes = Math.max(5, Math.min(90, Math.round(wordCount / 45) + 4));

  /* ── Build slides ─────────────────────────────────────────────────── */
  const slides = [];
  const defs   = Array.isArray(analysis.definitions) ? analysis.definitions : [];
  let defCursor     = 0;
  let strategyIndex = 0;

  // ── Slide 1: Cover ──────────────────────────────────────────────────
  // Alguns PDFs têm o título como «ideia central»; repeti-lo no subtítulo
  // desperdiça o espaço da capa e dá a sensação de conteúdo duplicado.
  const coverIdea = clean(analysis.centralIdea || '', 185);
  const coverFirst = clean(rawSections[0]?.sentences?.[0] || '', 185);
  const sameAsTitle = (v) => !v || normCmp(v) === normCmp(deckTitle) || isSameSentence(v, deckTitle);
  const coverSubtitle = sameAsTitle(coverIdea)
    ? (sameAsTitle(coverFirst) ? '' : coverFirst)
    : coverIdea;
  slides.push({
    id: 's-cover',
    index: 1,
    layout: 'cover',
    kicker: sourceName ? `Projetor · ${clean(sourceName, 44)}` : 'Projetor de Aulas · Sala Digital',
    title: deckTitle,
    subtitle: coverSubtitle,
    bullets: [],
    visual,
    strategy: 'direct',
    meta: { subject, estMinutes, pages: hasPages ? pageTexts.length : rawSections.length, author: clean(author, 60) },
    notes: `Apresente o tema «${deckTitle}» em 1–2 minutos. Comece por perguntar à turma o que já conhecem. Exemplo angolano: ${ANGOLA_EXAMPLES[subject] || ANGOLA_EXAMPLES.geral}. Verificação: "Já viram isto no vosso dia a dia?"`,
    durationMin: 2,
  });

  // ── Slide 2: Agenda ─────────────────────────────────────────────────
  const agendaItems = rawSections.map((sec) => sec.smartHeading || sec.heading).filter(Boolean).slice(0, 7);
  if (agendaItems.length >= 2) {
    slides.push({
      id: 's-agenda',
      index: slides.length + 1,
      layout: 'agenda',
      kicker: 'Roteiro da Sessão',
      title: 'O caminho que vamos percorrer',
      subtitle: `${agendaItems.length} blocos organizados a partir do documento — cada um com uma ideia, um exemplo e uma verificação.`,
      bullets: agendaItems,
      visual: '',
      strategy: 'direct',
      notes: `Mostre o mapa completo da sessão — cria âncoras mentais antes dos detalhes técnicos. Diga: "Vamos percorrer ${agendaItems.length} temas. Façam uma pergunta ao final de cada um." Verificação: "Qual destes temas mais vos interessa?"`,
      durationMin: 2,
    });
  }

  // ── Slide 3: Objectivos de aprendizagem ─────────────────────────────
  const objectiveItems = rawSections.slice(0, 4).map((sec) => {
    return buildObjective(sec.smartHeading || sec.heading, detectShape(sec.raw));
  }).filter(Boolean);
  if (objectiveItems.length >= 2) {
    slides.push({
      id: 's-objectives',
      index: slides.length + 1,
      layout: 'objectives',
      kicker: 'Objectivos de aprendizagem',
      title: 'No fim desta aula, consegue…',
      bullets: objectiveItems,
      strategy: 'direct',
      notes: `Leia os objectivos em voz alta e peça à turma para escolher o que quer dominar primeiro. No fim, volte a este slide e peça a cada estudante que assinale o objectivo que consegue cumprir.`,
      durationMin: 2,
    });
  }

  // ── Optional: percurso sequencial detected across sections ────────
  const orderedHeadings = rawSections
    .map((s) => clean(s.heading, 90))
    .filter((h) => ORDINAL_PATTERN.test(h) || /^\d+[.)]\s/.test(h));
  if (orderedHeadings.length >= 3) {
    slides.push({
      id: 's-timeline',
      index: slides.length + 1,
      layout: 'animated-flow',
      kicker: 'Percurso em ordem · extraído do documento',
      title: 'A sequência a seguir',
      steps: orderedHeadings.slice(0, 5),
      autoPlay: true,
      strategy: 'direct',
      notes: `Percorra as ${orderedHeadings.length} etapas pela ordem em que aparecem no ficheiro. Ligue cada etapa a ${ANGOLA_EXAMPLES[subject] || ANGOLA_EXAMPLES.geral}. Verificação: "O que muda entre a primeira e a última etapa?"`,
      durationMin: 3,
    });
  }

  // ── Content slides ──────────────────────────────────────────────────
  for (let i = 0; i < rawSections.length && slides.length < 20; i += 1) {
    const sec    = rawSections[i];
    // Usar a versão condensada: uma ideia por linha, não o parágrafo do PDF.
    const sents  = (sec.points && sec.points.length)
      ? sec.points
      : splitLongSentences(sec.sentences.length ? sec.sentences : [clean(sec.raw, 400)]);
    const chunks = chunkList(sents, 4);

    for (let ci = 0; ci < chunks.length && slides.length < 20; ci += 1) {
      const part       = chunks[ci];
      const suffix     = chunks.length > 1 ? ` (${ci + 1}/${chunks.length})` : '';
      const slideTitle = clean(`${sec.smartHeading || sec.heading}${suffix}`, 72);
      const strategy   = STRATEGIES[strategyIndex % STRATEGIES.length];
      strategyIndex   += 1;
      const clusterKey = sec.heading;

      const { layout, formulaLine, matchedDef: md } = pickLayout(sec.raw, defs, defCursor, i, ci, part);

      /* mindmap → rede visual de conceitos extraídos do ficheiro */
      if (layout === 'mindmap') {
        const localDefs = defs.filter((d) => sec.raw.toLowerCase().includes(d.term.toLowerCase()));
        const sourceDefs = (localDefs.length >= 2 ? localDefs : defs).slice(0, 6);
        slides.push({
          id: `s-c-${i}-${ci}`,
          index: slides.length + 1,
          layout: 'mindmap',
          kicker: `Página ${sec.page} · Mapa de conceitos`,
          title: slideTitle,
          center: clean(sec.heading, 46),
          nodes: sourceDefs.map((d) => ({ term: clean(d.term, 36), note: clean(d.sentence, 120) })),
          strategy,
          clusterKey,
          notes: buildNotes(slideTitle, strategy, subject, `Use o mapa para mostrar como «${clean(sourceDefs[0]?.term || sec.heading, 40)}» se liga aos restantes conceitos do ficheiro. Exemplo: ${ANGOLA_EXAMPLES[subject] || ANGOLA_EXAMPLES.geral}.`),
          durationMin: 4,
          page: sec.page,
        });
        continue;
      }

      /* formula → formula layout */
      if (layout === 'formula') {
        const fLine = formulaLine;
        const steps = part.filter((s) => !isSameSentence(s, fLine)).slice(0, 3).map((s) => clean(s, 150));
        slides.push({
          id: `s-c-${i}-${ci}`,
          index: slides.length + 1,
          layout: 'formula',
          kicker: `Página ${sec.page} · Destaque Técnico`,
          title: slideTitle,
          formula: clean(fLine, 150),
          steps,
          strategy,
          clusterKey,
          notes: buildNotes(slideTitle, strategy, subject, `A fórmula "${clean(fLine, 60)}" pode ser aplicada a: ${ANGOLA_EXAMPLES[subject] || ANGOLA_EXAMPLES.geral}.`),
          durationMin: 5,
          page: sec.page,
        });
        continue;
      }

      /* comparison layout */
      if (layout === 'comparison') {
        const pair = extractComparisonPair(sec.raw);
        const contextPoints = part.slice(0, 3).map((s) => clean(s, 140));
        slides.push({
          id: `s-c-${i}-${ci}`,
          index: slides.length + 1,
          layout: 'comparison',
          kicker: `Página ${sec.page} · Comparação`,
          title: slideTitle,
          left: pair.left,
          right: pair.right,
          bullets: contextPoints,
          strategy,
          clusterKey,
          notes: buildNotes(slideTitle, strategy, subject, `Compare "${pair.left}" com "${pair.right}" usando ${ANGOLA_EXAMPLES[subject] || ANGOLA_EXAMPLES.geral}.`),
          durationMin: 4,
          page: sec.page,
        });
        continue;
      }

      /* timeline / animated-flow layout */
      if (layout === 'timeline' || layout === 'animated-flow') {
        const steps = extractTimelineSteps(sents);
        slides.push({
          id: `s-c-${i}-${ci}`,
          index: slides.length + 1,
          layout: layout === 'animated-flow' ? 'animated-flow' : 'timeline',
          kicker: `Página ${sec.page} · Processo animado`,
          title: slideTitle,
          steps,
          autoPlay: layout === 'animated-flow',
          strategy,
          clusterKey,
          notes: buildNotes(slideTitle, strategy, subject, `Percorra cada etapa em voz alta; as setas revelam a ordem. Ligue a ${ANGOLA_EXAMPLES[subject] || ANGOLA_EXAMPLES.geral}.`),
          durationMin: 4,
          page: sec.page,
        });
        continue;
      }

      /* quote layout */
      if (layout === 'quote') {
        const statSent = part.find((s) => STAT_PATTERN.test(s)) || part[0] || '';
        slides.push({
          id: `s-c-${i}-${ci}`,
          index: slides.length + 1,
          layout: 'quote',
          kicker: `Página ${sec.page} · Destaque Estatístico`,
          title: slideTitle,
          quote: clean(statSent, 200),
          source: clean(sourceName || deckTitle, 60),
          bullets: part.filter((s) => !isSameSentence(s, statSent)).slice(0, 2).map((s) => clean(s, 140)),
          strategy,
          clusterKey,
          notes: buildNotes(slideTitle, strategy, subject, `Destaque o número/estatística. Peça à turma: "O que é que este valor significa para Angola?"`),
          durationMin: 3,
          page: sec.page,
        });
        continue;
      }

      /* concept layout */
      if (layout === 'concept' && md) {
        const matchedDef = md;
        defCursor += 1;
        const extraBullets = part
          .filter((s) => !isSameSentence(s, matchedDef.sentence))
          .slice(0, 2)
          .map((s) => clean(s, 138));
        slides.push({
          id: `s-c-${i}-${ci}`,
          index: slides.length + 1,
          layout: 'concept',
          kicker: `Página ${sec.page} · Conceito-Chave`,
          title: clean(sec.heading || matchedDef.term, 64),
          subtitle: clean(matchedDef.sentence, 190),
          term: clean(matchedDef.term, 48),
          bullets: extraBullets,
          visual,
          strategy,
          clusterKey,
          notes: buildNotes(matchedDef.term, strategy, subject, `Enfatize a definição de «${matchedDef.term}». Convide um estudante a reformulá-la. Exemplo: ${ANGOLA_EXAMPLES[subject] || ANGOLA_EXAMPLES.geral}.`),
          durationMin: 4,
          page: sec.page,
        });
        continue;
      }

      /* split layout */
      if (layout === 'split') {
        slides.push({
          id: `s-c-${i}-${ci}`,
          index: slides.length + 1,
          layout: 'split',
          kicker: `Página ${sec.page} · Síntese Visual`,
          title: slideTitle,
          subtitle: clean(part[0] || '', 160),
          bullets: part.slice(1, 3).map((s) => clean(s, 138)),
          visual,
          strategy,
          clusterKey,
          notes: buildNotes(slideTitle, strategy, subject, `Use a coluna esquerda para contextualizar. Ligue os pontos a ${ANGOLA_EXAMPLES[subject] || ANGOLA_EXAMPLES.geral}.`),
          durationMin: 4,
          page: sec.page,
        });
        continue;
      }

      /* bullets layout (default) */
      slides.push({
        id: `s-c-${i}-${ci}`,
        index: slides.length + 1,
        layout: 'bullets',
        kicker: `Página ${sec.page} · Desenvolvimento`,
        title: slideTitle,
        bullets: part.slice(0, 4).map((s) => clean(s, 155)),
        strategy,
        clusterKey,
        notes: buildNotes(slideTitle, strategy, subject),
        durationMin: 3,
        page: sec.page,
      });
    }
  }

  // ── Interactive check: respostas vêm do próprio ficheiro ────────────
  const firstQuiz = (analysis.quiz || [])[0];
  if (firstQuiz && slides.length < 20) {
    slides.push({
      id: 's-check',
      index: slides.length + 1,
      layout: 'quiz',
      kicker: 'Verificação rápida · gerada do ficheiro',
      title: 'O que ficou da aula?',
      question: clean(firstQuiz.prompt, 170),
      options: (firstQuiz.options || []).slice(0, 3).map((o) => clean(o, 90)),
      correct: Number.isInteger(firstQuiz.correct) ? firstQuiz.correct : 0,
      explanation: clean(firstQuiz.explanation || '', 220),
      strategy: 'question',
      notes: `Peça à turma que escolha antes de revelar. Só depois mostre a resposta correcta e leia a passagem de origem: «${clean(firstQuiz.explanation || '', 150)}».`,
      durationMin: 3,
      page: null,
    });
  }

  // ── Final slide: Closing ─────────────────────────────────────────────
  const checkQuestions = (analysis.quiz || []).slice(0, 3).map((q) => clean(q.prompt, 150));
  const closingPoints  = (analysis.keyIdeas || []).slice(0, 3).map((k) => condensePoint(k, 15)).filter(Boolean);
  slides.push({
    id: 's-closing',
    index: slides.length + 1,
    layout: 'closing',
    kicker: 'Fecho & Verificação em Sala',
    title: 'Síntese final e perguntas à turma',
    bullets: closingPoints.length ? closingPoints : rawSections.slice(0, 3).map((s) => s.heading),
    checkQuestions: checkQuestions.length >= 3
      ? checkQuestions
      : [
          `Qual foi o conceito mais decisivo de «${deckTitle}» e onde o aplicaria?`,
          `Dê um exemplo do seu bairro ou cidade onde este tema aparece.`,
          `Explique a um colega, em 2 frases, o que aprendeu hoje.`,
        ],
    strategy: 'question',
    notes: `Reserve 3–5 minutos finais. Peça a três estudantes que respondam a cada pergunta. Reforce com um exemplo de ${ANGOLA_EXAMPLES[subject] || ANGOLA_EXAMPLES.geral}.`,
    durationMin: 4,
  });

  /* ── Mnemonics ──────────────────────────────────────────────────────── */
  const keyTerms = [
    ...defs.slice(0, 4).map((d) => d.term),
    ...(analysis.keywords || []).slice(0, 4).map((k) => k.term),
  ].filter(Boolean);
  const mnemonics = [...new Set(keyTerms)].slice(0, 6).map((term, idx) => generateMnemonic(term, idx)).filter(Boolean);

  /* ── Topic clusters ─────────────────────────────────────────────────── */
  const topicClusters = buildTopicClusters(slides);

  /* ── Enriched reading sections ─────────────────────────────────────── */
  const readingSections = rawSections.map((sec, idx) => {
    const secDef  = defs.find((d) => sec.raw.toLowerCase().includes(d.term.toLowerCase()));
    const secKW   = (analysis.keywords || []).filter((k) => sec.raw.toLowerCase().includes(k.term.toLowerCase())).slice(0, 4);
    // A pergunta de verificação deve nascer de uma passagem real do ficheiro —
    // assim o quiz do projetor continua ancorado na fonte, não em texto genérico.
    const anchor = secDef?.sentence
      || (sec.sentences || []).find((s) => s.length >= 28)
      || sec.raw.split('\n').find((l) => l.trim().length >= 28)
      || sec.heading;
    const checkQuestion = secDef
      ? `Segundo o ficheiro, o que é «${clean(secDef.term, 44)}»?`
      : `A partir do trecho «${clean(anchor, 88)}», que conclusão podes tirar sobre ${clean(sec.heading, 44)}?`;
    return {
      id: `sec-${idx + 1}`,
      number: idx + 1,
      page: sec.page,
      heading: sec.heading,
      paragraphs: sec.raw.split(/\n+/).map((p) => p.trim()).filter(Boolean),
      keyTerms: secKW.map((k) => k.term),
      checkQuestion,
      sourceAnchor: clean(anchor, 160),
      angola_example: `Em Angola, este tema pode ser visto em: ${ANGOLA_EXAMPLES[subject] || ANGOLA_EXAMPLES.geral}.`,
      definition: secDef ? { term: secDef.term, sentence: secDef.sentence } : null,
    };
  });

  /* ── Comparisons from summary engine ───────────────────────────────── */
  const comparisons = extractAllComparisons(rawSections);

  /* ── Adaptação final: termos-chave por bloco + notas ──────────────── */
  const chipMap = new Map(rawSections.map((sec) => [
    sec.heading,
    (analysis.keywords || [])
      .filter((k) => sec.raw.toLowerCase().includes(String(k.term || '').toLowerCase()))
      .slice(0, 4)
      .map((k) => clean(k.term, 32)),
  ]));
  slides.forEach((s) => {
    if (s.clusterKey && chipMap.has(s.clusterKey) && !s.chips) s.chips = chipMap.get(s.clusterKey);
    if (!s.notes) return;
    // Liga cada nota a uma passagem real do ficheiro — evita slides genéricos.
    const trecho = s.formula || s.quote || (s.bullets && s.bullets[0]) || s.subtitle || '';
    if (trecho) s.notes += ` Trecho do ficheiro: «${clean(trecho, 120)}».`;
    if (guidance.note) s.notes = guidance.note + s.notes;
  });

  /* ── Plano da IA (explicação legível do que foi feito ao ficheiro) ──── */
  const sourceSentenceCount = rawSections.reduce((n, sec) => n + (sec.sentences || []).length, 0);
  const keptPointCount = rawSections.reduce((n, sec) => n + (sec.points || []).length, 0);
  const plan = {
    blocks: rawSections.map((sec) => ({
      key: sec.heading,
      heading: sec.smartHeading || sec.heading,
      source: (sec.points || []).slice(0, 4),
      page: sec.page,
      kept: (sec.points || []).length,
      read: (sec.sentences || []).length,
      objective: buildObjective(sec.smartHeading || sec.heading, detectShape(sec.raw)),
      slideIndexes: slides
        .map((s, i) => (s.clusterKey === sec.heading ? i + 1 : 0))
        .filter(Boolean),
    })),
    condensed: {
      sentencesRead: sourceSentenceCount,
      ideasKept: keptPointCount,
      removed: Math.max(0, sourceSentenceCount - keptPointCount),
    },
    keywords: (analysis.keywords || []).slice(0, 8).map((k) => k.term),
    definitions: defs.slice(0, 6).map((d) => d.term),
    steps: [
      `Li ${sourceSentenceCount} frases do ficheiro e retirei cabeçalhos, números de página e ruído de PDF.`,
      `Pontuei cada frase por definição, exemplo angolano, número e ligação ao tema.`,
      `Guardei ${keptPointCount} ideias — uma por linha, com no máximo ~17 palavras.`,
      `Agrupei tudo em ${rawSections.length} bloco(s) e escolhi o layout de cada slide.`,
      `Escrevi objectivos, notas do docente e uma verificação por bloco.`,
    ],
  };

  /* ── Stats ─────────────────────────────────────────────────────────── */
  return {
    ok: true,
    id: `deck-${Date.now()}`,
    title: deckTitle,
    subject,
    sourceName: clean(sourceName, 90),
    theme,
    createdAt: new Date().toISOString(),
    stats: {
      slides: slides.length,
      words: wordCount,
      estMinutes,
      pages: hasPages ? pageTexts.length : rawSections.length,
      keywords: (analysis.keywords || []).slice(0, 8).map((k) => k.term),
      readingLevel,
      level: effectiveLevel,
      avgWordsPerSentence: avgWPS,
    },
    level: effectiveLevel,
    teaching: {
      level: effectiveLevel,
      label: guidance.label,
      tip: guidance.tip,
      strategyCycle: STRATEGIES.slice(),
      auto: level === 'auto',
    },
    slides,
    mnemonics,
    topicClusters,
    plan,
    reading: {
      title: deckTitle,
      centralIdea: clean(analysis.centralIdea || '', 220),
      definitions: defs.slice(0, 8),
      sections: readingSections,
      fullText,
      comparisons,
      checkQuestions,
      readingLevel,
    },
  };
}

/* ── Comparisons extractor ──────────────────────────────────────────────── */
function extractAllComparisons(sections) {
  const results = [];
  for (const sec of sections) {
    if (!COMPARISON_PATTERN.test(sec.raw)) continue;
    const pair = extractComparisonPair(sec.raw);
    if (pair.left !== 'Conceito A') {
      results.push({ left: pair.left, right: pair.right, context: clean(sec.heading, 60) });
    }
  }
  return results.slice(0, 5);
}
