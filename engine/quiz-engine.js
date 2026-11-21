// Pure deterministic Quiz Mode engine for Núcleo AMA.
// Builds focused lesson/notebook quizzes, tracks progress, streaks, accuracy,
// immediate feedback states, and generates missed-question retry sessions.

import { analyzeSummary } from './summary-engine.js';

const clean = (v, max = 260) => String(v ?? '').replace(/\s+/g, ' ').trim().slice(0, max);

function deterministicOrder(list, seedStr) {
  let seed = 2166136261;
  const s = String(seedStr || 'ama');
  for (let i = 0; i < s.length; i += 1) {
    seed ^= s.charCodeAt(i);
    seed = Math.imul(seed, 16777619) >>> 0;
  }
  const arr = list.slice();
  for (let i = arr.length - 1; i > 0; i -= 1) {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    const j = seed % (i + 1);
    const tmp = arr[i];
    arr[i] = arr[j];
    arr[j] = tmp;
  }
  return arr;
}

function buildOptions(correctText, pool, seedKey, fallbackPool = []) {
  const right = clean(correctText, 160);
  const seen = new Set([right.toLowerCase()]);
  const distractors = [];
  for (const cand of [...pool, ...fallbackPool]) {
    const c = clean(cand, 160);
    if (!c || c.length < 2) continue;
    const low = c.toLowerCase();
    if (seen.has(low)) continue;
    seen.add(low);
    distractors.push(c);
    if (distractors.length >= 3) break;
  }
  const ordered = deterministicOrder([right, ...distractors], seedKey);
  return {
    options: ordered,
    correct: ordered.indexOf(right),
  };
}

const DEFAULT_DISTRACTORS_PT = [
  'Nenhuma das opções anteriores corresponde ao conceito.',
  'É um procedimento opcional sem impacto no resultado final.',
  'Depende apenas de fatores externos fora da matéria estudada.',
  'Serve exclusivamente para memorização sem aplicação prática.',
];

/**
 * Generates a normalized list of interactive quiz questions from either
 * an existing `analyzeSummary` object or raw lesson text.
 */
export function buildQuizQuestions({ analysis = null, title = '', subject = 'geral', text = '', maxQuestions = 8 } = {}) {
  let src = analysis;
  if ((!src || src.insufficient) && text && String(text).trim().length >= 80) {
    src = analyzeSummary({ text, title, subject });
  }
  const questions = [];
  const seenPrompts = new Set();
  const addQ = (q) => {
    const p = clean(q.prompt, 240);
    if (!p || seenPrompts.has(p.toLowerCase())) return;
    if (!Array.isArray(q.options) || q.options.length < 2) return;
    if (!Number.isInteger(q.correct) || q.correct < 0 || q.correct >= q.options.length) return;
    seenPrompts.add(p.toLowerCase());
    questions.push({
      id: `q${questions.length + 1}`,
      kind: q.kind || 'conceito',
      prompt: p,
      options: q.options.map((o) => clean(o, 180)),
      correct: q.correct,
      explanation: clean(q.explanation || '', 260),
      sourceTerm: clean(q.sourceTerm || '', 80),
    });
  };

  if (src && !src.insufficient) {
    // 1. Existing quiz questions from summary-engine
    for (const q of (src.quiz || [])) {
      addQ({
        kind: q.kind || 'compreensao',
        prompt: q.prompt,
        options: q.options,
        correct: q.correct,
        explanation: q.explanation || `Resposta correta: ${q.options?.[q.correct] || ''}.`,
      });
    }

    // 2. Supplement from extracted definitions if we need more items
    const defs = Array.isArray(src.definitions) ? src.definitions : [];
    const termPool = [
      ...defs.map((d) => d.term),
      ...(src.keywords || []).map((k) => k.term),
    ];
    for (let i = 0; i < defs.length && questions.length < maxQuestions; i += 1) {
      const def = defs[i];
      if (!def.term || !def.sentence) continue;
      const snippet = def.sentence.replace(new RegExp(def.term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'ig'), '_____');
      const { options, correct } = buildOptions(
        def.term,
        termPool.filter((t) => t.toLowerCase() !== def.term.toLowerCase()),
        `${title}-def-${i}`,
        ['Conceito secundário', 'Variável auxiliar', 'Regra complementar']
      );
      addQ({
        kind: 'definicao',
        prompt: `Que termo completa corretamente a definição: «${clean(snippet, 175)}»?`,
        options,
        correct,
        explanation: def.sentence,
        sourceTerm: def.term,
      });
    }

    // 3. Supplement from flashcards if still under target
    const cards = Array.isArray(src.cards) ? src.cards : [];
    const backPool = cards.map((c) => c.back).filter(Boolean);
    for (let i = 0; i < cards.length && questions.length < maxQuestions; i += 1) {
      const c = cards[i];
      if (!c.front || !c.back) continue;
      const { options, correct } = buildOptions(
        c.back,
        backPool.filter((b) => b !== c.back),
        `${title}-card-${i}`,
        DEFAULT_DISTRACTORS_PT
      );
      addQ({
        kind: 'aplicacao',
        prompt: c.front,
        options,
        correct,
        explanation: c.sentence || c.back,
      });
    }
  }

  // Fallback for very short lesson summaries (still deterministic from sentences)
  if (!questions.length && text) {
    const sentences = String(text)
      .split(/(?<=[.!?])\s+/)
      .map((s) => clean(s, 200))
      .filter((s) => s.length >= 25);
    if (sentences.length) {
      const first = sentences[0];
      const { options, correct } = buildOptions(
        first,
        sentences.slice(1),
        `${title}-fb-0`,
        DEFAULT_DISTRACTORS_PT
      );
      addQ({
        kind: 'ideia',
        prompt: `Qual das afirmações resume fielmente o foco principal de «${clean(title || 'esta aula', 80)}»?`,
        options,
        correct,
        explanation: first,
      });
    }
  }

  return questions.slice(0, maxQuestions);
}

/**
 * Creates a fresh Quiz Mode session state.
 */
export function createQuizSession({ id = '', title = 'Quiz da Lição', subject = 'geral', sourceType = 'notebook', questions = [] } = {}) {
  const list = Array.isArray(questions) ? questions.slice() : [];
  return {
    id: id || `quiz-${Date.now()}`,
    title: clean(title, 96) || 'Quiz da Lição',
    subject: clean(subject, 40) || 'geral',
    sourceType,
    questions: list,
    currentIndex: 0,
    score: 0,
    streak: 0,
    maxStreak: 0,
    xp: 0,
    answers: [],
    lastFeedback: null,
    completed: list.length === 0,
    startedAt: Date.now(),
  };
}

/**
 * Records an answer for the current question and returns updated immutable state.
 */
export function submitQuizAnswer(session, chosenIndex) {
  if (!session || session.completed) return session;
  const q = session.questions[session.currentIndex];
  if (!q) return { ...session, completed: true };
  // Guard against double-answering the same question
  if (session.answers.some((a) => a.questionIndex === session.currentIndex)) {
    return session;
  }
  const chosen = Number(chosenIndex);
  const isCorrect = chosen === q.correct;
  const nextStreak = isCorrect ? session.streak + 1 : 0;
  const nextMaxStreak = Math.max(session.maxStreak, nextStreak);
  const gainedXp = isCorrect ? 20 + Math.min(20, (nextStreak - 1) * 5) : 0;

  const entry = {
    questionIndex: session.currentIndex,
    questionId: q.id,
    chosen,
    correct: q.correct,
    isCorrect,
    explanation: q.explanation,
  };

  return {
    ...session,
    score: session.score + (isCorrect ? 1 : 0),
    streak: nextStreak,
    maxStreak: nextMaxStreak,
    xp: session.xp + gainedXp,
    answers: [...session.answers, entry],
    lastFeedback: {
      isCorrect,
      chosen,
      correct: q.correct,
      gainedXp,
      streak: nextStreak,
      explanation: q.explanation,
    },
  };
}

/**
 * Advances to the next question or marks the session completed.
 */
export function nextQuizStep(session) {
  if (!session || session.completed) return session;
  const nextIndex = session.currentIndex + 1;
  const completed = nextIndex >= session.questions.length;
  return {
    ...session,
    currentIndex: completed ? session.questions.length : nextIndex,
    lastFeedback: null,
    completed,
  };
}

/**
 * Computes summary metrics for HUD progress bars and end-of-quiz breakdown.
 */
export function quizMetrics(session) {
  const total = session?.questions?.length || 0;
  const answered = session?.answers?.length || 0;
  const score = session?.score || 0;
  const progressPct = total ? Math.round((answered / total) * 100) : 0;
  const accuracyPct = answered ? Math.round((score / answered) * 100) : 0;
  const finalPct = total ? Math.round((score / total) * 100) : 0;
  const missedQuestions = (session?.answers || [])
    .filter((a) => !a.isCorrect)
    .map((a) => session.questions[a.questionIndex])
    .filter(Boolean);

  let tier = 'Em consolidação';
  if (finalPct >= 90) tier = 'Domínio excelente';
  else if (finalPct >= 75) tier = 'Bom domínio';
  else if (finalPct >= 50) tier = 'Progresso sólido';

  return {
    total,
    answered,
    score,
    progressPct,
    accuracyPct,
    finalPct,
    streak: session?.streak || 0,
    maxStreak: session?.maxStreak || 0,
    xp: session?.xp || 0,
    missedQuestions,
    tier,
  };
}
