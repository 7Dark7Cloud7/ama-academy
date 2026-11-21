import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildQuizQuestions,
  createQuizSession,
  submitQuizAnswer,
  nextQuizStep,
  quizMetrics,
} from './quiz-engine.js';

const SAMPLE_TEXT = `
Juro composto é o rendimento calculado sobre o capital inicial somado aos juros acumulados nos períodos anteriores.
A inflação é a subida generalizada dos preços que reduz o poder de compra do kwanza ao longo do tempo.
Por exemplo, aplicar 100.000 Kz a 12% ao ano gera 12.000 Kz no primeiro ano, mas 13.440 Kz no segundo ano porque o juro incide sobre 112.000 Kz.
Fundo de emergência é a reserva líquida equivalente a 3 a 6 meses de despesas fixas.
Em resumo, só existe ganho real quando a taxa de rendimento supera a inflação anual.
`;

test('buildQuizQuestions generates normalized multiple-choice questions from lesson text', () => {
  const qs = buildQuizQuestions({
    title: 'Juro Composto e Inflação',
    subject: 'financas',
    text: SAMPLE_TEXT,
    maxQuestions: 6,
  });
  assert.ok(qs.length >= 2, 'Expected at least 2 quiz questions');
  assert.ok(qs.length <= 6, 'Respects maxQuestions ceiling');
  for (const q of qs) {
    assert.ok(q.prompt.length > 10);
    assert.ok(Array.isArray(q.options) && q.options.length >= 2);
    assert.ok(Number.isInteger(q.correct) && q.correct >= 0 && q.correct < q.options.length);
  }
});

test('buildQuizQuestions handles short lesson fallback deterministically', () => {
  const qs = buildQuizQuestions({
    title: 'Aula Curta',
    subject: 'geral',
    text: 'A comunicação clara reduz ruído e acelera decisões nas equipas. Prepare sempre um exemplo prático.',
    maxQuestions: 4,
  });
  assert.equal(qs.length, 1);
  assert.ok(qs[0].options.length >= 2);
});

test('quiz session tracks score, streaks, xp, wrong answers, and completion', () => {
  const questions = [
    { id: 'q1', prompt: 'P1?', options: ['A', 'B', 'C', 'D'], correct: 1, explanation: 'Exp 1' },
    { id: 'q2', prompt: 'P2?', options: ['A', 'B', 'C', 'D'], correct: 0, explanation: 'Exp 2' },
    { id: 'q3', prompt: 'P3?', options: ['A', 'B', 'C', 'D'], correct: 2, explanation: 'Exp 3' },
  ];
  let s = createQuizSession({ id: 'test-1', title: 'Teste', subject: 'financas', questions });
  assert.equal(s.completed, false);
  assert.equal(quizMetrics(s).progressPct, 0);

  // Q1 correct
  s = submitQuizAnswer(s, 1);
  assert.equal(s.score, 1);
  assert.equal(s.streak, 1);
  assert.equal(s.lastFeedback.isCorrect, true);
  assert.ok(s.xp >= 20);

  // Guard against double answering same question
  const dup = submitQuizAnswer(s, 0);
  assert.equal(dup.answers.length, 1);
  assert.equal(dup.score, 1);

  s = nextQuizStep(s);
  assert.equal(s.currentIndex, 1);
  assert.equal(s.lastFeedback, null);

  // Q2 wrong -> resets streak
  s = submitQuizAnswer(s, 3);
  assert.equal(s.score, 1);
  assert.equal(s.streak, 0);
  assert.equal(s.maxStreak, 1);
  assert.equal(s.lastFeedback.isCorrect, false);
  s = nextQuizStep(s);

  // Q3 correct -> completes on next step
  s = submitQuizAnswer(s, 2);
  assert.equal(s.score, 2);
  assert.equal(s.streak, 1);
  s = nextQuizStep(s);
  assert.equal(s.completed, true);

  const m = quizMetrics(s);
  assert.equal(m.total, 3);
  assert.equal(m.answered, 3);
  assert.equal(m.score, 2);
  assert.equal(m.progressPct, 100);
  assert.equal(m.finalPct, 67);
  assert.equal(m.missedQuestions.length, 1);
  assert.equal(m.missedQuestions[0].id, 'q2');
  assert.equal(m.tier, 'Progresso sólido');
});
