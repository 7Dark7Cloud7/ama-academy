/* AMA — Workshops, palestras e networking
   Eventos com inscrição, bilhete, endosso, lista de espera e sala de networking.
   Tudo local: vive em localStorage['ama-ws-v1']. Os pagamentos são simulação —
   não existe gateway nem dinheiro real; a lista de presenças é a das inscrições
   feitas neste navegador (mais os perfis de demonstração). */
(function () {
  'use strict';

  const KEY = 'ama-ws-v1';
  const DAY = 86400000;
  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const escAttr = esc;
  const money = (v) => new Intl.NumberFormat('pt-AO', { style: 'currency', currency: 'AOA', maximumFractionDigits: 0 }).format(v || 0).replace('AOA', 'Kz');
  const iso = (d) => { const x = new Date(d); return `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, '0')}-${String(x.getDate()).padStart(2, '0')}`; };
  const addDays = (n) => iso(Date.now() + n * DAY);
  const uid = (p) => p + Date.now().toString(36) + Math.random().toString(36).slice(2, 5);
  /* Iniciais em vez de glifo genérico: é assim que a lista "Quem vai" e o
     portão da sala já se mostram, e um rosto sem foto é só uma letra. */
  const inic = (n) => String(n || '').split(' ').filter(Boolean).map(w => w[0]).slice(0, 2).join('').toUpperCase();
  const fmtDia = (s) => {
    const d = new Date(String(s).slice(0, 10) + 'T12:00:00');
    return Number.isNaN(d.getTime()) ? '—' : d.toLocaleDateString('pt-AO', { weekday: 'short', day: '2-digit', month: 'short' });
  };
  const fmtLongo = (s) => {
    const d = new Date(String(s).slice(0, 10) + 'T12:00:00');
    return Number.isNaN(d.getTime()) ? '—' : d.toLocaleDateString('pt-AO', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  };
  const diaCurto = (s) => { const d = new Date(String(s).slice(0, 10) + 'T12:00:00'); return Number.isNaN(d.getTime()) ? '—' : String(d.getDate()).padStart(2, '0'); };
  const mesCurto = (s) => { const d = new Date(String(s).slice(0, 10) + 'T12:00:00'); return Number.isNaN(d.getTime()) ? '—' : d.toLocaleDateString('pt-AO', { month: 'short' }).replace('.', ''); };
  const diasPara = (s) => Math.round((new Date(String(s).slice(0, 10) + 'T12:00:00') - Date.now()) / DAY);

  /* ------------------------------------------------------------ vocabulário */
  const INTERESSES = ['oratória', 'liderança', 'inteligência emocional', 'IA', 'dados', 'automação',
    'vendas', 'negociação', 'marketing', 'marca pessoal', 'finanças', 'empreendedorismo',
    'recursos humanos', 'carreira', 'design', 'networking'];
  const PAPEIS = ['Estudante', 'Gestor de equipa', 'Empreendedor', 'Analista', 'Diretor', 'Docente', 'Freelancer', 'Recrutador', 'Marketing', 'Vendas'];
  const EMPRESAS = ['Banco Kwanza', 'Grupo Andamento', 'Luanda Labs', 'Rádio Muxima', 'Kiluanje Tech',
    'Sonango Logística', 'Editora Hawa', 'Clínica Nova Baía', 'Universidade Independente', 'Trabalho por conta própria'];

  /* Perfis de demonstração: servem para a sala de networking ter conversa.
     Estão marcados como demo e a UI diz isso mesmo. */
  const GENTE = [
    ['Ana Domingos', 'Diretora de Comunicação', 'Banco Kwanza', ['oratória', 'liderança', 'marca pessoal'], true],
    ['Bruno Kiala', 'Fundador', 'Luanda Labs', ['IA', 'empreendedorismo', 'networking'], true],
    ['Carla Neto', 'Gestora de Pessoas', 'Grupo Andamento', ['recursos humanos', 'liderança', 'inteligência emocional'], false],
    ['Daniel Mwanza', 'Analista de Dados', 'Kiluanje Tech', ['dados', 'IA', 'automação'], false],
    ['Edson Cassoma', 'Responsável Comercial', 'Sonango Logística', ['vendas', 'negociação', 'networking'], true],
    ['Filomena Baptista', 'Consultora de Marca', 'Editora Hawa', ['marketing', 'marca pessoal', 'design'], false],
    ['Gabriel Tavares', 'Estudante de Engenharia', 'Universidade Independente', ['IA', 'carreira', 'dados'], false],
    ['Helder Chipenda', 'Diretor Financeiro', 'Banco Kwanza', ['finanças', 'negociação', 'liderança'], true],
    ['Inês de Almeida', 'Psicóloga Organizacional', 'Clínica Nova Baía', ['inteligência emocional', 'recursos humanos'], false],
    ['Joana Kambanda', 'Head of Growth', 'Luanda Labs', ['marketing', 'dados', 'empreendedorismo'], false],
    ['Jorge Silva', 'Formador independente', 'Trabalho por conta própria', ['oratória', 'carreira', 'networking'], false],
    ['Lúcia Ferreira', 'Gerente de Loja', 'Grupo Andamento', ['vendas', 'liderança'], false],
    ['Manuel Chivukuvuku', 'Empreendedor', 'Kiluanje Tech', ['empreendedorismo', 'finanças', 'networking'], true],
    ['Marta Cassule', 'Recrutadora tecnológica', 'Sonango Logística', ['carreira', 'recursos humanos', 'dados'], false],
    ['Nelson Quissanga', 'Jornalista', 'Rádio Muxima', ['oratória', 'marketing', 'design'], false],
    ['Olga Ndala', 'Administradora', 'Editora Hawa', ['finanças', 'carreira'], false],
    ['Paulo Kiala', 'Desenvolvedor', 'Luanda Labs', ['IA', 'automação', 'dados'], false],
    ['Rita Mendes', 'Coordenador acadêmica', 'Universidade Independente', ['liderança', 'carreira', 'networking'], false],
    ['Sérgio Vondo', 'Gestor de projeto', 'Clínica Nova Baía', ['liderança', 'negociação'], false],
    ['Teresa Ngueve', 'Analista de mercado', 'Grupo Andamento', ['dados', 'marketing', 'finanças'], false],
    ['Ulisses Cabral', 'Técnico de som', 'Rádio Muxima', ['design', 'networking'], false],
    ['Vera Ferraz', 'Diretora acadêmica', 'Universidade Independente', ['liderança', 'recursos humanos', 'carreira'], true],
  ];

  /* ---------------------------------------------------------------- seed */
  function seed() {
    const palestrante = (nome, papel, organizacao, bio, opts = {}) => ({
      nome, papel, organizacao, bio, destaque: !!opts.destaque, vip: !!opts.vip,
      slots: opts.slots || 0, img: opts.img || '',
    });
    const eventos = [
      {
        id: 'w-palco', codigo: 'PALCO-114', titulo: 'Palco e presença: falar sem tremer',
        tipo: 'Workshop', area: 'Desenvolvimento Pessoal', data: addDays(9), hora: '14:00', durMin: 180,
        local: 'Luanda', sala: 'Auditório AMA · Bloco 2', formato: 'Presencial',
        vagas: 40, preco: 25000, nivel: 'Todos os níveis',
        resumo: 'Três horas de prática de palco com vídeo, improvisos e regressão individual. Cada participante sobe ao palco duas vezes e sai com um plano de 21 dias.',
        objetivos: ['Dominar a respiração e a postura nos primeiros 30 segundos', 'Construir um discurso com começo, meio e pedido', 'Gerir o erro ao vivo sem perder autoridade'],
        agenda: [
          ['14:00', 'Chegada e crachá', 'Bilhete verificado à entrada, café e troca de cartões.'],
          ['14:20', 'Aquecimento', 'Exercícios de voz e corpo em pares.'],
          ['15:00', 'Discurso em 90 segundos', 'Cada participante prepara e apresenta um micro-discorso.'],
          ['16:10', 'Palco com vídeo', 'Segunda apresentação gravada, com regressão individual.'],
          ['17:00', 'Plano de 21 dias', 'Saída com exercício diário e rede de prática.'],
          ['17:30', 'Networking', 'Conversa livre com os palestrantes e participantes.'],
        ],
        requisitos: ['Vontade de falar em público — não é preciso experiência', 'Roupa confortável', 'Telemóvel carregado (vamos gravar)'],
        materiais: ['Guião impresso de 90 segundos', 'Ficha de exercícios de voz', 'Gravação da sua apresentação'],
        gravacao: false, certificado: true,
        palestrantes: [
          palestrante('Prof. Adolfo Camacho', 'Oratória e Liderança', 'AMA — Aristides Miguel Academy', 'Formou mais de 400 profissionais em palco e comunicação executiva em Luanda.', { destaque: true, slots: 6 }),
          palestrante('Dra. Luísa Cardoso', 'Diretora de Comunicação', 'Banco Kwanza', 'Assessoria de imprensa e gestão de crise em sectores regulados há 15 anos.', { vip: true, slots: 2 }),
        ],
        topicos: [{ pergunta: 'Que parte quer ver mais a fundo?', opcoes: [['Gestão do medo', 11], ['Estrutura do discurso', 17], ['Linguagem corporal', 8], ['Perguntas difíceis', 5]] }],
      },
      {
        id: 'w-ia', codigo: 'IA-207', titulo: 'IA no trabalho de todos os dias',
        tipo: 'Workshop', area: 'Tecnologia', data: addDays(16), hora: '09:00', durMin: 240,
        local: 'Luanda', sala: 'Sala de Informática · Bloco 1', formato: 'Híbrido',
        vagas: 30, preco: 35000, nivel: 'Intermédio',
        resumo: 'Traga uma tarefa chata do seu trabalho e saia com ela automatizada. Trabalhamos com dados reais em folha de cálculo, prompts e revisão humana.',
        objetivos: ['Escolher o que vale a pena automatizar', 'Escrever instruções que um modelo cumpre', 'Rever e validar o resultado antes de usar'],
        agenda: [
          ['09:00', 'Check-in e setup', 'Ligamos o computador e partilhamos a tarefa escolhida.'],
          ['09:30', 'O mapa das tarefas', 'Decidir o que automatizar e o que nunca automatizar.'],
          ['11:00', 'Mão na massa', 'Cada participante constrói a sua automação com apoio.'],
          ['13:00', 'Pausa de almoço', 'Almoço rápido no refeitório — mesas mistas por sector.'],
          ['14:00', 'Mesa de demonstrações', 'Cada um mostra 3 minutos do que conseguiu.'],
          ['16:00', 'Rede e encerramento', 'Troca de contactos e próximos passos.'],
        ],
        requisitos: ['Portátil próprio', 'Conta de e-mail de trabalho', 'Uma tarefa real para trazer'],
        materiais: ['Lista de prompts do workshop', 'Folha de validação antes de publicar', 'Gravação da sessão (enviada depois)'],
        gravacao: true, certificado: true,
        palestrantes: [
          palestrante('Eng.ª Mei Lin Zhao', 'Programação e Dados', 'AMA — Aristides Miguel Academy', 'Engenheira de software especializada em automação e análise de dados reais.', { destaque: true, slots: 5 }),
          palestrante('Eng. Paulo Kiala', 'Arquiteto de software', 'Luanda Labs', 'Constrói pipelines de dados para retalho e logística em Angola.', { slots: 3 }),
        ],
        topicos: [{ pergunta: 'Com que ferramenta quer trabalhar?', opcoes: [['Folha de cálculo', 14], ['Aplicações internas', 6], ['Documentos e relatórios', 12], ['Atendimento ao cliente', 9]] }],
      },
      {
        id: 'w-vendas', codigo: 'VEN-118', titulo: 'Do primeiro contacto ao fecho',
        tipo: 'Workshop', area: 'Negócios', data: addDays(23), hora: '15:00', durMin: 150,
        local: 'Luanda', sala: 'Sala de Simulação · Bloco 2', formato: 'Presencial',
        vagas: 24, preco: 30000, nivel: 'Todos os níveis',
        resumo: 'Role-play de venda B2B com compradores difíceis. Cada participante faz três simulações gravadas e recebe argumento por argumento.',
        objetivos: ['Abrir conversa sem parecer vendedor', 'Tratar o preço como parte da conversa', 'Fechar com próximo passo combinado'],
        agenda: [
          ['15:00', 'Entrada e contexto', 'Cada um traz um produto ou serviço real.'],
          ['15:20', 'Argumento', 'Estrutura de abertura, qualificação e fecho.'],
          ['16:00', 'Simulações', 'Três rondas com compradores diferentes.'],
          ['17:15', 'Debrief', 'O que funcionou, o que travou, o que mudar.'],
          ['17:30', 'Networking', 'Cocktail com os palestrantes.'],
        ],
        requisitos: ['Um produto ou serviço seu para vender', 'Cartões de visita, se tiver'],
        materiais: ['Guia de objeções', 'Ficha de fecho', 'Gravação da sua simulação'],
        gravacao: false, certificado: true,
        palestrantes: [
          palestrante('Prof. Nelson Tavares', 'Vendas e Negociação', 'AMA — Aristides Miguel Academy', 'Vendedor B2B de topo no mercado angolano, do primeiro contacto ao fecho.', { destaque: true, slots: 4 }),
          palestrante('Sr. Edson Cassoma', 'Responsável Comercial', 'Sonango Logística', 'Compra e venda em contexto logístico; sabe dizer não.', { vip: true, slots: 2 }),
        ],
        topicos: [{ pergunta: 'Qual é a sua objeção mais frequente?', opcoes: [['Está caro', 19], ['Tenho de pensar', 7], ['Já trabalho com outro', 5], ['Agora não é altura', 11]] }],
      },
      {
        id: 'w-marca', codigo: 'MAR-005', titulo: 'Marca pessoal em 90 minutos',
        tipo: 'Palestra prática', area: 'Marketing', data: addDays(5), hora: '18:30', durMin: 90,
        local: 'Online', sala: 'Sala AMA (link após inscrição)', formato: 'Online',
        vagas: 200, preco: 0, nivel: 'Iniciante',
        resumo: 'Sessão aberta: o que uma marca pessoal é, o que não é, e as três decisões que fazem a diferença numa semana. Termina com sessão de perguntas.',
        objetivos: ['Escolher um posicionamento em uma frase', 'Definir os dois canais que valem a pena', 'Preparar o primeiro conteúdo segunda-feira'],
        agenda: [
          ['18:30', 'Entrada na sala', 'Liga-se pelo link que recebe no bilhete.'],
          ['18:40', 'Palestra', 'Três decisões, exemplos angolanos.'],
          ['19:40', 'Perguntas', 'Cada participante pode deixar uma pergunta escrita.'],
          ['20:00', 'Fim', 'Fica com a gravação durante 30 dias.'],
        ],
        requisitos: ['Ligação à internet', 'Caderno'],
        materiais: ['Modelo de posicionamento', 'Gravação da sessão (30 dias)'],
        gravacao: true, certificado: false,
        palestrantes: [
          palestrante('Profa. Sofia Almeida', 'Marketing Digital', 'AMA — Aristides Miguel Academy', 'Estrategista de conteúdo e anúncios com campanhas em 6 províncias.', { destaque: true, slots: 0 }),
        ],
        topicos: [{ pergunta: 'Sobre o que quer perguntas?', opcoes: [['Onde publicar', 22], ['Quanto custa', 9], ['Que conteúdo fazer', 31], ['Como medir', 12]] }],
      },
      {
        id: 'w-kwanza', codigo: 'KWA-031', titulo: 'Mesa redonda: poupar e investir em kwanzas',
        tipo: 'Mesa redonda', area: 'Finanças', data: addDays(30), hora: '17:00', durMin: 120,
        local: 'Luanda', sala: 'Terraço AMA · Talatona', formato: 'Presencial',
        vagas: 50, preco: 15000, nivel: 'Todos os níveis',
        resumo: 'Quatro vozes, perguntas do público e um jantar em pé depois. Falamos de inflação, prazo, risco e do que fazer com o salário no mês a mês.',
        objetivos: ['Entender o efeito do prazo e da inflação', 'Reconhecer produtos de poupança em kwanzas', 'Sair com três perguntas concretas para o banco'],
        agenda: [
          ['17:00', 'Receção', 'Credenciamento e bebida de boas-vindas.'],
          ['17:20', 'Mesa', 'Quatro intervenções de 12 minutos.'],
          ['18:10', 'Perguntas do público', 'Microfone aberto e perguntas escritas.'],
          ['19:00', 'Jantar em pé', 'Networking por mesas mistas.'],
        ],
        requisitos: ['Chegar antes das 17:15 para garantir lugar à mesa'],
        materiais: ['Resumo da mesa em PDF', 'Lista de produtos discutidos'],
        gravacao: true, certificado: false,
        palestrantes: [
          palestrante('Prof. Duarte Costa', 'Finanças Pessoais', 'AMA — Aristides Miguel Academy', 'Consultor financeiro focado em poupança e investimento em kwanzas.', { destaque: true, slots: 5 }),
          palestrante('Dr. Helder Chipenda', 'Diretor Financeiro', 'Banco Kwanza', 'Crédito e poupança em contexto de taxa de juro alta.', { vip: true, slots: 2 }),
          palestrante('Dra. Vera Ferraz', 'Diretora Acadêmica', 'Universidade Independente', 'Economia monetária e investigação sobre o kwanza.', { vip: true, slots: 1 }),
        ],
        topicos: [{ pergunta: 'Que pergunta quer fazer à mesa?', opcoes: [['Quanto poupar por mês', 28], ['Onde está o risco', 15], ['Moeda ou bens', 21], ['Quando começar', 17]] }],
      },
      {
        id: 'w-equipas', codigo: 'EQP-042', titulo: 'Inteligência emocional em equipas sob pressão',
        tipo: 'Workshop', area: 'Desenvolvimento Pessoal', data: addDays(3), hora: '09:00', durMin: 210,
        local: 'Luanda', sala: 'Sala 3 · Bloco 2', formato: 'Presencial',
        vagas: 18, preco: 40000, nivel: 'Avançado',
        resumo: 'Turma pequena e cheia. Casos reais de conflito em equipas angolanas, com papel e cena, e um acordo de equipa ao fim do dia.',
        objetivos: ['Reconhecer o próprio gatilho antes de reagir', 'Conduzir uma conversa difícil sem partir a relação', 'Escrever um acordo de equipa que se cumpre'],
        agenda: [
          ['09:00', 'Check-in', 'Turma fechada, 18 lugares.'],
          ['09:20', 'Mapa emocional', 'Onde a equipa trava.'],
          ['11:00', 'Cenas', 'Conflitos representados e revistos.'],
          ['14:00', 'Acordo', 'Cada participante escreve o seu.'],
          ['15:30', 'Encerramento', 'Compromissos e rede de apoio.'],
        ],
        requisitos: ['Gerir ou trabalhar numa equipa', 'Estar disponível o dia inteiro'],
        materiais: ['Roteiro de conversa difícil', 'Modelo de acordo de equipa'],
        gravacao: false, certificado: true,
        palestrantes: [
          palestrante('Profa. Ana Baptista', 'Inteligência Emocional', 'AMA — Aristides Miguel Academy', 'Psicóloga organizacional, facilita equipas de alta pressão há 12 anos.', { destaque: true, slots: 3 }),
        ],
        topicos: [{ pergunta: 'Qual é o conflito mais frequente na sua equipa?', opcoes: [['Prazos', 13], ['Feedback', 9], ['Tarefas mal divididas', 16], ['Sobrecarga', 20]] }],
      },
    ];

    /* Inscrições de demonstração — distribuídas pelos eventos. */
    const inscricoes = [];
    eventos.forEach((ev, ei) => {
      const n = ev.id === 'w-equipas' ? GENTE.length : Math.min(ev.vagas - (ei % 3 === 0 ? 6 : 3), 14 + ei * 2);
      for (let i = 0; i < n; i++) {
        const g = GENTE[(i * 5 + ei * 3) % GENTE.length];
        if (inscricoes.some(x => x.eventoId === ev.id && x.nome === g[0])) continue;
        inscricoes.push({
          id: uid('i'), eventoId: ev.id, nome: g[0], papel: g[1], empresa: g[2], interesses: g[3],
          estado: 'confirmada', demo: true, criado: new Date(Date.now() - (i + 1) * 3600000).toISOString(),
          pagamento: { metodo: ev.preco ? 'MULTICAIXA Express' : 'Gratuito', valor: ev.preco, estado: ev.preco ? 'pago (simulação)' : 'gratuito', referencia: ev.preco ? ref() : '—' },
          bilhete: bilheteCodigo(ev, inscricoes.length + 1), lugar: inscricoes.length + 1, checkin: false,
        });
      }
    });
    /* Lugares 1:1 já ocupados (demonstração). */
    const pedidos = [];
    eventos.forEach((ev) => {
      ev.palestrantes.forEach((p) => {
        for (let s = 1; s <= p.slots; s++) {
          if ((s + p.nome.length) % 3 === 0) pedidos.push({ id: uid('p'), eventoId: ev.id, palestrante: p.nome, slot: s, quem: GENTE[(s + p.nome.length) % GENTE.length][0], tema: 'Conversar sobre o meu próximo passo', estado: 'confirmado', criado: new Date().toISOString() });
        }
      });
    });
    return { eventos, inscricoes, pedidos, endossos: [], contactos: [], votos: {}, notas: [], eu: null, criado_em: new Date().toISOString() };
  }

  function ref() { return String(Math.floor(100000000 + Math.random() * 899999999)); }
  function bilheteCodigo(ev, n) {
    const base = ev.codigo.replace(/[^A-Z0-9]/g, '');
    return 'AMA-' + base + '-' + String(100 + n * 7).slice(-3) + String(Math.floor(Math.random() * 90) + 10);
  }

  /* --------------------------------------------------------------- store */
  function load() {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) { const d = JSON.parse(raw); if (d && Array.isArray(d.eventos) && d.eventos.length) return d; }
    } catch { }
    const d = seed(); save(d); return d;
  }
  function save(d) { try { localStorage.setItem(KEY, JSON.stringify(d)); } catch { toast('Não foi possível guardar neste navegador.'); } }
  const ev = (id) => load().eventos.find(x => x.id === id);
  const lista = (d, id) => d.inscricoes.filter(x => x.eventoId === id && x.estado !== 'cancelada');
  const confirmadas = (d, id) => lista(d, id).filter(x => x.estado === 'confirmada');
  const espera = (d, id) => lista(d, id).filter(x => x.estado === 'lista de espera');
  const restantes = (d, id) => { const e = d.eventos.find(x => x.id === id); return Math.max(0, e.vagas - confirmadas(d, id).length); };
  const emEspera = (d, id) => restantes(d, id) === 0;
  /* Uma conversa libertada volta a ficar livre para outra pessoa: os sítios que
     contam vagas tratam 'cancelado' como pedido ativo, por isso a lista activa
     vive aqui em vez de estar repetida com um `!== 'recusado'` em cada template. */
  const conversas = (d, id, nome) => d.pedidos.filter(x => x.eventoId === id && x.estado === 'confirmado' && (!nome || x.palestrante === nome));
  function meuBilhete(d, id) {
    const eu = nomeEu(d); if (!eu) return null;
    return d.inscricoes.find(x => x.eventoId === id && x.nome === eu && x.estado !== 'cancelada') || null;
  }
  function nomeEu(d) {
    if (window.S && S.user && S.user.nome) return S.user.nome;
    return d.eu && d.eu.nome ? d.eu.nome : null;
  }
  function euPerfil(d) {
    const u = window.S && S.user;
    if (u) return { nome: u.nome, email: u.email || '', papel: u.papel === 'INSTRUCTOR' ? 'Docente' : u.papel === 'ADMIN' ? 'Gestor de equipa' : 'Estudante', empresa: 'AMA', interesses: ['oratória', 'carreira', 'networking'] };
    return d.eu || { nome: '', email: '', papel: '', empresa: '', interesses: [] };
  }
  function matchScore(perfil, pessoa) {
    if (!perfil || !perfil.interesses || !perfil.interesses.length) return { pontos: 0, porque: [] };
    const comum = perfil.interesses.filter(i => (pessoa.interesses || []).includes(i));
    const mesmaArea = perfil.empresa && pessoa.empresa === perfil.empresa;
    const pontos = comum.length * 30 + (pessoa.destaque ? 20 : 0) + (mesmaArea ? 10 : 0);
    const porque = comum.length ? ['partilham ' + comum.length + ' interesse' + (comum.length > 1 ? 's' : '') + ': ' + comum.join(', ')] : [];
    if (pessoa.destaque) porque.push('convidado de honra');
    if (mesmaArea) porque.push('mesma organização');
    return { pontos: Math.min(99, pontos), porque };
  }

  /* ================================================================= vistas */
  const chip = (t) => `<span class="ws-chip">${esc(t)}</span>`;
  const estadoBadge = (e) => {
    const dias = diasPara(e.data);
    if (dias < 0) return `<span class="ws-badge past">evento passado</span>`;
    if (emEspera(load(), e.id)) return `<span class="ws-badge full">esgotado</span>`;
    if (dias <= 3) return `<span class="ws-badge soon">faltam ${dias} dia${dias === 1 ? '' : 's'}</span>`;
    return `<span class="ws-badge open">${restantes(load(), e.id)} lugares</span>`;
  };
  const dataBloco = (e) => `<div class="ws-date"><b>${diaCurto(e.data)}</b><span>${esc(mesCurto(e.data))}</span><i>${esc(e.hora)}</i></div>`;

  on('/workshops', async () => {
    const d = load();
    const hoje = Date.now();
    const prox = d.eventos.filter(e => new Date(e.data + 'T23:59') >= new Date()).sort((a, b) => a.data.localeCompare(b.data));
    const passados = d.eventos.filter(e => new Date(e.data + 'T23:59') < new Date());
    const areas = [...new Set(d.eventos.map(e => e.area))];
    const formatos = [...new Set(d.eventos.map(e => e.formato))];
    const f = WS.f;
    /* O texto procurado não é só o título: quem escreve "oratória" ou "kwanzas"
       espera encontrar o evento onde esse tema se discute, não uma mensagem vazia. */
    const texto = (e) => (e.titulo + ' ' + e.codigo + ' ' + e.area + ' ' + e.tipo + ' ' +
      e.formato + ' ' + e.nivel + ' ' + e.local + ' ' + e.resumo + ' ' +
      e.objetivos.join(' ') + ' ' + e.agenda.map(a => a[1] + ' ' + a[2]).join(' ') + ' ' +
      e.palestrantes.map(p => p.nome + ' ' + p.papel).join(' ')).toLowerCase();
    const filtrados = prox.filter(e =>
      (!f.area || e.area === f.area) &&
      (!f.formato || e.formato === f.formato) &&
      (!f.preco || (f.preco === 'gratis' ? e.preco === 0 : e.preco > 0)) &&
      (!f.q || texto(e).includes(f.q.toLowerCase())));
    const totalLugares = d.eventos.reduce((n, e) => n + e.vagas, 0);
    const confirmados = d.inscricoes.filter(x => x.estado === 'confirmada').length;

    return shellPublic(`
    <section class="ws-hero hub-hero"><div class="in">
      <div class="hub-copy">
        <h1>Encontros que não acabam <span class="hl hl-u">na sala.</span></h1>
        <p>Workshops em Luanda e online. Inscreva-se, pague em kwanzas (simulação local) e receba o seu bilhete. No networking, descubra quem vai antes do café.</p>
        <div class="cta" style="display:flex;gap:10px;flex-wrap:wrap;margin-top:26px">
          <a class="btn btn-p btn-lg" href="#ws-events" onclick="event.preventDefault();document.getElementById('ws-events').scrollIntoView({behavior:matchMedia('(prefers-reduced-motion:reduce)').matches?'auto':'smooth'})">Explorar workshops ${I.arrow}</a>
          <a class="btn btn-f btn-lg" href="#/workshops/criar">${I.plus} Publicar workshop</a>
          <a class="btn btn-o btn-ghost-d btn-lg" href="#/meus-bilhetes">Os meus bilhetes</a>
        </div>
      </div>
      <figure class="hub-art"><img src="media/live-host-v2.jpg" alt="Apresentador numa sessão de aprendizagem" decoding="async"><figcaption>Conhecimento que aproxima pessoas.</figcaption></figure>
      <div class="ws-facts">
        <div><b data-count="${d.eventos.length}">${d.eventos.length}</b><span>eventos no calendário</span></div>
        <div><b data-count="${totalLugares}">${totalLugares}</b><span>lugares abertos</span></div>
        <div><b data-count="${confirmados}">${confirmados}</b><span>inscrições neste navegador</span></div>
        <div><b data-count="${d.eventos.reduce((n, e) => n + e.palestrantes.filter(p => p.vip).length, 0)}">${d.eventos.reduce((n, e) => n + e.palestrantes.filter(p => p.vip).length, 0)}</b><span>convidados de honra</span></div>
      </div>
    </div></section>

    <section class="ws-section" id="ws-events">
      <div class="ws-bar">
        <div class="search">${I.search}<input id="ws-q" placeholder="Procurar tema ou palestrante…" value="${escAttr(f.q)}" oninput="WS.buscar(this.value)"></div>
        <select id="ws-area" onchange="WS.filtre('area', this.value)"><option value="">Todas as áreas</option>${areas.map(a => `<option ${f.area === a ? 'selected' : ''}>${esc(a)}</option>`).join('')}</select>
        <select id="ws-for" onchange="WS.filtre('formato', this.value)"><option value="">Presencial e online</option>${formatos.map(a => `<option ${f.formato === a ? 'selected' : ''}>${esc(a)}</option>`).join('')}</select>
        <div class="ws-seg">
          <button class="${!f.preco ? 'on' : ''}" onclick="WS.filtre('preco','')">Todos</button>
          <button class="${f.preco === 'gratis' ? 'on' : ''}" onclick="WS.filtre('preco','gratis')">Grátis</button>
          <button class="${f.preco === 'pago' ? 'on' : ''}" onclick="WS.filtre('preco','pago')">Pagos</button>
        </div>
      </div>

      ${filtrados.length ? `<div class="ws-grid">${filtrados.map(e => wsCard(e, d)).join('')}</div>`
      : `<div class="empty"><h3>Nada com esses filtros</h3><p>Limpe a pesquisa ou veja todos os eventos.</p><button class="btn btn-p" onclick="WS.limpar()">Ver todos</button></div>`}

      ${passados.length ? `<h2 class="section-title" style="margin:44px 0 14px">Já aconteceram</h2>
      <div class="ws-past">${passados.map(e => `<a href="#/workshop/${e.id}"><b>${esc(e.titulo)}</b><span>${esc(fmtDia(e.data))} · ${confirmadas(d, e.id).length} participantes</span></a>`).join('')}</div>` : ''}
    </section>

    <section class="ws-section ws-how">
      <span class="eyebrow-t">${I.users} COMO FUNCIONA</span>
      <h2 class="section-title" style="margin:8px 0 0;max-width:22ch">Do bilhete ao contacto<br>trocado em três minutos</h2>
      <div class="ws-flow">
        <article><span class="ws-n">1</span><h3>Escolha e bilhete</h3><p>Vagas, preço e palestrantes à vista. A inscrição gera um código de entrada e, se estiver cheio, entra em lista de espera com a sua posição.</p></article>
        <article><span class="ws-n">2</span><h3>Veja quem vai</h3><p>Lista de confirmados por papel e organização, convidados de honra marcados e perfis com interesses parecidos aos seus.</p></article>
        <article><span class="ws-n">3</span><h3>Fale antes</h3><p>Pediu 1:1 com um palestrante, vota o tema da sessão de perguntas e troca cartões digitais. Depois do evento recebe a lista de follow-up.</p></article>
      </div>
    </section>

    <section class="ws-section">
      <div class="grid g-3">
        <article class="card uni-home-card"><i>01</i><h3>Pagamento simulado</h3><p>MULTICAIXA Express e Unitel Money aparecem como referência gerada neste dispositivo. Nenhum valor real é movido e nada é enviado para fora.</p></article>
        <article class="card uni-home-card"><i>02</i><h3>Quem vai = inscrições locais</h3><p>A contagem vem das inscrições guardadas neste navegador, mais perfis de demonstração claramente marcados. Não há lista oficial da secretaria.</p></article>
        <article class="card uni-home-card"><i>03</i><h3>Notas viram estudo</h3><p>O que escrever depois do workshop passa pelo motor local e volta como cartões de revisão, ficha e plano de aplicação.</p></article>
      </div>
    </section>`, 'workshops');
  });

  function wsCard(e, d) {
    const rest = restantes(d, e.id);
    const conf = confirmadas(d, e.id).length;
    const pct = Math.round(conf / e.vagas * 100);
    const destaque = e.palestrantes.find(p => p.destaque) || e.palestrantes[0];
    const vips = e.palestrantes.filter(p => p.vip).length;
    return `<article class="ws-card rv">
      <a class="ws-top" href="#/workshop/${e.id}">
        ${dataBloco(e)}
        <div class="ws-head">
          <div class="ws-tags">${chip(e.tipo)}${chip(e.formato)}${vips ? `<span class="ws-chip vip">${I.star} ${vips} de honra</span>` : ''}</div>
          <h3>${esc(e.titulo)}</h3>
          <p>${esc(e.resumo)}</p>
        </div>
      </a>
      <div class="ws-body">
        <div class="ws-seat"><div class="ws-bar-line"><i style="width:${pct}%"></i></div><small>${conf}/${e.vagas} lugares tomados</small></div>
        <div class="ws-foot">
          <div class="ws-spoke">${I.profile}<span><b>${esc(destaque.nome)}</b><small>${esc(destaque.papel)}</small></span></div>
          <div class="ws-price">${e.preco ? money(e.preco) : '<b>Grátis</b>'}</div>
        </div>
        <div class="ws-act">
          ${estadoBadge(e)}
          <a class="btn ${rest || e.preco === 0 ? 'btn-p' : 'btn-o'} btn-sm" href="#/workshop/${e.id}">${rest ? 'Ver e inscrever' : 'Lista de espera'} ${I.arrow}</a>
        </div>
      </div>
    </article>`;
  }

  on('/workshop/:id', async ({ args }) => {
    const d = load(); const e = d.eventos.find(x => x.id === args.id);
    if (!e) return shellPublic('<div class="empty"><h3>Evento não encontrado</h3><a class="btn btn-p" href="#/workshops">Ver workshops</a></div>', 'workshops');
    const rest = restantes(d, e.id);
    const conf = confirmadas(d, e.id).length;
    const bil = meuBilhete(d, e.id);
    const vips = e.palestrantes.filter(p => p.vip);
    const slotsLivres = e.palestrantes.reduce((n, p) => n + Math.max(0, p.slots - conversas(d, e.id, p.nome).length), 0);
    const dias = diasPara(e.id ? e.data : '');
    const passado = new Date(e.data + 'T23:59') < new Date();

    return shellPublic(`
    <section class="ws-detail ${passado ? 'past' : ''}">
      <div class="ws-dhead">
        <a class="ws-back" href="#/workshops">${I.back} Todos os workshops</a>
        <div class="ws-tags">${chip(e.tipo)}${chip(e.area)}${chip(e.formato)}${chip(e.nivel)}</div>
        <h1>${esc(e.titulo)}</h1>
        <p class="ws-lede">${esc(e.resumo)}</p>
        <div class="ws-meta">
          <span>${I.calendar}<b>${esc(fmtLongo(e.data))}</b></span>
          <span>${I.clock}${esc(e.hora)} · ${e.durMin} min</span>
          <span>${I.mega}${esc(e.sala)}${e.local !== 'Luanda' ? ' · ' + esc(e.local) : ''}</span>
          <span>${I.users}${conf} confirmados de ${e.vagas}</span>
          ${e.certificado ? `<span>${I.cert} com certificado</span>` : ''}
          ${e.gravacao ? `<span>${I.cam} com gravação</span>` : ''}
        </div>
        <div class="ws-buy">
          <div class="ws-price-lg">${e.preco ? money(e.preco) : '<b>Entrada livre</b>'}</div>
          ${bil ? `<a class="btn btn-f btn-lg" href="#/meus-bilhetes">O meu bilhete ${I.arrow}</a>`
            : passado ? `<span class="ws-note">Inscrições encerradas — veja a gravação na biblioteca.</span>`
              : `<a class="btn btn-f btn-lg" href="#/workshop/${e.id}/inscrever">${rest ? 'Inscrever-me' : 'Entrar na lista de espera'} ${I.arrow}</a>`}
          <button class="btn btn-o btn-lg" onclick="WS.partilhar('${escAttr(e.id)}')">${I.globe} Partilhar</button>
          <button class="btn btn-o btn-lg" onclick="WS.ics('${escAttr(e.id)}')">${I.calendar} Calendário</button>
        </div>
        ${passado ? '' : `<div class="ws-urg">${emEspera(d, e.id)
          ? `<span>${I.users} Esgotado.</span> Há ${espera(d, e.id).length} pessoas na lista de espera; libertamos lugares por ordem quando alguém cancela.`
          : `<span>${I.check} ${rest} de ${e.vagas} lugares livres.</span> ${slotsLivres ? ` ${slotsLivres} conversa${slotsLivres > 1 ? 's' : ''} 1:1 ainda por reservar.` : ''}`}</div>`}
      </div>

      <div class="ws-cols">
        <div class="ws-main">
          <h2 class="ws-h">O que leva para casa</h2>
          <ul class="ws-list">${e.objetivos.map(o => `<li>${I.check}<span>${esc(o)}</span></li>`).join('')}</ul>

          <h2 class="ws-h">Agenda minuto a minuto</h2>
          <div class="ws-agenda">${e.agenda.map(([h, t, x]) => `<div class="ws-agg"><b>${esc(h)}</b><div><strong>${esc(t)}</strong><p>${esc(x)}</p></div></div>`).join('')}</div>

          <h2 class="ws-h">Quem fala</h2>
          <div class="ws-spokes">${e.palestrantes.map(p => {
            const tomados = conversas(d, e.id, p.nome).length;
            const livres = Math.max(0, p.slots - tomados);
            return `<article class="sp-card ${p.vip ? 'vip' : ''}">
              <span class="sp-face">${esc(inic(p.nome))}</span>
              <div class="sp-in">
                <div class="sp-name"><b>${esc(p.nome)}</b>${p.vip ? `<span class="sp-vip">${I.star} convidado de honra</span>` : p.destaque ? '<span class="sp-lead">organiza</span>' : ''}</div>
                <small>${esc(p.papel)} · ${esc(p.organizacao)}</small>
                <p>${esc(p.bio)}</p>
                ${p.slots ? `<div class="sp-slot">${I.chat}<b>${livres}</b> de ${p.slots} conversas de 10 min livres</div>
                  <a class="btn btn-o btn-sm" href="#/workshop/${e.id}/network">Pedir 1:1 ${I.arrow}</a>` : ''}
              </div></article>`; }).join('')}</div>

          ${e.topicos.length ? `<h2 class="ws-h">A sessão de perguntas é sua</h2>
            <div class="ws-polls">${e.topicos.map((t, ti) => {
              const total = t.opcoes.reduce((n, [, v]) => n + v, 0);
              const meu = d.votos[e.id + ':' + ti];
              return `<div class="poll"><p><b>${esc(t.pergunta)}</b><small>${total} votos${meu != null ? ' · o seu voto conta' : ''}</small></p>
                ${t.opcoes.map(([txt, v], oi) => `<button class="poll-opt ${meu === oi ? 'on' : ''}" onclick="WS.votar('${escAttr(e.id)}',${ti},${oi})">
                  <span class="poll-fill" style="width:${total ? Math.round(v / total * 100) : 0}%"></span><b>${esc(txt)}</b><i>${v}</i></button>`).join('')}</div>`;
            }).join('')}</div>` : ''}

          <h2 class="ws-h">Antes de vir</h2>
          <div class="grid g-2" style="gap:18px">
            <div class="ws-box"><h4>Requisitos</h4><ul>${e.requisitos.map(r => `<li>${esc(r)}</li>`).join('')}</ul></div>
            <div class="ws-box"><h4>Recebe</h4><ul>${e.materiais.map(r => `<li>${esc(r)}</li>`).join('')}</ul></div>
          </div>
        </div>

        <aside class="ws-side">
          <div class="ws-side-box">
            <h4>Quem vai</h4>
            <p class="muted" style="font-size:12px">${conf} inscrições confirmadas neste navegador.</p>
            <div class="ws-people">${lista(d, e.id).slice(0, 8).map(x => `<div class="ws-person"><span class="av">${esc(x.nome.split(' ').map(w => w[0]).slice(0, 2).join(''))}</span><div><b>${esc(x.nome)}</b><small>${esc(x.papel)} · ${esc(x.empresa)}${x.demo ? ' · <i>demo</i>' : ''}</small></div></div>`).join('')}</div>
            ${vips.length ? `<div class="ws-honour"><h5>${I.star} Mesa de honra</h5>${vips.map(p => `<b>${esc(p.nome)}</b><small>${esc(p.papel)}, ${esc(p.organizacao)}</small>`).join('<br>')}</div>` : ''}
            <a class="btn btn-o btn-sm" style="width:100%;justify-content:center;margin-top:12px" href="#/workshop/${e.id}/network">Sala de networking ${I.arrow}</a>
          </div>
          <div class="ws-side-box">
            <h4>Endosso</h4>
            <p style="font-size:12.5px" class="muted">Quem já tem bilhete pode endossar até 2 pessoas: o código dá lugar reservado e 25% de desconto.</p>
            ${bil ? `<button class="btn btn-p btn-sm" style="width:100%;justify-content:center" onclick="WS.endosso('${escAttr(e.id)}')">Gerar código de endosso</button>`
              : `<p style="font-size:12.5px" class="muted">Precisa de um bilhete primeiro.</p>`}
            <div id="ws-endosso-out">${d.endossos.filter(x => x.eventoId === e.id && x.de === nomeEu(d)).map(x => `<div class="ws-code"><b>${esc(x.codigo)}</b><small>${x.estado === 'usado' ? 'usado por ' + esc(x.para || '—') : 'livre · partilhe este código'}</small></div>`).join('')}</div>
          </div>
          <div class="ws-side-box ws-honest">
            <h4>${I.shield} O que é real aqui</h4>
            <p>Inscrições, bilhetes, votos e endossos vivem neste navegador. O pagamento gera uma referência de demonstração — não contacta nenhum gateway.</p>
          </div>
        </aside>
      </div>
    </section>`, 'workshops');
  });

  /* ------------------------------------------------------- inscrição (3 passos) */
  on('/workshop/:id/inscrever', async ({ args }) => {
    const d = load(); const e = d.eventos.find(x => x.id === args.id);
    if (!e) return shellPublic('<div class="empty"><h3>Evento não encontrado</h3><a class="btn btn-p" href="#/workshops">Ver workshops</a></div>', 'workshops');
    if (new Date(e.data + 'T23:59') < new Date()) { toast('As inscrições deste evento estão encerradas.'); return go('/workshop/' + e.id); }
    const bil = meuBilhete(d, e.id);
    if (bil) { toast('Já tem bilhete para este evento.'); return go('/meus-bilhetes'); }
    /* trocar de evento recomeça o formulário — senão o passo 3 do evento anterior
       ficava à frente com um bilhete que não é daqui */
    if (WS.evento !== e.id) { WS.evento = e.id; WS.passo = 1; WS.endossoUsado = null; WS.ultimo = null; }
    const p = euPerfil(d);
    const passo = WS.passo;
    const cheio = emEspera(d, e.id);
    const pos = espera(d, e.id).length + 1;

    const steps = `<div class="ws-steps">${['Os seus dados', 'Pagamento', 'Bilhete'].map((t, i) => `<div class="ws-step ${passo > i ? 'done' : ''} ${passo === i + 1 ? 'on' : ''}"><span>${passo > i ? I.check : i + 1}</span>${esc(t)}</div>`).join('')}</div>`;

    let corpo = '';
    if (passo === 1) {
      corpo = `<div class="ws-form">
        <div class="grid g-2" style="gap:14px">
          <div class="field"><label>Nome completo</label><input id="ws-nome" value="${escAttr(p.nome)}" placeholder="Ex.: Maria dos Santos"></div>
          <div class="field"><label>E-mail</label><input id="ws-email" type="email" value="${escAttr(p.email)}" placeholder="voce@exemplo.ao"></div>
        </div>
        <div class="grid g-2" style="gap:14px">
          <div class="field"><label>Função</label><input id="ws-papel" value="${escAttr(p.papel)}" list="ws-papeis" placeholder="Ex.: Gestora de equipa"><datalist id="ws-papeis">${PAPEIS.map(x => `<option value="${escAttr(x)}">`).join('')}</datalist></div>
          <div class="field"><label>Organização</label><input id="ws-empresa" value="${escAttr(p.empresa)}" list="ws-empresas" placeholder="Ex.: Banco Kwanza"><datalist id="ws-empresas">${EMPRESAS.map(x => `<option value="${escAttr(x)}">`).join('')}</datalist></div>
        </div>
        <div class="field"><label>Interesses — escolhemos com quem falar</label>
          <div class="ws-ints" id="ws-ints">${INTERESSES.map(i => `<button type="button" class="ws-int ${(p.interesses || []).includes(i) ? 'on' : ''}" onclick="WS.toggleInt(this)" data-i="${escAttr(i)}">${esc(i)}</button>`).join('')}</div>
        </div>
        ${cheio ? `<div class="ws-warn">${I.users} Este evento está cheio. Vai entrar na <b>lista de espera</b>, posição ${pos}. Se alguém cancelar, sobe automaticamente.</div>` : ''}
        <button class="btn btn-p btn-lg" onclick="WS.passoIr(2)">Continuar ${I.arrow}</button>
      </div>`;
    } else if (passo === 2) {
      const end = WS.endossoUsado;
      const valor = e.preco === 0 ? 0 : Math.round(e.preco * (end ? 0.75 : 1));
      corpo = `<div class="ws-form">
        ${cheio ? `<div class="ws-warn">${I.users} Lista de espera, posição ${pos}. ${end ? 'Com endosso, o lugar fica reservado à entrada.' : 'Sem endosso, entra por ordem quando libertarmos lugares.'}</div>` : ''}
        ${e.preco === 0 ? `<div class="ws-free">${I.check} Entrada livre — não há pagamento a fazer.</div>` : `
        <div class="flex" style="justify-content:space-between"><span>${esc(e.titulo)}</span><b>${money(e.preco)}</b></div>
        ${end ? `<div class="flex" style="justify-content:space-between;color:var(--green);font-size:13.5px"><span>Endosso ${esc(end.codigo)} · ${esc(end.de)}</span><span>−${money(e.preco - valor)}</span></div>` : ''}
        <div class="field" style="margin-top:14px"><label>Código de endosso (opcional)</label>
          <input id="ws-end" value="${escAttr(end ? end.codigo : '')}" placeholder="AMA-WS-…" oninput="WS.lerEndosso(this.value)">
          <small class="muted" id="ws-end-st">${end ? 'Código válido — 25% de desconto aplicado.' : 'Quem já tem bilhete pode endossar até 2 pessoas.'}</small></div>
        <div class="field"><label>Método de pagamento</label>
          <select id="ws-met"><option value="MULTICAIXA">MULTICAIXA Express (referência)</option><option value="UNITEL">Unitel Money</option><option value="TRANSFER">Transferência / depósito</option></select></div>
        <div class="flex" style="justify-content:space-between;border-top:1px dashed var(--line);margin-top:12px;padding-top:12px"><b>Total</b><b style="font-family:var(--font-d);font-size:20px">${money(valor)}</b></div>`}
        <label class="ws-terms"><input type="checkbox" id="ws-ok" checked> Aceito comparecer ou cancelar até 24 h antes, para libertar o lugar.</label>
        <button class="btn btn-f btn-lg" onclick="WS.pagar()">${e.preco ? 'Pagar e emitir bilhete' : 'Emitir o meu bilhete'} ${I.arrow}</button>
        <p class="muted" style="font-size:11.5px;margin-top:10px">Modo local: nenhum valor real é movido. A referência é uma simulação gerada neste dispositivo.</p>
      </div>`;
    } else {
      const b = WS.ultimo || meuBilhete(d, e.id);
      corpo = b ? bilheteHTML(b, e) : '<p class="muted">Volte ao passo anterior — ainda não há bilhete.</p>';
    }

    return shellPublic(`
    <section class="ws-checkout">
      <a class="ws-back" href="#/workshop/${e.id}">${I.back} Voltar ao evento</a>
      <h1 class="page-t">${passo === 3 ? 'O seu bilhete' : 'Inscrição'}</h1>
      <p class="muted" style="margin:6px 0 20px">${esc(e.titulo)} · ${esc(fmtLongo(e.data))} · ${esc(e.hora)}</p>
      ${steps}${corpo}
    </section>`, 'workshops');
  });

  function bilheteHTML(b, e) {
    const matriz = codigoMatriz(b.bilhete);
    return `<div class="ticket">
      <div class="tk-main">
        <div class="tk-row"><span class="ws-chip">${esc(e.tipo)}</span><span class="ws-chip">${esc(e.formato)}</span>${b.estado === 'lista de espera' ? '<span class="ws-chip wait">lista de espera</span>' : '<span class="ws-chip ok">confirmada</span>'}</div>
        <h2>${esc(e.titulo)}</h2>
        <div class="tk-grid">
          <div><small>Quando</small><b>${esc(fmtLongo(e.data))}</b><span>${esc(e.hora)} · ${e.durMin} min</span></div>
          <div><small>Onde</small><b>${esc(e.sala)}</b><span>${esc(e.local)}</span></div>
          <div><small>Participante</small><b>${esc(b.nome)}</b><span>${esc(b.papel || '—')}${b.empresa ? ' · ' + esc(b.empresa) : ''}</span></div>
          <div><small>Lugar</small><b>${b.lugar ? '#' + b.lugar : '—'}</b><span>${b.checkin ? 'check-in feito' : 'à chegada, mostre o código'}</span></div>
        </div>
        <div class="tk-pay"><small>Pagamento</small><b>${esc(b.pagamento.metodo)}</b><span>${esc(b.pagamento.estado)}${b.pagamento.referencia !== '—' ? ' · ref. ' + esc(b.pagamento.referencia) : ''} · ${money(b.pagamento.valor)}</span></div>
      </div>
      <div class="tk-stub">
        <div class="tk-matrix" aria-hidden="true">${matriz}</div>
        <b class="tk-code">${esc(b.bilhete)}</b>
        <small>Entrada · verificação neste dispositivo</small>
      </div>
    </div>
    <div class="ws-tk-act">
      <button class="btn btn-p" onclick="WS.ics('${escAttr(e.id)}')">${I.calendar} Adicionar ao calendário</button>
      <a class="btn btn-o" href="#/workshop/${e.id}/network">${I.users} Sala de networking</a>
      <button class="btn btn-o" onclick="WS.cancelar('${escAttr(b.id)}')">Cancelar presença</button>
    </div>
    <p class="muted" style="font-size:11.5px;margin-top:12px">O código acima é um símbolo de entrada local, não um QR oficial de bilheteira. Guarde este ecrã ou anote o código.</p>`;
  }
  /* Matriz visual determinística a partir do código (não é QR real). */
  function codigoMatriz(codigo) {
    let h = 0; for (const ch of String(codigo)) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
    let out = '';
    for (let i = 0; i < 100; i++) { h = (h * 1103515245 + 12345) >>> 0; out += `<i class="${(h >>> 16) % 3 ? '' : 'f'}"></i>`; }
    return out;
  }

  /* ------------------------------------------------------------- networking */
  /* A sala é só para quem tem bilhete, mas a página não tem de ser um vazio:
     tudo o que aqui se mostra é o que o evento já publica na própria página.
     A pessoa decide com informação em vez de encontrar um candado. */
  function wsGate(e, d) {
    const conf = confirmadas(d, e.id).length;
    const vips = e.palestrantes.filter(p => p.vip);
    const passado = new Date(e.data + 'T23:59') < new Date();
    return `<section class="ws-gate">
      <a class="ws-back" href="#/workshop/${e.id}">${I.back} Voltar ao evento</a>
      <div class="ws-neth">
        <div><span class="kicker">Sala de networking · ${esc(fmtDia(e.data))}</span>
          <h1>${esc(e.titulo)}</h1>
          <p>${passado
            ? 'Este encontro já passou e a sala fecha com ele. As notas do workshop e a gravação ficam na biblioteca.'
            : 'Precisa de bilhete para entrar. Dentro da sala vê com quem vale a pena falar, reserva as conversas 1:1 e troca cartões.'}</p></div>
        <div class="ws-score"><b>${conf}</b><span>pessoas confirmadas<br>${vips.length ? vips.length + ' convidado(s) de honra' : 'sem mesa de honra'}</span></div>
      </div>
      ${passado ? '' : `<div class="ws-gate-list">${e.palestrantes.map(p => `<span class="ws-gate-p${p.vip ? ' vip' : ''}"><i>${esc(inic(p.nome))}</i><b>${esc(p.nome)}</b><small>${esc(p.papel)} · ${esc(p.organizacao)}</small></span>`).join('')}</div>`}
      <div class="ws-gate-cta">
        ${passado ? `<a class="btn btn-o btn-lg" href="#/biblioteca">Ver a biblioteca ${I.arrow}</a>`
          : `<a class="btn btn-f btn-lg" href="#/workshop/${e.id}/inscrever">${emEspera(d, e.id) ? 'Entrar na lista de espera' : 'Inscrever-me'} ${I.arrow}</a>`}
        <a class="btn btn-o btn-lg" href="#/workshops">Ver outros eventos</a>
      </div>
      <p class="ws-gate-note">Sem bilhete esta página só mostra o que já é público. A lista de participantes, os pedidos 1:1 e os cartões trocados vivem dentro da sala.</p>
    </section>`;
  }

  on('/workshop/:id/network', async ({ args }) => {
    const d = load(); const e = d.eventos.find(x => x.id === args.id);
    if (!e) return shellPublic('<div class="empty"><h3>Evento não encontrado</h3><a class="btn btn-p" href="#/workshops">Ver workshops</a></div>', 'workshops');
    const bil = meuBilhete(d, e.id);
    if (!bil) return shellPublic(wsGate(e, d), 'workshops');

    const eu = { nome: bil.nome, papel: bil.papel, empresa: bil.empresa, interesses: bil.interesses || [] };
    const outros = lista(d, e.id).filter(x => x.nome !== bil.nome);
    const matches = outros.map(x => ({ x, m: matchScore(eu, x) })).sort((a, b) => b.m.pontos - a.m.pontos).slice(0, 6);
    const trocados = d.contactos.filter(c => c.eventoId === e.id && c.de === bil.nome).map(c => c.para);
    const recebidos = d.contactos.filter(c => c.eventoId === e.id && c.para === bil.nome);
    const meusPedidos = conversas(d, e.id).filter(x => x.quem === bil.nome);
    const vips = e.palestrantes.filter(p => p.vip);
    const score = Math.min(100, trocados.length * 18 + meusPedidos.length * 12 + recebidos.length * 10);
    const porPapel = {}; outros.forEach(x => { porPapel[x.papel] = (porPapel[x.papel] || 0) + 1; });

    return shellPublic(`
    <section class="ws-net">
      <a class="ws-back" href="#/workshop/${e.id}">${I.back} Voltar ao evento</a>
      <div class="ws-neth">
        <div><span class="kicker">Sala de networking · ${esc(fmtDia(e.data))}</span>
          <h1>${esc(e.titulo)}</h1>
          <p>${outros.length + 1} pessoas confirmadas. ${vips.length ? vips.length + ' convidado(s) de honra na mesa.' : ''} ${e.palestrantes.reduce((n, p) => n + p.slots, 0) ? 'Há conversas 1:1 por reservar.' : ''}</p></div>
        <div class="ws-score"><b>${score}</b><span>índice de rede<br>cartões trocados e pedidos</span></div>
      </div>

      <div class="ws-net-cols">
        <div>
          <h2 class="ws-h">Vale a pena falar com</h2>
          <div class="ws-matches">${matches.map(({ x, m }) => `<article class="net-card ${trocados.includes(x.nome) ? 'met' : ''}">
            <span class="av lg">${esc(x.nome.split(' ').map(w => w[0]).slice(0, 2).join(''))}</span>
            <div class="nc-in"><b>${esc(x.nome)}</b><small>${esc(x.papel)} · ${esc(x.empresa)}${x.demo ? ' · <i>perfil de demonstração</i>' : ''}</small>
              <p>${m.porque.length ? esc(m.porque.join(' · ')) : 'interesses diferentes dos seus — bom para sair da bolha'}</p>
              <div class="nc-bar"><i style="width:${m.pontos}%"></i></div><span class="nc-pct">${m.pontos}% afinidade</span></div>
            <div class="nc-act">${trocados.includes(x.nome)
              ? `<span class="ws-chip ok">${I.check} cartão trocado</span>`
              : `<button class="btn btn-o btn-sm" onclick="WS.cartao('${escAttr(e.id)}','${escAttr(x.nome)}')">Trocar cartão</button>`}
              <a class="btn btn-o btn-sm" href="#" onclick="event.preventDefault();WS.falarCom('${escAttr(x.nome)}','${escAttr(x.papel)}')">${I.chat} Como abordar</a></div>
          </article>`).join('') || '<p class="muted">Ainda não há mais ninguém inscrito neste evento.</p>'}</div>

          <h2 class="ws-h">Quem vai, por papel</h2>
          <div class="ws-roles">${Object.entries(porPapel).sort((a, b) => b[1] - a[1]).map(([r, n]) => `<span class="ws-role">${esc(r)}<b>${n}</b></span>`).join('')}</div>

          <h2 class="ws-h">Todos os confirmados</h2>
          <div class="ws-table"><div class="wt-h"><span>Nome</span><span>Papel</span><span>Organização</span><span></span></div>
            ${outros.map(x => `<div class="wt-r"><span><b>${esc(x.nome)}</b>${x.demo ? '<i class="wt-demo">demo</i>' : ''}</span><span>${esc(x.papel)}</span><span>${esc(x.empresa)}</span><span>${trocados.includes(x.nome) ? `<button class="btn btn-o btn-sm" onclick="WS.ficha('${escAttr(x.nome)}')">ver</button>` : `<button class="btn btn-o btn-sm" onclick="WS.cartao('${escAttr(e.id)}','${escAttr(x.nome)}')">cartão</button>`}</span></div>`).join('')}</div>
        </div>

        <aside>
          ${vips.length ? `<div class="ws-side-box vip"><h4>${I.star} Mesa de honra</h4>
            ${vips.map(p => `<div class="honour"><b>${esc(p.nome)}</b><small>${esc(p.papel)}, ${esc(p.organizacao)}</small><p>${esc(p.bio)}</p></div>`).join('')}</div>` : ''}

          <div class="ws-side-box"><h4>${I.chat} Conversas 1:1</h4>
            ${e.palestrantes.filter(p => p.slots).map(p => {
              const tomados = conversas(d, e.id, p.nome).map(x => x.slot);
              const meu = meusPedidos.find(x => x.palestrante === p.nome);
              return `<div class="one"><b>${esc(p.nome)}</b><small>${p.slots} vagas de 10 min</small>
                <div class="slots">${Array.from({ length: p.slots }, (_, i) => i + 1).map(s => `<button class="slot ${tomados.includes(s) ? 'taken' : ''} ${meu && meu.slot === s ? 'mine' : ''}" ${tomados.includes(s) || meu ? 'disabled' : ''} onclick="WS.pedir1to1('${escAttr(e.id)}','${escAttr(p.nome)}',${s})">${s}</button>`).join('')}</div>
                ${meu ? `<p class="muted" style="font-size:12px;margin-top:6px">Conversa ${meu.slot} reservada · «${esc(meu.tema)}»</p>
                  <button class="btn btn-o btn-sm" style="margin-top:8px" onclick="WS.liberar1to1('${escAttr(meu.id)}')">Libertar esta hora</button>` : '<p class="muted" style="font-size:12px;margin-top:6px">Escolha um número livre.</p>'}</div>`;
            }).join('') || '<p class="muted" style="font-size:12.5px">Este evento não abre conversas individuais.</p>'}
          </div>

          <div class="ws-side-box"><h4>${I.mega} O seu cartão</h4>
            <div class="my-card"><b>${esc(bil.nome)}</b><small>${esc(bil.papel || 'Participante')} · ${esc(bil.empresa || '—')}</small>
              <div class="ws-ints mini">${(bil.interesses || []).map(i => chip(i)).join('') || '<small class="muted">Sem interesses marcados.</small>'}</div></div>
            <button class="btn btn-o btn-sm" style="width:100%;justify-content:center;margin-top:10px" onclick="WS.editarCartao('${escAttr(e.id)}')">Editar o meu cartão</button>
          </div>

          <div class="ws-side-box"><h4>${I.spark} Depois do evento</h4>
            <p class="muted" style="font-size:12.5px">${trocados.length} cartões trocados. O follow-up escreve uma mensagem por cada contacto e transforma as suas notas em cartões de revisão.</p>
            <button class="btn btn-p btn-sm" style="width:100%;justify-content:center;margin-top:10px" onclick="WS.followup('${escAttr(e.id)}')">Gerar follow-up</button>
            <button class="btn btn-o btn-sm" style="width:100%;justify-content:center;margin-top:8px" onclick="WS.notas('${escAttr(e.id)}')">Notas → estudo</button>
          </div>
        </aside>
      </div>
    </section>`, 'workshops');
  });

  /* ------------------------------------------------------------- meus bilhetes */
  on('/meus-bilhetes', async () => {
    const d = load(); const eu = nomeEu(d);
    const minhas = eu ? d.inscricoes.filter(x => x.nome === eu && x.estado !== 'cancelada') : [];
    const futuros = minhas.filter(x => new Date((d.eventos.find(e => e.id === x.eventoId) || {}).data + 'T23:59') >= new Date());
    const passados = minhas.filter(x => !futuros.includes(x));
    /* Sem bilhete a página era três frases e um vazio até ao rodapé. O passo que
       falta é escolher um evento, então mostramos já os que ainda têm lugares. */
    const prox = d.eventos.filter(e => new Date(e.data + 'T23:59') >= new Date() && restantes(d, e.id) > 0)
      .sort((a, b) => a.data.localeCompare(b.data)).slice(0, 3);
    return shellPublic(`
    <section class="ws-section">
      <h1 class="page-t">Os meus bilhetes</h1>
      <p class="muted" style="margin:6px 0 24px">${eu ? 'Inscrições de <b>' + esc(eu) + '</b> neste navegador.' : 'Ainda não há inscrições guardadas — inscreva-se num workshop para ver aqui o bilhete.'}</p>
      ${futuros.length ? futuros.map(b => { const e = d.eventos.find(x => x.id === b.eventoId); return `<div class="ws-tk-wrap">${bilheteHTML(b, e)}</div>`; }).join('<hr class="ws-hr">')
        : `<div class="tk-empty"><div class="card empty tk-msg"><h3>Sem bilhetes ainda</h3><p>O bilhete aparece aqui no instante em que a inscrição é confirmada — código de entrada, lugar e a sala de networking do evento.</p><a class="btn btn-f" href="#/workshops">Ver todos os workshops ${I.arrow}</a></div>
          ${prox.length ? `<div class="tk-sug"><h2 class="ws-h">Ainda com lugares</h2>${prox.map(e => `<a class="tk-row" href="#/workshop/${e.id}">${dataBloco(e)}<span class="tk-t"><b>${esc(e.titulo)}</b><small>${[...new Set([e.formato, e.local])].map(x => esc(x)).join(' · ')} · ${restantes(d, e.id)} de ${e.vagas} lugares</small></span><span class="tk-p mono">${e.preco ? money(e.preco) : 'Grátis'}</span>${I.arrow}</a>`).join('')}</div>` : ''}</div>`}
      ${passados.length ? `<h2 class="ws-h">Eventos passados</h2>${passados.map(b => { const e = d.eventos.find(x => x.id === b.eventoId); return `<div class="ws-past-row"><b>${esc(e ? e.titulo : '—')}</b><span>${esc(fmtDia(e ? e.data : ''))} · ${b.checkin ? 'compareceu' : 'sem registo de presença'}</span>${e ? `<a class="btn btn-o btn-sm" href="#/workshop/${e.id}/network">Ver contactos</a>` : ''}</div>`; }).join('')}` : ''}
      <div class="ws-side-box" style="margin-top:28px"><h4>${I.shield} Verificação à entrada</h4>
        <p class="muted" style="font-size:12.5px">Quem recebe o evento pode confirmar o seu código nesta página — o mesmo formulário serve para a porta.</p>
        <a class="btn btn-p btn-sm" style="margin-top:10px" href="#/checkin">Abrir verificação de código</a></div>
    </section>`, 'workshops');
  });

  on('/checkin', async () => {
    const d = load();
    const r = WS.checkinResult;
    return shellPublic(`
    <section class="ws-section ws-ck">
      <h1 class="page-t">Verificação de bilhete</h1>
      <p class="muted" style="margin:6px 0 18px">Escreva o código que aparece no bilhete do participante. Funciona offline, neste dispositivo.</p>
      <div class="ws-ck-form"><input id="ck-code" placeholder="AMA-PALCO-114-…" value="${escAttr(WS.checkinInput || '')}" onkeydown="if(event.key==='Enter')WS.fazerCheckin()"><button class="btn btn-p" onclick="WS.fazerCheckin()">Verificar ${I.arrow}</button></div>
      ${r ? `<div class="ws-ck-out ${r.ok ? 'ok' : 'no'}">
        ${r.ok ? `<b>${esc(r.b.nome)}</b><small>${esc(r.b.papel)} · ${esc(r.b.empresa || '—')}</small>
          <p>${esc(r.e.titulo)} · ${esc(fmtLongo(r.e.data))} ${esc(r.e.hora)} · lugar ${r.b.lugar || '—'}</p>
          <span class="ws-chip ${r.b.checkin ? 'ok' : 'wait'}">${r.b.checkin ? 'já tinha feito check-in' : 'entrada registada agora'}</span>`
          : `<b>Código não encontrado</b><p>Peça ao participante para abrir <i>Os meus bilhetes</i> e mostrar o código outra vez.</p>`}
      </div>` : ''}
      <h2 class="ws-h">Presenças deste navegador</h2>
      <div class="ws-table"><div class="wt-h"><span>Código</span><span>Nome</span><span>Evento</span><span>Estado</span></div>
        ${d.inscricoes.filter(x => x.checkin).map(x => { const e = d.eventos.find(v => v.id === x.eventoId); return `<div class="wt-r"><span class="mono">${esc(x.bilhete)}</span><span>${esc(x.nome)}</span><span>${esc(e ? e.titulo : '—')}</span><span>presente</span></div>`; }).join('') || '<div class="wt-r"><span class="muted" style="grid-column:1/-1">Ainda sem check-ins.</span></div>'}</div>
    </section>`, 'workshops');
  });

  /* ================================================================= acções */
  const WS = {
    f: { q: '', area: '', formato: '', preco: '' },
    evento: null, passo: 1, endossoUsado: null, ultimo: null, checkinResult: null, checkinInput: '',

    filtre(k, v) { WS.f[k] = v; render(); },
    /* re-render perde o foco do campo de pesquisa — devolvemos o cursor ao fim da
       palavra e mantemos o deslocamento, senão escrever "ora" salta uma letra */
    buscar(v) {
      WS.f.q = v;
      clearTimeout(WS._t);
      WS._t = setTimeout(() => {
        const y = scrollY;
        Promise.resolve(render()).then(() => {
          const i = $('#ws-q');
          if (i) { i.focus(); i.setSelectionRange(i.value.length, i.value.length); }
          scrollTo(0, y);
        });
      }, 240);
    },
    limpar() { WS.f = { q: '', area: '', formato: '', preco: '' }; render(); },

    toggleInt(btn) { btn.classList.toggle('on'); },
    dadosDoForm() {
      return {
        nome: ($('#ws-nome') || {}).value || '', email: ($('#ws-email') || {}).value || '',
        papel: ($('#ws-papel') || {}).value || '', empresa: ($('#ws-empresa') || {}).value || '',
        interesses: $$('#ws-ints .ws-int.on').map(b => b.dataset.i),
      };
    },
    passoIr(n) {
      if (n === 2) {
        const p = WS.dadosDoForm();
        if (p.nome.trim().length < 3) return toast('Escreva o seu nome completo.');
        if (!/^[^@\s]+@[^@\s]+\.[a-z]{2,}$/i.test(p.email)) return toast('Falta um e-mail válido — é onde chega o bilhete.');
        if (!p.interesses.length) return toast('Escolha pelo menos um interesse, para a sala de networking funcionar.');
        const d = load(); d.eu = p; save(d);
      }
      WS.passo = n; render();
    },
    lerEndosso(v) {
      const d = load();
      const e = d.endossos.find(x => x.codigo.toUpperCase() === String(v).trim().toUpperCase() && x.estado === 'disponível');
      /* Um endosso é lançado para um evento concreto (o código leva o número
         dele): aceites em qualquer evento dariam desconto cruzado. */
      const eventoId = location.hash.split('/')[2];
      const serve = e && e.eventoId === eventoId ? e : null;
      WS.endossoUsado = serve;
      const st = $('#ws-end-st');
      if (!st) return;
      st.textContent = serve ? 'Código válido — 25% de desconto aplicado.'
        : (e ? 'Esse código é de ' + ((d.eventos.find(x => x.id === e.eventoId) || {}).titulo || 'outro evento') + '.'
          : (String(v).trim() ? 'Código inválido ou já usado.' : 'Quem já tem bilhete pode endossar até 2 pessoas.'));
    },
    pagar() {
      const d = load(); const e = ev(location.hash.split('/')[2]);
      if (!$('#ws-ok').checked) return toast('Confirme que aceita comparecer ou cancelar.');
      const p = d.eu || WS.dadosDoForm();
      const cheio = emEspera(d, e.id);
      /* WS.endossoUsado aponta para um objeto de um load() anterior: marcar
         'usado' nesse objeto não chegava ao que era gravado, e o mesmo código
         descontava outra vez. Voltamos a procurá-lo no registo deste save. */
      const pedido = WS.endossoUsado;
      const end = pedido ? d.endossos.find(x => x.id === pedido.id && x.estado === 'disponível' && x.eventoId === e.id) : null;
      if (pedido && !end) { WS.endossoUsado = null; toast('O endosso deixou de estar disponível — o total volta ao preço normal.'); }
      const valor = e.preco === 0 ? 0 : Math.round(e.preco * (end ? 0.75 : 1));
      const metodo = e.preco === 0 ? 'Gratuito' : (({ MULTICAIXA: 'MULTICAIXA Express', UNITEL: 'Unitel Money', TRANSFER: 'Transferência' })[$('#ws-met').value] || 'MULTICAIXA Express');
      const b = {
        id: uid('i'), eventoId: e.id, nome: p.nome.trim(), email: p.email.trim(), papel: p.papel.trim(), empresa: p.empresa.trim(),
        interesses: p.interesses, estado: cheio && !end ? 'lista de espera' : 'confirmada', demo: false,
        criado: new Date().toISOString(),
        pagamento: { metodo, valor, estado: e.preco === 0 ? 'gratuito' : 'pago (simulação)', referencia: e.preco === 0 ? '—' : ref() },
        bilhete: bilheteCodigo(e, d.inscricoes.filter(x => x.eventoId === e.id).length + 1),
        lugar: cheio && !end ? null : confirmadas(d, e.id).length + 1, checkin: false,
      };
      d.inscricoes.push(b);
      if (end) { end.estado = 'usado'; end.para = b.nome; }
      d.eu = p; save(d);
      WS.ultimo = b; WS.endossoUsado = null; WS.passo = 3;
      toast(b.estado === 'confirmada' ? 'Bilhete emitido — guarde o código.' : 'Na lista de espera — posição ' + (espera(d, e.id).length) + '.');
      render();
    },
    cancelar(id) {
      const d = load(); const b = d.inscricoes.find(x => x.id === id); if (!b) return;
      b.estado = 'cancelada'; b.pagamento.estado = b.pagamento.valor ? 'reembolsado (simulação)' : 'cancelado';
      /* quem estava à espera sobe */
      const fila = d.inscricoes.filter(x => x.eventoId === b.eventoId && x.estado === 'lista de espera').sort((x, y) => x.criado.localeCompare(y.criado));
      if (fila.length) { fila[0].estado = 'confirmada'; fila[0].lugar = confirmadas(d, b.eventoId).length + 1; toast('Lugar libertado: ' + fila[0].nome + ' saiu da lista de espera.'); }
      else toast('Inscrição cancelada.');
      save(d); WS.passo = 1; WS.evento = null; WS.ultimo = null; render();
    },
    gerarEndosso(eventoId) {
      const d = load(); const b = meuBilhete(d, eventoId); if (!b) return toast('Precisa de um bilhete primeiro.');
      const meus = d.endossos.filter(x => x.eventoId === eventoId && x.de === b.nome);
      if (meus.length >= 2) return toast('Já usou os 2 endossos deste bilhete.');
      const e = ev(eventoId);
      const cod = 'AMA-WS-' + e.codigo.replace(/[^A-Z0-9]/g, '').slice(0, 6) + '-' + ref().slice(0, 4);
      d.endossos.push({ id: uid('e'), eventoId, de: b.nome, codigo: cod, estado: 'disponível', desconto: 25, criado: new Date().toISOString() });
      save(d); render();
      copiar(cod);
      toast('Endosso ' + cod + ' criado — partilhe com quem quer levar.');
    },
    endosso(eventoId) { WS.gerarEndosso(eventoId); },
    votar(eventoId, ti, oi) {
      const d = load(); const e = d.eventos.find(x => x.id === eventoId);
      const k = eventoId + ':' + ti;
      const t = e.topicos[ti];
      if (d.votos[k] != null) t.opcoes[d.votos[k]][1] = Math.max(0, t.opcoes[d.votos[k]][1] - 1);
      t.opcoes[oi][1]++; d.votos[k] = oi; save(d); render();
      toast('Voto registado neste navegador.');
    },
    fechar() { fecharModal(); },
    pedir1to1(eventoId, palestrante, slot) {
      const d = load(); const b = meuBilhete(d, eventoId); if (!b) return toast('Só com bilhete.');
      /* Em vez de prompt(): o diálogo do browser não tinha a marca da app,
         ficava fora do tema escuro e desaparecia em algumas webviews. */
      showModal(`<h3 style="margin-bottom:6px">Conversa ${slot} · 10 minutos</h3>
        <p class="muted" style="font-size:13px;margin-bottom:14px">${esc(palestrante)}</p>
        <div class="field"><label for="p1-tema">O que quer levar da conversa</label>
          <input id="p1-tema" maxlength="90" placeholder="Quero feedback sobre o meu próximo passo" onkeydown="if(event.key==='Enter')WS.confirmar1to1('${escAttr(eventoId)}','${escAttr(palestrante)}',${slot})"></div>
        <p class="muted" style="font-size:11.5px">O pedido fica neste dispositivo e pode libertar a hora quando quiser.</p>
        <button class="btn btn-f btn-sm" style="margin-top:12px" onclick="WS.confirmar1to1('${escAttr(eventoId)}','${escAttr(palestrante)}',${slot})">Reservar conversa</button>`);
      setTimeout(() => { const i = $('#p1-tema'); if (i) i.focus(); }, 60);
    },
    confirmar1to1(eventoId, palestrante, slot) {
      const d = load(); const b = meuBilhete(d, eventoId); if (!b) return;
      const tema = (($('#p1-tema') || {}).value || '').trim() || 'Conversa livre';
      d.pedidos.push({ id: uid('p'), eventoId, palestrante, slot, quem: b.nome, tema, estado: 'confirmado', criado: new Date().toISOString() });
      save(d); fecharModal(); render();
      toast('Conversa ' + slot + ' reservada com ' + palestrante + '. Tema: ' + tema.slice(0, 40) + '.');
    },
    libertar1to1(id) {
      const d = load(); const p = d.pedidos.find(x => x.id === id); if (!p) return;
      p.estado = 'cancelado'; save(d); render();
      toast('Hora libertada — ' + p.palestrante + ' volta a ter a conversa ' + p.slot + ' livre.');
    },
    cartao(eventoId, para) {
      const d = load(); const b = meuBilhete(d, eventoId); if (!b) return toast('Só com bilhete.');
      if (d.contactos.some(c => c.eventoId === eventoId && c.de === b.nome && c.para === para)) return;
      d.contactos.push({ id: uid('c'), eventoId, de: b.nome, para, criado: new Date().toISOString() });
      save(d); render(); toast('Cartão trocado com ' + para + '.');
    },
    falarCom(nome, papel) {
      const d = load(); const b = meuBilhete(d, location.hash.split('/')[2]);
      const alvo = d.inscricoes.find(x => x.nome === nome);
      const comum = b && alvo ? (b.interesses || []).filter(i => (alvo.interesses || []).includes(i)) : [];
      showModal(`<h3 style="margin-bottom:10px">Como abordar ${esc(nome)}</h3>
        <p class="muted" style="font-size:13px;margin-bottom:14px">${esc(papel)}${alvo && alvo.empresa ? ' · ' + esc(alvo.empresa) : ''}</p>
        <ol class="ws-talk">
          <li><b>Abra com o contexto do evento.</b> «Estou no ${esc((ev(location.hash.split('/')[2]) || {}).titulo || 'workshop')}, a parte da ${esc(alvo && alvo.papel ? alvo.papel.toLowerCase() : 'sua área')} fez-me pensar em si.»</li>
          ${comum.length ? `<li><b>Use o interesse comum.</b> «Vi que também trabalha com ${esc(comum.join(' e '))} — como está a correr do seu lado?»</li>` : '<li><b>Use a diferença.</b> «A sua área é diferente da minha; quero ouvir como veem isto de fora.»</li>'}
          <li><b>Pida uma coisa pequena.</b> «Posso enviar-lhe uma pergunta por escrito esta semana?»</li>
          <li><b>Feche com troca de cartão</b> e diga quando prefere ser contactado.</li>
        </ol>
        <button class="btn btn-p btn-sm" style="margin-top:14px" onclick="WS.fechar()">Entendi</button>`);
    },
    ficha(nome) {
      const d = load(); const x = d.inscricoes.find(i => i.nome === nome); if (!x) return;
      const eu = (d.eu || {});
      const m = matchScore({ interesses: eu.interesses || [] }, x);
      showModal(`<h3 style="margin-bottom:8px">${esc(x.nome)}</h3>
        <p class="muted" style="font-size:13px">${esc(x.papel)} · ${esc(x.empresa)}${x.demo ? ' · perfil de demonstração' : ''}</p>
        <div class="ws-ints" style="margin:14px 0">${(x.interesses || []).map(i => chip(i)).join('')}</div>
        <p style="font-size:13.5px"><b>${m.pontos}%</b> de afinidade com os seus interesses. ${m.porque.length ? esc(m.porque.join(' · ')) : 'Poucos interesses em comum — serve para alargar a rede.'}</p>
        <button class="btn btn-o btn-sm" style="margin-top:14px" onclick="WS.fechar()">Fechar</button>`);
    },
    editarCartao(eventoId) {
      const d = load(); const b = meuBilhete(d, eventoId); if (!b) return;
      showModal(`<h3 style="margin-bottom:12px">O seu cartão</h3>
        <div class="field"><label>Função</label><input id="ec-papel" value="${escAttr(b.papel || '')}"></div>
        <div class="field"><label>Organização</label><input id="ec-emp" value="${escAttr(b.empresa || '')}"></div>
        <div class="field"><label>Interesses (separados por vírgula)</label><input id="ec-int" value="${escAttr((b.interesses || []).join(', '))}"></div>
        <button class="btn btn-p btn-sm" style="margin-top:12px" onclick="WS.guardarCartao('${escAttr(eventoId)}')">Guardar</button>`);
    },
    guardarCartao(eventoId) {
      const d = load(); const b = meuBilhete(d, eventoId); if (!b) return;
      b.papel = ($('#ec-papel').value || '').trim(); b.empresa = ($('#ec-emp').value || '').trim();
      b.interesses = ($('#ec-int').value || '').split(',').map(s => s.trim().toLowerCase()).filter(Boolean);
      if (d.eu) { d.eu.papel = b.papel; d.eu.empresa = b.empresa; d.eu.interesses = b.interesses; }
      save(d); fecharModal(); render(); toast('Cartão atualizado.');
    },
    followup(eventoId) {
      const d = load(); const b = meuBilhete(d, eventoId); if (!b) return toast('Só com bilhete.');
      const e = ev(eventoId);
      const trocados = d.contactos.filter(c => c.eventoId === eventoId && c.de === b.nome).map(c => c.para);
      if (!trocados.length) return toast('Troque primeiro um cartão — depois o follow-up escreve as mensagens.');
      const linhas = trocados.map(n => {
        const x = d.inscricoes.find(i => i.nome === n);
        return `<div class="fu"><b>${esc(n)} <small>${esc(x ? x.papel : '')}</small></b>
          <p>«Olá ${esc(n.split(' ')[0])}, fui ${esc(b.nome.split(' ')[0])} no ${esc(e.titulo)}. Combinámos falar sobre ${esc(((x && x.interesses) || []).slice(0, 2).join(' e ') || 'o que conversámos').replace(/"/g, '')}. Mando na quarta o que prometi — se entretanto houver alguém com quem deva falar, diga.»</p></div>`;
      }).join('');
      showModal(`<h3 style="margin-bottom:6px">Follow-up · ${esc(trocados.length)} contactos</h3>
        <p class="muted" style="font-size:12.5px;margin-bottom:14px">Mensagens escritas a partir dos cartões trocados. Copie, ajuste e envie — nada sai deste navegador.</p>${linhas}
        <button class="btn btn-p btn-sm" style="margin-top:14px" onclick="WS.copiarFollowup('${escAttr(eventoId)}')">Copiar tudo</button>`);
    },
    copiarFollowup(eventoId) {
      const d = load(); const b = meuBilhete(d, eventoId); const e = ev(eventoId);
      const trocados = d.contactos.filter(c => c.eventoId === eventoId && c.de === b.nome).map(c => c.para);
      const txt = trocados.map(n => { const x = d.inscricoes.find(i => i.nome === n); return `${n} (${x ? x.papel : ''})\nOlá ${n.split(' ')[0]}, fui ${b.nome.split(' ')[0]} no ${e.titulo}. Combinámos falar sobre ${(x && x.interesses || []).slice(0, 2).join(' e ') || 'o que conversámos'}. Mando na quarta o que prometi.`; }).join('\n\n');
      copiar(txt, 'Follow-up copiado.');
    },
    notas(eventoId) {
      const e = ev(eventoId);
      const d = load(); const n = (d.notas.find(x => x.eventoId === eventoId) || {}).texto || '';
      showModal(`<h3 style="margin-bottom:8px">Notas de ${esc(e.titulo)}</h3>
        <p class="muted" style="font-size:12.5px">Escreva o que retenção. O motor local transforma em cartões de revisão espaçada, ficha de exercícios e plano de aplicação.</p>
        <div class="field" style="margin-top:12px"><label>As suas notas</label><textarea id="ws-nota" rows="9" placeholder="Ex.: a regra dos 3 segundos antes de responder; o erro mais comum na abertura…">${esc(n)}</textarea></div>
        <button class="btn btn-p btn-sm" onclick="WS.guardarNotas('${escAttr(eventoId)}')">Guardar e gerar estudo</button>`);
    },
    guardarNotas(eventoId) {
      const texto = ($('#ws-nota').value || '').trim();
      if (texto.length < 60) return toast('Escreva pelo menos duas frases para gerar o material.');
      const d = load(); const e = ev(eventoId);
      const rec = d.notas.find(x => x.eventoId === eventoId) || (d.notas.push({ eventoId, texto: '', criado: '' }) && d.notas[d.notas.length - 1]);
      rec.texto = texto; rec.criado = new Date().toISOString(); save(d);
      const S_ = window.AMAStudy;
      let ok = false;
      if (S_ && S_.ingest) { ok = S_.ingest({ title: e.titulo, subject: e.area === 'Tecnologia' ? 'programacao' : e.area === 'Finanças' ? 'financas' : 'geral', text: [e.titulo, e.resumo, texto].join('. '), src: 'workshop ' + e.codigo }); }
      fecharModal();
      toast(ok ? 'Notas guardadas e transformadas em cartões de revisão.' : 'Notas guardadas. Abra /estudar para gerar o material.');
      /* A ficha, não a fila de revisão: depois de escrever notas a pessoa quer
         ver o que o motor tirou delas antes de começar a memorizar. */
      if (ok) setTimeout(() => go('/estudar/' + ok), 500);
    },
    ics(eventoId) {
      const e = ev(eventoId); if (!e) return;
      const S_ = window.Study;
      const eventos = [{ id: e.codigo, date: e.data, time: e.hora, title: e.titulo, type: 'event', subject: e.area, source: 'AMA ' + e.codigo }];
      const ics = S_ && S_.buildIcs ? S_.buildIcs({ events: eventos }) : '';
      if (!ics) return toast('O motor de calendário ainda está a carregar — tente novamente.');
      descarregar('AMA-' + e.codigo + '.ics', ics, 'text/calendar');
      toast('Calendário .ics gerado.');
    },
    partilhar(eventoId) {
      const e = ev(eventoId);
      const link = location.origin + location.pathname + '#/workshop/' + e.id;
      const txt = `${e.titulo} — ${fmtLongo(e.data)} às ${e.hora} · ${e.sala}. ${e.preco ? money(e.preco) : 'Entrada livre'}. ${link}`;
      copiar(txt, 'Texto de convite copiado.');
    },
    fazerCheckin() {
      const cod = (($('#ck-code') || {}).value || '').trim().toUpperCase();
      WS.checkinInput = cod;
      if (!cod) return toast('Escreva o código do bilhete.');
      const d = load();
      const b = d.inscricoes.find(x => (x.bilhete || '').toUpperCase() === cod && x.estado !== 'cancelada');
      if (!b) { WS.checkinResult = { ok: false }; render(); return; }
      b.checkin = true; save(d);
      WS.checkinResult = { ok: true, b, e: ev(b.eventoId) };
      render(); toast(b.nome + ' — entrada registada.');
    },
    tpl(k) {
      const tpls = {
        luanda: { titulo: 'Workshop Prático de Oratória Executiva', area: 'Comunicação', tipo: 'Workshop', formato: 'Presencial', data: addDays(10), hora: '09:30', duracao: '3h', local: 'Luanda · Talatona', sala: 'Auditório AMA · Sala 2', vagas: 35, preco: 12000, resumo: 'Sessão prática com palco real, feedback em direto e estrutura de apresentações de alto impacto.', orador: S.user ? S.user.nome : 'Mentor AMA', papel: 'Facilitador', agenda: '09:30 · Abertura e diagnóstico\n10:30 · Exercício de palco em pares\n11:45 · Q&A e networking' },
        online: { titulo: 'Masterclass: Python e Automação do Zero', area: 'Tecnologia', tipo: 'Masterclass', formato: 'Online', data: addDays(7), hora: '18:30', duracao: '2h', local: 'Online · Sala AMA', sala: 'Link enviado no bilhete', vagas: 80, preco: 0, resumo: 'Construa em direto o seu primeiro script de automação de dados sem precisar de experiência prévia.', orador: S.user ? S.user.nome : 'Mentor AMA', papel: 'Engenheiro de Software', agenda: '18:30 · Configuração rápida\n19:00 · Script passo a passo\n20:00 · Dúvidas e próximos passos' },
        mesa: { titulo: 'Mesa-Redonda: Finanças e Negócios em Angola', area: 'Finanças', tipo: 'Mesa-redonda', formato: 'Híbrido', data: addDays(14), hora: '16:00', duracao: '2h30', local: 'Luanda · Ingombota + Online', sala: 'Espaço Inovação', vagas: 50, preco: 7500, resumo: 'Conversa aberta com empreendedores e gestores sobre fluxo de caixa, vendas B2B e parcerias.', orador: S.user ? S.user.nome : 'Mentor AMA', papel: 'Convidado de Honra', agenda: '16:00 · Painel de abertura\n17:00 · Debate com a plateia\n17:50 · Troca de contactos' },
      };
      const t = tpls[k]; if (!t) return;
      Object.assign(WS_NEW, t, { published: null });
      toast('Modelo de workshop carregado!'); render();
    },
    syncNew() {
      const g = (id, fb) => ($(id)?.value ?? fb);
      WS_NEW.titulo = g('#wn-tit', WS_NEW.titulo);
      WS_NEW.area = g('#wn-area', WS_NEW.area);
      WS_NEW.tipo = g('#wn-tipo', WS_NEW.tipo);
      WS_NEW.formato = g('#wn-for', WS_NEW.formato);
      WS_NEW.data = g('#wn-data', WS_NEW.data);
      WS_NEW.hora = g('#wn-hora', WS_NEW.hora);
      WS_NEW.duracao = g('#wn-dur', WS_NEW.duracao);
      WS_NEW.local = g('#wn-loc', WS_NEW.local);
      WS_NEW.sala = g('#wn-sala', WS_NEW.sala);
      WS_NEW.vagas = Math.max(5, Number(g('#wn-vagas', WS_NEW.vagas)) || 30);
      WS_NEW.preco = Math.max(0, Number(g('#wn-preco', WS_NEW.preco)) || 0);
      WS_NEW.resumo = g('#wn-res', WS_NEW.resumo);
      WS_NEW.orador = g('#wn-ora', WS_NEW.orador);
      WS_NEW.papel = g('#wn-pap', WS_NEW.papel);
      WS_NEW.agenda = g('#wn-ag', WS_NEW.agenda);
      const pv = $('#wn-prev'); if (pv) pv.innerHTML = wsNewPreview();
    },
    publicarNovo() {
      this.syncNew();
      if ((WS_NEW.titulo || '').trim().length < 4) return toast('Indique um título com pelo menos 4 caracteres.');
      const d = load();
      const id = 'ws-' + Date.now().toString(36);
      const codigo = 'WS-' + Math.random().toString(36).slice(2, 6).toUpperCase();
      const agLines = String(WS_NEW.agenda || '').split('\n').map(l => l.trim()).filter(Boolean);
      const agenda = agLines.length ? agLines.map((l, i) => {
        const parts = l.split('·').map(x => x.trim());
        return parts.length >= 2 ? [parts[0], parts[1], parts[2] || 'Sessão interativa'] : [`Etapa ${i + 1}`, l, 'Atividade prática'];
      }) : [[WS_NEW.hora || '10:00', 'Abertura e prática guiada', 'Sessão principal e perguntas']];
      const novo = {
        id, codigo, titulo: WS_NEW.titulo.trim(), area: WS_NEW.area || 'Negócios', tipo: WS_NEW.tipo || 'Workshop',
        formato: WS_NEW.formato || 'Presencial', nivel: 'Todos os níveis', data: WS_NEW.data || addDays(10),
        hora: WS_NEW.hora || '10:00', duracao: WS_NEW.duracao || '2h', local: WS_NEW.local || 'Luanda',
        sala: WS_NEW.sala || 'Sala principal', vagas: WS_NEW.vagas || 30, preco: WS_NEW.preco || 0,
        resumo: WS_NEW.resumo || 'Workshop prático publicado na AMA.',
        objetivos: ['Aplicar métodos práticos durante a sessão', 'Conhecer profissionais e trocar experiências', 'Levar um plano de ação imediato'],
        agenda,
        palestrantes: [{ nome: WS_NEW.orador || (S.user ? S.user.nome : 'Organizador AMA'), papel: WS_NEW.papel || 'Facilitador', org: 'AMA', bio: 'Facilitador convidado deste workshop.', vip: true, destaque: true, slots: 4 }],
        temasVoto: ['Casos práticos em Angola', 'Perguntas abertas com a plateia', 'Ferramentas para aplicar amanhã'],
        criadorId: S.user ? S.user.id : null,
      };
      d.eventos.unshift(novo);
      save(d);
      WS_NEW.published = novo;
      toast('Workshop publicado! Bilhetes e networking já estão ativos.');
      render();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    },
  };

  const WS_NEW = {
    titulo: '', area: 'Negócios', tipo: 'Workshop', formato: 'Presencial',
    data: addDays(10), hora: '10:00', duracao: '2h', local: 'Luanda · Talatona',
    sala: 'Auditório AMA', vagas: 30, preco: 0, resumo: '',
    orador: '', papel: 'Facilitador', agenda: '10:00 · Abertura e contexto\n10:45 · Prática guiada\n11:30 · Q&A e networking',
    published: null,
  };
  function wsNewPreview() {
    const fake = { id: 'preview', data: WS_NEW.data || addDays(10), hora: WS_NEW.hora || '10:00', titulo: WS_NEW.titulo || 'Título do seu workshop', resumo: WS_NEW.resumo || 'A descrição do seu evento aparece aqui.', tipo: WS_NEW.tipo, formato: WS_NEW.formato, preco: WS_NEW.preco, vagas: WS_NEW.vagas };
    return `<div class="cr-preview-card">
      <span class="cr-prev-lbl">PRÉ-VISUALIZAÇÃO DO EVENTO</span>
      <article class="ws-card" style="pointer-events:none">
        <div class="ws-top">${dataBloco(fake)}<div class="ws-head"><div class="ws-tags">${chip(fake.tipo)}${chip(fake.formato)}</div><h3>${esc(fake.titulo)}</h3><p>${esc(fake.resumo)}</p></div></div>
        <div class="ws-body"><div class="ws-foot"><div class="ws-spoke">${I.profile}<span><b>${esc(WS_NEW.orador || (S.user ? S.user.nome : 'O seu nome'))}</b><small>${esc(WS_NEW.papel)}</small></span></div><div class="ws-price">${fake.preco ? money(fake.preco) : '<b>Grátis</b>'}</div></div></div>
      </article>
      <div class="cr-prev-meta"><div><b>${WS_NEW.vagas}</b><span>vagas</span></div><div><b>${esc(WS_NEW.formato)}</b><span>formato</span></div><div><b>Ativo</b><span>check-in</span></div></div>
    </div>`;
  }

  on('/workshops/criar', async () => {
    if (!WS_NEW.orador && S.user) WS_NEW.orador = S.user.nome;
    const pub = WS_NEW.published;
    return shellPublic(`
    <main class="ama-studio">
      <div class="page-h" style="margin-bottom:18px">
        <div><a class="uni-back-lnk" href="#/workshops">${I.back} Voltar aos workshops</a><h1 style="margin-top:8px">Publicar workshop ou evento</h1><p>Crie um workshop presencial, online ou híbrido com bilhetes digitais, lista de espera e check-in prontos a usar.</p></div>
        <a class="btn btn-o btn-sm" href="#/instrutor/criar">${I.book} Publicar curso</a>
      </div>
      ${pub ? `<div class="card cr-launched">
        <span class="bt-badge lime">WORKSHOP PUBLICADO</span>
        <h2>«${esc(pub.titulo)}» já está no calendário!</h2>
        <p>Código ${esc(pub.codigo)} · Os participantes já podem inscrever-se, emitir bilhete e fazer networking.</p>
        <div class="flex" style="gap:10px;flex-wrap:wrap;margin-top:14px">
          <a class="btn btn-p" href="#/workshop/${pub.id}">Ver página do workshop ${I.arrow}</a>
          <button type="button" class="btn btn-f" onclick="WS.partilhar('${pub.id}')">Copiar convite</button>
          <a class="btn btn-o" href="#/checkin">Abrir porta de check-in</a>
          <button type="button" class="btn btn-o" onclick="WS.ics('${pub.id}')">Descarregar .ics</button>
        </div>
      </div>` : ''}
      <div class="cr-tpl-bar">
        <span>Começar com modelo:</span>
        <button type="button" class="btn btn-o btn-sm" onclick="WS.tpl('luanda')">📍 Workshop Presencial (Luanda)</button>
        <button type="button" class="btn btn-o btn-sm" onclick="WS.tpl('online')">💻 Masterclass Online Grátis</button>
        <button type="button" class="btn btn-o btn-sm" onclick="WS.tpl('mesa')">🤝 Mesa-Redonda &amp; Networking</button>
      </div>
      <div class="cr-layout">
        <div class="cr-form-col">
          <div class="card">
            <h3 style="margin-bottom:14px">1. Detalhes do workshop</h3>
            <div class="field"><label>Título do evento</label><input id="wn-tit" value="${escAttr(WS_NEW.titulo)}" oninput="WS.syncNew()" placeholder="Ex.: Workshop Prático de Vendas B2B em Luanda"></div>
            <div class="grid g-3" style="gap:12px">
              <div class="field"><label>Área</label><select id="wn-area" onchange="WS.syncNew()">${['Negócios', 'Comunicação', 'Tecnologia', 'Finanças', 'Liderança'].map(a => `<option ${WS_NEW.area === a ? 'selected' : ''}>${a}</option>`).join('')}</select></div>
              <div class="field"><label>Tipo</label><select id="wn-tipo" onchange="WS.syncNew()">${['Workshop', 'Masterclass', 'Mesa-redonda', 'Bootcamp'].map(a => `<option ${WS_NEW.tipo === a ? 'selected' : ''}>${a}</option>`).join('')}</select></div>
              <div class="field"><label>Formato</label><select id="wn-for" onchange="WS.syncNew()">${['Presencial', 'Online', 'Híbrido'].map(a => `<option ${WS_NEW.formato === a ? 'selected' : ''}>${a}</option>`).join('')}</select></div>
            </div>
            <div class="grid g-3" style="gap:12px">
              <div class="field"><label>Data</label><input id="wn-data" type="date" value="${escAttr(WS_NEW.data)}" oninput="WS.syncNew()"></div>
              <div class="field"><label>Hora</label><input id="wn-hora" type="time" value="${escAttr(WS_NEW.hora)}" oninput="WS.syncNew()"></div>
              <div class="field"><label>Duração</label><input id="wn-dur" value="${escAttr(WS_NEW.duracao)}" oninput="WS.syncNew()" placeholder="Ex.: 2h30"></div>
            </div>
            <div class="grid g-2" style="gap:12px">
              <div class="field"><label>Local / Cidade</label><input id="wn-loc" value="${escAttr(WS_NEW.local)}" oninput="WS.syncNew()"></div>
              <div class="field"><label>Sala ou Link</label><input id="wn-sala" value="${escAttr(WS_NEW.sala)}" oninput="WS.syncNew()"></div>
            </div>
            <div class="grid g-2" style="gap:12px">
              <div class="field"><label>Vagas disponíveis</label><input id="wn-vagas" type="number" min="5" value="${WS_NEW.vagas}" oninput="WS.syncNew()"></div>
              <div class="field"><label>Preço em Kz (0 = Grátis)</label><input id="wn-preco" type="number" min="0" step="500" value="${WS_NEW.preco}" oninput="WS.syncNew()"></div>
            </div>
            <div class="field"><label>Resumo do encontro</label><textarea id="wn-res" rows="3" oninput="WS.syncNew()" placeholder="O que os participantes vão praticar e levar deste workshop?">${esc(WS_NEW.resumo)}</textarea></div>
          </div>
          <div class="card" style="margin-top:16px">
            <h3 style="margin-bottom:14px">2. Facilitador e agenda</h3>
            <div class="grid g-2" style="gap:12px">
              <div class="field"><label>Nome do facilitador</label><input id="wn-ora" value="${escAttr(WS_NEW.orador)}" oninput="WS.syncNew()" placeholder="O seu nome"></div>
              <div class="field"><label>Papel / especialidade</label><input id="wn-pap" value="${escAttr(WS_NEW.papel)}" oninput="WS.syncNew()" placeholder="Ex.: Consultor Financeiro"></div>
            </div>
            <div class="field"><label>Agenda (1 etapa por linha: Hora · Título)</label><textarea id="wn-ag" rows="4" oninput="WS.syncNew()">${esc(WS_NEW.agenda)}</textarea></div>
            <div class="flex" style="gap:10px;flex-wrap:wrap;margin-top:12px">
              <button type="button" class="btn btn-p btn-lg" onclick="WS.publicarNovo()">${I.check} Publicar workshop agora</button>
              <span class="muted" style="font-size:12px;align-self:center">Guardado localmente neste navegador.</span>
            </div>
          </div>
        </div>
        <aside class="cr-side-col" id="wn-prev">${wsNewPreview()}</aside>
      </div>
    </main>`, 'workshops');
  });

  /* navigator.clipboard.writeText devolve uma promise: o try/catch síncrono não
     apanhava a recusa de permissão e o erro ficava como rejeição não tratada.
     Aqui a recusa cai no execCommand e, se isso também falhar, diz-se à pessoa
     para copiar do ecrã — o código nunca fica só na área de transferência. */
  function copiar(txt, msg) {
    const falhou = () => {
      const ta = document.createElement('textarea');
      ta.value = txt; ta.setAttribute('readonly', '');
      ta.style.cssText = 'position:fixed;top:-40px;opacity:0';
      document.body.appendChild(ta); ta.select();
      let feito = false; try { feito = document.execCommand('copy'); } catch (e) { feito = false; }
      ta.remove();
      toast(feito ? (msg || 'Copiado.') : 'O navegador bloqueou a cópia automática — seleccione o texto no ecrã.');
    };
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) { navigator.clipboard.writeText(txt).then(() => { if (msg) toast(msg); }, falhou); return; }
    } catch (e) { /* sem API de área de transferência */ }
    falhou();
  }

  function descarregar(nome, conteudo, tipo) {
    try {
      const a = document.createElement('a');
      a.href = URL.createObjectURL(new Blob([conteudo], { type: tipo }));
      a.download = nome; document.body.appendChild(a); a.click();
      setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 1200);
    } catch { toast('O navegador não permitiu a descarga.'); }
  }
  function showModal(html) {
    fecharModal();
    const wrap = document.createElement('div');
    wrap.className = 'modal-scrim';
    wrap.style.cssText = 'position:fixed;inset:0;z-index:120;background:rgba(12,17,14,.62);display:grid;place-items:center;padding:18px';
    wrap.innerHTML = `<div style="background:var(--surface);max-width:620px;width:100%;max-height:86vh;overflow:auto;border:1px solid var(--line);padding:24px;border-radius:2px">${html}</div>`;
    wrap.addEventListener('click', e => { if (e.target === wrap) wrap.remove(); });
    document.body.appendChild(wrap);
  }
  function fecharModal() { $$('.modal-scrim,.overlay').forEach(e => e.remove()); }

  window.WS = WS;
  window.AMA_WS = { load, save, seed, ev, confirmadas, restantes, matchScore };
})();
