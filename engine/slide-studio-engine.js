// Kuzaya AI · Slide Studio — motor determinístico (sem rede, sem modelo externo).
// A fonte é sempre a verdade. O motor nunca inventa factos: apenas reorganiza,
// resume e sinaliza o que inferiu. Tudo o que é sugestão vem marcado.
import {
  SLIDE_SPEC_VERSION, PALETTES, SLIDE_TYPES, INTERACTIVE_TYPES,
  newSlide, validateDeck, qualityCheck,
} from './slide-spec.js?v=4';

export { SLIDE_SPEC_VERSION, PALETTES, SLIDE_TYPES, INTERACTIVE_TYPES, validateDeck, qualityCheck } from './slide-spec.js?v=4';

const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
/* Só HTTP(S) entra em href/src: nenhuma API externa deve poder injectar javascript:. */
const safeUrl = (s) => { const v = String(s || '').trim(); return /^https?:\/\//i.test(v) ? esc(v) : ''; };
const words = (s) => String(s || '').trim().split(/\s+/).filter(Boolean).length;
const clean = (s, max = 220) => String(s || '').replace(/\s+/g, ' ').trim().slice(0, max);
const uniq = (a) => [...new Set(a.filter(Boolean))];
const clamp = (n, lo, hi) => Math.max(lo, Math.min(hi, n));

/* ------------------------------------------------------------------ */
/* 1. Intake e estudo do material                                      */
/* ------------------------------------------------------------------ */

export function defaultBrief(overrides = {}) {
  return {
    language: 'auto',
    level: 'universitário · intermédio',
    durationMin: 50,
    slideCount: 20,
    playfulness: 'balanced',
    use3d: 'auto',
    palette: 'auto',
    speakerNotes: true,
    scope: '',
    ...overrides,
  };
}

function detectLanguage(text) {
  const t = String(text || '').toLowerCase();
  const pt = (t.match(/\b(nganh|não|explicação|conhecimento|aprendizagem|estudantes|porque|também|são|uma|para)\b/g) || []).length;
  const en = (t.match(/\b(the|because|students|learning|however|which|their|this|with)\b/g) || []).length;
  return en > pt * 1.4 ? 'en' : 'pt';
}

export function analyzeSource(input = {}) {
  const raw = String(input.text || '');
  const text = raw.replace(/\r\n?/g, '\n').replace(/[ \t]+/g, ' ').trim();
  const language = detectLanguage(text);
  const lines = text.split('\n').map((l) => l.trim()).filter(Boolean);
  const paragraphs = uniq(text.split(/\n\s*\n/).map((p) => clean(p, 600)).filter((p) => p.length > 24));
  const sentences = uniq(
    text.split(/(?<=[.!?])\s+|\n+/)
      .map((s) => clean(s, 320))
      .filter((s) => s.length >= 24 && /[.!?]?$/.test(s)),
  );
  const headingCandidates = uniq([
    ...(input.headings || []).map((h) => (typeof h === 'string' ? h : h.text) || ''),
    ...lines.filter((l) => l.length < 80 && l.length > 6 && !/[.!?]$/.test(l) && words(l) <= 12),
  ]).slice(0, 18);

  const definitions = [];
  for (const s of sentences) {
    const m = s.match(/^(.{2,48}?)\s+(?:é|significa|consiste em|refere[- ]se a|define[- ]se como|are|is|means)\s+(.{15,220})$/i);
    if (m) definitions.push({ term: clean(m[1], 48), sentence: clean(s, 260) });
  }
  const formulas = uniq(lines.filter((l) => /[=×÷√²³^≤≥±∑∫]|\b\d+(?:[.,]\d+)?\s*(?:m\/s|kg|N|Hz|Kz|%|cm|km|W|J)\b/i.test(l) && l.length < 220)).slice(0, 12);
  const numbers = uniq((text.match(/\b\d+(?:[.,]\d+)?\s*(?:m\/s²?|m\/s|kg|N|Hz|Kz|%|cm|km|W|J|anos?|minutos?|páginas?)?/gi) || []).slice(0, 30));

  const sections = [];
  let current = null;
  for (const line of lines) {
    const isHeading = headingCandidates.includes(line) || /^(capítulo|secção|unidade|tema|parte|aula)\b/i.test(line);
    if (isHeading && line.length < 90) {
      if (current) sections.push(current);
      current = { heading: line, lines: [], anchor: line };
    } else if (current) {
      current.lines.push(line);
      if (!current.anchor || current.anchor === current.heading) current.anchor = line;
    }
  }
  if (current) sections.push(current);
  if (!sections.length) {
    paragraphs.forEach((p, i) => sections.push({ heading: headingCandidates[i] || `Bloco ${i + 1}`, lines: [p], anchor: p.split(/(?<=[.!?])\s+/)[0] || p }));
  }

  const keyTerms = uniq([
    ...definitions.map((d) => d.term),
    ...headingCandidates.filter((h) => words(h) <= 4 && !/^(bloco|capítulo|secção)/i.test(h)),
  ]).slice(0, 12);

  const centralIdea = definitions[0]?.sentence
    || sentences.find((s) => /em resumo|em síntese|conclui|conclusão|therefore|in summary/i.test(s))
    || sentences[0]
    || clean(text, 180);

  const readable = text.length >= 240;
  const warnings = [];
  if (!text.trim()) warnings.push('Nenhum texto extraído — o ficheiro pode estar vazio ou protegido.');
  else if (!readable) warnings.push('Pouco texto extraído. O ficheiro pode ser uma imagem digitalizada (scanned). Peça uma cópia com texto seleccionável ou confirme as páginas antes de apresentar.');
  if (input.truncated) warnings.push('O ficheiro excedeu o limite de páginas e foi truncado. Nem todo o conteúdo foi lido.');
  if (input.ocrFailures > 0) warnings.push(`${input.ocrFailures} página(s) não foram lidas por OCR.`);
  if (!definitions.length) warnings.push('Não foi possível identificar definições explícitas; objectivos e termos foram inferidos e estão marcados.');

  return {
    text, language, filename: input.filename || '', title: clean(input.title || headingCandidates[0] || input.filename || 'Aula sem título', 90),
    lines, paragraphs, sentences, sections, headingCandidates, definitions, formulas, numbers, keyTerms,
    centralIdea, readable, warnings,
    pages: Array.isArray(input.pages) ? input.pages : [],
    inferredObjectives: !/\bobjectivos?\b|learning objectives/i.test(text),
  };
}

export function inferObjectives(analysis, brief) {
  const base = analysis.keyTerms.slice(0, 3).map((t) => `Explicar ${t.toLowerCase()}`);
  const generic = analysis.language === 'en'
    ? ['Explain the main ideas of the source', 'Apply the key concept to a new example', 'Compare the cases studied']
    : ['Explicar as ideias centrais do tema', 'Aplicar o conceito principal a um novo exemplo', 'Comparar os casos estudados'];
  const items = uniq([...base, ...generic]).slice(0, 4);
  return {
    items,
    inferred: analysis.inferredObjectives,
    note: analysis.inferredObjectives
      ? (analysis.language === 'en' ? 'Inferred from the source — please confirm.' : 'Inferidos do ficheiro — confirmar antes de leccionar.')
      : '',
  };
}

/* ------------------------------------------------------------------ */
/* 2. Plano da aula (blueprint)                                        */
/* ------------------------------------------------------------------ */

function claimFrom(analysis, section, index) {
  const def = analysis.definitions.find((d) => section?.lines?.join(' ').toLowerCase().includes(d.term.toLowerCase()))
    || analysis.definitions[index % Math.max(1, analysis.definitions.length)];
  if (def) {
    const core = def.sentence.replace(/^[^:]{0,40}?\b(?:é|significa|consiste em|is|means)\s+/i, '').split(/[.;]/)[0];
    const claim = clean(core, 78).replace(/^(que|de|do|da)\s+/i, '');
    if (words(claim) >= 5) return claim.charAt(0).toUpperCase() + claim.slice(1);
  }
  const first = clean(section?.anchor || analysis.centralIdea, 82).split(/[.;]/)[0];
  const claim = words(first) > 11 ? first.split(/\s+/).slice(0, 10).join(' ') : first;
  return (claim || analysis.title || `Ideia ${index + 1}`).charAt(0).toUpperCase() + (claim || '').slice(1);
}

function pickContentType(analysis, section, idx, brief) {
  const body = section?.lines?.join(' ') || '';
  if (analysis.formulas.some((f) => body.includes(f))) return idx % 2 ? 'worked-example' : 'formula';
  if (/\b(\d{1,2}[º°]?|primeiro|segundo|terceiro|depois|em seguida|finally|then|step)\b/i.test(body) && body.split(/[.!?]/).length >= 3) return 'process';
  if (analysis.definitions.some((d) => body.includes(d.term))) return 'definition';
  if (/\b(vs|versus|enquanto|por outro lado|mas|however|whereas)\b/i.test(body)) return 'compare';
  if (/\b(19|20)\d{2}\b/.test(body)) return 'timeline';
  if (/\b(caso|estudo de caso|exemplo prático|case study)\b/i.test(body)) return 'case-study';
  if (section?.lines?.length > 3) return 'bullets';
  return 'concept';
}

function pickInteraction(analysis, idx, brief, contentTypes) {
  if (brief.use3d === 'off') return ['quiz', 'match', 'sort', 'flip-cards', 'poll', 'think-first'][idx % 6];
  const spatial = /\b(estrutura|camada|sistema|mol[ée]cula|c[ée]lula|circuito|orbit|layer|network|rede|geometr|onda|wave|3d)\b/i.test(analysis.text);
  const wants3d = brief.use3d === 'on' || (brief.use3d === 'auto' && spatial);
  if (wants3d && idx === 1 && analysis.sections.length > 2) return 'scene-3d';
  const cycle = ['quiz', 'match', 'flip-cards', 'think-first', 'sort', 'poll', 'quiz', 'scene-3d'];
  return cycle[idx % cycle.length];
}

export function buildBlueprint(analysis, brief = defaultBrief()) {
  const target = clamp(Math.round(brief.slideCount || analysis.sections.length * 2 + 4), 8, 40);
  const sections = analysis.sections.slice(0, Math.max(2, target - 6));
  const rows = [];
  const push = (title, type, purpose, min) => rows.push({ n: rows.length + 1, title: clean(title, 90), type, purpose, min });

  push(analysis.title, 'title', 'Abrir o tema e dizer o que os alunos vão conseguir fazer', 1);
  // Uma pergunta de abertura gramaticalmente correcta e ancorada no ficheiro.
  // Retirar a primeira palavra da ideia central produzia «O que Solar em Angola.?».
  const def0 = analysis.definitions[0];
  const hookTitle = def0
    ? `${analysis.language === 'en' ? 'What is' : 'O que é'} ${clean(def0.term, 60)}?`
    : `${analysis.language === 'en' ? 'What does the source say about' : 'O que a fonte diz sobre'} ${clean(analysis.title, 70)}?`;
  push(hookTitle, 'hook', 'Despertar interesse com uma pergunta ancorada no ficheiro', 2);
  push(analysis.language === 'en' ? 'By the end, you can explain the core ideas' : 'No fim, consegue explicar as ideias centrais', 'objectives', 'Tornar a meta explícita', 1);

  const contentTypes = [];
  sections.forEach((sec, i) => {
    const ct = pickContentType(analysis, sec, i, brief);
    contentTypes.push(ct);
    push(claimFrom(analysis, sec, i), ct, `Explicar: ${clean(sec.heading, 42)}`, ct === 'worked-example' ? 4 : 3);
    const wantInteraction = brief.playfulness === 'straight' ? i === 1 || i === sections.length - 1
      : brief.playfulness === 'gameshow' ? i % 2 === 0 || i === 1
        : i % 2 === 1 || i === 1;
    if (wantInteraction && rows.length < target - 2) {
      const it = pickInteraction(analysis, i, brief, contentTypes);
      if (!(it === 'scene-3d' && brief.use3d === 'off')) {
        push(`${analysis.language === 'en' ? 'Check' : 'Verifica'}: ${clean(sec.heading, 46)}`, it, `Praticar: ${clean(sec.heading, 42)}`, it === 'scene-3d' || it === 'think-first' ? 3 : 2);
      }
    }
  });

  const ratio = clamp((brief.durationMin || 50) / Math.max(1, rows.reduce((a, r) => a + r.min, 0)), 0.7, 1.5);
  rows.forEach((r) => { r.min = Math.max(1, Math.round(r.min * ratio)); });
  if ((brief.durationMin || 50) > 60 && !rows.some((r) => r.type === 'break')) {
    rows.splice(Math.ceil(rows.length / 2), 0, { n: 0, title: analysis.language === 'en' ? 'Take a break' : 'Pausa de cinco minutos', type: 'break', purpose: 'Consolidar antes da segunda parte', min: 5 });
  }
  push(analysis.language === 'en' ? 'Four ideas to remember' : 'Quatro ideias para levar', 'summary', 'Recuperar sem introduzir ideias novas', 2);
  push(analysis.language === 'en' ? 'For next class' : 'Para a próxima aula', 'next-steps', 'Ligação ao estudo seguinte (sugestão marcada)', 1);
  rows.forEach((r, i) => { r.n = i + 1; });
  return rows;
}

/* ------------------------------------------------------------------ */
/* 3. Notas e conteúdo                                                 */
/* ------------------------------------------------------------------ */

/* Cada tipo de slide pede uma acção diferente em aula. Notas repetidas não
   ajudam o docente: esta roda de prompts dá valor pedagógico sem inventar
   conteúdo — a fonte continua indicada em «Fonte:» em todas as notas. */
const TEACHING_PROMPTS = {
  title: 'Apresente o tema e diga numa frase o que a turma vai conseguir fazer no fim da aula.',
  hook: 'Não responda à pergunta ainda. Deixe a turma especular e depois diga que a resposta está no ficheiro.',
  objectives: 'Leia as metas em voz alta e pergunte qual delas a turma já domina. Ajuste o ritmo a partir daí.',
  concept: 'Peça à turma que reformule a afirmação com as próprias palavras. Volte ao texto para corrigir.',
  bullets: 'Revele um ponto de cada vez. Depois de cada um, pergunte se alguém tem um exemplo real.',
  process: 'Peça à turma que desenhe os passos no caderno antes de os ver. Compare com a fonte.',
  timeline: 'Peça à turma que ordene os acontecimentos antes de revelar. Confirme as datas na fonte.',
  'case-study': 'Divida a turma em grupos: cada grupo decide, depois comparem com o resultado da fonte.',
  quote: 'Pergunte o que a citação quer dizer com as palavras da turma. Só depois leiam a fonte.',
  break: 'Aproveite para circular entre os alunos e ouvir as perguntas que escreveram.',
  quiz: 'Antes de revelar, dê vinte segundos para todos escolherem. Peça a um aluno que justifique a resposta com a passagem indicada em Fonte.',
  match: 'Deixe a turma associar sem ajuda. Depois corrija cada par lendo a definição da fonte em voz alta.',
  sort: 'Peça a justificação de um item de cada categoria. Se houver dúvida, volte à passagem da fonte.',
  'flip-cards': 'Peça primeiro a resposta de memória e só depois vire o cartão. Repita no fim os cartões que a turma errou.',
  poll: 'Não há resposta certa: registe as mãos levantadas e pergunte a quem pensa diferente porquê.',
  'think-first': 'Respeite o tempo de reflexão em silêncio. Só revele a resposta quando todos tiverem escrito algo.',
  'scene-3d': 'Deixe a turma explorar as camadas antes de explicar. Pergunte a função de cada uma e corrija com a descrição em Fonte.',
  'data-chart': 'Pergunte primeiro onde começa o eixo e qual é a unidade. Só depois comente a tendência.',
  definition: 'Peça um exemplo novo com as palavras da turma. Volte à definição da fonte para corrigir.',
  'worked-example': 'Peça à turma para prever o resultado antes do último passo. Verifique as unidades no fim.',
  formula: 'Antes de aplicar, peça a cada aluno para dizer em palavras o que significa cada símbolo.',
  compare: 'Peça um exemplo que caiba em cada coluna. Volte à fonte para confirmar as diferenças.',
  summary: 'Peça à turma que feche o caderno e diga as ideias de memória. Complete com a fonte.',
  'next-steps': 'Esta sugestão não vem do ficheiro: confirme a leitura com o docente antes de a atribuir.',
  'web-insight': 'Mostre o aviso EXTERNO antes de ler. Pergunte à turma se esta informação completa ou contradiz o ficheiro, e abra a ligação para verificar.',
  'image-spotlight': 'Pergunte primeiro o que a imagem mostra e só depois leia a legenda. Confirme a licença na origem antes de voltar a usar esta imagem.',
  'animated-model': 'Deixe a rotação correr uma volta em silêncio. Pause, aponte uma camada e peça a função; compare com a descrição da fonte.',
  'animated-diagram': 'Revele os passos um a um com as setas. Antes do último, peça à turma para prever o que vem a seguir.',
  'video-spotlight': 'Mostre o aviso EXTERNO. Peça à turma para anotar uma ideia do vídeo e depois comparar com o que o ficheiro diz; abra a origem para verificar.',
  'place-spotlight': 'Mostre o aviso EXTERNO. Localize o ponto no mapa, peça a um aluno para descrever a posição e só depois ligue ao que o ficheiro ensina.',
};

function note(parts, kind = '') {
  const body = parts.filter(Boolean).join(' ');
  const specific = TEACHING_PROMPTS[kind]
    || 'Pergunta provável: onde é que isto aparece no texto? Responda apontando a passagem indicada em Fonte.';
  const filler = `${specific} Se a turma estiver dispersa, repita a ideia central com outras palavras antes de avançar.`;
  const full = `${body} ${filler}`;
  return words(full) < 60 ? `${full} Confirmar a leitura com o docente antes de apresentar.`.trim() : clean(full, 900);
}

function anchorOf(analysis, index) {
  const sec = analysis.sections[index % Math.max(1, analysis.sections.length)];
  const sentence = sec?.anchor || analysis.sentences[index % Math.max(1, analysis.sentences.length)] || analysis.centralIdea;
  return { page: sec?.page || null, anchor: clean(sentence, 220) };
}

function fillSlide(row, analysis, brief, objectives, index) {
  const sec = analysis.sections[index % Math.max(1, analysis.sections.length)];
  const body = sec?.lines?.join(' ') || analysis.text.slice(0, 600);
  const anchor = anchorOf(analysis, index);
  const def = analysis.definitions.find((d) => body.toLowerCase().includes(d.term.toLowerCase()))
    || analysis.definitions[index % Math.max(1, analysis.definitions.length)];
  const flags = [];
  if (analysis.inferredObjectives && row.type === 'objectives') flags.push(objectives.note);
  const s = (fields = {}, n = '') => {
    const slide = newSlide(row.type, {
      title: row.title, min: row.min, notes: n || note([
        `Dizer: ${clean(body, 150)}`,
        `Tempo: ${row.min} min.`,
        `Fonte: ${clean(sec?.heading || analysis.filename, 60)}.`,
        ...flags,
      ], row.type),
      source: anchor,
      flags,
      ...fields,
    });
    return slide;
  };

  switch (row.type) {
    case 'title': return s({ subtitle: clean(analysis.centralIdea, 150), course: analysis.filename, lecturer: '', date: '' });
    case 'hook': return s({ prompt: clean(analysis.centralIdea, 150) });
    case 'objectives': flags.push(objectives.note); return s({ items: objectives.items, suggested: objectives.inferred });
    case 'concept': return s({ statement: clean(row.title, 90), support: clean(sec?.anchor || '', 120) });
    case 'bullets': {
      const bullets = uniq((sec?.lines || analysis.sentences).map((l) => clean(l, 90)).filter((l) => l.length > 12)).slice(0, 4);
      return s({ bullets: bullets.length ? bullets : [clean(analysis.centralIdea, 90)] });
    }
    case 'definition': return s({ term: def?.term || clean(sec?.heading || analysis.title, 40), definition: def?.sentence || clean(sec?.anchor || analysis.centralIdea, 180), example: '' });
    case 'process': {
      const steps = uniq((sec?.lines || []).map((l) => clean(l, 110)).filter((l) => l.length > 10)).slice(0, 6);
      return s({ steps: steps.length >= 3 ? steps : [clean(sec?.anchor || analysis.centralIdea, 110), 'Identificar as condições', 'Verificar o resultado'] });
    }
    case 'worked-example': {
      const formula = analysis.formulas[index % Math.max(1, analysis.formulas.length)] || '';
      const nums = analysis.numbers.slice(index, index + 3).join(', ');
      return s({
        problem: clean(sec?.anchor || analysis.centralIdea, 140),
        steps: [clean(formula || sec?.anchor || '', 120), 'Substituir os valores do enunciado', 'Calcular e verificar a unidade'],
        answer: nums ? `Valores presentes na fonte: ${nums}.` : clean(analysis.centralIdea, 120),
        units: nums,
      });
    }
    case 'formula': {
      const eq = analysis.formulas[index % Math.max(1, analysis.formulas.length)] || clean(sec?.anchor || '', 100);
      const legend = (analysis.numbers.slice(0, 3).map((n) => clean(n, 40)) || []).map((n) => ({ symbol: n, meaning: 'valor referido na fonte', unit: '' }));
      return s({ equation: eq, legend: legend.length ? legend : [{ symbol: '—', meaning: 'Consultar a fonte para os símbolos', unit: '' }], applies: clean(sec?.heading || '', 80) });
    }
    case 'diagram': {
      const parts = uniq([sec?.heading, ...(sec?.lines || []).slice(0, 5).map((l) => clean(l, 60))]).filter(Boolean).slice(0, 6);
      return s({ parts: parts.length ? parts : [clean(analysis.centralIdea, 60)], visual: '', alt: '' });
    }
    case 'data-chart': {
      const data = analysis.numbers.slice(0, 5).map((n, i) => ({ label: clean(sec?.heading || `Valor ${i + 1}`, 24), value: parseFloat(String(n).replace(',', '.')) || 1, unit: clean(String(n).replace(/[\d.,]/g, '').trim() || '', 12) }));
      flags.push('Os valores vieram do ficheiro; confirme a unidade antes de projectar.');
      return s({ message: clean(row.title, 90), data: data.length ? data : [{ label: 'Fonte', value: 1, unit: '' }], sourceLine: `Fonte: ${analysis.filename || 'documento do docente'}` });
    }
    case 'compare': {
      const lines = sec?.lines || analysis.sentences.slice(0, 4);
      const half = Math.ceil(lines.length / 2);
      const rowsCmp = lines.slice(0, Math.min(half, 5)).map((l, i) => ({ left: clean(l, 60), right: clean(lines[half + i] || '—', 60) }));
      return s({ leftLabel: clean(sec?.heading || 'A', 26), rightLabel: 'Contraste', rows: rowsCmp.length ? rowsCmp : [{ left: clean(analysis.centralIdea, 60), right: 'Ver fonte' }], difference: clean(row.title, 90) });
    }
    case 'timeline': {
      const events = uniq([...(sec?.lines || []), ...analysis.sentences].filter((l) => /\b(19|20)\d{2}\b/.test(l))).slice(0, 7);
      return s({ events: events.length ? events.map((e) => clean(e, 100)) : [clean(sec?.anchor || analysis.centralIdea, 100)] });
    }
    case 'case-study': return s({ situation: clean(sec?.anchor || analysis.centralIdea, 160), decision: clean(sec?.lines?.[1] || analysis.centralIdea, 140), result: clean(sec?.lines?.[2] || '', 140), lesson: clean(row.title, 100) });
    case 'quote': return s({ text: clean(sec?.anchor || analysis.centralIdea, 180), attribution: clean(analysis.filename || 'Fonte do docente', 60) });
    case 'summary': {
      const takeaways = uniq(analysis.sections.slice(0, 4).map((x) => clean(x.heading, 70)));
      return s({ takeaways: takeaways.length ? takeaways : [clean(analysis.centralIdea, 70)] });
    }
    case 'next-steps': {
      flags.push('Sugestão acrescentada pela Kuzaya AI — confirmar leitura antes de atribuir.');
      return s({ items: [clean(analysis.sections.at(-1)?.heading || sec?.heading || analysis.title, 80), 'Rever as definições assinaladas nas notas'], suggested: true });
    }
    case 'break': return s({ prompt: analysis.language === 'en' ? 'Two minutes: write one question.' : 'Dois minutos: escreva uma pergunta sobre o que viu.' });

    case 'scene-3d': {
      const parts = [sec?.heading, ...(sec?.lines || []).slice(0, 6).map((l) => clean(l, 34))].filter(Boolean).slice(0, 8);
      flags.push('Modelo simplificado em camadas — as proporções não representam escala real.');
      return s({
        goal: `Identificar ${parts.length} partes e explicar a sua função`,
        parts: parts.length >= 3 ? parts : [clean(analysis.centralIdea, 34), 'Parte A', 'Parte B', 'Parte C', 'Parte D'],
        task: analysis.language === 'en' ? 'Tap each layer. Which one matters most here?' : 'Toque em cada camada. Qual é a mais importante neste tema?',
        fallback: clean(sec?.anchor || analysis.centralIdea, 160),
        visual: 'modelo em camadas', alt: `Camadas: ${parts.join('; ')}.`,
      });
    }
    case 'quiz': {
      const correct = clean(sec?.anchor || analysis.centralIdea, 130);
      const opts = uniq([correct, clean(analysis.sections[(index + 1) % analysis.sections.length]?.anchor || '', 130), clean(analysis.sections[(index + 2) % analysis.sections.length]?.anchor || '', 130)])
        .slice(0, 3).map((text, i) => ({ text, correct: i === 0 }));
      flags.push('As alternativas incorrectas foram construídas a partir de outras passagens — não são negações inventadas.');
      return s({ question: `${analysis.language === 'en' ? 'According to the source,' : 'Segundo o ficheiro,'} ${clean(row.title, 90)}?`, options: opts, answer: 0, explanation: correct });
    }
    case 'match': {
      const pairs = analysis.definitions.slice(0, 6).map((d) => ({ left: d.term, right: clean(d.sentence, 90) }));
      return s({ pairs: pairs.length >= 2 ? pairs : [{ left: clean(sec?.heading || 'Termo', 30), right: clean(sec?.anchor || analysis.centralIdea, 90) }] });
    }
    case 'sort': {
      const items = uniq([...sec?.lines || [], ...analysis.sentences].map((l) => clean(l, 70))).slice(0, 8);
      return s({ categories: [clean(sec?.heading || 'Categoria A', 30), 'Outros casos'], items: items.length ? items : [clean(analysis.centralIdea, 70)] });
    }
    case 'flip-cards': {
      const cards = analysis.definitions.slice(0, 8).map((d) => ({ front: d.term, back: clean(d.sentence, 120) }));
      return s({ cards: cards.length >= 2 ? cards : [{ front: clean(sec?.heading || 'Termo', 30), back: clean(sec?.anchor || analysis.centralIdea, 120) }] });
    }
    case 'poll': {
      flags.push('A votação exige opinião — não tem resposta certa.');
      return s({ question: clean(sec?.heading || row.title, 100), options: uniq(analysis.keyTerms.slice(0, 4)).length ? analysis.keyTerms.slice(0, 4) : ['Concordo', 'Discordo', 'Já vi isto'] });
    }
    case 'think-first': {
      const eq = analysis.formulas[index % Math.max(1, analysis.formulas.length)] || clean(sec?.anchor || analysis.centralIdea, 120);
      return s({ prompt: clean(sec?.anchor || analysis.centralIdea, 140), seconds: 60, reveal: clean(eq, 140) });
    }
    default: return s({ prompt: clean(analysis.centralIdea, 120) });
  }
}

export function generateDeck(input = {}, briefOverrides = {}) {
  const brief = defaultBrief(briefOverrides);
  const analysis = analyzeSource({ ...input, text: input.text || input.pages?.map((p) => p.text).join('\n\n') || '' });
  if (brief.language !== 'auto') analysis.language = brief.language;
  const objectives = inferObjectives(analysis, brief);
  const blueprint = buildBlueprint(analysis, brief);
  const palette = brief.palette === 'auto'
    ? (/\b(física|química|biologia|fisica|physics|science)\b/i.test(analysis.text) ? 'forest'
      : /\b(história|literatura|arte|historia|humanities)\b/i.test(analysis.text) ? 'grape' : 'ocean')
    : brief.palette;

  const slides = blueprint.map((row, i) => fillSlide(row, analysis, brief, objectives, i));
  const totalMin = slides.reduce((a, s) => a + (Number(s.min) || 2), 0);
  const accessible = slides.map((sl) => ({
    n: sl.id,
    title: sl.title,
    type: sl.type,
    min: sl.min,
    purpose: blueprint.find((b) => b.title === sl.title)?.purpose || '',
  }));
  const deck = {
    spec: SLIDE_SPEC_VERSION,
    app: 'Kuzaya AI · Slide Studio',
    title: analysis.title,
    sourceName: analysis.filename || 'Fonte colada',
    language: analysis.language,
    palette,
    brief,
    analysis: {
      title: analysis.title, centralIdea: analysis.centralIdea, keyTerms: analysis.keyTerms,
      definitions: analysis.definitions.slice(0, 8), sections: analysis.sections.map((s) => s.heading),
      warnings: analysis.warnings, readable: analysis.readable,
    },
    objectives,
    blueprint: accessible,
    assumptions: [
      `Nível: ${brief.level} (por omissão, se não indicado).`,
      `Duração: ${brief.durationMin} min; ${slides.length} slides (≈0,4/min).`,
      objectives.inferred ? objectives.note : 'Objectivos extraídos do ficheiro.',
      brief.palette === 'auto' ? `Paleta ${palette} escolhida automaticamente pelo tema do ficheiro.` : '',
      'Todos os conteúdos vêm da fonte, excepto o que está marcado como sugestão ou inferido.',
    ].filter(Boolean),
    stats: { slides: slides.length, durationMin: totalMin, pages: analysis.pages.length, words: slides.reduce((a, s) => a + words(s.title), 0) },
    flags: analysis.warnings,
    slides,
    savedAt: new Date().toISOString(),
  };
  const upgraded = applyVisualUpgrades(deck, brief);
  const check = validateDeck(upgraded);
  return { ...check.deck, validation: { errors: check.errors, warnings: qualityCheck(check.deck) } };
}

/* ------------------------------------------------------------------ */
/* 4. Rework de um slide                                               */
/* ------------------------------------------------------------------ */

export function reworkSlide(deck, index, instruction = '') {
  const slides = deck.slides.map((s) => ({ ...s }));
  const slide = slides[index];
  if (!slide) return deck;
  const cmd = instruction.toLowerCase();
  const anchor = slide.source?.anchor || '';
  if (/quiz|pergunta|teste/.test(cmd)) {
    slides[index] = {
      ...slide, type: 'quiz', title: `Verifica: ${clean(slide.title, 56)}`,
      question: `Segundo o ficheiro, ${clean(slide.title, 80).toLowerCase()}?`,
      options: [
        { text: clean(anchor, 120), correct: true },
        { text: 'A fonte não permite concluir isso.', correct: false },
        { text: 'O contrário do que o ficheiro afirma.', correct: false },
      ],
      answer: 0, explanation: clean(anchor, 160),
      flags: uniq([...(slide.flags || []), 'Alternativas incorrectas acrescentadas para o quiz — verificar antes de usar.']),
    };
  } else if (/curto|short|menos texto|resum/.test(cmd)) {
    slides[index] = { ...slide, title: clean(slide.title, 48), flags: uniq([...(slide.flags || []), 'Título encurtado a pedido.']) };
  } else if (/exemplo|example|prático/.test(cmd)) {
    slides[index] = { ...slide, type: 'worked-example', problem: clean(anchor, 140), steps: [clean(anchor, 120), 'Aplicar ao caso da aula'], answer: clean(slide.title, 100), flags: uniq([...(slide.flags || []), 'Exemplo reutiliza passagem da fonte.']) };
  } else if (/3d|cena|modelo/.test(cmd)) {
    slides[index] = { ...slide, type: 'scene-3d', goal: clean(slide.title, 80), parts: ['Parte 1', 'Parte 2', 'Parte 3', 'Parte 4', 'Parte 5'], task: 'Toque em cada parte e descreva o que faz.', fallback: clean(anchor, 160), visual: 'modelo em camadas', alt: 'Modelo simplificado com cinco partes rotuladas.' };
  } else {
    slides[index] = { ...slide, title: clean(instruction || slide.title, 90), flags: uniq([...(slide.flags || []), `Rework pedido: ${clean(instruction, 80)}`]) };
  }
  slides[index].notes = note([
    `Dizer: ${clean(slides[index].title, 120)}.`,
    `Fonte: ${clean(anchor || deck.sourceName, 60)}.`,
    `Rework: ${clean(instruction, 70) || 'geral'}.`,
    ...(slides[index].flags || []),
  ], slides[index].type);
  return { ...deck, slides, validation: { errors: [], warnings: qualityCheck({ ...deck, slides }) } };
}

/* ------------------------------------------------------------------ */
/* 4b. Camada visual e investigação (v1.1)                            */
/* ------------------------------------------------------------------ */

/* Melhora a forma de comunicar SEM inventar factos: converte um esquema de
   origem num esquema animado e uma cena 3D existente num modelo com rotação.
   Se não houver material adequado, não acrescenta nada. */
export function applyVisualUpgrades(deck, brief = defaultBrief()) {
  if (!deck || !Array.isArray(deck.slides) || brief.use3d === 'off') return deck;
  const slides = deck.slides.map((s) => ({ ...s }));
  let diagramAt = slides.findIndex((s) => s.type === 'diagram');
  if (diagramAt >= 0) {
    const s = slides[diagramAt];
    slides[diagramAt] = {
      ...s,
      type: 'animated-diagram',
      visual: 'esquema animado',
      alt: s.alt || `Esquema animado: ${(s.parts || []).join(' → ')}.`,
      caption: 'As setas mostram a ordem; toque em cada passo para o revelar.',
    };
  }
  let sceneAt = slides.findIndex((s) => s.type === 'scene-3d');
  if (sceneAt < 0) {
    const cand = slides.findIndex((s) => ['concept', 'process', 'diagram', 'animated-diagram'].includes(s.type));
    if (cand >= 0 && /^sim$|on$/i.test(String(brief.use3d))) sceneAt = cand;
  }
  if (sceneAt >= 0 && slides[sceneAt]) {
    const s = slides[sceneAt];
    slides[sceneAt] = {
      ...s,
      type: 'animated-model',
      visual: 'modelo 3D animado',
      alt: s.alt || `Modelo em camadas: ${(s.parts || []).join('; ')}.`,
      autoRotate: true,
      flags: uniq([...(s.flags || []), 'Modelo 3D simplificado a partir da estrutura do ficheiro — proporções não representam escala real.']),
    };
  }
  const out = { ...deck, slides, visualUpgraded: true };
  const check = validateDeck(out);
  return { ...check.deck, validation: { errors: check.errors, warnings: qualityCheck(check.deck) } };
}

/* Junta informação da web ao deck SEM apagar nada do ficheiro. Cada informação
   externa entra como slide marcado, com ligação de verificação e aviso de
   licença. Nunca é usada para responder a perguntas do quiz nem para notas. */
export function mergeEnrichment(deck, enrichment = {}, opts = {}) {
  if (!deck || !Array.isArray(deck.slides) || !Array.isArray(enrichment.items) || !enrichment.items.length) return deck;
  const max = Math.max(1, Math.min(6, Number(opts.maxItems) || 4));
  const slides = deck.slides.slice();
  const external = [];
  const anchor = slides[Math.min(3, slides.length - 1)]?.source?.anchor || deck.analysis?.centralIdea || deck.sourceName || 'documento do docente';
  const anchorPage = slides[Math.min(3, slides.length - 1)]?.source?.page ?? null;

  enrichment.items.slice(0, max).forEach((item, i) => {
    const sourceUrl = safeUrl(item.url);
    const flags = ['Acrescentado pela Kuzaya AI a partir da Wikipédia — verificar antes de leccionar.'];
    const base = {
      source: { page: anchorPage, anchor: `Ficheiro do docente: ${clean(anchor, 150)}` },
      flags,
      external: true,
      sourceUrl,
      min: 2,
    };
    if (item.image && item.image.url && opts.images !== false) {
      external.push(newSlide('image-spotlight', {
        ...base,
        title: `Ver: ${clean(item.title, 70)}`,
        imageUrl: safeUrl(item.image.url),
        imageAlt: clean(item.image.alt || item.title, 160),
        caption: clean(item.text, 150),
        credit: clean(item.image.credit || 'Wikimedia Commons via Wikipédia', 80),
        localAnchor: clean(anchor, 130),
        license: 'Conferir licença na página de origem.',
        notes: note([
          `Mostrar a imagem de «${clean(item.title, 60)}».`,
          `Ligação ao ficheiro: ${clean(anchor, 120)}.`,
          `Origem externa: ${clean(item.title, 60)} — ${sourceUrl}.`,
          'Imagem obtida da Wikipédia/Wikimedia; conferir licença e direitos antes de projectar.',
        ], 'image-spotlight'),
      }));
    }
    external.push(newSlide('web-insight', {
      ...base,
      title: clean(item.title, 70),
      insight: clean(item.text, 240),
      localAnchor: clean(anchor, 150),
      sourceTitle: clean(item.title, 80),
      license: 'Wikipédia — verificar licença e exactidão na página de origem.',
      notes: note([
        `Ler em voz alta o trecho externo sobre «${clean(item.title, 55)}».`,
        `Comparar com o que o ficheiro diz: ${clean(anchor, 120)}.`,
        `Origem externa: ${clean(item.title, 55)} — ${sourceUrl}.`,
        'Perguntar à turma se a informação externa contradiz, completa ou repete o ficheiro.',
      ], 'web-insight'),
    }));
  });

  const at = Math.min(Math.max(2, Math.ceil(slides.length / 3)), slides.length - 1);
  const next = [...slides.slice(0, at), ...external, ...slides.slice(at)];
  const out = {
    ...deck,
    slides: next,
    enrichment: {
      enabled: true,
      language: enrichment.language || deck.language,
      retrievedAt: new Date().toISOString(),
      items: enrichment.items.slice(0, max).map((i) => ({
        title: i.title, url: i.url, wiki: i.wiki, image: i.image ? i.image.url : null,
      })),
      errors: enrichment.errors || [],
    },
    stats: {
      ...deck.stats,
      slides: next.length,
      durationMin: (Number(deck.stats?.durationMin) || 0) + external.length * 2,
      external: external.length,
    },
    assumptions: [...(deck.assumptions || []), 'Informação externa da Wikipédia foi acrescentada e está marcada como EXTERNO; não faz parte do ficheiro do docente.'],
    flags: uniq([...(deck.flags || []), 'Deck enriquecido com fontes externas — verificar antes de apresentar.']),
  };
  const check = validateDeck(out);
  return { ...check.deck, validation: { errors: check.errors, warnings: qualityCheck(check.deck) } };
}

/* ------------------------------------------------------------------ */
/* 4c. Fusão por omissão: ficheiro + web num só slide (v1.2)           */
/* ------------------------------------------------------------------ */

/* Junta o que a web encontrou DENTRO do conteúdo de cada slide. O texto do
   docente continua intacto; acrescentamos uma linha «A WEB ACRESCENTA» com
   ligação verificável. Nada é usado para mudar respostas de quiz. */
export function fuseEnrichment(deck, web = {}, opts = {}) {
  if (!deck || !Array.isArray(deck.slides)) return deck;
  const items = Array.isArray(web.items) ? web.items : [];
  const videos = Array.isArray(web.videos) ? web.videos : [];
  const places = Array.isArray(web.places) ? web.places : [];
  if (!items.length && !videos.length && !places.length) return deck;

  const slides = deck.slides.map((s) => ({ ...s }));
  const pool = [
    ...items.map((i) => ({
      text: clean(i.text, 200),
      title: clean(i.title, 70),
      url: safeUrl(i.url),
      image: i.image ? { url: safeUrl(i.image.url), alt: clean(i.image.alt || i.title, 140), credit: clean(i.image.credit || 'Wikimedia', 70) } : null,
      source: 'Wikipédia / Wikimedia',
    })),
    ...places.map((p) => ({
      text: clean(p.text, 200),
      title: clean(p.name || p.title, 70),
      url: safeUrl(p.url),
      image: null,
      source: p.source || 'OpenStreetMap',
    })),
  ].filter((p) => p.text && p.url);

  /* Encontrar o par (slide, informação) com maior sobreposição de palavras. */
  const tokens = (s) => new Set(String(s || '').toLowerCase().replace(/[^\p{L}\p{N}]+/gu, ' ').split(/\s+/).filter((w) => w.length > 4));
  const score = (slide, item) => {
    const a = tokens([slide.title, slide.statement, slide.question, slide.goal, slide.difference, ...listOf(slide.bullets), ...listOf(slide.parts), ...listOf(slide.takeaways)].join(' '));
    const b = tokens(`${item.title} ${item.text}`);
    let n = 0;
    b.forEach((w) => { if (a.has(w)) n += 1; });
    return n;
  };

  const used = new Set();
  slides.forEach((slide, idx) => {
    if (slide.type === 'title' || slide.type === 'break' || slide.type === 'summary' || slide.type === 'next-steps') return;
    let best = null;
    let bestScore = 0;
    pool.forEach((item, k) => {
      if (used.has(k)) return;
      const sc = score(slide, item);
      if (sc > bestScore) { best = item; bestScore = sc; }
    });
    if (!best || bestScore < 1) return;
    used.add(pool.indexOf(best));

    const line = `${best.text} — ${best.title}`;
    const webBlock = { text: line, sourceTitle: best.title, sourceUrl: best.url, source: best.source, image: best.image };
    slide.web = webBlock;
    slide.flags = uniq([...(slide.flags || []), `Web fundido: ${best.title} · ${best.url}`]);

    /* «Alterar com a informação da net»: a frase externa entra no corpo da
       aula, no sítio natural de cada tipo de slide. Nunca apaga a fonte. */
    const addSupport = (field) => {
      const old = String(slide[field] || '').trim();
      slide[field] = old ? `${old} ${best.text}` : best.text;
    };
    switch (slide.type) {
      case 'concept':
      case 'compare':
      case 'formula':
      case 'worked-example': addSupport('support'); break;
      case 'definition': addSupport('example'); break;
      case 'bullets':
      case 'objectives': slide.bullets = slide.bullets ? [...slide.bullets, `WEB: ${best.text}`] : slide.bullets; break;
      case 'quiz': addSupport('explanation'); break;
      case 'process':
      case 'timeline':
      case 'animated-diagram': addSupport('caption'); break;
      case 'case-study': addSupport('lesson'); break;
      case 'web-insight': slide.insight = `${slide.insight || ''} ${best.text}`.trim(); break;
      default: addSupport('support');
    }
    slide.notes = `${slide.notes || ''} Complemento da web em ${best.source}: ${best.text} Verificar em ${best.url}.`.trim();
  });

  /* Mapa e vídeo: um slide visual cada, curto e com origem. */
  const extra = [];
  if (places.length) {
    const p = places[0];
    extra.push(newSlide('place-spotlight', {
      id: `web-place-${Date.now().toString(36)}`,
      title: `No mapa: ${clean(p.name || p.title, 60)}`,
      placeName: clean(p.name || p.title, 80),
      mapUrl: safeUrl(p.map || googleMapFallback(p.name || p.title)),
      sourceUrl: safeUrl(p.url),
      lat: p.lat, lon: p.lon,
      caption: clean(p.text, 180),
      visual: 'mapa incorporado',
      alt: `Mapa de ${clean(p.name || p.title, 60)} em Luanda, Angola.`,
      source: { page: null, anchor: `Ficheiro: ${clean(deck.sourceName || 'aula', 80)}` },
      flags: [`EXTERNO · local acrescentado da web (${p.source || 'OpenStreetMap'}) — verificar em ${p.url}`],
      min: 2,
      notes: note([
        `Localizar ${clean(p.name || p.title, 60)} no mapa antes de explicar.`,
        `Ligação ao ficheiro do docente: ${clean(deck.analysis?.centralIdea || deck.title, 120)}.`,
        `Origem do local: ${p.source || 'OpenStreetMap'} — ${p.url}.`,
        'O mapa é incorporado do Google/OpenStreetMap; confirmar a grafia do bairro na origem.',
      ], 'place-spotlight'),
    }));
  }
  if (videos.length) {
    const v = videos[0];
    extra.push(newSlide('video-spotlight', {
      id: `web-video-${Date.now().toString(36)}`,
      title: `Ver: ${clean(v.title, 60)}`,
      embedUrl: safeUrl(v.embed),
      sourceUrl: safeUrl(v.url),
      imageUrl: safeUrl(v.image?.url),
      caption: clean(v.text, 160),
      credit: 'YouTube · vídeo citado no material',
      source: { page: null, anchor: `Ficheiro: ${clean(deck.sourceName || 'aula', 80)}` },
      flags: [`EXTERNO · vídeo da web — verificar em ${v.url}`],
      min: 3,
      notes: note([
        `Mostrar o vídeo de ${clean(v.title, 55)} e pedir atenção a um ponto concreto.`,
        'O vídeo veio de um link presente no material do docente.',
        `Origem: ${v.url}. Confirmar disponibilidade antes de leccionar.`,
      ], 'video-spotlight'),
    }));
  }

  const at = Math.min(slides.length, Math.max(2, Math.ceil(slides.length / 2)));
  const next = [...slides.slice(0, at), ...extra, ...slides.slice(at)];
  const out = {
    ...deck,
    slides: next,
    webFused: true,
    webSources: {
      items: pool.map((p) => ({ title: p.title, url: p.url, source: p.source })),
      places: places.slice(0, 6).map((p) => ({ name: p.name || p.title, url: p.url, map: p.map })),
      videos: videos.map((v) => ({ title: v.title, url: v.url })),
      retrievedAt: new Date().toISOString(),
    },
    stats: {
      ...deck.stats,
      slides: next.length,
      durationMin: (Number(deck.stats?.durationMin) || 0) + extra.reduce((a, s) => a + s.min, 0),
    },
    assumptions: [...(deck.assumptions || []), 'Informação da web foi fundida nos slides e marcada com a origem; o ficheiro do docente continua a ser a verdade.'],
  };
  const check = validateDeck(out);
  return { ...check.deck, validation: { errors: check.errors, warnings: qualityCheck(check.deck) } };
}

const googleMapFallback = (q) => `https://www.google.com/maps?q=${encodeURIComponent(String(q || 'Luanda, Angola'))}&output=embed`;
const listOf = (v) => (Array.isArray(v) ? v : []);

/* ------------------------------------------------------------------ */
/* 5. Renderizador partilhado (player + exportação offline)            */
/* ------------------------------------------------------------------ */

function chips(list, cls = '') {
  return (Array.isArray(list) ? list : []).map((v) => `<span class="ss-chip ${cls}">${esc(typeof v === 'string' ? v : v.text || v.label || '')}</span>`).join('');
}
function listItems(list, tag = 'ul') {
  return `<${tag} class="ss-list">${(Array.isArray(list) ? list : []).map((v, i) => `<li data-step="${i + 1}">${esc(typeof v === 'string' ? v : v.text || v.left || v.title || '')}</li>`).join('')}</${tag}>`;
}
function badge(slide) {
  const spec = SLIDE_TYPES[slide.type];
  return spec?.interactive ? `<span class="ss-badge">${spec.heavy ? 'EXPLORAR' : 'TENTAR'}</span>` : '';
}

function slideBodyBase(slide, deck, opts = {}) {
  const interactive = !!SLIDE_TYPES[slide.type]?.interactive;
  switch (slide.type) {
    case 'title': return `<div class="ss-cover"><p class="ss-lead">${esc(slide.subtitle)}</p><p class="ss-meta">${esc(slide.course || deck.sourceName)} · ${deck.stats.slides} slides · ~${deck.stats.durationMin} min</p></div>`;
    case 'hook': return `<div class="ss-hook"><p>${esc(slide.prompt)}</p></div>`;
    case 'objectives': return `${listItems(slide.items)}${slide.suggested ? '<p class="ss-flag">Objectivos inferidos — confirmar.</p>' : ''}`;
    case 'concept': return `<p class="ss-big">${esc(slide.statement)}</p>${slide.support ? `<p class="ss-support">${esc(slide.support)}</p>` : ''}`;
    case 'bullets': return listItems(slide.bullets);
    case 'definition': return `<p class="ss-term">${esc(slide.term)}</p><p class="ss-def">${esc(slide.definition)}</p>${slide.example ? `<p class="ss-support">Ex.: ${esc(slide.example)}</p>` : ''}`;
    case 'process': return `<ol class="ss-list ss-steps">${(slide.steps || []).map((v, i) => `<li data-step="${i + 1}"><b>${String(i + 1).padStart(2, '0')}</b><span>${esc(typeof v === 'string' ? v : v.text || v.action || '')}</span></li>`).join('')}</ol>`;
    case 'worked-example': return `<p class="ss-problem">${esc(slide.problem)}</p><ol class="ss-list ss-steps">${(slide.steps || []).map((v, i) => `<li data-step="${i + 1}"><b>${String(i + 1).padStart(2, '0')}</b><span>${esc(typeof v === 'string' ? v : v.text || '')}</span></li>`).join('')}</ol><p class="ss-answer">${esc(slide.answer)}</p>`;
    case 'formula': return `<p class="ss-formula">${esc(slide.equation)}</p><div class="ss-legend">${(slide.legend || []).map((l) => `<span><b>${esc(l.symbol)}</b> ${esc(l.meaning)} ${esc(l.unit)}</span>`).join('')}</div>${slide.applies ? `<p class="ss-support">Aplica-se quando: ${esc(slide.applies)}</p>` : ''}`;
    case 'diagram': return `<div class="ss-diagram">${(slide.parts || []).map((p, i) => `<span class="ss-node" data-step="${i + 1}">${esc(typeof p === 'string' ? p : p.label || '')}</span>`).join('<i class="ss-arrow">→</i>')}</div>${slide.alt ? `<p class="ss-sr">${esc(slide.alt)}</p>` : ''}`;
    case 'data-chart': {
      const max = Math.max(1, ...(slide.data || []).map((d) => Math.abs(Number(d.value) || 0)));
      return `<div class="ss-chart">${(slide.data || []).map((d) => `<div class="ss-bar-row"><span>${esc(d.label)}</span><div class="ss-bar-track"><div class="ss-bar" style="width:${Math.max(3, Math.round((Math.abs(Number(d.value) || 0) / max) * 100))}%"></div></div><b>${esc(d.value)}${esc(d.unit ? ' ' + d.unit : '')}</b></div>`).join('')}</div><p class="ss-source-line">${esc(slide.sourceLine)} · eixo começa em zero</p>`;
    }
    case 'compare': return `<p class="ss-cmp-head"><span>${esc(slide.leftLabel)}</span><span>${esc(slide.rightLabel)}</span></p><div class="ss-compare">${(slide.rows || []).map((r) => `<div><span>${esc(r.left)}</span><span>${esc(r.right)}</span></div>`).join('')}</div><p class="ss-support">${esc(slide.difference)}</p>`;
    case 'timeline': return `<ol class="ss-timeline">${(slide.events || []).map((e, i) => `<li data-step="${i + 1}"><b>${esc(typeof e === 'string' && /\b(19|20)\d{2}\b/.test(e) ? e.match(/\b(19|20)\d{2}\b/)[0] : String(i + 1).padStart(2, '0'))}</b><span>${esc(typeof e === 'string' ? e : e.text || '')}</span></li>`).join('')}</ol>`;
    case 'case-study': return `<div class="ss-case"><div><b>Situação</b><p>${esc(slide.situation)}</p></div><div><b>Decisão</b><p>${esc(slide.decision)}</p></div><div><b>Resultado</b><p>${esc(slide.result)}</p></div><div><b>Lição</b><p>${esc(slide.lesson)}</p></div></div>`;
    case 'quote': return `<blockquote class="ss-quote">“${esc(slide.text)}”</blockquote><p class="ss-source-line">— ${esc(slide.attribution)}</p>`;
    case 'summary': return `${listItems(slide.takeaways)}${listItems((deck.objectives?.items || []).map((o) => `✓ ${o}`))}`;
    case 'next-steps': return `${listItems(slide.items)}${slide.suggested ? '<p class="ss-flag">Sugestão da Kuzaya AI — verificar antes de atribuir.</p>' : ''}`;
    case 'break': return `<p class="ss-big">${esc(slide.prompt)}</p>`;

    case 'scene-3d': return `<div class="ss-scene" data-scene="${esc(slide.id)}">
        <p class="ss-task">${esc(slide.task)}</p>
        <div class="ss-layer-stack">${(slide.parts || []).map((p, i) => `<button type="button" class="ss-layer" data-part="${i}" style="--i:${i}">${esc(typeof p === 'string' ? p : p.label || '')}<small data-part-note hidden></small></button>`).join('')}</div>
        <div class="ss-scene-actions"><button type="button" class="ss-mini" data-reset-view>Repor vista</button><span>Modelo simplificado · não à escala</span></div>
        <details class="ss-fallback"><summary>Sem 3D? Ver descrição</summary><p>${esc(slide.fallback)}</p></details>
        <p class="ss-sr">Objectivo: ${esc(slide.goal)}. ${esc(slide.alt || '')}</p>
      </div>`;
    case 'quiz': return `<div class="ss-quiz" data-quiz="${esc(slide.id)}"><p class="ss-task">${esc(slide.question)}</p>${(slide.options || []).map((op, i) => `<button type="button" class="ss-option" data-option="${i}" data-correct="${op.correct ? '1' : '0'}"><b>${'ABCD'[i] || i + 1}</b><span>${esc(op.text)}</span></button>`).join('')}<div class="ss-reveal" hidden><b>${Number(slide.answer) === 0 ? 'Resposta A' : 'Resposta revelada'}</b><p>${esc(slide.explanation)}</p></div></div>`;
    case 'match': return `<div class="ss-match">${(slide.pairs || []).map((p, i) => `<div class="ss-pair"><button type="button" data-match="${i}">${esc(p.left)}</button><button type="button" data-drop="${i}">${esc(p.right)}</button></div>`).join('')}</div>`;
    case 'sort': return `<div class="ss-sort"><p class="ss-task">Classifique cada item</p><div class="ss-sort-cats">${(slide.categories || []).map((c) => `<span>${esc(c)}</span>`).join('')}</div>${chips(slide.items, 'ss-sort-item')}</div>`;
    case 'flip-cards': return `<div class="ss-flips">${(slide.cards || []).map((c) => `<button type="button" class="ss-flip"><span class="ss-front">${esc(c.front)}</span><span class="ss-back" hidden>${esc(c.back)}</span></button>`).join('')}</div>`;
    case 'poll': return `<div class="ss-poll"><p class="ss-task">${esc(slide.question)}</p>${chips(slide.options)}<p class="ss-flag">Sem resposta certa — mostrar de mãos levantadas.</p></div>`;
    case 'think-first': return `<div class="ss-think"><p class="ss-task">${esc(slide.prompt)}</p><p class="ss-timer">${Number(slide.seconds) || 60}s</p><div class="ss-reveal" hidden><b>Resposta e passo-chave</b><p>${esc(slide.reveal)}</p></div></div>`;

    /* ---------------- v1.1: investigação web + visuais animados --------------- */
    case 'web-insight': {
      const url = safeUrl(slide.sourceUrl);
      const img = safeUrl(slide.imageUrl);
      return `<div class="ss-webcard">
        <div class="ss-web-side ss-web-local"><span class="ss-web-tag">DO SEU FICHEIRO</span><p>${esc(slide.localAnchor)}</p></div>
        <div class="ss-web-plus" aria-hidden="true">+</div>
        <div class="ss-web-side ss-web-external"><span class="ss-web-tag ss-web-tag-ext">EXTERNO · VERIFICAR</span><p>${esc(slide.insight)}</p>
          ${img ? `<img class="ss-web-thumb" src="${img}" alt="${esc(slide.imageAlt || slide.sourceTitle)}" loading="lazy" onerror="this.style.display='none'">` : ''}
          <a class="ss-web-link" href="${url}" target="_blank" rel="noopener noreferrer">${esc(slide.sourceTitle)} ↗</a></div>
      </div>`;
    }
    case 'image-spotlight': {
      const url = safeUrl(slide.imageUrl);
      const page = safeUrl(slide.sourceUrl);
      return `<div class="ss-spotlight">
        <figure class="ss-spot-figure">
          ${url ? `<img src="${url}" alt="${esc(slide.imageAlt || slide.title)}" loading="lazy" onerror="this.parentElement.classList.add('img-failed');this.remove()">` : ''}
          <figcaption class="ss-img-fallback">Imagem indisponível sem ligação — descrição: ${esc(slide.imageAlt)}</figcaption>
        </figure>
        <div class="ss-spot-copy"><p class="ss-caption">${esc(slide.caption)}</p>
          ${slide.localAnchor ? `<p class="ss-support">No ficheiro: ${esc(slide.localAnchor)}</p>` : ''}
          <p class="ss-credit">Imagem: ${esc(slide.credit)}${page ? ` · <a href="${page}" target="_blank" rel="noopener noreferrer">ver origem ↗</a>` : ''}</p>
        </div>
      </div>`;
    }
    case 'animated-model': {
      const parts = slide.parts || [];
      const n = Math.max(1, parts.length);
      return `<div class="ss-model ${slide.autoRotate === false ? 'paused' : ''}" data-model="${esc(slide.id)}">
        <p class="ss-task">${esc(slide.task)}</p>
        <div class="ss-model-view" role="img" aria-label="${esc(slide.alt || slide.goal)}">
          <div class="ss-model-rig">
            ${parts.map((p, i) => `<button type="button" class="ss-model-layer" data-layer="${i}" style="--i:${i};--n:${n};--rot:${Math.round((360 / n) * i)}deg;--y:${Math.round((i - (n - 1) / 2) * 22)}px" title="${esc(typeof p === 'string' ? p : p.label || '')}"><span>${esc(typeof p === 'string' ? p : p.label || '')}</span></button>`).join('')}
          </div>
          <div class="ss-model-floor"></div>
        </div>
        <div class="ss-scene-actions"><button type="button" class="ss-mini" data-model-toggle>Pausar rotação</button>
          <button type="button" class="ss-mini" data-model-left aria-label="Rodar para a esquerda">↺</button>
          <button type="button" class="ss-mini" data-model-right aria-label="Rodar para a direita">↻</button>
          <span>Modelo simplificado · não à escala</span></div>
        <details class="ss-fallback"><summary>Sem animação? Ver descrição</summary><p>${esc(slide.fallback)}</p></details>
        <p class="ss-sr">Objectivo: ${esc(slide.goal)}. ${esc(slide.alt || '')}</p>
      </div>`;
    }
    case 'animated-diagram': {
      const parts = slide.parts || [];
      return `<div class="ss-anim-diagram" role="img" aria-label="${esc(slide.alt || slide.title)}">
        <div class="ss-ad-flow">
          ${parts.map((p, i) => `<div class="ss-ad-node" data-step="${i + 1}" style="--i:${i}"><span class="ss-ad-n">${String(i + 1).padStart(2, '0')}</span><span>${esc(typeof p === 'string' ? p : p.label || '')}</span></div>${i < parts.length - 1 ? '<span class="ss-ad-link"><i></i></span>' : ''}`).join('')}
        </div>
        ${slide.caption ? `<p class="ss-support">${esc(slide.caption)}</p>` : ''}
      </div>`;
    }
    case 'video-spotlight': {
      const embed = safeUrl(slide.embedUrl);
      const img = safeUrl(slide.imageUrl);
      return `<div class="ss-video">
        <div class="ss-video-frame">${embed ? `<iframe src="${embed}" title="${esc(slide.title)}" loading="lazy" allow="accelerometer;autoplay;clipboard-write;encrypted-media;picture-in-picture" allowfullscreen referrerpolicy="no-referrer-when-downgrade"></iframe>` : ''}${img ? `<img class="ss-video-poster" src="${img}" alt="${esc(slide.caption || slide.title)}" loading="lazy" onerror="this.remove()">` : ''}</div>
        <p class="ss-caption">${esc(slide.caption || '')}</p>
        <a class="ss-web-link" href="${safeUrl(slide.sourceUrl)}" target="_blank" rel="noopener noreferrer">EXTERNO · ver vídeo ↗</a>
      </div>`;
    }
    case 'place-spotlight': {
      const map = safeUrl(slide.mapUrl);
      return `<div class="ss-place">
        <div class="ss-map-frame">${map ? `<iframe src="${map}" title="Mapa de ${esc(slide.placeName)}" loading="lazy" referrerpolicy="no-referrer-when-downgrade"></iframe>` : ''}</div>
        <div class="ss-place-copy"><span class="ss-web-tag ss-web-tag-ext">EXTERNO · LOCAL</span>
          <p class="ss-caption">${esc(slide.placeName)}</p>
          <p class="ss-support">${esc(slide.caption || '')}</p>
          ${slide.lat && slide.lon ? `<p class="ss-credit">${Number(slide.lat).toFixed(3)}°, ${Number(slide.lon).toFixed(3)}°</p>` : ''}
          <a class="ss-web-link" href="${safeUrl(slide.sourceUrl)}" target="_blank" rel="noopener noreferrer">Ver origem ↗</a>
        </div>
      </div>`;
    }
    default: return `<p>${esc(slide.prompt || slide.title)}</p>`;
  }
}

/* Uma única linha discreta por slide: o que a web acrescentou e de onde vem.
   «Pouco barulho»: nothing competes with the teacher's own content. */
function webFusionStrip(slide) {
  const w = slide.web;
  if (!w || !w.text) return '';
  const url = safeUrl(w.sourceUrl);
  const img = safeUrl(w.image?.url);
  return `<div class="ss-fusion">
    ${img ? `<img src="${img}" alt="${esc(w.image.alt || w.sourceTitle)}" loading="lazy" onerror="this.remove()">` : ''}
    <div><span class="ss-fusion-tag">A WEB ACRESCENTA · ${esc(w.source || 'web')}</span>
      <p>${esc(w.text)}</p>
      ${url ? `<a href="${url}" target="_blank" rel="noopener noreferrer">${esc(w.sourceTitle)} ↗</a>` : ''}
    </div>
  </div>`;
}

export function slideBody(slide, deck, opts = {}) {
  return slideBodyBase(slide, deck, opts) + webFusionStrip(slide);
}

export function renderSlide(slide, deck, index, opts = {}) {
  const palette = PALETTES[deck.palette] || PALETTES.ama;
  const src = slide.source?.page ? `p.${slide.source.page}` : (deck.sourceName || 'AMA');
  return `<article class="ss-slide ss-type-${esc(slide.type)}" data-index="${index}" style="--ss-bg:${palette.bg};--ss-fg:${palette.text};--ss-ac:${palette.accent};--ss-se:${palette.secondary}">
    <header class="ss-slide-head"><span>KUZAYA AI · SLIDE STUDIO</span><span>${esc(src)}</span>${badge(slide)}</header>
    <h2 data-step="0">${esc(slide.title)}</h2>
    <div class="ss-body">${slideBody(slide, deck, opts)}</div>
    <footer class="ss-slide-foot"><span>Fonte: ${esc(slide.source?.anchor || deck.sourceName || 'documento do docente')}</span><span>AMA · ${String(index + 1).padStart(2, '0')} / ${String(deck.slides.length).padStart(2, '0')}</span></footer>
  </article>`;
}

export function renderNotes(slide, deck, index) {
  return `<section class="ss-notes"><h3>Notas · ${String(index + 1).padStart(2, '0')} ${esc(slide.title)}</h3>
    <p>${esc(slide.notes || 'Sem notas.')}</p>
    <dl><dt>Tempo</dt><dd>${Number(slide.min) || 2} min</dd><dt>Fonte</dt><dd>${esc(slide.source?.anchor || deck.sourceName)}</dd><dt>Tipo</dt><dd>${esc(SLIDE_TYPES[slide.type]?.label || slide.type)}</dd></dl>
    ${(slide.flags || []).length ? `<p class="ss-flag">${slide.flags.map(esc).join(' · ')}</p>` : ''}</section>`;
}

/* ------------------------------------------------------------------ */
/* 6. Exportação de player offline                                    */
/* ------------------------------------------------------------------ */

export function standaloneHtml(deck) {
  const palette = PALETTES[deck.palette] || PALETTES.ama;
  const slides = deck.slides.map((s, i) => renderSlide(s, deck, i)).join('');
  const notes = deck.slides.map((s, i) => renderNotes(s, deck, i)).join('');
  return `<!doctype html><html lang="${esc(deck.language || 'pt')}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(deck.title)} · AMA</title>
<style>
:root{color-scheme:${palette.dark ? 'dark' : 'light'}}
*{box-sizing:border-box}body{margin:0;background:#0c1512;color:#eaf3ed;font:16px/1.5 system-ui,-apple-system,Segoe UI,sans-serif}
main{max-width:1180px;margin:0 auto;padding:16px}.ss-slide{--ss-bg:${palette.bg};--ss-fg:${palette.text};--ss-ac:${palette.accent};--ss-se:${palette.secondary};background:var(--ss-bg);color:var(--ss-fg);aspect-ratio:16/9;padding:4% 6%;border-radius:14px;display:flex;flex-direction:column;position:relative;overflow:hidden}
.ss-slide[hidden],.ss-notes[hidden]{display:none}.ss-slide-head,.ss-slide-foot{display:flex;gap:14px;justify-content:space-between;font:700 12px/1.3 ui-monospace,monospace;letter-spacing:.06em;opacity:.82}
.ss-slide h2{font:800 clamp(24px,4.2vw,58px)/1.1 system-ui,sans-serif;margin:auto 0 3%;max-width:88%}.ss-body{font-size:clamp(15px,2vw,26px);max-width:88%}.ss-slide-foot{margin-top:auto;font-size:11px;opacity:.7}.ss-badge{color:#0c1512;background:var(--ss-ac);padding:2px 8px;border-radius:99px}
.ss-list{padding-left:1.2em}.ss-list li{margin:.4em 0}.ss-big{font-size:clamp(28px,6vw,82px);font-weight:800;line-height:1.05}.ss-term{font:800 clamp(24px,3vw,42px) system-ui;color:var(--ss-ac)}.ss-formula{font:700 clamp(26px,4vw,58px) ui-monospace,monospace;color:var(--ss-ac)}
.ss-steps{list-style:none;padding:0}.ss-steps li{display:flex;gap:14px}.ss-steps b{color:var(--ss-ac)}.ss-answer{font-weight:800;color:var(--ss-se)}.ss-compare,.ss-cmp-head{display:grid;grid-template-columns:1fr 1fr;gap:12px}.ss-compare div{display:grid;grid-template-columns:1fr 1fr;gap:12px;border-top:1px solid currentColor;padding:6px 0}
.ss-bar-row{display:grid;grid-template-columns:120px 1fr 80px;gap:10px;align-items:center}.ss-bar-track{height:14px;background:#ffffff22}.ss-bar{height:100%;background:var(--ss-ac)}.ss-quote{font:600 clamp(20px,3vw,40px) Georgia,serif}.ss-layer-stack{display:grid;gap:6px}.ss-layer{background:#ffffff12;color:inherit;border:1px solid currentColor;padding:8px 12px;text-align:left;border-radius:8px;font:inherit}
.ss-webcard{display:grid;grid-template-columns:1fr auto 1fr;gap:12px;width:100%}.ss-web-side{border:1px solid currentColor;border-radius:7px;padding:12px;min-width:0}.ss-web-local{border-left:3px solid var(--ss-se)}.ss-web-external{border-left:3px solid var(--ss-ac)}.ss-web-tag{display:block;font:800 11px ui-monospace,monospace;letter-spacing:.08em;color:var(--ss-se);margin-bottom:6px}.ss-web-tag-ext{color:var(--ss-ac)}.ss-web-side p{margin:0;overflow-wrap:anywhere}.ss-web-plus{display:grid;place-items:center;color:var(--ss-ac);font-weight:800}.ss-web-thumb{display:block;max-width:100%;max-height:180px;object-fit:cover;border-radius:4px;margin:8px 0}.ss-web-link{color:var(--ss-ac);font-size:12px;text-decoration:underline}
.ss-spotlight{display:grid;grid-template-columns:1.2fr 1fr;gap:14px;align-items:center;width:100%}.ss-spot-figure{margin:0;border:1px solid currentColor;border-radius:8px;overflow:hidden;min-height:220px}.ss-spot-figure img{width:100%;max-height:360px;object-fit:cover;display:block}.ss-img-fallback{font-size:11px;opacity:.8}.ss-caption{font-weight:700;margin:0 0 8px}.ss-support{font-size:.85em}.ss-credit{font-size:11px;opacity:.75;overflow-wrap:anywhere}.ss-credit a{color:var(--ss-ac)}
.ss-model{width:100%}.ss-model-view{position:relative;perspective:900px;height:300px;display:grid;place-items:center;overflow:hidden;border-radius:8px}.ss-model-rig{position:relative;width:min(78%,460px);height:70%;transform-style:preserve-3d;animation:ss-spin 14s linear infinite}.ss-model.paused .ss-model-rig{animation-play-state:paused}.ss-model.manual .ss-model-rig{animation:none;transform:rotateY(var(--manual-rot,0deg))}.ss-model-layer{position:absolute;left:50%;top:calc(50% + var(--y));width:100%;transform:translate(-50%,-50%) rotateY(var(--rot)) translateZ(90px);background:#ffffff1c;color:inherit;border:1px solid var(--ss-ac);border-radius:7px;padding:8px;font:inherit;font-weight:700;text-align:center;cursor:pointer}.ss-model-layer:focus-visible{outline:2px solid var(--ss-se)}.ss-model-floor{position:absolute;bottom:8%;width:70%;height:10%;transform:rotateX(72deg);border:1px dashed currentColor;border-radius:50%;opacity:.5}
.ss-anim-diagram{width:100%}.ss-ad-flow{display:flex;flex-wrap:wrap;align-items:center;gap:6px}.ss-ad-node{display:flex;align-items:center;gap:8px;flex:1 1 120px;border:1px solid currentColor;border-radius:6px;padding:8px;font-weight:700;animation:ss-node-in .45s both;animation-delay:calc(var(--i) * .18s)}.ss-ad-n{font:800 11px ui-monospace,monospace;color:var(--ss-ac)}.ss-ad-link{width:18px;color:var(--ss-ac);display:flex;align-items:center}.ss-ad-link i{flex:1;height:2px;background:currentColor;display:block}@keyframes ss-spin{from{transform:rotateY(0)}to{transform:rotateY(360deg)}}@keyframes ss-node-in{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:none}}
.ss-option,.ss-flip,.ss-mini,.ss-pair button{background:#ffffff12;color:inherit;border:1px solid currentColor;border-radius:8px;padding:8px 12px;font:inherit;margin:4px}.ss-option.correct{outline:3px solid var(--ss-se)}.ss-option.wrong{opacity:.55}.ss-flag{font-size:.8em}.ss-reveal{margin-top:10px;border-top:1px solid currentColor;padding-top:8px}
.ss-fusion{display:flex;gap:8px;align-items:center;margin-top:8px;padding:6px 8px;border-left:2px solid var(--ss-se);background:#ffffff0d;border-radius:4px;font-size:12px}.ss-fusion img{width:44px;height:44px;object-fit:cover;border-radius:3px}.ss-fusion-tag{display:block;font:800 9px ui-monospace,monospace;color:var(--ss-se)}.ss-fusion p{margin:2px 0}.ss-fusion a{color:var(--ss-ac)}
.ss-video,.ss-place{display:grid;grid-template-columns:1.1fr 1fr;gap:12px;align-items:center;width:100%}.ss-video-frame,.ss-map-frame{position:relative;width:100%;aspect-ratio:16/10;border:1px solid currentColor;border-radius:7px;overflow:hidden}.ss-video-frame iframe,.ss-map-frame iframe{position:absolute;inset:0;width:100%;height:100%;border:0}.ss-video-poster{position:absolute;inset:0;width:100%;height:100%;object-fit:cover}
@media(prefers-reduced-motion:reduce){.ss-model-rig,.ss-ad-node{animation:none!important}}
.controls{display:flex;gap:8px;flex-wrap:wrap;justify-content:center;margin:14px 0}.controls button{background:#1a2b24;color:#eaf3ed;border:1px solid #4e6a5c;border-radius:9px;padding:9px 14px;font-weight:700}.notes{background:#13201b;border:1px solid #355044;border-radius:12px;padding:18px;margin:16px auto;max-width:1180px}.ss-notes dl{display:grid;grid-template-columns:auto 1fr;gap:4px 12px;font-size:14px}.ss-notes dt{font-weight:800;color:#b9f257}
@media print{body{background:#fff;color:#000}.controls,.notes{display:none}.ss-slide{page-break-after:always;aspect-ratio:auto;min-height:96vh;border-radius:0}.ss-body [hidden]{display:block!important}}
</style></head><body><main>${slides}</main><div class="controls"><button id="prev">← Anterior</button><button id="next">Seguinte →</button><button id="notes">Notas</button><button id="full">Ecrã inteiro</button><button id="print">Imprimir / PDF</button></div><section class="notes" id="notesPanel" hidden>${notes}</section>
<script>
(function(){var i=0,S=[].slice.call(document.querySelectorAll('.ss-slide')),N=document.getElementById('notesPanel');function show(n){i=Math.max(0,Math.min(S.length-1,n));S.forEach(function(s,k){s.hidden=k!==i});var ns=N.querySelectorAll('.ss-notes');for(var k=0;k<ns.length;k++)ns[k].hidden=k!==i}document.getElementById('prev').onclick=function(){show(i-1)};document.getElementById('next').onclick=function(){show(i+1)};document.getElementById('notes').onclick=function(){N.hidden=!N.hidden};document.getElementById('full').onclick=function(){(document.documentElement.requestFullscreen||function(){}).call(document.documentElement)};document.getElementById('print').onclick=function(){print()};document.addEventListener('keydown',function(e){if(['ArrowRight','PageDown',' '].indexOf(e.key)>=0){e.preventDefault();show(i+1)}if(['ArrowLeft','PageUp'].indexOf(e.key)>=0){e.preventDefault();show(i-1)}if(e.key==='n'){N.hidden=!N.hidden}});document.addEventListener('click',function(e){var o=e.target.closest('.ss-option');if(o){var q=o.closest('.ss-quiz');if(!q)return;q.querySelectorAll('.ss-option').forEach(function(b){b.classList.remove('correct','wrong')});o.classList.add(o.dataset.correct==='1'?'correct':'wrong');var r=q.querySelector('.ss-reveal');if(r)r.hidden=false}var f=e.target.closest('.ss-flip');if(f){var b=f.querySelector('.ss-back'),fr=f.querySelector('.ss-front');if(b&&fr){b.hidden=!b.hidden;fr.hidden=!fr.hidden}}var m=e.target.closest('.ss-model-layer');if(m){var list=m.parentElement.querySelectorAll('.ss-model-layer');for(var k=0;k<list.length;k++)list[k].classList.toggle('active',list[k]===m)}var t=e.target.closest('[data-model-toggle]');if(t){var mo=t.closest('.ss-model');if(mo){mo.classList.toggle('paused');t.textContent=mo.classList.contains('paused')?'Retomar rotação':'Pausar rotação'}}var sp=e.target.closest('[data-model-left],[data-model-right]');if(sp){var mo2=sp.closest('.ss-model');if(mo2){var cur=parseFloat(mo2.style.getPropertyValue('--manual-rot'))||0;mo2.classList.add('manual');mo2.classList.remove('paused');mo2.style.setProperty('--manual-rot',(cur+(sp.hasAttribute('data-model-left')?-45:45))+'deg');var tg=mo2.querySelector('[data-model-toggle]');if(tg)tg.textContent='Pausar rotação'}}});show(0)})();
<\/script></body></html>`;
}

/* ------------------------------------------------------------------ */
/* 7._bar Deck de amostra — todos os tipos, para testar o player       */
/* ------------------------------------------------------------------ */

export function sampleDeck() {
  const src = { page: 1, anchor: 'Amostra didáctica do Slide Studio — conteúdo de demonstração retirado dos exemplos da especificação Kuzaya AI.' };
  let n = 0;
  const s = (type, title, fields = {}) => newSlide(type, {
    id: `demo-${++n}`,
    title,
    min: 2,
    source: { ...src },
    notes: note([
      `Dizer: ${title}. Esta é uma amostra didáctica; o conteúdo serve para demonstrar o tipo «${type}».`,
      'Tempo: 2 min. Fonte: especificação Kuzaya AI, secção 15.',
      'Não projectar como material de um curso real — substituir por conteúdo do ficheiro do docente.',
    ], type),
    flags: ['Deck de amostra — não é um plano de aula real.'],
    ...fields,
  });
  const slides = [
    s('title', 'Slide Studio: una aula que se ensina', { subtitle: 'Todos os tipos de slide numa amostra', course: 'Amostra Kuzaya AI' }),
    s('hook', 'Por que é que um slide com nove definições falha?', { prompt: 'Por que é que um slide com nove definições falha?' }),
    s('objectives', 'No fim, consegue reconhecer cada tipo', { items: ['Explicar a diferença entre conceito e definição', 'Aplicar um exemplo trabalhado', 'Comparar dois formatos de actividade', 'Escolher uma interacção com objectivo'] }),
    s('concept', 'Uma ideia por slide', { statement: 'Uma ideia por slide', support: 'Se precisa de “e também”, divida.' }),
    s('bullets', 'Pontos curtos e paralelos', { bullets: ['Verbo no início', 'No máximo doze palavras', 'Sem sub-marcadores', 'Revelar um de cada vez'] }),
    s('quiz', 'Pacotes fora de ordem: o que faz o receptor?', { question: 'Pacotes chegam fora de ordem. O que faz o receptor?', options: [{ text: 'Pedir para recomeçar', correct: false }, { text: 'Reordenar pelos números de sequência', correct: true }, { text: 'Ignorar a ordem', correct: false }], answer: 1, explanation: 'Os números de sequência permitem reconstruir o ficheiro.' }),
    s('definition', 'Definição: termo, frase, exemplo', { term: 'Algoritmo', definition: 'Sequência finita e ordenada de passos para resolver um problema.', example: 'Pesquisa binária.' }),
    s('process', 'Três passos, três verbos', { steps: ['Desenhar o diagrama de forças', 'Identificar peso, normal e atrito', 'Somar as componentes'] }),
    s('match', 'Associe termo a definição', { pairs: [{ left: 'Algoritmo', right: 'Passos para resolver um problema' }, { left: 'Pacote', right: 'Parte de uma mensagem' }, { left: 'Latência', right: 'Atraso na comunicação' }, { left: 'Protocolo', right: 'Regra acordada' }] }),
    s('worked-example', '440 Hz dão cerca de 0,78 m', { problem: 'Um som de 440 Hz no ar a 20 °C.', steps: ['v = f × λ', 'λ = 343 / 440', 'λ ≈ 0,7795 m'], answer: '0,78 m', units: 'm' }),
    s('formula', 'Velocidade, frequência e comprimento', { equation: 'v = f × λ', legend: [{ symbol: 'v', meaning: 'velocidade', unit: 'm/s' }, { symbol: 'f', meaning: 'frequência', unit: 'Hz' }, { symbol: 'λ', meaning: 'comprimento de onda', unit: 'm' }], applies: 'Onda sonora no ar' }),
    s('think-first', 'Pense antes de revelar', { prompt: 'Um ficheiro de 1024 posições. Quantas comparações no máximo?', seconds: 60, reveal: '10 comparações (log₂ 1024).' }),
    s('diagram', 'Um bloco liga-se ao seguinte', { parts: ['Entrada', 'Processamento', 'Saída'], visual: 'fluxograma', alt: 'Três blocos ligados por setas.' }),
    s('data-chart', 'A latência cresce com a distância', { message: 'A latência cresce com a distância', data: [{ label: 'Próximo', value: 12, unit: 'ms' }, { label: 'Médio', value: 38, unit: 'ms' }, { label: 'Longínquo', value: 92, unit: 'ms' }], sourceLine: 'Fonte: valores ilustrativos da especificação' }),
    s('flip-cards', 'Vire e verifique', { cards: [{ front: 'v = f × λ', back: 'Velocidade = frequência × comprimento de onda' }, { front: 'TCP', back: 'Transporte confiável' }, { front: 'Quiz', back: 'Verifica compreensão' }, { front: 'Notas', back: '60 a 120 palavras por slide' }] }),
    s('compare', 'UDP é rápido, TCP é cuidadoso', { leftLabel: 'TCP', rightLabel: 'UDP', rows: [{ left: 'Ordena pacotes', right: 'Não ordena' }, { left: 'Confirma recepção', right: 'Não confirma' }, { left: 'Mais lento', right: 'Mais rápido' }], difference: 'TCP confia; UDP apressa-se.' }),
    s('timeline', 'Quatro momentos, datas da fonte', { events: ['1991 · Primeira versão', '1995 · Actualização', '2004 · Revisão', '2019 · Versão actual'] }),
    s('poll', 'O que já viu?', { question: 'O que já viu antes?', options: ['Pesquisa binária', 'Protocolos de rede', 'Ambos', 'Nenhum'] }),
    s('case-study', 'O caso mostra a decisão', { situation: 'Pacotes chegam fora de ordem.', decision: 'Usar números de sequência.', result: 'O ficheiro é reconstruído.', lesson: 'A ordem é recuperável.' }),
    s('quote', 'Citações curtas, com fonte', { text: 'A fonte é a verdade.', attribution: 'Especificação Kuzaya AI' }),
    s('scene-3d', 'Quatro camadas, quatro funções', { goal: 'Nomear as camadas e dizer o que fazem', parts: ['Aplicação', 'Transporte', 'Rede', 'Ligação', 'Física'], task: 'Toque em cada camada. Qual decide a rota?', fallback: 'Da aplicação à física: cada camada tem uma função própria.', visual: 'modelo em camadas', alt: 'Cinco camadas empilhadas.' }),
    s('sort', 'Classifique cada caso', { categories: ['Confiável', 'Rápido'], items: ['Transferência de ficheiro', 'Chamada de vídeo', 'Carga de página', 'Jogo em tempo real', 'Pagamento confirmado'] }),
    s('break', 'Pausa: escreva uma pergunta', { prompt: 'Pausa: escreva uma pergunta' }),

    /* v1.1 — os quatro tipos novos. Os dois externos estão marcados EXTERNO
       e com ligação de verificação, exactamente como no enriquecimento real. */
    s('animated-model', 'Gire o modelo para explorar', {
      goal: 'Nomear cada camada e dizer o que faz',
      parts: ['Aplicação', 'Transporte', 'Rede', 'Ligação', 'Física'],
      task: 'Pause a rotação e toque numa camada. Qual decide o caminho?',
      fallback: 'Cinco camadas empilhadas, da aplicação à física; cada uma tem uma função própria.',
      visual: 'modelo 3D em camadas',
      alt: 'Modelo rotativo com cinco camadas empilhadas.',
      autoRotate: true,
      flags: ['Modelo simplificado a partir da estrutura de demonstração — proporções não representam escala real.'],
    }),
    s('animated-diagram', 'O esquema revela-se passo a passo', {
      parts: ['Recolher', 'Organizar', 'Explicar', 'Verificar'],
      visual: 'fluxograma animado',
      alt: 'Quatro blocos ligados por setas, revelados por ordem.',
      caption: 'As setas mostram a ordem; use as setas do teclado para revelar cada passo.',
    }),
    s('web-insight', 'O que a Wikipédia acrescenta', {
      insight: 'A energia solar refere-se à energia proveniente da luz e do calor do Sol, aproveitada por tecnologias como o aquecimento solar, a fotovoltaica e a arquitetura solar.',
      localAnchor: 'A amostra mostra como ligar uma ideia do ficheiro a uma fonte verificável.',
      sourceTitle: 'Energia solar · Wikipédia',
      sourceUrl: 'https://pt.wikipedia.org/wiki/Energia_solar',
      imageUrl: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/6/62/SolarPowerPlantSerpa.jpg/960px-SolarPowerPlantSerpa.jpg',
      imageAlt: 'Central solar fotovoltaica de Serpa, Portugal.',
      flags: ['Deck de amostra — não é um plano de aula real.', 'EXTERNO · Wikipédia — verificar licença e exactidão antes de leccionar.'],
    }),
    s('image-spotlight', 'Uma imagem da web, com origem', {
      imageUrl: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/6/62/SolarPowerPlantSerpa.jpg/960px-SolarPowerPlantSerpa.jpg',
      imageAlt: 'Painéis fotovoltaicos alinhados em filas num campo aberto.',
      caption: 'Primeiro pergunte o que a imagem mostra; só depois leia a legenda.',
      credit: 'Wikimedia Commons via Wikipédia',
      sourceUrl: 'https://pt.wikipedia.org/wiki/Energia_solar_fotovoltaica',
      localAnchor: 'A amostra liga a imagem ao princípio de verificar a fonte.',
      flags: ['Deck de amostra — não é um plano de aula real.', 'EXTERNO · Wikipédia — conferir licença na página de origem.'],
    }),

    /* v1.2 — vídeo e mapa fundidos por omissão, com origem e aviso EXTERNO. */
    s('video-spotlight', 'Ver: vídeo de demonstração', {
      embedUrl: 'https://www.youtube.com/embed/aircAruvnKk',
      sourceUrl: 'https://www.youtube.com/watch?v=aircAruvnKk',
      caption: 'Vídeo de demonstração — substitua por um link do material do docente.',
      credit: 'YouTube · vídeo citado no material',
      flags: ['Deck de amostra — não é um plano de aula real.', 'EXTERNO · YouTube — confirmar disponibilidade antes de leccionar.'],
    }),
    s('place-spotlight', 'No mapa: Luanda', {
      placeName: 'Luanda',
      mapUrl: 'https://www.google.com/maps?q=Luanda%2C%20Angola&output=embed',
      sourceUrl: 'https://pt.wikipedia.org/wiki/Luanda',
      lat: -8.839,
      lon: 13.289,
      caption: 'Capital de Angola; localize a cidade antes de ligar o exemplo ao ficheiro.',
      visual: 'mapa incorporado do Google',
      alt: 'Mapa da cidade de Luanda em Angola.',
      flags: ['Deck de amostra — não é um plano de aula real.', 'EXTERNO · Google Maps/Wikipédia — confirmar grafia e disponibilidade.'],
    }),

    s('summary', 'Quatro ideias para levar', { takeaways: ['A fonte manda', 'Uma ideia por slide', 'Interacção com objectivo', 'Notas sempre'] }),
    s('next-steps', 'Para a próxima aula', { items: ['Trazer um ficheiro real', 'Escolher a paleta da turma'], suggested: true }),
  ];
  const deck = {
    spec: SLIDE_SPEC_VERSION, app: 'Kuzaya AI · Slide Studio', title: 'Amostra · Todos os tipos de slide',
    sourceName: 'Especificação Kuzaya AI', language: 'pt', palette: 'ama', brief: defaultBrief(),
    analysis: { title: 'Amostra', centralIdea: 'Uma aula clara e verificável', keyTerms: ['slide', 'interacção'], warnings: [], readable: true },
    objectives: { items: ['Reconhecer tipos de slide'], inferred: true, note: 'Amostra didáctica.' },
    blueprint: slides.map((s, i) => ({ n: i + 1, title: s.title, type: s.type, min: s.min, purpose: 'Demonstrar o tipo de slide' })),
    assumptions: ['Deck de amostra criado à mão para testar o player e a validação.'],
    stats: { slides: slides.length, durationMin: slides.reduce((a, s) => a + s.min, 0), pages: 1, words: slides.reduce((a, s) => a + words(s.title), 0) },
    flags: ['Amostra didáctica — não usar como plano de aula real.'], slides, savedAt: new Date().toISOString(),
  };
  const check = validateDeck(deck);
  return { ...check.deck, validation: { errors: check.errors, warnings: qualityCheck(check.deck) } };
}
