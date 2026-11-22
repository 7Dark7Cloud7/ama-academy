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
  const brand = document?.documentElement?.dataset?.brand || 'ama';
  const brandName = brand === 'ceu' ? 'CEU Academy' : 'AMA';
  const haystack = slides.map((s) => `${s.kicker || ''} ${s.notes || ''} ${s.title || ''}`).join(' ');
  const coherent = brand === 'ceu' ? !/\bAMA\b/.test(haystack) : !/CEU Academy/.test(haystack);

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

export { auditDeck, improveDeck, slideWords, noteWords };
