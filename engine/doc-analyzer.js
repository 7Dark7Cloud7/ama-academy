// CEU Academy · Intelligent Document-Type Analyzer & Message Synthesizer (v1)
// Inspects ANY uploaded PDF/DOCX/TXT/paste and detects what kind of document it is:
//   - 'ata'         : Ata de Reunião / Assembleia (decisions, owners, deadlines, attendees, agenda)
//   - 'relatorio'   : Relatório / Proposta / Estudo (KPIs, findings, risks vs opportunities, recommendations)
//   - 'regulamento' : Regulamento / Contrato / Lei / Norma (plain-language rules, rights vs duties, penalties)
//   - 'cientifico'  : Artigo Científico / Monografia / TCC (problem, methodology, results, conclusions)
//   - 'plano'       : Plano de Projecto / Manual / SOP (goals, phases, deliverables, operational checklist)
//   - 'aula'        : Sebenta / Aula Académica (concepts, formulas, visual intuition, checkpoint)
//
// Core principle: NEVER copy-paste bureaucratic/dense text blindly onto slides.
// Extract what truly matters, explain the central message clearly, and build
// domain-appropriate slides, speaker notes, and visual structures.

const clean = (s, max = 260) => String(s ?? '').replace(/\s+/g, ' ').trim().slice(0, max);

export const DOC_TYPES = {
  ata: {
    id: 'ata',
    icon: 'ATA',
    label: 'Ata de Reunião',
    shortLabel: 'Ata',
    audience: 'Equipa / Direcção / Assembleia',
    tone: 'Executivo, directo e orientado a decisões, responsáveis e prazos',
  },
  relatorio: {
    id: 'relatorio',
    icon: 'REL',
    label: 'Relatório / Proposta',
    shortLabel: 'Relatório',
    audience: 'Gestores / Parceiros / Decisores',
    tone: 'Analítico, orientado a indicadores, diagnóstico e recomendações',
  },
  regulamento: {
    id: 'regulamento',
    icon: 'LEI',
    label: 'Regulamento / Norma',
    shortLabel: 'Norma',
    audience: 'Colaboradores / Estudantes / Cidadãos',
    tone: 'Tradução em português claro — o que pode, o que deve e quais os prazos',
  },
  cientifico: {
    id: 'cientifico',
    icon: 'ART',
    label: 'Artigo / Monografia',
    shortLabel: 'Científico',
    audience: 'Banca / Comunidade Académica',
    tone: 'Rigoroso mas acessível — problema, método, evidência e contributo',
  },
  plano: {
    id: 'plano',
    icon: 'PLN',
    label: 'Plano / Procedimento',
    shortLabel: 'Plano',
    audience: 'Equipa Operacional / Projecto',
    tone: 'Acionável, passo a passo, com fases, entregáveis e cuidados',
  },
  aula: {
    id: 'aula',
    icon: 'AUL',
    label: 'Aula / Sebenta',
    shortLabel: 'Aula',
    audience: 'Estudantes Universitários / Secundário',
    tone: 'Didáctico visual Ingenium — intuição primeiro, ideia formal e prática',
  },
};

const TYPE_PATTERNS = {
  ata: [
    /\bata\s*(?:n\.?[º°]?|\s+da|\s+de)\b/i,
    /\bordem\s+de\s+trabalhos?\b/i,
    /\b(?:estiveram\s+presentes|participantes|presen[çc]as|aus[êe]ncias|qu[óo]rum)\b/i,
    /\b(?:deliberou[- ]se|decidiu[- ]se|aprovou[- ]se|acordou[- ]se|ficou\s+decidido|por\s+unanimidade)\b/i,
    /\b(?:ficou\s+encarregu?e|respons[áa]vel\s+por|prazo\s+at[ée]|pr[óo]xima\s+reuni[ãa]o)\b/i,
    /\b(?:presidiu|secretariou|lavrou[- ]se|nada\s+mais\s+havendo\s+a\s+tratar|aos\s+\d+\s+dias\s+do\s+m[êe]s)\b/i,
    /\bmeeting\s+minutes\b|\baction\s+items?\b|\battendees\b/i,
  ],
  relatorio: [
    /\brelat[óo]rio\b|\bsum[áa]rio\s+executivo\b|\bdiagn[óo]stico\b/i,
    /\b(?:kpi|indicador(?:es)?|desempenho|trimestre|semestre|or[çc]amento|fatura[çc][ãa]o|receita)\b/i,
    /\b(?:recomenda[çc][õo]es|proposta\s+comercial|plano\s+de\s+neg[óo]cio|retorno|margem|crescimento)\b/i,
    /\b\d+(?:[.,]\d+)?\s*%|\b\d+(?:\.\d{3})+\s*(?:kz|aoa|usd|\$|€)\b/i,
  ],
  regulamento: [
    /\b(?:artigo|art\.?)\s*\d+[º°.]?/i,
    /\b(?:cl[áa]usula|decreto|lei\s+n\.?[º°]?|regulamento|estatuto|norma\s+interna)\b/i,
    /\b(?:direitos?\s+e\s+deveres?|obriga[çc][õo]es|penalidade|san[çc][ãa]o|proibido|vig[êe]ncia)\b/i,
    /\b(?:fica\s+estabelecido|nos\s+termos\s+do|cumprimento\s+obrigat[óo]rio)\b/i,
  ],
  cientifico: [
    /\b(?:resumo|abstract)\b.*\b(?:metodologia|methodology)\b/is,
    /\b(?:hip[óo]tese|amostra|revis[ãa]o\s+de\s+literatura|objectivo\s+geral|monografia|disserta[çc][ãa]o)\b/i,
    /\b(?:resultados?\s+e\s+discuss[ãa]o|refer[êe]ncias\s+bibliogr[áa]ficas|p\s*<\s*0\.\d+)\b/i,
  ],
  plano: [
    /\b(?:cronograma|entreg[áa]ve(?:l|is)|procedimento|manual\s+operacional|plano\s+de\s+ac[çc][ãa]o)\b/i,
    /\b(?:fase\s+\d|etapa\s+\d|milestone|marco\s+\d|checklist|pr[ée]-requisitos)\b/i,
  ],
};

function splitSentences(text) {
  return String(text || '')
    .replace(/\r\n?/g, '\n')
    .split(/(?<=[.!?])\s+|\n+/)
    .map((s) => s.replace(/^#+\s*/, '').replace(/\s+/g, ' ').trim())
    .filter((s) => s.length >= 14);
}

function trimClean(s, max = 142) {
  const t = clean(String(s || '').replace(/^[-•*\d.)\s]+/, ''), 400);
  if (t.length <= max) return t;
  return `${t.slice(0, max - 1).replace(/\s+\S*$/, '').replace(/[,;:]$/, '')}…`;
}

/* Strip bureaucratic Portuguese openings so slides read like crisp modern takeaways */
function deBureaucratize(sentence) {
  let s = clean(sentence, 260)
    .replace(/^aos\s+\d+\s+dias\s+do\s+m[êe]s\s+de\s+[a-zçáàâãéêíóôõú]+(?:\s+de\s+\d{4})?,?\s*/i, '')
    .replace(/^(?:deliberou[- ]se|decidiu[- ]se|acordou[- ]se|aprovou[- ]se|resolveu[- ]se|ficou\s+decidido|ficou\s+definido|ficou\s+acordado)\s*(?:por\s+unanimidade\s*)?(?:que\s*)?/i, '')
    .replace(/^(?:importa\s+referir\s+que|cabe\s+salientar\s+que|conv[ée]m\s+notar\s+que|nos\s+termos\s+da\s+presente\s+ata,?\s*)/i, '')
    .replace(/^(?:ponto\s+\d+[:.\-–\s]+|al[íi]nea\s+[a-z][):.\s]+)/i, '')
    .trim();
  if (!s) return '';
  return s.charAt(0).toUpperCase() + s.slice(1);
}

/**
 * Automatically classifies the document type ('ata', 'relatorio', 'regulamento', 'cientifico', 'plano', 'aula').
 */
export function detectDocumentType(text = '', title = '', sourceName = '') {
  const hay = `${title} ${sourceName} ${text}`;
  const scores = { ata: 0, relatorio: 0, regulamento: 0, cientifico: 0, plano: 0 };

  for (const [type, patterns] of Object.entries(TYPE_PATTERNS)) {
    for (const re of patterns) {
      const m = hay.match(new RegExp(re.source, re.flags.includes('g') ? re.flags : `${re.flags}g`));
      if (m) scores[type] += Math.min(4, m.length) * 2;
    }
  }
  // Filename/title strong signal
  if (/\bata\b|\bminutes\b|\breuni[ãa]o\b/i.test(`${title} ${sourceName}`)) scores.ata += 5;
  if (/\brelat[óo]rio\b|\bproposta\b|\breport\b/i.test(`${title} ${sourceName}`)) scores.relatorio += 4;
  if (/\bregulamento\b|\bcontrato\b|\blei\b|\bdecreto\b|\bnorma\b/i.test(`${title} ${sourceName}`)) scores.regulamento += 5;
  if (/\bmonografia\b|\btese\b|\bartigo\b|\btcc\b/i.test(`${title} ${sourceName}`)) scores.cientifico += 4;
  if (/\bmanual\b|\bprocedimento\b|\bplano\s+de\s+projecto\b/i.test(`${title} ${sourceName}`)) scores.plano += 4;

  const sorted = Object.entries(scores).sort((a, b) => b[1] - a[1]);
  const [bestType, bestScore] = sorted[0];
  if (bestScore >= 4) {
    return {
      docType: bestType,
      confidence: Math.min(0.98, Number((0.55 + bestScore * 0.05).toFixed(2))),
      meta: DOC_TYPES[bestType],
      scores,
    };
  }
  return { docType: 'aula', confidence: 0.75, meta: DOC_TYPES.aula, scores };
}

/* ------------------------------------------------------------------ */
/* Deep Structured Extractors per Document Type                       */
/* ------------------------------------------------------------------ */

function extractAtaIntelligence(text, title) {
  const sents = splitSentences(text);
  const dateMatch = text.match(/\b(\d{1,2}\s+de\s+(?:janeiro|fevereiro|mar[çc]o|abril|maio|junho|julho|agosto|setembro|outubro|novembro|dezembro)(?:\s+de\s+\d{4})?|\d{1,2}[\/.-]\d{1,2}[\/.-]\d{2,4})\b/i);
  const locMatch = text.match(/(?:local|sala|sede|realizada\s+(?:em|na|no))[:\s]+([^.;\n]{4,68})/i);
  const presMatch = text.match(/(?:presid[êe]ncia|presidida\s+por|presidiu|coordena[çc][ãa]o)[:\s]+([^.;\n]{3,60})/i);

  // Participants
  const partLines = sents.filter((s) => /\b(presentes|participantes|membros|presen[çc]as|compareceram|attendees)\b/i.test(s));
  const participantsRaw = partLines.map((l) => l.replace(/^[^:]{0,36}:\s*/i, '')).join(', ');
  const participants = participantsRaw
    ? participantsRaw.split(/[,;]+|\be\b/i).map((p) => clean(p.replace(/^(?:estiveram\s+presentes|os\s+membros|dr\.?|eng\.?|prof\.?)\s*/i, ''), 38)).filter((p) => p.length >= 3 && p.split(/\s+/).length <= 5).slice(0, 8)
    : [];

  // Agenda items
  const agenda = sents
    .filter((s) => /^(?:\d+[.)]\s*|ponto\s+\d+)/i.test(s) || /\b(ordem\s+de\s+trabalhos|pauta|assuntos?\s+tratados?)\b/i.test(s))
    .map((s) => trimClean(deBureaucratize(s.replace(/^ordem\s+de\s+trabalhos?[:\s]*/i, '')), 115))
    .filter((s) => s.length >= 10)
    .slice(0, 5);

  // Decisions / Deliberações
  const decisions = sents
    .filter((s) => /\b(deliberou|decidiu|aprovou|aprovad[oa]|acordou|resolveu|definid[oa]|unanimidade|autorizou|validou|approved|decided|agreed)\b/i.test(s))
    .map((s) => {
      const core = trimClean(deBureaucratize(s), 135);
      return { raw: s, summary: core };
    })
    .filter((d) => d.summary.length >= 14)
    .slice(0, 6);

  // Action Items (Owner + Task + Deadline)
  const actionSents = sents.filter((s) =>
    /\b(encarregu?e|respons[áa]vel|at[ée]\s+(?:dia\s+)?\d|prazo|entregar|enviar|preparar|coordenar|implementar|executar|acompanhar|owner|deadline|due\s+by)\b/i.test(s)
  );
  const actionItems = actionSents.slice(0, 6).map((s) => {
    const ownerM = s.match(/(?:respons[áa]vel|encarregu?e|a\s+cargo\s+d[eoa]|por)\s*[:\s]*([A-ZÁÀÂÃÉÈÊÍÌÓÒÔÕÚÙÇ][a-zà-ÿ]+(?:\s+(?:da|de|do|dos|das)?\s*[A-ZÁÀÂÃÉÈÊÍÌÓÒÔÕÚÙÇ][a-zà-ÿ]+){0,2})/);
    const deadlineM = s.match(/(?:at[ée]\s+(?:dia\s+)?|prazo[:\s]+|em\s+)(\d{1,2}\s+de\s+[a-zçáàâãéêíóôõú]+(?:\s+de\s+\d{4})?|\d{1,2}[\/.-]\d{1,2}(?:[\/.-]\d{2,4})?|\d+\s+dias|pr[óo]xima\s+semana)/i);
    return {
      owner: ownerM ? clean(ownerM[1], 34) : 'Equipa / Responsável',
      deadline: deadlineM ? clean(deadlineM[1], 32) : 'A confirmar',
      task: trimClean(deBureaucratize(s), 125),
    };
  });

  // Open issues / Next meeting
  const openIssues = sents
    .filter((s) => /\b(pendente|em\s+aberto|pr[óo]xima\s+reuni[ãa]o|risco|bloqueio|aguarda|falta|reagendad|follow[- ]up|next\s+meeting)\b/i.test(s))
    .map((s) => trimClean(deBureaucratize(s), 135))
    .slice(0, 4);

  const decCount = decisions.length;
  const actCount = actionItems.length;
  const coreMessage = decCount || actCount
    ? `Esta ata regista ${decCount || 'as'} decisão(ões) principal(is) e ${actCount || 'os'} encaminhamento(s) prático(s)${dateMatch ? ` da reunião de ${dateMatch[1]}` : ''}. O foco da apresentação é alinhar o que foi aprovado e garantir que cada responsável cumpre o seu prazo.`
    : `Síntese executiva de «${clean(title, 60)}»: organiza os assuntos tratados, alinhamentos da equipa e próximos passos sem leitura burocrática.`;

  return {
    date: dateMatch ? clean(dateMatch[1], 40) : '',
    location: locMatch ? clean(locMatch[1], 56) : '',
    chair: presMatch ? clean(presMatch[1], 48) : '',
    participants,
    agenda,
    decisions,
    actionItems,
    openIssues,
    coreMessage,
    whyItMatters: 'Em vez de ler a ata parágrafo a parágrafo, a apresentação transforma o documento num painel claro de Decisões → Responsáveis → Prazos.',
  };
}

function extractReportIntelligence(text, title) {
  const sents = splitSentences(text);
  const kpis = sents
    .filter((s) => /\b\d+(?:[.,]\d+)?\s*%|\b\d+(?:[.,]\d+)?\s*(?:milh[õo]es|mil|kz|aoa|usd|€|\$|x\b)/i.test(s))
    .map((s) => trimClean(s, 138))
    .slice(0, 5);
  const risks = sents
    .filter((s) => /\b(risco|desafio|problema|queda|atraso|gargalo|limita[çc][ãa]o|dificuldade|custo|d[ée]fice)\b/i.test(s))
    .map((s) => trimClean(deBureaucratize(s), 135))
    .slice(0, 4);
  const recommendations = sents
    .filter((s) => /\b(recomenda|prop[õo]e|sugere|deve[- ]se|prioridade|pr[óo]ximo\s+passo|estrat[ée]gia|ac[çc][ãa]o|investir|melhorar)\b/i.test(s))
    .map((s) => trimClean(deBureaucratize(s), 135))
    .slice(0, 4);

  const coreMessage = kpis[0]
    ? `Mensagem central: ${kpis[0]} — o relatório transforma dados em decisões práticas e prioridades claras.`
    : `Síntese analítica de «${clean(title, 60)}»: destaca o diagnóstico principal, os números críticos e as acções recomendadas.`;

  return {
    kpis,
    risks,
    recommendations,
    findings: sents.slice(0, 5).map((s) => trimClean(deBureaucratize(s), 135)),
    coreMessage,
    whyItMatters: 'Decisores precisam de ver primeiro a conclusão e os números críticos, depois o diagnóstico e o plano de acção.',
  };
}

function extractRegulationIntelligence(text, title) {
  const sents = splitSentences(text);
  const rights = sents
    .filter((s) => /\b(direito|pode|tem\s+acesso|benef[íi]cio|garantid[oa]|permitid[oa]|isento|facultado)\b/i.test(s))
    .map((s) => trimClean(deBureaucratize(s), 135))
    .slice(0, 4);
  const duties = sents
    .filter((s) => /\b(dever|obrigat[óo]rio|deve|proibid[oa]|vedad[oa]|incumprimento|multa|penalidade|san[çc][ãa]o|prazo)\b/i.test(s))
    .map((s) => trimClean(deBureaucratize(s), 135))
    .slice(0, 4);
  const articles = sents
    .filter((s) => /\b(?:artigo|art\.?|cl[áa]usula)\s*\d+/i.test(s))
    .map((s) => trimClean(s, 135))
    .slice(0, 4);

  return {
    rights,
    duties,
    articles,
    coreMessage: `Tradução em português claro de «${clean(title, 60)}»: explica directamente o que é permitido, o que é obrigatório e o que evitar para cumprir sem dúvidas.`,
    whyItMatters: 'Textos jurídicos e regulamentos são difíceis de ler em sala — separar Direitos, Deveres e Prazos torna a norma clara para todos.',
  };
}

function extractScientificIntelligence(text, title) {
  const sents = splitSentences(text);
  const pick = (re, fallbackSlice) => {
    const found = sents.filter((s) => re.test(s)).map((s) => trimClean(s, 138)).slice(0, 4);
    return found.length ? found : fallbackSlice.map((s) => trimClean(s, 138));
  };
  return {
    problem: pick(/\b(problema|objectivo|hip[óo]tese|quest[ãa]o|investigar|analisar|purpose|hypothesis)\b/i, sents.slice(0, 2)),
    methodology: pick(/\b(metodologia|m[ée]todo|amostra|inquerito|dados|experi[êe]ncia|question[áa]rio|method|sample)\b/i, sents.slice(2, 5)),
    results: pick(/\b(resultado|verificou|observou|evid[êe]ncia|\d+\s*%|aumentou|reduziu|found|results)\b/i, sents.slice(4, 7)),
    conclusions: pick(/\b(conclu|contribui|limita[çc]|futur|implica[çc]|conclusion)\b/i, sents.slice(-3)),
    coreMessage: `Apresentação estruturada para defesa/seminário de «${clean(title, 60)}»: liga o problema de investigação ao método, evidência e conclusão.`,
    whyItMatters: 'Uma boa apresentação académica responde rapidamente a 4 perguntas: Qual é o problema? Como estudou? O que descobriu? E o que muda na prática?',
  };
}

function extractPlanIntelligence(text, title) {
  const sents = splitSentences(text);
  const steps = sents
    .filter((s) => /^(?:\d+[.)]|fase|etapa|passo)/i.test(s) || /\b(primeiro|depois|seguida|finalmente|entreg[áa]vel|meta)\b/i.test(s))
    .map((s) => trimClean(deBureaucratize(s), 135))
    .slice(0, 5);
  return {
    steps: steps.length >= 2 ? steps : sents.slice(0, 4).map((s) => trimClean(s, 135)),
    deliverables: sents.filter((s) => /\b(entreg[áa]vel|resultado|meta|indicador|objectivo|prazo)\b/i.test(s)).map((s) => trimClean(s, 135)).slice(0, 4),
    coreMessage: `Roteiro operacional de «${clean(title, 60)}»: transforma o documento numa sequência visual de fases, entregáveis e critérios de execução.`,
    whyItMatters: 'Equipas executam melhor quando cada fase, entrega e risco aparece num fluxo claro passo a passo.',
  };
}

/**
 * Full intelligent document analysis: classifies the file, extracts structured domain data,
 * explains the core message, and builds a ready-to-present adaptive slide deck for non-'aula' types!
 */
export function analyzeDocument(text = '', opts = {}) {
  const { title = '', sourceName = '', forcedType = 'auto', author = 'Núcleo CEU', theme = 'editorial', language = 'pt' } = opts;
  const detected = detectDocumentType(text, title, sourceName);
  const docType = (forcedType && forcedType !== 'auto' && DOC_TYPES[forcedType]) ? forcedType : detected.docType;
  const meta = DOC_TYPES[docType] || DOC_TYPES.aula;
  const deckTitle = clean(title || sourceName.replace(/\.[^.]+$/, '').replace(/[_-]+/g, ' ') || meta.label, 65);

  let extracted = {};
  if (docType === 'ata') extracted = extractAtaIntelligence(text, deckTitle);
  else if (docType === 'relatorio') extracted = extractReportIntelligence(text, deckTitle);
  else if (docType === 'regulamento') extracted = extractRegulationIntelligence(text, deckTitle);
  else if (docType === 'cientifico') extracted = extractScientificIntelligence(text, deckTitle);
  else if (docType === 'plano') extracted = extractPlanIntelligence(text, deckTitle);
  else {
    const sents = splitSentences(text);
    extracted = {
      coreMessage: trimClean(sents[0] || deckTitle, 165),
      whyItMatters: 'Explicação visual orientada à compreensão profunda: intuição primeiro, conceito formal depois e verificação prática.',
    };
  }

  return {
    docType,
    confidence: forcedType && forcedType !== 'auto' ? 1 : detected.confidence,
    meta,
    title: deckTitle,
    sourceName: clean(sourceName || deckTitle, 90),
    extracted,
    author,
    theme,
    language,
  };
}

/**
 * Transforms an analyzed non-academic document (Ata, Relatório, Regulamento, Científico, Plano)
 * into a cohesive, human-explained presentation deck with tailored layouts & speaker notes!
 * Returns null for 'aula' so the academic Ingenium 3.0 STEM/University engine handles it.
 */
export function buildAdaptiveDocumentDeck(text = '', opts = {}) {
  const analysis = analyzeDocument(text, opts);
  if (analysis.docType === 'aula') return null;

  const { docType, meta, title, sourceName, extracted, author, theme } = analysis;
  const sents = splitSentences(text);
  const wordCount = (String(text || '').match(/[\p{L}\p{N}]+/gu) || []).length;
  const slides = [];

  const push = (layout, rhythm, slideTitle, fields = {}) => {
    const hand = clean(fields.handNote || 'Mensagem-chave', 40);
    const note = clean(fields.notes || `Apresente «${slideTitle}» em tom ${meta.tone.toLowerCase()}.`, 440);
    slides.push({
      id: `doc-${slides.length + 1}`,
      index: slides.length + 1,
      layout,
      rhythm,
      kicker: `${meta.icon} ${rhythm} · ${meta.shortLabel.toUpperCase()}`,
      title: clean(slideTitle, 65),
      handnote: hand,
      handNote: hand,
      notes: note,
      teacherNote: note,
      durationMin: layout === 'cover' ? 2 : 3,
      page: fields.page || 1,
      clusterKey: slideTitle,
      sources: [{ label: `${meta.shortLabel} · ${clean(sourceName, 26)}`, kind: 'pdf' }],
      ...fields,
    });
  };

  if (docType === 'ata') {
    const subParts = [extracted.date, extracted.location, extracted.chair ? `Pres.: ${extracted.chair}` : ''].filter(Boolean);
    push('cover', 'RESUMO DA ATA', title, {
      subtitle: subParts.length ? `${subParts.join(' · ')} — ${extracted.coreMessage}` : extracted.coreMessage,
      bullets: [],
      meta: { subject: 'ata', estMinutes: 12, pages: 1, author },
      handNote: 'Decisões & Prazos',
      notes: `Abra a apresentação resumindo em 30 segundos o contexto desta reunião${extracted.date ? ` (${extracted.date})` : ''}. Explique que o objectivo é confirmar decisões aprovadas e prazos sem reler a ata toda.`,
    });

    push('concept', 'MENSAGEM CENTRAL', 'O que esta reunião decidiu na prática', {
      subtitle: extracted.coreMessage,
      intuition: extracted.whyItMatters,
      bullets: [
        extracted.participants.length ? `Participantes: ${extracted.participants.slice(0, 6).join(', ')}` : 'Equipa alinhada nos pontos centrais da ordem de trabalhos',
        extracted.agenda.length ? `Ordem de trabalhos: ${extracted.agenda.slice(0, 3).join(' · ')}` : 'Foco nos temas prioritários registados na ata',
      ],
      handNote: 'Síntese em 1 minuto',
      notes: `Explique a mensagem global da reunião antes dos detalhes. ${extracted.participants.length ? `Confirme presenças (${extracted.participants.join(', ')}).` : ''} Assim todos entendem o contexto imediatamente.`,
    });

    const decList = extracted.decisions.length
      ? extracted.decisions.map((d) => `Decisão: ${d.summary}`)
      : sents.slice(0, 4).map((s) => `Deliberação: ${trimClean(deBureaucratize(s), 125)}`);
    push('bullets', 'DECISÕES APROVADAS', 'Deliberações que entram em vigor', {
      intuition: 'Estes são os compromissos formalmente aprovados — não estão mais em discussão, passam à execução.',
      bullets: decList.slice(0, 4),
      handNote: 'Aprovado em ata',
      notes: 'Percorra cada deliberação aprovada em voz alta e valide se todos têm a mesma leitura do que ficou decidido. Evite reabrir debates já votados.',
    });

    const actions = extracted.actionItems.length
      ? extracted.actionItems.map((a) => `${a.owner} (${a.deadline}) → ${a.task}`)
      : decList.slice(0, 3).map((d) => `Equipa responsável → Executar: ${d.replace(/^[^:]+:\s*/, '')}`);
    push('animated-flow', 'PLANO DE AÇÃO', 'Quem faz o quê e até quando', {
      steps: actions.slice(0, 4),
      bullets: actions.slice(0, 4),
      intuition: 'Uma ata só gera resultado quando cada decisão tem um dono claro e uma data de entrega.',
      handNote: 'Dono + Prazo →',
      notes: 'Confirme olhando para cada responsável se o prazo é realista. Se algum prazo já mudou, use o botão «Editar» para actualizar ao vivo.',
    });

    if (extracted.openIssues.length) {
      push('comparison', 'ALERTAS & PENDÊNCIAS', 'Decidido vs Em Aberto', {
        left: extracted.decisions[0]?.summary || 'Deliberações aprovadas e em curso',
        right: extracted.openIssues[0],
        bullets: extracted.openIssues.slice(0, 3).map((o) => `Atenção: ${o}`),
        intuition: 'Separar o que já está fechado do que ainda precisa de resposta evita bloqueios até à próxima reunião.',
        handNote: 'Não deixar cair!',
        notes: 'Destaque os pontos pendentes ou riscos para a próxima reunião e pergunte o que falta desbloquear hoje.',
      });
    }

    push('closing', 'FECHO & PRÓXIMOS PASSOS', 'Alinhamento final da equipa', {
      bullets: [
        `${extracted.decisions.length || decList.length} deliberação(ões) pronta(s) para execução imediata`,
        `${extracted.actionItems.length || actions.length} acção(ões) com acompanhamento definido`,
        extracted.openIssues[0] ? `Pendência prioritária: ${extracted.openIssues[0]}` : 'Confirmar data de revisão e partilhar esta síntese com ausentes',
      ],
      checkQuestions: [
        'Todos os responsáveis confirmam os seus prazos e recursos necessários?',
        'Existe algum bloqueio que precise ser resolvido antes da próxima reunião?',
      ],
      handNote: 'Partilhar síntese',
      notes: 'Encerre pedindo confirmação verbal dos prazos aos responsáveis e exporte em PDF ou HTML para enviar no WhatsApp/e-mail da equipa.',
    });
  } else if (docType === 'relatorio') {
    push('cover', 'SUMÁRIO EXECUTIVO', title, {
      subtitle: extracted.coreMessage,
      bullets: [],
      meta: { subject: 'relatorio', estMinutes: 15, pages: 1, author },
      handNote: 'Conclusão primeiro',
      notes: 'Comece pela conclusão principal do relatório (método pirâmide) para captar logo a atenção dos decisores.',
    });
    if (extracted.kpis.length) {
      push('quote', 'INDICADORES-CHAVE', 'O número que resume o cenário', {
        quote: extracted.kpis[0],
        source: sourceName,
        bullets: extracted.kpis.slice(1, 4),
        intuition: extracted.whyItMatters,
        handNote: 'Dado decisivo',
        notes: 'Deixe o número respirar 5 segundos no ecrã e explique o que ele significa para o orçamento ou estratégia.',
      });
    }
    push('bullets', 'DIAGNÓSTICO', 'Principais conclusões extraídas', {
      bullets: extracted.findings.slice(0, 4),
      intuition: 'Em vez de tabelas densas, focamos nos sinais que realmente explicam o desempenho.',
      handNote: 'Factos chave',
      notes: 'Percorra os achados centrais ligando cada ponto a evidências concretas do documento.',
    });
    push('comparison', 'RISCOS VS ACÇÕES', 'Desafios identificados vs Recomendações', {
      left: extracted.risks[0] || 'Principais desafios e gargalos actuais',
      right: extracted.recommendations[0] || 'Acções prioritárias recomendadas',
      bullets: [...extracted.risks.slice(0, 2).map((r) => `Risco: ${r}`), ...extracted.recommendations.slice(0, 2).map((r) => `Acção: ${r}`)].slice(0, 4),
      handNote: 'Decisão estratégica',
      notes: 'Use este contraste para conduzir a discussão de prioridades e alocação de recursos.',
    });
    push('closing', 'PLANO DE EXECUÇÃO', 'Recomendações e decisão esperada', {
      bullets: (extracted.recommendations.length ? extracted.recommendations : extracted.findings).slice(0, 3),
      checkQuestions: ['Qual recomendação tem maior impacto imediato com menor custo?', 'Quem lidera a primeira fase de implementação?'],
      handNote: 'Passar à acção',
      notes: 'Feche pedindo uma decisão concreta sobre o primeiro passo recomendado.',
    });
  } else if (docType === 'regulamento') {
    push('cover', 'GUIA CLARO DA NORMA', title, {
      subtitle: extracted.coreMessage,
      bullets: [],
      meta: { subject: 'regulamento', estMinutes: 12, pages: 1, author },
      handNote: 'Sem juridiquês',
      notes: 'Apresente o regulamento traduzido em linguagem simples para que todos saibam exactamente como cumprir.',
    });
    push('comparison', 'DIREITOS VS DEVERES', 'O que pode fazer vs O que é obrigatório', {
      left: extracted.rights[0] || 'Direitos e garantias assegurados pela norma',
      right: extracted.duties[0] || 'Obrigações e regras de cumprimento obrigatório',
      bullets: [...extracted.rights.slice(0, 2).map((r) => `Direito: ${r}`), ...extracted.duties.slice(0, 2).map((d) => `Dever: ${d}`)].slice(0, 4),
      intuition: extracted.whyItMatters,
      handNote: 'Equilíbrio claro',
      notes: 'Compare lado a lado direitos e obrigações dando um exemplo prático do dia a dia.',
    });
    push('bullets', 'REGRAS ESSENCIAIS', 'Artigos e prazos a não esquecer', {
      bullets: (extracted.articles.length ? extracted.articles : sents.slice(0, 4).map((s) => trimClean(s, 135))).slice(0, 4),
      intuition: 'Estes são os pontos onde acontecem mais dúvidas ou erros de interpretação.',
      handNote: 'Atenção aos prazos!',
      notes: 'Sublinhe os prazos e eventuais penalidades para prevenir falhas administrativas.',
    });
    push('closing', 'CHECKLIST DE CUMPRIMENTO', 'Como aplicar esta norma hoje', {
      bullets: (extracted.duties.length ? extracted.duties : sents.slice(0, 3)).slice(0, 3).map((d) => trimClean(d, 130)),
      checkQuestions: ['Que dúvida prática ainda existe sobre a aplicação desta norma?', 'Que processo interno precisa ser ajustado já esta semana?'],
      handNote: 'Checklist prático',
      notes: 'Valide se a equipa consegue aplicar as regras sem precisar reler o texto legal inteiro.',
    });
  } else if (docType === 'cientifico') {
    push('cover', 'DEFESA & SEMINÁRIO', title, {
      subtitle: extracted.coreMessage,
      bullets: [],
      meta: { subject: 'cientifico', estMinutes: 15, pages: 1, author },
      handNote: 'Rigor + Clareza',
      notes: 'Apresente o título, o problema de investigação e por que este estudo é relevante.',
    });
    push('concept', 'PROBLEMA & OBJECTIVO', 'Que pergunta este estudo responde?', {
      subtitle: extracted.problem[0] || extracted.coreMessage,
      bullets: extracted.problem.slice(1, 4),
      intuition: extracted.whyItMatters,
      handNote: 'Foco da pesquisa',
      notes: 'Deixe cristalina a pergunta de partida antes de avançar para a metodologia.',
    });
    push('animated-flow', 'METODOLOGIA', 'Como o estudo foi conduzido', {
      steps: extracted.methodology.slice(0, 4),
      bullets: extracted.methodology.slice(0, 4),
      handNote: 'Passo a passo →',
      notes: 'Explique a amostra, instrumentos e critérios de análise de forma directa.',
    });
    push('bullets', 'RESULTADOS PRINCIPAIS', 'O que os dados demonstraram', {
      bullets: extracted.results.slice(0, 4),
      intuition: 'Concentre-se nos resultados que respondem directamente à hipótese central.',
      handNote: 'Evidência real',
      notes: 'Destaque os resultados mais fortes e evite ler números secundários.',
    });
    push('closing', 'CONCLUSÕES & CONTRIBUTO', 'O que muda após este estudo', {
      bullets: extracted.conclusions.slice(0, 3),
      checkQuestions: ['Qual é a principal contribuição prática ou teórica deste trabalho?', 'Que investigação futura este estudo abre?'],
      handNote: 'Pronto p/ defesa',
      notes: 'Termine resumindo o contributo original e abra espaço para perguntas da banca.',
    });
  } else {
    // 'plano'
    push('cover', 'PLANO & PROCEDIMENTO', title, {
      subtitle: extracted.coreMessage,
      bullets: [],
      meta: { subject: 'plano', estMinutes: 12, pages: 1, author },
      handNote: 'Do plano à acção',
      notes: 'Alinhe a equipa em torno do objectivo final antes de detalhar as fases.',
    });
    push('animated-flow', 'FASES DE EXECUÇÃO', 'Sequência passo a passo', {
      steps: extracted.steps.slice(0, 4),
      bullets: extracted.steps.slice(0, 4),
      intuition: extracted.whyItMatters,
      handNote: 'Ordem de execução →',
      notes: 'Percorra cada etapa confirmando dependências e responsáveis.',
    });
    push('bullets', 'ENTREGÁVEIS & METAS', 'Como sabemos que ficou bem feito', {
      bullets: (extracted.deliverables.length ? extracted.deliverables : sents.slice(0, 4).map((s) => trimClean(s, 135))).slice(0, 4),
      handNote: 'Critérios claros',
      notes: 'Valide os critérios de qualidade de cada entregável.',
    });
    push('closing', 'CHECKLIST OPERACIONAL', 'Arranque imediato', {
      bullets: extracted.steps.slice(0, 3),
      checkQuestions: ['Qual é a primeira acção a executar nas próximas 24 horas?', 'Que recursos ou aprovações ainda faltam?'],
      handNote: 'Mãos à obra',
      notes: 'Confirme o arranque da Etapa 1 com toda a equipa.',
    });
  }

  // Ensure proper indexing and complete deck contract
  slides.forEach((s, i) => { s.index = i + 1; });
  const sections = slides
    .filter((s) => !['cover', 'closing'].includes(s.layout))
    .map((s, i) => ({
      id: `sec-${i + 1}`,
      number: i + 1,
      page: s.page || 1,
      heading: s.title,
      paragraphs: [s.subtitle, ...(s.bullets || []), ...(s.steps || [])].filter(Boolean),
      keyTerms: [s.rhythm || meta.shortLabel],
      checkQuestion: `Resumo de «${s.title}»: qual é a acção ou mensagem principal?`,
      sourceAnchor: s.title,
    }));

  return {
    ok: true,
    id: `doc-deck-${Date.now()}`,
    docType,
    docTypeMeta: meta,
    docAnalysis: analysis,
    brand: 'Núcleo CEU',
    credit: 'APP FEITO PELA HORIZONTE FUTURO',
    title,
    subject: docType,
    sourceName,
    theme,
    createdAt: new Date().toISOString(),
    stats: {
      slides: slides.length,
      words: wordCount,
      estMinutes: Math.max(8, slides.length * 3),
      pages: Math.max(1, sections.length),
      keywords: [meta.label, ...sections.slice(0, 4).map((s) => s.heading)],
      level: meta.shortLabel,
    },
    slides,
    plan: {
      blocks: sections.map((sec, idx) => ({
        key: sec.heading,
        heading: sec.heading,
        source: sec.paragraphs.slice(0, 4),
        page: sec.page,
        kept: sec.paragraphs.length,
        read: Math.max(sec.paragraphs.length, 3),
        objective: `Comunicar claramente: ${sec.heading}`,
        slideIndexes: [idx + 2],
      })),
      condensed: { sentencesRead: Math.max(sents.length, slides.length * 2), ideasKept: slides.length, removed: Math.max(0, sents.length - slides.length) },
      keywords: [meta.label, ...sections.slice(0, 4).map((s) => s.heading)],
      steps: [
        `Tipo de documento detectado automaticamente: ${meta.icon} ${meta.label} (${Math.round(analysis.confidence * 100)}% confiança).`,
        `Mensagem central sintetizada: ${clean(extracted.coreMessage, 140)}`,
        `Linguagem burocrática/densa reescrita em ${slides.length} slides claros para ${meta.audience}.`,
      ],
    },
    reading: {
      title,
      centralIdea: extracted.coreMessage,
      definitions: [],
      sections,
      fullText: String(text || '').slice(0, 24000),
    },
  };
}
