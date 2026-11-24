import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

import { analyzePagesLayout, groupItemsIntoLines } from '../engine/pdf-engine.js';
import { buildEditableOutline, buildDeckFromOutline, moveOutlineCard, toggleOutlineCard, addOutlineCard } from '../engine/outline-engine.js';
import { evaluateRubric, optimizeTo100 } from '../engine/quality-engine.js';
import { buildWorksheet, renderWorksheetHtml } from '../engine/worksheet-engine.js';
import { buildStandaloneOfflineHtml } from '../engine/export-engine.js';
import { detectDocumentType, analyzeDocument, buildAdaptiveDocumentDeck } from '../engine/doc-analyzer.js';
import { pickCoherent3DMode, synthesizeAndFuseDeck, parseCreativeBrief, autoSelfAnalyzeAndHeal, getExternalAIPrompt, buildDeckFromExternalBlueprint } from '../engine/ai-engine.js';
import { buildCoherentImageQueries } from '../engine/web-enrichment.js';
import { generateQrMatrix, renderQrSvg } from '../engine/qr-svg.js';
import { computeAngolaGrade, computeFinalPautaRow, exportPautaCsv, EXAM_BANKS, scoreExamAttempt, FLASHCARD_DECKS, buildFlashcardsFromText } from '../engine/campus-tools.js';
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

  // Verify Mayer + Gamma Auto Self-Analysis & Healing
  const rawDeck = {
    title: 'Finanças em Kwanzas',
    subject: 'financas',
    slides: [
      { id: 's0', layout: 'cover', title: 'Finanças em Kwanzas', subtitle: 'Juros compostos' },
      { id: 's1', layout: 'agenda', title: 'Roteiro', bullets: ['Juros', 'Inflação'] },
      { id: 's2', layout: 'bullets', title: 'Impacto do Juro', bullets: ['Capital: 100.000 Kz cresce 12% ao ano', 'Tempo: começar cedo vence', 'Regra dos 72'], intuition: 'Intuição', fusedInsight: { heading: 'Juro', text: 'Explicação extra da Wikipédia sobre capitalização.' } },
      { id: 's3', layout: 'bullets', title: 'Três Pilares', bullets: ['Poupança: 20% do salário', 'Fundo: 3 a 6 meses', 'Diversificação: reduzir risco'] },
      { id: 's4', layout: 'closing', title: 'Resumo', bullets: ['Comece hoje'] },
    ],
  };
  autoSelfAnalyzeAndHeal(rawDeck);
  assert.equal(rawDeck.slides[2].layout, 'stat-spotlight', 'Expected quantitative slide upgraded to stat-spotlight');
  assert.equal(rawDeck.slides[2].intuition, '', 'Expected Mayer coherence deduplication of intuition + fusedInsight');
  assert.equal(rawDeck.slides[3].layout, 'bento-grid', 'Expected 3-bullet slide upgraded to bento-grid');
  assert.ok(rawDeck.slides.every((s) => typeof s.narration === 'string' && s.narration.length > 10), 'Expected voice narration generated on every slide');
  assert.ok(rawDeck.selfAudit && rawDeck.selfAudit.mayerScore === 100, 'Expected selfAudit report attached');
});

test('External Super-IA (ChatGPT/Gemini) prompt generator and blueprint parser with volatile 3D', () => {
  const prompt = getExternalAIPrompt('foco em exemplos de engenharia');
  assert.ok(prompt.includes('scene3d') && prompt.includes('imageQuery'), 'Expected scene3d and imageQuery in external AI prompt');

  const sampleChatGptReply = 'Aqui está o teu plano:\n```json\n' + JSON.stringify({
    title: 'Energia Solar em Angola',
    subject: 'fisica',
    docType: 'aula',
    theme: 'ceu',
    slides: [
      { layout: 'cover', kicker: 'ABERTURA', title: 'Energia Solar em Angola', subtitle: 'Como a luz vira electricidade limpa', imageQuery: 'solar panels desert sunlight' },
      { layout: 'stat-spotlight', kicker: 'IMPACTO', title: 'Potencial Solar', heroStat: { value: '2.200 h/ano', label: 'Insolação', context: 'Angola tem uma das maiores radiações solares do continente.' }, bullets: ['Produção limpa', 'Baixo custo operacional'] },
      { layout: 'scene-3d', kicker: 'MODELO 3D', title: 'Fluxo Fotovoltaico 3D', scene3d: { shape: 'flow', centerLabel: 'SOLAR', nodes: [{ label: 'Fotões', short: 'hν', note: 'Luz solar atinge o silício' }, { label: 'Célula', short: 'Si', note: 'Liberta electrões' }, { label: 'Inversor', short: 'AC', note: 'Converte DC em AC' }, { label: 'Rede', short: 'kW', note: 'Alimenta casas e escolas' }], links: [[0, 1], [1, 2], [2, 3]] } },
    ],
  }) + '\n```';

  const dk = buildDeckFromExternalBlueprint(sampleChatGptReply, { author: 'Docente CEU' });
  assert.equal(dk.ok, true);
  assert.equal(dk.slides.length, 3);
  assert.equal(dk.slides[0].visualPrompt, 'solar panels desert sunlight');
  assert.equal(dk.slides[2].layout, 'scene-3d');
  assert.equal(dk.slides[2].mode3d, 'flow');
  assert.equal(dk.slides[2].nodes3d.length, 4);
  assert.equal(dk.slides[2].sceneSpec.links.length, 3);
});

test('Offline ISO QR Code SVG generator creates valid matrices and crisp SVG', () => {
  const shortQr = generateQrMatrix('https://ceu.ao');
  assert.equal(shortQr.version, 1);
  assert.equal(shortQr.size, 21);
  // Top-left finder outer border & 3x3 center must be dark, separator must be light
  assert.equal(shortQr.modules[0][0], 1);
  assert.equal(shortQr.modules[3][3], 1);
  assert.equal(shortQr.modules[1][1], 0);
  assert.equal(shortQr.modules[7][0], 0);
  // Dark module at (4*version + 9, 8)
  assert.equal(shortQr.modules[13][8], 1);

  const url = 'https://ceu-academy.com/#/projetor?deck=super-ia-energia-solar-2026';
  const longQr = generateQrMatrix(url);
  assert.ok(longQr.version >= 4 && longQr.size >= 33, 'Expected auto-scaled QR version for URL');
  const svg = renderQrSvg(url, { size: 200, fg: '#00217e', bg: '#ffffff', label: 'QR Aula' });
  assert.ok(svg.startsWith('<svg') && svg.includes('viewBox=') && svg.includes('path d="M'), 'Expected valid SVG path');
});

test('Angolan 0–20 grading engine computes Dispensa, Exame Normal minimum and Recurso accurately', () => {
  const disp = computeAngolaGrade(14, 16, 0.4);
  assert.equal(disp.status, 'dispensado');
  assert.equal(disp.mf, 15);

  const ex = computeAngolaGrade(11, 12, 0.4);
  assert.equal(ex.status, 'exame');
  assert.equal(ex.mf, 11.5);
  assert.equal(ex.needed, 8.2);

  const rec = computeAngolaGrade(5, 6, 0.4);
  assert.equal(rec.status, 'recurso');
  assert.equal(rec.mf, 5.5);
});

test('Teacher Pauta engine computes final 0–20 grades and exports Excel UTF-8 BOM CSV', () => {
  const rows = [
    { numero: 'CEU-01', nome: 'João Mateus', presente: true, pp1: 15, pp2: 15, exame: '' },
    { numero: 'CEU-02', nome: 'Ana Silva', presente: true, pp1: 10, pp2: 12, exame: 11 },
    { numero: 'CEU-03', nome: 'Pedro Costa', presente: false, pp1: 8, pp2: 8, exame: 8 },
  ];
  const r0 = computeFinalPautaRow(rows[0], 0.4);
  assert.equal(r0.estado, 'Dispensado');
  assert.equal(r0.notaFinal, 15);

  const r1 = computeFinalPautaRow(rows[1], 0.4);
  assert.equal(r1.estado, 'Aprovado');
  assert.equal(r1.notaFinal, 11);

  const r2 = computeFinalPautaRow(rows[2], 0.4);
  assert.equal(r2.estado, 'Recurso');
  assert.equal(r2.aprovado, false);

  const csv = exportPautaCsv('UAN-ENG-1A', rows, 0.4);
  assert.ok(csv.startsWith('\uFEFFNumero_CEU;Nome_Estudante;'));
  assert.ok(csv.includes('"Dispensado"') && csv.includes('"Aprovado"') && csv.includes('"Falta"'));
});

test('Timed Mock Exam Simulator grades 0–20 across all 5 subjects with explanations', () => {
  assert.equal(EXAM_BANKS.length, 5);
  const mathExam = EXAM_BANKS.find((b) => b.id === 'ex-acesso-mat');
  const perfectAnswers = Object.fromEntries(mathExam.questions.map((q, i) => [i, q.ans]));
  const res = scoreExamAttempt('ex-acesso-mat', perfectAnswers);
  assert.equal(res.nota20, 20);
  assert.equal(res.aprovado, true);
  assert.ok(res.details.every((d) => d.isRight && d.explanation.length > 10));

  const partial = scoreExamAttempt('ex-ingles', { 0: 1, 1: 1, 2: 0 });
  assert.equal(partial.correct, 2);
  assert.equal(partial.nota20, 8);
  assert.equal(partial.aprovado, false);
});

test('Flashcards studio ships multi-subject cards and parses custom student notes', () => {
  assert.ok(FLASHCARD_DECKS.length >= 8);
  const custom = buildFlashcardsFromText('Biologia', 'Fotossíntese: Conversão de luz solar em energia química.\nMitose — Divisão celular equacional.');
  assert.equal(custom.length, 2);
  assert.equal(custom[0].front, 'Fotossíntese');
  assert.ok(custom[0].back.includes('luz solar'));
});

test('All CEU course posters exist on disk and Supabase schema covers all 11 multi-turma tables', () => {
  const ceuJs = fs.readFileSync(new URL('../ama-ceu.js', import.meta.url), 'utf8');
  const posters = [...ceuJs.matchAll(/poster:\s*'([^']+)'/g)].map((m) => m[1]);
  assert.ok(posters.length >= 8);
  for (const p of posters) {
    assert.ok(fs.existsSync(new URL(`../media/${p}.jpg`, import.meta.url)), `Missing media/${p}.jpg`);
  }
  const sql = fs.readFileSync(new URL('../supabase/schema.sql', import.meta.url), 'utf8');
  for (const tbl of ['mvp_decks', 'mvp_classes', 'mvp_lessons', 'mvp_mentorships', 'mvp_internships', 'mvp_delegates', 'mvp_universities', 'mvp_online_classes']) {
    assert.ok(sql.includes(tbl), `Expected ${tbl} in supabase/schema.sql`);
  }
});
