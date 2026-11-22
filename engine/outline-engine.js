// CEU Academy · 2-Stage Editable Pedagogical Outline Engine (Gamma-style)
// Stage 1: Transforms extracted PDF/document text into an editable card outline
// mapped to the canonical 11-label Ingenium / Núcleo CEU teaching rhythm.
// Teachers can reorder, toggle, edit, add cards, choose level/language/density,
// and then render Stage 2 slides cleanly with zero wall-of-text density.

import { buildAdaptiveDocumentDeck, detectDocumentType } from './doc-analyzer.js?v=1';

const clean = (s, max = 180) => String(s ?? '').replace(/\s+/g, ' ').trim().slice(0, max);

export const CANONICAL_RHYTHM = {
  pt: [
    'ABERTURA',
    'ROTEIRO',
    'OBJECTIVOS',
    'IDEIA-CHAVE',
    'EXEMPLO & IDEIAS',
    'RELAÇÃO FORMAL',
    'PASSO A PASSO',
    'MAPA DE CONCEITOS',
    'VERIFICAÇÃO',
    'A WEB ACRESCENTA · EXTERNO',
    'SÍNTESE',
  ],
  en: [
    'OPENING',
    'AGENDA',
    'OBJECTIVES',
    'KEY IDEA',
    'EXAMPLES & IDEAS',
    'FORMAL RELATION',
    'STEP BY STEP',
    'CONCEPT MAP',
    'CHECKPOINT',
    'WEB EXTENSION · EXTERNAL',
    'SYNTHESIS',
  ],
};

export const LEVEL_PROFILES = {
  secundario: { pt: 'Ensino Secundário', en: 'High School', maxBullets: 3, bulletMaxChars: 120 },
  universitario: { pt: 'Universitário', en: 'University', maxBullets: 4, bulletMaxChars: 145 },
  profissional: { pt: 'Formação Profissional', en: 'Vocational / Pro', maxBullets: 4, bulletMaxChars: 135 },
};

export const DENSITY_PROFILES = {
  essencial: { label: 'Essencial (6–7 slides)', target: 7 },
  completo: { label: 'Completo (10–11 slides)', target: 11 },
  detalhado: { label: 'Detalhado por secção', target: 16 },
};

const FORMULA_RE = /(?:[A-Za-zÀ-ÿ]\s*=\s*[^.,;]{2,48}|[∑∫√ΔπλΩ]|->|→|\^2|\^\d)/;
const COMPARE_RE = /\b(vs\.?|versus|diferença entre|ao contrário|enquanto|por outro lado|whereas|unlike|compared to)\b/i;
const STEP_RE = /(?:(?:^|\n)\s*\d+[.)]\s|\b(?:primeiro|segundo|terceiro|passo|etapa|depois|finalmente|first|then|finally|step)\b)/i;

function splitSentences(text) {
  return String(text || '')
    .replace(/\r\n?/g, '\n')
    .split(/(?<=[.!?])\s+|\n+/)
    .map((s) => s.replace(/^#+\s*/, '').replace(/\s+/g, ' ').trim())
    .filter((s) => s.length >= 16);
}

function trimBullet(text, maxChars = 145) {
  const s = clean(text.replace(/^[-•*\d.)\s]+/, ''), 400);
  if (s.length <= maxChars) return s;
  const cut = s.slice(0, maxChars - 1).replace(/\s+\S*$/, '');
  return `${cut.replace(/[,;:]$/, '')}…`;
}

function extractSections(text = '', pageTexts = []) {
  const rawPages = Array.isArray(pageTexts) && pageTexts.length
    ? pageTexts
    : [{ page: 1, text: String(text || '') }];

  const sections = [];
  let cur = null;

  for (const p of rawPages) {
    const lines = String(p.text || '').replace(/\r\n?/g, '\n').split('\n');
    for (const rawLine of lines) {
      const line = rawLine.trim();
      if (!line) continue;
      const isMdH = line.startsWith('## ') || line.startsWith('# ');
      const isShortH = !isMdH && line.length >= 4 && line.length <= 64 && !/[.!?]$/.test(line) && line.split(/\s+/).length <= 9 && /^[A-ZÁÀÂÃÉÈÊÍÌÓÒÔÕÚÙÇ0-9]/.test(line);
      if (isMdH || (isShortH && (!cur || cur.body.length >= 1))) {
        if (cur && cur.body.length) sections.push(cur);
        cur = { heading: clean(line.replace(/^#+\s*/, '').replace(/^\d+[.)]\s*/, ''), 62), page: p.page || 1, body: [] };
      } else {
        if (!cur) cur = { heading: clean(line.split(/[:.;—]/)[0], 56) || `Tópico ${sections.length + 1}`, page: p.page || 1, body: [] };
        cur.body.push(line);
      }
    }
  }
  if (cur && cur.body.length) sections.push(cur);

  if (!sections.length && String(text || '').trim().length >= 30) {
    const sents = splitSentences(text);
    for (let i = 0; i < sents.length; i += 3) {
      const slice = sents.slice(i, i + 3);
      sections.push({
        heading: clean(slice[0].split(/[:.;,]/)[0], 56) || `Bloco ${sections.length + 1}`,
        page: 1,
        body: slice,
      });
    }
  }
  return sections;
}

export function detectLanguage(text = '') {
  const t = String(text || '').toLowerCase();
  const pt = (t.match(/\b(não|para|com|uma|são|como|porque|também|entre|sobre|aula|estudo|energia|força|dados|função)\b/g) || []).length;
  const en = (t.match(/\b(the|and|with|that|from|which|students|learning|system|energy|force|function|however)\b/g) || []).length;
  return en > pt * 1.35 ? 'en' : 'pt';
}

/**
 * Step 1: Generates a Gamma-style editable pedagogical outline.
 */
export function buildEditableOutline({
  title = '',
  subject = 'geral',
  text = '',
  pageTexts = [],
  sourceName = '',
  level = 'universitario',
  language = 'auto',
  density = 'completo',
  forcedDocType = 'auto',
} = {}) {
  const combinedText = String(text || (Array.isArray(pageTexts) ? pageTexts.map((p) => p.text).join('\n\n') : '')).trim();
  const lang = language === 'auto' ? detectLanguage(combinedText) : (language === 'en' ? 'en' : 'pt');

  // If this is an Ata, Relatório, Regulamento, Científico, or Plano, build a domain-tailored outline!
  const adaptive = buildAdaptiveDocumentDeck(combinedText, {
    title,
    sourceName,
    forcedType: forcedDocType,
    language: lang,
  });
  if (adaptive && adaptive.ok && Array.isArray(adaptive.slides) && adaptive.slides.length) {
    return {
      id: `outline-${Date.now().toString(36)}`,
      docType: adaptive.docType,
      docTypeMeta: adaptive.docTypeMeta,
      coreMessage: adaptive.docAnalysis?.extracted?.coreMessage || '',
      title: adaptive.title,
      subject: adaptive.docType,
      sourceName: adaptive.sourceName,
      level,
      language: lang,
      density,
      targetSlides: adaptive.slides.length,
      rawText: combinedText.slice(0, 24000),
      cards: adaptive.slides.map((s, idx) => ({
        id: s.id || `out-doc-${idx + 1}`,
        enabled: true,
        rhythm: s.rhythm || adaptive.docTypeMeta.shortLabel.toUpperCase(),
        title: s.title,
        layout: s.layout,
        bullets: s.bullets && s.bullets.length ? s.bullets : (s.steps && s.steps.length ? s.steps : (s.subtitle ? [s.subtitle] : [])),
        page: s.page || 1,
        left: s.left || '',
        right: s.right || '',
        steps: s.steps || [],
        quote: s.quote || '',
        intuition: s.intuition || '',
        handNote: s.handNote || s.handnote || 'Mensagem-chave ✎',
        teacherNote: s.notes || s.teacherNote || '',
        sourceAnchor: adaptive.sourceName,
      })),
    };
  }

  const L = lang === 'en';
  const prof = LEVEL_PROFILES[level] || LEVEL_PROFILES.universitario;
  const dens = DENSITY_PROFILES[density] || DENSITY_PROFILES.completo;
  const sections = extractSections(combinedText, pageTexts);
  const deckTitle = clean(title || sections[0]?.heading || sourceName || (L ? 'Interactive Lesson' : 'Aula Interactiva'), 65);
  const formulas = splitSentences(combinedText).filter((s) => FORMULA_RE.test(s));

  const cards = [];
  const pushCard = (rhythm, cardTitle, layout, bullets, extra = {}) => {
    cards.push({
      id: `out-${cards.length + 1}-${Date.now().toString(36).slice(-3)}`,
      enabled: true,
      rhythm,
      title: clean(cardTitle, 64),
      layout,
      bullets: (Array.isArray(bullets) ? bullets : []).map((b) => trimBullet(b, prof.bulletMaxChars)).filter(Boolean).slice(0, prof.maxBullets),
      page: extra.page || null,
      formula: extra.formula || '',
      left: extra.left || '',
      right: extra.right || '',
      steps: extra.steps || [],
      nodes: extra.nodes || [],
      question: extra.question || '',
      options: extra.options || [],
      correct: Number.isInteger(extra.correct) ? extra.correct : 0,
      explanation: extra.explanation || '',
      handNote: clean(extra.handNote || (L ? 'Notice this ✎' : 'Repara nisto ✎'), 40),
      teacherNote: clean(extra.teacherNote || (L
        ? `Present "${cardTitle}" clearly, connect to a real classroom example, and ask one student to paraphrase before moving on.`
        : `Apresente «${cardTitle}» com clareza, ligue a um exemplo real em sala e peça a um estudante para reformular antes de avançar.`), 420),
      sourceAnchor: clean(extra.sourceAnchor || deckTitle, 140),
    });
  };

  // 1. ABERTURA
  const hookQ = L
    ? `Why does "${deckTitle}" matter in real problems today?`
    : `Porque é que «${deckTitle}» importa em problemas reais hoje?`;
  pushCard(
    L ? 'OPENING' : 'ABERTURA',
    deckTitle,
    'cover',
    [hookQ],
    {
      page: 1,
      handNote: L ? 'Start with intuition ✎' : 'Começa pela intuição ✎',
      teacherNote: L
        ? `Open the session on "${deckTitle}". Ask the hook question aloud and collect 2 student intuitions before revealing the agenda.`
        : `Abra a sessão sobre «${deckTitle}». Faça a pergunta-gancho em voz alta e recolha 2 intuições da turma antes de avançar para o roteiro.`,
    }
  );

  // 2. ROTEIRO (for completo / detalhado)
  if (density !== 'essencial' && sections.length >= 2) {
    pushCard(
      L ? 'AGENDA' : 'ROTEIRO',
      L ? 'Lesson roadmap' : 'Roteiro da aula',
      'agenda',
      sections.slice(0, 4).map((s) => s.heading),
      {
        handNote: L ? 'Step by step →' : 'O mapa da aula →',
        teacherNote: L
          ? 'Walk through the 4 blocks in under 60 seconds so students know where the lesson is heading.'
          : 'Percorra o mapa da aula em menos de 1 minuto para dar clareza e estrutura mental à turma.',
      }
    );
  }

  // 3. OBJECTIVOS
  const objVerbs = L ? ['Identify', 'Apply', 'Analyze'] : ['Identificar', 'Aplicar', 'Analisar'];
  const objectives = sections.slice(0, 3).map((s, i) => `${objVerbs[i % objVerbs.length]} ${s.heading.toLowerCase()}`);
  while (objectives.length < 3) {
    objectives.push(L ? `Apply ${deckTitle.toLowerCase()} to a practical case` : `Aplicar ${deckTitle.toLowerCase()} a um caso prático`);
  }
  pushCard(
    L ? 'OBJECTIVES' : 'OBJECTIVOS',
    L ? 'What you will master' : 'Objectivos de aprendizagem',
    'objectives',
    objectives.slice(0, 3),
    {
      handNote: L ? 'Clear goal = focus ✓' : 'Meta clara = foco ✓',
      teacherNote: L
        ? 'Read the learning outcomes aloud and ask which one students already feel confident about.'
        : 'Leia os objectivos em voz alta e pergunte à turma qual destes pontos já conhece ou precisa de reforço.',
    }
  );

  // 4..8 Content slides mapped from extracted sections
  const maxContent = density === 'essencial' ? 2 : (density === 'completo' ? 5 : Math.min(10, Math.max(4, sections.length)));
  let hasFormulaCard = false;
  let hasStepsCard = false;

  sections.slice(0, maxContent).forEach((sec, idx) => {
    const rawBody = sec.body.join(' ');
    const sents = splitSentences(rawBody);
    const fLine = sents.find((s) => FORMULA_RE.test(s));

    if (fLine && !hasFormulaCard) {
      hasFormulaCard = true;
      pushCard(
        L ? 'FORMAL RELATION' : 'RELAÇÃO FORMAL',
        sec.heading,
        'formula',
        sents.filter((s) => s !== fLine).slice(0, 3),
        {
          page: sec.page,
          formula: clean(fLine, 120),
          steps: sents.filter((s) => s !== fLine).slice(0, 3).map((s) => trimBullet(s, 130)),
          handNote: L ? 'Inspect every symbol ✎' : 'Cada símbolo conta ✎',
          teacherNote: L
            ? `Unpack the formal relationship "${clean(fLine, 60)}" symbol by symbol. Have students test a quick numerical example.`
            : `Explique a relação formal «${clean(fLine, 60)}» símbolo a símbolo e resolva um exemplo rápido no quadro com a turma.`,
          sourceAnchor: fLine,
        }
      );
    } else if (COMPARE_RE.test(rawBody)) {
      const m = rawBody.match(/([A-ZÀ-ÿa-z][^.;,]{2,32}?)\s+(?:vs\.?|versus|enquanto|ao contrário (?:do|da|de)|whereas|unlike)\s+([A-ZÀ-ÿa-z][^.;,]{2,32})/i);
      pushCard(
        L ? 'EXAMPLES & IDEAS' : 'EXEMPLO & IDEIAS',
        sec.heading,
        'comparison',
        sents.slice(0, 3),
        {
          page: sec.page,
          left: m ? clean(m[1], 44) : (L ? 'Concept A' : 'Perspectiva A'),
          right: m ? clean(m[2], 44) : (L ? 'Concept B' : 'Perspectiva B'),
          handNote: L ? 'Spot the contrast ⚖' : 'Nota o contraste ⚖',
          teacherNote: L
            ? `Contrast both columns explicitly and invite students to suggest one real-world example for each side.`
            : `Compare os dois lados de forma directa e convide os estudantes a dar um exemplo real para cada coluna.`,
          sourceAnchor: sents[0] || sec.heading,
        }
      );
    } else if (STEP_RE.test(rawBody) && !hasStepsCard) {
      hasStepsCard = true;
      const steps = sents.slice(0, 4).map((s) => trimBullet(s, 135));
      pushCard(
        L ? 'STEP BY STEP' : 'PASSO A PASSO',
        sec.heading,
        'animated-flow',
        steps,
        {
          page: sec.page,
          steps,
          handNote: L ? 'Follow the order →' : 'Segue a sequência →',
          teacherNote: L
            ? 'Reveal one step at a time and ask the class to predict the next step before showing it.'
            : 'Revele um passo de cada vez e peça à turma para prever o passo seguinte antes de o mostrar.',
          sourceAnchor: steps[0] || sec.heading,
        }
      );
    } else if (idx === 0) {
      pushCard(
        L ? 'KEY IDEA' : 'IDEIA-CHAVE',
        sec.heading,
        'concept',
        sents.slice(0, 3),
        {
          page: sec.page,
          handNote: L ? 'Remember this ✎' : 'Repara nisto ✎',
          teacherNote: L
            ? `Anchor the entire lesson on "${sec.heading}". Explain intuitively first, then confirm the exact wording from the source.`
            : `Ancore a aula em «${sec.heading}». Comece pela intuição simples e só depois confirme a definição formal do ficheiro.`,
          sourceAnchor: sents[0] || sec.heading,
        }
      );
    } else {
      pushCard(
        L ? 'EXAMPLES & IDEAS' : 'EXEMPLO & IDEIAS',
        sec.heading,
        idx % 2 === 1 ? 'split' : 'bullets',
        sents.slice(0, prof.maxBullets),
        {
          page: sec.page,
          handNote: L ? 'Apply to real life ✎' : 'Liga ao quotidiano ✎',
          teacherNote: L
            ? `Discuss each crisp card in "${sec.heading}" without reading verbatim; prompt one concrete local example.`
            : `Percorra os cartões de «${sec.heading}» sem ler palavra por palavra; peça um exemplo concreto em Angola.`,
          sourceAnchor: sents[0] || sec.heading,
        }
      );
    }
  });

  // If a formula existed in text but wasn't placed yet
  if (!hasFormulaCard && formulas.length && density !== 'essencial') {
    pushCard(
      L ? 'FORMAL RELATION' : 'RELAÇÃO FORMAL',
      L ? 'Core formula & rule' : 'Relação formal essencial',
      'formula',
      [formulas[0]],
      {
        formula: clean(formulas[0], 120),
        steps: [L ? 'Identify the known quantities and units.' : 'Identifique os dados conhecidos e as unidades.', L ? 'Substitute carefully and check the final unit.' : 'Substitua os valores e confirme a unidade final.'],
        handNote: L ? 'Check the units! ✎' : 'Atenção às unidades! ✎',
      }
    );
  }

  // MAPA DE CONCEITOS (for completo / detalhado)
  if (density !== 'essencial' && sections.length >= 2) {
    const nodes = sections.slice(0, 5).map((s) => ({
      term: clean(s.heading, 34),
      note: trimBullet(s.body[0] || s.heading, 85),
    }));
    pushCard(
      L ? 'CONCEPT MAP' : 'MAPA DE CONCEITOS',
      L ? `Concept map: ${clean(deckTitle, 38)}` : `Mapa de conceitos: ${clean(deckTitle, 38)}`,
      'mindmap',
      nodes.map((n) => `${n.term}: ${n.note}`),
      {
        nodes,
        handNote: L ? 'Everything connects ✦' : 'Tudo se conecta ✦',
        teacherNote: L
          ? 'Use this SVG concept map to show how all ideas connect into one mental model.'
          : 'Use este mapa visual para mostrar à turma como todos os conceitos do ficheiro se ligam num só sistema.',
      }
    );
  }

  // VERIFICAÇÃO (always included — Curipod-style interactive checkpoint!)
  const firstSec = sections[0] || { heading: deckTitle, body: [combinedText] };
  const correctAns = trimBullet(splitSentences(firstSec.body.join(' '))[0] || deckTitle, 95);
  pushCard(
    L ? 'CHECKPOINT' : 'VERIFICAÇÃO',
    L ? 'Quick check (30s)' : 'Verificação rápida (30s)',
    'quiz',
    [],
    {
      question: L
        ? `Which statement accurately reflects "${firstSec.heading}" from our material?`
        : `Qual afirmação traduz correctamente «${firstSec.heading}» segundo o material da aula?`,
      options: [
        correctAns,
        L ? 'It is unrelated to the core mechanism discussed in this unit.' : 'Não tem ligação directa com o mecanismo central estudado nesta unidade.',
        L ? 'It only applies when all variables are ignored or set to zero.' : 'Aplica-se apenas quando todas as variáveis principais são ignoradas.',
      ],
      correct: 0,
      explanation: correctAns,
      handNote: L ? 'Vote before reveal! ✎' : 'Pensa antes de clicar! ✎',
      teacherNote: L
        ? 'Give 30 seconds of silent thinking (press T for timer), ask students to vote A/B/C, then reveal the explanation.'
        : 'Dê 30 segundos em silêncio (prima T para o cronómetro), peça votos A/B/C à turma e só depois revele a resposta.',
    }
  );

  // SÍNTESE + Exit Ticket (always included)
  const recap = sections.slice(0, 3).map((s) => trimBullet(`${s.heading}: ${splitSentences(s.body.join(' '))[0] || s.heading}`, 130));
  pushCard(
    L ? 'SYNTHESIS' : 'SÍNTESE',
    L ? 'Recap & Exit Ticket' : 'Síntese & Bilhete de Saída',
    'closing',
    recap.length ? recap : [trimBullet(deckTitle, 120)],
    {
      handNote: L ? '1-min Exit Ticket ✓' : 'Bilhete de Saída ✎',
      teacherNote: L
        ? 'Close with the 3 key takeaways and give 1 minute for the Exit Ticket prompt before students leave.'
        : 'Encerre com as 3 ideias essenciais e dê 1 minuto para cada aluno responder ao Bilhete de Saída.',
    }
  );

  return {
    id: `outline-${Date.now().toString(36)}`,
    title: deckTitle,
    subject,
    sourceName: clean(sourceName || deckTitle, 90),
    level,
    language: lang,
    density,
    targetSlides: dens.target,
    rawText: combinedText.slice(0, 24000),
    cards,
  };
}

/* Pure outline editing operations */
export function moveOutlineCard(outline, index, delta) {
  if (!outline || !Array.isArray(outline.cards)) return outline;
  const next = index + delta;
  if (index < 0 || index >= outline.cards.length || next < 0 || next >= outline.cards.length) return outline;
  const copy = outline.cards.slice();
  const [item] = copy.splice(index, 1);
  copy.splice(next, 0, item);
  return { ...outline, cards: copy };
}

export function toggleOutlineCard(outline, cardId) {
  if (!outline || !Array.isArray(outline.cards)) return outline;
  return {
    ...outline,
    cards: outline.cards.map((c) => (c.id === cardId ? { ...c, enabled: !c.enabled } : c)),
  };
}

export function updateOutlineCard(outline, cardId, patch = {}) {
  if (!outline || !Array.isArray(outline.cards)) return outline;
  return {
    ...outline,
    cards: outline.cards.map((c) => (c.id === cardId ? { ...c, ...patch } : c)),
  };
}

export function addOutlineCard(outline, card = {}) {
  if (!outline || !Array.isArray(outline.cards)) return outline;
  const L = outline.language === 'en';
  const nextCard = {
    id: `out-custom-${Date.now().toString(36)}`,
    enabled: true,
    rhythm: card.rhythm || (L ? 'EXAMPLES & IDEAS' : 'EXEMPLO & IDEIAS'),
    title: clean(card.title || (L ? 'New slide topic' : 'Novo tópico da aula'), 64),
    layout: card.layout || 'bullets',
    bullets: Array.isArray(card.bullets) && card.bullets.length
      ? card.bullets.slice(0, 4)
      : [L ? 'Key idea to explain in class' : 'Ideia central a explicar em sala'],
    handNote: clean(card.handNote || (L ? 'Key point ✎' : 'Repara nisto ✎'), 40),
    teacherNote: clean(card.teacherNote || (L ? 'Guide students through this custom point with a live example.' : 'Explique este ponto personalizado com um exemplo prático em sala.'), 300),
    sourceAnchor: outline.sourceName,
  };
  const copy = outline.cards.slice();
  copy.splice(Math.max(1, copy.length - 1), 0, nextCard);
  return { ...outline, cards: copy };
}

/**
 * Step 2: Renders the edited Outline into a full Núcleo CEU / Ingenium deck object.
 */
export function buildDeckFromOutline(outline, { author = 'Docente Núcleo CEU', theme = 'editorial' } = {}) {
  const active = (outline?.cards || []).filter((c) => c.enabled !== false);
  const L = outline?.language === 'en';
  const wordCount = (String(outline?.rawText || '').match(/[\p{L}\p{N}]+/gu) || []).length;
  const estMinutes = Math.max(8, active.length * 3);

  const slides = active.map((c, idx) => {
    const base = {
      id: c.id || `s-${idx + 1}`,
      index: idx + 1,
      layout: c.layout || 'bullets',
      rhythm: c.rhythm,
      kicker: `${c.rhythm}${c.page ? ` · Pág. ${c.page}` : ''}`,
      title: clean(c.title, 65),
      bullets: (c.bullets || []).slice(0, 4).map((b) => trimBullet(b, 148)),
      handnote: clean(c.handNote || (L ? 'Notice this ✎' : 'Repara nisto ✎'), 40),
      handNote: clean(c.handNote || (L ? 'Notice this ✎' : 'Repara nisto ✎'), 40),
      notes: clean(c.teacherNote, 420),
      teacherNote: clean(c.teacherNote, 420),
      durationMin: c.layout === 'cover' || c.layout === 'agenda' ? 2 : 3,
      page: c.page || null,
      clusterKey: c.title,
      sources: [{ label: c.page ? `PDF p.${c.page}` : (outline.sourceName || 'Núcleo CEU'), kind: 'pdf' }],
    };

    if (c.layout === 'cover') {
      base.subtitle = c.bullets[0] || '';
      base.bullets = [];
      base.meta = { subject: outline.subject, estMinutes, pages: active.length, author };
    } else if (c.layout === 'formula') {
      base.formula = c.formula || c.bullets[0] || '';
      base.steps = (c.steps && c.steps.length) ? c.steps : c.bullets.slice(0, 3);
    } else if (c.layout === 'comparison') {
      base.left = c.left || (L ? 'Perspective A' : 'Lado A');
      base.right = c.right || (L ? 'Perspective B' : 'Lado B');
    } else if (c.layout === 'animated-flow' || c.layout === 'timeline') {
      base.steps = (c.steps && c.steps.length) ? c.steps : c.bullets;
    } else if (c.layout === 'mindmap') {
      base.center = outline.title;
      base.nodes = (c.nodes && c.nodes.length) ? c.nodes : c.bullets.map((b) => ({ term: b.split(':')[0], note: b.split(':')[1] || '' }));
    } else if (c.layout === 'quiz') {
      base.question = c.question || c.title;
      base.options = (c.options && c.options.length) ? c.options : [L ? 'Option A' : 'Opção A', L ? 'Option B' : 'Opção B'];
      base.correct = c.correct || 0;
      base.explanation = c.explanation || base.options[0];
    } else if (c.layout === 'concept') {
      base.subtitle = c.bullets[0] || '';
      base.bullets = c.bullets.slice(1, 4);
    } else if (c.layout === 'closing') {
      base.checkQuestions = [
        L ? `Exit Ticket: In 1 sentence, what was the key breakthrough in "${outline.title}"?` : `Bilhete de Saída: Em 1 frase, qual foi a ideia mais importante de «${outline.title}»?`,
        L ? 'Which concept would you like to practice more next class?' : 'Que conceito gostaria de praticar mais na próxima aula?',
      ];
    }
    return base;
  });

  const sections = active
    .filter((c) => !['cover', 'agenda', 'closing'].includes(c.layout))
    .map((c, i) => ({
      id: `sec-${i + 1}`,
      number: i + 1,
      page: c.page || 1,
      heading: c.title,
      paragraphs: c.bullets.length ? c.bullets : [c.teacherNote],
      keyTerms: [c.title.split(/\s+/).slice(0, 2).join(' ')],
      checkQuestion: c.question || (L ? `Explain "${c.title}" in your own words.` : `Explique «${c.title}» por palavras próprias.`),
      sourceAnchor: c.sourceAnchor || c.title,
    }));

  return {
    ok: true,
    id: `ceu-deck-${Date.now()}`,
    brand: 'Núcleo CEU',
    credit: 'APP FEITO PELA HORIZONTE FUTURO',
    title: outline.title,
    subject: outline.subject || 'geral',
    sourceName: outline.sourceName || outline.title,
    language: outline.language || 'pt',
    level: outline.level || 'universitario',
    density: outline.density || 'completo',
    theme,
    createdAt: new Date().toISOString(),
    outlineId: outline.id,
    stats: {
      slides: slides.length,
      words: wordCount,
      estMinutes,
      pages: Math.max(1, sections.length),
      keywords: sections.slice(0, 6).map((s) => s.heading),
      level: outline.level || 'universitario',
    },
    slides,
    plan: {
      blocks: sections.map((s, idx) => ({
        key: s.heading,
        heading: s.heading,
        source: s.paragraphs.slice(0, 4),
        page: s.page,
        kept: s.paragraphs.length,
        read: s.paragraphs.length,
        objective: L ? `Master ${s.heading.toLowerCase()}` : `Dominar ${s.heading.toLowerCase()}`,
        slideIndexes: [idx + 2],
      })),
      condensed: { sentencesRead: Math.max(slides.length * 2, sections.length * 3), ideasKept: slides.length, removed: 0 },
      keywords: sections.slice(0, 6).map((s) => s.heading),
      steps: [
        L
          ? `Editable Outline confirmed (${slides.length} cards, ${outline.density} density, ${outline.level} level).`
          : `Roteiro editável confirmado (${slides.length} cartões, densidade ${outline.density}, nível ${outline.level}).`,
      ],
    },
    reading: {
      title: outline.title,
      centralIdea: slides[0]?.subtitle || outline.title,
      definitions: sections.slice(0, 5).map((s) => ({ term: s.heading, sentence: s.paragraphs[0] || s.heading })),
      sections,
      fullText: outline.rawText || '',
    },
  };
}
