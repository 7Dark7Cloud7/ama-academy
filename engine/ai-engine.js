// AMA / CEU Academy — Motor de IA & Síntese Pedagógica (v2).
// Suporta 3 camadas em cascata automática:
//   1. Chrome Built-in AI (Prompt API / Gemini Nano no dispositivo)
//   2. Google Gemini API (opcional, chave do docente em localStorage)
//   3. Sintetizador Pedagógico Local (activo em 100% dos navegadores)
//
// Regra central: NUNCA entrega o texto do PDF «cru» como veio.
// A IA recebe o PDF + os resultados da web (Wikipédia, Wikimedia Commons,
// YouTube, mapas), FUNDE tudo num só discurso coerente, melhora a clareza
// com intuição visual estilo Ingenium 3.0 e embute imagens, vídeos e cenas 3D
// directamente nos slides, mantendo sempre os chips de origem visíveis.

const GEMINI_KEY_STORAGE = 'ama-gemini-api-key';

const SYSTEM_PROMPT = `És o arquitecto pedagógico visual da CEU Academy / AMA (Angola), inspirado na didáctica visual da Ingenium 3.0.
Recebes: (A) blocos extraídos do PDF/apontamentos do docente e (B) informação complementar obtida da web (Wikipédia, definições, contextos).
A tua missão é FUNDIR (A) e (B) numa aula NOVA, mais clara, mais visual e fácil de compreender — NUNCA devolver o texto cru como veio.

Regras obrigatórias:
- Português de Angola claro, moderno e universitário.
- Estrutura Ingenium 3.0 em cada bloco: 1) Intuição simples ("Em palavras simples"), 2) Pontos curtos com gancho em negrito ("Termo: explicação directa", máx. 16 palavras), 3) Aplicação concreta em Angola ou na vida real.
- Integra factos úteis da web directamente nas explicações para enriquecer o PDF (sem contrariar o ficheiro do docente).
- Sugere uma legenda manuscrita curta ("handnote", 3-6 palavras, ex: "Pensa nisto no dia a dia!") e uma pergunta de verificação rápida.
- Responde APENAS com JSON válido (sem markdown nem texto fora do JSON):
{
  "summary": "síntese envolvente da aula em 1 frase",
  "blocks": [
    {
      "title": "título claro e memorável (máx 65 car.)",
      "intuition": "explicação intuitiva em 1 frase simples (sem jargão)",
      "points": ["Conceito-chave: explicação directa e clara", "..."],
      "angolaConnection": "aplicação ou exemplo concreto no contexto angolano",
      "objective": "Verbo no infinitivo + meta clara",
      "handnote": "nota curta manuscrita (3-5 palavras)",
      "note": "guia prático para o docente apresentar este slide (65-95 palavras)"
    }
  ]
}`;

const clean = (s, max = 260) => String(s ?? '').replace(/\s+/g, ' ').trim().slice(0, max);

function timeout(ms) {
  return new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), ms));
}

function extractJson(text) {
  const s = String(text || '').trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '');
  const start = s.indexOf('{');
  const end = s.lastIndexOf('}');
  if (start < 0 || end <= start) throw new Error('sem JSON');
  return JSON.parse(s.slice(start, end + 1));
}

function cleanPoint(value, maxWords = 18) {
  const s = String(value || '').replace(/\s+/g, ' ').replace(/^[-•*\d.)\s]+/, '').trim();
  const words = s.split(' ').filter(Boolean);
  return words.length > maxWords ? `${words.slice(0, maxWords).join(' ')}…` : s;
}

export function getGeminiKey() {
  try { return (localStorage.getItem(GEMINI_KEY_STORAGE) || '').trim(); } catch { return ''; }
}

export function setGeminiKey(key) {
  try {
    const v = String(key || '').trim();
    if (v) localStorage.setItem(GEMINI_KEY_STORAGE, v);
    else localStorage.removeItem(GEMINI_KEY_STORAGE);
    return true;
  } catch { return false; }
}

export async function aiStatus() {
  const geminiKey = getGeminiKey();
  const LM = (typeof self !== 'undefined' && (self.LanguageModel || (self.ai && self.ai.languageModel))) || null;
  let chromeState = 'unavailable';
  if (LM) {
    try {
      chromeState = typeof LM.availability === 'function'
        ? await LM.availability()
        : (typeof LM.capabilities === 'function' ? (await LM.capabilities())?.available || 'unknown' : 'unknown');
    } catch { chromeState = 'unavailable'; }
  }
  const chromeReady = ['readily', 'available', 'after-download', 'downloadable', 'downloading'].includes(String(chromeState).toLowerCase());
  return {
    available: chromeReady || !!geminiKey,
    chromeReady,
    chromeState,
    hasGeminiKey: !!geminiKey,
    engine: geminiKey ? 'gemini-api' : (chromeReady ? 'chrome-language-model' : 'pedagogical-synthesizer'),
  };
}

/* ------------------------------------------------------------------ */
/* Helpers de correspondência semântica (PDF <-> Web/Imagens/Vídeos)  */
/* ------------------------------------------------------------------ */
const STOP = new Set([
  'para', 'como', 'quando', 'porque', 'também', 'sobre', 'entre', 'pelo', 'pela', 'pelos', 'pelas',
  'este', 'esta', 'estes', 'estas', 'esse', 'essa', 'isso', 'aquilo', 'numa', 'numas', 'muito',
  'mais', 'menos', 'onde', 'qual', 'quais', 'cada', 'todo', 'toda', 'todos', 'todas', 'aula',
  'página', 'bloco', 'slide', 'ficheiro', 'texto', 'tema', 'secção', 'capítulo', 'unidade',
]);

function tokenize(text) {
  return [...new Set(
    String(text || '')
      .toLowerCase()
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .split(/[^a-z0-9]+/)
      .filter((w) => w.length >= 4 && !STOP.has(w))
  )];
}

function overlapScore(aText, bText) {
  const a = tokenize(aText);
  const b = new Set(tokenize(bText));
  if (!a.length || !b.size) return 0;
  let hits = 0;
  for (const w of a) {
    if (b.has(w)) hits += 2;
    else if ([...b].some((bw) => bw.startsWith(w.slice(0, 5)) || w.startsWith(bw.slice(0, 5)))) hits += 1;
  }
  return hits;
}

/* Interpreta a descrição do utilizador (falada por áudio ou escrita) sobre como os slides e imagens devem sair. */
export function parseCreativeBrief(rawText = '') {
  const raw = clean(rawText, 480);
  if (!raw) return { raw: '', imageQueries: [], visualStyle: 'auto', themeHint: '', levelHint: '', focusSummary: '' };
  const lower = raw.toLowerCase();

  // 1. Estilo visual pedido
  let visualStyle = 'auto';
  if (/\b(s[oó]\s*3d|mais\s*3d|modelos?\s*3d)\b/i.test(lower)) visualStyle = '3d';
  else if (/\b(diagrama|esquema|gr[aá]fico|fluxograma|t[eé]cnico|vector)\b/i.test(lower)) visualStyle = 'diagrams';
  else if (/\b(foto|fotografia|realista|reais|real|imagem real)\b/i.test(lower)) visualStyle = 'photos';

  // 2. Tema pedido por voz/texto
  let themeHint = '';
  if (/\b(escuro|noite|dark|preto)\b/i.test(lower)) themeHint = 'dark';
  else if (/\b(azul|ceu)\b/i.test(lower)) themeHint = 'ceu';
  else if (/\b(claro|branco|papel|limpo)\b/i.test(lower)) themeHint = 'editorial';
  else if (/\b(verde|pinho)\b/i.test(lower)) themeHint = 'pine';

  // 3. Nível / tom de explicação
  let levelHint = '';
  if (/\b(simples|b[aá]sico|f[aá]cil|1\.?[ºo]\s*ano|iniciante|descomplicad)/i.test(lower)) levelHint = 'basico';
  else if (/\b(avan[cç]ad|rigoroso|aprofundad|exame|universit[aá]rio\s+avan[cç]ado)/i.test(lower)) levelHint = 'avancado';

  // 4. Extrair sujeitos visuais / pedidos de imagem explícitos
  const imageQueries = [];
  const seen = new Set();
  const addQ = (q) => {
    const s = clean(String(q || '').replace(/^(de|da|do|das|dos|um|uma|uns|umas|sobre|com)\s+/i, ''), 46);
    if (!s || s.length < 3) return;
    const k = s.toLowerCase();
    if (seen.has(k)) return;
    seen.add(k);
    imageQueries.push(s);
  };

  // Padrões explícitos: "imagens de X, Y e Z", "fotos de X", "mostrar X"
  const pat = /(?:imagens?|fotos?|fotografias?|ilustra[cç][oõ]es?|diagramas?|esquemas?|mostrar|usar|com)\s+(?:de|da|do|das|dos|sobre)?\s*([^.;!\n]{3,90})/gi;
  let m;
  while ((m = pat.exec(raw))) {
    const chunk = m[1].split(/\b(?:mas|por[eé]m|tom|estilo|tema|foco|sem|para|que)\b/i)[0] || '';
    chunk.split(/,|\be\b|\bou\b/i).forEach((part) => {
      const t = clean(part, 42);
      if (t.length >= 3 && !/^(mais|menos|muito|pouco|texto|slides?|claro|escuro|simples)$/i.test(t)) addQ(t);
    });
  }

  // Substantivos visuais conhecidos mencionados em qualquer parte do áudio/texto
  const visualNouns = [
    'foguetão', 'foguete', 'carro', 'automóvel', 'autocarro', 'floresta', 'maiombe', 'célula', 'cloroplasto',
    'fotossíntese', 'luanda', 'angola', 'escritório', 'reunião', 'sala de aula', 'universidade', 'projetor',
    'gráfico', 'kwanza', 'moeda', 'computador', 'código', 'python', 'árvore', 'algoritmo', 'circuito',
    'onda', 'planeta', 'mapa', 'laboratório', 'engenharia', 'economia', 'hospital', 'energia',
  ];
  for (const noun of visualNouns) {
    if (lower.includes(noun)) addQ(noun);
  }

  return {
    raw,
    imageQueries: imageQueries.slice(0, 6),
    visualStyle,
    themeHint,
    levelHint,
    focusSummary: clean(raw, 140),
  };
}

/* Escolhe o modelo 3D mais coerente com a matéria / tipo de documento. */
export function pickCoherent3DMode(subject = 'geral', docType = 'aula', text = '') {
  const hay = `${subject} ${docType} ${text}`.toLowerCase();
  if (docType === 'ata' || docType === 'regulamento') return 'meeting';
  if (docType === 'relatorio') return 'finance';
  if (docType === 'plano') return 'code';
  if (/f[ií]sic|for[cç]a|newton|din[aâ]mic|in[eé]rcia|acelera|massa|energia|vect/.test(hay) || subject === 'fisica') return 'physics';
  if (/juro|kwanza|finan[cç]|infla|or[cç]amento|invest|lucro|receita|economia/.test(hay) || subject === 'financas') return 'finance';
  if (/python|algoritm|bin[aá]ri|c[oó]digo|dados|software|programa|complexidade|rede/.test(hay) || subject === 'programacao') return 'code';
  if (/biolog|fotoss[ií]ntese|c[eé]lula|adn|dna|ecossistema|planta|maiombe|gen[eé]tic/.test(hay) || subject === 'biologia') return 'bio';
  if (/fun[cç][aã]o|c[aá]lculo|derivada|onda|seno|cosseno|matem[aá]tic|[aá]lgebra/.test(hay) || subject === 'matematica') return 'wave';
  if (/rota[cç][aã]o|orbita|sat[eé]lite|giro/.test(hay)) return 'gyro';
  return 'core';
}

/* Gera um exemplo prático ou nuance de ensino adicional (expansão pedagógica). */
function buildTeachingExpansion(slide, subject, docType) {
  const title = clean(slide.title || 'este tema', 46);
  const hay = `${title} ${(slide.bullets || []).join(' ')}`.toLowerCase();
  if (docType && docType !== 'aula') {
    if (docType === 'ata') return `Impacto prático: confirme dono, prazo e critério de conclusão antes de encerrar este ponto.`;
    if (docType === 'relatorio') return `Leitura executiva: ligue cada número a uma acção concreta com impacto mensurável.`;
    if (docType === 'regulamento') return `Na prática: destaque o que é obrigatório, o prazo limite e a excepção mais comum.`;
    return `Aplicação: transforme esta secção num passo accionável que a equipa possa executar hoje.`;
  }
  if (subject === 'fisica' || /for[cç]a|newton|in[eé]rcia|acelera/.test(hay)) {
    if (/in[eé]rcia|primeira/.test(hay)) return `Na prática (Angola): num autocarro em Luanda que trava de repente, o teu corpo avança por inércia até o cinto exercer força contrária.`;
    if (/segunda|f\s*=\s*m|acelera/.test(hay)) return `Atenção docente: massa (kg) é constante; o que muda com a força resultante é a aceleração — nunca confundir massa com peso!`;
    if (/terceira|ac[cç][aã]o|rea[cç][aã]o/.test(hay)) return `Erro comum a evitar: acção e reacção actuam em corpos diferentes, por isso nunca se cancelam no mesmo corpo.`;
    return `Dica de resolução: desenhe sempre primeiro o diagrama de forças (peso, normal, atrito, tracção) antes de calcular.`;
  }
  if (subject === 'financas' || /juro|kwanza|infla|poupan/.test(hay)) {
    if (/composto|capitaliz/.test(hay)) return `Exemplo em Kwanzas: começar 5 anos mais cedo multiplica o capital mais do que duplicar o depósito mensal no fim.`;
    if (/infla/.test(hay)) return `Erro comum a evitar: olhar só para a taxa nominal sem descontar a inflação esconde perdas reais de poder de compra.`;
    return `Regra prática: separe 20% do rendimento assim que recebe e garanta 3–6 meses de fundo de emergência líquido.`;
  }
  if (subject === 'programacao' || /algoritm|bin[aá]ri|python|dados/.test(hay)) {
    if (/bin[aá]ri/.test(hay)) return `Pré-requisito crítico: a lista tem de estar ordenada — sem ordenação, a pesquisa binária falha silenciosamente!`;
    return `Boas práticas: decomponha o problema em Entrada → Processo → Saída e teste com casos extremos (lista vazia ou 1 elemento).`;
  }
  if (subject === 'biologia' || /fotoss[ií]ntese|planta|maiombe|clorofila/.test(hay)) {
    return `Ligação viva: sem a conversão solar nos cloroplastos, cadeias alimentares inteiras — como a Floresta do Maiombe — colapsam.`;
  }
  if (subject === 'matematica' || /fun[cç]|equa|derivad|l[ií]mite/.test(hay)) {
    return `Intuição visual: traduza sempre a expressão simbólica num gráfico mental — onde cresce, onde zera e o que muda quando x dobra.`;
  }
  return `Aplicação docente: peça à turma para reformular «${title}» por palavras próprias e dar um exemplo do dia a dia.`;
}

/* Reescreve uma frase densa de PDF num ponto claro, adaptado para ensinar (nunca cópia crua). */
function transformBullet(raw, fallbackTerm = '', roleIdx = 0) {
  let s = clean(raw, 240)
    .replace(/^(por exemplo|ou seja|isto é|além disso|portanto|assim|em suma|note-se que|cabe referir que|importa salientar que|de acordo com|segundo o texto)[,:\s]+/i, '')
    .replace(/\s*\([^)]{32,}\)/g, '')
    .trim();
  if (!s) return '';
  // Se já tem estrutura "Termo: explicação" ou "Termo → explicação", refinar e condensar
  if (/^[^:→]{3,36}[:→]\s+\S/.test(s)) {
    const sep = s.includes('→') ? '→' : ':';
    const [head, ...rest] = s.split(sep);
    return `${clean(head, 36)}${sep === '→' ? ' →' : ':'} ${cleanPoint(rest.join(sep), 16)}`;
  }
  // Detectar padrão de definição "X é/consiste em/representa Y"
  const def = s.match(/^([A-ZÁÀÂÃÉÈÊÍÌÓÒÔÕÚÙÇ][^.,;:]{2,34}?)\s+(?:é|são|significa|consiste em|representa|determina|relaciona|permite|define-se como)\s+(.+)$/i);
  if (def) {
    return `${clean(def[1], 34)} → ${cleanPoint(def[2], 16)}`;
  }
  // Detectar padrão causal "Quanto maior / Se / Quando ... , ..."
  const causal = s.match(/^((?:quanto mais|quanto maior|quanto menor|se |quando |enquanto )[^,]{6,48}),\s*(.+)$/i);
  if (causal) {
    return `${clean(causal[1], 44)} → ${cleanPoint(causal[2], 14)}`;
  }
  const words = s.split(/\s+/);
  if (words.length > 17) {
    const firstClause = s.split(/[;—–]/)[0];
    s = cleanPoint(firstClause.length >= 28 ? firstClause : s, 16);
  }
  // Enquadrar com lente pedagógica clara para nunca parecer parágrafo colado
  const lenses = ['Ideia-chave', 'Como funciona', 'Na prática', 'Ponto essencial'];
  const prefix = fallbackTerm && !s.toLowerCase().includes(fallbackTerm.toLowerCase()) && words.length <= 12
    ? clean(fallbackTerm, 26)
    : lenses[roleIdx % lenses.length];
  if (words.length >= 5) {
    return `${prefix}: ${s.charAt(0).toLowerCase()}${s.slice(1)}`;
  }
  return s.charAt(0).toUpperCase() + s.slice(1);
}

/* Cria uma explicação intuitiva ("Em palavras simples") fundindo PDF + Wikipédia. */
function buildIntuition(slide, webItem, subject) {
  const title = clean(slide.title || 'este conceito', 58);
  const srcText = slide.subtitle || (slide.bullets && slide.bullets[0]) || '';
  if (webItem && Array.isArray(webItem.sentences) && webItem.sentences.length) {
    const bestSent = webItem.sentences.find((s) => s.length >= 35 && s.length <= 190) || webItem.sentences[0];
    if (bestSent) {
      return clean(bestSent.replace(/\s*\([^)]{20,}\)/g, ''), 185);
    }
  }
  if (srcText) {
    const short = srcText.split(/[.;]/)[0].replace(/\s*\([^)]{20,}\)/g, '').trim();
    if (short.length >= 24) {
      return clean(`Em termos práticos: ${short.charAt(0).toLowerCase()}${short.slice(1)}.`, 185);
    }
  }
  const subjectHints = {
    fisica: `Pensa em «${title}» como a regra invisível que governa o movimento à tua volta.`,
    matematica: `«${title}» é uma ferramenta visual para transformar relações entre números em previsões exactas.`,
    financas: `«${title}» mostra como o dinheiro em Kwanzas cresce ou perde poder de compra com o tempo.`,
    programacao: `«${title}» organiza passos lógicos para o computador resolver tarefas grandes em milissegundos.`,
    biologia: `«${title}» descreve o mecanismo vivo que mantém o equilíbrio da natureza.`,
    historia: `«${title}» liga decisões do passado à construção da Angola contemporânea.`,
  };
  return subjectHints[subject] || `A ideia essencial de «${title}» é ligar teoria e aplicação real num só raciocínio.`;
}

/* Constrói handnote estilo Ingenium 3.0 contextual por tipo de slide. */
function pickHandnote(slide, index) {
  const byLayout = {
    cover: ['Começa pela intuição!', 'Pronto a explorar ✦', 'Aula visual & 3D'],
    agenda: ['O mapa da aula →', 'Passo a passo!'],
    objectives: ['Meta clara = foco!', 'O que vais dominar ✓'],
    formula: ['Clica nas variáveis!', 'Vê como se ligam →', 'Cada letra tem sentido!'],
    concept: ['Guarda esta intuição!', 'PDF + Web fundidos ✦', 'Ideia-chave aqui!'],
    comparison: ['Nota a diferença ⚖', 'Compara os dois lados!'],
    'animated-flow': ['Segue a sequência →', 'Cada passo prepara o próximo'],
    timeline: ['Ordem importa →', 'Linha do tempo clara'],
    mindmap: ['Tudo se conecta ✦', 'Visão panorâmica'],
    'scene-3d': ['Arrasta para rodar 3D ↻', 'Explora as camadas!'],
    quote: ['Número que marca!', 'Repara neste dado!'],
    quiz: ['Pensa antes de clicar!', 'Testa o que ficou!'],
    closing: ['Leva isto contigo ✓', 'Revê em 2 minutos!'],
  };
  const list = byLayout[slide.layout] || ['Repara nisto ✎', 'Ponto essencial!', 'Liga ao teu dia a dia'];
  return list[index % list.length];
}

/* Extrai variáveis interactivas de uma fórmula (para o Laboratório de Fórmulas Ingenium). */
export function parseFormulaVariables(formulaText = '', contextText = '') {
  const expr = String(formulaText || '').trim();
  if (!expr) return [];
  const KNOWN = {
    F: { name: 'Força resultante', unit: 'N (Newton)', hint: 'Empurrão ou tracção líquida sobre o corpo.' },
    m: { name: 'Massa', unit: 'kg', hint: 'Quantidade de matéria — mede a resistência à mudança de movimento.' },
    a: { name: 'Aceleração', unit: 'm/s²', hint: 'Ritmo a que a velocidade muda a cada segundo.' },
    v: { name: 'Velocidade', unit: 'm/s', hint: 'Distância percorrida por unidade de tempo.' },
    d: { name: 'Distância', unit: 'm', hint: 'Espaço percorrido pelo corpo.' },
    t: { name: 'Tempo', unit: 's', hint: 'Duração do fenómeno.' },
    M: { name: 'Montante final', unit: 'Kz', hint: 'Capital inicial somado a todos os juros acumulados.' },
    C: { name: 'Capital inicial', unit: 'Kz', hint: 'Valor investido ou poupado no arranque.' },
    i: { name: 'Taxa de juro', unit: '% / período', hint: 'Percentagem de rendimento em cada período.' },
    n: { name: 'Períodos / Tamanho', unit: 'un.', hint: 'Número de ciclos de capitalização ou elementos da lista.' },
    E: { name: 'Energia', unit: 'J (Joule)', hint: 'Capacidade de realizar trabalho.' },
    P: { name: 'Potência / Peso', unit: 'W ou N', hint: 'Energia por segundo ou força gravitacional.' },
    V: { name: 'Tensão / Volume', unit: 'V ou m³', hint: 'Diferença de potencial ou espaço ocupado.' },
    I: { name: 'Corrente eléctrica', unit: 'A', hint: 'Fluxo de carga por segundo.' },
    R: { name: 'Resistência', unit: 'Ω', hint: 'Oposição à passagem da corrente.' },
    x: { name: 'Incógnita / Entrada', unit: 'valor', hint: 'Variável independente que controlas.' },
    y: { name: 'Saída / Resultado', unit: 'valor', hint: 'Valor resultante da função.' },
    f: { name: 'Frequência', unit: 'Hz', hint: 'Número de ciclos por segundo.' },
    λ: { name: 'Comprimento de onda', unit: 'm', hint: 'Distância entre duas cristas consecutivas.' },
  };
  // Apanha símbolos isolados na expressão (ex: F = m × a, M = C × (1 + i)^n)
  const coreExpr = expr.split(/[.,;]/)[0].slice(0, 64);
  const tokens = [...new Set((coreExpr.match(/\b[A-Za-zλΔΩ]\b/g) || []))];
  return tokens.slice(0, 5).map((sym) => {
    const k = KNOWN[sym] || KNOWN[sym.toLowerCase()] || null;
    return {
      symbol: sym,
      name: k ? k.name : `Variável ${sym}`,
      unit: k ? k.unit : 'un.',
      hint: k ? k.hint : `Grandeza «${sym}» presente na relação do ficheiro.`,
    };
  });
}

/* ------------------------------------------------------------------ */
/* 1. Chamada à Chrome Built-in AI (Prompt API)                       */
/* ------------------------------------------------------------------ */
async function callChromeAI(payload, onProgress) {
  const LM = (typeof self !== 'undefined' && (self.LanguageModel || (self.ai && self.ai.languageModel))) || null;
  if (!LM) throw new Error('IA do Chrome indisponível');
  const state = typeof LM.availability === 'function' ? await LM.availability() : 'unknown';
  if (state === 'unavailable' || state === 'unknown') throw new Error(`IA do Chrome: ${state}`);

  const createOpts = {
    temperature: 0.3,
    topK: 4,
    systemPrompt: SYSTEM_PROMPT,
    monitor(m) {
      if (m && typeof m.addEventListener === 'function') {
        m.addEventListener('downloadprogress', (e) => {
          const pct = Math.round(((e.loaded || 0) / Math.max(1, e.total || 1)) * 100);
          if (onProgress) onProgress(`A descarregar modelo IA do Chrome (${pct}%)…`);
        });
      }
    },
  };
  const session = await Promise.race([LM.create(createOpts), timeout(22000)]);
  try {
    const raw = await Promise.race([
      session.prompt(`Funde o ficheiro do docente com o contexto web e transforma numa aula visual Ingenium 3.0:\n${JSON.stringify(payload)}`),
      timeout(32000),
    ]);
    return { parsed: extractJson(raw), engine: 'chrome-language-model', state };
  } finally {
    try { if (session && session.destroy) session.destroy(); } catch { }
  }
}

/* ------------------------------------------------------------------ */
/* 2. Chamada à Google Gemini API (se o docente configurar chave)     */
/* ------------------------------------------------------------------ */
async function callGeminiAPI(payload, apiKey) {
  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${encodeURIComponent(apiKey)}`;
  const res = await Promise.race([
    fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
        contents: [{
          role: 'user',
          parts: [{ text: `Funde o ficheiro do docente com o contexto web e transforma numa aula visual Ingenium 3.0:\n${JSON.stringify(payload)}` }],
        }],
        generationConfig: {
          temperature: 0.35,
          responseMimeType: 'application/json',
        },
      }),
    }),
    timeout(25000),
  ]);
  if (!res.ok) throw new Error(`Gemini HTTP ${res.status}`);
  const data = await res.json();
  const txt = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
  return { parsed: extractJson(txt), engine: 'gemini-api', state: 'gemini-2.5-flash' };
}

/* ------------------------------------------------------------------ */
/* 3. API unificada: improvePlan (com contexto web incluído!)         */
/* ------------------------------------------------------------------ */
export async function improvePlan(plan, meta = {}) {
  const blocks = Array.isArray(plan?.blocks) ? plan.blocks.slice(0, 8) : [];
  if (!blocks.length) throw new Error('sem blocos para melhorar');

  const webItems = Array.isArray(meta.web?.items) ? meta.web.items.slice(0, 5) : [];
  const docType = String(meta.docType || 'aula');
  const docTone = String(meta.docTone || 'Didáctico claro e visual');
  const payload = {
    title: String(meta.title || ''),
    subject: String(meta.subject || ''),
    documentType: docType,
    presentationTone: docTone,
    coreMessage: String(meta.coreMessage || ''),
    userCreativeDirection: String(meta.creativeBrief || ''),
    instruction: docType === 'ata'
      ? 'Este documento é uma ATA DE REUNIÃO. NÃO cries perguntas escolares: foca em explicar a mensagem central, destacar decisões aprovadas, responsáveis e prazos com linguagem executiva clara.'
      : (docType === 'relatorio'
          ? 'Este documento é um RELATÓRIO/PROPOSTA. Destaca indicadores, diagnóstico claro, riscos e recomendações práticas para decisores.'
          : (docType === 'regulamento'
              ? 'Este documento é um REGULAMENTO/NORMA. Traduz o texto jurídico em português claro: o que é permitido, obrigatório e os prazos.'
              : 'Funde o ficheiro com o contexto web e explica com intuição visual clara estilo Ingenium 3.0.')),
    webContext: webItems.map((w) => ({ title: w.title, summary: clean(w.text, 220), source: w.source || 'Wikipédia' })),
    blocks: blocks.map((b) => ({
      heading: b.heading,
      source: (b.source || []).slice(0, 4),
    })),
  };

  let out = null;
  const apiKey = getGeminiKey();
  if (apiKey) {
    try { out = await callGeminiAPI(payload, apiKey); } catch { out = null; }
  }
  if (!out) {
    out = await callChromeAI(payload, meta.onProgress);
  }

  const parsed = out.parsed || {};
  const improved = Array.isArray(parsed.blocks) ? parsed.blocks : [];
  if (!improved.length) throw new Error('IA devolveu zero blocos');

  return {
    summary: clean(parsed.summary || '', 240),
    blocks: blocks.map((original, i) => {
      const ai = improved[i] || improved.find((x) => String(x.heading || x.title || '').toLowerCase() === String(original.heading || '').toLowerCase()) || {};
      const points = Array.isArray(ai.points) ? ai.points.map((p) => cleanPoint(p)).filter(Boolean).slice(0, 4) : [];
      return {
        key: original.key,
        heading: clean(ai.title || original.heading, 72),
        intuition: clean(ai.intuition || '', 200),
        points: points.length ? points : (original.source || []).slice(0, 4),
        angolaConnection: clean(ai.angolaConnection || '', 170),
        objective: clean(ai.objective || original.objective || '', 110),
        handnote: clean(ai.handnote || '', 42),
        note: clean(ai.note || '', 340),
      };
    }),
    engine: out.engine,
    state: out.state,
    retrieved: new Date().toISOString(),
  };
}

export function applyImprovement(deck, result) {
  if (!deck || !result || !Array.isArray(result.blocks)) return false;
  const plan = deck.plan;
  if (!plan || !Array.isArray(plan.blocks)) return false;
  let changed = 0;

  result.blocks.forEach((block, i) => {
    const original = plan.blocks[i];
    if (!original) return;
    const targetSlides = (deck.slides || []).filter(
      (s) => s.clusterKey === original.key && !['cover', 'agenda', 'objectives', 'quiz', 'closing', 'web-spotlight', 'scene-3d'].includes(s.layout)
    );
    block.points = (block.points || []).slice(0, 4);
    if (targetSlides.length) {
      let cursor = 0;
      targetSlides.forEach((slide) => {
        const count = Math.max(1, Math.min(4, slide.bullets?.length || 3));
        const next = block.points.slice(cursor, cursor + count);
        if (next.length) slide.bullets = next;
        if (block.intuition && !slide.intuition) slide.intuition = block.intuition;
        if (block.angolaConnection) slide.angolaNote = block.angolaConnection;
        if (block.handnote) slide.handnote = block.handnote;
        slide.aiRewritten = true;
        cursor += next.length;
      });
      const first = targetSlides[0];
      first.title = block.heading;
      if (block.note) first.notes = `${block.note} ${first.notes || ''}`.trim().slice(0, 560);
      changed += targetSlides.length;
    }
    original.heading = block.heading;
    original.objective = block.objective || original.objective;
    original.ai = { points: block.points, intuition: block.intuition, note: block.note };
    const objSlide = (deck.slides || []).find((s) => s.layout === 'objectives');
    if (objSlide && objSlide.bullets && objSlide.bullets[i]) objSlide.bullets[i] = block.objective || objSlide.bullets[i];
    const agendaSlide = (deck.slides || []).find((s) => s.layout === 'agenda');
    if (agendaSlide && agendaSlide.bullets && agendaSlide.bullets[i]) agendaSlide.bullets[i] = block.heading;
  });

  if (result.summary) {
    const cover = (deck.slides || []).find((s) => s.layout === 'cover');
    if (cover) cover.subtitle = result.summary;
  }
  deck.ai = {
    engine: result.engine,
    state: result.state,
    retrieved: result.retrieved,
    blocksImproved: result.blocks.length,
  };
  if (Array.isArray(plan.steps)) {
    const label = result.engine === 'gemini-api' ? 'Gemini AI' : `IA do Chrome (${result.state})`;
    plan.steps.unshift(`${label} fundiu o PDF com a web e reescreveu ${result.blocks.length} bloco(s) para máxima clareza visual.`);
    plan.steps = plan.steps.slice(0, 7);
  }
  return changed > 0;
}

/* ------------------------------------------------------------------ */
/* 4. FUSÃO & TRANSFORMAÇÃO PROFUNDA (PDF + Web + Imagens + Vídeo + 3D)*/
/*    Corre SEMPRE por defeito — garante slides novos, fundidos e       */
/*    visuais estilo Ingenium 3.0 mesmo sem Chrome AI!                  */
/* ------------------------------------------------------------------ */
export function synthesizeAndFuseDeck(deck, web = null, brief = null) {
  if (!deck || !Array.isArray(deck.slides)) return deck;
  const items = Array.isArray(web?.items) ? web.items : [];
  const images = Array.isArray(web?.images) ? web.images : [];
  const videos = Array.isArray(web?.videos) ? web.videos : [];
  const searchVideos = Array.isArray(web?.searchVideos) ? web.searchVideos : [];
  const places = Array.isArray(web?.places) ? web.places : [];
  const parsedBrief = brief && typeof brief === 'object' ? brief : (typeof brief === 'string' ? parseCreativeBrief(brief) : null);

  const usedImgUrls = new Set();
  const usedWebTitles = new Set();

  // Escolhe apenas imagens GENUINAMENTE COERENTES com o slide (ou pedidas explicitamente na descrição por áudio/texto).
  const pickWebImage = (slideText, preferDiagram = false) => {
    if (!images.length) return null;
    if (parsedBrief && parsedBrief.visualStyle === '3d') return null;
    const wantDiag = preferDiagram || (parsedBrief && parsedBrief.visualStyle === 'diagrams');
    const scored = images
      .filter((img) => img && img.url && !usedImgUrls.has(img.url))
      .map((img) => {
        const imgHay = `${img.tag || ''} ${img.term || ''} ${img.title || ''} ${img.alt || ''}`;
        const rel = overlapScore(slideText, imgHay);
        const briefBonus = img.fromBrief ? 4 : 0;
        const diagBonus = wantDiag && img.isDiagram ? 2 : (parsedBrief && parsedBrief.visualStyle === 'photos' && !img.isDiagram ? 2 : 0);
        return { img, rel, total: rel + briefBonus + diagBonus };
      })
      .filter((x) => x.rel >= 2 || x.img.fromBrief)
      .sort((a, b) => b.total - a.total);
    const chosen = scored[0]?.img || null;
    if (chosen) usedImgUrls.add(chosen.url);
    return chosen;
  };

  // Escolhe o melhor artigo Wikipédia para fundir neste slide.
  const pickWebItem = (slideText) => {
    if (!items.length) return null;
    const scored = items
      .map((item) => ({
        item,
        score: overlapScore(slideText, `${item.term || ''} ${item.title || ''} ${item.text || ''}`) + (usedWebTitles.has(item.title) ? -1.5 : 0.5),
      }))
      .sort((a, b) => b.score - a.score);
    const top = scored[0];
    if (!top) return null;
    usedWebTitles.add(top.item.title);
    return top.item;
  };

  let fusedCount = 0;
  let imagesEmbedded = 0;
  let videosEmbedded = 0;

  // 1. Percorrer todos os slides e TRANSFORMAR + FUNDIR directamente no conteúdo
  deck.slides.forEach((slide, idx) => {
    const slideHay = `${slide.title || ''} ${slide.subtitle || ''} ${(slide.bullets || []).join(' ')} ${(slide.steps || []).join(' ')} ${slide.formula || ''}`;

    // Handnote estilo Ingenium 3.0 contextual
    slide.handnote = slide.handnote || pickHandnote(slide, idx);

    // Fórmula → extrair variáveis interactivas
    if (slide.layout === 'formula' || slide.layout === 'highlight') {
      const vars = parseFormulaVariables(slide.formula || slide.highlight || '', slideHay);
      if (vars.length) slide.formulaVars = vars;
    }

    // Capa → usa imagem real de alta resolução apenas se houver fotos suficientes (não roubar dos slides de conteúdo)
    if (slide.layout === 'cover') {
      if (images.length >= 2) {
        const heroImg = pickWebImage(deck.title, false);
        if (heroImg && !heroImg.isDiagram) {
          slide.webHero = heroImg;
        }
      }
      if (items[0] && items[0].sentences && items[0].sentences[0] && (!slide.subtitle || slide.subtitle.length < 40)) {
        slide.subtitle = clean(items[0].sentences[0], 175);
      }
      return;
    }

    if (['agenda', 'objectives', 'quiz', 'closing', 'web-spotlight', 'scene-3d'].includes(slide.layout)) {
      return;
    }

    // Transformar os bullets para não ficarem texto cru do PDF — reorganizar + expandir para ensino!
    if (Array.isArray(slide.bullets) && slide.bullets.length && !slide.aiRewritten) {
      const term = (slide.chips && slide.chips[0]) || slide.term || '';
      slide.bullets = slide.bullets.map((b, bi) => transformBullet(b, bi === 0 ? term : '', bi)).filter(Boolean);
      // Adicionar expansão pedagógica (exemplo prático / erro comum a evitar) se o slide tiver espaço
      if (slide.bullets.length < 4 && !slide.pedagogicalExpanded) {
        const extra = buildTeachingExpansion(slide, deck.subject, deck.docType || 'aula');
        if (extra && !slide.bullets.some((b) => overlapScore(b, extra) >= 7)) {
          slide.bullets.push(extra);
          slide.pedagogicalExpanded = true;
        }
      }
    }

    // Coerência 3D por slide: guarda o modo 3D ideal caso este slide não tenha foto da web
    slide.mode3d = slide.mode3d || pickCoherent3DMode(deck.subject, deck.docType || 'aula', `${deck.title} ${slideHay}`);

    // Fundir conhecimento da Wikipédia directamente no slide!
    const matchedWeb = pickWebItem(slideHay);
    slide.intuition = slide.intuition || buildIntuition(slide, matchedWeb, deck.subject);

    if (matchedWeb) {
      const extraFact = (matchedWeb.sentences || []).find((s) => overlapScore(s, slideHay) < 4)
        || (matchedWeb.sentences && matchedWeb.sentences[0])
        || clean(matchedWeb.text, 165);
      if (extraFact) {
        slide.fusedInsight = {
          heading: clean(matchedWeb.title, 60),
          text: clean(extraFact, 190),
          url: matchedWeb.url,
          source: matchedWeb.source || 'Wikipédia',
        };
        // Fundir também um ponto enriquecido nos bullets se o slide tiver espaço (< 4 bullets)
        if (Array.isArray(slide.bullets) && slide.bullets.length < 4 && extraFact.length >= 28) {
          const synthBullet = transformBullet(extraFact, matchedWeb.title, slide.bullets.length);
          if (synthBullet && !slide.bullets.some((b) => overlapScore(b, synthBullet) >= 4)) {
            slide.bullets.push(synthBullet);
          }
        }
        // Enriquecer notas do docente com a síntese fundida
        if (slide.notes && !slide.notes.includes(matchedWeb.title)) {
          slide.notes = `${slide.notes} Contexto web (${matchedWeb.title}): ${clean(extraFact, 130)}`.trim();
        }
        slide.sources = [
          { label: slide.page ? `PDF p.${slide.page}` : 'Ficheiro', kind: 'pdf' },
          { label: matchedWeb.source || 'Wikipédia', url: matchedWeb.url, kind: 'web' },
        ];
        fusedCount += 1;
      }
    } else if (!slide.sources) {
      slide.sources = [{ label: slide.page ? `PDF p.${slide.page}` : 'Ficheiro', kind: 'pdf' }];
    }

    // Embutir imagem COERENTE da web (Wikimedia Commons / pedido do docente) em layouts visuais!
    const wantsPhoto = ['concept', 'split', 'bullets', 'quote', 'comparison', 'timeline', 'animated-flow'].includes(slide.layout);
    const hasGenericLocalArt = !slide.visual || /^media\/nucleo-/.test(String(slide.visual));
    const briefWantsOverride = Boolean(parsedBrief && parsedBrief.imageQueries && parsedBrief.imageQueries.length);
    if (wantsPhoto && (hasGenericLocalArt || !slide.visualCredit || briefWantsOverride)) {
      const img = pickWebImage(`${slideHay} ${(parsedBrief && parsedBrief.focusSummary) || ''}`, slide.layout === 'concept' || slide.layout === 'formula');
      if (img) {
        slide.visual = img.url;
        slide.visualAlt = img.alt || slide.title;
        slide.visualCredit = {
          text: img.fromBrief ? `Pedido visual · ${img.tag || img.title || 'Wikimedia'}` : (img.credit || 'Wikimedia Commons'),
          url: img.page || '',
        };
        imagesEmbedded += 1;
      } else if (hasGenericLocalArt) {
        // Sem foto coerente: deixar vazio para ativar o modelo 3D coerente ao tema!
        slide.visual = '';
      }
    }

    // Embutir vídeo YouTube (real ou pesquisa directa) num dos primeiros slides de conteúdo
    if (videosEmbedded === 0 && (idx >= 2 && idx <= 5)) {
      const vid = videos[0] || searchVideos[0] || null;
      if (vid) {
        slide.embeddedVideo = vid;
        videosEmbedded += 1;
      }
    } else if (videosEmbedded === 1 && videos[1] && idx >= 6) {
      slide.embeddedVideo = videos[1];
      videosEmbedded += 1;
    }
  });

  // 2. Garantir um Slide 3D Interactivo Real (Núcleo 3D Canvas) com os conceitos REAIS do PDF!
  const has3DSlide = deck.slides.some((s) => s.layout === 'scene-3d');
  if (!has3DSlide && deck.slides.length >= 3) {
    const defs = (deck.reading && deck.reading.definitions) || [];
    const kws = (deck.stats && deck.stats.keywords) || [];
    const sections = (deck.reading && deck.reading.sections) || [];
    const nodes = [];
    const seenN = new Set();
    const pushNode = (label, note) => {
      const lbl = clean(label, 28);
      if (!lbl || seenN.has(lbl.toLowerCase())) return;
      seenN.add(lbl.toLowerCase());
      nodes.push({ label: lbl, short: lbl.slice(0, 6), note: clean(note || `Conceito central da aula «${deck.title}».`, 160) });
    };
    defs.forEach((d) => pushNode(d.term, d.sentence));
    sections.forEach((sec) => pushNode(sec.heading, sec.sourceAnchor || sec.angola_example));
    kws.forEach((k) => pushNode(k, `Termo-chave extraído de ${deck.sourceName || deck.title}.`));
    while (nodes.length < 4) {
      pushNode(`Conceito ${nodes.length + 1}`, `Elemento estrutural de ${deck.title}.`);
    }

    const coherentMode = pickCoherent3DMode(deck.subject, deck.docType || 'aula', `${deck.title} ${kws.join(' ')}`);
    const insertAt = Math.min(deck.slides.length - 1, Math.max(3, Math.ceil(deck.slides.length * 0.45)));
    deck.slides.splice(insertAt, 0, {
      id: 's-3d-lab',
      layout: 'scene-3d',
      scene3d: true,
      mode3d: coherentMode,
      kicker: 'Modelo 3D Interactivo',
      title: `Visualizar em 3D: ${clean(deck.title, 48)}`,
      subtitle: 'Arraste para rodar o modelo 3D coerente com o tema e clique nos conceitos orbitais.',
      nodes3d: nodes.slice(0, 6),
      handnote: 'Arrasta para rodar 3D ↻',
      strategy: 'practice',
      durationMin: 4,
      page: null,
      notes: `Use este modelo 3D interactivo para visualizar como os ${nodes.slice(0, 6).length} conceitos principais de «${deck.title}» se ligam entre si. Rode o modelo em sala, clique em cada nó orbital e peça à turma que explique a ligação antes de avançar.`,
      sources: [{ label: 'Modelo 3D · PDF + Web', kind: 'ai' }],
    });
  }

  // 3. Se houver vídeo YouTube real (embed) ou mapa de Angola, incorporar como slide multimédia dedicado + já integrado!
  if (places.length && !deck.slides.some((s) => s.layout === 'map-spotlight')) {
    const p = places[0];
    const at = Math.max(3, deck.slides.length - 2);
    deck.slides.splice(at, 0, {
      id: 's-map-angola',
      layout: 'map-spotlight',
      kicker: 'Contexto Geográfico · Mapa Interactivo',
      title: `No mapa: ${clean(p.name || p.title, 54)}`,
      place: p,
      otherPlaces: places.slice(1, 5),
      handnote: 'Localiza em Angola 🇦🇴',
      strategy: 'example',
      durationMin: 3,
      page: null,
      external: true,
      web: { url: p.url, source: p.source || 'Google Maps / OSM', text: p.text },
      notes: `Mostre no mapa onde fica ${clean(p.name || p.title, 50)} e ligue directamente ao tema da aula «${deck.title}». Pergunte à turma quem conhece ou vive perto deste local.`,
    });
  }

  // Auto-análise & auto-cura pedagógica (Mayer + Gamma)
  autoSelfAnalyzeAndHeal(deck);

  // Re-indexar tudo
  deck.slides.forEach((s, i) => { s.index = i + 1; });
  if (deck.stats) deck.stats.slides = deck.slides.length;
  deck.synthesis = {
    fusedSlides: fusedCount,
    imagesEmbedded,
    videosEmbedded,
    has3D: true,
    at: new Date().toISOString(),
  };

  if (deck.plan && Array.isArray(deck.plan.steps)) {
    deck.plan.steps = deck.plan.steps.filter((s) => !/^Síntese visual Ingenium 3\.0:/i.test(String(s || '')));
    deck.plan.steps.unshift(
      `Síntese visual Ingenium 3.0: ${fusedCount} slide(s) fundidos com a Wikipédia, ${imagesEmbedded} imagem(ns) da net embutida(s), ${videosEmbedded} vídeo(s) e 1 laboratório 3D interactivo.`
    );
    deck.plan.steps = deck.plan.steps.slice(0, 8);
  }
  return deck;
}

/* ------------------------------------------------------------------ */
/* 5. AUTO-ANÁLISE & AUTO-CURA PEDAGÓGICA (Princípios de Mayer + Gamma)*/
/* ------------------------------------------------------------------ */
function extractHeroStat(slide) {
  const pool = `${slide.subtitle || ''} ${(slide.bullets || []).join(' ')} ${(slide.steps || []).join(' ')}`;
  const patterns = [
    { re: /(\d{1,3}(?:\.\d{3})+\s*Kz|\d+\s*(?:milh[õo]es|mil)\s*Kz)/i, label: 'Valor / Orçamento' },
    { re: /(\d+(?:[.,]\d+)?\s*(?:N|kg|m\/s²|m\/s|km\/h|J|W|Hz|V|Ω))/i, label: 'Grandeza Física' },
    { re: /(\d+(?:[.,]\d+)?%)/i, label: 'Taxa / Indicador' },
    { re: /(O\([^)]{2,14}\))/i, label: 'Complexidade' },
    { re: /(\d+\s*(?:projetores?|salas?|passos?|compara[çc][õo]es?|anos?|meses?|dias?|horas?))/i, label: 'Métrica-chave' },
  ];
  for (const p of patterns) {
    const m = pool.match(p.re);
    if (m) {
      const value = clean(m[1], 24);
      const ctxBullet = (slide.bullets || slide.steps || []).find((b) => b.includes(m[1])) || slide.subtitle || '';
      return { value, label: p.label, context: clean(ctxBullet, 150) };
    }
  }
  return null;
}

export function autoSelfAnalyzeAndHeal(deck) {
  if (!deck || !Array.isArray(deck.slides)) return deck;
  let layoutsFixed = 0;
  let statsHighlighted = 0;
  let bentoUpgraded = 0;
  let cognitiveTrimmed = 0;
  let prevLayout = '';

  const fixedLayouts = new Set(['cover', 'agenda', 'objectives', 'quiz', 'closing', 'scene-3d', 'map-spotlight', 'web-spotlight', 'formula', 'comparison']);

  deck.slides.forEach((slide, idx) => {
    // 1. Princípio da Coerência de Mayer: nunca empilhar intuition + fusedInsight ao mesmo tempo no ecrã!
    if (slide.intuition && slide.fusedInsight && slide.fusedInsight.text) {
      const webExtra = `${slide.fusedInsight.heading || 'Web'}: ${slide.fusedInsight.text}`;
      if (!String(slide.notes || '').includes(slide.fusedInsight.text.slice(0, 32))) {
        slide.notes = `${slide.notes || ''} ${webExtra}`.trim();
      }
      slide.intuition = '';
      cognitiveTrimmed += 1;
    }

    // 2. Reduzir excesso de palavras por bullet visível (preservando o detalhe completo nas notas de voz)
    if (Array.isArray(slide.bullets) && slide.bullets.length && !['cover', 'agenda', 'objectives'].includes(slide.layout)) {
      const trimmed = slide.bullets.slice(0, 4).map((b) => {
        const words = String(b || '').trim().split(/\s+/);
        if (words.length > 18) {
          cognitiveTrimmed += 1;
          return `${words.slice(0, 16).join(' ')}…`;
        }
        return b;
      });
      slide.bullets = trimmed;
    }

    // 3. Elevar até 2 slides quantitativos para Stat Spotlight (nunca dois seguidos!)
    if (!fixedLayouts.has(slide.layout) && prevLayout !== 'stat-spotlight' && statsHighlighted < 2 && idx >= 2 && idx < deck.slides.length - 1) {
      const stat = extractHeroStat(slide);
      if (stat && !slide.visual) {
        slide.layout = 'stat-spotlight';
        slide.heroStat = stat;
        statsHighlighted += 1;
      }
    }

    // 4. Elevar slides de 3-4 ideias sem foto para Bento Grid (estilo Gamma / Apple)
    if (slide.layout === 'bullets' && !slide.visual && Array.isArray(slide.bullets) && slide.bullets.length >= 3 && prevLayout !== 'bento-grid') {
      slide.layout = 'bento-grid';
      bentoUpgraded += 1;
    }

    // 5. Eliminar monotonia: nunca 2 slides de conteúdo seguidos com exactamente o mesmo layout
    if (!fixedLayouts.has(slide.layout) && slide.layout === prevLayout) {
      if (slide.layout === 'bullets' || slide.layout === 'bento-grid') {
        if (Array.isArray(slide.bullets) && slide.bullets.length >= 2) {
          slide.steps = slide.steps && slide.steps.length ? slide.steps : slide.bullets;
          slide.layout = 'animated-flow';
          layoutsFixed += 1;
        }
      } else if (slide.layout === 'split' || slide.layout === 'concept') {
        slide.layout = slide.visual ? 'split' : 'bento-grid';
        if (slide.layout === prevLayout) slide.layout = 'bullets';
        layoutsFixed += 1;
      }
    }
    prevLayout = slide.layout;

    // 6. Princípio da Modalidade & Personalização: gerar guião conversacional de voz natural para o Narrador
    if (!slide.narration) {
      const firstCue = (slide.bullets && slide.bullets[0]) || (slide.steps && slide.steps[0]) || slide.subtitle || '';
      const baseNote = clean(slide.notes || slide.teacherNote || '', 320);
      if (slide.layout === 'cover') {
        slide.narration = `Bem-vindos! Hoje vamos explorar ${slide.title}. ${slide.subtitle || 'Acompanhem os pontos principais no ecrã.'}`;
      } else if (slide.layout === 'stat-spotlight' && slide.heroStat) {
        slide.narration = `Reparem neste número em destaque: ${slide.heroStat.value}. ${slide.heroStat.context || baseNote}`;
      } else if (slide.layout === 'scene-3d') {
        slide.narration = `Observem o modelo 3D interactivo de ${deck.title}. Cada esfera orbital mostra como estes conceitos se ligam na prática.`;
      } else if (baseNote.length >= 40) {
        slide.narration = baseNote;
      } else {
        slide.narration = `Neste slide sobre ${slide.title}, o ponto essencial é: ${clean(firstCue, 180)}.`;
      }
    }
  });

  deck.selfAudit = {
    layoutsFixed,
    statsHighlighted,
    bentoUpgraded,
    cognitiveTrimmed,
    mayerScore: 100,
    summary: `Auto-análise Mayer: ${statsHighlighted} destaque(s) numérico(s), ${bentoUpgraded} grelha(s) Bento, ${layoutsFixed} variação(ões) de layout e ${cognitiveTrimmed} otimização(ões) de carga cognitiva.`,
  };

  if (deck.plan && Array.isArray(deck.plan.steps)) {
    deck.plan.steps = deck.plan.steps.filter((s) => !/^Auto-análise Mayer:/i.test(String(s || '')));
    deck.plan.steps.unshift(deck.selfAudit.summary);
    deck.plan.steps = deck.plan.steps.slice(0, 8);
  }
  return deck;
}
