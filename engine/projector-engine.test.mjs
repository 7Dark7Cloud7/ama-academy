import test from 'node:test';
import assert from 'node:assert/strict';
import { buildProjectorDeck } from './projector-engine.js';

const PAGE_TEXTS = [
  {
    page: 1,
    text: `Leis de Newton na Prática\nMovimento retilíneo uniforme é o deslocamento de um corpo em linha reta com velocidade constante e aceleração nula. A força resultante é a soma vetorial de todas as forças aplicadas.`,
  },
  {
    page: 2,
    text: `Segunda Lei e Cálculo\nF = m * a relaciona diretamente a massa e a aceleração. Um veículo de 1000 kg que acelera a 2 m/s² precisa de 2000 N de força resultante.`,
  },
  {
    page: 3,
    text: `Aplicações no Quotidiano\nCintos de segurança neutralizam a inércia durante travagens bruscas. Em resumo, compreender massa, inércia e aceleração permite projetar sistemas mais seguros.`,
  },
];

test('buildProjectorDeck rejects overly short inputs cleanly', () => {
  const res = buildProjectorDeck({ title: 'Vazio', text: 'Muito curto.' });
  assert.equal(res.ok, false);
  assert.equal(res.reason, 'too_short');
});

test('buildProjectorDeck converts multi-page PDF text into organized visual slides and reading sections', () => {
  const deck = buildProjectorDeck({
    title: 'Mecânica Clássica · Aula 04',
    subject: 'fisica',
    pageTexts: PAGE_TEXTS,
    sourceName: 'mecanica-aula04.pdf',
    theme: 'editorial',
    author: 'Prof. Adolfo Camacho',
  });

  assert.equal(deck.ok, true);
  assert.equal(deck.title, 'Mecânica Clássica · Aula 04');
  assert.equal(deck.stats.pages, 3);
  assert.ok(deck.slides.length >= 5, 'Expected cover, agenda, content slides, and closing check');
  assert.equal(deck.slides[0].layout, 'cover');
  assert.equal(deck.slides[1].layout, 'agenda');
  assert.equal(deck.slides[deck.slides.length - 1].layout, 'closing');
  assert.ok(deck.slides.some((s) => s.layout === 'highlight'), 'Expected formula highlight slide');

  // Verify Reading Mode structure
  assert.equal(deck.reading.sections.length, 3);
  assert.ok(deck.reading.centralIdea.length > 10);
  for (const slide of deck.slides) {
    assert.ok(slide.notes && slide.notes.length > 10, 'Every slide has speaker notes');
  }
});

test('buildProjectorDeck supports plain pasted lecture notes without pageTexts', () => {
  const plain = `
Orçamento Familiar em Kwanzas

O orçamento começa por separar rendimento fixo, despesas fixas e despesas variáveis. A inflação reduz o poder de compra do dinheiro parado ao longo do ano.

Fundo de Emergência

Fundo de emergência é a reserva líquida equivalente a 3 a 6 meses de despesas fixas. Antes de investir em ativos de risco, construa esta proteção.
`;
  const deck = buildProjectorDeck({
    title: 'Finanças Pessoais',
    subject: 'financas',
    text: plain,
  });

  assert.equal(deck.ok, true);
  assert.ok(deck.slides.length >= 4);
  assert.equal(deck.reading.sections.length, 2);
});
