// CEU Academy — Motores Académicos do Campus (Avaliação 0–20 AO, Simulados de Exame, Flashcards & Pautas)
// 100% determinístico e testável em Node e Browser, sem dependências externas.

export function computeAngolaGrade(pp1Raw, pp2Raw, pesoFreqRaw = 0.4) {
  const p1 = Math.max(0, Math.min(20, Number(String(pp1Raw ?? 0).replace(',', '.')) || 0));
  const p2 = Math.max(0, Math.min(20, Number(String(pp2Raw ?? 0).replace(',', '.')) || 0));
  const wf = Number(pesoFreqRaw) === 0.5 ? 0.5 : 0.4;
  const we = Number((1 - wf).toFixed(2));
  const mf = Number(((p1 + p2) / 2).toFixed(1));
  if (mf >= 14) {
    return {
      pp1: p1, pp2: p2, mf, needed: 0, status: 'dispensado',
      badge: 'DISPENSADO DE EXAME',
      msg: `Com média de frequência ${mf} val. (>= 14), aprova diretamente sem precisar de exame final!`,
    };
  }
  if (mf < 7) {
    return {
      pp1: p1, pp2: p2, mf, needed: 10, status: 'recurso',
      badge: 'VAI DIRETO A RECURSO',
      msg: `Com média ${mf} val. (< 7), segue diretamente para época de recurso segundo o regulamento geral.`,
    };
  }
  const target = 9.5;
  const needed = Math.min(20, Math.max(0, Math.ceil(((target - mf * wf) / we) * 10) / 10));
  return {
    pp1: p1, pp2: p2, mf, needed, status: 'exame',
    badge: 'APTO A EXAME NORMAL',
    msg: `Média de frequência: ${mf} val. Precisa de pelo menos ${needed.toFixed(1)} valores no Exame Final (${Math.round(wf * 100)}% Freq + ${Math.round(we * 100)}% Exame) para aprovar com 10.`,
  };
}

export function computeFinalPautaRow(row, pesoFreqRaw = 0.4) {
  const wf = Number(pesoFreqRaw) === 0.5 ? 0.5 : 0.4;
  const we = 1 - wf;
  const base = computeAngolaGrade(row.pp1, row.pp2, wf);
  const hasExame = row.exame !== '' && row.exame !== null && row.exame !== undefined;
  const ex = hasExame ? Math.max(0, Math.min(20, Number(String(row.exame).replace(',', '.')) || 0)) : null;
  if (base.status === 'dispensado') {
    return { ...row, mf: base.mf, notaFinal: Math.round(base.mf), estado: 'Dispensado', aprovado: true };
  }
  if (base.status === 'recurso' && ex === null) {
    return { ...row, mf: base.mf, notaFinal: Math.round(base.mf), estado: 'Recurso', aprovado: false };
  }
  if (ex === null) {
    return { ...row, mf: base.mf, notaFinal: null, estado: `Exame (mín. ${base.needed.toFixed(1)})`, aprovado: false };
  }
  const rawFinal = base.status === 'recurso' ? ex : (base.mf * wf + ex * we);
  const rounded = Math.round(rawFinal);
  return {
    ...row,
    mf: base.mf,
    exame: ex,
    notaFinal: rounded,
    estado: rounded >= 10 ? 'Aprovado' : 'Recurso',
    aprovado: rounded >= 10,
  };
}

export function exportPautaCsv(turmaCodigo, rows, pesoFreq = 0.4) {
  const computed = (rows || []).map((r) => computeFinalPautaRow(r, pesoFreq));
  const header = ['Numero_CEU', 'Nome_Estudante', 'Presenca', 'PP1', 'PP2', 'Media_Frequencia', 'Exame', 'Nota_Final_0_20', 'Resultado'];
  const escCsv = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;
  const lines = [header.join(';')];
  for (const r of computed) {
    lines.push([
      escCsv(r.numero || ''),
      escCsv(r.nome || ''),
      escCsv(r.presente !== false ? 'Presente' : 'Falta'),
      escCsv(r.pp1 ?? ''),
      escCsv(r.pp2 ?? ''),
      escCsv(r.mf ?? ''),
      escCsv(r.exame ?? ''),
      escCsv(r.notaFinal ?? '—'),
      escCsv(r.estado || ''),
    ].join(';'));
  }
  return '\uFEFF' + lines.join('\r\n');
}

export const EXAM_BANKS = [
  {
    id: 'ex-acesso-mat',
    titulo: 'Exame de Acesso — Matemática (UAN / ISPTEC / ULuanda)',
    area: 'Matemática',
    duracaoMin: 15,
    questions: [
      { q: 'Qual é o domínio de existência em ℝ da função f(x) = √(x − 3) / (x − 5)?', opts: ['[3, +∞[ \\ {5}', ']3, 5[', 'ℝ \\ {5}', '[3, 5]'], ans: 0, exp: 'O radicando exige x − 3 ≥ 0 (logo x ≥ 3) e o denominador exige x − 5 ≠ 0 (logo x ≠ 5).' },
      { q: 'Qual é o valor do limite notável lim (x→0) [sen(4x) / x]?', opts: ['0', '1', '4', '1/4'], ans: 2, exp: 'Multiplica-se e divide-se por 4: 4 · lim [sen(4x)/(4x)] = 4 · 1 = 4.' },
      { q: 'A derivada da função f(x) = x³ − 6x² + 9x anula-se nos pontos:', opts: ['x = 0 e x = 3', 'x = 1 e x = 3', 'x = −1 e x = −3', 'x = 2 e x = 3'], ans: 1, exp: 'f\'(x) = 3x² − 12x + 9 = 3(x² − 4x + 3) = 3(x − 1)(x − 3) = 0 ⇒ x = 1 ou x = 3.' },
      { q: 'Se log₂(x) = 5, então o valor de x é:', opts: ['10', '25', '32', '64'], ans: 2, exp: 'Pela definição de logaritmo, log₂(x) = 5 ⇔ x = 2⁵ = 32.' },
      { q: 'As raízes reais da equação x² − 5x + 6 = 0 são:', opts: ['1 e 6', '2 e 3', '−2 e −3', '−1 e 6'], ans: 1, exp: 'Soma = 5 e Produto = 6 ⇒ x = 2 e x = 3 (Δ = 25 − 24 = 1).' },
    ],
  },
  {
    id: 'ex-fisica-1',
    titulo: 'Prova Parcelar — Física I & Dinâmica Aplicada',
    area: 'Física',
    duracaoMin: 12,
    questions: [
      { q: 'Um veículo de 1.200 kg acelera a 2,5 m/s² numa via horizontal. Qual é a força resultante sobre o veículo?', opts: ['480 N', '1.202,5 N', '3.000 N', '6.000 N'], ans: 2, exp: 'Pela 2.ª Lei de Newton: F_res = m · a = 1200 × 2,5 = 3.000 N.' },
      { q: 'Sobre as forças de Ação e Reação (3.ª Lei de Newton), é correto afirmar que:', opts: ['Anulam-se sempre porque têm sentidos opostos', 'Atuam em corpos diferentes e por isso não se anulam mutuamente', 'Dependem da velocidade inicial', 'Só existem no vácuo'], ans: 1, exp: 'O par ação-reação atua sempre em dois corpos distintos; logo não se soma no mesmo corpo.' },
      { q: 'Qual é a energia cinética de um corpo de 4 kg que se desloca a 5 m/s?', opts: ['10 J', '20 J', '50 J', '100 J'], ans: 2, exp: 'E_c = ½ · m · v² = 0,5 × 4 × 25 = 50 Joules.' },
      { q: 'Se a velocidade de um automóvel duplicar, a sua energia cinética passa a ser:', opts: ['O dobro', 'Metade', 'Quatro vezes maior', 'Igual'], ans: 2, exp: 'Como E_c depende de v², ao duplicar v temos (2v)² = 4v², quadruplicando a energia.' },
      { q: 'No Sistema Internacional (SI), Trabalho e Potência medem-se respetivamente em:', opts: ['Newton e Watt', 'Joule e Watt', 'Watt e Joule', 'Pascal e Joule'], ans: 1, exp: 'Trabalho mede-se em Joules (J) e Potência (trabalho por segundo) em Watts (W).' },
    ],
  },
  {
    id: 'ex-python',
    titulo: 'Avaliação Técnica — Python & Estruturas de Dados',
    area: 'Tecnologia',
    duracaoMin: 12,
    questions: [
      { q: 'Numa lista ordenada com 1.024 nomes de estudantes, no máximo quantas comparações faz a Pesquisa Binária?', opts: ['1.024', '512', '10', '32'], ans: 2, exp: 'log₂(1024) = 10 divisões ao meio no pior caso.' },
      { q: 'Qual estrutura nativa em Python permite procurar valores por chave em tempo médio constante O(1)?', opts: ['list', 'tuple', 'dict (dicionário)', 'str'], ans: 2, exp: 'Os dicionários (dict) usam tabelas de dispersão (hash tables) com acesso médio O(1).' },
      { q: 'Qual é o resultado da expressão [x * 2 for x in range(1, 4)] em Python?', opts: ['[2, 4, 6]', '[1, 2, 3, 4]', '[2, 4, 6, 8]', '[0, 2, 4]'], ans: 0, exp: 'range(1, 4) gera 1, 2 e 3; multiplicados por 2 resultam em [2, 4, 6].' },
      { q: 'Por que devemos abrir ficheiros com "with open(...) as f:" em Python?', opts: ['Aumenta o tamanho do ficheiro', 'Garante que o ficheiro é fechado automaticamente mesmo se ocorrer erro', 'Só funciona com CSV', 'Apaga o ficheiro no fim'], ans: 1, exp: 'O gestor de contexto (with) fecha o descritor de ficheiro automaticamente ao sair do bloco.' },
      { q: 'Qual condição é indispensável antes de executar Pesquisa Binária?', opts: ['A lista ter tamanho par', 'A lista conter apenas números', 'A sequência estar ordenada', 'A lista ter menos de 100 itens'], ans: 2, exp: 'Sem ordenação prévia não é possível descartar metade do espaço de busca em cada passo.' },
    ],
  },
  {
    id: 'ex-ingles',
    titulo: 'Academic & Career English Assessment (B1–C1)',
    area: 'Idiomas',
    duracaoMin: 10,
    questions: [
      { q: 'Which phrase best introduces the main conclusion of a university presentation?', opts: ['"Actually, yesterday I went…"', '"To sum up, the key takeaway from our study is…"', '"Wait a minute…"', '"Give me attention"'], ans: 1, exp: '"To sum up, the key takeaway is…" is clear, formal academic signposting.' },
      { q: 'Beware of false friends! In English, the word "currently" means:', opts: ['Correntemente (fluente)', 'Atualmente / no momento presente', 'Corrente elétrica', 'Raramente'], ans: 1, exp: '"Currently" significa "atualmente"; já "actually" significa "na verdade / de facto".' },
      { q: 'In a job or internship interview, what does the STAR method stand for?', opts: ['Start, Talk, Ask, Repeat', 'Situation, Task, Action, Result', 'Study, Test, Apply, Review', 'Skill, Time, Aim, Role'], ans: 1, exp: 'STAR structures behavioral interview answers around Situation, Task, Action, and measurable Result.' },
      { q: 'Choose the most professional opening line for an internship application email:', opts: ['"Hey boss, need a job"', '"I am writing to express my interest in the Software Engineering Internship."', '"Send me the contract please"', '"Hello friend how are you"'], ans: 1, exp: 'Formal, concise, and immediately states the purpose and role.' },
      { q: 'Which connector expresses CONTRAST in an academic essay?', opts: ['Therefore', 'Furthermore', 'However', 'For instance'], ans: 2, exp: '"However" (contudo/no entanto) introduz contraste; "therefore" indica conclusão e "furthermore" adição.' },
    ],
  },
  {
    id: 'ex-marketing',
    titulo: 'Certificação Prática — Marketing Digital & Negócios AO',
    area: 'Marketing',
    duracaoMin: 10,
    questions: [
      { q: 'Uma campanha investiu 50.000 Kz em anúncios e gerou 250.000 Kz em vendas diretas. Qual foi o ROAS?', opts: ['0,2x', '2x', '5x', '20%'], ans: 2, exp: 'ROAS = Receita ÷ Investimento = 250.000 ÷ 50.000 = 5x (5 Kwanzas gerados por cada 1 Kwanza investido).' },
      { q: 'Se gastou 40.000 Kz em marketing e conquistou 8 clientes pagantes novos, qual foi o CAC?', opts: ['4.000 Kz', '5.000 Kz', '8.000 Kz', '32.000 Kz'], ans: 1, exp: 'CAC (Custo de Aquisição de Cliente) = 40.000 ÷ 8 = 5.000 Kz por cliente.' },
      { q: 'Num vídeo curto vertical (Reels/TikTok), o que determina a retenção inicial?', opts: ['A música de encerramento', 'O gancho (hook) claro nos primeiros 2 a 3 segundos', 'Ter mais de 10 minutos', 'Não usar legendas'], ans: 1, exp: 'Os primeiros 2–3 segundos decidem se o utilizador continua a assistir ou desliza.' },
      { q: 'Na matriz editorial 4:3:3, qual deve ser a maior fatia semanal de publicações?', opts: ['Conteúdo que educa e resolve dúvidas reais do público (40%)', 'Apenas descontos urgentes', 'Memes aleatórios', 'Fotos sem texto'], ans: 0, exp: '40% educativo gera autoridade e salvamentos, preparando os 30% de prova social e 30% de oferta.' },
      { q: 'Qual é o erro que mais faz perder vendas após gerar cliques em campanhas para WhatsApp em Angola?', opts: ['Responder rápido com contexto', 'Demorar horas a responder e não fazer follow-up estruturado', 'Usar catálogo claro', 'Segmentar por província'], ans: 1, exp: 'Sem resposta rápida e cadência de follow-up, a maioria dos leads arrefece.' },
    ],
  },
];

export function scoreExamAttempt(examId, userAnswers = {}) {
  const exam = EXAM_BANKS.find((e) => e.id === examId) || EXAM_BANKS[0];
  let correct = 0;
  const details = exam.questions.map((q, idx) => {
    const picked = userAnswers[idx] !== undefined ? Number(userAnswers[idx]) : -1;
    const isRight = picked === q.ans;
    if (isRight) correct += 1;
    return {
      index: idx,
      question: q.q,
      picked,
      correctIndex: q.ans,
      correctOption: q.opts[q.ans],
      pickedOption: picked >= 0 ? q.opts[picked] : 'Não respondida',
      isRight,
      explanation: q.exp,
    };
  });
  const total = exam.questions.length;
  const nota20 = Number(((correct / Math.max(1, total)) * 20).toFixed(1));
  let nivel = 'Insuficiente — Rever matéria';
  if (nota20 >= 16) nivel = 'Excelente (Distinção)';
  else if (nota20 >= 14) nivel = 'Muito Bom (Nível de Dispensa)';
  else if (nota20 >= 10) nivel = 'Aprovado';
  return { examId: exam.id, title: exam.titulo, correct, total, nota20, aprovado: nota20 >= 10, nivel, details };
}

export const FLASHCARD_DECKS = [
  { id: 'fc-fis', subject: 'Física', front: 'Enuncie a 2.ª Lei de Newton e unidades SI', back: 'F_res = m · a — A força resultante (Newtons, N) é igual ao produto da massa (kg) pela aceleração (m/s²).' },
  { id: 'fc-fis2', subject: 'Física', front: 'Teorema da Energia Cinética', back: 'W_total = ΔE_c = ½ m v_f² − ½ m v_i² — O trabalho total das forças equivale à variação da energia cinética.' },
  { id: 'fc-mat', subject: 'Matemática', front: 'Regra da Cadeia (Derivada da Composta)', back: '[f(g(x))]\' = f\'(g(x)) · g\'(x) — Deriva-se a função exterior mantendo o interior e multiplica-se pela derivada do interior.' },
  { id: 'fc-mat2', subject: 'Matemática', front: 'Limite Trigonométrico Fundamental', back: 'lim (x→0) [sen(x) / x] = 1 (com x em radianos).' },
  { id: 'fc-py', subject: 'Tecnologia', front: 'Complexidade da Pesquisa Binária vs. Linear', back: 'Binária: O(log n) — exige lista ordenada. Linear: O(n) — percorre elemento a elemento.' },
  { id: 'fc-ing', subject: 'Idiomas', front: 'False Friends: "Actually" vs. "Currently"', back: '"Actually" = na verdade / de facto. "Currently" = atualmente / neste momento.' },
  { id: 'fc-ing2', subject: 'Idiomas', front: 'Estrutura STAR para Entrevistas em Inglês', back: 'Situation (contexto) → Task (missão) → Action (o que fez) → Result (resultado mensurável).' },
  { id: 'fc-mkt', subject: 'Marketing', front: 'Diferença entre CAC e ROAS', back: 'CAC = Custo para conquistar 1 cliente novo. ROAS = Receita gerada a dividir pelo valor gasto em anúncios.' },
  { id: 'fc-fin', subject: 'Finanças', front: 'Fórmula do Juro Composto & Regra dos 72', back: 'M = C · (1 + i)^n. Para estimar em quantos anos o capital duplica: Anos ≈ 72 ÷ taxa anual (%).' },
];

export function buildFlashcardsFromText(subjectLabel, rawText) {
  const lines = String(rawText || '')
    .split(/\n+/)
    .map((s) => s.trim())
    .filter((s) => s.length >= 12);
  const out = [];
  for (let i = 0; i < lines.length && out.length < 12; i += 1) {
    const line = lines[i];
    const sep = line.match(/^([^:–—→-]{3,55})\s*[:–—→-]\s*(.{8,})$/);
    if (sep) {
      out.push({ id: `fc-gen-${Date.now()}-${i}`, subject: subjectLabel || 'Meus Cartões', front: sep[1].trim(), back: sep[2].trim() });
    } else if (i + 1 < lines.length && line.length <= 70) {
      out.push({ id: `fc-gen-${Date.now()}-${i}`, subject: subjectLabel || 'Meus Cartões', front: line, back: lines[i + 1] });
      i += 1;
    }
  }
  return out;
}
