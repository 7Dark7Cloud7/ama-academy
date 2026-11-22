import test from 'node:test';
import assert from 'node:assert/strict';

import { analyzePagesLayout, groupItemsIntoLines } from '../engine/pdf-engine.js';
import { buildEditableOutline, buildDeckFromOutline, moveOutlineCard, toggleOutlineCard, addOutlineCard } from '../engine/outline-engine.js';
import { evaluateRubric, optimizeTo100 } from '../engine/quality-engine.js';
import { buildWorksheet, renderWorksheetHtml } from '../engine/worksheet-engine.js';
import { buildStandaloneOfflineHtml } from '../engine/export-engine.js';
import { FIXTURES_10, PDF_SAMPLE_MULTI_PAGE, PDF_SAMPLE_STEM, PDF_SAMPLE_SCANNED } from './fixtures/ceu-v3.fixtures.mjs';

test('10/10 fixtures (5 PT + 5 EN) generate with qualityScore === 100 and zero Núcleo AMA leaks', () => {
  assert.equal(FIXTURES_10.length, 10);
  for (const fx of FIXTURES_10) {
    const outline = buildEditableOutline({
      title: fx.title,
      subject: fx.subject,
      text: fx.text,
      sourceName: `${fx.id}.pdf`,
      level: fx.level,
      language: fx.language,
      density: fx.density,
    });
    assert.ok(outline.cards.length >= 5, `${fx.id}: expected >= 5 outline cards`);

    const deck = buildDeckFromOutline(outline, { author: 'Docente Núcleo CEU', theme: 'editorial' });
    const rubric = optimizeTo100(deck, { enforceCeuBrand: true });
    assert.equal(rubric.qualityScore, 100, `${fx.id}: expected 100/100 rubric, got ${rubric.qualityScore} (${JSON.stringify(rubric.rubric)})`);

    // Verify Standalone Offline HTML + Worksheet + Brand hygiene
    const offlineHtml = buildStandaloneOfflineHtml(deck);
    assert.ok(offlineHtml.includes('Núcleo CEU'), `${fx.id}: offline HTML missing Núcleo CEU`);
    assert.ok(offlineHtml.includes('APP FEITO PELA HORIZONTE FUTURO'), `${fx.id}: offline HTML missing credit`);
    assert.equal(/N[úu]cleo\s+AMA/i.test(offlineHtml), false, `${fx.id}: offline HTML leaked Núcleo AMA`);

    const ws = buildWorksheet(deck);
    const wsHtml = renderWorksheetHtml(ws, { includeAnswers: true });
    assert.ok(ws.vocab.length >= 2, `${fx.id}: expected worksheet vocab`);
    assert.ok(ws.questions.length >= 3, `${fx.id}: expected >= 3 worksheet questions`);
    assert.ok(wsHtml.includes('APP FEITO PELA HORIZONTE FUTURO'), `${fx.id}: worksheet missing credit`);
    assert.equal(/N[úu]cleo\s+AMA/i.test(wsHtml), false, `${fx.id}: worksheet leaked Núcleo AMA`);
  }
});

test('PDF layout engine: line grouping, heading detection, repeated header/footer stripping', () => {
  const grouped = groupItemsIntoLines([
    { str: 'Segunda', transform: [14, 0, 0, 14, 50, 700] },
    { str: 'Lei', transform: [14, 0, 0, 14, 120, 701] },
    { str: 'Corpo de texto', transform: [11, 0, 0, 11, 50, 670] },
  ], 4);
  assert.equal(grouped.length, 2);
  assert.equal(grouped[0].text, 'Segunda Lei');

  const res = analyzePagesLayout(PDF_SAMPLE_MULTI_PAGE, { filename: 'gestao-projectos.pdf' });
  assert.equal(res.ok, true);
  assert.equal(res.isScanned, false);
  assert.ok(res.strippedHeadersFooters >= 6, `Expected repeated header & page footers stripped, got ${res.strippedHeadersFooters}`);
  assert.equal(res.headingsCount, 4);
  assert.equal(res.text.includes('Sebenta Oficial'), false, 'Repeated header should be stripped');
  assert.ok(res.text.includes('## 1. Introdução à Gestão de Projectos'));
});

test('PDF layout engine: STEM formula detection & scanned PDF warning', () => {
  const stem = analyzePagesLayout(PDF_SAMPLE_STEM, { filename: 'ohm.pdf' });
  assert.equal(stem.ok, true);
  assert.ok(stem.formulas.length >= 2, 'Expected both Ohm and Power formulas detected');

  const scanned = analyzePagesLayout(PDF_SAMPLE_SCANNED, { filename: 'scan.pdf' });
  assert.equal(scanned.isScanned, true);
  assert.equal(scanned.ok, false);
  assert.ok(scanned.warning.includes('digitalizado'));
});

test('Outline editor operations: reorder, toggle, add, and optimizeTo100 fixes bad deck', () => {
  let outline = buildEditableOutline({ title: 'Teste', text: FIXTURES_10[0].text, language: 'pt' });
  const initialCount = outline.cards.length;
  const secondTitle = outline.cards[1].title;
  outline = moveOutlineCard(outline, 1, 1);
  assert.equal(outline.cards[2].title, secondTitle);
  outline = toggleOutlineCard(outline, outline.cards[1].id);
  assert.equal(outline.cards[1].enabled, false);
  outline = addOutlineCard(outline, { title: 'Slide Extra' });
  assert.equal(outline.cards.length, initialCount + 1);

  // Deliberately flawed deck with Núcleo AMA leak + overcrowded bullets -> optimizeTo100 brings it to 100
  const flawed = {
    title: 'Núcleo AMA · Aula Densa',
    language: 'pt',
    slides: [
      { id: 's1', layout: 'bullets', title: 'X', bullets: ['a'.repeat(200), 'b'.repeat(200), 'c', 'd', 'e', 'f'] },
    ],
  };
  const before = evaluateRubric(flawed, { enforceCeuBrand: true });
  assert.ok(before.qualityScore < 50);
  const after = optimizeTo100(flawed, { enforceCeuBrand: true });
  assert.equal(after.qualityScore, 100);
});
