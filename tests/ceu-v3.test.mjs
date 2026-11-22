import test from 'node:test';
import assert from 'node:assert/strict';

import { analyzePagesLayout, groupItemsIntoLines } from '../engine/pdf-engine.js';
import { buildEditableOutline, buildDeckFromOutline, moveOutlineCard, toggleOutlineCard, addOutlineCard } from '../engine/outline-engine.js';
import { evaluateRubric, optimizeTo100 } from '../engine/quality-engine.js';
import { buildWorksheet, renderWorksheetHtml } from '../engine/worksheet-engine.js';
import { buildStandaloneOfflineHtml } from '../engine/export-engine.js';
import { detectDocumentType, analyzeDocument, buildAdaptiveDocumentDeck } from '../engine/doc-analyzer.js';
import { pickCoherent3DMode, synthesizeAndFuseDeck, parseCreativeBrief } from '../engine/ai-engine.js';
import { buildCoherentImageQueries } from '../engine/web-enrichment.js';
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

test('DocAnalyzer detects Ata de Reunião, extracts decisions/owners/deadlines & builds tailored executive slides', () => {
  const ataText = `Ata n.º 14 da Reunião Ordinária da Direcção Académica.
Aos 18 dias do mês de Novembro de 2026, na Sala de Conferências em Luanda, estiveram presentes: Ana Silva, Nelson Duarte e Sofia Mateus.
Ordem de Trabalhos: 1. Expansão de projetores; 2. Calendário de exames.
Deliberou-se por unanimidade aprovar a instalação de 12 projetores até 10 de Dezembro.
Ficou encarregue Ana Silva de coordenar a entrega até 5 de Dezembro.
Ponto pendente: aguarda confirmação da fibra óptica no polo de Viana para a próxima reunião.`;

  const det = detectDocumentType(ataText, 'Ata 14', 'Ata-14.pdf');
  assert.equal(det.docType, 'ata');
  const analysis = analyzeDocument(ataText, { title: 'Ata n.º 14', sourceName: 'Ata-14.pdf' });
  assert.ok(analysis.extracted.decisions.length >= 1, 'Expected decisions extracted');
  assert.ok(analysis.extracted.actionItems.length >= 1, 'Expected action items extracted');
  assert.ok(analysis.extracted.actionItems.some((a) => /Ana Silva/i.test(a.owner)), 'Expected Ana Silva extracted as owner');
  assert.ok(analysis.extracted.openIssues.length >= 1, 'Expected open issues extracted');

  const deck = buildAdaptiveDocumentDeck(ataText, { title: 'Ata n.º 14', sourceName: 'Ata-14.pdf' });
  assert.equal(deck.ok, true);
  assert.equal(deck.docType, 'ata');
  assert.ok(deck.slides.some((s) => s.rhythm === 'DECISÕES APROVADAS'));
  assert.ok(deck.slides.some((s) => s.rhythm === 'PLANO DE AÇÃO'));

  // Also verify Regulamento & Relatório classification
  const reg = detectDocumentType('Artigo 1.º O estudante tem direito ao cartão. Artigo 2.º É obrigatório cumprir os prazos sob pena de sanção.', 'Regulamento Interno', 'regulamento.pdf');
  assert.equal(reg.docType, 'regulamento');
  const rep = detectDocumentType('Relatório Trimestral de Desempenho: a receita cresceu 24% atingindo 18.500.000 Kz. Recomenda-se investir em logística.', 'Relatório Q3', 'relatorio.pdf');
  assert.equal(rep.docType, 'relatorio');
});

test('Coherent 3D selection and pedagogical rewriting adapt raw PDF text for teaching', () => {
  assert.equal(pickCoherent3DMode('fisica', 'aula', 'Leis de Newton'), 'physics');
  assert.equal(pickCoherent3DMode('financas', 'aula', 'Juro Composto em Kwanzas'), 'finance');
  assert.equal(pickCoherent3DMode('programacao', 'aula', 'Pesquisa Binária em Python'), 'code');
  assert.equal(pickCoherent3DMode('biologia', 'aula', 'Fotossíntese no Maiombe'), 'bio');
  assert.equal(pickCoherent3DMode('geral', 'ata', 'Ata n.º 14'), 'meeting');

  const deck = {
    title: 'Leis de Newton',
    subject: 'fisica',
    docType: 'aula',
    stats: { slides: 3, keywords: ['Inércia', 'Força', 'Aceleração'] },
    reading: { definitions: [{ term: 'Inércia', sentence: 'Tendência de manter o estado de movimento.' }], sections: [] },
    slides: [
      { id: 'c', layout: 'cover', title: 'Leis de Newton', subtitle: 'Dinâmica' },
      { id: 's1', layout: 'bullets', title: 'Primeira Lei e Inércia', bullets: ['A inércia é a tendência do corpo manter o repouso.', 'Quanto maior a massa, maior a resistência à aceleração.'] },
      { id: 's2', layout: 'closing', title: 'Resumo', bullets: ['F = m x a'] },
    ],
  };
  synthesizeAndFuseDeck(deck, null);
  const s1 = deck.slides.find((s) => s.id === 's1');
  assert.ok(s1.bullets.length >= 3, 'Expected pedagogical expansion bullet added');
  assert.equal(s1.mode3d, 'physics', 'Expected coherent physics 3D mode on content slide');
  assert.ok(deck.slides.some((s) => s.layout === 'scene-3d' && s.mode3d === 'physics'), 'Expected interactive physics 3D slide');

  // Verify Voice/Text Creative Brief parser & coherent bilingual image queries
  const brief = parseCreativeBrief('Quero fotos reais de foguetão e carros, tom simples para 1.º ano, tema escuro');
  assert.equal(brief.visualStyle, 'photos');
  assert.equal(brief.themeHint, 'dark');
  assert.equal(brief.levelHint, 'basico');
  assert.ok(brief.imageQueries.some((q) => /foguet/i.test(q)), 'Expected foguetão in parsed brief queries');
  const qs = buildCoherentImageQueries({ title: 'Leis de Newton', briefQueries: brief.imageQueries, visualStyle: brief.visualStyle });
  assert.ok(qs.some((x) => /rocket launch/i.test(x.query)), 'Expected coherent English Wikimedia query for foguetão');
});
