/* AMA — Universidade
   Turmas, disciplinas, semestres, sessões de aula, presenças e materiais.
   Tudo local: vive em localStorage['ama-uni-v1'] e usa o Núcleo AMA
   (Study) para fichas, planos e exportações. O registo oficial da escola
   continua a ser o da secretaria — esta camada é apoio de sala de aula. */
(function () {
  'use strict';

  const KEY = 'ama-uni-v1';
  const DAY = 86400000;
  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const escAttr = esc;
  const iso = (d) => {
    const x = new Date(d);
    return `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, '0')}-${String(x.getDate()).padStart(2, '0')}`;
  };
  const addDays = (n) => iso(Date.now() + n * DAY);
  const hoje = () => iso(Date.now());
  const uid = (p) => p + Date.now().toString(36) + Math.random().toString(36).slice(2, 5);
  const fmtDia = (s) => {
    if (!s) return '—';
    const d = new Date(String(s).slice(0, 10) + 'T12:00:00');
    if (Number.isNaN(d.getTime())) return s;
    return d.toLocaleDateString('pt-AO', { weekday: 'short', day: '2-digit', month: 'short' });
  };
  const fmtLongo = (s) => {
    if (!s) return '—';
    const d = new Date(String(s).slice(0, 10) + 'T12:00:00');
    if (Number.isNaN(d.getTime())) return s;
    return d.toLocaleDateString('pt-AO', { day: 'numeric', month: 'long', year: 'numeric' });
  };
  const diaCURTO = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sáb'];

  /* --------------------------------------------------------------- seed */
  const ALUNOS = ['Ana Domingos', 'Bruno Kiala', 'Carla Neto', 'Daniel Mwanza', 'Edson Cassoma',
    'Filomena Baptista', 'Gabriel Tavares', 'Helder Chipenda', 'Inês de Almeida', 'Joana Kambanda',
    'Jorge Silva', 'Lúcia Ferreira', 'Manuel Chivukuvuku', 'Marta Cassule', 'Nelson Quissanga',
    'Olga Ndala', 'Paulo Kiala', 'Rita Mendes'];

  function seed() {
    const semestre = '2026/27 · 1.º semestre';
    /* Escolas de demonstração: existem para dar contexto às turmas, não são
       instituições reais nem há qualquer ligação a sistemas oficiais. */
    const escolas = [
      { id: 'e-luanda', nome: 'Escola Superior de Luanda', sigla: 'ESL', local: 'Luanda' },
      { id: 'e-huambo', nome: 'Instituto Politécnico do Huambo', sigla: 'IPH', local: 'Huambo' },
      { id: 'e-benguela', nome: 'Escola Técnica de Benguela', sigla: 'ETB', local: 'Benguela' },
    ];
    const disciplinas = [
      { id: 'd-com', nome: 'Comunicação Organizacional', codigo: 'COM-201', area: 'Comunicação', ects: 6, ano: 2 },
      { id: 'd-prog', nome: 'Programação I', codigo: 'PROG-102', area: 'Tecnologia', ects: 6, ano: 1 },
      { id: 'd-fin', nome: 'Gestão Financeira', codigo: 'FIN-110', area: 'Finanças', ects: 5, ano: 1 },
      { id: 'd-mkt', nome: 'Marketing Digital', codigo: 'MKT-205', area: 'Negócios', ects: 5, ano: 2 },
    ];

    const defs = [
      {
        id: 't-com201-a', codigo: 'COM201A', disciplinaId: 'd-com', docenteId: 2, docenteNome: 'Prof. Adolfo Camacho',
        sala: 'Auditório B · Bloco 2', horario: 'Ter 10:00–12:00 · Qui 14:00–16:00', ano: 2,
        temas: [
          ['O diagnóstico da comunicação institucional',
            'Uma organização comunica em todos os pontos de contacto: atendimento, sinalética, redes e o que os colaboradores dizem fora do escritório. Este primeiro encontro mapeia os canais reais da turma e identifica onde a mensagem se perde.'],
          ['Mensagem, público e canal',
            'Toda a mensagem tem um público, um objetivo e um canal mais adequado. Vamos separar mensagens informativas, persuasivas e de crise, e treinar a escolha do canal com casos de empresas angolanas.'],
          ['Comunicação de crise',
            'Numa crise, o silêncio também é uma mensagem. A aula define a cadeia de porta-vozes, o primeiro comunicado em 60 minutos e as três perguntas que nunca devem ficar sem resposta.'],
          ['Apresentações executivas',
            'Apresentar a executivos exige clareza e decisão. Trabalhamos a estrutura de uma página por ideia, o pedido concreto e a defesa de números em cinco minutos.'],
          ['Redação de comunicados',
            'Um comunicado útil responde a quem, o quê, quando, onde e o que fazer a seguir. A sessão compara comunicados reais e reescreve um deles em linguagem direta.'],
          ['Simulação de assembleia',
            'A turma organiza uma assembleia com ordem de trabalhos, tempos de intervenção e ata. O objetivo é praticar escuta, síntese e decisão em grupo.'],
        ],
        materiais: [
          ['Matriz de canais de comunicação', 'Modelo para inventariar canais internos e externos', 'Folha de cálculo'],
          ['Checklist de comunicado de crise', 'Perguntas obrigatórias antes de publicar', 'PDF de apoio'],
          ['Casos angolanos — 2024/2026', 'Seis casos comentados para discussão', 'Leitura'],
        ],
        avaliacoes: [
          ['Diagnóstico de comunicação', 'Trabalho de grupo', 30, 12],
          ['Apresentação executiva', 'Apresentação individual', 35, 38],
          ['Exame final', 'Exame escrito', 35, 62],
        ],
      },
      {
        id: 't-prog102-b', codigo: 'PROG102B', disciplinaId: 'd-prog', docenteId: 12, docenteNome: 'Eng.ª Mei Lin Zhao',
        sala: 'Laboratório 3 · Bloco T', horario: 'Seg 08:00–10:00 · Qua 10:00–12:00', ano: 1,
        temas: [
          ['Algoritmos e pensamento computacional',
            'Antes da sintaxe vem a decomposição: dividir um problema em passos, identificar repetições e escrever a solução em português. A aula termina com um algoritmo em papel para uma tarefa do dia a dia.'],
          ['Variáveis e tipos de dados',
            'Uma variável é um nome para um valor. Trabalhamos textos, inteiros, decimais e booleanos, e mostramos por que a conversão explícita evita erros silenciosos.'],
          ['Condicionais e decisões',
            'if, elif e else permitem escolher caminhos. A sessão pede à turma para escrever as regras de aprovação de uma disciplina e convertê-las em código legível.'],
          ['Ciclos e listas',
            'for percorre sequências e while repete enquanto a condição se mantém. Praticamos listas de presenças e somas acumuladas, evitando ciclos infinitos.'],
          ['Funções e reutilização',
            'Uma função tem nome, entradas e saída. Refatoramos um programa longo em funções pequenas e testáveis, com um exemplo de cálculo de médias.'],
          ['Projeto: calculadora de notas',
            'O projeto junta entradas, validação, ciclos e funções. Cada grupo entrega uma calculadora de notas que lê alunos e devolve a média, a maior nota e a lista de aprovados.'],
        ],
        materiais: [
          ['Guia de instalação do Python', 'Windows, macOS e Linux, passo a passo', 'Guia'],
          ['Caderno de exercícios — unidades 1 a 3', 'Vinte exercícios com soluções comentadas', 'PDF de apoio'],
          ['Modelo do projeto final', 'Estrutura de pastas e critérios de entrega', 'Repositório'],
        ],
        avaliacoes: [
          ['Exercícios semanais', 'Portefólio de código', 25, 20],
          ['Teste prático', 'Teste no laboratório', 35, 42],
          ['Projeto final', 'Projeto em grupo', 40, 66],
        ],
      },
      {
        id: 't-fin110-a', codigo: 'FIN110A', disciplinaId: 'd-fin', docenteId: 14, docenteNome: 'Prof. Duarte Costa',
        sala: 'Sala 12 · Bloco A', horario: 'Ter 14:00–16:00 · Sex 08:00–10:00', ano: 1,
        temas: [
          ['Orçamento pessoal e familiar',
            'O orçamento começa por separar rendimento fixo, despesas fixas e despesas variáveis. A aula usa um caso de um agregado em Luanda para encontrar o que realmente pode ser poupado.'],
          ['Juros, inflação e poder de compra',
            'Vinte por cento de inflação não é um detalhe: muda o valor do dinheiro parado. Calculamos juros simples e compostos e comparamos poupança em kwanzas com ativos indexados.'],
          ['Fluxo de caixa',
            'Fluxo de caixa é a diferença entre o que entra e o que sai num período. A turma constrói um fluxo mensal e identifica os meses em que a reserva precisa de ser reforçada.'],
          ['Poupança, risco e diversificação',
            'Guardar não é investir. Discutimos liquidez, risco e horizonte temporal, e porque é errado colocar dinheiro de curto prazo em ativos voláteis.'],
          ['Crédito responsável',
            'Um crédito só faz sentido se a prestação couber no fluxo de caixa. Analisamos taxa efetiva, prazo e custo total, e escrevemos três regras pessoais antes de pedir crédito.'],
          ['Projeto: plano financeiro',
            'Cada estudante entrega um plano financeiro de seis meses com orçamento, fundo de emergência e uma decisão de poupança justificada.'],
        ],
        materiais: [
          ['Folha de orçamento mensal', 'Modelo com categorias e totais automáticos', 'Folha de cálculo'],
          ['Tabela de juros e inflação', 'Simulações em kwanzas para 12 meses', 'PDF de apoio'],
          ['Guia do fundo de emergência', 'Quanto guardar e onde', 'Leitura'],
        ],
        avaliacoes: [
          ['Orçamento comentado', 'Trabalho individual', 30, 16],
          ['Teste de cálculo financeiro', 'Teste escrito', 30, 40],
          ['Plano financeiro', 'Projeto final', 40, 64],
        ],
      },
      {
        id: 't-mkt205-a', codigo: 'MKT205A', disciplinaId: 'd-mkt', docenteId: 13, docenteNome: 'Profa. Sofia Almeida',
        sala: 'Sala 7 · Bloco C', horario: 'Qua 14:00–16:00 · Sex 10:00–12:00', ano: 2,
        temas: [
          ['Audiência e posicionamento',
            'Antes de publicar, é preciso saber para quem. A aula define um público concreto, uma promessa e uma razão para acreditar, com exemplos de marcas que operam em Angola.'],
          ['Conteúdo que serve',
            'Conteúdo útil educa, inspira ou prova. A turma constrói um calendário de duas semanas com quatro formatos e mede o esforço de produção de cada peça.'],
          ['Anúncios e orçamento',
            'Um anúncio tem objetivo, público, criativo e orçamento. Trabalhamos um teste A/B com verba pequena e explicamos por que o criativo decide a maior parte do resultado.'],
          ['Métricas e funil',
            'Alcance, cliques, conversas e vendas não são a mesma coisa. A aula liga cada métrica a uma etapa do funil e identifica onde a campanha está a perder dinheiro.'],
          ['Prova social e confiança',
            'Testemunhos, casos e bastidores reduzem o risco percebido. Discutimos como recolher prova social com consentimento e como usá-la sem exagerar resultados.'],
          ['Campanha final',
            'Cada grupo apresenta uma campanha de duas semanas com público, mensagem, peças, orçamento e métricas de sucesso.'],
        ],
        materiais: [
          ['Calendário de conteúdo', 'Modelo de duas semanas com formatos', 'Folha de cálculo'],
          ['Guia de anúncios em kwanzas', 'Objetivos, públicos e orçamento mínimo', 'PDF de apoio'],
          ['Grelha de métricas do funil', 'Do alcance à venda', 'Leitura'],
        ],
        avaliacoes: [
          ['Calendário de conteúdo', 'Trabalho de grupo', 25, 22],
          ['Análise de campanha', 'Estudo de caso', 35, 44],
          ['Campanha final', 'Apresentação', 40, 68],
        ],
      },
    ];

    const offsets = [-21, -14, -7, 0, 7, 14];
    const turmas = defs.map((def, ti) => {
      const disciplina = disciplinas.find((d) => d.id === def.disciplinaId);
      const sessoes = def.temas.map(([tema, resumo], i) => {
        const data = addDays(offsets[i]);
        const passado = i < 3;
        const agora = i === 3;
        const guiao = [
          `Abertura e chamada — ${def.codigo}`,
          `Enquadramento: ${tema}`,
          `Exposição dialogada com exemplos do contexto angolano`,
          `Trabalho em pares e circulação pela sala`,
          `Síntese, próximos passos e avaliação rápida`,
        ];
        const presencas = {};
        if (passado) {
          const nomes = ALUNOS.slice(0, 16);
          nomes.forEach((n, j) => { presencas[n] = (j + ti) % 11 === 0 ? 'absent' : (j + ti) % 7 === 0 ? 'late' : 'present'; });
        }
        return {
          id: uid('s'), data, inicio: ti % 2 ? '14:00' : '10:00', fim: ti % 2 ? '16:00' : '12:00',
          tema, resumo, guiao, estado: passado ? 'terminada' : agora ? 'em-curso' : 'planeada',
          presencas, feito: passado ? guiao.map((_, k) => k) : [], passo: 0, notas: '',
        };
      });
      const materiais = def.materiais.map(([titulo, nota, tipo]) => ({
        id: uid('m'), titulo, nota, tipo,
        texto: `${titulo}. ${nota}. Esta matéria foi preparada para a turma ${def.codigo} de ${disciplina.nome}. Serve de ponto de partida para o estudo: identifique as ideias centrais, relacione com os exemplos dados em aula e teste-se com os cartões gerados pelo Núcleo AMA.`,
        arquivo: null, nomeArquivo: '', enviado: true, enviadoEm: new Date().toISOString(), autor: def.docenteNome,
      }));
      return {
        id: def.id, codigo: def.codigo, disciplinaId: def.disciplinaId, semestre,
        escolaId: ['e-luanda', 'e-luanda', 'e-huambo', 'e-benguela'][ti] || 'e-luanda',
        docenteId: def.docenteId, docenteNome: def.docenteNome, sala: def.sala, horario: def.horario,
        ano: def.ano, alunos: ALUNOS.slice(0, 16 + (ti % 3) * 1), inscritos: [],
        sessoes, materiais,
        avaliacoes: def.avaliacoes.map(([titulo, tipo, peso, dias]) => ({ id: uid('a'), titulo, tipo, peso, data: addDays(dias) })),
      };
    });

    return { version: 3, semestre, criadoEm: new Date().toISOString(), escolas, disciplinas, turmas };
  }

  /* --------------------------------------------------------------- store */
  let MEM = null;
  const ESCOLAS_PADRAO = [
    { id: 'e-luanda', nome: 'Escola Superior de Luanda', sigla: 'ESL', local: 'Luanda' },
    { id: 'e-huambo', nome: 'Instituto Politécnico do Huambo', sigla: 'IPH', local: 'Huambo' },
    { id: 'e-benguela', nome: 'Escola Técnica de Benguela', sigla: 'ETB', local: 'Benguela' },
  ];
  /* Actualização silenciosa do registo local: acrescenta escolas, escola por
     turma e matérias com texto publicável, sem apagar nada que já exista. */
  function migrar(d) {
    let mudou = false;
    if (!Array.isArray(d.escolas) || !d.escolas.length) { d.escolas = ESCOLAS_PADRAO.slice(); mudou = true; }
    d.turmas.forEach((t) => {
      if (!t.escolaId) { t.escolaId = d.escolas[0].id; mudou = true; }
      const antes = (t.materiais || []).length;
      t.materiais = (t.materiais || []).map((m) => {
        let texto = m.texto !== undefined ? m.texto : ([m.titulo, m.nota].filter(Boolean).join('. ') + '.');
        if (/ingenium/i.test(texto)) {
          texto = texto.replace(/motor\s+ingenium/gi, 'Núcleo AMA').replace(/ingenium/gi, 'Núcleo AMA');
          mudou = true;
        }
        if (m.enviado !== undefined && m.texto === texto) return m;
        mudou = true;
        return {
          ...m,
          texto,
          arquivo: m.arquivo || null, nomeArquivo: m.nomeArquivo || '',
          enviado: m.enviado !== false, enviadoEm: m.enviadoEm || new Date().toISOString(),
          autor: m.autor || t.docenteNome || 'Docente',
        };
      });
      if (antes !== t.materiais.length) mudou = true;
    });
    if (d.version !== 3) { d.version = 3; mudou = true; }
    if (mudou) { try { localStorage.setItem(KEY, JSON.stringify(d)); } catch { } }
    return d;
  }
  function load() {
    if (MEM) return MEM;
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) {
        const d = JSON.parse(raw);
        if (d && Array.isArray(d.turmas) && d.turmas.length) { MEM = migrar(d); return MEM; }
      }
    } catch { }
    MEM = seed();
    save(MEM);
    return MEM;
  }
  function save(d) {
    MEM = d;
    try { localStorage.setItem(KEY, JSON.stringify(d)); }
    catch { toast('Não foi possível guardar: o armazenamento deste navegador está cheio.'); }
  }
  function mutate(fn) { const d = load(); fn(d); save(d); return d; }

  /* ------------------------------------------------------------- helpers */
  const disc = (d, id) => d.disciplinas.find((x) => x.id === id) || { nome: 'Disciplina', codigo: '—', ects: 0, area: '—' };
  const escola = (d, id) => (d.escolas || []).find((x) => x.id === id) || { nome: 'Escola a definir', sigla: '—', local: '—' };
  const publicadas = (t) => (t.materiais || []).filter((m) => m.enviado !== false);
  const turma = (id) => load().turmas.find((t) => String(t.id) === String(id)) || null;
  const podeLecionar = () => S.user && (S.user.papel === 'ADMIN' || S.user.papel === 'INSTRUCTOR');
  const inscrito = (t) => !!(S.user && (t.inscritos || []).includes(S.user.id));
  const menu = () => (S.user && S.user.papel === 'ADMIN' ? MENU.admin : S.user && S.user.papel === 'INSTRUCTOR' ? MENU.instrutor : MENU.aluno);
  const sessoesOrd = (t) => (t.sessoes || []).slice().sort((a, b) => String(a.data).localeCompare(String(b.data)));
  const proxima = (t) => sessoesOrd(t).find((s) => s.estado !== 'terminada') || sessoesOrd(t)[sessoesOrd(t).length - 1] || null;
  const estadoLabel = (s) => (s.estado === 'terminada' ? 'Concluída' : s.data === hoje() ? 'Hoje' : s.estado === 'em-curso' ? 'Em curso' : 'Planeada');
  const iniciais = (n) => String(n || '?').split(/\s+/).map((w) => w[0]).slice(0, 2).join('').toUpperCase();
  const entradas = (s) => Object.entries(s.presencas || {}).map(([name, status]) => ({ name, status }));
  function taxa(sessoes) {
    let p = 0, tot = 0;
    (sessoes || []).forEach((s) => {
      const e = entradas(s); if (!e.length) return;
      p += e.filter((x) => x.status === 'present' || x.status === 'late').length; tot += e.length;
    });
    return { pct: tot ? Math.round((p / tot) * 100) : 0, p, tot };
  }
  const norm = (s) => String(s || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();

  /* ---------------------------------------------------------- documentos */
  const DOC_CSS = `
    *{box-sizing:border-box}
    body{margin:0;padding:30px 24px;background:#fff;color:#1c2320;font:14px/1.55 'Instrument Sans',system-ui,sans-serif}
    .sheet{max-width:820px;margin:0 auto}
    .head{display:flex;flex-wrap:wrap;gap:16px;align-items:flex-start;border-bottom:2px solid #14200c;padding-bottom:14px}
    .brand{display:flex;flex-direction:column;gap:3px;font-family:'JetBrains Mono',monospace;font-size:9px;letter-spacing:.16em;color:#16744a;text-transform:uppercase}
    .brand b{color:#14200c;font-size:14px;letter-spacing:.02em;font-family:'Bricolage Grotesque',sans-serif}
    .ttl{flex:1 1 320px}
    .ttl h1{font-family:'Bricolage Grotesque',sans-serif;font-size:24px;letter-spacing:-.03em;margin:0;line-height:1.05}
    .meta{display:flex;flex-wrap:wrap;gap:4px 16px;font-family:'JetBrains Mono',monospace;font-size:9px;letter-spacing:.08em;text-transform:uppercase;color:#5a655e;margin-top:6px}
    .idline{display:flex;flex-wrap:wrap;gap:6px 12px;width:100%;font-family:'JetBrains Mono',monospace;font-size:9px;letter-spacing:.08em;text-transform:uppercase;color:#5a655e}
    .idline i{display:inline-block;width:100px;border-bottom:1px solid #cfd4cd;height:12px}
    h2{font-family:'Bricolage Grotesque',sans-serif;font-size:16px;letter-spacing:-.02em;margin:26px 0 8px;border-bottom:1px solid #d9ddd7;padding-bottom:5px}
    .note{font-size:12px;background:#f4f5f2;border-left:3px solid #16744a;padding:9px 12px;margin:14px 0}
    ol,ul{margin:0;padding-left:18px}
    li{margin:0 0 12px;break-inside:avoid}
    .q{display:flex;gap:8px;align-items:baseline}
    .q p{margin:0;flex:1;font-size:13.5px}
    .q small{font-family:'JetBrains Mono',monospace;font-size:9px;color:#5a655e;white-space:nowrap}
    .opts{display:grid;grid-template-columns:1fr 1fr;gap:2px 16px;margin:5px 0 0 20px;font-size:12.5px}
    .lines{height:26px;margin:8px 0 0 20px;background:repeating-linear-gradient(to bottom,transparent 0 24px,#d9ddd7 24px 25px)}
    .key{border-top:2px solid #14200c;margin-top:30px;padding-top:12px;break-before:page;page-break-before:always}
    .key li{font-size:12px}
    .foot{display:flex;justify-content:space-between;gap:12px;margin-top:28px;padding-top:8px;border-top:1px solid #d9ddd7;font-family:'JetBrains Mono',monospace;font-size:8.5px;letter-spacing:.08em;text-transform:uppercase;color:#5a655e}
    .grid2{display:grid;grid-template-columns:1fr 1fr;gap:18px}
    .plan-step{display:flex;gap:14px;border-bottom:1px solid #e8ebe5;padding:10px 0}
    .plan-step b{font-family:'JetBrains Mono',monospace;font-size:10px;color:#16744a;min-width:54px}
    .plan-step strong{display:block;font-size:13px}
    .plan-step p{font-size:12px;color:#5a655e;margin:3px 0 0}
    @media print{body{padding:0}.sheet{max-width:none}}
  `;

  function docShell(title, meta, body, note) {
    return `<!doctype html><html lang="pt"><head><meta charset="utf-8"><title>${esc(title)}</title>
      <style>${DOC_CSS}</style></head><body><div class="sheet">
      <div class="head"><div class="brand"><b>AMA</b><span>Aristides Miguel Academy</span><span>Universidade</span></div>
        <div class="ttl"><h1>${esc(title)}</h1><div class="meta">${meta}</div></div>
        <div class="idline"><span>Nome:</span><i></i><span>Turma:</span><i></i><span>Data:</span><i></i></div>
      </div>${body}
      <div class="foot"><span>${esc(note || 'Documento de apoio à aula — não é um exame oficial.')}</span><span>Gerado localmente · AMA</span></div>
      </div></body></html>`;
  }

  function abrirDoc(nome, html) {
    try {
      const w = window.open('', '_blank');
      if (w) { w.document.write(html); w.document.close(); setTimeout(() => { try { w.focus(); w.print(); } catch { } }, 450); return; }
    } catch { }
    descarregar(nome + '.html', html, 'text/html');
    toast('Janela bloqueada: o documento foi descarregado em HTML.');
  }
  function descarregar(nome, texto, mime) {
    try {
      const blob = new Blob([texto], { type: mime + ';charset=utf-8' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = nome;
      document.body.appendChild(a);
      a.click();
      setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 1200);
    } catch { toast('O navegador não permitiu a descarga.'); }
  }
  /* Uma sessão só pode virar prática se o sumário tiver texto suficiente: o
     motor devolve `insufficient` abaixo de ~120 caracteres e a UI diria
     "gerámos 0 cartões", o que é pior do que não oferecer o botão. */
  const textoPratica = (s) => [s.tema, s.resumo, ...(s.guiao || [])].filter(Boolean).join('. ');
  const assuntoDe = (dp) => (({ Tecnologia: 'programacao', Finanças: 'financas', Negócios: 'empreendedorismo' })[dp?.area] || 'geral');
  /* O Núcleo AMA vive em engine/*.js e é carregado como módulo,
     portanto pode chegar depois da interface. Toda a integração da Universidade
     espera por ele (no máximo 3 s) em vez de falhar com "sumário curto". */
  const motorPronto = () => !!(window.Study && window.AMAStudy);
  const esperarMotor = (ms = 3000) => new Promise((resolve) => {
    if (motorPronto()) return resolve(true);
    let fim = false;
    const pronto = (ok) => {
      if (fim) return; fim = true;
      window.removeEventListener('study-ready', aoPronto);
      clearTimeout(temporizador);
      resolve(ok);
    };
    const aoPronto = () => pronto(motorPronto());
    window.addEventListener('study-ready', aoPronto);
    var temporizador = setTimeout(() => pronto(motorPronto()), ms);
  });
  const seloMotor = () => motorPronto()
    ? '<span class="na-selo on"><i></i>Núcleo AMA ativo · processamento local</span>'
    : '<span class="na-selo"><i></i>Núcleo AMA a iniciar…</span>';
  /* O título é a chave: ingest() junta título e origem, e é por ele que a turma
     reconhece a ficha já gerada de uma sessão (e a regenera sem duplicar). */
  const tituloPratica = (t, s) => [s.tema, 'turma ' + t.codigo].join(' · ');
  const praticaDe = (t, s) => {
    try { return (window.AMAStudy && window.AMAStudy.kit(tituloPratica(t, s))) || null; } catch { return null; }
  };

  function analiseDe(t, s) {
    const S_ = window.Study;
    if (!S_) return null;
    return S_.analyzeSummary({ text: textoPratica(s), title: s.tema, subject: assuntoDe(disc(load(), t.disciplinaId)) });
  }

  /* =================================================== NÚCLEO AMA · LABORATÓRIO INTERATIVO */
  const PROG_KEY = 'ama-uni-prog-v1';
  function loadProg() {
    try {
      const r = JSON.parse(localStorage.getItem(PROG_KEY) || '{}');
      return {
        lessons: Array.isArray(r.lessons) ? r.lessons : [],
        shortcuts: Array.isArray(r.shortcuts) ? r.shortcuts : [],
        sims: Array.isArray(r.sims) ? r.sims : (Array.isArray(r.triangles) ? r.triangles : []),
      };
    } catch { return { lessons: [], shortcuts: [], sims: [] }; }
  }
  function saveProg(p) {
    try { localStorage.setItem(PROG_KEY, JSON.stringify({ lessons: p.lessons || [], shortcuts: p.shortcuts || [], sims: p.sims || [] })); } catch { }
  }
  function progPct() {
    const p = loadProg();
    const total = UNI_AREAS.length + UNI_SIMS.length + UNI_SHORTCUTS.length;
    const done = new Set(p.lessons).size + new Set(p.sims).size + new Set(p.shortcuts).size;
    return total ? Math.min(100, Math.round((done / total) * 100)) : 0;
  }
  function studySnapshot() {
    try {
      const raw = JSON.parse(localStorage.getItem('ama-study-v1') || '{}');
      const recs = Array.isArray(raw.recs) ? raw.recs : [];
      let totalCards = 0, mastered = 0;
      recs.forEach((r) => {
        const cards = (r.analysis && r.analysis.cards) || [];
        totalCards += cards.length;
        const states = (r.progress && r.progress.cards) || {};
        Object.values(states).forEach((st) => { if (st && st.interval >= 7) mastered += 1; });
      });
      return { recs: recs.length, cards: totalCards, mastered };
    } catch { return { recs: 0, cards: 0, mastered: 0 }; }
  }

  const fmtNum = (n, dec = 1) => {
    if (!Number.isFinite(n)) return '0';
    const r = Math.abs(n) >= 1000 ? Math.round(n) : Math.round(n * Math.pow(10, dec)) / Math.pow(10, dec);
    return r.toLocaleString('pt-PT', { maximumFractionDigits: dec });
  };

  const UNI_AREAS = [
    {
      id: 'mat', titulo: 'Matemática', sub: 'Progressões, crescimento e funções.', tag: '27 tópicos',
      img: 'media/nucleo-math-3d.jpg?v=71',
      svg: `<svg viewBox="0 0 220 84" fill="none" aria-hidden="true"><rect x="14" y="42" width="32" height="26" rx="7" fill="#eef5f0" stroke="#15704c" stroke-width="1.8"/><text x="30" y="59" text-anchor="middle" font-size="12" font-weight="700" fill="#124735">2</text><rect x="68" y="34" width="32" height="34" rx="7" fill="#eef5f0" stroke="#15704c" stroke-width="1.8"/><text x="84" y="56" text-anchor="middle" font-size="12" font-weight="700" fill="#124735">5</text><rect x="122" y="24" width="32" height="44" rx="7" fill="#cfe6d8" stroke="#124735" stroke-width="1.8"/><text x="138" y="51" text-anchor="middle" font-size="12" font-weight="700" fill="#124735">8</text><rect x="176" y="14" width="30" height="54" rx="7" fill="#124735"/><text x="191" y="45" text-anchor="middle" font-size="12" font-weight="700" fill="#d2ef8d">uₙ</text><path d="M30 34 Q57 12 84 26 M84 26 Q111 6 138 18" stroke="#2a8f5f" stroke-width="1.6" stroke-dasharray="3 3"/></svg>`,
      analogia: 'Pense numa escada onde cada degrau sobe exatamente a mesma altura: sabendo o primeiro degrau e o tamanho do passo, calcula a altura de qualquer degrau sem contar um a um.',
      formula: 'uₙ = u₁ + (n − 1) · r',
      sim: {
        label: 'Posição do termo (n)', unit: 'º termo', min: 1, max: 20, step: 1, val: 6,
        eval: (n) => {
          const u1 = 2, r = 3, res = u1 + (n - 1) * r;
          return {
            readout: `u${n} = ${res}`,
            expr: `2 + (${n} − 1) × 3 = ${res}`,
            note: `Sequência inicial: 2, 5, 8, 11… · salto constante r = +3`,
            pct: Math.round((n / 20) * 100),
          };
        },
      },
      resumo: 'Numa progressão aritmética, somamos sempre a mesma razão r a cada passo.',
      pergunta: 'Qual é o 6.º termo da sucessão 3, 7, 11, 15…?',
      opcoes: ['19', '23', '27'], certa: 1, exp: 'A razão é +4. Logo u₆ = 3 + 5×4 = 23.',
    },
    {
      id: 'fis', titulo: 'Física', sub: 'Movimento, gravidade e energia.', tag: '41 tópicos',
      img: 'media/nucleo-physics-3d.jpg?v=71',
      svg: `<svg viewBox="0 0 220 84" fill="none" aria-hidden="true"><line x1="18" y1="70" x2="202" y2="70" stroke="#7d867f" stroke-width="1.5" opacity=".45"/><path d="M24 68 Q110 -4 196 68" stroke="#15704c" stroke-width="2.2" stroke-dasharray="5 4"/><circle cx="110" cy="24" r="5.5" fill="#124735"/><circle cx="110" cy="24" r="9.5" stroke="#8fbf4a" stroke-width="1.5" opacity=".8"/><text x="110" y="13" text-anchor="middle" font-size="9.5" font-weight="700" fill="#124735">topo · v = 0</text></svg>`,
      analogia: 'Ao lançar uma bola para cima, a gravidade trava-a de forma constante até parar um instante no ponto mais alto — e depois acelera-a de volta ao chão.',
      formula: 'hₘáₓ = v₀² ÷ (2 · g)  ·  t = v₀ ÷ g',
      sim: {
        label: 'Velocidade inicial (v₀)', unit: ' m/s', min: 5, max: 40, step: 1, val: 20,
        eval: (v0) => {
          const g = 9.8, t = v0 / g, h = (v0 * v0) / (2 * g);
          return {
            readout: `${fmtNum(h, 1)} m de altura`,
            expr: `t = ${fmtNum(t, 2)} s até ao topo · g = 9,8 m/s²`,
            note: `Duplicar a velocidade quadruplica a altura máxima atingida.`,
            pct: Math.min(100, Math.round((h / 82) * 100)),
          };
        },
      },
      resumo: 'No topo de um lançamento vertical, a velocidade vertical anula-se e toda a energia cinética virou potencial.',
      pergunta: 'Um corpo parte do repouso com aceleração constante de 3 m/s². Qual a velocidade após 4 s?',
      opcoes: ['7 m/s', '12 m/s', '16 m/s'], certa: 1, exp: 'v = v₀ + a·t = 0 + 3 × 4 = 12 m/s.',
    },
    {
      id: 'alga', titulo: 'Álgebra Linear', sub: 'Coordenadas, vectores e normas.', tag: '38 tópicos',
      img: 'media/nucleo-3d-hero.jpg?v=71',
      svg: `<svg viewBox="0 0 220 84" fill="none" aria-hidden="true"><path d="M40 70 H190 M40 70 V14" stroke="#7d867f" stroke-width="1.6" opacity=".6"/><path d="M40 34 H134 V70" stroke="#2a8f5f" stroke-width="1.5" stroke-dasharray="4 3"/><line x1="40" y1="70" x2="134" y2="34" stroke="#124735" stroke-width="2.2"/><circle cx="134" cy="34" r="5" fill="#15704c"/><text x="145" y="32" font-size="10.5" font-weight="700" fill="#124735">v(x, y)</text></svg>`,
      analogia: 'Dar coordenadas P(x, y) é como dar direcções em Luanda: «ande x quarteirões para leste e y para norte». O módulo é a distância em linha recta.',
      formula: '|v| = √(x² + y²)',
      sim: {
        label: 'Componente horizontal (x) · com y = 4', unit: ' u', min: 0, max: 12, step: 1, val: 3,
        eval: (x) => {
          const y = 4, mod = Math.hypot(x, y), ang = Math.round(Math.atan2(y, x) * (180 / Math.PI));
          return {
            readout: `|v| = ${fmtNum(mod, 2)}`,
            expr: `√(${x}² + 4²) = √${x * x + 16} · ângulo ${ang}°`,
            note: x === 3 ? 'Triângulo pitagórico clássico 3–4–5.' : `Para v = (${x}, 4), a norma cresce com a distância à origem.`,
            pct: Math.min(100, Math.round((mod / 13) * 100)),
          };
        },
      },
      resumo: 'Cada ponto no plano é um par único (x, y); o teorema de Pitágoras dá o comprimento exato do vector.',
      pergunta: 'Qual é o determinante da matriz 2×2 [[4, 2], [1, 3]]?',
      opcoes: ['10', '14', '6'], certa: 0, exp: 'det = (4 × 3) − (2 × 1) = 12 − 2 = 10.',
    },
    {
      id: 'prog', titulo: 'Programação & Algoritmos', sub: 'Decomposição, ciclos e eficiência.', tag: 'PROG102B',
      img: 'media/nucleo-code-fin-3d.jpg?v=71',
      svg: `<svg viewBox="0 0 220 84" fill="none" aria-hidden="true"><rect x="14" y="24" width="52" height="24" rx="6" fill="#eef5f0" stroke="#15704c" stroke-width="1.6"/><text x="40" y="40" text-anchor="middle" font-size="10" font-weight="700" fill="#124735">dados</text><path d="M66 36 H92" stroke="#15704c" stroke-width="1.8"/><polygon points="116,16 142,36 116,56 90,36" fill="#fff" stroke="#124735" stroke-width="1.8"/><text x="116" y="39" text-anchor="middle" font-size="9.5" font-weight="700" fill="#124735">meio?</text><path d="M142 36 H166" stroke="#15704c" stroke-width="1.8"/><rect x="166" y="24" width="42" height="24" rx="6" fill="#124735"/><text x="187" y="40" text-anchor="middle" font-size="9.5" font-weight="700" fill="#d2ef8d">O(log n)</text></svg>`,
      analogia: 'Procurar um nome numa lista ordenada abrindo sempre ao meio elimina metade das hipóteses a cada passo — como procurar uma palavra num dicionário.',
      formula: 'passos ≈ ⌈log₂(n)⌉  vs  pesquisa linear (n)',
      sim: {
        label: 'Tamanho da lista ordenada (n)', unit: ' registos', min: 16, max: 1024, step: 16, val: 256,
        eval: (n) => {
          const steps = Math.ceil(Math.log2(n));
          const ratio = Math.round(n / steps);
          return {
            readout: `${steps} comparações`,
            expr: `Pesquisa binária: ${steps} passos · Linear: até ${n} passos`,
            note: `Cerca de ${ratio}× mais rápida no pior caso do que percorrer item a item.`,
            pct: Math.min(100, Math.round((steps / 10) * 100)),
          };
        },
      },
      resumo: 'Escolher o algoritmo certo importa mais do que escrever código depressa: O(log₂ n) escala sem esforço.',
      pergunta: 'O que devolve len([10, 20, 30, 40]) em Python?',
      opcoes: ['3', '4', '40'], certa: 1, exp: 'A lista tem 4 elementos, portanto len() devolve 4.',
    },
    {
      id: 'fin', titulo: 'Finanças & Kwanzas', sub: 'Juro composto, inflação e reserva.', tag: 'FIN110A',
      img: 'media/nucleo-code-fin-3d.jpg?v=71',
      svg: `<svg viewBox="0 0 220 84" fill="none" aria-hidden="true"><rect x="24" y="54" width="22" height="16" rx="4" fill="#cfd4cd"/><rect x="58" y="44" width="22" height="26" rx="4" fill="#a8b0a9"/><rect x="92" y="32" width="22" height="38" rx="4" fill="#2a8f5f"/><rect x="126" y="16" width="22" height="54" rx="4" fill="#124735"/><path d="M34 48 Q94 34 156 12" stroke="#15704c" stroke-width="2" stroke-linecap="round"/><text x="176" y="22" font-size="10.5" font-weight="700" fill="#124735">+Kz</text></svg>`,
      analogia: 'O juro composto funciona como uma bola de neve: cada ano rende juros sobre o capital inicial e também sobre os juros acumulados antes.',
      formula: 'M = C · (1 + i)ⁿ',
      sim: {
        label: 'Horizonte temporal (n) · 100.000 Kz a 12%/ano', unit: ' anos', min: 1, max: 15, step: 1, val: 5,
        eval: (anos) => {
          const cap = 100000, m = Math.round(cap * Math.pow(1.12, anos)), lucro = m - cap;
          return {
            readout: `${m.toLocaleString('pt-PT')} Kz`,
            expr: `Capital: 100.000 Kz + Juros acumulados: ${lucro.toLocaleString('pt-PT')} Kz`,
            note: `Compare sempre com a inflação anual para saber o ganho real de poder de compra.`,
            pct: Math.min(100, Math.round((m / 550000) * 100)),
          };
        },
      },
      resumo: 'O tempo amplifica o juro composto; comece cedo e compare sempre a taxa nominal com a inflação.',
      pergunta: 'Com orçamento 50/30/20 sobre 200.000 Kz, quanto vai para poupança/reserva (20%)?',
      opcoes: ['20.000 Kz', '40.000 Kz', '60.000 Kz'], certa: 1, exp: '20% de 200.000 Kz = 0,20 × 200.000 = 40.000 Kz.',
    },
    {
      id: 'com', titulo: 'Comunicação & Negócios', sub: 'Oratória, crise e funil de vendas.', tag: 'COM201A · MKT205A',
      img: 'media/nucleo-math-3d.jpg?v=71',
      svg: `<svg viewBox="0 0 220 84" fill="none" aria-hidden="true"><polygon points="24,18 196,18 164,42 56,42" fill="#eef5f0" stroke="#15704c" stroke-width="1.6"/><polygon points="56,42 164,42 138,66 82,66" fill="#cfe6d8" stroke="#124735" stroke-width="1.6"/><text x="110" y="34" text-anchor="middle" font-size="9.5" font-weight="700" fill="#124735">Alcance · Interesse</text><text x="110" y="58" text-anchor="middle" font-size="9.5" font-weight="700" fill="#124735">Decisão</text></svg>`,
      analogia: 'Um funil comercial saudável mede quantas conversas claras viram clientes reais — melhorar a clareza da proposta multiplica vendas sem gastar mais em anúncios.',
      formula: 'Vendas = Visitas × Taxa de Conversão',
      sim: {
        label: 'Taxa de conversão · sobre 1.000 visitas', unit: '%', min: 1, max: 15, step: 1, val: 4,
        eval: (taxaPct) => {
          const visitas = 1000, vendas = Math.round(visitas * (taxaPct / 100));
          const receita = vendas * 25000;
          return {
            readout: `${vendas} clientes`,
            expr: `${taxaPct}% × 1.000 visitas · ticket médio 25.000 Kz = ${receita.toLocaleString('pt-PT')} Kz`,
            note: `Subir a clareza da oferta de 2% para 4% duplica o resultado com o mesmo tráfego.`,
            pct: Math.min(100, Math.round((taxaPct / 15) * 100)),
          };
        },
      },
      resumo: 'Em comunicação e vendas, clareza na promessa e um próximo passo óbvio convertem mais do que volume.',
      pergunta: 'Num comunicado de crise eficaz, qual deve ser a primeira regra nos primeiros 60 minutos?',
      opcoes: ['Esperar uma semana em silêncio', 'Confirmar os factos conhecidos e o próximo horário de atualização', 'Culpar terceiros sem dados'], certa: 1, exp: 'Silêncio gera rumor; transparência rápida constrói confiança.',
    },
  ];

  /* Simuladores de Grandezas: bancada interativa com isolamento de variável + 2 sliders reais */
  const UNI_SIMS = [
    {
      id: 'sim-vel', area: 'Física', titulo: 'Movimento Uniforme',
      vars: {
        a: { sym: 'd', name: 'Distância', unit: 'm', min: 50, max: 2000, step: 50, def: 600 },
        b: { sym: 'v', name: 'Velocidade', unit: 'm/s', min: 2, max: 50, step: 1, def: 20 },
        c: { sym: 't', name: 'Tempo', unit: 's', min: 2, max: 120, step: 2, def: 30 },
      },
      note: 'Relação directa entre espaço percorrido, velocidade constante e tempo.',
    },
    {
      id: 'sim-new', area: 'Física', titulo: '2.ª Lei de Newton',
      vars: {
        a: { sym: 'F', name: 'Força', unit: 'N', min: 5, max: 500, step: 5, def: 40 },
        b: { sym: 'm', name: 'Massa', unit: 'kg', min: 1, max: 80, step: 1, def: 10 },
        c: { sym: 'a', name: 'Aceleração', unit: 'm/s²', min: 1, max: 20, step: 0.5, def: 4 },
      },
      note: 'Mais massa exige maior força resultante para atingir a mesma aceleração.',
    },
    {
      id: 'sim-ohm', area: 'Física', titulo: 'Lei de Ohm',
      vars: {
        a: { sym: 'V', name: 'Tensão', unit: 'V', min: 1, max: 240, step: 1, def: 12 },
        b: { sym: 'I', name: 'Corrente', unit: 'A', min: 0.5, max: 20, step: 0.5, def: 2 },
        c: { sym: 'R', name: 'Resistência', unit: 'Ω', min: 1, max: 100, step: 1, def: 6 },
      },
      note: 'Num condutor óhmico, tensão, corrente e resistência equilibram-se linearmente.',
    },
    {
      id: 'sim-ond', area: 'Física', titulo: 'Propagação de Ondas',
      vars: {
        a: { sym: 'v', name: 'Velocidade', unit: 'm/s', min: 2, max: 400, step: 2, def: 20 },
        b: { sym: 'λ', name: 'Comp. de onda', unit: 'm', min: 0.5, max: 20, step: 0.5, def: 2 },
        c: { sym: 'f', name: 'Frequência', unit: 'Hz', min: 1, max: 60, step: 1, def: 10 },
      },
      note: 'À mesma velocidade do meio, frequências mais altas têm comprimentos de onda mais curtos.',
    },
    {
      id: 'sim-den', area: 'Química', titulo: 'Densidade',
      vars: {
        a: { sym: 'm', name: 'Massa', unit: 'g', min: 20, max: 2000, step: 20, def: 250 },
        b: { sym: 'ρ', name: 'Densidade', unit: 'g/cm³', min: 0.5, max: 12, step: 0.5, def: 1 },
        c: { sym: 'V', name: 'Volume', unit: 'cm³', min: 10, max: 1000, step: 10, def: 250 },
      },
      note: 'Água pura tem ρ ≈ 1 g/cm³: corpos mais densos afundam, menos densos flutuam.',
    },
    {
      id: 'sim-pot', area: 'Física', titulo: 'Potência Mecânica',
      vars: {
        a: { sym: 'W', name: 'Trabalho', unit: 'J', min: 100, max: 20000, step: 100, def: 5000 },
        b: { sym: 'P', name: 'Potência', unit: 'W', min: 50, max: 2000, step: 50, def: 500 },
        c: { sym: 't', name: 'Tempo', unit: 's', min: 1, max: 60, step: 1, def: 10 },
      },
      note: 'Potência mede a rapidez com que um motor ou sistema realiza trabalho.',
    },
    {
      id: 'sim-jur', area: 'Finanças', titulo: 'Juro Simples Anual',
      vars: {
        a: { sym: 'J', name: 'Juro', unit: 'Kz', min: 5000, max: 300000, step: 5000, def: 18000 },
        b: { sym: 'C', name: 'Capital', unit: 'Kz', min: 20000, max: 500000, step: 10000, def: 150000 },
        c: { sym: 'i', name: 'Taxa anual', unit: '%', min: 2, max: 30, step: 1, def: 12 },
      },
      isPercentC: true,
      note: 'Calcula rapidamente o juro anual em kwanzas para poupanças ou crédito simples.',
    },
    {
      id: 'sim-area', area: 'Matemática', titulo: 'Área do Rectângulo',
      vars: {
        a: { sym: 'A', name: 'Área', unit: 'm²', min: 4, max: 400, step: 2, def: 40 },
        b: { sym: 'b', name: 'Base', unit: 'm', min: 1, max: 30, step: 1, def: 8 },
        c: { sym: 'h', name: 'Altura', unit: 'm', min: 1, max: 20, step: 1, def: 5 },
      },
      note: 'Útil para estimar espaço de salas, terrenos ou orçamento de revestimento.',
    },
  ];

  const UNI_SHORTCUTS = [
    { id: 'sc-1', area: 'Matemática & Física', tipo: 'Mnemónica', titulo: 'SOH · CAH · TOA', expr: 'sen = O/H · cos = A/H · tan = O/A', dica: 'Oposto, Adjacente e Hipotenusa num triângulo rectângulo — nunca mais troque seno e cosseno.' },
    { id: 'sc-2', area: 'Matemática & Física', tipo: 'Truque', titulo: 'km/h ↔ m/s em 1 passo', expr: '÷ 3,6  ou  × 3,6', dica: '72 km/h ÷ 3,6 = 20 m/s. Multiplique por 3,6 para voltar a km/h.' },
    { id: 'sc-3', area: 'Matemática & Física', tipo: 'Fórmula', titulo: 'Determinante 2×2 em cruz', expr: 'ad − bc', dica: 'Multiplique a diagonal principal e subtraia a diagonal secundária.' },
    { id: 'sc-4', area: 'Matemática & Física', tipo: 'Truque', titulo: 'Soma de 1 até n (Gauss)', expr: 'S = n · (n + 1) / 2', dica: 'Somar 1+2+…+100 = 100×101/2 = 5.050 em três segundos.' },
    { id: 'sc-5', area: 'Programação', tipo: 'Mnemónica', titulo: 'Regra DRY em funções', expr: 'Don’t Repeat Yourself', dica: 'Se copiou o mesmo bloco de código 2 vezes, extraia-o para uma função com nome claro.' },
    { id: 'sc-6', area: 'Programação', tipo: 'Truque', titulo: 'Troca de variáveis em Python', expr: 'a, b = b, a', dica: 'Sem variável temporária: o Python desempacota o tuplo numa só linha.' },
    { id: 'sc-7', area: 'Programação', tipo: 'Fórmula', titulo: 'Complexidade de pesquisa binária', expr: 'O(log₂ n)', dica: 'Numa lista ordenada de 1.000 nomes, encontra qualquer um em no máximo 10 comparações.' },
    { id: 'sc-8', area: 'Finanças', tipo: 'Truque', titulo: 'Regra dos 72 (dobrar capital)', expr: 'Anos ≈ 72 ÷ taxa (%)', dica: 'A 12% ao ano, o capital duplica em aproximadamente 72 ÷ 12 = 6 anos.' },
    { id: 'sc-9', area: 'Finanças', tipo: 'Fórmula', titulo: 'Orçamento 50 / 30 / 20', expr: '50% Essenciais · 30% Desejos · 20% Futuro', dica: 'Separe os 20% no dia em que o salário cai — não no fim do mês.' },
    { id: 'sc-10', area: 'Finanças', tipo: 'Mnemónica', titulo: 'Fundo de Emergência (3–6M)', expr: 'Despesa mensal fixa × 6', dica: 'Deve ficar em liquidez imediata, nunca preso em ativos voláteis.' },
    { id: 'sc-11', area: 'Comunicação & Negócios', tipo: 'Mnemónica', titulo: 'Regra 5W no comunicado', expr: 'Quem · O quê · Quando · Onde · Próximo passo', dica: 'Se um comunicado responde aos 5 pontos no 1.º parágrafo, evita 90% das dúvidas.' },
    { id: 'sc-12', area: 'Comunicação & Negócios', tipo: 'Truque', titulo: 'SPIN Selling em vendas B2B', expr: 'Situação → Problema → Implicação → Necessidade', dica: 'Faça o cliente sentir o custo do problema antes de apresentar o seu preço.' },
  ];

  function simState(sim) {
    if (!U.eqState[sim.id]) {
      U.eqState[sim.id] = { target: 'a', a: sim.vars.a.def, b: sim.vars.b.def, c: sim.vars.c.def };
    }
    return U.eqState[sim.id];
  }

  function simCompute(sim, st) {
    const { a, b, c } = sim.vars;
    const factor = sim.isPercentC ? 0.01 : 1;
    let value = 0, expr = '', inputs = [];
    if (st.target === 'a') {
      value = st.b * (st.c * factor);
      expr = sim.isPercentC ? `${a.sym} = ${b.sym} × (${c.sym} ÷ 100)` : `${a.sym} = ${b.sym} × ${c.sym}`;
      inputs = ['b', 'c'];
    } else if (st.target === 'b') {
      value = st.a / Math.max(0.0001, st.c * factor);
      expr = sim.isPercentC ? `${b.sym} = ${a.sym} ÷ (${c.sym} ÷ 100)` : `${b.sym} = ${a.sym} ÷ ${c.sym}`;
      inputs = ['a', 'c'];
    } else {
      value = (st.a / Math.max(0.0001, st.b)) / factor;
      expr = sim.isPercentC ? `${c.sym} = (${a.sym} ÷ ${b.sym}) × 100` : `${c.sym} = ${a.sym} ÷ ${b.sym}`;
      inputs = ['a', 'b'];
    }
    const tv = sim.vars[st.target];
    const pct = Math.max(6, Math.min(100, Math.round((value / Math.max(1, tv.max)) * 100)));
    return { value, expr, inputs, targetVar: tv, pct };
  }

  function eqCardHTML(sim) {
    const st = simState(sim);
    const res = simCompute(sim, st);
    const explored = loadProg().sims.includes(sim.id);
    const keys = ['a', 'b', 'c'];
    return `<article class="eq-card ${explored ? 'done' : ''}" data-eq="${sim.id}">
      <div class="eq-head">
        <span class="eq-meta">${esc(sim.area)}${explored ? ' · Explorado' : ''}</span>
        <span class="eq-formula-tag">${esc(res.expr)}</span>
      </div>
      <h4>${esc(sim.titulo)}</h4>
      <div class="eq-seg" role="group" aria-label="Escolher grandeza a calcular em ${escAttr(sim.titulo)}">
        ${keys.map((k) => {
          const v = sim.vars[k];
          return `<button type="button" class="${st.target === k ? 'on' : ''}" onclick="UNI.eqPick('${sim.id}','${k}')"><b>${esc(v.sym)}</b><span>${esc(v.name)}</span></button>`;
        }).join('')}
      </div>
      <div class="eq-sliders">
        ${res.inputs.map((k) => {
          const v = sim.vars[k];
          return `<label class="eq-slider-row">
            <span><b>${esc(v.name)} (${esc(v.sym)})</b><em data-eq-val="${k}">${fmtNum(st[k], v.step < 1 ? 1 : 0)} ${esc(v.unit)}</em></span>
            <input type="range" min="${v.min}" max="${v.max}" step="${v.step}" value="${st[k]}" oninput="UNI.eqSlide('${sim.id}','${k}',this.value)">
          </label>`;
        }).join('')}
      </div>
      <div class="eq-readout">
        <div class="eq-out-top">
          <span>${esc(res.targetVar.name)} calculada</span>
          <strong class="eq-num">${fmtNum(res.value, res.value >= 100 ? 0 : 2)} <small>${esc(res.targetVar.unit)}</small></strong>
        </div>
        <div class="eq-meter" aria-hidden="true"><i style="width:${res.pct}%"></i></div>
        <p class="eq-note">${esc(sim.note)}</p>
      </div>
    </article>`;
  }

  function ruleDrillHTML(list) {
    if (!list.length) return '<div class="card empty"><h3>Sem regras neste filtro</h3><p>Altere o filtro acima para iniciar o desafio.</p></div>';
    if (!U.drill || U.drill.idx >= list.length) {
      if (U.drill && U.drill.done > 0) {
        return `<div class="card drill-stage">
          <span class="eyebrow-t">DESAFIO CONCLUÍDO</span>
          <h3>Acertou ${U.drill.score} de ${U.drill.done} regras</h3>
          <p class="muted">As regras certas foram marcadas no seu mapa de domínio local.</p>
          <div class="flex" style="gap:8px;justify-content:center;margin-top:14px">
            <button type="button" class="btn btn-p btn-sm" onclick="UNI.drillStart()">Repetir desafio</button>
            <button type="button" class="btn btn-o btn-sm" onclick="UNI.toggleDrill(false)">Voltar ao caderno</button>
          </div>
        </div>`;
      }
      U.drill = { idx: 0, score: 0, done: 0, answered: false, pick: -1, opts: null };
    }
    const item = list[U.drill.idx];
    if (!U.drill.opts) {
      const others = UNI_SHORTCUTS.filter((x) => x.id !== item.id).sort((a, b) => (a.id.charCodeAt(3) % 7) - (b.id.charCodeAt(3) % 7)).slice(0, 2);
      const opts = [item, ...others].sort((a, b) => a.expr.localeCompare(b.expr));
      U.drill.opts = opts;
    }
    return `<div class="card drill-stage">
      <div class="drill-top">
        <span>Pergunta ${U.drill.idx + 1} de ${list.length} · ${esc(item.area)}</span>
        <strong>${U.drill.score} certas</strong>
      </div>
      <h3>Qual expressão corresponde a «${esc(item.titulo)}»?</h3>
      <p class="drill-hint">${esc(item.dica)}</p>
      <div class="drill-opts">
        ${U.drill.opts.map((o, i) => {
          const isRight = o.id === item.id;
          let cls = '';
          if (U.drill.answered) {
            if (isRight) cls = 'ok';
            else if (i === U.drill.pick) cls = 'bad';
          }
          return `<button type="button" class="${cls}" ${U.drill.answered ? 'disabled' : ''} onclick="UNI.drillPick(${i},'${item.id}')">${esc(o.expr)}</button>`;
        }).join('')}
      </div>
      ${U.drill.answered ? `<div class="drill-foot">
        <button type="button" class="btn btn-p btn-sm" onclick="UNI.drillNext()">${U.drill.idx + 1 < list.length ? 'Próxima regra' : 'Ver resultado'} ${I.arrow}</button>
      </div>` : ''}
    </div>`;
  }

  function uniDockHTML(active) {
    const items = [
      ['universidade', 'home', 'Início', '#/universidade'],
      ['ferramentas', 'spark', 'Laboratório', '#/universidade/ferramentas'],
      ['quiz', 'quiz', 'Modo Quiz', '#/quiz'],
      ['projetor', 'play', 'Projetor', '#/projetor'],
      ['estudar', 'book', 'Estudar', '#/estudar'],
    ];
    return `<nav class="uni-float-dock" id="uni-float-dock" aria-label="Navegação rápida da Universidade">
      ${items.map(([k, ic, lbl, href]) => `<a class="ufd-item ${active === k ? 'on' : ''}" href="${href}">${I[ic] || I.spark}<span>${lbl}</span></a>`).join('')}
      <button type="button" class="ufd-item" onclick="UNI.openSearch()" title="Pesquisar na Universidade (Ctrl+K)">${I.search}<span>Buscar</span></button>
    </nav>`;
  }

  /* =============================================================== VISTAS */
  on('/universidade', async () => {
    const d = load();
    const totalProvas = d.turmas.reduce((n, t) => n + (t.avaliacoes || []).length, 0);
    const totalMats = d.turmas.reduce((n, t) => n + publicadas(t).length, 0);
    const dest = S.user ? '#/turmas' : '#/registo';
    const pct = progPct();
    const prog = loadProg();
    return shellPublic(`
    <section class="uni-hero hub-hero">
      <div class="in">
        <div class="hub-copy">
          <span class="kicker">UNIVERSIDADE · NÚCLEO AMA</span>
          <h1>A sua escola.<br><em class="hl">As suas turmas.</em><span class="title-dot">.</span></h1>
          <span class="trust-badge"><i></i>Sem servidor · turmas, simulações e estudo ficam neste navegador</span>
          <p>Simuladores manipuláveis, mapa do programa, horário semanal e turmas ligadas ao Núcleo AMA — tudo num só espaço de aprendizagem ativa.</p>
          <div class="cta" style="display:flex;gap:10px;flex-wrap:wrap">
            <a class="btn btn-f btn-lg" href="#/quiz">${I.quiz} Modo Quiz Interativo</a>
            <a class="btn btn-o btn-ghost-d btn-lg" href="#/projetor">${I.play} Projetor PDF → Slides</a>
            <a class="btn btn-o btn-ghost-d btn-lg" href="${dest}">Turmas ${I.arrow}</a>
          </div>
        </div>
        <figure class="hub-art hub-art-3d"><img src="media/nucleo-3d-hero.jpg?v=71" alt="Escultura 3D do Núcleo AMA representando disciplinas interligadas" loading="eager" decoding="async"><figcaption>Núcleo AMA · visualização 3D, simuladores e estudo ativo.</figcaption></figure>
        <div class="uni-facts">
          <div><b data-count="${(d.escolas || []).length}">${(d.escolas || []).length}</b><span>escolas</span></div>
          <div><b data-count="${d.turmas.length}">${d.turmas.length}</b><span>turmas ativas</span></div>
          <div><b data-count="${totalMats}">${totalMats}</b><span>matérias publicadas</span></div>
          <div><b data-count="${totalProvas}">${totalProvas}</b><span>provas no calendário</span></div>
        </div>
      </div>
    </section>

    <section class="uni-section uni-util-wrap">
      <div class="uni-util-bar">
        <div class="uni-util-sem">
          <strong>2026/2027</strong>
          <span class="uni-sem-meta">I Semestre · ${(d.escolas || []).length} escolas · ${d.turmas.length} turmas</span>
        </div>
        <div class="uni-util-acts">
          <button type="button" class="uni-pill-btn u-blue" onclick="UNI.openHorario()">${I.calendar} Horário semanal</button>
          <button type="button" class="uni-pill-btn u-coral" onclick="UNI.openProvas()">${I.doc} Provas <b class="u-cnt">${totalProvas}</b></button>
          <button type="button" class="uni-pill-btn u-violet" onclick="UNI.openSearch()">${I.search} Pesquisar <kbd>Ctrl K</kbd></button>
          <a class="uni-prog-pill" href="#/universidade/ferramentas" title="O seu domínio no Núcleo AMA neste dispositivo">
            <span class="upp-ring" style="--p:${pct}">${pct}%</span>
            <span>Domínio</span>
          </a>
        </div>
      </div>
    </section>

    <section class="uni-section" data-testid="nucleo-3d-section">
      <div class="uni-sec-row">
        <div>
          <span class="eyebrow-t">${I.spark} NÚCLEO AMA · LABORATÓRIO ESPACIAL 3D</span>
          <h2 class="section-title" style="margin:8px 0 0">Explore o conhecimento <span class="hl">em 3D.</span></h2>
          <p class="uni-sec-sub">Arraste para rodar o modelo em perspetiva, abra a vista explodida ou toque num nó orbital para inspecionar a disciplina e iniciar a prática.</p>
        </div>
        <div class="flex wrap" style="gap:8px">
          <a class="btn btn-f btn-sm" href="#/quiz">${I.quiz} Abrir Modo Quiz</a>
          <a class="btn btn-o btn-sm" href="#/projetor">${I.play} Projetor de Aulas</a>
        </div>
      </div>
      <div class="n3d-shell">
        <div class="n3d-viewport">
          <canvas id="nucleo-3d-canvas" data-testid="nucleo-3d-canvas" aria-label="Palco 3D interativo do Núcleo AMA"></canvas>
          <div class="n3d-top-hint">Arraste para rodar · Clique num nó orbital</div>
          <div class="n3d-dock" role="toolbar" aria-label="Controlos do palco 3D">
            <div class="n3d-dock-group" role="group" aria-label="Modelo 3D">
              <button type="button" class="n3d-btn on" data-n3d-mode="core" onclick="UNI.set3DMode('core')">Núcleo 3D</button>
              <button type="button" class="n3d-btn" data-n3d-mode="wave" onclick="UNI.set3DMode('wave')">Onda f(x)</button>
              <button type="button" class="n3d-btn" data-n3d-mode="gyro" onclick="UNI.set3DMode('gyro')">Giroscópio</button>
              <button type="button" class="n3d-btn" data-n3d-mode="matrix" onclick="UNI.set3DMode('matrix')">Matriz Kz</button>
            </div>
            <label class="n3d-slider-wrap">
              <span>Explodir</span>
              <input type="range" min="0" max="100" value="0" aria-label="Vista explodida 3D" oninput="UNI.set3DExplode(this.value)">
            </label>
            <div class="n3d-dock-group" role="group" aria-label="Ângulos de câmara">
              <button type="button" class="n3d-btn" onclick="UNI.set3DPreset('iso')">Iso</button>
              <button type="button" class="n3d-btn" onclick="UNI.set3DPreset('front')">Frontal</button>
              <button type="button" class="n3d-btn" onclick="UNI.set3DPreset('top')">Topo</button>
              <button type="button" class="n3d-btn on" id="n3d-spin-btn" onclick="UNI.toggle3DSpin()">Girar</button>
            </div>
          </div>
        </div>
        <aside class="n3d-inspector" id="n3d-inspector" data-testid="nucleo-3d-inspector">
          <span class="eyebrow-t">NÓ SELECIONADO</span>
          <h3>Núcleo Poliédrico AMA</h3>
          <p>6 disciplinas interligadas: Matemática, Física, Álgebra, Programação, Finanças e Oratória. Toque num nó no ecrã 3D ou escolha abaixo:</p>
          <div class="n3d-node-picks">
            ${UNI_AREAS.map((a) => `<button type="button" onclick="UNI.focus3DNode('${a.id}')">${esc(a.titulo)}</button>`).join('')}
          </div>
          <div class="n3d-insp-visual">
            <img src="media/nucleo-math-3d.jpg?v=71" alt="Estudo visual 3D do Núcleo AMA" loading="lazy" decoding="async">
          </div>
          <div class="n3d-insp-foot">
            <button type="button" class="btn btn-p btn-sm" onclick="UNI.openArea('mat')">Abrir Simulador</button>
            <a class="btn btn-o btn-sm" href="#/quiz">Quiz da Área</a>
          </div>
        </aside>
      </div>
    </section>

    <section class="uni-section">
      <div class="uni-sec-row">
        <div>
          <span class="eyebrow-t">${I.spark} NÚCLEO AMA · EXPLORADOR VISUAL DE CONCEITOS</span>
          <h2 class="section-title" style="margin:8px 0 0">Teste a intuição <span class="hl">antes da fórmula.</span></h2>
          <p class="uni-sec-sub">Abra uma disciplina para manipular variáveis em tempo real, ver o efeito nos números e validar num desafio rápido.</p>
        </div>
        <a class="btn btn-o btn-sm" href="#/universidade/ferramentas">Abrir laboratório completo ${I.arrow}</a>
      </div>
      <div class="na-concept-grid">
        ${UNI_AREAS.map((a) => {
          const done = prog.lessons.includes(a.id);
          return `<button type="button" class="na-concept-card na-concept-3d ${done ? 'done' : ''}" onclick="UNI.openArea('${a.id}')">
            <div class="nac-visual-wrap">
              <img class="nac-3d-img" src="${escAttr(a.img || 'media/nucleo-3d-hero.jpg?v=71')}" alt="${escAttr(a.titulo)}" loading="lazy" decoding="async">
              <div class="nac-svg-chip">${a.svg}</div>
            </div>
            <div class="nac-body">
              <div class="nac-meta">${esc(a.tag)}${done ? ' · <b>Concluído</b>' : ' · Simulador 3D &amp; Fórmula'}</div>
              <h3>${esc(a.titulo)}</h3>
              <p>${esc(a.sub)}</p>
            </div>
            <span class="nac-go" aria-hidden="true">${I.arrow}</span>
          </button>`;
        }).join('')}
      </div>
    </section>

    <section class="uni-section">
      <div class="uni-sec-row">
        <div>
          <span class="eyebrow-t">${I.grad} MAPA DO PROGRAMA</span>
          <h2 class="section-title" style="margin:8px 0 0">Turmas e <span class="hl">materiais de origem.</span></h2>
          <p class="uni-sec-sub">Explore cada disciplina do semestre, veja o horário, a sala e abra os materiais diretamente no estúdio de estudo.</p>
        </div>
        <div class="flex" style="gap:8px;flex-wrap:wrap">
          <a class="btn btn-o btn-sm" href="${S.user ? '#/escolas' : '#/entrar'}">${I.home} Ver escolas</a>
          <a class="btn btn-p btn-sm" href="${dest}">Gerir turmas ${I.arrow}</a>
        </div>
      </div>
      <div class="prog-map-grid">
        ${d.turmas.map((t) => {
          const dp = disc(d, t.disciplinaId);
          const escObj = escola(d, t.escolaId);
          const mats = publicadas(t);
          const nextAv = (t.avaliacoes || []).slice().sort((a, b) => a.data.localeCompare(b.data))[0];
          return `<article class="pm-card">
            <div class="pm-head">
              <span class="pm-code">${esc(t.codigo)}</span>
              <span class="pm-escola">${esc(escObj.sigla)} · ${t.ano}.º ano · ${dp.ects} ECTS</span>
            </div>
            <h3>${esc(dp.nome)}</h3>
            <p class="pm-meta">${I.clock} ${esc(t.horario)} · ${esc(t.sala)}</p>
            <p class="pm-doc">${I.users} ${esc(t.docenteNome)} · ${t.sessoes.length} sessões · ${mats.length} matérias</p>
            <div class="pm-mats">
              ${mats.slice(0, 2).map((m) => `<button type="button" class="pm-mat-chip" onclick="UNI.estudarMaterial('${t.id}','${m.id}')">${I.doc}<span>${esc(m.titulo)}</span><em>Estudar</em></button>`).join('')}
            </div>
            <div class="pm-foot">
              <span class="pm-next">${nextAv ? `Próx. prova: ${fmtDia(nextAv.data)}` : 'Sem provas agendadas'}</span>
              <a class="btn btn-o btn-sm" href="${S.user ? '#/turma/' + t.id : '#/entrar'}">Abrir turma ${I.arrow}</a>
            </div>
          </article>`;
        }).join('')}
      </div>
    </section>

    <section class="uni-section">
      <div class="uni-sec-row">
        <div>
          <span class="eyebrow-t">${I.spark} BANCADA DE EQUAÇÕES</span>
          <h2 class="section-title" style="margin:8px 0 0">Simulador de <span class="hl">grandezas.</span></h2>
          <p class="uni-sec-sub">Escolha qual grandeza quer isolar e deslize os valores conhecidos: o resultado e a barra de escala atualizam no instante.</p>
        </div>
        <a class="btn btn-f btn-sm" href="#/universidade/ferramentas">Abrir os ${UNI_SIMS.length} simuladores e ${UNI_SHORTCUTS.length} regras ${I.arrow}</a>
      </div>
      <div class="eq-solver-grid">
        ${UNI_SIMS.slice(0, 3).map((sim) => eqCardHTML(sim)).join('')}
      </div>
    </section>

    <section class="uni-section">
      <span class="eyebrow-t">${I.grad} COMO FUNCIONA</span>
      <h2 class="section-title" style="margin:8px 0 0;max-width:20ch">Da escola ao <span class="hl">cartão de estudo</span></h2>
      <div class="uni-flow">
        <article><i>01 · ESCOLA</i><h3>Escolha a escola</h3><p>Cada turma pertence a uma escola. O docente vê só as suas, o estudante encontra a turma pelo código que recebeu.</p></article>
        <article><i>02 · TURMA</i><h3>Crie a turma e a disciplina</h3><p>Nome, código, horário e sala. A turma ganha um código partilhável e um quadro de sessões com guião de aula.</p></article>
        <article><i>03 · MATÉRIAS</i><h3>Envie o material</h3><p>O docente publica resumos, fichas e texto de estudo. O estudante abre a matéria e estuda diretamente a partir dela.</p></article>
        <article><i>04 · NÚCLEO AMA</i><h3>O motor transforma a matéria</h3><p>O Núcleo AMA lê o texto publicado e cria mapa de conceitos, cartões de revisão, quiz, ficha e plano de aula — tudo localmente neste navegador.</p></article>
      </div>
      <div class="school-paths">
        <article class="school-path"><span class="sp-ic">${I.users}</span><div><span class="eyebrow-t">SOU DOCENTE</span><h3>Crie a sua turma</h3><p>Publique disciplinas, sessões e matérias. Acompanhe a chamada e gere fichas com um clique.</p></div><a class="btn btn-o btn-sm" href="${S.user ? '#/turmas' : '#/registo'}">Começar ${I.arrow}</a></article>
        <article class="school-path"><span class="sp-ic">${I.book || I.doc}</span><div><span class="eyebrow-t">SOU ESTUDANTE</span><h3>Estude com a sua turma</h3><p>Entre pelo código, leia o material enviado e transforme-o em cartões, mapas e perguntas.</p></div><a class="btn btn-o btn-sm" href="${S.user ? '#/turmas' : '#/entrar'}">Entrar ${I.arrow}</a></article>
      </div>
      <div class="na-band">
        <span class="na-band-mark">NA</span>
        <div><b>Núcleo AMA · aprendizagem ativa</b><span>Ponte directa entre a turma e o estudo: a sessão vira mapa de conceitos, prática Feynman e revisão espaçada SM-2.</span></div>
        ${seloMotor()}
      </div>
    </section>
    <section class="uni-section">
      <span class="eyebrow-t">${I.spark} ESTÚDIO DE ESTUDO</span>
      <h2 class="section-title" style="margin:8px 0 18px;max-width:24ch">Uma ideia de <span class="hl">cada vez.</span></h2>
      <div class="study-dock study-dock-5">
        <a class="dock-card" href="#/quiz"><span class="dock-ic">${I.quiz}</span><b>MODO QUIZ</b><span>Teste conhecimentos por aula com pontuação, sequência e revisão de erros.</span>${I.arrow}</a>
        <a class="dock-card" href="#/projetor"><span class="dock-ic">${I.play}</span><b>PROJETOR PDF</b><span>Converta PDFs em apresentações visuais 16:9 com Modo Leitura e notas.</span>${I.arrow}</a>
        <a class="dock-card" href="#/estudar"><span class="dock-ic">${I.doc}</span><b>RESUMOS &amp; MAPAS</b><span>O Núcleo AMA extrai ideias-chave, mapa de conceitos e cartões.</span>${I.arrow}</a>
        <a class="dock-card" href="#/professor"><span class="dock-ic">${I.calendar}</span><b>OFICINA DOCENTE</b><span>Fichas imprimíveis, planos de aula, rubricas e chamadas locais.</span>${I.arrow}</a>
        <a class="dock-card" href="#/revisao"><span class="dock-ic">${I.clock}</span><b>REVISÃO SM-2</b><span>Cartões espaçados com previsão de carga para os próximos 7 dias.</span>${I.arrow}</a>
      </div>
    </section>
    <section class="uni-section">
      <span class="eyebrow-t">${I.check} TRANSPARÊNCIA LOCAL</span>
      <div class="grid g-3" style="margin-top:18px">
        <article class="card uni-home-card"><i>01</i><h3>Não substitui a secretaria</h3><p>Presenças e notas aqui são apoio de sala de aula. O registo oficial continua a ser o da instituição.</p></article>
        <article class="card uni-home-card"><i>02</i><h3>Sem servidor</h3><p>Turmas, sessões, presenças e simulações ficam em localStorage. Noutro dispositivo, os dados não aparecem.</p></article>
        <article class="card uni-home-card"><i>03</i><h3>Feito para Angola</h3><p>Horários, salas, kwanzas e exemplos pensados para a realidade do ensino superior angolano.</p></article>
      </div>
    </section>
    <section class="uni-cta">
      <div class="box"><div><h2>Pronto para dar a próxima aula?</h2><p>Entre ou crie a sua conta para abrir a primeira turma ou experimente a bancada de equações agora.</p></div><a class="btn btn-g btn-lg" href="${dest}">Entrar nas turmas ${I.arrow}</a></div>
    </section>
    ${uniDockHTML('universidade')}`, 'universidade');
  });

  /* Laboratório Interativo AMA: Simuladores de Grandezas, Caderno de Regras + Desafio Ativo, e Mapa de Domínio */
  on('/universidade/ferramentas', async () => {
    const pct = progPct();
    const prog = loadProg();
    const snap = studySnapshot();
    const areas = ['Tudo', ...new Set(UNI_SHORTCUTS.map((s) => s.area))];
    const tipos = ['Todos', 'Mnemónica', 'Truque', 'Fórmula'];
    const filtrados = UNI_SHORTCUTS.filter((s) =>
      (U.scArea === 'Tudo' || s.area === U.scArea) &&
      (U.scTipo === 'Todos' || s.tipo === U.scTipo));
    const marcos = [
      { nome: 'Intuição Validada', desc: 'Complete 1 simulador de conceitos na Universidade', ok: prog.lessons.length >= 1 },
      { nome: 'Domínio de Grandezas', desc: 'Explore 3 simuladores de equações na bancada', ok: prog.sims.length >= 3 },
      { nome: 'Memória de Regras', desc: 'Marque 4 regras ou mnemónicas como dominadas', ok: prog.shortcuts.length >= 4 },
      { nome: 'Ritmo de Frequência', desc: 'Atinja 50% de domínio no Laboratório AMA', ok: pct >= 50 },
    ];
    return shellPublic(`
    <section class="uni-section" style="padding-top:34px">
      <div class="uni-sec-row">
        <div>
          <a class="uni-back-lnk" href="#/universidade">${I.back} Voltar à Universidade</a>
          <span class="eyebrow-t" style="margin-top:12px">${I.spark} LABORATÓRIO INTERATIVO AMA</span>
          <h1 class="section-title" style="margin:8px 0 0;font-size:clamp(34px,4.5vw,52px)">Simuladores, Regras <span class="hl">&amp; Domínio.</span></h1>
          <p class="uni-sec-sub">Experimente variáveis em direto, treine regras no modo desafio e acompanhe o seu domínio local sem precisar de conta.</p>
        </div>
        <div class="uni-lab-score">
          <span class="upp-ring lg" style="--p:${pct}">${pct}%</span>
          <div><b>Domínio local</b><small>${prog.lessons.length}/${UNI_AREAS.length} conceitos · ${prog.sims.length}/${UNI_SIMS.length} simuladores · ${prog.shortcuts.length}/${UNI_SHORTCUTS.length} regras</small></div>
        </div>
      </div>

      <div class="uni-lab-tabs" role="tablist">
        <button type="button" class="${U.labTab === 'sim' ? 'on' : ''}" onclick="UNI.labTab('sim')">Simulador de grandezas <span>${UNI_SIMS.length}</span></button>
        <button type="button" class="${U.labTab === 'sc' ? 'on' : ''}" onclick="UNI.labTab('sc')">Caderno de regras <span>${UNI_SHORTCUTS.length}</span></button>
        <button type="button" class="${U.labTab === 'prog' ? 'on' : ''}" onclick="UNI.labTab('prog')">Mapa de domínio <span>${marcos.filter((b) => b.ok).length}/${marcos.length}</span></button>
      </div>

      ${U.labTab === 'sim' ? `
        <div class="eq-solver-grid">${UNI_SIMS.map((sim) => eqCardHTML(sim)).join('')}</div>
      ` : ''}

      ${U.labTab === 'sc' ? `
        <div class="sc-toolbar">
          <div class="sc-filters">
            <div class="sc-pills">${areas.map((a) => `<button type="button" class="${U.scArea === a ? 'on' : ''}" onclick="UNI.scFilter('area','${escAttr(a)}')">${esc(a)}</button>`).join('')}</div>
            <div class="sc-pills sub">${tipos.map((t) => `<button type="button" class="${U.scTipo === t ? 'on' : ''}" onclick="UNI.scFilter('tipo','${escAttr(t)}')">${esc(t)}</button>`).join('')}</div>
          </div>
          <button type="button" class="btn ${U.drillMode ? 'btn-p' : 'btn-f'} btn-sm" onclick="UNI.toggleDrill(${!U.drillMode})">${I.quiz} ${U.drillMode ? 'Ver lista completa' : 'Modo Desafio Ativo'}</button>
        </div>
        ${U.drillMode ? ruleDrillHTML(filtrados) : `
          <div class="sc-grid">
            ${filtrados.map((s) => {
              const ok = prog.shortcuts.includes(s.id);
              return `<article class="sc-card ${ok ? 'done' : ''}">
                <div class="sc-meta-line">${esc(s.tipo)} · ${esc(s.area)}${ok ? ' · <b>Dominada</b>' : ''}</div>
                <h3>${esc(s.titulo)}</h3>
                <div class="sc-expr">${esc(s.expr)}</div>
                <p>${esc(s.dica)}</p>
                <button type="button" class="btn ${ok ? 'btn-p' : 'btn-o'} btn-sm" onclick="UNI.toggleShortcut('${s.id}')">${ok ? '✓ Dominada' : 'Marcar como dominada'}</button>
              </article>`;
            }).join('')}
          </div>
        `}
      ` : ''}

      ${U.labTab === 'prog' ? `
        <div class="na-mastery-stats">
          <div class="card"><span>Conceitos explorados</span><strong>${prog.lessons.length} / ${UNI_AREAS.length}</strong></div>
          <div class="card"><span>Simuladores testados</span><strong>${prog.sims.length} / ${UNI_SIMS.length}</strong></div>
          <div class="card"><span>Resumos em Estudar</span><strong>${snap.recs}</strong></div>
          <div class="card"><span>Cartões SM-2 (${snap.mastered} estáveis)</span><strong>${snap.cards}</strong></div>
        </div>
        <div class="grid g-2" style="margin-top:18px">
          ${marcos.map((b) => `<article class="card uni-badge-card ${b.ok ? 'on' : ''}">
            <span class="ubc-ic">${b.ok ? I.check : I.spark}</span>
            <div><b>${esc(b.nome)}</b><p>${esc(b.desc)}</p></div>
            <span class="ubc-st">${b.ok ? 'Concluído' : 'Em progresso'}</span>
          </article>`).join('')}
        </div>
        <div class="card" style="margin-top:18px;display:flex;align-items:center;justify-content:space-between;gap:14px;flex-wrap:wrap">
          <div><h3 style="margin:0 0 4px">Registo local neste dispositivo</h3><p class="muted" style="margin:0;font-size:13px">Todo o domínio do Laboratório AMA fica guardado apenas neste navegador (localStorage).</p></div>
          <button type="button" class="btn btn-o btn-sm btn-danger" onclick="UNI.resetProg()">Limpar domínio local</button>
        </div>
      ` : ''}
    </section>
    ${uniDockHTML('ferramentas')}`, 'universidade');
  });

  /* Escolas: o espaço das turmas. Mantém-se local e distinto do catálogo de
     cursos — aqui o utilizador organiza salas, não compra formações. */
  on('/escolas', async () => {
    if (!S.user) return viewEntrar();
    const d = load();
    const doc = podeLecionar();
    const cards = (d.escolas || []).map((e) => {
      const ts = d.turmas.filter((t) => t.escolaId === e.id);
      const mats = ts.reduce((n, t) => n + publicadas(t).length, 0);
      return `<article class="uni-card school-card">
        <div class="uc-top"><span class="uc-code">${esc(e.sigla)} · ${esc(e.local)}</span><span class="uc-sem">${ts.length} turmas</span></div>
        <h3>${esc(e.nome)}</h3>
        <div class="uc-meta"><span>${I.users} ${ts.reduce((n, t) => n + t.alunos.length, 0)} estudantes</span><span>${I.doc} ${mats} matérias publicadas</span></div>
        <div class="school-classes">${ts.slice(0, 4).map((t) => `<a href="#/turma/${t.id}"><b>${esc(t.codigo)}</b><span>${esc(disc(d, t.disciplinaId).nome)}</span>${I.arrow}</a>`).join('') || '<span class="muted">Sem turmas nesta escola.</span>'}</div>
        <div class="uc-foot"><a class="btn btn-o btn-sm" href="#/turmas?escola=${encodeURIComponent(e.id)}">Ver turmas ${I.arrow}</a></div>
      </article>`;
    }).join('');
    return panelShell('turmas', `
      <div class="uni-head">
        <div><span class="kicker">UNIVERSIDADE</span><h1>Escolas</h1><p>Cada escola reúne as suas turmas, disciplinas e materiais de estudo. Registo local de demonstração.</p></div>
        <div class="flex" style="gap:8px;flex-wrap:wrap">
          <a class="btn btn-o btn-sm" href="#/universidade">${I.grad} Sobre a Universidade</a>
          ${doc ? `<button class="btn btn-p btn-sm" onclick="UNI.novaEscola()">${I.plus} Nova escola</button>` : ''}
        </div>
      </div>
      ${doc ? `<div id="uni-escola-form" hidden>${formEscola()}</div>` : ''}
      <div class="uni-grid">${cards}</div>
      <p class="muted" style="font-size:11.5px;margin-top:18px;max-width:75ch">Escolas, turmas e matérias ficam neste navegador. São um apoio de sala de aula e não substituem o registo oficial de qualquer instituição.</p>
    `, menu());
  });

  on('/turmas', async ({ q }) => {
    if (!S.user) return viewEntrar();
    const d = load();
    const doc = podeLecionar();
    const filtro = q && q.escola ? q.escola : '';
    const daEscola = (t) => !filtro || t.escolaId === filtro;
    const minhas = d.turmas.filter((t) => (S.user.papel === 'STUDENT' ? inscrito(t) : true) && daEscola(t));
    const abertas = S.user.papel === 'STUDENT' ? d.turmas.filter((t) => !inscrito(t) && daEscola(t)) : [];
    const cards = (list, modo) => list.map((t) => {
      const dp = disc(d, t.disciplinaId);
      const nx = proxima(t);
      const tx = taxa(t.sessoes);
      return `<article class="uni-card">
        <div class="uc-top"><span class="uc-code">${esc(escola(d, t.escolaId).sigla)} · ${esc(t.codigo)}</span><span class="uc-sem">${esc(t.semestre)}</span></div>
        <h3>${esc(dp.nome)}</h3>
        <div class="school-line">${I.home} ${esc(escola(d, t.escolaId).nome)}</div>
        <div class="uc-meta">
          <span>${I.clock} ${esc(t.horario)}</span>
          <span>${I.users} ${t.alunos.length} alunos</span>
          <span>${I.level} ${t.ano}.º ano · ${dp.ects} ECTS</span>
        </div>
        <div class="uc-progress" title="Presença acumulada"><i style="width:${tx.pct}%"></i></div>
        <div class="uc-foot">
          <span class="uc-teacher"><span class="av">${esc(iniciais(t.docenteNome))}</span>${esc(t.docenteNome)}</span>
          ${modo === 'lecionar'
            ? `<a class="btn btn-o btn-sm" href="#/lecionar/${t.id}">${I.play} Lecionar</a>`
            : `<a class="btn btn-o btn-sm" href="#/turma/${t.id}">${I.arrow} Abrir turma</a>`}
        </div>
      </article>`;
    }).join('') || '<div class="card empty"><h3>Sem turmas associadas</h3><p>Use o código da turma para entrar, ou peça ao docente para o adicionar.</p></div>';

    return panelShell('turmas', `
      <div class="uni-head">
        <div><span class="kicker">${esc(d.semestre)}</span><h1>${doc ? 'Turmas que leciona' : 'As minhas turmas'}</h1>
          <p>${doc ? 'Abra a turma para ver sessões, chamada e materiais. A consola de lecionação abre a próxima sessão em ecrã de aula.' : 'Aqui encontra o guião, os materiais e as avaliações das turmas em que está inscrito.'}</p></div>
        <div class="flex" style="gap:8px;flex-wrap:wrap">
          <button class="btn btn-o btn-sm" onclick="UNI.openHorario()">${I.calendar} Horário</button>
          <button class="btn btn-o btn-sm" onclick="UNI.openProvas()">${I.doc} Provas</button>
          <a class="btn btn-o btn-sm" href="#/universidade/ferramentas">${I.spark} Fórmulas</a>
          <a class="btn btn-o btn-sm" href="#/escolas">${I.home} Escolas</a>
          <a class="btn btn-o btn-sm" href="#/universidade">${I.grad} Sobre a Universidade</a>
          ${doc ? `<button class="btn btn-p btn-sm" onclick="UNI.toggleForm('turma')">${I.plus} Nova turma</button>` : ''}
        </div>
      </div>
      <div class="school-filters"><a class="${!filtro ? 'on' : ''}" href="#/turmas">Todas</a>${(d.escolas || []).map((e) => `<a class="${filtro === e.id ? 'on' : ''}" href="#/turmas?escola=${encodeURIComponent(e.id)}">${esc(e.sigla)} · ${esc(e.nome)}</a>`).join('')}</div>
      ${doc ? `<div id="uni-new" hidden>${formTurma()}</div>` : `
        <div class="uc-panel" style="margin-bottom:18px">
          <div class="uc-panel-h"><b>Entrar numa turma</b><span>código de 6 caracteres</span></div>
          <div class="uni-form" style="grid-template-columns:1fr auto">
            <div class="field"><label>Código da turma</label><input id="uni-code" maxlength="12" placeholder="Ex.: COM201A" style="text-transform:uppercase"></div>
            <div class="acts" style="align-self:end"><button class="btn btn-p" onclick="UNI.entrarCodigo()">${I.plus} Entrar</button></div>
          </div>
        </div>`}
      <div class="uni-grid">${cards(minhas, doc ? 'lecionar' : 'abrir')}</div>
      ${abertas.length ? `<div class="sec-head" style="margin-top:34px"><div><span class="eyebrow-t">TURMAS ABERTAS</span><h2 class="section-title" style="font-size:24px;margin-top:6px">Também pode entrar</h2></div></div>
        <div class="uni-grid" style="margin-top:14px">${abertas.map((t) => {
          const dp = disc(d, t.disciplinaId);
          return `<article class="uni-card"><div class="uc-top"><span class="uc-code">${esc(t.codigo)}</span><span class="uc-sem">${esc(t.semestre)}</span></div>
            <h3>${esc(dp.nome)}</h3>
            <div class="uc-meta"><span>${I.clock} ${esc(t.horario)}</span><span>${I.users} ${t.alunos.length} alunos</span></div>
            <div class="uc-foot"><span class="uc-teacher">${esc(t.docenteNome)}</span><button class="btn btn-p btn-sm" onclick="UNI.entrar('${t.id}')">Entrar na turma</button></div></article>`;
        }).join('')}</div>` : ''}
      <p class="muted" style="font-size:11.5px;margin-top:18px;max-width:75ch">Registo local: turmas, presenças e materiais ficam neste navegador e não substituem o registo oficial da instituição.</p>
    `, menu());
  });

  function formEscola() {
    return `<div class="uc-panel" style="margin-bottom:20px">
      <div class="uc-panel-h"><b>Nova escola</b><span>registo local</span></div>
      <div class="uni-form">
        <div class="field"><label>Nome da escola</label><input id="ne-nome" maxlength="80" placeholder="Ex.: Escola Superior de Cabinda"></div>
        <div class="field"><label>Sigla</label><input id="ne-sigla" maxlength="8" placeholder="Ex.: ESC"></div>
        <div class="field"><label>Localidade</label><input id="ne-local" maxlength="50" placeholder="Ex.: Cabinda"></div>
        <div class="acts"><button class="btn btn-p" onclick="UNI.criarEscola()">${I.check} Criar escola</button><button class="btn btn-o" onclick="UNI.novaEscola()">Cancelar</button></div>
      </div></div>`;
  }

  function formTurma() {
    const d = load();
    return `<div class="uc-panel" style="margin-bottom:20px">
      <div class="uc-panel-h"><b>Nova turma</b><span>escola · disciplina · docente</span></div>
      <div class="uni-form">
        <div class="field"><label>Escola</label><select id="nt-escola">${(d.escolas || []).map((e) => `<option value="${escAttr(e.id)}">${esc(e.nome)}</option>`).join('')}</select></div>
        <div class="field"><label>Disciplina</label><input id="nt-disc" maxlength="60" placeholder="Ex.: Métodos de Investigação"></div>
        <div class="field"><label>Código da disciplina</label><input id="nt-cod" maxlength="12" placeholder="Ex.: MET-301"></div>
        <div class="field"><label>Código da turma</label><input id="nt-turma" maxlength="10" placeholder="Ex.: MET301A" style="text-transform:uppercase"></div>
        <div class="field"><label>Docente</label><input id="nt-doc" maxlength="60" value="${escAttr(S.user.nome)}"></div>
        <div class="field"><label>Sala</label><input id="nt-sala" maxlength="50" placeholder="Ex.: Sala 4 · Bloco A"></div>
        <div class="field"><label>Horário</label><input id="nt-hor" maxlength="70" placeholder="Ex.: Ter 10:00–12:00 · Qui 14:00–16:00"></div>
        <div class="field"><label>Ano curricular</label><select id="nt-ano"><option>1</option><option>2</option><option>3</option><option>4</option></select></div>
        <div class="field"><label>ECTS</label><input id="nt-ects" type="number" min="1" max="30" value="5"></div>
        <div class="acts"><button class="btn btn-p" onclick="UNI.criarTurma()">${I.check} Criar turma</button><button class="btn btn-o" onclick="UNI.toggleForm('turma')">Cancelar</button></div>
      </div></div>`;
  }

  on('/turma/:id', async ({ args }) => {
    if (!S.user) return viewEntrar();
    const d = load();
    const t = turma(args.id);
    if (!t) return panelShell('turmas', `<div class="card empty"><h3>Turma não encontrada</h3><p>O registo pode ter sido apagado neste navegador.</p><a class="btn btn-p" href="#/turmas">Voltar às turmas</a></div>`, menu());
    if (U.turma !== t.id) { U.turma = t.id; U.tab = 'visao'; U.aberta = null; }
    const dp = disc(d, t.disciplinaId);
    const doc = podeLecionar();
    const tx = taxa(t.sessoes);
    const nx = proxima(t);
    const tabs = [['visao', 'Visão geral'], ['sessoes', 'Sessões', t.sessoes.length], ['materiais', 'Matérias', publicadas(t).length], ['pratica', 'Prática', t.sessoes.filter((s) => praticaDe(t, s)).length], ['alunos', 'Alunos', t.alunos.length], ['avaliacoes', 'Avaliações', t.avaliacoes.length]];
    return panelShell('turmas', `
      <section class="uc-hero">
        <span class="kicker">${esc(t.codigo)} · ${esc(t.semestre)}</span>
        <h1>${esc(dp.nome)}</h1>
        <div class="uc-sub">
          <span>${I.home} ${esc(escola(d, t.escolaId).nome)}</span>
          <span>${I.users} ${t.alunos.length} alunos</span>
          <span>${I.clock} ${esc(t.horario)}</span>
          <span>${I.home} ${esc(t.sala)}</span>
          <span>${I.level} ${t.ano}.º ano · ${dp.ects} ECTS</span>
        </div>
        <div class="uc-actions">
          ${doc && nx ? `<a class="btn btn-f" href="#/lecionar/${t.id}?sessao=${nx.id}">${I.play} Lecionar ${nx.data === hoje() ? 'hoje' : fmtDia(nx.data)}</a>` : ''}
          ${doc ? `<button class="btn btn-o btn-ghost-d" onclick="UNI.addSessao('${t.id}')">${I.plus} Nova sessão</button>` : ''}
          ${doc ? `<button class="btn btn-o btn-ghost-d" onclick="UNI.tab('materiais');setTimeout(()=>UNI.addMaterial('${t.id}'),60)">${I.doc} Enviar matéria</button>` : ''}
          ${t.sessoes.length ? `<button class="btn btn-o btn-ghost-d" onclick="UNI.tab('pratica')">${I.spark} Praticar</button>` : ''}
          <a class="btn btn-o btn-ghost-d" href="#/universidade/ferramentas">${I.spark} Fórmulas</a>
          <a class="btn btn-o btn-ghost-d" href="#/turmas">${I.back} Turmas</a>
          ${doc ? `<button class="btn btn-o btn-ghost-d btn-danger" onclick="UNI.apagarTurma('${t.id}')">Apagar turma</button>` : ''}
          ${!doc && !inscrito(t) ? `<button class="btn btn-f" onclick="UNI.entrar('${t.id}')">Entrar na turma</button>` : ''}
        </div>
      </section>
      <nav class="uc-tabs" aria-label="Secções da turma">
        ${tabs.map(([k, l, n]) => `<button class="uc-tab ${U.tab === k ? 'on' : ''}" onclick="UNI.tab('${k}')">${esc(l)}${n != null ? `<span class="n">${n}</span>` : ''}</button>`).join('')}
      </nav>
      ${U.tab === 'visao' ? visaoTurma(t, dp, tx, nx, doc) : ''}
      ${U.tab === 'sessoes' ? sessoesTurma(t, doc) : ''}
      ${U.tab === 'materiais' ? materiaisTurma(t, doc) : ''}
      ${U.tab === 'pratica' ? praticaTurma(t, doc) : ''}
      ${U.tab === 'alunos' ? alunosTurma(t, tx, doc) : ''}
      ${U.tab === 'avaliacoes' ? avaliacoesTurma(t, doc) : ''}
      <p class="muted" style="font-size:11.5px;margin-top:22px;max-width:78ch">Registo local · a chamada e as notas desta página são apoio de sala de aula e não substituem o registo oficial da instituição.</p>
    `, menu());
  });

  function visaoTurma(t, dp, tx, nx, doc) {
    const ultimas = sessoesOrd(t).filter((s) => s.estado === 'terminada').slice(-2).reverse();
    return `<div class="uc-layout">
      <div class="uc-panel">
        <div class="uc-panel-h"><b>Próxima sessão</b><span>${nx ? estadoLabel(nx) : 'sem sessões'}</span></div>
        ${nx ? `<div style="padding:22px">
          <div class="uc-session uc-next">
            <div class="date"><b>${nx.data.slice(8, 10)}</b><span>${diaCURTO[new Date(nx.data + 'T12:00:00').getDay()]}</span></div>
            <div><h4 style="font-size:20px">${esc(nx.tema)}</h4><small>${esc(nx.inicio)}–${esc(nx.fim)} · ${esc(t.sala)}</small></div>
            ${doc ? `<a class="btn btn-p btn-sm" href="#/lecionar/${t.id}?sessao=${nx.id}">Abrir consola</a>` : `<button class="go" onclick="UNI.tab('sessoes')">Ver guião</button>`}
          </div>
          <p style="color:var(--muted);font-size:13.5px;line-height:1.6;margin-top:16px;max-width:65ch">${esc(nx.resumo)}</p>
          <div class="flex" style="gap:8px;flex-wrap:wrap;margin-top:16px">
            <button class="btn btn-o btn-sm" onclick="UNI.estudar('${t.id}','${nx.id}')">${I.spark} Transformar em resumo</button>
            <button class="btn btn-o btn-sm" onclick="UNI.calendario('${t.id}')">${I.calendar} Calendário .ics</button>
          </div>
        </div>` : '<p style="padding:20px;color:var(--muted)">Ainda sem sessões nesta turma.</p>'}
        <div class="uc-panel-h" style="border-top:1px solid var(--line)"><b>Sessões recentes</b><a href="#/turma/${t.id}" onclick="UNI.tab('sessoes');return false" style="font-family:var(--font-m);font-size:9px;letter-spacing:.08em;text-transform:uppercase;color:var(--green)">Ver todas</a></div>
        ${ultimas.length ? ultimas.map((s) => `<div class="uc-session"><div class="date"><b>${s.data.slice(8, 10)}</b><span>${diaCURTO[new Date(s.data + 'T12:00:00').getDay()]}</span></div>
          <div><h4>${esc(s.tema)}</h4><small>${taxa([s]).pct}% presente · ${s.estado === 'terminada' ? 'concluída' : 'aberta'}</small></div>
          <span class="st done">Concluída</span></div>`).join('') : '<p style="padding:18px;color:var(--muted);font-size:13px">Sem histórico.</p>'}
      </div>
      <div class="uc-side">
        <div class="uc-panel uc-mini">
          <h3>Presença acumulada</h3>
          <div class="uc-stat">${tx.pct}<small>%</small></div>
          <div class="uc-bar"><i style="width:${tx.pct}%"></i></div>
          <p>${tx.p} presenças em ${tx.tot} registos. Calculado apenas sobre sessões com chamada lançada.</p>
        </div>
        <div class="uc-panel uc-mini">
          <h3>Docente</h3>
          <div class="uc-teacher" style="gap:12px"><span class="av" style="width:40px;height:40px;border-radius:2px;background:var(--green);color:#fff;display:grid;place-items:center;font-family:var(--font-m);font-size:12px">${esc(iniciais(t.docenteNome))}</span>
            <div><b style="display:block;font-size:13.5px">${esc(t.docenteNome)}</b><small style="font-family:var(--font-m);font-size:9px;letter-spacing:.06em;text-transform:uppercase;color:var(--muted)">${esc(dp.area)} · ${esc(t.sala)}</small></div></div>
        </div>
        <div class="uc-panel uc-mini">
          <h3>Próximas avaliações</h3>
          ${t.avaliacoes.slice().sort((a, b) => a.data.localeCompare(b.data)).slice(0, 3).map((a) => `<div style="display:flex;justify-content:space-between;gap:10px;padding:8px 0;border-bottom:1px solid var(--line-2)">
            <div><b style="font-size:12.5px;font-weight:500">${esc(a.titulo)}</b><small style="display:block;font-family:var(--font-m);font-size:8.5px;letter-spacing:.05em;text-transform:uppercase;color:var(--muted)">${esc(a.tipo)} · ${a.peso}%</small></div>
            <span style="font-family:var(--font-m);font-size:9px;color:var(--green);white-space:nowrap">${fmtDia(a.data)}</span></div>`).join('')}
        </div>
      </div>
    </div>`;
  }

  function sessoesTurma(t, doc) {
    const d = load();
    const dp = disc(d, t.disciplinaId);
    return `<div class="uc-panel">
      <div class="uc-panel-h"><b>Plano de sessões</b><span>${t.sessoes.length} sessões · ${esc(dp.nome)}</span></div>
      ${sessoesOrd(t).map((s) => `<div class="uc-session">
        <div class="date"><b>${s.data.slice(8, 10)}</b><span>${diaCURTO[new Date(s.data + 'T12:00:00').getDay()]}</span></div>
        <div><h4>${esc(s.tema)}</h4><small>${esc(s.inicio)}–${esc(s.fim)} · ${esc(t.sala)} · ${(s.guiao || []).length} passos</small></div>
        <div class="flex" style="gap:6px;align-items:center;flex-wrap:wrap;justify-content:end">
          <span class="st ${s.estado === 'em-curso' ? 'live' : s.estado === 'terminada' ? 'done' : ''}">${estadoLabel(s)}</span>
          <button class="go" onclick="UNI.verSessao('${t.id}','${s.id}')">${doc ? 'Lecionar' : 'Ver guião'}</button>
        </div>
      </div>`).join('')}
      <div id="uni-sess-form" hidden>${formSessao(t.id)}</div>
    </div>`;
  }

  function formSessao(id) {
    const d = load();
    return `<div class="uc-panel-h" style="border-top:1px solid var(--line)"><b>Nova sessão</b><span>${esc(d.semestre)}</span></div>
      <div class="uni-form">
        <div class="field"><label>Data</label><input type="date" id="ns-data" value="${hoje()}"></div>
        <div class="field"><label>Tema</label><input id="ns-tema" maxlength="90" placeholder="Ex.: Estudo de caso — comunicação interna"></div>
        <div class="field"><label>Início</label><input type="time" id="ns-ini" value="10:00"></div>
        <div class="field"><label>Fim</label><input type="time" id="ns-fim" value="12:00"></div>
        <div class="field wide"><label>Sumário</label><textarea id="ns-res" maxlength="600" placeholder="Duas ou três frases sobre o que a sessão cobre."></textarea></div>
        <div class="acts"><button class="btn btn-p" onclick="UNI.guardarSessao('${id}')">${I.check} Guardar sessão</button><button class="btn btn-o" onclick="UNI.addSessao('${id}')">Cancelar</button></div>
      </div>`;
  }

  function materiaisTurma(t, doc) {
    const d = load();
    const mats = (t.materiais || []).slice().sort((a, b) => String(b.enviadoEm || '').localeCompare(String(a.enviadoEm || '')));
    return `<div class="uc-panel">
      <div class="uc-panel-h"><b>Matérias da turma <small class="na-tag">estudo</small></b><span>${publicadas(t).length} de ${mats.length} publicadas · enviadas pelo docente</span></div>
      <div class="mat-intro">${doc
        ? 'Publique o texto da matéria, anexe um ficheiro pequeno e envie para a turma. Os estudantes abrem a matéria e transformam-na em mapas de conceitos, cartões e perguntas no estúdio de estudo.'
        : 'Material enviado pelo docente para esta turma. Abra uma matéria e leve o texto para o estúdio — o Núcleo AMA cria mapas de conceitos, cartões e perguntas a partir dele.'}</div>
      ${doc ? `<div class="mat-tools"><button class="btn btn-p btn-sm" onclick="UNI.addMaterial('${t.id}')">${I.plus} Nova matéria</button><span class="muted">Texto e ficheiro até 180 KB · guardado neste navegador</span></div>
      <div id="uni-mat-form" hidden>${formMaterial(t)}</div>` : ''}
      <div class="mat-grid">${mats.map((m) => {
        const pronto = (m.texto || '').length >= 60;
        return `<article class="mat-card ${m.enviado === false ? 'draft' : ''}">
          <div class="mat-top"><span class="mat-ic">${I.doc}</span><span class="mat-type">${esc(m.tipo || 'Texto')}</span>
            <span class="mat-state ${m.enviado === false ? 'off' : ''}">${m.enviado === false ? 'Rascunho' : 'Enviada'}</span></div>
          <h4>${esc(m.titulo)}</h4>
          <p>${esc((m.texto || m.nota || '').slice(0, 180))}${(m.texto || '').length > 180 ? '…' : ''}</p>
          <div class="mat-meta"><span>${esc(m.autor || t.docenteNome)}</span><span>${m.enviadoEm ? fmtDia(m.enviadoEm) : '—'}</span></div>
          <div class="mat-acts">
            ${m.enviado !== false && pronto ? `<button class="btn btn-o btn-sm" onclick="UNI.estudarMaterial('${t.id}','${m.id}')">${I.spark} Estudar</button>` : ''}
            ${m.arquivo ? `<a class="btn btn-o btn-sm" href="${escAttr(m.arquivo)}" download="${escAttr(m.nomeArquivo || 'material')}">${I.doc} ${esc(m.nomeArquivo || 'Ficheiro')}</a>` : ''}
            ${doc ? `<button class="btn btn-o btn-sm" onclick="UNI.enviarMaterial('${t.id}','${m.id}')">${m.enviado === false ? 'Enviar' : 'Retirar'}</button>
              <button class="btn btn-o btn-sm" onclick="UNI.apagarMaterial('${t.id}','${m.id}')">Apagar</button>` : ''}
          </div>
        </article>`;
      }).join('') || '<p style="padding:20px;color:var(--muted)">Ainda não há matérias nesta turma.</p>'}</div>
      <p style="padding:14px 18px;color:var(--muted);font-size:12px;border-top:1px solid var(--line-2)">As matérias e os ficheiros ficam apenas neste navegador. O envio é uma publicação local para a turma — não há servidor, email ou notificação externa.</p>
    </div>`;
  }

  function formMaterial(t) {
    const d = load();
    const tipos = ['Resumo', 'Ficha', 'Slides', 'Leitura', 'Vídeo', 'Outro'];
    return `<div class="uni-form mat-form">
      <div class="field"><label>Título da matéria</label><input id="mt-titulo" maxlength="90" placeholder="Ex.: Resumo — Comunicação de crise"></div>
      <div class="field"><label>Tipo</label><select id="mt-tipo">${tipos.map((x) => `<option>${x}</option>`).join('')}</select></div>
      <div class="field"><label>Disciplina</label><select id="mt-disc">${d.disciplinas.map((x) => `<option value="${escAttr(x.id)}" ${x.id === t.disciplinaId ? 'selected' : ''}>${esc(x.nome)}</option>`).join('')}</select></div>
      <div class="field wide"><label>Conteúdo para estudo</label><textarea id="mt-texto" maxlength="6000" rows="6" placeholder="Escreva o resumo, as ideias centrais ou as instruções da ficha. Quanto mais texto, melhores serão os cartões e as perguntas."></textarea></div>
      <div class="field wide"><label>Ficheiro de apoio (opcional, até 180 KB)</label><input id="mt-arquivo" type="file"></div>
      <div class="acts"><label class="checkline"><input id="mt-enviar" type="checkbox" checked> Publicar para a turma</label>
        <button class="btn btn-p" onclick="UNI.guardarMaterial('${t.id}')">${I.check} Guardar matéria</button>
        <button class="btn btn-o" onclick="UNI.addMaterial('${t.id}')">Cancelar</button></div>
    </div>`;
  }

  /* Prática: cada sessão da turma pode virar ficha de estudo com o Núcleo AMA.
     A posse dos dados continua no espaço de estudo (AMAStudy.ingest / kit) —
     a turma só pede e mostra, nunca escreve no store alheio. */
  function praticaTurma(t, doc) {
    const lista = sessoesOrd(t);
    const feitas = lista.filter((s) => praticaDe(t, s)).length;
    const comTexto = (s) => textoPratica(s).length >= 120;
    return `<div class="uc-panel">
      <div class="uc-panel-h"><b>Prática da turma <small class="na-tag">Núcleo AMA</small></b><span>${feitas} de ${lista.length} sessões com ficha · gerada neste dispositivo</span></div>
      <div class="na-steps"><span><b>01</b> Sumário da sessão</span><i></i><span><b>02</b> Núcleo AMA</span><i></i><span><b>03</b> Cartões e revisão</span>${seloMotor()}</div>
      ${lista.length ? `<div class="uc-pratica-bar">
        <button class="btn btn-p btn-sm" onclick="UNI.praticaToda('${t.id}')">${I.spark} Gerar prática de todas</button>
        <a class="btn btn-o btn-sm" href="#/revisao">${I.clock} Rever os cartões</a>
        <span class="muted uc-pratica-nota">${lista.filter(comTexto).length} sessões têm sumário suficiente para gerar perguntas.</span>
      </div>` : ''}
      ${lista.map((s) => {
        const k = praticaDe(t, s);
        const aberta = U.aberta === s.id && k;
        return `<div class="uc-session">
          <div class="date"><b>${s.data.slice(8, 10)}</b><span>${diaCURTO[new Date(s.data + 'T12:00:00').getDay()]}</span></div>
          <div><h4>${esc(s.tema)}</h4><small>${k ? `${k.cartões} cartões · ${k.perguntas} perguntas` : (comTexto(s) ? 'prática por gerar' : 'sumário curto — sem prática')}</small></div>
          <div class="flex" style="gap:6px;align-items:center;flex-wrap:wrap;justify-content:end">
            ${k ? `<button class="go" onclick="UNI.praticaVer('${s.id}')">${aberta ? 'Ocultar prática' : 'Ver prática'}</button>`
              : `<button class="go" ${comTexto(s) ? '' : 'disabled'} onclick="UNI.praticaGerar('${t.id}','${s.id}')">Gerar prática</button>`}
          </div>
        </div>${aberta ? blocoPratica(t, s, k, doc) : ''}`;
      }).join('') || '<p style="padding:20px;color:var(--muted)">Sem sessões nesta turma.</p>'}
      <p style="padding:14px 18px;color:var(--muted);font-size:12px;border-top:1px solid var(--line-2)">As perguntas e os cartões saem do tema, do sumário e do guião gravados na sessão. Os cartões entram na Revisão espaçada como os dos seus próprios resumos.</p>
    </div>`;
  }

  function blocoPratica(t, s, k, doc) {
    const quiz = (k.perguntasTxt || []).map((q, i) => `<div class="st-quiz" data-q="${i}">
        <p class="st-qp">${esc(q.prompt)}</p>
        <div class="st-opts">${(q.options || []).map((o, j) => `<button type="button" onclick="AMAStudy.quizPick(this,${j},${q.correct})" data-i="${j}">${esc(o)}</button>`).join('')}</div>
        <p class="st-exp" hidden>${esc(q.explanation || '')}</p></div>`).join('');
    const cartoes = (k.cartõesTxt || []).map((c, i) => `<button type="button" class="st-card" onclick="this.classList.toggle('open')" aria-label="Virar cartão ${i + 1}">
        <small>${c.kind === 'cloze' ? 'Completar' : 'Definição'}</small><span class="st-front">${esc(c.front)}</span><span class="st-back">${esc(c.back)}</span></button>`).join('');
    return `<div class="uc-pratica">
      ${k.ideia ? `<p class="uc-ideia"><b>Ideia central</b><span>${esc(k.ideia)}</span></p>` : ''}
      ${quiz ? `<div class="card st-block"><h3>Perguntas <small class="muted">· responda aqui mesmo</small></h3>${quiz}</div>` : ''}
      ${cartoes ? `<div class="card st-block"><h3>Cartões <small class="muted">· toque para virar</small></h3><div class="st-cards">${cartoes}</div></div>` : ''}
      <div class="flex" style="gap:8px;flex-wrap:wrap">
        <a class="btn btn-o btn-sm" href="#/estudar/${k.id}">${I.doc} Abrir a ficha completa</a>
        <button class="btn btn-o btn-sm" onclick="UNI.praticaGerar('${t.id}','${s.id}')">${I.spark} Regenerar do sumário atual</button>
        ${doc ? `<button class="btn btn-o btn-sm" onclick="UNI.doc('ficha','${t.id}','${s.id}')">${I.doc} Ficha para imprimir</button>` : ''}
      </div>
    </div>`;
  }

  function alunosTurma(t, tx, doc) {
    return `<div class="uc-layout">
      <div class="uc-panel">
        <div class="uc-panel-h"><b>Alunos inscritos</b><span>${t.alunos.length} nomes</span></div>
        <div class="uc-roster">${t.alunos.map((n) => {
          const sessoes = t.sessoes.filter((s) => s.presencas && n in s.presencas);
          const p = sessoes.filter((s) => s.presencas[n] !== 'absent').length;
          return `<div><b>${esc(n)}</b><span>${sessoes.length ? p + '/' + sessoes.length + ' presenças' : 'sem chamada'}</span></div>`;
        }).join('')}</div>
      </div>
      <div class="uc-side">
        <div class="uc-panel uc-mini">
          <h3>Resumo da turma</h3>
          <div class="uc-stat">${tx.pct}<small>% presença</small></div>
          <p>${t.alunos.length} alunos · ${t.sessoes.filter((s) => s.estado === 'terminada').length} sessões concluídas.</p>
        </div>
        ${doc ? `<div class="uc-panel uc-mini"><h3>Exportar</h3>
          <div class="flex" style="gap:8px;flex-wrap:wrap"><button class="btn btn-o btn-sm" onclick="UNI.csv('${t.id}')">${I.doc} CSV completo</button>
          <button class="btn btn-o btn-sm" onclick="UNI.calendario('${t.id}')">${I.calendar} .ics</button></div>
          <p>Cada sessão com chamada entra no CSV. Guarde o ficheiro onde precisar.</p></div>` : ''}
      </div>
    </div>`;
  }

  function avaliacoesTurma(t, doc) {
    return `<div class="uc-panel">
      <div class="uc-panel-h"><b>Calendário de avaliações</b><span>peso total ${t.avaliacoes.reduce((n, a) => n + a.peso, 0)}%</span></div>
      <table class="tbl"><thead><tr><th>Avaliação</th><th>Tipo</th><th>Peso</th><th>Data</th><th>Estado</th></tr></thead><tbody>
        ${t.avaliacoes.slice().sort((a, b) => a.data.localeCompare(b.data)).map((a) => `<tr>
          <td><b>${esc(a.titulo)}</b></td><td>${esc(a.tipo)}</td><td>${a.peso}%</td><td>${fmtDia(a.data)}</td>
          <td><span class="pill ${a.data < hoje() ? 'pill-i' : 'pill-p'}">${a.data < hoje() ? 'Data passada' : 'Agendada'}</span></td></tr>`).join('')}
      </tbody></table>
      <p style="padding:14px 18px;color:var(--muted);font-size:12px">As notas oficiais são lançadas na secretaria. Esta página serve para o docente e a turma acompanharem o calendário.</p>
    </div>`;
  }

  /* --------------------------------------------------------- consola de aula */
  on('/lecionar/:id', async ({ args, q }) => {
    if (!S.user) return viewEntrar();
    if (!podeLecionar()) { toast('Só docentes podem abrir a consola de lecionação.'); return go('/turmas'); }
    const d = load();
    const t = turma(args.id);
    if (!t) return panelShell('turmas', '<div class="card empty"><h3>Turma não encontrada</h3></div>', menu());
    const s = (q && q.sessao && t.sessoes.find((x) => String(x.id) === String(q.sessao))) || proxima(t) || t.sessoes[0];
    if (!s) return panelShell('turmas', '<div class="card empty"><h3>Sem sessões</h3><p>Crie uma sessão antes de lecionar.</p></div>', menu());
    const dp = disc(d, t.disciplinaId);
    const passos = s.guiao || [];
    const agora = Math.min(Number(s.passo) || 0, Math.max(passos.length - 1, 0));
    const duracao = minutosEntre(s.inicio, s.fim);
    U.lec = { turma: t.id, sessao: s.id, duracao };
    const menuAtual = menu();
    setTimeout(() => { if ($('#lec-clock')) UNI._timerInit(); }, 30);
    return panelShell('turmas', `<div class="lec">
      <header class="lec-head">
        <div class="lc-id"><span class="logo-chip">${LOGO_SM}</span>
          <div><b>${esc(t.codigo)} · ${esc(dp.nome)}</b><span>${esc(t.sala)} · ${esc(s.inicio)}–${esc(s.fim)} · ${esc(S.user.nome)}</span></div></div>
        <div class="flex" style="gap:14px;align-items:center;flex-wrap:wrap">
          <div class="lec-timer"><span id="lec-clock">${fmtMin(duracao)}</span><small id="lec-clock-lbl">tempo de aula</small></div>
          <button class="btn btn-o btn-ghost-d btn-sm" onclick="UNI.timer()" id="lec-tbtn">Iniciar</button>
          <button class="btn btn-o btn-ghost-d btn-sm" onclick="UNI.timerReset()">Reiniciar</button>
          <button class="btn btn-o btn-ghost-d btn-sm" onclick="UNI.fullscreen()">${I.screen} Ecrã inteiro</button>
          <a class="btn btn-o btn-ghost-d btn-sm" href="#/turma/${t.id}">${I.back} Sair</a>
        </div>
      </header>
      <div class="lec-body">
        <main class="lec-main">
          <span class="lec-kicker">Sessão ${sessoesOrd(t).findIndex((x) => x.id === s.id) + 1} de ${t.sessoes.length} · ${fmtLongo(s.data)}</span>
          <h1>${esc(s.tema)}</h1>
          <p class="lec-note">${esc(s.resumo)}</p>
          <div class="lec-steps">
            ${passos.map((p, i) => `<div class="lec-step ${i < agora ? 'done' : i === agora ? 'now' : ''}">
              <span class="no">${String(i + 1).padStart(2, '0')}</span>
              <div><h3>${esc(p)}</h3>${i === agora ? `<p>Passo em curso. Marque como concluído quando terminar para avançar.</p>` : ''}</div>
              <span class="dur">${Math.round(duracao / Math.max(passos.length, 1))} min</span>
            </div>`).join('')}
          </div>
          <div class="flex" style="gap:8px;flex-wrap:wrap;margin-top:26px">
            <button class="btn btn-f" onclick="UNI.step(${agora},-1)" ${agora <= 0 ? 'disabled' : ''}>${I.back} Passo anterior</button>
            <button class="btn btn-f" onclick="UNI.step(${agora},1)" ${agora >= passos.length - 1 ? 'disabled' : ''}>Concluir passo ${I.arrow}</button>
            <button class="btn btn-o btn-ghost-d" onclick="UNI.terminarSessao('${t.id}','${s.id}')">${I.check} Terminar sessão</button>
          </div>
        </main>
        <aside class="lec-side">
          <div>
            <h2>Chamada rápida · ${t.alunos.length} alunos</h2>
            <div class="lec-att" id="lec-att">
              ${t.alunos.map((n) => {
                const st = (s.presencas || {})[n] || '';
                return `<div class="lec-att-row" data-n="${escAttr(n)}"><b>${esc(n)}</b><span class="btns">
                  <button class="${st === 'present' ? 'on p' : ''}" title="Presente" onclick="UNI.marcar('${t.id}','${s.id}','${escAttr(n)}','present',this)">P</button>
                  <button class="${st === 'late' ? 'on l' : ''}" title="Atrasado" onclick="UNI.marcar('${t.id}','${s.id}','${escAttr(n)}','late',this)">A</button>
                  <button class="${st === 'absent' ? 'on a' : ''}" title="Ausente" onclick="UNI.marcar('${t.id}','${s.id}','${escAttr(n)}','absent',this)">F</button>
                </span></div>`;
              }).join('')}
            </div>
            <div class="flex" style="justify-content:space-between;margin-top:10px;font-family:var(--font-m);font-size:9px;letter-spacing:.06em;text-transform:uppercase;color:#8a948c">
              <span id="lec-att-count">${resumoChamada(s, t)}</span>
              <button style="color:var(--signal)" onclick="UNI.todosPresentes('${t.id}','${s.id}')">Todos presentes</button>
            </div>
          </div>
          <div>
            <h2>Notas da sessão</h2>
            <textarea class="lec-notes" id="lec-notes" placeholder="O que ficou combinado, dúvidas da turma, tarefas para a próxima aula…" oninput="UNI.nota('${s.id}',this.value)">${esc(s.notas || '')}</textarea>
          </div>
          <div>
            <h2>Ferramentas</h2>
            <div class="lec-actions">
              <button class="btn btn-o btn-sm" onclick="UNI.doc('ficha','${t.id}','${s.id}')">${I.doc} Gerar ficha de exercícios</button>
              <button class="btn btn-o btn-sm" onclick="UNI.doc('plano','${t.id}','${s.id}')">${I.calendar} Gerar plano de aula</button>
              <button class="btn btn-o btn-sm" onclick="UNI.csv('${t.id}','${s.id}')">${I.users} Exportar chamada CSV</button>
              <button class="btn btn-o btn-sm" onclick="UNI.praticaGerar('${t.id}','${s.id}')">${I.spark} Prática desta sessão</button>
              <a class="btn btn-o btn-sm" href="#/ao-vivo">${I.live} Abrir sala ao vivo</a>
            </div>
          </div>
          <p style="font-family:var(--font-m);font-size:8.5px;letter-spacing:.06em;line-height:1.7;text-transform:uppercase;color:#9aa49c">Registo local · não substitui o registo oficial. Presenças e notas ficam neste navegador.</p>
        </aside>
      </div>
    </div>`, menuAtual, { bare: true, full: true });
  });

  function minutosEntre(a, b) {
    const p = (s) => { const [h, m] = String(s || '0:0').split(':').map(Number); return (h || 0) * 60 + (m || 0); };
    return Math.max(30, p(b) - p(a) || 90);
  }
  const fmtMin = (seg) => {
    const s = Math.max(0, Math.round(seg));
    return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
  };
  function resumoChamada(s, t) {
    const e = entradas(s);
    const p = e.filter((x) => x.status === 'present').length;
    const l = e.filter((x) => x.status === 'late').length;
    const a = e.filter((x) => x.status === 'absent').length;
    return `${p} presentes · ${l} atrasados · ${a} ausentes (${t.alunos.length} inscritos)`;
  }

  /* ============================================================ estado UI */
  const U = { tab: 'visao', turma: null, timerId: null, running: false, left: 0, timerSess: null, lec: null, aberta: null, eqState: {}, labTab: 'sim', scArea: 'Tudo', scTipo: 'Todos', drillMode: false, drill: null };

  const UNI = {
    /* Núcleo AMA: laboratório interativo, simuladores e modais */
    labTab(k) { U.labTab = k; U.drill = null; render(); },
    scFilter(kind, val) {
      if (kind === 'area') U.scArea = val; else U.scTipo = val;
      U.drill = null;
      render();
    },
    toggleDrill(on) {
      U.drillMode = !!on;
      U.drill = null;
      render();
    },
    drillStart() {
      U.drill = { idx: 0, score: 0, done: 0, answered: false, pick: -1, opts: null };
      render();
    },
    drillPick(pickIdx, rightId) {
      if (!U.drill || U.drill.answered) return;
      U.drill.answered = true;
      U.drill.pick = pickIdx;
      U.drill.done += 1;
      const picked = U.drill.opts && U.drill.opts[pickIdx];
      if (picked && picked.id === rightId) {
        U.drill.score += 1;
        const p = loadProg();
        if (!p.shortcuts.includes(rightId)) { p.shortcuts.push(rightId); saveProg(p); }
      }
      render();
    },
    drillNext() {
      if (!U.drill) return;
      U.drill.idx += 1;
      U.drill.answered = false;
      U.drill.pick = -1;
      U.drill.opts = null;
      render();
    },
    _markSim(id) {
      const p = loadProg();
      if (!p.sims.includes(id)) {
        p.sims.push(id);
        saveProg(p);
        document.querySelectorAll('.upp-ring').forEach((r) => { const pc = progPct(); r.style.setProperty('--p', pc); r.textContent = pc + '%'; });
      }
    },
    eqPick(id, varKey) {
      const sim = UNI_SIMS.find((x) => x.id === id);
      if (!sim) return;
      const st = simState(sim);
      st.target = varKey;
      this._markSim(id);
      const card = document.querySelector(`.eq-card[data-eq="${id}"]`);
      if (card) card.outerHTML = eqCardHTML(sim);
      else render();
    },
    eqSlide(id, slot, val) {
      const sim = UNI_SIMS.find((x) => x.id === id);
      if (!sim) return;
      const st = simState(sim);
      st[slot] = Number(val);
      this._markSim(id);
      const card = document.querySelector(`.eq-card[data-eq="${id}"]`);
      if (!card) return;
      const res = simCompute(sim, st);
      const v = sim.vars[slot];
      const lbl = card.querySelector(`[data-eq-val="${slot}"]`);
      if (lbl) lbl.textContent = `${fmtNum(st[slot], v.step < 1 ? 1 : 0)} ${v.unit}`;
      const num = card.querySelector('.eq-num');
      if (num) num.innerHTML = `${fmtNum(res.value, res.value >= 100 ? 0 : 2)} <small>${esc(res.targetVar.unit)}</small>`;
      const bar = card.querySelector('.eq-meter i');
      if (bar) bar.style.width = `${res.pct}%`;
      card.classList.add('done');
    },
    simConcept(id, val) {
      const a = UNI_AREAS.find((x) => x.id === id);
      if (!a || !a.sim) return;
      const n = Number(val);
      const out = a.sim.eval(n);
      const vEl = $('#na-sim-val'); if (vEl) vEl.textContent = `${fmtNum(n, 0)}${a.sim.unit}`;
      const rEl = $('#na-sim-readout'); if (rEl) rEl.textContent = out.readout;
      const eEl = $('#na-sim-expr'); if (eEl) eEl.textContent = out.expr;
      const nEl = $('#na-sim-note'); if (nEl) nEl.textContent = out.note;
      const bEl = $('#na-sim-bar'); if (bEl) bEl.style.width = `${out.pct}%`;
    },
    toggleShortcut(id) {
      const p = loadProg();
      const i = p.shortcuts.indexOf(id);
      if (i >= 0) p.shortcuts.splice(i, 1); else p.shortcuts.push(id);
      saveProg(p);
      toast(i >= 0 ? 'Regra desmarcada.' : 'Regra marcada como dominada!');
      render();
    },
    openArea(id) {
      const a = UNI_AREAS.find((x) => x.id === id);
      if (!a) return;
      const done = loadProg().lessons.includes(a.id);
      const s = a.sim;
      const init = s.eval(s.val);
      showModal(`<div class="uni-vis-modal">
        <div class="uvm-top"><span class="eyebrow-t">NÚCLEO AMA · EXPLORADOR INTERATIVO</span><button type="button" class="uvm-x" onclick="UNI.closeModal()" aria-label="Fechar">✕</button></div>
        <h2 style="margin:6px 0 4px">${esc(a.titulo)}</h2>
        <p class="muted" style="margin:0 0 14px;font-size:13.5px">${esc(a.sub)}</p>
        <div class="uvm-art">${a.svg}</div>
        <div class="uvm-box"><b>1 · Cenário real</b><p>${esc(a.analogia)}</p></div>
        <div class="na-sim-box">
          <div class="na-sim-head">
            <span>2 · SIMULADOR MANIPULÁVEL</span>
            <strong>${esc(a.formula)}</strong>
          </div>
          <label class="na-sim-ctrl">
            <span>${esc(s.label)}</span>
            <em id="na-sim-val">${fmtNum(s.val, 0)}${esc(s.unit)}</em>
            <input type="range" min="${s.min}" max="${s.max}" step="${s.step}" value="${s.val}" oninput="UNI.simConcept('${a.id}',this.value)">
          </label>
          <div class="na-sim-out">
            <strong id="na-sim-readout">${esc(init.readout)}</strong>
            <span id="na-sim-expr">${esc(init.expr)}</span>
            <div class="eq-meter"><i id="na-sim-bar" style="width:${init.pct}%"></i></div>
            <small id="na-sim-note">${esc(init.note)}</small>
          </div>
        </div>
        <div class="uvm-sum"><b>Síntese:</b> ${esc(a.resumo)}</div>
        <div class="uvm-check">
          <span class="eyebrow-t">3 · DESAFIO RELÂMPAGO</span>
          <p class="uvm-q">${esc(a.pergunta)}</p>
          <div class="uvm-opts">${a.opcoes.map((o, idx) => `<button type="button" onclick="UNI.checkAreaAns('${a.id}',${idx},${a.certa},this)"><span>${'ABC'[idx]}</span>${esc(o)}</button>`).join('')}</div>
          <p class="uvm-exp" id="uvm-exp" hidden>${esc(a.exp)}</p>
        </div>
        <div class="flex" style="gap:8px;justify-content:space-between;flex-wrap:wrap;margin-top:16px">
          <button type="button" class="btn btn-o btn-sm" onclick="UNI.closeModal()">Fechar</button>
          <button type="button" class="btn ${done ? 'btn-o' : 'btn-p'} btn-sm" id="uvm-done-btn" onclick="UNI.markAreaDone('${a.id}')">${done ? '✓ Conceito concluído' : 'Marcar como concluído'}</button>
        </div>
      </div>`);
    },
    checkAreaAns(id, pick, right, btn) {
      const wrap = btn.closest('.uvm-opts');
      if (wrap) wrap.querySelectorAll('button').forEach((b, i) => {
        b.disabled = true;
        if (i === right) b.classList.add('ok');
        else if (i === pick) b.classList.add('bad');
      });
      const exp = $('#uvm-exp'); if (exp) exp.hidden = false;
      if (pick === right) {
        const p = loadProg();
        if (!p.lessons.includes(id)) { p.lessons.push(id); saveProg(p); }
        const db = $('#uvm-done-btn'); if (db) { db.textContent = '✓ Conceito concluído'; db.className = 'btn btn-p btn-sm'; }
        toast('Correto! Domínio local atualizado neste navegador.');
      }
    },
    markAreaDone(id) {
      const p = loadProg();
      if (!p.lessons.includes(id)) p.lessons.push(id);
      saveProg(p);
      this.closeModal();
      toast('Conceito marcado como concluído!');
      render();
    },
    resetProg() {
      if (!confirm('Limpar todo o domínio local do Laboratório AMA neste dispositivo?')) return;
      saveProg({ lessons: [], shortcuts: [], sims: [] });
      toast('Domínio local limpo.');
      render();
    },
    closeModal() {
      $$('.modal-scrim,.overlay,#overlay').forEach((e) => e.remove());
    },
    openHorario() {
      const d = load();
      const dias = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex'];
      const hojeIdx = new Date().getDay();
      const hojeDia = ['', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', ''][hojeIdx] || '';
      const mapa = Object.fromEntries(dias.map((k) => [k, []]));
      d.turmas.forEach((t) => {
        const dp = disc(d, t.disciplinaId);
        const escObj = escola(d, t.escolaId);
        String(t.horario || '').split('·').forEach((part) => {
          const m = part.trim().match(/^(Seg|Ter|Qua|Qui|Sex)\s+(.+)$/i);
          if (m) {
            const key = dias.find((x) => x.toLowerCase() === m[1].toLowerCase());
            if (key) mapa[key].push({ hora: m[2].trim(), turma: t, dp, escObj });
          }
        });
      });
      showModal(`<div class="uni-vis-modal">
        <div class="uvm-top"><span class="eyebrow-t">HORÁRIO SEMANAL · ${esc(d.semestre)}</span><button type="button" class="uvm-x" onclick="UNI.closeModal()" aria-label="Fechar">✕</button></div>
        <h2 style="margin:6px 0 4px">Agenda das turmas</h2>
        <p class="muted" style="margin:0 0 16px;font-size:13px">Gerado a partir das turmas guardadas neste navegador.${hojeDia ? ` Hoje é <b>${hojeDia}</b>.` : ''}</p>
        <div class="uvm-sched">
          ${dias.map((dia) => `<div class="uvm-day ${dia === hojeDia ? 'today' : ''}">
            <div class="uvm-day-h"><b>${dia}</b>${dia === hojeDia ? '<span>Hoje</span>' : ''}</div>
            ${mapa[dia].length ? mapa[dia].map((it) => `<a class="uvm-slot" href="${S.user ? '#/turma/' + it.turma.id : '#/entrar'}" onclick="UNI.closeModal()">
              <span class="uvm-time">${esc(it.hora)}</span>
              <div><b>${esc(it.dp.nome)}</b><small>${esc(it.turma.codigo)} · ${esc(it.turma.sala)} · ${esc(it.turma.docenteNome)}</small></div>
              <span class="uvm-esc">${esc(it.escObj.sigla)}</span>
            </a>`).join('') : '<p class="uvm-empty">Sem aulas agendadas</p>'}
          </div>`).join('')}
        </div>
        <div class="flex" style="justify-content:flex-end;margin-top:16px"><button type="button" class="btn btn-p btn-sm" onclick="UNI.closeModal()">Fechar</button></div>
      </div>`);
    },
    openProvas() {
      const d = load();
      const todas = [];
      d.turmas.forEach((t) => {
        const dp = disc(d, t.disciplinaId);
        (t.avaliacoes || []).forEach((a) => {
          const diff = Math.ceil((new Date(a.data + 'T12:00:00') - Date.now()) / DAY);
          todas.push({ ...a, turma: t, dp, diff });
        });
      });
      todas.sort((a, b) => String(a.data).localeCompare(String(b.data)));
      showModal(`<div class="uni-vis-modal">
        <div class="uvm-top"><span class="eyebrow-t">CALENDÁRIO DE PROVAS · ${todas.length} AVALIAÇÕES</span><button type="button" class="uvm-x" onclick="UNI.closeModal()" aria-label="Fechar">✕</button></div>
        <h2 style="margin:6px 0 4px">Frequências, trabalhos e exames</h2>
        <p class="muted" style="margin:0 0 16px;font-size:13px">Consolidado de todas as turmas locais. Registo de apoio — não substitui o calendário oficial da secretaria.</p>
        <div class="uvm-provas">
          ${todas.map((p) => `<div class="uvm-prova">
            <div class="uvm-p-date"><b>${p.data.slice(8, 10)}</b><span>${fmtDia(p.data).split(' ')[0]}</span></div>
            <div class="uvm-p-body">
              <div class="uvm-p-tags"><span class="pm-code">${esc(p.turma.codigo)}</span><span class="uvm-peso">${p.peso}%</span><span>${esc(p.tipo)}</span></div>
              <b>${esc(p.titulo)}</b>
              <small>${esc(p.dp.nome)} · ${esc(p.turma.sala)} · ${esc(p.turma.docenteNome)}</small>
            </div>
            <span class="uvm-due ${p.diff < 0 ? 'past' : p.diff <= 14 ? 'soon' : ''}">${p.diff < 0 ? 'Passada' : p.diff === 0 ? 'Hoje' : `Em ${p.diff}d`}</span>
          </div>`).join('') || '<p class="muted">Sem provas agendadas.</p>'}
        </div>
        <div class="flex" style="justify-content:flex-end;margin-top:16px"><button type="button" class="btn btn-p btn-sm" onclick="UNI.closeModal()">Fechar</button></div>
      </div>`);
    },
    openSearch() {
      showModal(`<div class="uni-vis-modal">
        <div class="uvm-top"><span class="eyebrow-t">PESQUISA RÁPIDA · UNIVERSIDADE</span><button type="button" class="uvm-x" onclick="UNI.closeModal()" aria-label="Fechar">✕</button></div>
        <div class="field" style="margin:10px 0 14px"><input id="uni-cmd-q" placeholder="Pesquisar disciplina, turma, fórmula, atalho ou prova…" oninput="UNI.searchFilter(this.value)" autofocus></div>
        <div class="uvm-res" id="uni-cmd-res"></div>
      </div>`);
      setTimeout(() => { const inp = $('#uni-cmd-q'); if (inp) { inp.focus(); UNI.searchFilter(''); } }, 30);
    },
    searchFilter(q) {
      const box = $('#uni-cmd-res'); if (!box) return;
      const term = norm(q || '');
      const d = load();
      const hits = [];
      UNI_AREAS.forEach((a) => {
        if (!term || norm(a.titulo + ' ' + a.sub + ' ' + a.formula).includes(term))
          hits.push({ kind: 'Conceito', titulo: a.titulo, sub: a.formula, act: `UNI.closeModal();UNI.openArea('${a.id}')` });
      });
      UNI_SIMS.forEach((sim) => {
        const v = sim.vars;
        if (!term || norm(sim.titulo + ' ' + sim.area + ' ' + v.a.name + ' ' + v.b.name + ' ' + v.c.name).includes(term))
          hits.push({ kind: 'Simulador', titulo: sim.titulo, sub: `${v.a.sym} = ${v.b.sym} × ${v.c.sym} · ${sim.area}`, act: `UNI.closeModal();UNI.labTab('sim');go('/universidade/ferramentas')` });
      });
      UNI_SHORTCUTS.forEach((sc) => {
        if (!term || norm(sc.titulo + ' ' + sc.expr + ' ' + sc.area).includes(term))
          hits.push({ kind: sc.tipo, titulo: sc.titulo, sub: sc.expr, act: `UNI.closeModal();UNI.labTab('sc');go('/universidade/ferramentas')` });
      });
      d.turmas.forEach((t) => {
        const dp = disc(d, t.disciplinaId);
        if (!term || norm(t.codigo + ' ' + dp.nome + ' ' + t.docenteNome + ' ' + t.sala).includes(term))
          hits.push({ kind: 'Turma ' + t.codigo, titulo: dp.nome, sub: `${t.horario} · ${t.sala}`, act: `UNI.closeModal();go('${S.user ? '/turma/' + t.id : '/entrar'}')` });
      });
      box.innerHTML = hits.slice(0, 12).map((h) => `<button type="button" class="uvm-hit" onclick="${h.act}"><span class="uvm-hit-k">${esc(h.kind)}</span><div><b>${esc(h.titulo)}</b><small>${esc(h.sub)}</small></div>${I.arrow}</button>`).join('') || '<p class="muted" style="padding:14px 0">Sem resultados para essa pesquisa.</p>';
    },

    /* navegação e formulários */
    tab(t) { U.tab = t; render(); },
    toggleForm(k) {
      const box = $('#uni-new');
      if (box) { box.hidden = !box.hidden; if (!box.hidden) box.scrollIntoView({ behavior: 'smooth', block: 'start' }); }
    },
    novaEscola() {
      const box = $('#uni-escola-form');
      if (box) { box.hidden = !box.hidden; if (!box.hidden) box.scrollIntoView({ behavior: 'smooth', block: 'start' }); }
    },
    criarEscola() {
      if (!podeLecionar()) return toast('Só docentes podem criar escolas.');
      const v = (id) => (($(id) || {}).value || '').trim();
      const nome = v('#ne-nome');
      if (nome.length < 3) return toast('Indique o nome da escola.');
      const d = load();
      d.escolas = d.escolas || [];
      d.escolas.push({ id: uid('e'), nome, sigla: (v('#ne-sigla') || nome.slice(0, 3)).toUpperCase(), local: v('#ne-local') || '—' });
      save(d); toast('Escola criada neste navegador.'); render();
    },
    addSessao(id) {
      const box = $('#uni-sess-form');
      if (box) { box.hidden = !box.hidden; if (!box.hidden) box.scrollIntoView({ behavior: 'smooth', block: 'center' }); }
    },
    entrar(id) {
      if (!S.user) return go('/entrar');
      const t = turma(id); if (!t) return toast('Turma não encontrada.');
      if (!(t.inscritos || []).includes(S.user.id)) t.inscritos.push(S.user.id);
      if (!t.alunos.some((n) => norm(n) === norm(S.user.nome))) t.alunos.push(S.user.nome);
      save(load());
      toast('Entrou na turma ' + t.codigo + '.');
      render();
    },
    entrarCodigo() {
      const el = $('#uni-code'); const code = norm(el ? el.value : '').replace(/\s+/g, '');
      if (!code) return toast('Escreva o código da turma.');
      const t = load().turmas.find((x) => norm(x.codigo) === code);
      if (!t) return toast('Código não encontrado neste navegador.');
      this.entrar(t.id);
    },
    criarTurma() {
      const v = (id) => (($(id) || {}).value || '').trim();
      const nome = v('#nt-disc'), cod = v('#nt-cod').toUpperCase(), turmaCod = v('#nt-turma').toUpperCase();
      if (nome.length < 3) return toast('Indique o nome da disciplina.');
      if (!turmaCod) return toast('Indique o código da turma.');
      if (load().turmas.some((t) => norm(t.codigo) === norm(turmaCod))) return toast('Já existe uma turma com esse código.');
      const d = load();
      const discId = uid('d');
      d.disciplinas.push({ id: discId, nome, codigo: cod || turmaCod, area: 'Geral', ects: Number(v('#nt-ects')) || 5, ano: Number(v('#nt-ano')) || 1 });
      const escolaId = v('#nt-escola') || (d.escolas && d.escolas[0] && d.escolas[0].id);
      d.turmas.push({
        id: uid('t'), codigo: turmaCod, disciplinaId: discId, semestre: d.semestre, escolaId,
        docenteId: S.user.id, docenteNome: v('#nt-doc') || S.user.nome,
        sala: v('#nt-sala') || 'A definir', horario: v('#nt-hor') || 'A definir',
        ano: Number(v('#nt-ano')) || 1, alunos: [], inscritos: [S.user.id], sessoes: [], materiais: [], avaliacoes: [],
      });
      save(d); toast('Turma criada.'); render();
    },
    guardarSessao(id) {
      const t = turma(id); if (!t) return;
      const v = (s) => (($(s) || {}).value || '').trim();
      const tema = v('#ns-tema'), resumo = v('#ns-res'), data = v('#ns-data'), ini = v('#ns-ini') || '10:00', fim = v('#ns-fim') || '12:00';
      if (tema.length < 4) return toast('Indique o tema da sessão.');
      t.sessoes.push({ id: uid('s'), data: data || hoje(), inicio: ini, fim, tema, resumo: resumo || tema, guiao: ['Abertura e chamada', 'Enquadramento: ' + tema, 'Exposição dialogada', 'Trabalho em pares', 'Síntese e próximos passos'], estado: 'planeada', presencas: {}, feito: [], passo: 0, notas: '' });
      save(load()); toast('Sessão criada.'); render();
    },
    verSessao(tid, sid) {
      if (podeLecionar()) return go('/lecionar/' + tid + '?sessao=' + sid);
      const t = turma(tid); const s = t && t.sessoes.find((x) => x.id === sid);
      if (!s) return;
      U.tab = 'sessoes';
      showModal(`<div class="page-h" style="border:0;margin-bottom:10px"><div><span class="eyebrow-t">GUIÃO DA SESSÃO</span><h2 style="margin-top:6px">${esc(s.tema)}</h2><p>${fmtLongo(s.data)} · ${esc(s.inicio)}–${esc(s.fim)} · ${esc(t.sala)}</p></div></div>
        <p style="color:var(--muted);font-size:13.5px;line-height:1.6">${esc(s.resumo)}</p>
        <div class="lec-steps" style="margin-top:18px">${(s.guiao || []).map((p, i) => `<div class="lec-step" style="border-color:var(--line)"><span class="no" style="color:var(--green)">${String(i + 1).padStart(2, '0')}</span><div><h3 style="color:var(--ink)">${esc(p)}</h3></div></div>`).join('')}</div>
        <div class="flex" style="gap:8px;margin-top:18px"><button class="btn btn-o" onclick="this.closest('.modal,.overlay,#overlay').remove();document.querySelectorAll('.modal-scrim').forEach(e=>e.remove())">Fechar</button><button class="btn btn-p" onclick="UNI.estudar('${t.id}','${s.id}')">${I.spark} Estudar este conteúdo</button></div>`);
    },
    materialInfo(titulo) { toast('Material de referência local: «' + titulo + '». Não há ficheiro anexado.'); },

    /* matérias: o docente publica, o estudante leva para o estudo */
    addMaterial(tid) {
      if (!podeLecionar()) return;
      const t = turma(tid); if (!t) return;
      U.tab = 'materiais'; U.turma = t.id;
      if (location.hash.indexOf('#/turma/') !== 0) go('/turma/' + tid);
      const box = $('#uni-mat-form');
      if (box) { box.hidden = !box.hidden; if (!box.hidden) box.scrollIntoView({ behavior: 'smooth', block: 'center' }); }
    },
    async guardarMaterial(tid) {
      if (!podeLecionar()) return toast('Só docentes podem publicar matérias.');
      const t = turma(tid); if (!t) return;
      const v = (id) => (($(id) || {}).value || '').trim();
      const titulo = v('#mt-titulo'), texto = v('#mt-texto');
      if (titulo.length < 3) return toast('Indique o título da matéria.');
      if (texto.length < 40) return toast('Escreva pelo menos 40 caracteres de conteúdo para estudo.');
      const inp = $('#mt-arquivo');
      const file = inp && inp.files && inp.files[0];
      let arquivo = null, nomeArquivo = '';
      if (file) {
        if (file.size > 180000) return toast('Ficheiro demasiado grande — o limite local é 180 KB.');
        arquivo = await new Promise((res) => {
          const r = new FileReader();
          r.onload = () => res(String(r.result || ''));
          r.onerror = () => res('');
          r.readAsDataURL(file);
        });
        nomeArquivo = file.name;
      }
      const enviar = !!($('#mt-enviar') && $('#mt-enviar').checked);
      t.materiais = t.materiais || [];
      t.materiais.push({
        id: uid('m'), titulo, tipo: v('#mt-tipo') || 'Resumo', nota: '',
        texto, arquivo: arquivo || null, nomeArquivo,
        enviado: enviar, enviadoEm: enviar ? new Date().toISOString() : null,
        autor: S.user.nome, disciplinaId: v('#mt-disc') || t.disciplinaId,
      });
      save(load());
      toast(enviar ? 'Matéria enviada para a turma.' : 'Matéria guardada como rascunho.');
      U.tab = 'materiais'; render();
    },
    enviarMaterial(tid, mid) {
      if (!podeLecionar()) return;
      const t = turma(tid); const m = t && (t.materiais || []).find((x) => x.id === mid); if (!m) return;
      m.enviado = m.enviado === false;
      m.enviadoEm = m.enviado ? new Date().toISOString() : null;
      save(load());
      toast(m.enviado ? 'Matéria enviada para a turma.' : 'Matéria retirada da turma.');
      render();
    },
    apagarMaterial(tid, mid) {
      if (!podeLecionar()) return;
      const t = turma(tid); if (!t) return;
      const m = (t.materiais || []).find((x) => x.id === mid); if (!m) return;
      if (!confirm('Apagar a matéria «' + m.titulo + '» desta turma?')) return;
      t.materiais = t.materiais.filter((x) => x.id !== mid);
      save(load()); toast('Matéria apagada.'); render();
    },
    estudarMaterial(tid, mid) {
      const t = turma(tid); if (!t) return;
      const m = (t.materiais || []).find((x) => x.id === mid); if (!m || m.enviado === false) return;
      const d = load(); const dp = disc(d, m.disciplinaId || t.disciplinaId);
      try {
        sessionStorage.setItem('ama-uni-prefill', JSON.stringify({
          title: m.titulo, subject: assuntoDe(dp),
          text: [m.titulo, m.texto || m.nota].filter(Boolean).join('. '),
        }));
      } catch { }
      go('/estudar');
      toast('Matéria aberta no formulário de estudo.');
    },
    apagarTurma(tid) {
      if (!podeLecionar()) return;
      const t = turma(tid); if (!t) return;
      if (!confirm('Apagar a turma ' + t.codigo + ' e todos os seus dados locais?')) return;
      const d = load(); d.turmas = d.turmas.filter((x) => x.id !== tid);
      save(d); toast('Turma apagada.'); go('/turmas');
    },

    /* prática Núcleo AMA por sessão */
    async praticaGerar(tid, sid) {
      const t = turma(tid); const s = t && t.sessoes.find((x) => x.id === sid); if (!s) return;
      const pronto = await esperarMotor();
      if (!pronto) return toast('O Núcleo AMA ainda não carregou. Recarregue a página e tente outra vez.');
      const A = window.AMAStudy;
      const d = load();
      const id = A.ingest({ title: s.tema, src: 'turma ' + t.codigo, subject: assuntoDe(disc(d, t.disciplinaId)), text: textoPratica(s) });
      if (!id) return toast('Sumário demasiado curto para gerar prática. Acrescente texto à sessão.');
      /* U.turma é o que diz ao separador para não se repor quando a vista monta:
         sem isto, vir da consola apagava o pedido e caíamos em 'Visão geral'. */
      U.turma = t.id; U.tab = 'pratica'; U.aberta = sid;
      const k = A.kit(tituloPratica(t, s));
      /* a consola de lecionação não tem separadores: depois de gerar, voltamos
         à turma para a prática ficar mesmo visível */
      if (location.hash.indexOf('#/lecionar/') === 0) go('/turma/' + tid); else render();
      toast(k ? `Núcleo AMA preparou ${k.cartões} cartões e ${k.perguntas} perguntas para esta sessão.` : 'Prática criada.');
    },
    async praticaToda(tid) {
      const t = turma(tid); if (!t) return;
      const pronto = await esperarMotor();
      if (!pronto) return toast('O Núcleo AMA ainda não carregou. Recarregue a página e tente outra vez.');
      const A = window.AMAStudy;
      const d = load(); const assunto = assuntoDe(disc(d, t.disciplinaId));
      let n = 0; let ultima = null;
      sessoesOrd(t).forEach((s) => {
        if (A.ingest({ title: s.tema, src: 'turma ' + t.codigo, subject: assunto, text: textoPratica(s) })) { n++; ultima = s.id; }
      });
      if (!n) return toast('Nenhuma sessão tem sumário suficiente para gerar prática.');
      U.tab = 'pratica'; U.aberta = ultima; render();
      const elegiveis = sessoesOrd(t).filter((s) => textoPratica(s).length >= 120).length;
      toast(n === 1 ? '1 ficha gerada pelo Núcleo AMA.' : `${n} fichas geradas pelo Núcleo AMA${elegiveis > n ? ` · ${elegiveis - n} sem texto suficiente` : ''}.`);
    },
    praticaVer(sid) { U.aberta = U.aberta === sid ? null : sid; render(); },
    verPratica(tid) { U.turma = tid; U.tab = 'pratica'; go('/turma/' + tid); },

    /* lecionação */
    marcar(tid, sid, nome, status, btn) {
      const t = turma(tid); const s = t && t.sessoes.find((x) => x.id === sid); if (!s) return;
      s.presencas = s.presencas || {};
      s.presencas[nome] = status;
      save(load());
      const row = btn.closest('.lec-att-row');
      if (row) row.querySelectorAll('button').forEach((b) => b.classList.remove('on', 'p', 'l', 'a'));
      btn.classList.add('on', status === 'present' ? 'p' : status === 'late' ? 'l' : 'a');
      const c = $('#lec-att-count'); if (c) c.textContent = resumoChamada(s, t);
    },
    todosPresentes(tid, sid) {
      const t = turma(tid); const s = t && t.sessoes.find((x) => x.id === sid); if (!s) return;
      s.presencas = s.presencas || {};
      t.alunos.forEach((n) => { s.presencas[n] = 'present'; });
      save(load());
      $$('#lec-att .lec-att-row').forEach((row) => {
        row.querySelectorAll('button').forEach((b) => b.classList.remove('on', 'p', 'l', 'a'));
        const b = row.querySelector('button'); if (b) b.classList.add('on', 'p');
      });
      const c = $('#lec-att-count'); if (c) c.textContent = resumoChamada(s, t);
      toast('Todos marcados como presentes.');
    },
    step(atual, dir) {
      if (!U.lec) return;
      const d = load(); const t = d.turmas.find((x) => x.id === U.lec.turma); const s = t && t.sessoes.find((x) => x.id === U.lec.sessao);
      if (!s) return;
      const passos = s.guiao || [];
      const next = Math.max(0, Math.min(passos.length - 1, Number(atual) + Number(dir)));
      s.passo = next;
      s.feito = Array.from({ length: next }, (_, i) => i);
      save(d);
      render();
    },
    terminarSessao(tid, sid) {
      const d = load(); const t = d.turmas.find((x) => x.id === tid); const s = t && t.sessoes.find((x) => x.id === sid);
      if (!s) return;
      s.estado = 'terminada'; s.passo = (s.guiao || []).length;
      save(d); toast('Sessão marcada como concluída.'); go('/turma/' + tid);
    },
    nota(sid, valor) {
      if (!U.lec) return;
      const d = load(); const t = d.turmas.find((x) => x.id === U.lec.turma); const s = t && t.sessoes.find((x) => x.id === sid);
      if (!s) return; s.notas = String(valor || '').slice(0, 4000); save(d);
    },
    fullscreen() {
      try {
        if (!document.fullscreenElement) document.documentElement.requestFullscreen?.();
        else document.exitFullscreen?.();
      } catch { toast('Este navegador não permitiu o ecrã inteiro.'); }
    },

    /* timer */
    _timerInit() {
      if (!U.lec) return;
      if (U.timerSess !== U.lec.sessao) { U.timerSess = U.lec.sessao; U.left = U.lec.duracao * 60; U.running = false; const b = $('#lec-tbtn'); if (b) b.textContent = 'Iniciar'; }
      this._paint();
      this._clear();
      U.timerId = setInterval(() => {
        if (!$('#lec-clock')) { this._clear(); return; }
        if (!U.running) return;
        U.left = Math.max(0, U.left - 1);
        this._paint();
      }, 1000);
    },
    _clear() { if (U.timerId) { clearInterval(U.timerId); U.timerId = null; } },
    _paint() {
      const el = $('#lec-clock'); if (el) el.textContent = fmtMin(U.left);
      const l = $('#lec-clock-lbl'); if (l) l.textContent = U.running ? 'a contar' : U.left === 0 ? 'terminado' : 'tempo de aula';
    },
    timer() {
      U.running = !U.running; const b = $('#lec-tbtn'); if (b) b.textContent = U.running ? 'Pausar' : 'Continuar'; this._paint();
    },
    timerReset() { U.running = false; U.left = (U.lec ? U.lec.duracao : 90) * 60; const b = $('#lec-tbtn'); if (b) b.textContent = 'Iniciar'; if (!$('#lec-clock')) return; this._clear(); this._timerInit(); this._paint(); },

    /* estudo + documentos */
    estudar(tid, sid) {
      const t = turma(tid); const s = t && t.sessoes.find((x) => x.id === sid); if (!s) return;
      const d = load(); const dp = disc(d, t.disciplinaId);
      try {
        sessionStorage.setItem('ama-uni-prefill', JSON.stringify({ title: s.tema, subject: assuntoDe(dp), text: textoPratica(s) }));
      } catch { }
      $$('.modal-scrim,.overlay').forEach((e) => e.remove());
      go('/estudar');
      toast('Conteúdo da sessão copiado para o formulário de estudo.');
    },
    doc(tipo, tid, sid) {
      const t = turma(tid); const s = t && t.sessoes.find((x) => x.id === sid); if (!s) return;
      if (!window.Study) return toast('O Núcleo AMA ainda está a carregar — tente outra vez.');
      const a = analiseDe(t, s);
      if (!a || a.insufficient) return toast('O sumário é curto para gerar o documento. Acrescente texto à sessão.');
      const S_ = window.Study;
      const d = load(); const dp = disc(d, t.disciplinaId);
      const meta = `<span>${esc(dp.nome)}</span><span>${esc(t.codigo)}</span><span>${esc(t.docenteNome)}</span><span>${fmtLongo(s.data)}</span>`;
      if (tipo === 'ficha') {
        const w = S_.worksheetFromAnalysis(a, { title: 'Ficha — ' + s.tema, subject: a.subject, count: 8, lang: 'pt' });
        if (!w) return toast('Não foi possível gerar a ficha.');
        const body = `<p class="note">${esc(w.instructions)}</p>` + w.sections.map((sec) => `<h2>${esc(sec.title)}</h2><p style="font-size:11.5px;color:#5a655e">${esc(sec.instructions)}</p><ol>
          ${sec.questions.map((q) => `<li><div class="q"><p>${esc(q.prompt)}</p><small>${q.points != null ? q.points + ' pts' : ''}</small></div>
            ${q.options && q.options.length ? `<div class="opts">${q.options.map((o, i) => `<span><b>${'ABCD'[i]}.</b> ${esc(o)}</span>`).join('')}</div>` : '<div class="lines"></div>'}</li>`).join('')}</ol>`).join('') +
          `<div class="key"><h2>Chave de resposta</h2><ol>${w.answerKey.map((k) => `<li><strong>${k.number}.</strong> ${esc(k.answer)}${k.explanation ? `<br><small>${esc(k.explanation)}</small>` : ''}</li>`).join('')}</ol>
          <p style="font-size:10.5px;color:#5a655e">Ficha gerada a partir do sumário da sessão. Reveja as respostas antes de usar em aula.</p></div>`;
        abrirDoc('AMA-ficha-' + t.codigo, docShell('Ficha de exercícios — ' + s.tema, meta + `<span>${w.total} perguntas · ${w.points} pontos</span>`, body));
      } else {
        const p = S_.lessonPlanFromAnalysis(a, { topic: s.tema, duration: minutosEntre(s.inicio, s.fim), lang: 'pt', className: t.codigo, date: s.data });
        if (!p) return toast('Não foi possível gerar o plano.');
        const body = `<div class="grid2"><section><h2>Objetivos</h2><ul>${p.objectives.map((o) => `<li>${esc(o)}</li>`).join('')}</ul></section>
          <section><h2>Materiais</h2><ul>${p.materials.map((m) => `<li>${esc(m)}</li>`).join('')}</ul></section></div>
          <h2>Sequência · ${p.duration} min</h2>
          ${p.timeline.map((x) => `<div class="plan-step"><b>${x.minutes} min</b><div><strong>${esc(x.title)}</strong><p>${esc(x.detail)}</p><p><em>${esc(x.teacherNote)}</em></p></div></div>`).join('')}
          <h2>Avaliação rápida</h2><ol>${p.assessment.map((x) => `<li>${esc(x.prompt)}<br><small style="color:#5a655e">${esc(x.answer)}</small></li>`).join('')}</ol>
          <div class="grid2"><section><h2>Apoio</h2><p style="font-size:12px">${esc(p.differentiation.support)}</p></section><section><h2>Desafio</h2><p style="font-size:12px">${esc(p.differentiation.challenge)}</p></section></div>`;
        abrirDoc('AMA-plano-' + t.codigo, docShell('Plano de aula — ' + s.tema, meta + `<span>${p.duration} min</span>`, body));
      }
    },
    csv(tid, sid) {
      const d = load(); const t = d.turmas.find((x) => x.id === tid); if (!t) return;
      const alvo = sid ? t.sessoes.filter((s) => s.id === sid) : t.sessoes;
      const sess = alvo.filter((s) => Object.keys(s.presencas || {}).length).map((s) => ({
        id: s.id, date: s.data, label: s.tema.slice(0, 60),
        entries: Object.entries(s.presencas).map(([name, status]) => ({ name, status })),
      }));
      if (!sess.length) return toast('Ainda não há chamada lançada nesta turma.');
      const S_ = window.Study;
      const csv = S_ && S_.attendanceCsv ? S_.attendanceCsv(sess, { lang: 'pt' }) : (() => {
        const rows = [['Data', 'Aula', 'Aluno', 'Estado']];
        sess.forEach((s) => s.entries.forEach((e) => rows.push([s.date, s.label, e.name, e.status])));
        return rows.map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\r\n');
      })();
      descarregar('AMA-chamada-' + t.codigo + (sid ? '-' + sid : '') + '.csv', '\ufeff' + csv, 'text/csv');
      toast('Chamada exportada em CSV.');
    },
    calendario(tid) {
      const t = turma(tid); if (!t) return;
      const S_ = window.Study;
      const eventos = t.sessoes.map((s) => ({ id: s.id, date: s.data, time: s.inicio, title: s.tema, type: 'event', subject: t.codigo, source: t.codigo }));
      t.avaliacoes.forEach((a) => eventos.push({ id: a.id, date: a.data, title: a.titulo, type: 'exam', subject: t.codigo, source: t.codigo }));
      const ics = S_ && S_.buildIcs ? S_.buildIcs({ events: eventos }) : '';
      if (!ics) return toast('O motor de calendário ainda está a carregar — tente novamente.');
      descarregar('AMA-' + t.codigo + '.ics', ics, 'text/calendar');
      toast('Calendário .ics gerado.');
    },

    /* palco 3D interativo do Núcleo AMA */
    _n3d: null,
    sync3D() {
      const cv = document.getElementById('nucleo-3d-canvas');
      if (!cv) {
        if (this._n3d) { try { this._n3d.destroy(); } catch { } this._n3d = null; }
        return;
      }
      if (this._n3d && this._n3d._canvas === cv) return;
      if (this._n3d) { try { this._n3d.destroy(); } catch { } this._n3d = null; }
      const mountNow = () => {
        const liveCv = document.getElementById('nucleo-3d-canvas');
        if (!liveCv || !window.Study || !window.Study.mountNucleo3D) return;
        const ctrl = window.Study.mountNucleo3D(liveCv, {
          initialMode: 'core',
          onSelectNode: (nodeId) => {
            const map = { matematica: 'mat', fisica: 'fis', algebra: 'alga', programacao: 'prog', financas: 'fin', comunicacao: 'com' };
            UNI.focus3DNode(map[nodeId] || 'mat');
          },
        });
        if (ctrl) { ctrl._canvas = liveCv; this._n3d = ctrl; }
      };
      if (window.Study && window.Study.mountNucleo3D) mountNow();
      else window.addEventListener('study-ready', mountNow, { once: true });
    },
    set3DMode(mode) {
      if (this._n3d) this._n3d.setMode(mode);
      document.querySelectorAll('[data-n3d-mode]').forEach((b) => b.classList.toggle('on', b.dataset.n3dMode === mode));
    },
    set3DExplode(val) {
      if (this._n3d) this._n3d.setExplode((Number(val) || 0) / 100);
    },
    set3DPreset(preset) {
      if (this._n3d) this._n3d.setPreset(preset);
    },
    toggle3DSpin() {
      if (!this._n3d) return;
      const spinning = this._n3d.toggleSpin();
      const btn = document.getElementById('n3d-spin-btn');
      if (btn) btn.classList.toggle('on', spinning);
    },
    focus3DNode(areaId) {
      const a = UNI_AREAS.find((x) => x.id === areaId) || UNI_AREAS[0];
      if (!a) return;
      const modeMap = { mat: 'wave', fis: 'gyro', alga: 'core', prog: 'matrix', fin: 'matrix', com: 'core' };
      if (this._n3d && modeMap[a.id]) this.set3DMode(modeMap[a.id]);
      const box = document.getElementById('n3d-inspector');
      if (!box) return;
      box.innerHTML = `<span class="eyebrow-t">NÓ SELECIONADO · ${esc(a.tag)}</span>
        <h3>${esc(a.titulo)}</h3>
        <p>${esc(a.analogia)}</p>
        <div class="n3d-formula">${esc(a.formula)}</div>
        <div class="n3d-node-picks">
          ${UNI_AREAS.map((x) => `<button type="button" class="${x.id === a.id ? 'on' : ''}" onclick="UNI.focus3DNode('${x.id}')">${esc(x.titulo)}</button>`).join('')}
        </div>
        <div class="n3d-insp-visual"><img src="${escAttr(a.img || 'media/nucleo-3d-hero.jpg?v=71')}" alt="${escAttr(a.titulo)}"></div>
        <div class="n3d-insp-foot">
          <button type="button" class="btn btn-p btn-sm" onclick="UNI.openArea('${a.id}')">Abrir Simulador</button>
          <a class="btn btn-o btn-sm" href="#/quiz">Quiz da Área</a>
        </div>`;
    },
  };

  /* modal estilizado reutilizando o overlay existente */
  function showModal(html) {
    $$('.modal-scrim,.overlay').forEach((e) => e.remove());
    const wrap = document.createElement('div');
    wrap.className = 'modal-scrim uni-modal-scrim';
    wrap.innerHTML = `<div class="uni-modal-box">${html}</div>`;
    wrap.addEventListener('click', (e) => { if (e.target === wrap) wrap.remove(); });
    document.body.appendChild(wrap);
  }

  /* Atalho Ctrl+K / Cmd+K na Universidade para abrir pesquisa rápida */
  document.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k' && /^#\/(universidade|escolas|turma)/.test(location.hash)) {
      e.preventDefault();
      UNI.openSearch();
    } else if (e.key === 'Escape') {
      $$('.uni-modal-scrim').forEach((x) => x.remove());
    }
  });

  window.UNI = UNI;
  window.AMA_UNI = { load, save, seed, taxa };
})();
