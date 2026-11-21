// Deterministic teacher tools: worksheet, lesson plan, rubric and compact
// result codes. No network, no model, no hidden state.

const MAX_QUESTIONS = 20;

const clean = (value, max = 160) => String(value ?? '').replace(/\s+/g, ' ').trim().slice(0, max);
const shorten = (value, max = 140) => {
  const text = clean(value, max + 1);
  return text.length > max ? `${text.slice(0, max - 1).trimEnd()}…` : text;
};
const int = (value, min, max, fallback) => {
  const number = Number(value);
  if (!Number.isFinite(number)) return fallback;
  return Math.min(max, Math.max(min, Math.round(number)));
};
const isPt = (lang) => lang !== 'en';

function distributePoints(total, count) {
  if (!count) return [];
  const base = Math.floor(total / count);
  const remainder = total % count;
  return Array.from({ length: count }, (_, index) => base + (index < remainder ? 1 : 0));
}

function numberQuestions(sections) {
  let number = 0;
  const points = distributePoints(20, sections.reduce((sum, section) => sum + section.questions.length, 0));
  return sections.map((section) => ({
    ...section,
    questions: section.questions.map((question) => {
      const entry = { ...question, number: number + 1, points: points[number] };
      number += 1;
      return entry;
    }),
  }));
}

export function worksheetFromAnalysis(analysis, { title = '', subject = '', count = 8, lang = 'pt' } = {}) {
  if (!analysis || analysis.insufficient) return null;
  const limit = int(count, 4, MAX_QUESTIONS, 8);
  const pt = isPt(lang);
  const cards = Array.isArray(analysis.cards) ? analysis.cards : [];
  const quiz = Array.isArray(analysis.quiz) ? analysis.quiz : [];
  const definitions = Array.isArray(analysis.definitions) ? analysis.definitions : [];

  const shortPool = [];
  const seenTerms = new Set();
  for (const card of cards) {
    if (card.kind !== 'definition' || !card.answer || !card.back) continue;
    const term = clean(card.answer, 80);
    if (!term || seenTerms.has(term.toLowerCase())) continue;
    seenTerms.add(term.toLowerCase());
    shortPool.push({
      prompt: pt ? `Define «${term}» em duas ou três frases.` : `Define “${term}” in two or three sentences.`,
      answer: card.back,
      source: card.sentence || '',
    });
  }
  for (const definition of definitions) {
    const term = clean(definition.term, 80);
    if (!term || seenTerms.has(term.toLowerCase())) continue;
    seenTerms.add(term.toLowerCase());
    shortPool.push({
      prompt: pt ? `Explica o conceito de «${term}».` : `Explain the concept of “${term}”.`,
      answer: definition.sentence || '',
      source: definition.sentence || '',
    });
  }

  const openCount = limit >= 6 && analysis.centralIdea ? 1 : 0;
  const shortCount = Math.min(shortPool.length, Math.max(2, Math.round((limit - openCount) * 0.4)));
  const choiceCount = Math.min(quiz.length, Math.max(0, limit - openCount - shortCount));
  const extraShort = shortPool.slice(shortCount, shortCount + Math.max(0, limit - openCount - shortCount - choiceCount));

  const sections = [];
  const shortQuestions = [...shortPool.slice(0, shortCount), ...extraShort];
  if (shortQuestions.length) {
    sections.push({
      id: 'short',
      title: pt ? 'Parte A · Resposta curta' : 'Part A · Short answer',
      instructions: pt ? 'Responde com frases completas.' : 'Answer in full sentences.',
      questions: shortQuestions,
    });
  }
  if (choiceCount > 0) {
    sections.push({
      id: 'choice',
      title: pt ? 'Parte B · Escolha múltipla' : 'Part B · Multiple choice',
      instructions: pt ? 'Assinala a opção correta.' : 'Tick the correct option.',
      questions: quiz.slice(0, choiceCount).map((question) => ({
        prompt: question.prompt,
        options: Array.isArray(question.options) ? question.options.slice(0, 6) : [],
        answerIndex: Number.isInteger(question.correct) ? question.correct : 0,
        answer: Array.isArray(question.options) ? question.options[question.correct] || question.answer || '' : question.answer || '',
        explanation: question.explanation || '',
        source: '',
      })),
    });
  }
  if (openCount && analysis.centralIdea) {
    sections.push({
      id: 'open',
      title: pt ? 'Parte C · Desenvolvimento' : 'Part C · Longer answer',
      instructions: pt ? 'Organiza a resposta em introdução, desenvolvimento e conclusão.' : 'Structure the answer with an introduction, development and conclusion.',
      questions: [{
        prompt: pt
          ? 'Explica a ideia central deste tema e apresenta um exemplo que a torne concreta.'
          : 'Explain the central idea of this topic and give an example that makes it concrete.',
        answer: analysis.centralIdea,
        source: analysis.centralIdea,
      }],
    });
  }

  const numbered = numberQuestions(sections.filter((section) => section.questions.length));
  const total = numbered.reduce((sum, section) => sum + section.questions.length, 0);
  if (!total) return null;

  return {
    kind: 'worksheet',
    title: clean(title, 90) || clean(analysis.title, 90) || (pt ? 'Ficha de trabalho' : 'Worksheet'),
    subject: clean(subject, 24) || clean(analysis.subject, 24) || 'general',
    instructions: pt
      ? 'Lê todas as perguntas antes de começar. Justifica as respostas quando for pedido. Sem calculadora, salvo indicação do professor.'
      : 'Read every question before starting. Justify your answers when asked. No calculator unless the teacher says otherwise.',
    sections: numbered,
    total,
    points: 20,
    answerKey: numbered.flatMap((section) => section.questions.map((question) => ({
      number: question.number,
      prompt: question.prompt,
      answer: question.answer,
      explanation: question.explanation || '',
      source: question.source || '',
    }))),
    createdAt: new Date().toISOString(),
  };
}

export function lessonPlanFromAnalysis(analysis, { topic = '', duration = 90, lang = 'pt', className = '', date = '' } = {}) {
  if (!analysis || analysis.insufficient) return null;
  const pt = isPt(lang);
  const minutes = int(duration, 30, 180, 90);
  const ideas = (analysis.keyIdeas || []).filter(Boolean);
  const definitions = (analysis.definitions || []).filter((item) => item?.term && item?.sentence);
  const cards = (analysis.cards || []).filter((card) => card?.front);
  const quiz = (analysis.quiz || []).filter((question) => question?.prompt);
  const weights = [0.1, 0.25, 0.25, 0.25, 0.15];
  const slots = weights.map((weight) => Math.max(2, Math.floor(minutes * weight)));
  slots[1] += minutes - slots.reduce((sum, value) => sum + value, 0);

  const hook = analysis.guidingQuestions?.[0] || analysis.centralIdea || ideas[0] || '';
  const concept = ideas.slice(0, 2).join(' ');
  const example = definitions[0]?.sentence || ideas.find((idea) => /\d/.test(idea)) || ideas[1] || ideas[0] || '';
  const practice = cards.slice(0, 2).map((card) => card.front).join(' · ') || quiz[0]?.prompt || '';
  const exit = quiz[0]?.prompt || cards[0]?.front || analysis.centralIdea || '';

  return {
    kind: 'plan',
    title: clean(topic, 90) || clean(analysis.title, 90) || (pt ? 'Plano de aula' : 'Lesson plan'),
    subject: clean(analysis.subject, 24) || 'general',
    className: clean(className, 90),
    date: /^\d{4}-\d{2}-\d{2}$/.test(String(date)) ? String(date) : '',
    duration: minutes,
    objectives: (ideas.length ? ideas : [analysis.centralIdea]).filter(Boolean).slice(0, 3).map((idea) => shorten(idea, 150)),
    vocabulary: definitions.slice(0, 5).map((item) => clean(item.term, 60)),
    materials: pt
      ? ['Quadro e marcadores', 'Resumo impresso ou projetado', 'Caderno e calculadora', 'Ficha de exercícios']
      : ['Board and markers', 'Printed or projected summary', 'Notebook and calculator', 'Exercise sheet'],
    timeline: [
      {
        id: 'hook',
        title: pt ? 'Abertura · pergunta guia' : 'Opening · guiding question',
        minutes: slots[0],
        detail: hook,
        teacherNote: pt ? 'Não dês já a resposta. Recolhe duas ou três hipóteses da turma.' : 'Do not give the answer yet. Collect two or three guesses from the class.',
      },
      {
        id: 'concept',
        title: pt ? 'Conceito · ideias essenciais' : 'Concept · essential ideas',
        minutes: slots[1],
        detail: concept,
        teacherNote: pt ? 'Escreve no quadro as palavras-chave e liga-as com setas.' : 'Write the key words on the board and link them with arrows.',
      },
      {
        id: 'example',
        title: pt ? 'Exemplo resolvido' : 'Worked example',
        minutes: slots[2],
        detail: example,
        teacherNote: pt ? 'Resolve devagar, verbalizando cada passo. Pede à turma para prever o passo seguinte.' : 'Solve slowly, saying each step out loud. Ask the class to predict the next step.',
      },
      {
        id: 'practice',
        title: pt ? 'Prática guiada' : 'Guided practice',
        minutes: slots[3],
        detail: practice,
        teacherNote: pt ? 'Trabalho a pares. Circula e corrige o primeiro erro, não o resultado final.' : 'Pair work. Walk around and correct the first mistake, not the final answer.',
      },
      {
        id: 'exit',
        title: pt ? 'Fecho · bilhete de saída' : 'Closing · exit ticket',
        minutes: slots[4],
        detail: exit,
        teacherNote: pt ? 'Cada estudante entrega uma resposta escrita em duas frases.' : 'Each student hands in a two-sentence written answer.',
      },
    ],
    assessment: quiz.slice(0, 3).map((question) => ({
      prompt: question.prompt,
      answer: question.answer || (Array.isArray(question.options) ? question.options[question.correct] : ''),
    })),
    homework: cards.slice(0, 2).map((card) => card.front),
    differentiation: {
      support: definitions[0]?.sentence || analysis.centralIdea || '',
      challenge: ideas[ideas.length - 1] || analysis.centralIdea || '',
    },
    sourceNote: pt
      ? 'Plano gerado a partir do texto do resumo. Revê exemplos e números antes de usar em aula.'
      : 'Plan generated from the summary text. Check examples and numbers before using it in class.',
    createdAt: new Date().toISOString(),
  };
}

const RUBRICS = {
  lab: {
    pt: {
      title: 'Relatório de laboratório',
      criteria: [
        ['objectives', 'Objetivo e hipótese', 20, [
          'Objetivo claro, hipótese testável e ligação explícita ao tema.',
          'Objetivo claro e hipótese plausível, mas pouco ligada ao tema.',
          'Objetivo presente; hipótese vaga ou ausente.',
          'Objetivo confuso e sem hipótese.',
        ]],
        ['method', 'Procedimento e rigor', 25, [
          'Procedimento completo, seguro e reprodutível; materiais e variáveis descritos.',
          'Procedimento completo, com pequenas omissões que não impedem a repetição.',
          'Procedimento descrito de forma geral; faltam passos ou controlo de variáveis.',
          'Procedimento incompleto ou inseguro.',
        ]],
        ['results', 'Dados e tratamento', 25, [
          'Dados organizados em tabela/gráfico, unidades corretas e cálculo de erro.',
          'Dados organizados e unidades corretas; erro não discutido.',
          'Dados presentes, mas desorganizados ou com unidades em falta.',
          'Dados incompletos ou sem tratamento.',
        ]],
        ['analysis', 'Análise e conclusão', 20, [
          'Relaciona resultados com a hipótese, explica desvios e propõe melhoria.',
          'Relaciona resultados com a hipótese e reconhece um desvio.',
          'Conclusão descreve resultados sem os interpretar.',
          'Conclusão ausente ou contraditória.',
        ]],
        ['presentation', 'Apresentação', 10, [
          'Texto claro, bem estruturado, referências e figuras legendadas.',
          'Texto claro com pequenos problemas de estrutura ou legendas.',
          'Texto legível, mas desorganizado ou sem legendas.',
          'Texto difícil de seguir.',
        ]],
      ],
    },
    en: {
      title: 'Laboratory report',
      criteria: [
        ['objectives', 'Aim and hypothesis', 20, [
          'Clear aim, testable hypothesis and explicit link to the topic.',
          'Clear aim and plausible hypothesis, weakly linked to the topic.',
          'Aim present; hypothesis vague or missing.',
          'Confused aim and no hypothesis.',
        ]],
        ['method', 'Procedure and rigour', 25, [
          'Complete, safe and reproducible procedure; materials and variables described.',
          'Complete procedure with minor omissions that do not prevent repetition.',
          'General procedure; missing steps or variable control.',
          'Incomplete or unsafe procedure.',
        ]],
        ['results', 'Data and treatment', 25, [
          'Data organised in tables/graphs, correct units and error calculation.',
          'Data organised with correct units; error not discussed.',
          'Data present but disorganised or missing units.',
          'Incomplete data or no treatment.',
        ]],
        ['analysis', 'Analysis and conclusion', 20, [
          'Links results to the hypothesis, explains deviations and proposes an improvement.',
          'Links results to the hypothesis and recognises one deviation.',
          'Conclusion describes results without interpreting them.',
          'Conclusion missing or contradictory.',
        ]],
        ['presentation', 'Presentation', 10, [
          'Clear, well-structured text, references and captioned figures.',
          'Clear text with minor structure or caption issues.',
          'Readable text but disorganised or without captions.',
          'Text is hard to follow.',
        ]],
      ],
    },
  },
  project: {
    pt: {
      title: 'Projeto de mecatrónica',
      criteria: [
        ['problem', 'Problema e requisitos', 15, [
          'Necessidade real, requisitos mensuráveis e restrições identificadas.',
          'Necessidade clara e requisitos maioritariamente mensuráveis.',
          'Necessidade genérica; requisitos vagos.',
          'Problema mal definido.',
        ]],
        ['design', 'Conceção', 25, [
          'Solução justificada, alternativas comparadas e desenho técnico claro.',
          'Solução adequada com justificação e desenho legível.',
          'Solução possível, mas sem alternativas nem justificação.',
          'Solução incoerente com o problema.',
        ]],
        ['build', 'Construção', 25, [
          'Montagem limpa, segura e documentada; componentes adequados.',
          'Montagem funcional com pequenas falhas de acabamento.',
          'Montagem funciona, mas é frágil ou pouco documentada.',
          'Montagem incompleta ou insegura.',
        ]],
        ['test', 'Teste e validação', 20, [
          'Testes planeados, resultados medidos e comparação com requisitos.',
          'Testes realizados e resultados registados.',
          'Teste único e sem comparação com requisitos.',
          'Sem testes ou resultados.',
        ]],
        ['documentation', 'Documentação', 15, [
          'Relatório completo, código/comandos explicados e ligações referenciadas.',
          'Relatório completo com pequenas lacunas.',
          'Documentação mínima.',
          'Documentação ausente.',
        ]],
      ],
    },
    en: {
      title: 'Mechatronics project',
      criteria: [
        ['problem', 'Problem and requirements', 15, [
          'Real need, measurable requirements and identified constraints.',
          'Clear need and mostly measurable requirements.',
          'Generic need; vague requirements.',
          'Poorly defined problem.',
        ]],
        ['design', 'Design', 25, [
          'Justified solution, compared alternatives and clear technical drawing.',
          'Adequate solution with justification and readable drawing.',
          'Possible solution without alternatives or justification.',
          'Solution inconsistent with the problem.',
        ]],
        ['build', 'Build', 25, [
          'Clean, safe and documented assembly; suitable components.',
          'Working assembly with minor finish issues.',
          'Assembly works but is fragile or poorly documented.',
          'Incomplete or unsafe assembly.',
        ]],
        ['test', 'Test and validation', 20, [
          'Planned tests, measured results and comparison with requirements.',
          'Tests performed and results recorded.',
          'Single test without comparison to requirements.',
          'No tests or results.',
        ]],
        ['documentation', 'Documentation', 15, [
          'Complete report, explained code/commands and referenced links.',
          'Complete report with minor gaps.',
          'Minimal documentation.',
          'Missing documentation.',
        ]],
      ],
    },
  },
  presentation: {
    pt: {
      title: 'Apresentação oral',
      criteria: [
        ['content', 'Conteúdo', 30, [
          'Ideias rigorosas, fontes citadas e exemplos próprios.',
          'Ideias corretas e exemplos adequados.',
          'Ideias gerais com imprecisões.',
          'Conteúdo incorreto ou irrelevante.',
        ]],
        ['structure', 'Estrutura', 20, [
          'Introdução, desenvolvimento e conclusão claros, dentro do tempo.',
          'Estrutura clara com pequenos desvios de tempo.',
          'Estrutura reconhecível, mas desequilibrada.',
          'Sem estrutura percetível.',
        ]],
        ['delivery', 'Comunicação', 20, [
          'Voz clara, ritmo adequado e contacto visual com a sala.',
          'Voz clara e ritmo adequado na maior parte.',
          'Voz baixa ou leitura do ecrã.',
          'Difícil de ouvir ou seguir.',
        ]],
        ['visuals', 'Suportes visuais', 15, [
          'Slides legíveis, poucas palavras e figuras que explicam.',
          'Slides legíveis com algum texto a mais.',
          'Slides sobrecarregados ou pouco legíveis.',
          'Sem suportes ou suportes inúteis.',
        ]],
        ['questions', 'Perguntas', 15, [
          'Responde com rigor e reconhece limites.',
          'Responde corretamente à maioria.',
          'Responde parcialmente.',
          'Não consegue responder.',
        ]],
      ],
    },
    en: {
      title: 'Oral presentation',
      criteria: [
        ['content', 'Content', 30, [
          'Rigorous ideas, cited sources and own examples.',
          'Correct ideas and suitable examples.',
          'General ideas with inaccuracies.',
          'Incorrect or irrelevant content.',
        ]],
        ['structure', 'Structure', 20, [
          'Clear introduction, development and conclusion, within time.',
          'Clear structure with minor timing issues.',
          'Recognisable but unbalanced structure.',
          'No perceptible structure.',
        ]],
        ['delivery', 'Delivery', 20, [
          'Clear voice, good pace and eye contact with the room.',
          'Clear voice and good pace most of the time.',
          'Low voice or reading from the screen.',
          'Hard to hear or follow.',
        ]],
        ['visuals', 'Visual aids', 15, [
          'Readable slides, few words and figures that explain.',
          'Readable slides with some extra text.',
          'Overloaded or hard-to-read slides.',
          'No aids or unhelpful aids.',
        ]],
        ['questions', 'Questions', 15, [
          'Answers rigorously and acknowledges limits.',
          'Answers most questions correctly.',
          'Answers partially.',
          'Cannot answer.',
        ]],
      ],
    },
  },
};

export function buildRubric(kind = 'lab', { lang = 'pt', title = '' } = {}) {
  const template = RUBRICS[kind] || RUBRICS.lab;
  const copy = template[isPt(lang) ? 'pt' : 'en'];
  const labels = isPt(lang)
    ? ['Excelente', 'Bom', 'Suficiente', 'A melhorar']
    : ['Excellent', 'Good', 'Satisfactory', 'Needs work'];
  return {
    kind: RUBRICS[kind] ? kind : 'lab',
    title: clean(title, 90) || copy.title,
    subject: 'general',
    scale: labels.map((label, index) => ({ value: 4 - index, label })),
    criteria: copy.criteria.map(([id, criterion, weight, levels]) => ({
      id,
      criterion,
      weight,
      levels: levels.map((descriptor, index) => ({ value: 4 - index, descriptor })),
    })),
    total: copy.criteria.reduce((sum, item) => sum + item[2], 0),
    createdAt: new Date().toISOString(),
  };
}

const CODE_PREFIX = 'ING1';
const RESULT_KINDS = ['practice', 'review', 'lesson', 'other'];

function checksum(value) {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619) >>> 0;
  }
  return hash.toString(36).padStart(7, '0').slice(-7);
}

function toBase64Url(value) {
  const bytes = new TextEncoder().encode(value);
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

function fromBase64Url(value) {
  const normalized = String(value).replace(/-/g, '+').replace(/_/g, '/');
  const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, '=');
  const binary = atob(padded);
  const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}

function randomId() {
  if (globalThis.crypto?.getRandomValues) {
    const buffer = new Uint32Array(1);
    globalThis.crypto.getRandomValues(buffer);
    return buffer[0].toString(36).padStart(7, '0').slice(0, 7);
  }
  return Math.random().toString(36).slice(2, 9).padEnd(7, '0');
}

export function normalizeResult(payload) {
  const name = clean(payload?.name, 60);
  if (!name) return null;
  const total = int(payload?.total, 1, 1000, 10);
  const score = int(payload?.score, 0, total, 0);
  const classCode = String(payload?.classCode || '').toUpperCase().replace(/[^A-Z0-9-]/g, '').slice(0, 24);
  const date = /^\d{4}-\d{2}-\d{2}$/.test(String(payload?.date || '')) ? String(payload.date) : new Date().toISOString().slice(0, 10);
  const kind = RESULT_KINDS.includes(payload?.kind) ? payload.kind : 'practice';
  const id = clean(payload?.id, 12).replace(/[^a-z0-9]/gi, '') || randomId();
  return { name, activity: clean(payload?.activity, 90) || 'Prática', score, total, classCode, date, kind, id };
}

export function encodeResultCode(payload) {
  const result = normalizeResult(payload);
  if (!result) return '';
  const compact = {
    v: 1,
    c: result.classCode,
    n: result.name,
    a: result.activity,
    s: result.score,
    t: result.total,
    d: result.date,
    k: result.kind,
    i: result.id,
  };
  const body = toBase64Url(JSON.stringify(compact));
  return `${CODE_PREFIX}.${body}.${checksum(body)}`;
}

export function decodeResultCode(code) {
  const text = String(code || '').trim().replace(/^["'`]+|["'`]+$/g, '');
  const match = /^ING1\.([A-Za-z0-9_-]{10,800})\.([a-z0-9]{4,10})$/i.exec(text);
  if (!match) return null;
  const [, body, check] = match;
  if (checksum(body) !== check.toLowerCase()) return null;
  let data;
  try {
    data = JSON.parse(fromBase64Url(body));
  } catch {
    return null;
  }
  if (!data || data.v !== 1) return null;
  return normalizeResult({
    name: data.n,
    activity: data.a,
    score: data.s,
    total: data.t,
    date: data.d,
    classCode: data.c,
    kind: data.k,
    id: data.i,
  });
}

export function parseResultCodes(text) {
  const tokens = String(text || '')
    .split(/[\s,;]+/)
    .map((token) => token.trim().replace(/^["'`]+|["'`]+$/g, ''))
    .filter(Boolean);
  const rows = [];
  const invalid = [];
  const seen = new Set();
  let duplicates = 0;
  for (const token of tokens) {
    const result = decodeResultCode(token);
    if (!result) {
      invalid.push(token.slice(0, 48));
      continue;
    }
    if (seen.has(result.id)) {
      duplicates += 1;
      continue;
    }
    seen.add(result.id);
    rows.push({
      ...result,
      code: token,
      percent: Math.round((result.score / Math.max(1, result.total)) * 100),
    });
  }
  return { rows, invalid, duplicates };
}

export function resultsCsv(rows, { lang = 'pt' } = {}) {
  const header = isPt(lang)
    ? ['Turma', 'Nome', 'Atividade', 'Pontos', 'Total', 'Percentagem', 'Data', 'Código']
    : ['Class', 'Name', 'Activity', 'Score', 'Total', 'Percent', 'Date', 'Code'];
  const escape = (value) => `"${String(value ?? '').replace(/"/g, '""')}"`;
  const lines = [header.map(escape).join(',')];
  for (const row of Array.isArray(rows) ? rows : []) {
    lines.push([
      row.classCode,
      row.name,
      row.activity,
      row.score,
      row.total,
      `${row.percent ?? Math.round((row.score / Math.max(1, row.total)) * 100)}%`,
      row.date,
      row.code || '',
    ].map(escape).join(','));
  }
  return lines.join('\r\n');
}

export function resultsSummary(rows) {
  const list = Array.isArray(rows) ? rows : [];
  if (!list.length) return { count: 0, average: 0, best: null, lowest: null, activities: [] };
  let totalPercent = 0;
  let best = list[0];
  let lowest = list[0];
  const activities = new Map();
  for (const row of list) {
    const percent = row.percent ?? Math.round((row.score / Math.max(1, row.total)) * 100);
    totalPercent += percent;
    if (percent > (best.percent ?? -1)) best = { ...row, percent };
    if (percent < (lowest.percent ?? 101)) lowest = { ...row, percent };
    const key = row.activity || '';
    const entry = activities.get(key) || { activity: key, count: 0, total: 0 };
    entry.count += 1;
    entry.total += percent;
    activities.set(key, entry);
  }
  return {
    count: list.length,
    average: Math.round(totalPercent / list.length),
    best,
    lowest,
    activities: [...activities.values()].map((item) => ({ ...item, average: Math.round(item.total / item.count) })),
  };
}

export function slugify(value, fallback = 'ama') {
  const slug = String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60);
  return slug || fallback;
}

const escapeHtml = (value = '') => String(value).replace(/[&<>"']/g, (char) => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
}[char]));

// Wraps already-rendered, escaped sheet markup in a standalone printable file.
export function sheetDocumentHtml({ title = 'AMA', body = '', lang = 'pt' } = {}) {
  return `<!doctype html>
<html lang="${isPt(lang) ? 'pt' : 'en'}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${escapeHtml(title)}</title>
<style>
  :root { color-scheme: light; }
  * { box-sizing: border-box; }
  body { margin: 0; padding: 28px 22px; font-family: "Plus Jakarta Sans", system-ui, sans-serif; color: #1f1730; background: #fff; line-height: 1.5; }
  h1 { font-size: 22px; margin: 0 0 4px; }
  h2 { font-size: 15px; margin: 22px 0 8px; border-bottom: 1px solid #ddd; padding-bottom: 4px; }
  h3 { font-size: 13px; margin: 14px 0 4px; }
  .teacher-sheet { max-width: 820px; margin: 0 auto; }
  .teacher-sheet-head { display: flex; flex-wrap: wrap; align-items: flex-start; gap: 14px; border-bottom: 2px solid #2f1d46; padding-bottom: 12px; }
  .teacher-sheet-brand { display: flex; flex-direction: column; gap: 2px; font-size: 10px; letter-spacing: .14em; color: #5b4a70; }
  .teacher-sheet-brand span { font-weight: 800; }
  .teacher-sheet-title { flex: 1 1 320px; }
  .teacher-sheet-title h1 { font-size: 21px; margin: 0; }
  .teacher-sheet-meta { display: flex; flex-wrap: wrap; gap: 4px 14px; font-size: 11px; color: #5a5068; margin-top: 4px; }
  .teacher-sheet-id { display: flex; flex-wrap: wrap; gap: 6px 10px; align-items: center; font-size: 10px; color: #6b5f7c; width: 100%; }
  .teacher-sheet-id i { display: inline-block; width: 90px; border-bottom: 1px solid #b9afc9; height: 12px; }
  .teacher-sheet-instructions { font-size: 12px; background: #f6f2fb; border-left: 3px solid #b7a3d6; padding: 8px 10px; margin: 14px 0 4px; }
  .teacher-sheet-section h2 { margin-top: 20px; }
  .teacher-sheet-section-note { font-size: 11px; color: #6a5d7d; margin: 0 0 8px; }
  .teacher-sheet-questions { padding-left: 0; list-style: none; margin: 0; }
  .teacher-sheet-questions li { margin: 0 0 14px; break-inside: avoid; }
  .teacher-question-line { display: flex; gap: 8px; align-items: baseline; }
  .teacher-question-line p { margin: 0; flex: 1; font-size: 13px; }
  .teacher-question-line small { font-size: 10px; color: #7a6c8c; white-space: nowrap; }
  .teacher-question-number { font-weight: 800; color: #4b2d70; min-width: 18px; }
  .teacher-sheet-options { display: grid; grid-template-columns: 1fr 1fr; gap: 2px 16px; margin: 5px 0 0 26px; font-size: 12px; }
  .teacher-sheet-options b { color: #4b2d70; }
  .teacher-answer-lines { margin: 8px 0 0 26px; height: 26px; background: repeating-linear-gradient(to bottom, transparent 0 24px, #d9d3e3 24px 25px); }
  .teacher-sheet-foot { display: flex; justify-content: space-between; gap: 12px; margin-top: 24px; padding-top: 8px; border-top: 1px solid #ddd; font-size: 10px; color: #6b5f7c; }
  .teacher-sheet-key { margin-top: 28px; padding-top: 12px; border-top: 2px solid #333; break-before: page; page-break-before: always; }
  .teacher-key-list { padding-left: 18px; margin: 0; }
  .teacher-key-list li { margin: 0 0 7px; font-size: 12px; }
  .teacher-key-list strong { color: #4b2d70; }
  .teacher-sheet-key-note { font-size: 10px; color: #6b5f7c; margin-top: 10px; }
  .teacher-plan-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px 22px; margin-top: 14px; }
  .teacher-plan-grid section:first-child { grid-column: 1 / -1; }
  .teacher-plan-grid ul { margin: 0; padding-left: 18px; font-size: 12px; }
  .teacher-plan-grid li { margin: 0 0 4px; }
  .teacher-tags { display: flex; flex-wrap: wrap; gap: 5px; }
  .teacher-tags span { display: inline-block; border: 1px solid #d3c9e2; border-radius: 999px; padding: 2px 8px; font-size: 11px; background: #faf8fd; }
  .teacher-plan-timeline { margin-top: 18px; }
  .teacher-plan-timeline ol { list-style: none; padding: 0; margin: 0; }
  .teacher-plan-timeline li { display: flex; gap: 12px; margin: 0 0 10px; break-inside: avoid; }
  .teacher-plan-time { flex: 0 0 54px; text-align: center; border: 1px solid #d3c9e2; border-radius: 8px; padding: 4px; font-weight: 800; font-size: 13px; color: #4b2d70; background: #f6f2fb; }
  .teacher-plan-time small { display: block; font-size: 9px; font-weight: 500; color: #6b5f7c; }
  .teacher-plan-step strong { font-size: 12px; }
  .teacher-plan-step p { margin: 2px 0; font-size: 12px; }
  .teacher-plan-step em { font-size: 11px; color: #6b5f7c; }
  .teacher-plan-assessment { margin: 0; padding-left: 18px; font-size: 12px; }
  .teacher-plan-assessment li { margin: 0 0 8px; }
  .teacher-plan-assessment small { display: block; color: #4b2d70; }
  .teacher-plan-diff { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; margin-top: 18px; }
  .teacher-plan-diff section { border: 1px solid #d9d3e3; border-radius: 8px; padding: 8px 10px; background: #faf9fc; }
  .teacher-plan-diff h3 { margin: 0 0 4px; }
  .teacher-plan-diff p { margin: 0; font-size: 11px; }
  .teacher-rubric-table { width: 100%; border-collapse: collapse; font-size: 10.5px; margin-top: 12px; }
  .teacher-rubric-table th, .teacher-rubric-table td { border: 1px solid #cfc7dd; padding: 5px 6px; text-align: left; vertical-align: top; }
  .teacher-rubric-table thead th { background: #f1ecf8; }
  .teacher-rubric-table thead th b { display: block; font-size: 12px; }
  .teacher-rubric-table thead th span { font-weight: 500; color: #6b5f7c; }
  .teacher-rubric-table td b { display: block; color: #4b2d70; }
  .teacher-rubric-table .is-weight { text-align: center; white-space: nowrap; }
  .teacher-rubric-table tfoot td { background: #f1ecf8; font-weight: 700; text-align: right; }
  .teacher-results-sheet { max-width: none; margin-top: 14px; }
  .teacher-results-head { display: flex; justify-content: space-between; align-items: baseline; gap: 12px; border-bottom: 2px solid #2f1d46; padding-bottom: 6px; }
  .teacher-results-head h2 { border: 0; margin: 0; }
  .teacher-results-head span { font-size: 11px; color: #5a5068; }
  .teacher-results-sheet table { width: 100%; border-collapse: collapse; font-size: 11px; margin-top: 8px; }
  .teacher-results-sheet th, .teacher-results-sheet td { border: 1px solid #cfc7dd; padding: 5px 6px; text-align: left; }
  .teacher-results-sheet th { background: #f1ecf8; }
  .teacher-results-note { font-size: 10px; color: #6b5f7c; margin-top: 10px; }
  .sheet-meta { display: flex; flex-wrap: wrap; gap: 6px 18px; font-size: 11px; color: #555; margin: 10px 0 18px; }
  .sheet-line { display: flex; gap: 8px; font-size: 12px; margin: 3px 0; }
  .sheet-line b { min-width: 92px; color: #444; font-weight: 700; }
  ol { padding-left: 20px; }
  li { margin: 0 0 10px; }
  .sheet-options { display: grid; grid-template-columns: 1fr 1fr; gap: 2px 14px; margin: 5px 0 0; font-size: 12px; }
  .sheet-answer { font-size: 12px; margin: 4px 0; }
  .sheet-answer b { color: #4b2d70; }
  .sheet-key { margin-top: 28px; padding-top: 12px; border-top: 2px solid #333; }
  table { width: 100%; border-collapse: collapse; font-size: 11px; margin-top: 8px; }
  th, td { border: 1px solid #ccc; padding: 5px 6px; text-align: left; vertical-align: top; }
  th { background: #f1edf7; }
  .sheet-foot { margin-top: 24px; font-size: 10px; color: #666; }
  @media print { body { padding: 0; } .teacher-sheet-key { page-break-before: always; } .teacher-rubric-table { font-size: 9.5px; } }
</style>
</head>
<body>
${body}
</body>
</html>`;
}
