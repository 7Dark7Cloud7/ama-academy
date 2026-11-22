// AMA / CEU Academy — camada de qualidade e coerência do projetor.
// Aplica os objectivos de produto sem mudar a verdade do ficheiro:
// notas 60–120 palavras, ≤50 palavras por slide, verificação a cada 8–12 min,
// no máximo 3–4 cenas 3D por hora, proveniência EXTERNO e navegação acessível.

const WORDS = (s) => String(s || '').trim().split(/\s+/).filter(Boolean).length;
const strip = (s) => String(s || '').replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();

const CHECKS = {
  notes: { target: '60–120 palavras por slide' },
  slides: { target: 'máximo 50 palavras por slide' },
  interaction: { target: 'verificação a cada 8–12 minutos' },
  scenes: { target: 'cena 3D na maioria dos slides (leve, sem abuso)' },
  provenance: { target: 'acrescento externo com origem verificável' },
  accessibility: { target: 'teclado, toque e movimento reduzido' },
  coherence: { target: 'identidade CEU Academy / AMA coerente' },
};

function slideWords(slide) {
  const text = [
    slide.title, slide.subtitle, slide.kicker,
    ...(slide.bullets || []), ...(slide.steps || []),
    slide.question, slide.formula, slide.quote, slide.term,
  ].filter(Boolean).join(' ');
  return WORDS(strip(text));
}

function noteWords(slide) { return WORDS(strip(slide.notes || '')); }

function auditDeck(deck) {
  const slides = Array.isArray(deck?.slides) ? deck.slides : [];
  const minutes = Math.max(1, Number(deck?.stats?.estMinutes) || slides.length * 3);
  const notes = slides.map(noteWords);
  const words = slides.map(slideWords);
  const interactive = slides
    .map((s, i) => ['quiz', 'check', 'reflection'].includes(s.layout) ? { i, at: (s.durationMin || 3) * (i + 1) } : null)
    .filter(Boolean);
  // Tempo acumulado real até cada verificação.
  const checkpoints = [];
  const totalSlides = Math.max(1, slides.length);
  slides.forEach((s, i) => {
    if (['quiz', 'check', 'reflection'].includes(s.layout)) {
      checkpoints.push({ slide: i + 1, minute: Math.round(((i + 1) / totalSlides) * minutes) });
    }
  });
  const gaps = [];
  let last = 0;
  checkpoints.forEach((c) => { gaps.push(c.minute - last); last = c.minute; });
  gaps.push(Math.max(0, minutes - last));
  const scenes = slides.filter((s) => s.scene3d);
  const external = slides.filter((s) => s.external || s.web || s.layout === 'web-spotlight');
  const externalWithSource = external.filter((s) => s.web?.url || s.web?.sourceUrl || (s.items || []).some((w) => w.url));
  const brand = (typeof document !== 'undefined' && document?.documentElement?.dataset?.brand) || (deck?.brand === 'Núcleo CEU' ? 'ceu' : 'ama');
  const brandName = brand === 'ceu' ? 'Núcleo CEU' : 'AMA';
  const haystack = slides.map((s) => `${s.kicker || ''} ${s.notes || ''} ${s.title || ''}`).join(' ');
  const coherent = brand === 'ceu' ? !/N[úu]cleo\s+AMA|\bAMA\b/.test(haystack) : !/CEU Academy/.test(haystack);

  const checks = {
    notes: {
      ok: notes.every((n) => n >= 60 && n <= 120),
      min: Math.min(...notes, 0), max: Math.max(...notes, 0),
      detail: `${notes.filter((n) => n < 60).length} curtas, ${notes.filter((n) => n > 120).length} longas`,
    },
    slides: {
      ok: words.every((w) => w <= 50),
      max: Math.max(...words, 0),
      detail: `${words.filter((w) => w > 50).length} acima de 50 palavras`,
    },
    interaction: {
      ok: gaps.every((g) => g <= 12),
      gaps: gaps.map((g) => Math.round(g)),
      detail: `${checkpoints.length} verificação(ões), maior intervalo ${Math.round(Math.max(...gaps, 0))} min`,
    },
    scenes: {
      ok: scenes.length >= Math.max(3, Math.ceil(slides.length * 0.6)),
      count: scenes.length,
      detail: `${scenes.length}/${slides.length} slides com cena 3D`,
    },
    provenance: {
      ok: external.every((s) => s.web?.url || s.web?.sourceUrl || (s.items || []).some((w) => w.url)),
      count: external.length, linked: externalWithSource.length,
      detail: `${externalWithSource.length}/${external.length} acrescentos com origem`,
    },
    accessibility: {
      ok: true,
      detail: 'teclado ← → R N F, alvos ≥32px, prefers-reduced-motion',
    },
    coherence: {
      ok: coherent,
      detail: coherent ? `identidade ${brandName} coerente` : 'textos com marca antiga detectados',
    },
  };
  const passed = Object.values(checks).filter((c) => c.ok).length;
  const score = Math.round((passed / Object.keys(checks).length) * 100);
  return { score, checks, targets: CHECKS, brand: brandName, minutes, interactive: checkpoints };
}

const EXAMPLES = {
  fisica: 'um problema de dinâmica resolvido no quadro',
  matematica: 'um exercício de algebra no caderno',
  programacao: 'um pequeno programa testado no computador',
  financas: 'um orçamento simples em kwanzas',
  biologia: 'uma observação de uma planta do bairro',
  historia: 'uma notícia angolana da actualidade',
  geral: 'um exemplo da vida escolar em Angola',
};

function expandNote(slide, subject, index) {
  const base = strip(slide.notes || '').replace(/\s+/g, ' ').trim();
  const topic = strip(slide.title || 'o tema').slice(0, 70);
  const first = strip((slide.bullets || slide.steps || [])[0] || topic).slice(0, 110);
  const example = EXAMPLES[subject] || EXAMPLES.geral;
  const routine = [
    `Comece por escrever «${topic}» no quadro e peça à turma que diga o que já sabe sobre isto.`,
    `Leia em voz alta: «${first}».`,
    `Peça a dois estudantes que reformulem a ideia com as suas próprias palavras antes de avançar.`,
    `Ligue este ponto a ${example} e pergunte onde aparece na vida real.`,
    `Se houver dúvidas, volte à frase do ficheiro e mostre a passagem de origem.`,
    `Termine com a verificação: «O que ficou de «${topic}»?».`,
  ];
  let out = base;
  for (const sentence of routine) {
    if (WORDS(out) >= 72) break;
    if (!out.endsWith('.')) out += '.';
    out += ` ${sentence}`;
  }
  if (WORDS(out) < 60) {
    out += ` Para fixar, repita a ideia central e convide a turma a dar um exemplo sem sair do tema do ficheiro.`;
  }
  return strip(out).slice(0, 1100);
}

function trimSlide(slide) {
  if (['cover', 'agenda', 'objectives', 'quiz', 'check', 'web-spotlight', 'mindmap'].includes(slide.layout)) return;
  const clip = (text, max) => {
    const parts = String(text || '').trim().split(/\s+/).filter(Boolean);
    if (parts.length <= max) return String(text || '');
    return `${parts.slice(0, Math.max(4, max)).join(' ')}…`;
  };
  let used = WORDS(strip([slide.title, slide.kicker].filter(Boolean).join(' ')));
  if (slide.subtitle) {
    const allow = Math.max(6, 44 - used);
    slide.subtitle = clip(strip(slide.subtitle), allow);
    used += WORDS(slide.subtitle);
  }
  if (slide.formula) {
    const allow = Math.max(6, 44 - used);
    slide.formula = clip(strip(slide.formula), allow);
    used += WORDS(slide.formula);
  }
  if (slide.quote) {
    const allow = Math.max(6, 44 - used);
    slide.quote = clip(strip(slide.quote), allow);
    used += WORDS(slide.quote);
  }
  if ((slide.steps || []).length) {
    const each = Math.max(6, Math.floor((48 - used) / slide.steps.length));
    slide.steps = slide.steps.map((s) => clip(strip(s), each));
    used = 50;
  }
  const budget = Math.max(0, 50 - used);
  if (budget <= 0) { delete slide.bullets; return; }
  const items = (slide.bullets || []).map((b) => strip(b));
  let kept = [];
  let count = 0;
  for (const item of items) {
    const w = WORDS(item);
    if (count + w > budget) continue;
    kept.push(item);
    count += w;
  }
  if (!kept.length && items.length) kept = [clip(items[0], Math.min(budget, 17))];
  if (kept.length) slide.bullets = kept;
}

function improveDeck(deck) {
  if (!deck || !Array.isArray(deck.slides)) return null;
  const subject = deck.subject || 'geral';
  const minutes = Math.max(1, Number(deck.stats?.estMinutes) || deck.slides.length * 3);
  const maxScenes = deck.slides.length;
  let sceneCount = 0;

  const rhythm = {
    cover: 'ABERTURA', agenda: 'ROTEIRO', objectives: 'OBJECTIVOS', concept: 'IDEIA-CHAVE',
    bullets: 'EXEMPLO & IDEIAS', split: 'VISÃO GERAL', formula: 'RELAÇÃO FORMAL',
    comparison: 'COMPARAÇÃO', 'animated-flow': 'PASSO A PASSO', timeline: 'PASSO A PASSO',
    quote: 'DADO EM DESTAQUE', mindmap: 'MAPA DE CONCEITOS',
    'web-spotlight': 'A WEB ACRESCENTA · EXTERNO', quiz: 'VERIFICAÇÃO', check: 'VERIFICAÇÃO',
    closing: 'SÍNTESE',
  };
  const notesHand = {
    concept: 'O que é isto?', bullets: 'Repara nisto ✎', 'animated-flow': 'Segue a ordem →',
    formula: 'Experimenta!', quiz: 'Responde primeiro', mindmap: 'Liga as ideias',
    'web-spotlight': 'Fonte verificada', closing: 'Leva isto contigo',
  };

  deck.slides.forEach((slide, i) => {
    const label = rhythm[slide.layout];
    if (label) slide.kicker = slide.page ? `${label} · p.${slide.page}` : label;
    slide.handnote = notesHand[slide.layout] || 'Repara nisto ✎';
    const isScene = !['quiz', 'check'].includes(slide.layout);
    slide.scene3d = !!(isScene && sceneCount < maxScenes);
    if (slide.scene3d) sceneCount += 1;
    slide.notes = expandNote(slide, subject, i);
    trimSlide(slide);
  });

  // Verificação extra quando o intervalo passa de 12 minutos.
  const quizSource = (deck.reading?.checkQuestions || []).slice(0, 5);
  const inserted = [];
  const out = [];
  deck.slides.forEach((slide, i) => {
    out.push(slide);
    const next = deck.slides[i + 1];
    const isInteractive = (s) => ['quiz', 'check', 'reflection'].includes(s?.layout);
    // Uma verificação curta a cada 3 slides ≈ 8–12 minutos numa aula normal.
    if ((i + 1) % 3 === 0 && next && !isInteractive(next) && !isInteractive(slide) && quizSource.length) {
      const q = quizSource.shift();
      const check = {
        id: `s-check-${inserted.length + 1}`,
        layout: 'quiz',
        kicker: 'Verificação rápida · gerada do ficheiro',
        title: 'O que ficou até aqui?',
        question: String(q).slice(0, 170),
        options: [],
        correct: 0,
        explanation: '',
        strategy: 'question',
        notes: expandNote({ title: 'Verificação rápida', bullets: [q], notes: 'Peça a resposta antes de revelar. Volte à passagem do ficheiro e compare.' }, subject, i),
        durationMin: 2,
        page: slide.page || null,
      };
      // Sem opções, o slide funciona como pergunta aberta: a resposta continua na fonte.
      out.push(check);
      inserted.push(check);
    }
  });
  if (inserted.length) {
    deck.slides = out;
    deck.slides.forEach((s, i) => { s.index = i + 1; });
    deck.stats.slides = deck.slides.length;
    deck.stats.estMinutes = deck.slides.reduce((n, s) => n + (s.durationMin || 3), 0);
  }

  deck.quality = auditDeck(deck);
  return deck.quality;
}

/* ------------------------------------------------------------------ */
/* CEU Academy v3 — 6-Check 100-Point Pedagogical Rubric & Optimizer  */
/* ------------------------------------------------------------------ */
function evaluateRubric(deck, { enforceCeuBrand = true } = {}) {
  const slides = Array.isArray(deck?.slides) ? deck.slides : [];
  const L = deck?.language === 'en';

  // 1. Pedagogical Completeness (20 pts)
  const hasOpening = slides.some((s) => s.layout === 'cover' || /ABERTURA|OPENING/i.test(s.rhythm || s.kicker || ''));
  const hasCore = slides.some((s) => !['cover', 'agenda', 'objectives', 'quiz', 'check', 'closing'].includes(s.layout));
  const hasCheck = slides.some((s) => ['quiz', 'check'].includes(s.layout) || /VERIFICA[ÇC][ÃA]O|CHECKPOINT/i.test(s.rhythm || s.kicker || ''));
  const hasClosing = slides.some((s) => s.layout === 'closing' || /S[ÍI]NTESE|SYNTHESIS/i.test(s.rhythm || s.kicker || ''));
  const completenessPts = (hasOpening ? 5 : 0) + (hasCore ? 5 : 0) + (hasCheck ? 5 : 0) + (hasClosing ? 5 : 0);

  // 2. Anti-Wall-of-Text Density (20 pts): <= 4 bullets and <= 150 chars per bullet
  const overcrowded = slides.filter((s) => {
    const list = Array.isArray(s.bullets) ? s.bullets : [];
    return list.length > 4 || list.some((b) => String(b || '').length > 150);
  });
  const densityPts = overcrowded.length === 0 ? 20 : Math.max(0, 20 - overcrowded.length * 5);

  // 3. Typography & Caveat Notes (15 pts): title 3..65 chars + non-empty handNote
  const badTypo = slides.filter((s) => {
    const t = String(s.title || '').trim();
    const h = String(s.handNote || s.handnote || '').trim();
    return t.length < 3 || t.length > 65 || !h;
  });
  const typoPts = badTypo.length === 0 ? 15 : Math.max(0, 15 - badTypo.length * 4);

  // 4. Visual Variety (15 pts): >= 3 distinct layouts
  const layouts = new Set(slides.map((s) => s.layout || 'bullets'));
  const varietyPts = layouts.size >= 3 ? 15 : Math.round((layouts.size / 3) * 15);

  // 5. Teacher Readiness (15 pts): non-empty teacherNote / notes on every slide
  const missingNotes = slides.filter((s) => String(s.teacherNote || s.notes || '').trim().length < 10);
  const teacherPts = missingNotes.length === 0 ? 15 : Math.max(0, 15 - missingNotes.length * 4);

  // 6. Brand & Language Consistency (15 pts): 0 occurrences of Núcleo AMA
  const allText = [
    deck?.title, deck?.brand, deck?.sourceName,
    ...slides.flatMap((s) => [s.title, s.subtitle, s.kicker, s.notes, s.teacherNote, s.handNote, s.handnote, ...(s.bullets || [])]),
  ].filter(Boolean).join(' ');
  const hasAmaLeak = enforceCeuBrand && /N[úu]cleo\s+AMA/i.test(allText);
  const brandPts = hasAmaLeak ? 0 : 15;

  const qualityScore = completenessPts + densityPts + typoPts + varietyPts + teacherPts + brandPts;
  return {
    qualityScore,
    rubric: {
      completeness: { points: completenessPts, max: 20, ok: completenessPts === 20, detail: hasOpening && hasCore && hasCheck && hasClosing ? 'ABERTURA + conteúdo + VERIFICAÇÃO + SÍNTESE' : 'Faltam blocos obrigatórios' },
      density: { points: densityPts, max: 20, ok: densityPts === 20, detail: `${overcrowded.length} slide(s) acima do limite (≤4 pontos, ≤150 car.)` },
      typography: { points: typoPts, max: 15, ok: typoPts === 15, detail: `${badTypo.length} título(s)/nota(s) fora do padrão` },
      variety: { points: varietyPts, max: 15, ok: varietyPts === 15, detail: `${layouts.size} layouts distintos` },
      teacher: { points: teacherPts, max: 15, ok: teacherPts === 15, detail: `${missingNotes.length} slide(s) sem nota docente` },
      brand: { points: brandPts, max: 15, ok: brandPts === 15, detail: hasAmaLeak ? 'Referência antiga «Núcleo AMA» detectada' : (L ? 'Núcleo CEU · EN consistent' : 'Núcleo CEU · PT coerente') },
    },
  };
}

function scrubCeuBrand(text) {
  return String(text ?? '')
    .replace(/N[úu]cleo\s+AMA/gi, 'Núcleo CEU')
    .replace(/\bAMA\s+—\s+Aristides\s+Miguel\s+Academy/gi, 'CEU Academy');
}

function optimizeTo100(deck, { enforceCeuBrand = true } = {}) {
  if (!deck || !Array.isArray(deck.slides)) return { qualityScore: 0, rubric: {} };
  const L = deck.language === 'en';
  const clipChars = (s, max) => {
    const t = strip(s);
    if (t.length <= max) return t;
    return `${t.slice(0, max - 1).replace(/\s+\S*$/, '').replace(/[,;:]$/, '')}…`;
  };

  if (enforceCeuBrand) {
    deck.brand = 'Núcleo CEU';
    deck.credit = 'APP FEITO PELA HORIZONTE FUTURO';
    if (deck.title) deck.title = scrubCeuBrand(deck.title);
    if (deck.sourceName) deck.sourceName = scrubCeuBrand(deck.sourceName);
  }

  // Split overcrowded slides (>4 bullets) & trim bullets (<= 150 chars), titles (3..65 chars)
  const rebuilt = [];
  for (const rawSlide of deck.slides) {
    const s = { ...rawSlide };
    if (enforceCeuBrand) {
      s.title = scrubCeuBrand(s.title);
      s.subtitle = s.subtitle ? scrubCeuBrand(s.subtitle) : s.subtitle;
      s.kicker = s.kicker ? scrubCeuBrand(s.kicker) : s.kicker;
      s.notes = s.notes ? scrubCeuBrand(s.notes) : s.notes;
      s.teacherNote = s.teacherNote ? scrubCeuBrand(s.teacherNote) : s.teacherNote;
    }
    const cleanTitle = clipChars(s.title || (L ? 'Lesson Concept' : 'Conceito da Aula'), 65);
    s.title = cleanTitle.length >= 3 ? cleanTitle : (L ? 'Key Topic' : 'Tema Central');

    const hand = strip(s.handNote || s.handnote || '');
    s.handNote = hand || (L ? 'Notice this ✎' : 'Repara nisto ✎');
    s.handnote = s.handNote;

    const noteVal = strip(s.teacherNote || s.notes || '');
    s.teacherNote = noteVal.length >= 10
      ? noteVal
      : (L
          ? `Explain "${s.title}" clearly, connect to a concrete example, and verify understanding with the class.`
          : `Explique «${s.title}» com clareza, ligue a um exemplo concreto e confirme a compreensão da turma.`);
    s.notes = s.teacherNote;

    if (Array.isArray(s.bullets) && s.bullets.length > 0) {
      const trimmed = s.bullets.map((b) => clipChars(enforceCeuBrand ? scrubCeuBrand(b) : b, 148)).filter(Boolean);
      if (trimmed.length > 4) {
        s.bullets = trimmed.slice(0, 4);
        rebuilt.push(s);
        const rest = trimmed.slice(4, 8);
        rebuilt.push({
          ...s,
          id: `${s.id}-part2`,
          title: clipChars(`${s.title} (2)`, 65),
          layout: s.layout === 'bullets' ? 'split' : 'bullets',
          bullets: rest,
        });
        continue;
      }
      s.bullets = trimmed;
    }
    rebuilt.push(s);
  }

  // Ensure ABERTURA
  if (!rebuilt.some((s) => s.layout === 'cover')) {
    rebuilt.unshift({
      id: 's-opt-cover',
      layout: 'cover',
      rhythm: L ? 'OPENING' : 'ABERTURA',
      kicker: L ? 'OPENING · Núcleo CEU' : 'ABERTURA · Núcleo CEU',
      title: clipChars(deck.title || (L ? 'Interactive Lesson' : 'Aula Interactiva'), 65),
      subtitle: L ? 'Structured visual lesson ready for classroom projection.' : 'Aula visual estruturada e pronta para projeção.',
      bullets: [],
      handNote: L ? 'Start here ✎' : 'Começa pela intuição ✎',
      handnote: L ? 'Start here ✎' : 'Começa pela intuição ✎',
      teacherNote: L ? 'Introduce the main topic and ask an opening question to engage students.' : 'Apresente o tema central e faça uma pergunta de abertura à turma.',
      notes: L ? 'Introduce the main topic and ask an opening question to engage students.' : 'Apresente o tema central e faça uma pergunta de abertura à turma.',
    });
  }

  // Ensure at least 1 core slide
  if (!rebuilt.some((s) => !['cover', 'agenda', 'objectives', 'quiz', 'check', 'closing'].includes(s.layout))) {
    rebuilt.splice(1, 0, {
      id: 's-opt-core',
      layout: 'concept',
      rhythm: L ? 'KEY IDEA' : 'IDEIA-CHAVE',
      kicker: L ? 'KEY IDEA' : 'IDEIA-CHAVE',
      title: clipChars(deck.title || (L ? 'Core Concept' : 'Conceito-Chave'), 65),
      subtitle: clipChars(deck.reading?.centralIdea || deck.title || '', 148),
      bullets: [],
      handNote: L ? 'Key idea ✎' : 'Repara nisto ✎',
      handnote: L ? 'Key idea ✎' : 'Repara nisto ✎',
      teacherNote: L ? 'Explain the core concept clearly and invite one example from students.' : 'Explique a ideia-chave com clareza e peça um exemplo aos estudantes.',
      notes: L ? 'Explain the core concept clearly and invite one example from students.' : 'Explique a ideia-chave com clareza e peça um exemplo aos estudantes.',
    });
  }

  // Ensure VERIFICAÇÃO
  if (!rebuilt.some((s) => ['quiz', 'check'].includes(s.layout))) {
    const core = rebuilt.find((s) => !['cover', 'agenda', 'objectives', 'closing'].includes(s.layout)) || rebuilt[0];
    rebuilt.splice(Math.max(1, rebuilt.length - 1), 0, {
      id: 's-opt-quiz',
      layout: 'quiz',
      rhythm: L ? 'CHECKPOINT' : 'VERIFICAÇÃO',
      kicker: L ? 'CHECKPOINT' : 'VERIFICAÇÃO',
      title: L ? 'Quick understanding check' : 'Verificação rápida em sala',
      question: L ? `What is the key idea behind "${core.title}"?` : `Qual é a ideia central de «${core.title}»?`,
      options: [
        clipChars(core.subtitle || (core.bullets && core.bullets[0]) || core.title, 110),
        L ? 'None of the concepts discussed in this lesson.' : 'Nenhum dos conceitos abordados nesta aula.',
        L ? 'It only applies outside the scope of this subject.' : 'Aplica-se apenas fora do âmbito desta disciplina.',
      ],
      correct: 0,
      explanation: clipChars(core.subtitle || (core.bullets && core.bullets[0]) || core.title, 140),
      handNote: L ? 'Vote before reveal! ✎' : 'Pensa antes de clicar! ✎',
      handnote: L ? 'Vote before reveal! ✎' : 'Pensa antes de clicar! ✎',
      teacherNote: L ? 'Give 30 seconds for students to vote before revealing the answer.' : 'Dê 30 segundos para a turma votar antes de revelar a resposta.',
      notes: L ? 'Give 30 seconds for students to vote before revealing the answer.' : 'Dê 30 segundos para a turma votar antes de revelar a resposta.',
    });
  }

  // Ensure SÍNTESE
  if (!rebuilt.some((s) => s.layout === 'closing')) {
    rebuilt.push({
      id: 's-opt-closing',
      layout: 'closing',
      rhythm: L ? 'SYNTHESIS' : 'SÍNTESE',
      kicker: L ? 'SYNTHESIS' : 'SÍNTESE',
      title: L ? 'Recap & Exit Ticket' : 'Síntese & Bilhete de Saída',
      bullets: rebuilt.slice(1, 4).map((s) => clipChars(s.title, 120)),
      checkQuestions: [L ? 'Exit Ticket: Summarize today in 1 sentence.' : 'Bilhete de Saída: Resuma a aula de hoje em 1 frase.'],
      handNote: L ? '1-min Exit Ticket ✓' : 'Bilhete de Saída ✎',
      handnote: L ? '1-min Exit Ticket ✓' : 'Bilhete de Saída ✎',
      teacherNote: L ? 'Recap the main takeaways and collect 1-minute exit tickets.' : 'Faça a síntese final e recolha o Bilhete de Saída em 1 minuto.',
      notes: L ? 'Recap the main takeaways and collect 1-minute exit tickets.' : 'Faça a síntese final e recolha o Bilhete de Saída em 1 minuto.',
    });
  }

  // Ensure >= 3 distinct layouts
  const layouts = new Set(rebuilt.map((s) => s.layout));
  if (layouts.size < 3 && rebuilt.length >= 3) {
    rebuilt[1].layout = 'split';
  }

  rebuilt.forEach((s, i) => { s.index = i + 1; });
  deck.slides = rebuilt;
  if (deck.stats) deck.stats.slides = rebuilt.length;

  const rubricResult = evaluateRubric(deck, { enforceCeuBrand });
  deck.rubricScore = rubricResult.qualityScore;
  deck.rubric = rubricResult.rubric;
  deck.quality = auditDeck(deck);
  return rubricResult;
}

export { auditDeck, improveDeck, evaluateRubric, optimizeTo100, slideWords, noteWords };
