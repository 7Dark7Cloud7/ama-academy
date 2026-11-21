// Pure PDF-to-Projector Slide Deck & Reading Mode engine for AMA Teachers.
// Transforms extracted PDF pages or pasted lecture notes into visually structured
// slides (cover, agenda, concept, split, highlight, bullets, closing check)
// plus speaker notes and a distraction-free Reading Mode outline.

import { analyzeSummary } from './summary-engine.js';

const clean = (v, max = 320) => String(v ?? '').replace(/\s+/g, ' ').trim().slice(0, max);

const FORMULA_PATTERN = /(?:[A-Za-zÀ-ÿ]\s*=\s*[^.,;]{2,42}|[∑∫√ΔπλΩ]|->|→|\^2|\^\d)/;
const HEADING_LINE = /^(?:(?:\d+(?:\.\d+)?[.)]?\s+)?[A-ZÁÀÂÃÉÈÊÍÌÓÒÔÕÚÙÇ][^\n]{2,64})$/;

const SUBJECT_VISUALS = {
  matematica: 'media/nucleo-math-3d.jpg?v=71',
  fisica: 'media/nucleo-physics-3d.jpg?v=71',
  programacao: 'media/nucleo-code-fin-3d.jpg?v=71',
  financas: 'media/nucleo-code-fin-3d.jpg?v=71',
  empreendedorismo: 'media/nucleo-3d-hero.jpg?v=71',
  geral: 'media/nucleo-3d-hero.jpg?v=71',
};

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
    return {
      heading: clean(lines[0].replace(/^[-•*\d.)\s]+/, ''), 72),
      body: lines.slice(1).join('\n'),
    };
  }
  const firstLine = lines[0] || '';
  if (firstLine.length <= 60 && HEADING_LINE.test(firstLine) && !/[.!?]$/.test(firstLine)) {
    return {
      heading: clean(firstLine.replace(/^[-•*\d.)\s]+/, ''), 72),
      body: lines.slice(1).join('\n'),
    };
  }
  // Extract a crisp short phrase from the opening clause
  const clause = clean(firstLine.split(/[:—–.,;]/)[0] || '', 56);
  return {
    heading: clause.length >= 6 ? clause : `Tópico ${index + 1}`,
    body: lines.join('\n'),
  };
}

function chunkList(items, size) {
  const out = [];
  for (let i = 0; i < items.length; i += size) {
    out.push(items.slice(i, i + size));
  }
  return out;
}

/**
 * Builds a structured visual slide deck and reading-mode document from PDF pages
 * (`pageTexts`: [{ page, text }]) or plain lecture text.
 */
export function buildProjectorDeck({
  title = '',
  subject = 'geral',
  text = '',
  pageTexts = [],
  sourceName = '',
  theme = 'editorial',
  author = '',
} = {}) {
  const hasPages = Array.isArray(pageTexts) && pageTexts.some((p) => String(p?.text || '').trim().length > 12);
  const fullText = clean(
    text || (hasPages ? pageTexts.map((p) => p.text).join('\n\n') : ''),
    24000
  );
  if (fullText.length < 60) {
    return { ok: false, reason: 'too_short' };
  }

  // Build normalized raw sections first (so bare headings are separated from body prose)
  let rawSections = [];
  if (hasPages) {
    rawSections = pageTexts
      .filter((p) => String(p?.text || '').trim().length >= 20)
      .map((p, idx) => {
        const parsed = inferHeading(p.text, idx);
        return {
          heading: parsed.heading,
          page: p.page || idx + 1,
          raw: p.text.trim(),
          sentences: splitSentences(parsed.body || p.text),
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
      const cur = rawParas[i];
      const next = rawParas[i + 1];
      const isHeadingOnly = !cur.includes('\n') && cur.length <= 72 && !/[.!?]$/.test(cur);
      if (isHeadingOnly && next && next.length >= 20) {
        paragraphs.push(`${cur}\n${next}`);
        i += 1;
      } else if (cur.length >= 20) {
        paragraphs.push(cur);
      }
    }
    if (paragraphs.length >= 2) {
      rawSections = paragraphs.map((p, idx) => {
        const parsed = inferHeading(p, idx);
        return {
          heading: parsed.heading,
          page: idx + 1,
          raw: p,
          sentences: splitSentences(parsed.body || p),
        };
      });
    } else {
      const sents = splitSentences(fullText);
      const groups = chunkList(sents, 3);
      rawSections = groups.map((g, idx) => ({
        heading: `Bloco ${idx + 1}`,
        page: idx + 1,
        raw: g.join(' '),
        sentences: g,
      }));
    }
  }

  // Analyze clean body prose (without unpunctuated headings glued onto sentences)
  const cleanProse = rawSections
    .map((sec) => sec.sentences.join(' '))
    .filter(Boolean)
    .join('\n\n') || fullText;

  const analysis = analyzeSummary({
    text: cleanProse,
    title: title || sourceName,
    subject,
  });

  // Backfill generic block headings when input had no explicit headings
  rawSections.forEach((sec, idx) => {
    if (/^Bloco \d+$/.test(sec.heading)) {
      const fallback = (analysis.definitions?.[idx]?.term) || (analysis.keywords?.[idx]?.term);
      if (fallback) sec.heading = clean(fallback, 64);
    }
  });

  const deckTitle = clean(title || analysis.title || sourceName || 'Apresentação de Aula', 90);
  const visual = SUBJECT_VISUALS[subject] || SUBJECT_VISUALS.geral;
  const wordCount = (fullText.match(/[\p{L}\p{N}]+/gu) || []).length;
  const estMinutes = Math.max(5, Math.min(90, Math.round(wordCount / 45) + 4));

  const normCmp = (s) => String(s || '').toLowerCase().replace(/[^a-zà-ÿ0-9]+/g, ' ').trim();
  const isSameSentence = (a, b) => {
    const na = normCmp(a);
    const nb = normCmp(b);
    if (!na || !nb) return false;
    return na === nb || na.includes(nb.slice(0, 48)) || nb.includes(na.slice(0, 48));
  };

  const slides = [];

  // Slide 1: Cover
  slides.push({
    id: 's-cover',
    index: 1,
    layout: 'cover',
    kicker: sourceName ? `Projetor AMA · ${clean(sourceName, 44)}` : 'Projetor de Aulas · Núcleo AMA',
    title: deckTitle,
    subtitle: clean(analysis.centralIdea || rawSections[0]?.sentences?.[0] || '', 185),
    bullets: [],
    visual,
    meta: {
      subject,
      estMinutes,
      pages: hasPages ? pageTexts.length : rawSections.length,
      author: clean(author, 60),
    },
    notes: `Apresente o tema «${deckTitle}» em 1–2 minutos. Pergunte à turma o que já conhece antes de avançar para a agenda.`,
    durationMin: 2,
  });

  // Slide 2: Agenda (when there are >= 2 topics)
  const agendaItems = rawSections
    .map((sec) => sec.heading)
    .filter(Boolean)
    .slice(0, 6);
  if (agendaItems.length >= 2) {
    slides.push({
      id: 's-agenda',
      index: slides.length + 1,
      layout: 'agenda',
      kicker: 'Roteiro da Sessão',
      title: 'Estrutura da aula',
      subtitle: `${agendaItems.length} blocos organizados automaticamente a partir do documento.`,
      bullets: agendaItems,
      visual: '',
      notes: 'Mostre o mapa geral da sessão para criar âncoras mentais antes dos detalhes técnicos.',
      durationMin: 2,
    });
  }

  // Content slides with varied visual layouts
  const defs = Array.isArray(analysis.definitions) ? analysis.definitions : [];
  let defCursor = 0;

  for (let i = 0; i < rawSections.length && slides.length < 18; i += 1) {
    const sec = rawSections[i];
    const sents = sec.sentences.length ? sec.sentences : [clean(sec.raw, 220)];
    const chunks = chunkList(sents, 4);

    for (let ci = 0; ci < chunks.length && slides.length < 18; ci += 1) {
      const part = chunks[ci];
      const formulaLine = part.find((s) => FORMULA_PATTERN.test(s));
      const matchedDef = defs[defCursor];
      const suffix = chunks.length > 1 ? ` (${ci + 1}/${chunks.length})` : '';
      const slideTitle = clean(`${sec.heading}${suffix}`, 72);

      if (formulaLine && ci === 0 && part.length <= 3) {
        slides.push({
          id: `s-c-${i}-${ci}`,
          index: slides.length + 1,
          layout: 'highlight',
          kicker: `Página ${sec.page} · Destaque Técnico`,
          title: slideTitle,
          highlight: clean(formulaLine, 145),
          bullets: part.filter((s) => !isSameSentence(s, formulaLine)).slice(0, 2).map((s) => clean(s, 145)),
          notes: `Explique passo a passo a relação destacada. Peça um exemplo numérico à turma antes de avançar.`,
          durationMin: 4,
          page: sec.page,
        });
      } else if (matchedDef && (i % 3 === 0) && ci === 0) {
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
          bullets: extraBullets,
          visual,
          notes: `Enfatize a definição de «${matchedDef.term}». Convide um estudante a reformulá-la por palavras próprias.`,
          durationMin: 4,
          page: sec.page,
        });
      } else if (i % 2 === 1 && ci === 0) {
        slides.push({
          id: `s-c-${i}-${ci}`,
          index: slides.length + 1,
          layout: 'split',
          kicker: `Página ${sec.page} · Síntese Visual`,
          title: slideTitle,
          subtitle: clean(part[0] || '', 160),
          bullets: part.slice(1, 3).map((s) => clean(s, 138)),
          visual,
          notes: `Use a coluna esquerda para contextualizar e os pontos à direita para consolidar os passos práticos.`,
          durationMin: 4,
          page: sec.page,
        });
      } else {
        slides.push({
          id: `s-c-${i}-${ci}`,
          index: slides.length + 1,
          layout: 'bullets',
          kicker: `Página ${sec.page} · Desenvolvimento`,
          title: slideTitle,
          bullets: part.slice(0, 4).map((s) => clean(s, 155)),
          notes: `Percorra cada tópico sem ler integralmente o ecrã; destaque palavras-chave e ligue a exemplos locais.`,
          durationMin: 3,
          page: sec.page,
        });
      }
    }
  }

  // Final slide: Summary & Classroom Check
  const checkQuestions = (analysis.quiz || [])
    .slice(0, 2)
    .map((q) => clean(q.prompt, 150));
  const closingPoints = (analysis.keyIdeas || []).slice(0, 3).map((k) => clean(k, 145));
  slides.push({
    id: 's-closing',
    index: slides.length + 1,
    layout: 'closing',
    kicker: 'Fecho & Verificação em Sala',
    title: 'Síntese final e perguntas à turma',
    bullets: closingPoints.length ? closingPoints : rawSections.slice(0, 3).map((s) => s.heading),
    checkQuestions: checkQuestions.length
      ? checkQuestions
      : [`Qual foi o conceito mais decisivo de «${deckTitle}» e onde o aplicaria?`],
    notes: 'Reserve 3 minutos finais para verificar a compreensão com a turma antes de encerrar a aula.',
    durationMin: 3,
  });

  // Reading Mode clean document sections
  const readingSections = rawSections.map((sec, idx) => ({
    id: `sec-${idx + 1}`,
    number: idx + 1,
    page: sec.page,
    heading: sec.heading,
    paragraphs: sec.raw.split(/\n+/).map((p) => p.trim()).filter(Boolean),
  }));

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
      keywords: (analysis.keywords || []).slice(0, 6).map((k) => k.term),
    },
    slides,
    reading: {
      title: deckTitle,
      centralIdea: clean(analysis.centralIdea || '', 220),
      definitions: defs.slice(0, 6),
      sections: readingSections,
      fullText,
    },
  };
}
