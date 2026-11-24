/* CEU Academy — Ecossistema Completo para Escolas & Universidades de Angola
   Sala de Turma Interativa (Programa Oficial, Matérias, Sebentas PDF, Slides 3D, Mural),
   Biblioteca de Matérias & PDFs, Aulas Online Ao Vivo com Inscrição + .ICS,
   Simulador de Média/Dispensa (0–20 valores), Pesquisa Global Rápida (Ctrl+K),
   Grandes Faculdades & Escolas, Presidentes AE & Delegados, Mentorias e Estágios. */
(function () {
  'use strict';

  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const escAttr = esc;

  const LS_KEY = 'ceu-campus-school-v2';
  const CARD_KEY = 'ceu-student-card-v1';

  const SEED_UNIVERSITIES = [
    { id: 'u-uan', sigla: 'UAN', nome: 'Universidade Agostinho Neto', tipo: 'Universidade Pública', provincia: 'Luanda', faculdades: ['Engenharia', 'Ciências', 'Economia', 'Direito', 'Medicina', 'Letras', 'Ciências Sociais'], parceria: 'Rede Académica CEU', turmasAtivas: 18 },
    { id: 'u-isptec', sigla: 'ISPTEC', nome: 'Instituto Superior Politécnico de Tecnologias e Ciências', tipo: 'Universidade Privada', provincia: 'Luanda', faculdades: ['Eng. Informática', 'Eng. Petróleos', 'Eng. Electrotécnica', 'Gestão & Finanças'], parceria: 'Parceiro Oficial CEU', turmasAtivas: 14 },
    { id: 'u-ucan', sigla: 'UCAN', nome: 'Universidade Católica de Angola', tipo: 'Universidade Privada', provincia: 'Luanda', faculdades: ['Direito', 'Economia & Gestão', 'Engenharia', 'Ciências Humanas'], parceria: 'Parceiro Oficial CEU', turmasAtivas: 12 },
    { id: 'u-uluanda', sigla: 'ULuanda', nome: 'Universidade de Luanda', tipo: 'Universidade Pública', provincia: 'Luanda', faculdades: ['Tecnologias de Informação', 'Gestão & Logística', 'Artes', 'Serviço Social'], parceria: 'Parceiro Oficial CEU', turmasAtivas: 11 },
    { id: 'u-uma', sigla: 'UMA', nome: 'Universidade Metodista de Angola', tipo: 'Universidade Privada', provincia: 'Luanda', faculdades: ['Eng. Informática', 'Direito', 'Medicina', 'Economia & Gestão'], parceria: 'Parceiro Oficial CEU', turmasAtivas: 9 },
    { id: 'u-upra', sigla: 'UPRA', nome: 'Universidade Privada de Angola', tipo: 'Universidade Privada', provincia: 'Luanda', faculdades: ['Medicina', 'Arquitetura', 'Engenharia', 'Relações Internacionais'], parceria: 'Rede Académica CEU', turmasAtivas: 8 },
    { id: 'u-utanga', sigla: 'UTANGA', nome: 'Universidade Técnica de Angola', tipo: 'Universidade Privada', provincia: 'Luanda', faculdades: ['Eng. Informática', 'Eng. Civil', 'Gestão', 'Psicologia'], parceria: 'Rede Académica CEU', turmasAtivas: 7 },
    { id: 'u-ujes', sigla: 'UJES', nome: 'Universidade José Eduardo dos Santos', tipo: 'Universidade Pública', provincia: 'Huambo', faculdades: ['Medicina', 'Direito', 'Economia', 'Ciências Agrárias', 'Politécnico'], parceria: 'Rede Nacional CEU', turmasAtivas: 9 },
    { id: 'u-umn', sigla: 'UMN', nome: 'Universidade Mandume ya Ndemufayo', tipo: 'Universidade Pública', provincia: 'Huíla', faculdades: ['Direito', 'Economia', 'Medicina', 'Politécnico da Huíla'], parceria: 'Rede Nacional CEU', turmasAtivas: 8 },
    { id: 'u-ukb', sigla: 'UKB', nome: 'Universidade Katyavala Bwila', tipo: 'Universidade Pública', provincia: 'Benguela', faculdades: ['Direito', 'Economia', 'Medicina', 'Ciências da Educação'], parceria: 'Rede Nacional CEU', turmasAtivas: 7 },
    { id: 'u-imetro', sigla: 'IMETRO', nome: 'Instituto Superior Politécnico Metropolitano de Angola', tipo: 'Universidade Privada', provincia: 'Luanda', faculdades: ['Comunicação Social', 'Direito', 'Informática', 'Gestão'], parceria: 'Parceiro Oficial CEU', turmasAtivas: 6 },
    { id: 'u-unibelas', sigla: 'Unibelas', nome: 'Universidade de Belas', tipo: 'Universidade Privada', provincia: 'Luanda', faculdades: ['Ciências da Saúde', 'Engenharia', 'Direito', 'Gestão'], parceria: 'Parceiro Oficial CEU', turmasAtivas: 6 },
    { id: 'u-imil', sigla: 'IMIL', nome: 'Instituto Médio Industrial de Luanda (Makarenko)', tipo: 'Escola / Ensino Médio Técnico', provincia: 'Luanda', faculdades: ['Informática', 'Eletricidade', 'Mecânica', 'Construção Civil'], parceria: 'Escolas CEU', turmasAtivas: 10 },
    { id: 'u-imel', sigla: 'IMEL', nome: 'Instituto Médio de Economia de Luanda', tipo: 'Escola / Ensino Médio Técnico', provincia: 'Luanda', faculdades: ['Contabilidade', 'Gestão Empresarial', 'Finanças', 'Marketing'], parceria: 'Escolas CEU', turmasAtivas: 9 },
  ];

  const SEED_CLASSES = [
    {
      id: 'cls-isptec-inf2', codigo: 'ISPTEC-INF-2A', nome: 'Algoritmos, Python & Estruturas de Dados',
      instituicao: 'ISPTEC', faculdade: 'Eng. Informática', nivel: 'Universidade',
      docente: 'Eng.ª Mei Lin Zhao', delegado: 'Delegado Turma 2A', horario: 'Seg & Qua · 14h–16h', alunos: 46, vagas: 60, subject: 'programacao',
      programa: [
        'Unidade 1 · Complexidade Algorítmica e Notação Big-O',
        'Unidade 2 · Listas, Pilhas, Filas e Tabelas de Hash em Python',
        'Unidade 3 · Pesquisa Binária e Algoritmos de Ordenação',
        'Unidade 4 · Projeto Prático: Sistema de Dados e Exame Final',
      ],
      mural: [
        { autor: 'Eng.ª Mei Lin Zhao', papel: 'Docente', data: 'Hoje', texto: 'A sebenta da Unidade 3 (Pesquisa Binária) e os slides 3D já estão disponíveis abaixo.' },
        { autor: 'Delegado Turma 2A', papel: 'Delegado', data: 'Ontem', texto: 'Grupo de resolução da ficha prática na sexta-feira às 16h na sala online.' },
      ],
    },
    {
      id: 'cls-uan-eng1', codigo: 'UAN-ENG-1A', nome: 'Física I — Mecânica e Dinâmica Aplicada',
      instituicao: 'UAN', faculdade: 'Faculdade de Engenharia', nivel: 'Universidade',
      docente: 'Prof. Nelson Duarte', delegado: 'Delegado Eng. 1.º Ano', horario: 'Ter & Qui · 08h–10h', alunos: 72, vagas: 90, subject: 'fisica',
      programa: [
        'Unidade 1 · Cinemática Vetorial: Movimento Retilíneo e Curvilíneo',
        'Unidade 2 · As Três Leis de Newton e Diagramas de Corpo Livre',
        'Unidade 3 · Trabalho, Energia Cinética e Conservação de Energia',
        'Unidade 4 · Momento Linear, Colisões e Preparação para Parcelares',
      ],
      mural: [
        { autor: 'Prof. Nelson Duarte', papel: 'Docente', data: 'Hoje', texto: 'Revejam os diagramas de forças com atrito antes da 1.ª Prova Parcelar.' },
      ],
    },
    {
      id: 'cls-ucan-eco2', codigo: 'UCAN-ECO-2B', nome: 'Finanças Corporativas & Planeamento em Kwanzas',
      instituicao: 'UCAN', faculdade: 'Economia & Gestão', nivel: 'Universidade',
      docente: 'Prof. Duarte Costa', delegado: 'Delegado Eco 2B', horario: 'Ter & Qui · 16h–18h', alunos: 54, vagas: 70, subject: 'financas',
      programa: [
        'Unidade 1 · Valor Temporal do Dinheiro: Juro Simples e Composto',
        'Unidade 2 · Inflação, Taxa Real e Câmbio no Mercado Angolano',
        'Unidade 3 · Avaliação de Projetos: VAL (VPL), TIR e Payback',
        'Unidade 4 · Gestão de Tesouraria e Orçamento Empresarial em Kz',
      ],
      mural: [],
    },
    {
      id: 'cls-ceu-mkt1', codigo: 'CEU-MKT-01', nome: 'Marketing Digital, Meta Ads & Redes em Angola',
      instituicao: 'CEU Academy', faculdade: 'Escola Online Aberta', nivel: 'Curso Livre',
      docente: 'Prof.ª Sofia Almeida', delegado: 'Coordenação CEU Marketing', horario: 'Sáb · 10h–12h (Online)', alunos: 118, vagas: 200, subject: 'empreendedorismo',
      programa: [
        'Unidade 1 · Posicionamento de Marca e Calendário Editorial 4:3:3',
        'Unidade 2 · Produção de Vídeo Curto (Reels/TikTok) que Retém Atenção',
        'Unidade 3 · Tráfego Pago em Angola: Segmentação e Orçamento em Kwanzas',
        'Unidade 4 · Funil de Conversão WhatsApp Business, Métricas CAC e ROAS',
      ],
      mural: [],
    },
    {
      id: 'cls-ceu-ing1', codigo: 'CEU-ING-B2', nome: 'Inglês Académico, Speaking & Entrevistas de Estágio',
      instituicao: 'CEU Academy', faculdade: 'Idiomas & Carreira', nivel: 'Curso Livre',
      docente: 'Prof.ª Carla Mendes', delegado: 'Coordenação CEU Idiomas', horario: 'Seg, Qua & Sex · 18h30', alunos: 134, vagas: 200, subject: 'geral',
      programa: [
        'Unidade 1 · Academic Reading: Como Ler Artigos Científicos em Inglês',
        'Unidade 2 · Confident Speaking & University Presentations',
        'Unidade 3 · Professional Emails, International CV & LinkedIn Profile',
        'Unidade 4 · Job & Scholarship Interview Simulation (STAR Method)',
      ],
      mural: [],
    },
    {
      id: 'cls-imil-12a', codigo: 'IMIL-INF-12A', nome: 'Preparação ao Ensino Superior — Matemática & Redes',
      instituicao: 'IMIL', faculdade: 'Curso Técnico de Informática', nivel: 'Escola / Ensino Médio',
      docente: 'Prof.ª Ana Silva', delegado: 'Chefe de Turma 12.ª A', horario: 'Ter & Sex · 13h30–15h', alunos: 39, vagas: 45, subject: 'matematica',
      programa: [
        'Unidade 1 · Álgebra, Polinómios, Equações e Inequações',
        'Unidade 2 · Funções Reais, Exponenciais e Logaritmos',
        'Unidade 3 · Limites, Derivadas e Problemas de Exames de Acesso (UAN/ISPTEC)',
        'Unidade 4 · Fundamentos de Redes TCP/IP e Simulado GeralCronometrado',
      ],
      mural: [],
    },
  ];

  const SEED_LESSONS = [
    { id: 'les-1', turmaId: 'cls-uan-eng1', turmaNome: 'UAN-ENG-1A · Física I', titulo: 'Leis de Newton & Dinâmica com Modelos 3D', autor: 'Prof. Nelson Duarte', tipo: 'Slides 3D + PDF', data: 'Hoje', resumo: 'Explicação visual das 3 leis de Newton com exemplos rodoviários de Luanda, diagrama de forças 3D e 5 questões de exame.', slidesText: 'Primeira Lei e Inércia\nInércia é a tendência de qualquer corpo manter o seu estado de repouso ou movimento retilíneo uniforme enquanto a força resultante for nula.\nSegunda Lei: F = m × a\nUm veículo de 1000 kg que acelera a 2 m/s² exige uma força resultante de 2000 N.\nTerceira Lei: Ação e Reação\nAs forças atuam em corpos diferentes e têm igual módulo e sentidos opostos.', subject: 'fisica' },
    { id: 'les-2', turmaId: 'cls-ceu-mkt1', turmaNome: 'CEU-MKT-01 · Marketing Digital', titulo: 'Funil de Vendas & Anúncios em Kwanzas (Angola)', autor: 'Prof.ª Sofia Almeida', tipo: 'Slides 3D + Sebenta', data: 'Ontem', resumo: 'Como estruturar campanhas de baixo orçamento para negócios angolanos, medir CAC/ROAS e converter via WhatsApp Business.', slidesText: 'Os 3 Pilares do Conteúdo Digital\nConteúdo que vende educa, inspira e apresenta prova social real no mercado angolano.\nSegmentação de Anúncios em Angola\nSegmente por província (Luanda, Benguela, Huambo), faixa etária e interesse com 3 criativos em teste A/B.\nFunil Alcance → Lead → WhatsApp → Venda\nSem acompanhamento disciplinado no WhatsApp Business, até 60% dos contactos qualificados perdem-se.', subject: 'empreendedorismo' },
    { id: 'les-3', turmaId: 'cls-ceu-ing1', turmaNome: 'CEU-ING-B2 · Inglês Académico', titulo: 'Academic Presentations & Job Interview Pitch (EN)', autor: 'Prof.ª Carla Mendes', tipo: 'Sebenta PDF + Áudio', data: 'Há 2 dias', resumo: 'Estruturas essenciais em inglês para abrir apresentações universitárias, defender projetos e responder em entrevistas de estágio.', slidesText: 'Structuring an Academic Presentation in English\nHook the audience in 15 seconds, signpost three key points, and close with a clear takeaway.\nThe STAR Method for Internship Interviews\nDescribe Situation, Task, Action and measurable Result using confident action verbs.\nCommon Pitfalls for Portuguese Speakers\nAvoid false friends like actually vs atualmente and practice clear pronunciation of technical terms.', subject: 'geral' },
    { id: 'les-4', turmaId: 'cls-imil-12a', turmaNome: 'IMIL-INF-12A · Matemática', titulo: 'Funções, Limites e Preparação de Exame de Acesso', autor: 'Prof.ª Ana Silva', tipo: 'Sebenta PDF + Slides', data: 'Há 3 dias', resumo: 'Revisão guiada dos exercícios mais frequentes nos exames de acesso da UAN, ISPTEC e ULuanda.', slidesText: 'Domínio e Imagem de Funções\nIdentifique restrições de denominador nulo e raízes de índice par antes de esboçar o gráfico.\nCálculo de Limites e Indeterminações 0/0\nFatore numerador e denominador ou racionalize expressões com radicais.\nEstratégia de Exame de Acesso\nResolva primeiro as questões diretas em 25 minutos e reserve tempo final para verificação de sinais.', subject: 'matematica' },
  ];

  const SEED_SUBJECTS = [
    {
      id: 'sub-calc', area: 'Exatas & Tech', titulo: 'Cálculo I & Análise Matemática', nivel: '1.º Ano / Acesso', subject: 'matematica', turmaId: 'cls-imil-12A',
      programa: ['Funções reais, domínio, paridade e inversas', 'Limites notáveis, continuidade e indeterminações', 'Derivadas: regra da cadeia, máximos e mínimos', 'Primitivas imediatas e integral definido'],
      formulas: ['lim (x→0) sen(x)/x = 1', '(u · v)\' = u\'v + uv\'', 'f\'(x) = 0 ⇒ pontos críticos de máximo/mínimo'],
      resumo: 'Base indispensável para Engenharias, Economia e Ciências. Domine o estudo completo de funções e otimização com exercícios passo a passo.',
      perguntas: ['Como levantar uma indeterminação do tipo 0/0 com raízes quadradas?', 'Qual é a interpretação geométrica e económica da derivada num ponto?', 'Como confirmar se um ponto crítico é máximo ou mínimo local?'],
    },
    {
      id: 'sub-fis', area: 'Exatas & Tech', titulo: 'Física I — Mecânica Clássica & Energia', nivel: '1.º Ano / 12.ª Classe', subject: 'fisica', turmaId: 'cls-uan-eng1',
      programa: ['Cinemática escalar e vetorial (MRU, MRUV, projéteis)', 'Leis de Newton, atrito estático/cinético e plano inclinado', 'Trabalho de uma força, potência e Teorema da Energia Cinética', 'Conservação do momento linear e colisões'],
      formulas: ['F_res = m · a', 'E_c = ½ m · v²   |   E_pg = m · g · h', 'W_total = ΔE_c'],
      resumo: 'Da análise de forças em pontes e veículos à conservação de energia em sistemas reais em Angola.',
      perguntas: ['Porque é que as forças de ação e reação nunca se anulam entre si?', 'Como decompor o peso num plano inclinado com ângulo θ?', 'Quando é que a energia mecânica total de um sistema se conserva?'],
    },
    {
      id: 'sub-py', area: 'Exatas & Tech', titulo: 'Programação Python & Estruturas de Dados', nivel: '1.º & 2.º Ano', subject: 'programacao', turmaId: 'cls-isptec-inf2',
      programa: ['Variáveis, condicionais, ciclos e funções modulares', 'Listas, dicionários, conjuntos e leitura de ficheiros CSV/JSON', 'Pesquisa linear vs. binária e complexidade O(log n)', 'Consumo de APIs REST e automação de relatórios'],
      formulas: ['Pesquisa Binária: máx. log₂(N) comparações', 'Lista ordenada de 1.024 itens → máx. 10 passos'],
      resumo: 'Aprenda a pensar de forma algorítmica, escrever código Python limpo e construir projetos reais para estágios.',
      perguntas: ['Qual é a condição obrigatória para aplicar pesquisa binária numa lista?', 'Quando devemos preferir um dicionário (hash map) em vez de uma lista?', 'Como evitar ciclos infinitos num bloco while?'],
    },
    {
      id: 'sub-mkt', area: 'Negócios & Finanças', titulo: 'Marketing Digital, Tráfego & Vendas em Angola', nivel: 'Curso Prático', subject: 'empreendedorismo', turmaId: 'cls-ceu-mkt1',
      programa: ['Estratégia de conteúdo 4:3:3 (educar, inspirar, provar)', 'Guiões de vídeo curto e retenção nos primeiros 2 segundos', 'Gestão de anúncios Meta/TikTok Ads com orçamento em Kwanzas', 'Funil WhatsApp Business, CRM simples e métricas CAC/ROAS'],
      formulas: ['ROAS = Receita Gerada ÷ Investimento em Anúncios', 'CAC = Custo Total de Aquisição ÷ Novos Clientes'],
      resumo: 'Guia prático para criar campanhas digitais lucrativas para empresas, projetos universitários e marcas angolanas.',
      perguntas: ['Qual é a diferença prática entre alcance topo de funil e campanha de conversão?', 'Como reduzir o desperdício de orçamento no atendimento por WhatsApp?', 'Que métricas indicam que o criativo do anúncio precisa ser trocado?'],
    },
    {
      id: 'sub-ing', area: 'Idiomas & Direito', titulo: 'Inglês Académico, Speaking & Bolsas (B1–C1)', nivel: 'Todos os níveis', subject: 'geral', turmaId: 'cls-ceu-ing1',
      programa: ['Academic connectors & reading scientific papers fast', 'Structuring university presentations (Hook → Body → Takeaway)', 'Writing formal emails, cover letters & international CVs', 'Job & scholarship interview mastery with the STAR framework'],
      formulas: ['STAR = Situation · Task · Action · Result', 'Signposting: "First, let us examine…" / "To sum up…"'],
      resumo: 'Inglês focado no que abre portas: ler bibliografia técnica, apresentar sem bloqueios e passar em entrevistas.',
      perguntas: ['How do you structure a 90-second "Tell me about yourself" pitch?', 'What is the difference between "actually" and "currently"?', 'How do you highlight measurable impact using the STAR method?'],
    },
    {
      id: 'sub-fin', area: 'Negócios & Finanças', titulo: 'Contabilidade, Juros & Finanças em Kwanzas', nivel: '1.º & 2.º Ano', subject: 'financas', turmaId: 'cls-ucan-eco2',
      programa: ['Balanço patrimonial: Ativo, Passivo e Capital Próprio', 'Capitalização simples vs. composta e Regra dos 72', 'Inflação, taxa de juro nominal vs. ganho real em Kz', 'Análise de viabilidade: VAL (VPL), TIR e Ponto de Equilíbrio'],
      formulas: ['M = C · (1 + i)^n', 'Taxa Real ≈ [(1 + i_nom) ÷ (1 + inflação)] − 1'],
      resumo: 'Domine os cálculos financeiros essenciais para Economia, Gestão, Contabilidade e decisões empresariais.',
      perguntas: ['Porque é que um investimento com retorno inferior à inflação perde poder de compra?', 'Como funciona a equação fundamental da contabilidade (Ativo = Passivo + CP)?', 'Quando um projeto com VAL > 0 deve ser aceite?'],
    },
    {
      id: 'sub-dir', area: 'Idiomas & Direito', titulo: 'Direito Constitucional & Metodologia Jurídica', nivel: '1.º Ano Direito', subject: 'historia', turmaId: 'cls-ucan-eco2',
      programa: ['Princípios fundamentais da Constituição da República de Angola', 'Direitos, liberdades e garantias fundamentais dos cidadãos', 'Organização do poder político e separação de funções', 'Interpretação da norma jurídica e resolução de casos práticos'],
      formulas: ['Método Jurídico: Factos → Norma Aplicável → Subsunção → Conclusão'],
      resumo: 'Síntese clara da arquitetura constitucional angolana e do método de resolução de hipóteses práticas em exame.',
      perguntas: ['Como estruturar a resposta a um caso prático de Direito em 4 etapas?', 'Em que consiste o princípio da constitucionalidade e hierarquia das normas?', 'Qual a distinção entre órgãos de soberania e administração local?'],
    },
    {
      id: 'sub-bio', area: 'Saúde', titulo: 'Biologia Celular, Genética & Ecossistemas', nivel: 'Ensino Médio / 1.º Ano Saúde', subject: 'biologia', turmaId: 'cls-uan-eng1',
      programa: ['Organização celular: membrana, organelos e transporte ativo/passivo', 'Metabolismo energético: respiração celular e fotossíntese', 'Duplicação do ADN, síntese proteica, mitose e meiose', 'Genética mendeliana e biodiversidade angolana (Maiombe / Cangandala)'],
      formulas: ['Fotossíntese: 6 CO₂ + 6 H₂O + luz → C₆H₁₂O₆ + 6 O₂', 'Fluxo génico: ADN → ARN mensageiro → Proteína'],
      resumo: 'Revisão visual para Ciências da Saúde, Medicina, Enfermagem, Biologia e exames de acesso.',
      perguntas: ['Qual a diferença essencial entre mitose e meiose quanto à variabilidade genética?', 'Onde ocorrem a fase fotoquímica e o ciclo de Calvin?', 'Como diferenciar transporte passivo por osmose de transporte ativo?'],
    },
  ];

  const SEED_ONLINE_CLASSES = [
    { id: 'onl-1', titulo: 'Intensivo ao Vivo: Resolução de Exame de Física I & Dinâmica', docente: 'Prof. Nelson Duarte', instituicao: 'UAN · Aberta a todas as turmas', dataHora: 'Hoje · 18h30 (60 min)', estado: 'AO VIVO', inscritos: 84, vagas: 150, subject: 'fisica', resumo: 'Resolução passo a passo de 6 problemas clássicos de leis de Newton, plano inclinado e conservação de energia com espaço aberto para dúvidas.' },
    { id: 'onl-2', titulo: 'English Speaking Club: Simulação de Entrevista de Estágio', docente: 'Prof.ª Carla Mendes', instituicao: 'CEU Idiomas', dataHora: 'Amanhã · 19h00 (50 min)', estado: 'INSCRIÇÕES ABERTAS', inscritos: 62, vagas: 100, subject: 'geral', resumo: 'Prática guiada em inglês do método STAR, vocabulário corporativo e feedback imediato de pronúncia.' },
    { id: 'onl-3', titulo: 'Masterclass Prática: Campanha Real de Marketing Digital em Kz', docente: 'Prof.ª Sofia Almeida', instituicao: 'CEU Marketing', dataHora: 'Quinta · 18h00 (60 min)', estado: 'INSCRIÇÕES ABERTAS', inscritos: 95, vagas: 200, subject: 'empreendedorismo', resumo: 'Construção ao vivo de criativos, segmentação para Luanda/Benguela/Huambo e estrutura de fecho no WhatsApp.' },
    { id: 'onl-4', titulo: 'Maratona de Cálculo & Matemática — Preparação Exames de Acesso', docente: 'Prof.ª Ana Silva', instituicao: 'IMIL / ISPTEC / UAN', dataHora: 'Sábado · 10h00 (90 min)', estado: 'INSCRIÇÕES ABERTAS', inscritos: 141, vagas: 250, subject: 'matematica', resumo: 'Limites, derivadas e estudo de funções com foco nas provas parcelares e exames de admissão universitária.' },
    { id: 'onl-5', titulo: 'Laboratório Python: Do CSV ao Dashboard Financeiro', docente: 'Eng.ª Mei Lin Zhao', instituicao: 'ISPTEC · Eng. Informática', dataHora: 'Sábado · 15h00 (75 min)', estado: 'INSCRIÇÕES ABERTAS', inscritos: 58, vagas: 120, subject: 'programacao', resumo: 'Sessão mão-na-massa de tratamento de dados reais e criação de portfólio técnico para estágios.' },
  ];

  const SEED_DELEGATES = [
    { id: 'del-uan', nome: 'Presidência da Associação de Estudantes — UAN', cargo: 'Presidente AE', instituicao: 'UAN', faculdade: 'Associação de Estudantes (Geral)', contacto: 'ae.uan@ceu.ao · Perfil institucional', comunicado: 'Abertas as inscrições para as Jornadas Científicas e grupos de revisão de Cálculo e Física.' },
    { id: 'del-isptec', nome: 'Presidência da Associação de Estudantes — ISPTEC', cargo: 'Presidente AE', instituicao: 'ISPTEC', faculdade: 'Conselho Estudantil ISPTEC', contacto: 'ae.isptec@ceu.ao · Perfil institucional', comunicado: 'Hackathon Académico & Feira de Estágios de Engenharia com empresas parceiras este mês.' },
    { id: 'del-ucan', nome: 'Presidência da Associação de Estudantes — UCAN', cargo: 'Presidente AE', instituicao: 'UCAN', faculdade: 'AE-UCAN (Direito, Economia & Eng.)', contacto: 'ae.ucan@ceu.ao · Perfil institucional', comunicado: 'Ciclo de mentorias de carreira, debates jurídicos e apoio à monografia com docentes.' },
    { id: 'del-uluanda', nome: 'Coordenação Estudantil — Universidade de Luanda', cargo: 'Presidente AE', instituicao: 'ULuanda', faculdade: 'Associação de Estudantes ULuanda', contacto: 'ae.uluanda@ceu.ao · Perfil institucional', comunicado: 'Registo de novos delegados de turma aberto para o semestre letivo 2026/2027.' },
    { id: 'del-imil', nome: 'Conselho de Chefes de Turma — IMIL', cargo: 'Delegado Geral', instituicao: 'IMIL', faculdade: 'Ensino Médio Técnico', contacto: 'delegados.imil@ceu.ao · Perfil institucional', comunicado: 'Aulas de preparação gratuita de Matemática e Informática para o acesso ao Ensino Superior.' },
    { id: 'del-turma1', nome: 'Delegado de Turma — Eng. Informática 2.º A', cargo: 'Delegado de Turma', instituicao: 'ISPTEC', faculdade: 'Eng. Informática', contacto: 'Turma ISPTEC-INF-2A', comunicado: 'Todos os slides e sebentas PDF de Python já estão disponíveis na Sala da Turma.' },
  ];

  const SEED_MENTORSHIPS = [
    { id: 'men-1', mentor: 'Eng.ª Mei Lin Zhao', area: 'Tecnologia & IA', instituicao: 'ISPTEC / CEU', tema: 'Portfólio em Python, GitHub e 1.º estágio em Software', formato: 'Online · 45 min', horario: 'Quintas · 17h30', vagas: 6 },
    { id: 'men-2', mentor: 'Prof.ª Sofia Almeida', area: 'Marketing Digital', instituicao: 'CEU Academy', tema: 'Revisão de estratégia digital, redes sociais e portfólio criativo', formato: 'Online · 45 min', horario: 'Terças · 18h00', vagas: 8 },
    { id: 'men-3', mentor: 'Prof.ª Carla Mendes', area: 'Inglês & Bolsas', instituicao: 'CEU Idiomas', tema: 'Simulação de entrevista em inglês e candidaturas a bolsas internacionais', formato: 'Online · 40 min', horario: 'Quartas · 19h00', vagas: 5 },
    { id: 'men-4', mentor: 'Prof. Duarte Costa', area: 'Finanças & Carreira', instituicao: 'UCAN / Banca', tema: 'CV financeiro, Excel/Power BI e preparação para estágios bancários', formato: 'Online / Presencial', horario: 'Sábados · 09h30', vagas: 7 },
    { id: 'men-5', mentor: 'Prof. Adolfo Camacho', area: 'Defesa de Tese & Liderança', instituicao: 'UAN / CEU', tema: 'Estrutura de monografia, postura de palco e gestão de associações estudantis', formato: 'Online · 45 min', horario: 'Sextas · 16h30', vagas: 6 },
    { id: 'men-6', mentor: 'Prof.ª Ana Silva', area: 'Acesso à Universidade', instituicao: 'IMIL / ULuanda', tema: 'Plano de revisão de Matemática e Física para estudantes da 12.ª/13.ª classe', formato: 'Grupo · 60 min', horario: 'Sábados · 14h00', vagas: 20 },
  ];

  const SEED_INTERNSHIPS = [
    { id: 'int-1', titulo: 'Estágio Júnior em Desenvolvimento Web & IA', empresa: 'Horizonte Futuro Tech', local: 'Luanda · Híbrido', area: 'Tecnologia', duracao: '6 meses', bolsa: 'Remunerado + Mentoria', requisitos: 'Estudante de Informática/Engenharia ou curso Python CEU.' },
    { id: 'int-2', titulo: 'Estágio em Marketing Digital & Gestão de Conteúdo', empresa: 'Rede Parceira CEU Media', local: 'Luanda · Remoto/Híbrido', area: 'Marketing', duracao: '4 meses', bolsa: 'Subsídio + Certificado', requisitos: 'Conhecimentos de redes sociais, copywriting e curso Marketing CEU.' },
    { id: 'int-3', titulo: 'Estágio Académico — Análise Financeira & Dados', empresa: 'Parceiro Bancário Luanda', local: 'Luanda · Presencial', area: 'Finanças', duracao: '6 meses', bolsa: 'Bolsa de Estágio', requisitos: '3.º/4.º ano de Economia, Gestão ou Contabilidade + Excel/Power BI.' },
    { id: 'int-4', titulo: 'Estágio Técnico — Redes, Energia & Automação', empresa: 'Polo Industrial de Viana', local: 'Viana, Luanda · Presencial', area: 'Engenharia', duracao: '6 meses', bolsa: 'Bolsa + Transporte', requisitos: 'Finalistas do IMIL, UAN, ISPTEC ou UTANGA.' },
    { id: 'int-5', titulo: 'Estágio em Comunicação Bilíngue & Relações Institucionais', empresa: 'Hub Internacional de Negócios AO', local: 'Benguela / Luanda · Híbrido', area: 'Idiomas', duracao: '4 meses', bolsa: 'Remunerado', requisitos: 'Inglês B2+ e boa expressão escrita.' },
  ];

  let pomoTimerId = null;
  let examTimerId = null;

  const CS = {
    tab: 'turmas', // 'turmas' | 'materias' | 'exames' | 'online' | 'universidades' | 'delegados' | 'carreira'
    activeClassId: '',
    classSubView: 'programa', // 'programa' | 'pauta'
    liveRoomId: '',
    uniFilter: 'Todas',
    uniQuery: '',
    turmaFilter: 'Todos',
    subjectFilter: 'Todas',
    subjectQuery: '',
    careerSubTab: 'todos', // 'todos' | 'mentorias' | 'estagios'
    examMode: 'simulado', // 'simulado' | 'flashcards'
    activeExamId: 'ex-acesso-mat',
    examAnswers: {},
    examResult: null,
    examSecLeft: 900,
    fcSubject: 'Todas',
    fcIdx: 0,
    fcFlipped: false,
    fcKnown: {},
    showFcGen: false,
    pomoSec: 1500,
    pomoRunning: false,
    showCreateClass: false,
    showPublishLesson: false,
    showCreateOnline: false,
    showAddDelegate: false,
    showAddUni: false,
    showGradeCalc: false,
    showFinder: false,
    finderQuery: '',
    pp1: '13',
    pp2: '15',
    pesoFreq: '0.4', // 40% freq + 60% exame (padrão universitário AO) ou 0.5
    dbLoaded: false,
    data: null,
  };

  function loadState() {
    if (CS.data) return CS.data;
    let saved = null;
    try { saved = JSON.parse(localStorage.getItem(LS_KEY) || 'null'); } catch { saved = null; }
    CS.data = {
      universities: (saved && Array.isArray(saved.universities) && saved.universities.length) ? saved.universities : JSON.parse(JSON.stringify(SEED_UNIVERSITIES)),
      classes: (saved && Array.isArray(saved.classes) && saved.classes.length) ? saved.classes : JSON.parse(JSON.stringify(SEED_CLASSES)),
      lessons: (saved && Array.isArray(saved.lessons) && saved.lessons.length) ? saved.lessons : JSON.parse(JSON.stringify(SEED_LESSONS)),
      subjects: JSON.parse(JSON.stringify(SEED_SUBJECTS)),
      onlineClasses: (saved && Array.isArray(saved.onlineClasses) && saved.onlineClasses.length) ? saved.onlineClasses : JSON.parse(JSON.stringify(SEED_ONLINE_CLASSES)),
      delegates: (saved && Array.isArray(saved.delegates) && saved.delegates.length) ? saved.delegates : JSON.parse(JSON.stringify(SEED_DELEGATES)),
      mentorships: (saved && Array.isArray(saved.mentorships) && saved.mentorships.length) ? saved.mentorships : JSON.parse(JSON.stringify(SEED_MENTORSHIPS)),
      internships: (saved && Array.isArray(saved.internships) && saved.internships.length) ? saved.internships : JSON.parse(JSON.stringify(SEED_INTERNSHIPS)),
      joinedClasses: (saved && Array.isArray(saved.joinedClasses)) ? saved.joinedClasses : ['cls-isptec-inf2', 'cls-ceu-mkt1'],
      enrolledOnline: (saved && Array.isArray(saved.enrolledOnline)) ? saved.enrolledOnline : ['onl-1'],
      completedUnits: (saved && saved.completedUnits && typeof saved.completedUnits === 'object') ? saved.completedUnits : { 'cls-isptec-inf2:0': true, 'cls-isptec-inf2:1': true },
      bookedMentorships: (saved && Array.isArray(saved.bookedMentorships)) ? saved.bookedMentorships : [],
      appliedInternships: (saved && Array.isArray(saved.appliedInternships)) ? saved.appliedInternships : [],
      customFlashcards: (saved && Array.isArray(saved.customFlashcards)) ? saved.customFlashcards : [],
    };
    // Garantir que turmas antigas sem programa/pauta recebem estrutura completa
    CS.data.classes.forEach((c) => {
      if (!Array.isArray(c.programa) || !c.programa.length) {
        c.programa = [
          `Unidade 1 · Fundamentos e Conceitos Base de ${c.nome}`,
          'Unidade 2 · Desenvolvimento Prático e Resolução de Problemas',
          'Unidade 3 · Aplicações Reais no Contexto Angolano',
          'Unidade 4 · Síntese, Revisão Geral e Preparação para Exame',
        ];
      }
      if (!Array.isArray(c.mural)) c.mural = [];
      if (!Array.isArray(c.pauta) || !c.pauta.length) {
        c.pauta = [
          { id: 'st-1', numero: 'CEU-2026-0412', nome: 'João Mateus', presente: true, pp1: 15, pp2: 16, exame: '' },
          { id: 'st-2', numero: 'CEU-2026-0589', nome: 'Ana Paula Silva', presente: true, pp1: 11, pp2: 12, exame: 11 },
          { id: 'st-3', numero: 'CEU-2026-0734', nome: 'Carlos Alberto Mendes', presente: true, pp1: 9, pp2: 10, exame: '' },
          { id: 'st-4', numero: 'CEU-2026-0891', nome: 'Helena Francisco', presente: false, pp1: 14, pp2: 14, exame: '' },
        ];
      }
    });
    return CS.data;
  }

  function persistLocal() {
    try { localStorage.setItem(LS_KEY, JSON.stringify(loadState())); } catch { }
  }

  function getStudentCard() {
    try {
      const c = JSON.parse(localStorage.getItem(CARD_KEY) || 'null');
      if (c && c.nome) return c;
    } catch { }
    return { nome: (window.S && window.S.user && window.S.user.nome) || 'Estudante CEU', universidade: 'Universidade de Luanda', numero: 'CEU-2026-0412' };
  }

  function mergeRecords(baseArr, remoteArr) {
    if (!Array.isArray(remoteArr) || !remoteArr.length) return baseArr;
    const map = new Map(baseArr.map((x) => [x.id, x]));
    for (const r of remoteArr) {
      if (r && r.id) map.set(r.id, { ...(map.get(r.id) || {}), ...r });
    }
    return Array.from(map.values());
  }

  async function hydrateFromDb() {
    if (CS.dbLoaded) return;
    const db = window.Study && window.Study.MvpDB;
    if (!db || typeof db.listCollectionRecords !== 'function') return;
    CS.dbLoaded = true;
    try {
      await db.syncWithServer().catch(() => {});
      const st = loadState();
      const [cls, les, del, men, intn, unis, onl] = await Promise.all([
        db.listCollectionRecords('classes'),
        db.listCollectionRecords('lessons'),
        db.listCollectionRecords('delegates'),
        db.listCollectionRecords('mentorships'),
        db.listCollectionRecords('internships'),
        db.listCollectionRecords('universities'),
        db.listCollectionRecords('online_classes'),
      ]);
      st.classes = mergeRecords(st.classes, cls);
      st.lessons = mergeRecords(st.lessons, les);
      st.delegates = mergeRecords(st.delegates, del);
      st.mentorships = mergeRecords(st.mentorships, men);
      st.internships = mergeRecords(st.internships, intn);
      st.universities = mergeRecords(st.universities, unis);
      st.onlineClasses = mergeRecords(st.onlineClasses, onl);
      persistLocal();
      if (/^#\/(campus|escolas|turmas|mentorias|estagios|materias|aulas-online)/.test(location.hash) && typeof render === 'function') render();
    } catch { }
  }

  /* ------------------------------------------------------------------ */
  /* Simulador Inteligente de Média & Exame (0–20 valores · Angola)     */
  /* ------------------------------------------------------------------ */
  function computeAngolaGrade(pp1Raw, pp2Raw, pesoFreqRaw) {
    const p1 = Math.max(0, Math.min(20, Number(String(pp1Raw).replace(',', '.')) || 0));
    const p2 = Math.max(0, Math.min(20, Number(String(pp2Raw).replace(',', '.')) || 0));
    const wf = Number(pesoFreqRaw) === 0.5 ? 0.5 : 0.4;
    const we = 1 - wf;
    const mf = Number(((p1 + p2) / 2).toFixed(1));
    if (mf >= 14) {
      return { mf, status: 'dispensado', badge: '🎉 DISPENSADO DE EXAME', msg: `Com média de frequência ${mf} val. (>= 14), aprova diretamente sem precisar de exame final!` };
    }
    if (mf < 7) {
      return { mf, status: 'recurso', badge: '⚠ VAI DIRETO A RECURSO', msg: `Com média ${mf} val. (< 7), na maioria dos regulamentos universitários segue diretamente para época de recurso.` };
    }
    // Nota mínima no exame para média final >= 9.5 (arredonda a 10 valores)
    const target = 9.5;
    const needed = Math.max(0, Math.ceil(((target - mf * wf) / we) * 10) / 10);
    return {
      mf,
      needed,
      status: 'exame',
      badge: '📝 APTO A EXAME NORMAL',
      msg: `Média de frequência: ${mf} val. Precisa de pelo menos ${needed.toFixed(1)} valores no Exame Final (${Math.round(wf * 100)}% Freq + ${Math.round(we * 100)}% Exame) para aprovar com 10.`,
    };
  }

  function renderGradeCalculator() {
    if (!CS.showGradeCalc) return '';
    const g = computeAngolaGrade(CS.pp1, CS.pp2, CS.pesoFreq);
    return `<section class="card cp-grade-box" data-testid="campus-grade-calc">
      <div class="cp-form-h">
        <div><span class="eyebrow-t">FERRAMENTA DO ESTUDANTE · ESCALA 0–20 VALORES</span><h3 style="margin-top:3px">Simulador de Frequência, Dispensa &amp; Exame</h3></div>
        <button type="button" class="icon-btn" aria-label="Fechar simulador" onclick="CEUCampus.toggleForm('showGradeCalc')">✕</button>
      </div>
      <div class="cp-grade-grid">
        <label>1.ª Parcelar (0–20) <input type="number" min="0" max="20" step="0.5" value="${escAttr(CS.pp1)}" oninput="CEUCampus.setGradeInput('pp1', this.value)"></label>
        <label>2.ª Parcelar (0–20) <input type="number" min="0" max="20" step="0.5" value="${escAttr(CS.pp2)}" oninput="CEUCampus.setGradeInput('pp2', this.value)"></label>
        <label>Regra da Instituição
          <select onchange="CEUCampus.setGradeInput('pesoFreq', this.value)">
            <option value="0.4" ${CS.pesoFreq === '0.4' ? 'selected' : ''}>40% Frequência + 60% Exame (UAN/ISPTEC)</option>
            <option value="0.5" ${CS.pesoFreq === '0.5' ? 'selected' : ''}>50% Frequência + 50% Exame</option>
          </select>
        </label>
        <div class="cp-grade-res is-${g.status}" id="cp-grade-res">
          <span class="cp-grade-pill">${esc(g.badge)}</span>
          <p>${esc(g.msg)}</p>
        </div>
      </div>
    </section>`;
  }

  /* ------------------------------------------------------------------ */
  /* Sala Completa da Turma (Programa, Slides, PDFs, Online, Mural)     */
  /* ------------------------------------------------------------------ */
  function renderClassroomPauta(cls) {
    const tools = (window.Study && window.Study.CampusTools) || {};
    const calcRow = tools.computeFinalPautaRow || ((r) => ({ ...r, mf: Number(((Number(r.pp1 || 0) + Number(r.pp2 || 0)) / 2).toFixed(1)), notaFinal: '—', estado: 'Em curso' }));
    const rows = (cls.pauta || []).map((r) => calcRow(r, CS.pesoFreq));
    const presCount = rows.filter((r) => r.presente !== false).length;
    const attUrl = `${location.origin}${location.pathname}#/campus?presenca=${encodeURIComponent(cls.codigo)}`;
    const qrSvg = (window.Study && window.Study.QR && typeof window.Study.QR.renderQrSvg === 'function')
      ? window.Study.QR.renderQrSvg(attUrl, { size: 96, fg: '#00217e', bg: '#ffffff', label: `QR Presença ${cls.codigo}` })
      : '';

    return `<div class="cp-pauta-wrap" data-testid="campus-classroom-pauta">
      <div class="card cp-att-card">
        <div>
          <span class="eyebrow-t">CHAMADA RÁPIDA &amp; QR DE PRESENÇA</span>
          <h3 style="margin:4px 0 6px">Registo de Presenças (${presCount}/${rows.length} presentes)</h3>
          <p class="cp-meta">Projete o código QR no quadro para os estudantes confirmarem presença com o telemóvel, ou marque manualmente na pauta abaixo.</p>
          <div class="flex wrap" style="gap:8px;margin-top:10px">
            <button type="button" class="btn btn-p btn-sm" onclick="CEUCampus.exportClassPautaCsv('${escAttr(cls.id)}')">⬇ Exportar Pauta Excel (.CSV)</button>
            <button type="button" class="btn btn-o btn-sm" onclick="CEUCampus.printClassPauta('${escAttr(cls.id)}')">🖨 Imprimir Pauta Oficial (PDF)</button>
          </div>
        </div>
        ${qrSvg ? `<div class="cp-att-qr">${qrSvg}<small>${esc(cls.codigo)}</small></div>` : ''}
      </div>

      <section class="card cp-cr-box" style="margin-top:14px">
        <div class="cp-form-h">
          <h3>📊 Mini-Pauta Automática (0–20 valores)</h3>
          <form class="flex wrap" style="gap:6px" onsubmit="event.preventDefault();CEUCampus.addPautaStudent('${escAttr(cls.id)}')">
            <input id="pf-nome" placeholder="Nome do estudante" required style="padding:6px 10px;border-radius:8px;border:1px solid var(--line);background:var(--bg);color:var(--ink);font-size:12.5px">
            <input id="pf-num" placeholder="N.º CEU" style="width:120px;padding:6px 10px;border-radius:8px;border:1px solid var(--line);background:var(--bg);color:var(--ink);font-size:12.5px">
            <button type="submit" class="btn btn-o btn-sm">+ Estudante</button>
          </form>
        </div>
        <div class="cp-table-scroll">
          <table class="cp-pauta-tbl">
            <thead>
              <tr><th>N.º CEU</th><th>Estudante</th><th>Presença</th><th>PP1</th><th>PP2</th><th>Freq.</th><th>Exame</th><th>Final</th><th>Resultado</th></tr>
            </thead>
            <tbody>
              ${rows.map((r, ri) => `<tr>
                <td><code>${esc(r.numero)}</code></td>
                <td><b>${esc(r.nome)}</b></td>
                <td><button type="button" class="cp-pres-btn ${r.presente !== false ? 'is-on' : ''}" onclick="CEUCampus.togglePresence('${escAttr(cls.id)}', ${ri})">${r.presente !== false ? '✓ Presente' : '✕ Falta'}</button></td>
                <td><input type="number" min="0" max="20" step="0.5" value="${escAttr(r.pp1 ?? '')}" onchange="CEUCampus.updatePautaGrade('${escAttr(cls.id)}', ${ri}, 'pp1', this.value)"></td>
                <td><input type="number" min="0" max="20" step="0.5" value="${escAttr(r.pp2 ?? '')}" onchange="CEUCampus.updatePautaGrade('${escAttr(cls.id)}', ${ri}, 'pp2', this.value)"></td>
                <td><b>${esc(r.mf ?? '—')}</b></td>
                <td><input type="number" min="0" max="20" step="0.5" placeholder="—" value="${escAttr(r.exame ?? '')}" onchange="CEUCampus.updatePautaGrade('${escAttr(cls.id)}', ${ri}, 'exame', this.value)"></td>
                <td><b>${r.notaFinal !== null && r.notaFinal !== undefined ? r.notaFinal : '—'}</b></td>
                <td><span class="cp-badge ${/Dispensado|Aprovado/i.test(r.estado) ? 'is-navy' : ''}">${esc(r.estado)}</span></td>
              </tr>`).join('')}
            </tbody>
          </table>
        </div>
      </section>
    </div>`;
  }

  function renderClassroomDetail(st, cls) {
    const joined = st.joinedClasses.includes(cls.id);
    const classLessons = st.lessons.filter((l) => l.turmaId === cls.id);
    const units = Array.isArray(cls.programa) ? cls.programa : [];
    const doneCount = units.filter((_, i) => st.completedUnits[`${cls.id}:${i}`]).length;
    const pct = units.length ? Math.round((doneCount / units.length) * 100) : 0;
    const mural = Array.isArray(cls.mural) ? cls.mural : [];

    return `<div class="cp-classroom" data-testid="campus-classroom-detail">
      <div class="cp-cr-top">
        <div class="flex wrap" style="gap:8px;align-items:center">
          <button type="button" class="btn btn-o btn-sm" onclick="CEUCampus.openClass('')">← Todas as Turmas</button>
          <div class="cp-pills">
            <button type="button" class="${CS.classSubView !== 'pauta' ? 'on' : ''}" onclick="CEUCampus.setClassSubView('programa')">📋 Programa &amp; Aulas</button>
            <button type="button" class="${CS.classSubView === 'pauta' ? 'on' : ''}" onclick="CEUCampus.setClassSubView('pauta')">📊 Pauta 0–20 &amp; Presenças QR</button>
          </div>
        </div>
        <div class="flex wrap" style="gap:8px">
          <button type="button" class="btn btn-o btn-sm" onclick="CEUCampus.downloadSyllabusPdf('${escAttr(cls.id)}')">📄 Baixar Programa &amp; Sebenta (PDF)</button>
          <button type="button" class="btn ${joined ? 'btn-o' : 'btn-p'} btn-sm" onclick="CEUCampus.toggleJoinClass('${escAttr(cls.id)}')">${joined ? '✓ Inscrito nesta Turma' : '+ Inscrever na Turma'}</button>
        </div>
      </div>

      <div class="card cp-cr-banner">
        <div>
          <span class="cp-badge is-navy">${esc(cls.instituicao)} · ${esc(cls.codigo)}</span>
          <h2>${esc(cls.nome)}</h2>
          <p class="cp-meta">${esc(cls.faculdade)} · Docente: <b>${esc(cls.docente)}</b> · Delegado: <b>${esc(cls.delegado)}</b> · ${esc(cls.horario)}</p>
        </div>
        <div class="cp-cr-prog">
          <small>PROGRESSO DO PROGRAMA (${doneCount}/${units.length})</small>
          <div class="cp-prog-bar"><i style="width:${pct}%"></i></div>
          <b>${pct}% estudado</b>
        </div>
      </div>

      ${CS.classSubView === 'pauta' ? renderClassroomPauta(cls) : `<div class="cp-cr-cols">
        <section class="card cp-cr-box">
          <div class="cp-form-h"><h3>📋 Programa &amp; Matérias da Disciplina</h3><small class="muted">Marque o que já estudou</small></div>
          <ul class="cp-unit-list">
            ${units.map((u, idx) => {
              const checked = !!st.completedUnits[`${cls.id}:${idx}`];
              return `<li class="${checked ? 'is-done' : ''}">
                <label class="cp-unit-chk">
                  <input type="checkbox" ${checked ? 'checked' : ''} onchange="CEUCampus.toggleUnit('${escAttr(cls.id)}', ${idx})">
                  <span>${esc(u)}</span>
                </label>
                <button type="button" class="btn btn-o btn-sm" onclick="CEUCampus.openUnitInSlides('${escAttr(cls.id)}', ${idx})">✦ Slides 3D</button>
              </li>`;
            }).join('')}
          </ul>
        </section>

        <section class="card cp-cr-box">
          <div class="cp-form-h">
            <h3>📚 Aulas, Slides &amp; PDFs (${classLessons.length})</h3>
            <button type="button" class="btn btn-p btn-sm" onclick="CEUCampus.toggleForm('showPublishLesson')">+ Publicar</button>
          </div>
          ${classLessons.length ? `<div class="cp-mini-lessons">
            ${classLessons.map((l) => `<div class="cp-ml-item">
              <div>
                <span class="cp-pill-soft">${esc(l.tipo)} · ${esc(l.data)}</span>
                <b>${esc(l.titulo)}</b>
                <p>${esc(l.resumo)}</p>
              </div>
              <div class="flex wrap" style="gap:6px">
                <button type="button" class="btn btn-p btn-sm" onclick="CEUCampus.openLessonInProjector('${escAttr(l.id)}')">✦ Slides 3D</button>
                <button type="button" class="btn btn-o btn-sm" onclick="CEUCampus.downloadLessonPdf('${escAttr(l.id)}')">📄 PDF</button>
              </div>
            </div>`).join('')}
          </div>` : `<p class="muted">Ainda sem aulas avulsas — clique em «✦ Slides 3D» em qualquer unidade do programa ao lado para estudar já!</p>`}

          <div class="cp-mural">
            <h4>💬 Mural de Avisos &amp; Dúvidas da Turma</h4>
            <form class="cp-mural-form" onsubmit="event.preventDefault();CEUCampus.postClassNote('${escAttr(cls.id)}')">
              <input id="cp-mural-in" placeholder="Escreva uma dúvida, data de prova ou aviso para a turma…" required>
              <button type="submit" class="btn btn-o btn-sm">Publicar</button>
            </form>
            <div class="cp-mural-list">
              ${mural.map((m) => `<div class="cp-mural-msg"><b>${esc(m.autor)}</b> <small>(${esc(m.papel)} · ${esc(m.data)})</small><p>${esc(m.texto)}</p></div>`).join('')}
            </div>
          </div>
        </section>
      </div>`}
    </div>`;
  }

  function renderTurmasTab(st) {
    if (CS.activeClassId) {
      const cls = st.classes.find((c) => c.id === CS.activeClassId);
      if (cls) return renderClassroomDetail(st, cls);
      CS.activeClassId = '';
    }
    const levels = ['Todos', 'Universidade', 'Escola / Ensino Médio', 'Curso Livre'];
    const filtered = st.classes.filter((c) => {
      if (CS.turmaFilter !== 'Todos' && c.nivel !== CS.turmaFilter && c.instituicao !== CS.turmaFilter) return false;
      return true;
    });
    let savedDecks = [];
    try { savedDecks = JSON.parse(localStorage.getItem('ama-projector-v1') || '[]'); } catch { }

    return `<div class="cp-section">
      <div class="cp-bar">
        <div class="cp-pills" role="group" aria-label="Filtrar turmas">
          ${levels.map((lv) => `<button type="button" class="${CS.turmaFilter === lv ? 'on' : ''}" onclick="CEUCampus.setTurmaFilter('${escAttr(lv)}')">${esc(lv)}</button>`).join('')}
          ${!levels.includes(CS.turmaFilter) ? `<button type="button" class="on" onclick="CEUCampus.setTurmaFilter('Todos')">${esc(CS.turmaFilter)} ✕</button>` : ''}
        </div>
        <div class="flex wrap" style="gap:8px">
          <div class="cp-code-join">
            <input id="cp-join-code" placeholder="Código (ex. UAN-ENG-1A)" aria-label="Código da turma">
            <button type="button" class="btn btn-o btn-sm" onclick="CEUCampus.joinByCode()">Entrar</button>
          </div>
          <button type="button" class="btn btn-p btn-sm" onclick="CEUCampus.toggleForm('showCreateClass')">+ Criar Turma</button>
          <button type="button" class="btn btn-o btn-sm" onclick="CEUCampus.toggleForm('showPublishLesson')">📢 Publicar Aula</button>
        </div>
      </div>

      ${CS.showCreateClass ? `<form class="card cp-form" onsubmit="event.preventDefault();CEUCampus.createClass()">
        <div class="cp-form-h"><h3>Criar Nova Turma (Escola ou Universidade)</h3><button type="button" class="icon-btn" onclick="CEUCampus.toggleForm('showCreateClass')">✕</button></div>
        <div class="cp-form-grid">
          <label>Nome da Disciplina / Turma <input id="cf-nome" required placeholder="Ex.: Álgebra Linear — Turma B"></label>
          <label>Instituição / Escola <input id="cf-inst" required placeholder="Ex.: UAN, ISPTEC, IMIL, Colégio..."></label>
          <label>Faculdade / Classe <input id="cf-fac" placeholder="Ex.: Eng. Informática / 12.ª Classe"></label>
          <label>Nível <select id="cf-nivel"><option>Universidade</option><option>Escola / Ensino Médio</option><option>Curso Livre</option></select></label>
          <label>Docente Responsável <input id="cf-doc" placeholder="Ex.: Prof. Manuel António"></label>
          <label>Delegado / Chefe de Turma <input id="cf-del" placeholder="Ex.: Ana Pedro"></label>
          <label>Horário <input id="cf-hor" placeholder="Ex.: Seg & Qua · 10h–12h"></label>
          <label>Código de Entrada <input id="cf-cod" placeholder="Auto (ex. UAN-2026-B)"></label>
        </div>
        <label style="display:block;margin-top:8px">Programa / Unidades da Matéria (1 por linha — opcional) <textarea id="cf-prog" rows="3" placeholder="Unidade 1 · Introdução&#10;Unidade 2 · Prática e Exercícios"></textarea></label>
        <div class="flex" style="gap:8px;margin-top:12px"><button type="submit" class="btn btn-p btn-sm">Guardar Turma</button></div>
      </form>` : ''}

      ${CS.showPublishLesson ? `<form class="card cp-form" onsubmit="event.preventDefault();CEUCampus.publishLesson()">
        <div class="cp-form-h"><h3>Publicar Nova Aula / Sebenta para a Turma</h3><button type="button" class="icon-btn" onclick="CEUCampus.toggleForm('showPublishLesson')">✕</button></div>
        <div class="cp-form-grid">
          <label>Turma de Destino <select id="lf-turma">${st.classes.map((c) => `<option value="${escAttr(c.id)}">${esc(c.codigo)} · ${esc(c.nome)}</option>`).join('')}</select></label>
          <label>Título da Aula <input id="lf-titulo" required placeholder="Ex.: Aula 05 — Derivadas e Aplicações"></label>
          <label>Tipo de Material <select id="lf-tipo"><option>Slides 3D + PDF</option><option>Sebenta PDF</option><option>Aula Gravada</option><option>Exercício / Exame</option></select></label>
          <label>Vincular Deck do Projetor IA (opcional) <select id="lf-deck"><option value="">— Gerar slides e PDF a partir do texto abaixo —</option>${savedDecks.map((d) => `<option value="${escAttr(d.id)}">${esc(d.title)}</option>`).join('')}</select></label>
        </div>
        <label style="display:block;margin-top:8px">Conteúdo / Resumo da Aula (gera Slides 3D e Sebenta PDF para os alunos) <textarea id="lf-resumo" rows="3" required placeholder="Escreva os pontos-chave, fórmulas ou resumo da aula…"></textarea></label>
        <div class="flex" style="gap:8px;margin-top:12px"><button type="submit" class="btn btn-p btn-sm">📢 Publicar na Turma</button></div>
      </form>` : ''}

      <div class="cp-grid" data-testid="campus-classes-grid">
        ${filtered.map((c) => {
          const joined = st.joinedClasses.includes(c.id);
          const units = Array.isArray(c.programa) ? c.programa : [];
          const done = units.filter((_, i) => st.completedUnits[`${c.id}:${i}`]).length;
          return `<article class="card cp-card">
            <div class="cp-card-top">
              <span class="cp-badge">${esc(c.instituicao)}</span>
              <span class="cp-code">${esc(c.codigo)}</span>
            </div>
            <h3>${esc(c.nome)}</h3>
            <p class="cp-meta">${esc(c.faculdade)} · ${esc(c.nivel)}</p>
            <div class="cp-info-list">
              <span><b>Docente:</b> ${esc(c.docente)}</span>
              <span><b>Horário:</b> ${esc(c.horario)}</span>
              <span><b>Programa:</b> ${units.length} unidades (${done}/${units.length} concluídas)</span>
            </div>
            <div class="cp-card-foot">
              <button type="button" class="btn btn-p btn-sm" onclick="CEUCampus.openClass('${escAttr(c.id)}')">Abrir Sala &amp; Programa →</button>
              <button type="button" class="btn btn-o btn-sm" onclick="CEUCampus.toggleJoinClass('${escAttr(c.id)}')">${joined ? '✓ Inscrito' : '+ Inscrever'}</button>
            </div>
          </article>`;
        }).join('')}
      </div>

      <div class="cp-subhead">
        <div><span class="eyebrow-t">MATERIAIS RECENTES DAS TURMAS</span><h2>Aulas, Slides 3D &amp; Sebentas PDF (${st.lessons.length})</h2></div>
      </div>
      <div class="cp-lessons" data-testid="campus-lessons-list">
        ${st.lessons.map((l) => `<article class="card cp-lesson-card">
          <div class="cp-card-top">
            <span class="cp-badge">${esc(l.turmaNome)}</span>
            <span class="cp-pill-soft">${esc(l.tipo)} · ${esc(l.data)}</span>
          </div>
          <h4>${esc(l.titulo)}</h4>
          <p>${esc(l.resumo)}</p>
          <div class="cp-card-foot">
            <small>Por ${esc(l.autor)}</small>
            <div class="flex wrap" style="gap:6px">
              <button type="button" class="btn btn-o btn-sm" onclick="CEUCampus.downloadLessonPdf('${escAttr(l.id)}')">📄 Sebenta PDF</button>
              <button type="button" class="btn btn-p btn-sm" onclick="CEUCampus.openLessonInProjector('${escAttr(l.id)}')">✦ Abrir em Slides 3D</button>
            </div>
          </div>
        </article>`).join('')}
      </div>
    </div>`;
  }

  /* ------------------------------------------------------------------ */
  /* Tab 2: Biblioteca de Matérias, Programas, Slides 3D & Sebentas PDF */
  /* ------------------------------------------------------------------ */
  function renderSubjectsTab(st) {
    const areas = ['Todas', 'Exatas & Tech', 'Negócios & Finanças', 'Idiomas & Direito', 'Saúde'];
    const q = CS.subjectQuery.trim().toLowerCase();
    const list = st.subjects.filter((s) => {
      if (CS.subjectFilter !== 'Todas' && s.area !== CS.subjectFilter) return false;
      if (q && !`${s.titulo} ${s.area} ${s.resumo} ${(s.programa || []).join(' ')}`.toLowerCase().includes(q)) return false;
      return true;
    });

    return `<div class="cp-section" data-testid="campus-subjects-tab">
      <div class="cp-bar">
        <div class="cp-pills">
          ${areas.map((a) => `<button type="button" class="${CS.subjectFilter === a ? 'on' : ''}" onclick="CEUCampus.setSubjectFilter('${escAttr(a)}')">${esc(a)}</button>`).join('')}
        </div>
        <input class="cp-search" placeholder="Procurar matéria, fórmula ou tópico (ex. Derivadas, Inglês, Python)…" value="${escAttr(CS.subjectQuery)}" oninput="CEUCampus.setSubjectQuery(this.value)">
      </div>

      <div class="cp-lessons">
        ${list.map((s) => `<article class="card cp-lesson-card">
          <div class="cp-card-top">
            <span class="cp-badge is-navy">${esc(s.area)}</span>
            <span class="cp-pill-soft">${esc(s.nivel)}</span>
          </div>
          <h4>${esc(s.titulo)}</h4>
          <p>${esc(s.resumo)}</p>
          <div class="cp-syl-box">
            <b>Programa Oficial (${s.programa.length} módulos):</b>
            <ul>${s.programa.map((p) => `<li>${esc(p)}</li>`).join('')}</ul>
          </div>
          ${(s.formulas && s.formulas.length) ? `<div class="cp-tags">${s.formulas.map((f) => `<span>${esc(f)}</span>`).join('')}</div>` : ''}
          <div class="cp-card-foot">
            <small>${s.perguntas.length} questões de exame incluídas</small>
            <div class="flex wrap" style="gap:6px">
              <button type="button" class="btn btn-o btn-sm" onclick="CEUCampus.downloadSubjectPdf('${escAttr(s.id)}')">📄 Baixar Sebenta PDF</button>
              <button type="button" class="btn btn-p btn-sm" onclick="CEUCampus.openSubjectInSlides('${escAttr(s.id)}')">✦ Gerar Slides 3D</button>
            </div>
          </div>
        </article>`).join('')}
      </div>
    </div>`;
  }

  /* ------------------------------------------------------------------ */
  /* Tab 3: Aulas Online Ao Vivo & Inscrição com 1 Clique + .ICS        */
  /* ------------------------------------------------------------------ */
  function renderOnlineTab(st) {
    const card = getStudentCard();
    return `<div class="cp-section" data-testid="campus-online-tab">
      <div class="cp-bar">
        <span class="cp-pill-soft">Inscreva-se gratuitamente nas aulas online com o seu Cartão CEU (<b>${esc(card.numero)}</b>) e guarde no calendário.</span>
        <button type="button" class="btn btn-p btn-sm" onclick="CEUCampus.toggleForm('showCreateOnline')">+ Agendar Aula Online</button>
      </div>

      ${CS.showCreateOnline ? `<form class="card cp-form" onsubmit="event.preventDefault();CEUCampus.createOnlineClass()">
        <div class="cp-form-h"><h3>Agendar Nova Aula Online Aberta / Turma</h3><button type="button" class="icon-btn" onclick="CEUCampus.toggleForm('showCreateOnline')">✕</button></div>
        <div class="cp-form-grid">
          <label>Título da Aula Online <input id="of-titulo" required placeholder="Ex.: Revisão Geral de Cálculo II"></label>
          <label>Docente / Orador <input id="of-doc" required placeholder="Ex.: Prof.ª Ana Silva"></label>
          <label>Instituição / Público <input id="of-inst" value="CEU Academy · Aberta"></label>
          <label>Data, Hora e Duração <input id="of-data" required placeholder="Ex.: Sábado · 16h00 (60 min)"></label>
        </div>
        <label style="display:block;margin-top:8px"> Tópicos que serão resolvidos em direto <textarea id="of-res" rows="2" required placeholder="Descreva o programa desta sessão online…"></textarea></label>
        <div class="flex" style="gap:8px;margin-top:12px"><button type="submit" class="btn btn-p btn-sm">Publicar Aula Online</button></div>
      </form>` : ''}

      <div class="cp-grid">
        ${st.onlineClasses.map((o) => {
          const enrolled = st.enrolledOnline.includes(o.id);
          const isLive = /VIVO/i.test(o.estado);
          return `<article class="card cp-card">
            <div class="cp-card-top">
              <span class="cp-badge ${isLive ? 'is-live' : 'is-navy'}">${isLive ? '● AO VIVO AGORA' : esc(o.estado)}</span>
              <span class="cp-pill-soft">${esc(o.dataHora)}</span>
            </div>
            <h3>${esc(o.titulo)}</h3>
            <p class="cp-meta">${esc(o.docente)} · ${esc(o.instituicao)}</p>
            <p class="cp-desc">${esc(o.resumo)}</p>
            <div class="cp-card-foot">
              <small>${o.inscritos}/${o.vagas} inscritos</small>
              <div class="flex wrap" style="gap:6px">
                <button type="button" class="btn btn-o btn-sm" title="Guardar no Calendário (.ics)" onclick="CEUCampus.downloadIcs('${escAttr(o.id)}')">📅 Agenda</button>
                <button type="button" class="btn ${enrolled ? 'btn-o' : 'btn-p'} btn-sm" onclick="CEUCampus.toggleEnrollOnline('${escAttr(o.id)}')">${enrolled ? '✓ Inscrito' : 'Inscrever-se'}</button>
                ${(isLive || enrolled) ? `<button type="button" class="btn btn-p btn-sm" onclick="CEUCampus.openLiveRoom('${escAttr(o.id)}')">▶ Sala</button>` : ''}
              </div>
            </div>
          </article>`;
        }).join('')}
      </div>
    </div>`;
  }

  function renderUniversitiesTab(st) {
    const provs = ['Todas', 'Luanda', 'Huambo', 'Huíla', 'Benguela'];
    const q = CS.uniQuery.trim().toLowerCase();
    const list = st.universities.filter((u) => {
      if (CS.uniFilter !== 'Todas' && u.provincia !== CS.uniFilter) return false;
      if (q && !`${u.sigla} ${u.nome} ${u.tipo} ${(u.faculdades || []).join(' ')}`.toLowerCase().includes(q)) return false;
      return true;
    });

    return `<div class="cp-section">
      <div class="cp-bar">
        <div class="cp-pills">
          ${provs.map((p) => `<button type="button" class="${CS.uniFilter === p ? 'on' : ''}" onclick="CEUCampus.setUniFilter('${escAttr(p)}')">${esc(p)}</button>`).join('')}
        </div>
        <div class="flex wrap" style="gap:8px">
          <input class="cp-search" placeholder="Pesquisar UAN, ISPTEC, UCAN, IMIL, Direito…" value="${escAttr(CS.uniQuery)}" oninput="CEUCampus.setUniQuery(this.value)">
          <button type="button" class="btn btn-p btn-sm" onclick="CEUCampus.toggleForm('showAddUni')">+ Registar Escola / Faculdade</button>
        </div>
      </div>

      ${CS.showAddUni ? `<form class="card cp-form" onsubmit="event.preventDefault();CEUCampus.addUniversity()">
        <div class="cp-form-h"><h3>Registar Universidade, Faculdade ou Escola Parceira</h3><button type="button" class="icon-btn" onclick="CEUCampus.toggleForm('showAddUni')">✕</button></div>
        <div class="cp-form-grid">
          <label>Sigla <input id="uf-sigla" required placeholder="Ex.: ISPAJ / Colégio X"></label>
          <label>Nome Completo <input id="uf-nome" required placeholder="Nome oficial da instituição"></label>
          <label>Tipo <select id="uf-tipo"><option>Universidade Pública</option><option>Universidade Privada</option><option>Escola / Ensino Médio Técnico</option><option>Colégio / Liceu</option></select></label>
          <label>Província <input id="uf-prov" value="Luanda"></label>
          <label>Faculdades / Cursos (separados por vírgula) <input id="uf-facs" placeholder="Engenharia, Direito, Informática, Gestão"></label>
        </div>
        <div class="flex" style="gap:8px;margin-top:12px"><button type="submit" class="btn btn-p btn-sm">Guardar Instituição Parceira</button></div>
      </form>` : ''}

      <div class="cp-grid" data-testid="campus-universities-grid">
        ${list.map((u) => `<article class="card cp-card">
          <div class="cp-card-top">
            <span class="cp-badge is-navy">${esc(u.sigla)}</span>
            <span class="cp-pill-soft">${esc(u.provincia)} · ${esc(u.tipo)}</span>
          </div>
          <h3>${esc(u.nome)}</h3>
          <div class="cp-tags">${(u.faculdades || []).map((f) => `<span>${esc(f)}</span>`).join('')}</div>
          <div class="cp-card-foot">
            <small>${esc(u.parceria)} · ${u.turmasAtivas || 1} turmas</small>
            <button type="button" class="btn btn-o btn-sm" onclick="CEUCampus.filterTurmasByInst('${escAttr(u.sigla)}')">Ver Turmas →</button>
          </div>
        </article>`).join('')}
      </div>
    </div>`;
  }

  function renderDelegatesTab(st) {
    return `<div class="cp-section">
      <div class="cp-bar">
        <p class="muted" style="margin:0">Representação estudantil em escolas e universidades: Presidentes de Associações de Estudantes (AE) e Delegados de Turma publicam avisos e apoiam os colegas.</p>
        <button type="button" class="btn btn-p btn-sm" onclick="CEUCampus.toggleForm('showAddDelegate')">+ Registar Presidente AE / Delegado</button>
      </div>

      ${CS.showAddDelegate ? `<form class="card cp-form" onsubmit="event.preventDefault();CEUCampus.addDelegate()">
        <div class="cp-form-h"><h3>Registar Presidente de AE ou Delegado de Turma</h3><button type="button" class="icon-btn" onclick="CEUCampus.toggleForm('showAddDelegate')">✕</button></div>
        <div class="cp-form-grid">
          <label>Nome Completo <input id="df-nome" required placeholder="Nome do Presidente ou Delegado"></label>
          <label>Cargo <select id="df-cargo"><option>Presidente AE</option><option>Vice-Presidente AE</option><option>Delegado de Turma</option><option>Chefe de Turma (Ensino Médio)</option><option>Coordenador de Núcleo</option></select></label>
          <label>Universidade / Escola <input id="df-inst" required placeholder="Ex.: UAN, ISPTEC, UCAN, IMIL"></label>
          <label>Faculdade / Turma <input id="df-fac" required placeholder="Ex.: Direito 3.º Ano / Eng. Civil"></label>
          <label>Contacto Institucional <input id="df-cont" placeholder="Email ou sala / grupo"></label>
        </div>
        <label style="display:block;margin-top:8px">Comunicado à Comunidade Estudantil <textarea id="df-msg" rows="2" placeholder="Aviso de reunião, jornadas científicas, exames ou estágios…"></textarea></label>
        <div class="flex" style="gap:8px;margin-top:12px"><button type="submit" class="btn btn-p btn-sm">Guardar Representante</button></div>
      </form>` : ''}

      <div class="cp-grid" data-testid="campus-delegates-grid">
        ${st.delegates.map((d) => `<article class="card cp-card">
          <div class="cp-card-top">
            <span class="cp-badge ${/Presidente/i.test(d.cargo) ? 'is-navy' : ''}">${esc(d.cargo)}</span>
            <span class="cp-pill-soft">${esc(d.instituicao)}</span>
          </div>
          <h3>${esc(d.nome)}</h3>
          <p class="cp-meta">${esc(d.faculdade)}</p>
          ${d.comunicado ? `<div class="cp-notice"><b>Comunicado:</b> ${esc(d.comunicado)}</div>` : ''}
          <div class="cp-card-foot">
            <small>${esc(d.contacto)}</small>
          </div>
        </article>`).join('')}
      </div>
    </div>`;
  }

  function renderCareerTab(st) {
    const card = getStudentCard();
    const showMen = CS.careerSubTab !== 'estagios';
    const showInt = CS.careerSubTab !== 'mentorias';
    return `<div class="cp-section">
      <div class="cp-bar">
        <div class="cp-pills">
          <button type="button" class="${CS.careerSubTab === 'todos' ? 'on' : ''}" onclick="CEUCampus.setCareerSubTab('todos')">Tudo (Mentorias + Estágios)</button>
          <button type="button" class="${CS.careerSubTab === 'mentorias' ? 'on' : ''}" onclick="CEUCampus.setCareerSubTab('mentorias')">🧭 Só Mentorias (${st.mentorships.length})</button>
          <button type="button" class="${CS.careerSubTab === 'estagios' ? 'on' : ''}" onclick="CEUCampus.setCareerSubTab('estagios')">💼 Só Estágios (${st.internships.length})</button>
        </div>
        <span class="cp-pill-soft">Candidatura com 1 clique via Cartão CEU: <b>${esc(card.numero)}</b></span>
      </div>

      ${showMen ? `<div class="cp-subhead" style="margin-top:4px"><span class="eyebrow-t">ORIENTAÇÃO INDIVIDUAL &amp; GRUPO</span><h2>Mentorias Académicas &amp; Bolsas</h2></div>
      <div class="cp-grid" data-testid="campus-mentorships-grid" style="margin-bottom:24px">
        ${st.mentorships.map((m) => {
          const booked = st.bookedMentorships.includes(m.id);
          return `<article class="card cp-card">
            <div class="cp-card-top">
              <span class="cp-badge">${esc(m.area)}</span>
              <span class="cp-pill-soft">${esc(m.formato)}</span>
            </div>
            <h3>${esc(m.mentor)}</h3>
            <p class="cp-meta">${esc(m.instituicao)} · ${esc(m.horario)}</p>
            <p class="cp-desc">${esc(m.tema)}</p>
            <div class="cp-card-foot">
              <small>${m.vagas} vagas esta semana</small>
              <button type="button" class="btn ${booked ? 'btn-o' : 'btn-p'} btn-sm" onclick="CEUCampus.bookMentorship('${escAttr(m.id)}')">${booked ? '✓ Sessão Marcada' : 'Marcar Mentoria'}</button>
            </div>
          </article>`;
        }).join('')}
      </div>` : ''}

      ${showInt ? `<div class="cp-subhead"><span class="eyebrow-t">PRIMEIRO EMPREGO &amp; ESTÁGIO CURRICULAR</span><h2>Vagas de Estágio em Angola</h2></div>
      <div class="cp-grid" data-testid="campus-internships-grid">
        ${st.internships.map((i) => {
          const applied = st.appliedInternships.includes(i.id);
          return `<article class="card cp-card">
            <div class="cp-card-top">
              <span class="cp-badge is-navy">${esc(i.area)}</span>
              <span class="cp-pill-soft">${esc(i.local)}</span>
            </div>
            <h3>${esc(i.titulo)}</h3>
            <p class="cp-meta">${esc(i.empresa)} · ${esc(i.duracao)} · ${esc(i.bolsa)}</p>
            <p class="cp-desc">${esc(i.requisitos)}</p>
            <div class="cp-card-foot">
              <small>${applied ? `Enviado como ${card.nome}` : 'Aceita Cartão Digital CEU'}</small>
              <button type="button" class="btn ${applied ? 'btn-o' : 'btn-p'} btn-sm" onclick="CEUCampus.applyInternship('${escAttr(i.id)}')">${applied ? '✓ Candidatura Enviada' : 'Candidatar com CEU'}</button>
            </div>
          </article>`;
        }).join('')}
      </div>` : ''}
    </div>`;
  }

  /* ------------------------------------------------------------------ */
  /* Sala de Aula Online ao Vivo + Pesquisa Global Rápida (Ctrl+K)      */
  /* ------------------------------------------------------------------ */
  function renderLiveRoomModal(st) {
    if (!CS.liveRoomId) return '';
    const o = st.onlineClasses.find((x) => x.id === CS.liveRoomId);
    if (!o) return '';
    return `<div class="pj-modal-bg" role="dialog" aria-modal="true" aria-label="Sala de Aula Online" onclick="CEUCampus.openLiveRoom('')">
      <div class="pj-modal-card pj-modal-keys" onclick="event.stopPropagation()">
        <div class="pj-modal-head">
          <div><span class="cp-badge is-live">● SALA ONLINE CEU · ${esc(o.instituicao)}</span><h3 style="margin-top:6px">${esc(o.titulo)}</h3></div>
          <button type="button" class="icon-btn" aria-label="Fechar" onclick="CEUCampus.openLiveRoom('')">✕</button>
        </div>
        <p class="pj-modal-sub">Docente: <b>${esc(o.docente)}</b> · Horário: <b>${esc(o.dataHora)}</b> · ${o.inscritos} estudantes inscritos.</p>
        <div class="cp-live-stage">
          <div class="cp-live-board">
            <span>QUADRO INTERATIVO DA SESSÃO</span>
            <strong>${esc(o.titulo)}</strong>
            <p>${esc(o.resumo)}</p>
          </div>
          <div class="flex wrap" style="gap:8px;margin-top:12px">
            <button type="button" class="btn btn-p btn-sm" onclick="CEUCampus.openOnlineInSlides('${escAttr(o.id)}')">✦ Abrir Slides 3D desta Aula</button>
            <button type="button" class="btn btn-o btn-sm" onclick="CEUCampus.downloadOnlinePdf('${escAttr(o.id)}')">📄 Baixar Folha de Apoio (PDF)</button>
            <button type="button" class="btn btn-o btn-sm" onclick="CEUCampus.downloadIcs('${escAttr(o.id)}')">📅 Guardar no Calendário</button>
          </div>
        </div>
      </div>
    </div>`;
  }

  function buildFinderResults(st, qRaw) {
    const q = String(qRaw || '').trim().toLowerCase();
    const items = [];
    const push = (kind, title, sub, action) => {
      if (!q || `${kind} ${title} ${sub}`.toLowerCase().includes(q)) items.push({ kind, title, sub, action });
    };
    st.classes.forEach((c) => push('Turma', `${c.codigo} · ${c.nome}`, `${c.instituicao} · ${c.docente}`, `CEUCampus.setTab('turmas');CEUCampus.openClass('${c.id}');CEUCampus.toggleFinder(false)`));
    st.subjects.forEach((s) => push('Matéria & PDF', s.titulo, `${s.area} · Sebenta PDF + Slides 3D`, `CEUCampus.setTab('materias');CEUCampus.toggleFinder(false)`));
    st.onlineClasses.forEach((o) => push('Aula Online', o.titulo, `${o.dataHora} · ${o.docente}`, `CEUCampus.setTab('online');CEUCampus.toggleFinder(false)`));
    ((window.AMA_DATA && window.AMA_DATA.cursos) || []).forEach((c) => push('Curso', c.titulo, `${c.categoria} · ${c.instrutor || 'CEU'}`, `CEUCampus.toggleFinder(false);location.hash='#/curso/${c.id}'`));
    st.internships.forEach((i) => push('Estágio', i.titulo, `${i.empresa} · ${i.local}`, `CEUCampus.setTab('carreira');CEUCampus.setCareerSubTab('estagios');CEUCampus.toggleFinder(false)`));
    return items.slice(0, 10);
  }

  function renderFinderModal(st) {
    if (!CS.showFinder) return '';
    const hits = buildFinderResults(st, CS.finderQuery);
    return `<div class="pj-modal-bg" role="dialog" aria-modal="true" aria-label="Pesquisa Rápida Académica" onclick="CEUCampus.toggleFinder(false)">
      <div class="pj-modal-card pj-modal-keys" onclick="event.stopPropagation()">
        <div class="pj-modal-head">
          <div><span class="pj-kicker">PESQUISA INTELIGENTE · CTRL+K</span><h3>Encontrar Turma, Matéria PDF, Curso ou Aula Online</h3></div>
          <button type="button" class="icon-btn" aria-label="Fechar" onclick="CEUCampus.toggleFinder(false)">✕</button>
        </div>
        <input id="cp-finder-in" class="cp-finder-input" placeholder="Escreva Física, Cálculo, Inglês, Marketing, UAN, Estágio…" value="${escAttr(CS.finderQuery)}" oninput="CEUCampus.updateFinder(this.value)" autofocus>
        <div class="cp-finder-list" id="cp-finder-list">
          ${hits.length ? hits.map((h) => `<button type="button" class="cp-finder-item" onclick="${h.action}">
            <div><b>${esc(h.title)}</b><small>${esc(h.sub)}</small></div>
            <span class="cp-badge">${esc(h.kind)}</span>
          </button>`).join('') : `<p class="muted" style="margin:12px 0 0">Nenhum resultado para "${esc(CS.finderQuery)}".</p>`}
        </div>
      </div>
    </div>`;
  }

  /* ------------------------------------------------------------------ */
  /* Gerador de Sebenta Académica A4 Imprimível / PDF                   */
  /* ------------------------------------------------------------------ */
  function openPrintableSebenta({ titulo, subtitulo, topicos = [], formulas = [], resumo = '', perguntas = [] }) {
    const w = window.open('', '_blank', 'width=860,height=720');
    if (!w) return typeof toast === 'function' && toast('Permita popups para abrir e guardar a Sebenta em PDF.');
    w.document.open();
    w.document.write(`<!doctype html><html lang="pt-AO"><head><meta charset="utf-8"><title>Sebenta CEU · ${esc(titulo)}</title>
    <style>
      @page{size:A4;margin:16mm}*{box-sizing:border-box}
      body{font-family:system-ui,-apple-system,sans-serif;color:#0b1c3d;margin:0;padding:28px;line-height:1.55;max-width:820px;margin-inline:auto}
      header{border-bottom:3px solid #00217e;padding-bottom:14px;margin-bottom:20px;display:flex;justify-content:space-between;align-items:flex-end;gap:12px}
      .k{font:800 10.5px monospace;letter-spacing:.12em;color:#0066b8;text-transform:uppercase}
      h1{margin:4px 0 4px;font-size:24px;color:#00217e}
      h2{font-size:15px;text-transform:uppercase;letter-spacing:.06em;color:#0053a6;margin:20px 0 8px;border-left:4px solid #00a4dc;padding-left:10px}
      .lead{background:#f0f7ff;border:1px solid #cfe3fb;padding:14px 16px;border-radius:12px;font-size:14px}
      ul,ol{padding-left:20px;margin:8px 0}li{margin-bottom:6px;font-size:13.8px}
      .fml{display:flex;flex-wrap:wrap;gap:8px;margin:8px 0}
      .fml code{padding:7px 12px;border-radius:8px;background:#00217e;color:#fff;font:700 13px monospace}
      .notes{margin-top:22px;border:1px dashed #94a3b8;border-radius:12px;padding:14px;min-height:110px;color:#64748b;font-size:12px}
      footer{margin-top:26px;padding-top:10px;border-top:1px solid #dbe6f5;font:700 10px monospace;color:#64748b;display:flex;justify-content:space-between}
      .no-print{margin-bottom:18px;display:flex;gap:10px}
      .no-print button{padding:9px 16px;border-radius:9px;border:0;background:#00217e;color:#fff;font-weight:700;cursor:pointer}
      @media print{.no-print{display:none}}
    </style></head><body>
      <div class="no-print"><button onclick="window.print()">🖨 Imprimir / Guardar como PDF</button></div>
      <header>
        <div><div class="k">CEU ACADEMY · SEBENTA ACADÉMICA DE ESTUDO</div><h1>${esc(titulo)}</h1><div>${esc(subtitulo)}</div></div>
        <div class="k">ANO LETIVO 2026/2027</div>
      </header>
      ${resumo ? `<div class="lead"><b>Síntese Essencial:</b> ${esc(resumo)}</div>` : ''}
      ${topicos.length ? `<h2>1. Programa &amp; Pontos-Chave</h2><ol>${topicos.map((t) => `<li>${esc(t)}</li>`).join('')}</ol>` : ''}
      ${formulas.length ? `<h2>2. Fórmulas &amp; Estruturas Fundamentais</h2><div class="fml">${formulas.map((f) => `<code>${esc(f)}</code>`).join('')}</div>` : ''}
      ${perguntas.length ? `<h2>3. Questões Tipo de Exame / Auto-Avaliação</h2><ol>${perguntas.map((q) => `<li>${esc(q)}</li>`).join('')}</ol>` : ''}
      <div class="notes">Espaço para apontamentos pessoais e resolução de exercícios:</div>
      <footer><span>CEU ACADEMY · ESCOLAS &amp; UNIVERSIDADES DE ANGOLA</span><span>APP FEITO PELA HORIZONTE FUTURO</span></footer>
    </body></html>`);
    w.document.close();
  }

  /* ------------------------------------------------------------------ */
  /* Tab Exames Cronometrados (0–20) & Flashcards 3D (Repetição Ativa)  */
  /* ------------------------------------------------------------------ */
  function renderExamsAndFlashcardsTab(st) {
    const tools = (window.Study && window.Study.CampusTools) || {};
    const banks = tools.EXAM_BANKS || [];
    const baseCards = (tools.FLASHCARD_DECKS || []).concat(st.customFlashcards || []);

    if (CS.examMode === 'flashcards') {
      const subjects = ['Todas', ...Array.from(new Set(baseCards.map((c) => c.subject)))];
      const deck = baseCards.filter((c) => CS.fcSubject === 'Todas' || c.subject === CS.fcSubject);
      const curIdx = deck.length ? Math.max(0, Math.min(CS.fcIdx, deck.length - 1)) : 0;
      const cur = deck[curIdx] || null;
      const knownCount = deck.filter((c) => CS.fcKnown[c.id]).length;

      return `<div class="cp-section" data-testid="campus-flashcards-view">
        <div class="cp-bar">
          <div class="cp-pills">
            <button type="button" onclick="CEUCampus.setExamMode('simulado')">📝 Simulados de Exame (0–20)</button>
            <button type="button" class="on" onclick="CEUCampus.setExamMode('flashcards')">🃏 Flashcards 3D (${baseCards.length})</button>
          </div>
          <button type="button" class="btn btn-o btn-sm" onclick="CEUCampus.toggleForm('showFcGen')">+ Criar dos Meus Apontamentos</button>
        </div>

        ${CS.showFcGen ? `<form class="card cp-form" onsubmit="event.preventDefault();CEUCampus.generateCustomFlashcards()">
          <div class="cp-form-h"><h3>Gerar Flashcards Automáticos a partir de Apontamentos</h3><button type="button" class="icon-btn" onclick="CEUCampus.toggleForm('showFcGen')">✕</button></div>
          <label>Disciplina / Etiqueta <input id="fc-gen-sub" value="Meus Cartões" required></label>
          <label style="margin-top:8px">Cole definições ou pares "Conceito: Explicação" (1 por linha)
            <textarea id="fc-gen-txt" rows="4" required placeholder="Fotossíntese: Conversão de luz solar, água e CO2 em glicose e oxigénio.&#10;Mitose: Divisão celular que origina duas células geneticamente idênticas."></textarea>
          </label>
          <div class="flex" style="gap:8px;margin-top:10px"><button type="submit" class="btn btn-p btn-sm">✦ Criar Cartões de Estudo</button></div>
        </form>` : ''}

        <div class="cp-pills" style="margin-bottom:14px">
          ${subjects.map((s) => `<button type="button" class="${CS.fcSubject === s ? 'on' : ''}" onclick="CEUCampus.setFcSubject('${escAttr(s)}')">${esc(s)}</button>`).join('')}
        </div>

        ${cur ? `<div class="cp-fc-stage">
          <button type="button" class="cp-fc-card ${CS.fcFlipped ? 'is-flipped' : ''}" onclick="CEUCampus.flipFlashcard()" aria-label="Virar cartão de estudo">
            <span class="cp-badge is-navy">${esc(cur.subject)} · Cartão ${curIdx + 1}/${deck.length}</span>
            <div class="cp-fc-label">${CS.fcFlipped ? 'RESPOSTA / EXPLICAÇÃO' : 'PERGUNTA / CONCEITO'}</div>
            <h3>${esc(CS.fcFlipped ? cur.back : cur.front)}</h3>
            <small>Clique no cartão para ${CS.fcFlipped ? 'voltar à pergunta' : 'revelar a resposta'} ↻</small>
          </button>
          <div class="cp-fc-controls">
            <button type="button" class="btn btn-o btn-sm" onclick="CEUCampus.stepFlashcard(-1)">← Anterior</button>
            <button type="button" class="btn ${CS.fcKnown[cur.id] ? 'btn-o' : 'btn-p'} btn-sm" onclick="CEUCampus.markFlashcardKnown('${escAttr(cur.id)}')">${CS.fcKnown[cur.id] ? '✓ Dominado' : '✓ Já sei este!'}</button>
            <button type="button" class="btn btn-o btn-sm" onclick="CEUCampus.stepFlashcard(1)">Próximo →</button>
          </div>
          <p class="muted" style="text-align:center;font-size:12.5px;margin:8px 0 0">Dominados nesta seleção: <b>${knownCount} de ${deck.length}</b></p>
        </div>` : '<p class="muted">Sem cartões nesta categoria.</p>'}
      </div>`;
    }

    const activeExam = banks.find((e) => e.id === CS.activeExamId) || banks[0];
    const mm = String(Math.floor(CS.examSecLeft / 60)).padStart(2, '0');
    const ss = String(CS.examSecLeft % 60).padStart(2, '0');

    return `<div class="cp-section" data-testid="campus-exams-view">
      <div class="cp-bar">
        <div class="cp-pills">
          <button type="button" class="on" onclick="CEUCampus.setExamMode('simulado')">📝 Simulados de Exame (0–20)</button>
          <button type="button" onclick="CEUCampus.setExamMode('flashcards')">🃏 Flashcards 3D (${baseCards.length})</button>
        </div>
        ${activeExam ? `<span class="cp-badge is-navy" id="cp-exam-clock">⏱ Tempo recomendado: ${mm}:${ss}</span>` : ''}
      </div>

      <div class="cp-pills" style="margin-bottom:16px">
        ${banks.map((b) => `<button type="button" class="${activeExam && activeExam.id === b.id ? 'on' : ''}" onclick="CEUCampus.selectExam('${escAttr(b.id)}')">${esc(b.area)} · ${esc(b.titulo.split('—')[0].trim())}</button>`).join('')}
      </div>

      ${CS.examResult ? `<div class="card cp-exam-res" data-testid="campus-exam-result">
        <div class="cp-cr-banner" style="padding:0;border:0;box-shadow:none">
          <div>
            <span class="cp-badge is-navy">NOTA NA ESCALA 0–20 VALORES</span>
            <h2 style="margin:6px 0 4px">${CS.examResult.nota20.toFixed(1).replace('.', ',')} / 20 valores — ${esc(CS.examResult.nivel)}</h2>
            <p class="cp-meta">Acertou <b>${CS.examResult.correct} de ${CS.examResult.total}</b> questões em «${esc(CS.examResult.title)}».</p>
          </div>
          <button type="button" class="btn btn-o btn-sm" onclick="CEUCampus.resetExam()">↻ Repetir Simulado</button>
        </div>
        <div class="cp-exam-corr">
          ${CS.examResult.details.map((d, i) => `<div class="cp-corr-item ${d.isRight ? 'is-ok' : 'is-bad'}">
            <b>${i + 1}. ${esc(d.question)}</b>
            <span>A sua resposta: <em>${esc(d.pickedOption)}</em> ${d.isRight ? '✓ Correta' : `✕ (Correta: ${esc(d.correctOption)})`}</span>
            <small>💡 Explicação: ${esc(d.explanation)}</small>
          </div>`).join('')}
        </div>
      </div>` : ''}

      ${activeExam ? `<div class="card cp-form" style="margin-top:12px">
        <div class="cp-form-h"><h3>${esc(activeExam.titulo)}</h3><small class="muted">${activeExam.questions.length} questões · Escala 0–20 valores</small></div>
        <div class="cp-q-list">
          ${activeExam.questions.map((q, qi) => `<div class="cp-q-box">
            <b>${qi + 1}. ${esc(q.q)}</b>
            <div class="cp-q-opts">
              ${q.opts.map((opt, oi) => `<label class="cp-q-opt ${Number(CS.examAnswers[qi]) === oi ? 'is-sel' : ''}">
                <input type="radio" name="exq-${qi}" ${Number(CS.examAnswers[qi]) === oi ? 'checked' : ''} onchange="CEUCampus.pickExamAnswer(${qi}, ${oi})">
                <span>${esc(opt)}</span>
              </label>`).join('')}
            </div>
          </div>`).join('')}
        </div>
        <div class="flex wrap" style="gap:10px;margin-top:14px">
          <button type="button" class="btn btn-p" onclick="CEUCampus.submitExam()">✓ Entregar e Corrigir (0–20 valores)</button>
        </div>
      </div>` : ''}
    </div>`;
  }

  function campusView() {
    hydrateFromDb();
    const st = loadState();
    const pMin = String(Math.floor(CS.pomoSec / 60)).padStart(2, '0');
    const pSec = String(CS.pomoSec % 60).padStart(2, '0');
    const tabs = [
      ['turmas', `🏫 Turmas & Salas (${st.classes.length})`],
      ['materias', `📚 Matérias & PDFs (${st.subjects.length})`],
      ['exames', '📝 Exames & Flashcards'],
      ['online', `🔴 Aulas Online (${st.onlineClasses.length})`],
      ['universidades', `🎓 Escolas & Faculdades (${st.universities.length})`],
      ['delegados', `🏅 Presidentes AE & Delegados`],
      ['carreira', `🧭 Mentorias & Estágios`],
    ];
    let body = '';
    if (CS.tab === 'materias') body = renderSubjectsTab(st);
    else if (CS.tab === 'exames') body = renderExamsAndFlashcardsTab(st);
    else if (CS.tab === 'online') body = renderOnlineTab(st);
    else if (CS.tab === 'universidades') body = renderUniversitiesTab(st);
    else if (CS.tab === 'delegados') body = renderDelegatesTab(st);
    else if (CS.tab === 'carreira' || CS.tab === 'mentorias' || CS.tab === 'estagios') body = renderCareerTab(st);
    else body = renderTurmasTab(st);

    const inner = `<section class="ceu-landing cp-shell" data-testid="campus-hub">
      <div class="cp-hero">
        <div>
          <span class="eyebrow-t">CAMPUS DIGITAL · ESCOLAS &amp; UNIVERSIDADES DE ANGOLA</span>
          <h1>Salas de Turma, Matérias, Exames, Aulas Online &amp; Carreira</h1>
          <p>Estude pelo <b>programa oficial</b>, baixe <b>sebentas PDF</b>, treine <b>exames 0–20 e flashcards 3D</b>, gere <b>pautas e presenças por QR</b>, inscreva-se em <b>aulas online</b> e aceda a mentorias e estágios.</p>
        </div>
        <div class="cp-hero-side">
          <div class="flex wrap" style="gap:8px;justify-content:flex-end">
            <button type="button" class="btn btn-o btn-sm" onclick="CEUCampus.toggleFinder(true)">🔍 Pesquisar Tudo (Ctrl+K)</button>
            <button type="button" class="btn btn-o btn-sm" onclick="CEUCampus.toggleForm('showGradeCalc')">🎯 Simulador Média 0–20</button>
            <button type="button" class="btn btn-o btn-sm" onclick="CEUCampus.togglePomodoro()"><span id="cp-pomo-lbl">${CS.pomoRunning ? `⏸ Foco ${pMin}:${pSec}` : `⏱ Foco ${pMin}:${pSec}`}</span></button>
          </div>
          <div class="flex wrap" style="gap:8px;justify-content:flex-end">
            <button type="button" class="btn btn-o btn-sm" onclick="CEUCampus.setTab('turmas');CEUCampus.openClass('');CEUCampus.toggleForm('showCreateClass')">+ Nova Turma</button>
            <button type="button" class="btn btn-o btn-sm" onclick="CEUCampus.setTab('exames')">📝 Simulado 0–20</button>
          </div>
        </div>
      </div>

      ${renderGradeCalculator()}

      <div class="cp-kpis">
        <div onclick="CEUCampus.setTab('turmas')" style="cursor:pointer"><b>${st.classes.length}</b><span>Turmas &amp; Salas</span></div>
        <div onclick="CEUCampus.setTab('materias')" style="cursor:pointer"><b>${st.subjects.length}</b><span>Matérias &amp; PDFs</span></div>
        <div onclick="CEUCampus.setTab('online')" style="cursor:pointer"><b>${st.onlineClasses.length}</b><span>Aulas Online</span></div>
        <div onclick="CEUCampus.setTab('universidades')" style="cursor:pointer"><b>${st.universities.length}</b><span>Escolas &amp; Faculdades</span></div>
        <div onclick="CEUCampus.setTab('carreira')" style="cursor:pointer"><b>${st.mentorships.length + st.internships.length}</b><span>Mentorias &amp; Estágios</span></div>
      </div>

      <nav class="cp-tabs" role="tablist" aria-label="Secções do Campus">
        ${tabs.map(([k, lbl]) => `<button type="button" role="tab" aria-selected="${CS.tab === k}" class="${CS.tab === k ? 'on' : ''}" onclick="CEUCampus.setTab('${k}')">${lbl}</button>`).join('')}
      </nav>

      ${body}
      ${renderLiveRoomModal(st)}
      ${renderFinderModal(st)}

      <div class="ceu-mobile-bar" aria-label="Navegação rápida">
        <a href="#/ceu-inicio">Início</a>
        <a href="#/campus" class="active">Campus</a>
        <a href="#/projetor" class="primary">Projetor</a>
        <a href="#/cartao-ceu">Cartão</a>
      </div>
    </section>`;

    return typeof shellPublic === 'function' ? shellPublic(inner, 'campus') : inner;
  }

  function saveToMvpDb(resource, record) {
    const db = window.Study && window.Study.MvpDB;
    if (db && typeof db.saveCollectionRecord === 'function') {
      db.saveCollectionRecord(resource, record).catch(() => {});
    }
  }

  function sendTextToProjector(title, subject, text, sourceName) {
    try {
      sessionStorage.setItem('ama-pj-prefill', JSON.stringify({
        title,
        subject: subject || 'geral',
        sourceName: sourceName || 'Campus CEU',
        text: `${title}\n\n${text}`,
      }));
    } catch { }
    if (window.AMAProjector && typeof window.AMAProjector.toggleCreator === 'function') {
      window.AMAProjector.toggleCreator(true);
    }
    location.hash = '#/projetor';
  }

  window.CEUCampus = {
    view: campusView,
    setTab(t) {
      if (t === 'mentorias') { CS.tab = 'carreira'; CS.careerSubTab = 'mentorias'; }
      else if (t === 'estagios') { CS.tab = 'carreira'; CS.careerSubTab = 'estagios'; }
      else CS.tab = t;
      CS.activeClassId = '';
      if (typeof render === 'function') render();
    },
    openClass(id) { CS.activeClassId = String(id || ''); CS.classSubView = 'programa'; if (typeof render === 'function') render(); },
    setClassSubView(v) { CS.classSubView = v === 'pauta' ? 'pauta' : 'programa'; if (typeof render === 'function') render(); },
    togglePomodoro() {
      if (pomoTimerId) {
        clearInterval(pomoTimerId);
        pomoTimerId = null;
        CS.pomoRunning = false;
        if (typeof render === 'function') render();
        return;
      }
      CS.pomoRunning = true;
      if (CS.pomoSec <= 0) CS.pomoSec = 1500;
      if (typeof toast === 'function') toast('⏱ Ciclo Pomodoro de 25 min iniciado! Bom foco.');
      if (typeof render === 'function') render();
      pomoTimerId = setInterval(() => {
        CS.pomoSec = Math.max(0, CS.pomoSec - 1);
        const lbl = document.getElementById('cp-pomo-lbl');
        if (lbl) {
          const m = String(Math.floor(CS.pomoSec / 60)).padStart(2, '0');
          const s = String(CS.pomoSec % 60).padStart(2, '0');
          lbl.textContent = `⏸ Foco ${m}:${s}`;
        }
        if (CS.pomoSec <= 0) {
          clearInterval(pomoTimerId);
          pomoTimerId = null;
          CS.pomoRunning = false;
          CS.pomoSec = 1500;
          if (typeof toast === 'function') toast('🎉 25 minutos de estudo concluídos! Faça uma pausa de 5 min.');
          if (typeof render === 'function') render();
        }
      }, 1000);
    },
    setExamMode(m) { CS.examMode = m === 'flashcards' ? 'flashcards' : 'simulado'; if (typeof render === 'function') render(); },
    selectExam(id) {
      CS.activeExamId = id;
      CS.examAnswers = {};
      CS.examResult = null;
      const tools = (window.Study && window.Study.CampusTools) || {};
      const found = (tools.EXAM_BANKS || []).find((e) => e.id === id);
      CS.examSecLeft = ((found && found.duracaoMin) || 12) * 60;
      if (examTimerId) clearInterval(examTimerId);
      examTimerId = setInterval(() => {
        if (CS.tab !== 'exames' || CS.examResult) return;
        CS.examSecLeft = Math.max(0, CS.examSecLeft - 1);
        const el = document.getElementById('cp-exam-clock');
        if (el) {
          const mm = String(Math.floor(CS.examSecLeft / 60)).padStart(2, '0');
          const ss = String(CS.examSecLeft % 60).padStart(2, '0');
          el.textContent = `⏱ Tempo recomendado: ${mm}:${ss}`;
        }
      }, 1000);
      if (typeof render === 'function') render();
    },
    pickExamAnswer(qi, oi) { CS.examAnswers[qi] = oi; if (typeof render === 'function') render(); },
    submitExam() {
      const tools = window.Study && window.Study.CampusTools;
      if (!tools || typeof tools.scoreExamAttempt !== 'function') return;
      if (examTimerId) { clearInterval(examTimerId); examTimerId = null; }
      const res = tools.scoreExamAttempt(CS.activeExamId, CS.examAnswers);
      CS.examResult = res;
      if (window.Study && window.Study.MvpDB && typeof window.Study.MvpDB.saveQuizAttempt === 'function') {
        window.Study.MvpDB.saveQuizAttempt({ id: `ex-${Date.now()}`, deckId: res.examId, title: res.title, score: res.nota20, total: 20 }).catch(() => {});
      }
      if (typeof toast === 'function') toast(`📝 Simulado corrigido: ${res.nota20.toFixed(1).replace('.', ',')} / 20 valores (${res.nivel})!`);
      if (typeof render === 'function') render();
    },
    resetExam() { CS.examAnswers = {}; CS.examResult = null; if (typeof render === 'function') render(); },
    setFcSubject(s) { CS.fcSubject = s; CS.fcIdx = 0; CS.fcFlipped = false; if (typeof render === 'function') render(); },
    flipFlashcard() { CS.fcFlipped = !CS.fcFlipped; if (typeof render === 'function') render(); },
    stepFlashcard(delta) {
      const tools = (window.Study && window.Study.CampusTools) || {};
      const deck = ((tools.FLASHCARD_DECKS || []).concat(loadState().customFlashcards || [])).filter((c) => CS.fcSubject === 'Todas' || c.subject === CS.fcSubject);
      if (!deck.length) return;
      CS.fcIdx = (CS.fcIdx + delta + deck.length) % deck.length;
      CS.fcFlipped = false;
      if (typeof render === 'function') render();
    },
    markFlashcardKnown(id) { CS.fcKnown[id] = !CS.fcKnown[id]; if (typeof render === 'function') render(); },
    generateCustomFlashcards() {
      const tools = window.Study && window.Study.CampusTools;
      const sub = String((document.getElementById('fc-gen-sub') || {}).value || 'Meus Cartões').trim();
      const txt = String((document.getElementById('fc-gen-txt') || {}).value || '').trim();
      if (!tools || !txt) return;
      const created = tools.buildFlashcardsFromText(sub, txt);
      if (!created.length) return typeof toast === 'function' && toast('Escreva pelo menos uma linha no formato "Conceito: Explicação".');
      const st = loadState();
      st.customFlashcards = created.concat(st.customFlashcards || []);
      CS.showFcGen = false;
      CS.fcSubject = sub;
      CS.fcIdx = 0;
      CS.fcFlipped = false;
      persistLocal();
      if (typeof toast === 'function') toast(`🃏 ${created.length} flashcards criados com sucesso!`);
      if (typeof render === 'function') render();
    },
    togglePresence(clsId, rowIdx) {
      const cls = loadState().classes.find((c) => c.id === clsId);
      if (!cls || !cls.pauta || !cls.pauta[rowIdx]) return;
      cls.pauta[rowIdx].presente = cls.pauta[rowIdx].presente === false;
      persistLocal();
      saveToMvpDb('classes', cls);
      if (typeof render === 'function') render();
    },
    updatePautaGrade(clsId, rowIdx, field, val) {
      const cls = loadState().classes.find((c) => c.id === clsId);
      if (!cls || !cls.pauta || !cls.pauta[rowIdx]) return;
      cls.pauta[rowIdx][field] = val === '' ? '' : Math.max(0, Math.min(20, Number(val) || 0));
      persistLocal();
      saveToMvpDb('classes', cls);
      if (typeof render === 'function') render();
    },
    addPautaStudent(clsId) {
      const cls = loadState().classes.find((c) => c.id === clsId);
      const nome = String((document.getElementById('pf-nome') || {}).value || '').trim();
      const numero = String((document.getElementById('pf-num') || {}).value || '').trim() || `CEU-${String(Date.now()).slice(-4)}`;
      if (!cls || !nome) return;
      cls.pauta = Array.isArray(cls.pauta) ? cls.pauta : [];
      cls.pauta.push({ id: `st-${Date.now()}`, numero, nome, presente: true, pp1: 12, pp2: 12, exame: '' });
      persistLocal();
      saveToMvpDb('classes', cls);
      if (typeof toast === 'function') toast(`Estudante ${nome} adicionado à pauta.`);
      if (typeof render === 'function') render();
    },
    exportClassPautaCsv(clsId) {
      const cls = loadState().classes.find((c) => c.id === clsId);
      const tools = window.Study && window.Study.CampusTools;
      if (!cls || !tools || typeof tools.exportPautaCsv !== 'function') return;
      const csv = tools.exportPautaCsv(cls.codigo, cls.pauta || [], CS.pesoFreq);
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `pauta-${cls.codigo.toLowerCase()}.csv`;
      document.body.appendChild(a);
      a.click();
      setTimeout(() => { URL.revokeObjectURL(url); a.remove(); }, 1200);
      if (typeof toast === 'function') toast(`📊 Pauta ${cls.codigo}.csv exportada (pronta para Excel)!`);
    },
    printClassPauta(clsId) {
      const cls = loadState().classes.find((c) => c.id === clsId);
      const tools = (window.Study && window.Study.CampusTools) || {};
      if (!cls || !tools.computeFinalPautaRow) return;
      const rows = (cls.pauta || []).map((r) => tools.computeFinalPautaRow(r, CS.pesoFreq));
      const w = window.open('', '_blank', 'width=900,height=680');
      if (!w) return typeof toast === 'function' && toast('Permita popups para imprimir a Pauta Oficial.');
      w.document.open();
      w.document.write(`<!doctype html><html lang="pt-AO"><head><meta charset="utf-8"><title>Pauta Oficial · ${esc(cls.codigo)}</title>
      <style>
        @page{size:A4 landscape;margin:14mm}body{font-family:system-ui,sans-serif;color:#0b1c3d;padding:20px}
        h1{margin:4px 0;font-size:20px;color:#00217e}.k{font:800 10px monospace;color:#0066b8;letter-spacing:.1em}
        table{width:100%;border-collapse:collapse;margin-top:16px;font-size:12.5px}
        th,td{border:1px solid #cbd9ea;padding:8px 10px;text-align:left}th{background:#00217e;color:#fff;font-size:11px;text-transform:uppercase}
        tr:nth-child(even){background:#f7faff}
        .signs{display:flex;justify-content:space-between;margin-top:42px;font-size:12px}
        .signs div{border-top:1px solid #0b1c3d;padding-top:6px;min-width:220px;text-align:center}
      </style></head><body>
        <div class="k">CEU ACADEMY · PAUTA ACADÉMICA DE FREQUÊNCIA E EXAME (ESCALA 0–20)</div>
        <h1>${esc(cls.instituicao)} · ${esc(cls.codigo)} — ${esc(cls.nome)}</h1>
        <div>Faculdade/Curso: <b>${esc(cls.faculdade)}</b> · Docente: <b>${esc(cls.docente)}</b> · Horário: ${esc(cls.horario)}</div>
        <table><thead><tr><th>N.º Estudante</th><th>Nome Completo</th><th>Presença</th><th>PP1</th><th>PP2</th><th>Média Freq.</th><th>Exame</th><th>Nota Final</th><th>Resultado</th></tr></thead>
        <tbody>${rows.map((r) => `<tr><td>${esc(r.numero)}</td><td><b>${esc(r.nome)}</b></td><td>${r.presente !== false ? 'Presente' : 'Falta'}</td><td>${esc(r.pp1 ?? '')}</td><td>${esc(r.pp2 ?? '')}</td><td><b>${esc(r.mf ?? '')}</b></td><td>${esc(r.exame ?? '—')}</td><td><b>${esc(r.notaFinal ?? '—')}</b></td><td>${esc(r.estado)}</td></tr>`).join('')}</tbody></table>
        <div class="signs"><div>O Docente Responsável<br><b>${esc(cls.docente)}</b></div><div>Coordenação Académica<br><b>${esc(cls.instituicao)}</b></div></div>
        <script>setTimeout(()=>window.print(),300);</script>
      </body></html>`);
      w.document.close();
    },
    setCareerSubTab(v) { CS.careerSubTab = v; if (typeof render === 'function') render(); },
    setTurmaFilter(v) { CS.turmaFilter = v; CS.activeClassId = ''; if (typeof render === 'function') render(); },
    setSubjectFilter(v) { CS.subjectFilter = v; if (typeof render === 'function') render(); },
    setSubjectQuery(v) { CS.subjectQuery = String(v || ''); if (typeof render === 'function') render(); },
    setUniFilter(v) { CS.uniFilter = v; if (typeof render === 'function') render(); },
    setUniQuery(v) { CS.uniQuery = String(v || ''); if (typeof render === 'function') render(); },
    toggleForm(k) { CS[k] = !CS[k]; if (typeof render === 'function') render(); },
    setGradeInput(key, val) {
      CS[key] = String(val ?? '');
      const resEl = document.getElementById('cp-grade-res');
      if (resEl) {
        const g = computeAngolaGrade(CS.pp1, CS.pp2, CS.pesoFreq);
        resEl.className = `cp-grade-res is-${g.status}`;
        resEl.innerHTML = `<span class="cp-grade-pill">${esc(g.badge)}</span><p>${esc(g.msg)}</p>`;
      }
    },
    toggleFinder(open) {
      CS.showFinder = Boolean(open);
      if (open && !/^#\/(campus|escolas|turmas|mentorias|estagios|materias|aulas-online)/.test(location.hash)) {
        location.hash = '#/campus';
        return;
      }
      if (typeof render === 'function') render();
      if (open) setTimeout(() => document.getElementById('cp-finder-in')?.focus(), 40);
    },
    updateFinder(val) {
      CS.finderQuery = String(val || '');
      const box = document.getElementById('cp-finder-list');
      if (!box) return;
      const hits = buildFinderResults(loadState(), CS.finderQuery);
      box.innerHTML = hits.length ? hits.map((h) => `<button type="button" class="cp-finder-item" onclick="${h.action}">
        <div><b>${esc(h.title)}</b><small>${esc(h.sub)}</small></div>
        <span class="cp-badge">${esc(h.kind)}</span>
      </button>`).join('') : `<p class="muted" style="margin:12px 0 0">Nenhum resultado para "${esc(CS.finderQuery)}".</p>`;
    },
    toggleUnit(clsId, unitIdx) {
      const st = loadState();
      const k = `${clsId}:${unitIdx}`;
      st.completedUnits[k] = !st.completedUnits[k];
      persistLocal();
      if (typeof render === 'function') render();
    },
    openUnitInSlides(clsId, unitIdx) {
      const st = loadState();
      const cls = st.classes.find((c) => c.id === clsId);
      if (!cls) return;
      const unitTitle = (cls.programa && cls.programa[unitIdx]) || cls.nome;
      sendTextToProjector(
        `${cls.nome} — ${unitTitle}`,
        cls.subject || 'geral',
        `${unitTitle}\nDisciplina: ${cls.nome} (${cls.instituicao} · ${cls.faculdade}).\nPrograma completo da turma:\n${(cls.programa || []).join('\n')}`,
        `${cls.codigo} · ${cls.instituicao}`
      );
    },
    postClassNote(clsId) {
      const st = loadState();
      const cls = st.classes.find((c) => c.id === clsId);
      const txt = String((document.getElementById('cp-mural-in') || {}).value || '').trim();
      if (!cls || !txt) return;
      cls.mural = Array.isArray(cls.mural) ? cls.mural : [];
      cls.mural.unshift({
        autor: getStudentCard().nome,
        papel: 'Estudante CEU',
        data: 'Agora',
        texto: txt,
      });
      persistLocal();
      saveToMvpDb('classes', cls);
      if (typeof toast === 'function') toast('💬 Publicado no mural da turma!');
      if (typeof render === 'function') render();
    },
    downloadSyllabusPdf(clsId) {
      const cls = loadState().classes.find((c) => c.id === clsId);
      if (!cls) return;
      openPrintableSebenta({
        titulo: `${cls.codigo} — ${cls.nome}`,
        subtitulo: `${cls.instituicao} · ${cls.faculdade} · Docente: ${cls.docente}`,
        resumo: `Plano curricular estruturado da turma ${cls.codigo} (${cls.horario}). Utilize esta folha para acompanhar as unidades estudadas e preparar as provas parcelares e exame.`,
        topicos: cls.programa || [],
        perguntas: ['Quais são os conceitos centrais de cada unidade do programa?', 'Que exercícios práticos foram resolvidos em aula sobre estes módulos?'],
      });
    },
    downloadLessonPdf(lesId) {
      const l = loadState().lessons.find((x) => x.id === lesId);
      if (!l) return;
      openPrintableSebenta({
        titulo: l.titulo,
        subtitulo: `${l.turmaNome} · Publicado por ${l.autor}`,
        resumo: l.resumo,
        topicos: String(l.slidesText || l.resumo).split(/\n+/).filter(Boolean),
        perguntas: ['Explique por palavras suas a ideia principal desta aula.', 'Como aplicar este conceito num exercício de exame ou caso prático em Angola?'],
      });
    },
    downloadSubjectPdf(subId) {
      const s = loadState().subjects.find((x) => x.id === subId);
      if (!s) return;
      openPrintableSebenta({
        titulo: s.titulo,
        subtitulo: `${s.area} · Nível: ${s.nivel}`,
        resumo: s.resumo,
        topicos: s.programa,
        formulas: s.formulas,
        perguntas: s.perguntas,
      });
    },
    openSubjectInSlides(subId) {
      const s = loadState().subjects.find((x) => x.id === subId);
      if (!s) return;
      const body = `${s.resumo}\n\nPrograma essencial:\n${s.programa.join('\n')}\n\nFórmulas e estruturas:\n${(s.formulas || []).join('\n')}`;
      sendTextToProjector(s.titulo, s.subject || 'geral', body, `Biblioteca CEU · ${s.area}`);
    },
    toggleEnrollOnline(id) {
      const st = loadState();
      const o = st.onlineClasses.find((x) => x.id === id);
      if (!o) return;
      const idx = st.enrolledOnline.indexOf(id);
      if (idx >= 0) {
        st.enrolledOnline.splice(idx, 1);
        o.inscritos = Math.max(0, (o.inscritos || 1) - 1);
        if (typeof toast === 'function') toast('Inscrição cancelada.');
      } else {
        st.enrolledOnline.push(id);
        o.inscritos = (o.inscritos || 0) + 1;
        saveToMvpDb('online_classes', o);
        if (typeof toast === 'function') toast(`✓ Inscrito na aula online "${o.titulo}" com Cartão ${getStudentCard().numero}!`);
      }
      persistLocal();
      if (typeof render === 'function') render();
    },
    createOnlineClass() {
      const st = loadState();
      const titulo = String((document.getElementById('of-titulo') || {}).value || '').trim();
      const docente = String((document.getElementById('of-doc') || {}).value || '').trim();
      if (!titulo || !docente) return;
      const rec = {
        id: `onl-${Date.now()}`,
        titulo,
        docente,
        instituicao: String((document.getElementById('of-inst') || {}).value || 'CEU Academy').trim(),
        dataHora: String((document.getElementById('of-data') || {}).value || 'Esta semana · 18h00').trim(),
        estado: 'INSCRIÇÕES ABERTAS',
        inscritos: 1,
        vagas: 150,
        subject: 'geral',
        resumo: String((document.getElementById('of-res') || {}).value || titulo).trim(),
      };
      st.onlineClasses.unshift(rec);
      st.enrolledOnline.push(rec.id);
      CS.showCreateOnline = false;
      persistLocal();
      saveToMvpDb('online_classes', rec);
      if (typeof toast === 'function') toast(`🔴 Aula online "${rec.titulo}" agendada e aberta a inscrições!`);
      if (typeof render === 'function') render();
    },
    openLiveRoom(id) { CS.liveRoomId = String(id || ''); if (typeof render === 'function') render(); },
    openOnlineInSlides(id) {
      const o = loadState().onlineClasses.find((x) => x.id === id);
      if (!o) return;
      CS.liveRoomId = '';
      sendTextToProjector(o.titulo, o.subject || 'geral', `${o.resumo}\nDocente: ${o.docente}\nInstituição: ${o.instituicao}`, o.instituicao);
    },
    downloadOnlinePdf(id) {
      const o = loadState().onlineClasses.find((x) => x.id === id);
      if (!o) return;
      openPrintableSebenta({
        titulo: o.titulo,
        subtitulo: `Aula Online · ${o.docente} · ${o.dataHora}`,
        resumo: o.resumo,
        topicos: ['Reveja os conceitos base antes do início da transmissão', 'Anote as resoluções passo a passo durante a aula', 'Coloque as suas dúvidas no quadro da sessão'],
        perguntas: ['Quais foram os 3 pontos mais importantes explicados nesta aula online?'],
      });
    },
    downloadIcs(id) {
      const o = loadState().onlineClasses.find((x) => x.id === id);
      if (!o) return;
      const now = new Date();
      const start = new Date(now.getTime() + 24 * 3600 * 1000);
      const end = new Date(start.getTime() + 3600 * 1000);
      const fmt = (d) => d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
      const ics = [
        'BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//CEU Academy//Aula Online//PT',
        'BEGIN:VEVENT',
        `UID:${o.id}@ceu-academy.com`,
        `DTSTAMP:${fmt(now)}`,
        `DTSTART:${fmt(start)}`,
        `DTEND:${fmt(end)}`,
        `SUMMARY:${o.titulo} (${o.docente})`,
        `DESCRIPTION:${o.resumo.replace(/\n/g, ' ')} - Sala Online CEU Academy`,
        'END:VEVENT', 'END:VCALENDAR',
      ].join('\r\n');
      const blob = new Blob([ics], { type: 'text/calendar;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `ceu-aula-${o.id}.ics`;
      document.body.appendChild(a);
      a.click();
      setTimeout(() => { URL.revokeObjectURL(url); a.remove(); }, 1200);
      if (typeof toast === 'function') toast('📅 Evento guardado (.ics) para o seu Calendário!');
    },
    filterTurmasByInst(sigla) {
      CS.turmaFilter = sigla;
      CS.activeClassId = '';
      CS.tab = 'turmas';
      if (typeof render === 'function') render();
    },
    toggleJoinClass(id) {
      const st = loadState();
      const cls = st.classes.find((c) => c.id === id);
      if (!cls) return;
      const idx = st.joinedClasses.indexOf(id);
      if (idx >= 0) {
        st.joinedClasses.splice(idx, 1);
        cls.alunos = Math.max(0, (cls.alunos || 1) - 1);
        if (typeof toast === 'function') toast(`Saiu da turma ${cls.codigo}.`);
      } else {
        st.joinedClasses.push(id);
        cls.alunos = (cls.alunos || 0) + 1;
        if (typeof toast === 'function') toast(`✓ Inscrito na turma ${cls.codigo} (${cls.nome})!`);
      }
      persistLocal();
      saveToMvpDb('classes', cls);
      if (typeof render === 'function') render();
    },
    joinByCode() {
      const val = String((document.getElementById('cp-join-code') || {}).value || '').trim().toUpperCase();
      if (!val) return typeof toast === 'function' && toast('Escreva o código da turma (ex. UAN-ENG-1A).');
      const st = loadState();
      const found = st.classes.find((c) => String(c.codigo || '').toUpperCase() === val);
      if (!found) return typeof toast === 'function' && toast(`Turma "${val}" não encontrada. Verifique o código ou crie uma nova turma.`);
      if (!st.joinedClasses.includes(found.id)) {
        st.joinedClasses.push(found.id);
        found.alunos = (found.alunos || 0) + 1;
        persistLocal();
        saveToMvpDb('classes', found);
      }
      CS.activeClassId = found.id;
      if (typeof toast === 'function') toast(`✓ Entrou na Sala da Turma ${found.codigo}!`);
      if (typeof render === 'function') render();
    },
    createClass() {
      const st = loadState();
      const nome = String((document.getElementById('cf-nome') || {}).value || '').trim();
      const inst = String((document.getElementById('cf-inst') || {}).value || '').trim();
      if (!nome || !inst) return;
      const rawCod = String((document.getElementById('cf-cod') || {}).value || '').trim().toUpperCase();
      const rawProg = String((document.getElementById('cf-prog') || {}).value || '').split(/\n+/).map((s) => s.trim()).filter(Boolean);
      const rec = {
        id: `cls-${Date.now()}`,
        codigo: rawCod || `${inst.replace(/[^A-Za-z0-9]/g, '').toUpperCase().slice(0, 6)}-${String(Date.now()).slice(-3)}`,
        nome,
        instituicao: inst,
        faculdade: String((document.getElementById('cf-fac') || {}).value || 'Turma Geral').trim(),
        nivel: String((document.getElementById('cf-nivel') || {}).value || 'Universidade'),
        docente: String((document.getElementById('cf-doc') || {}).value || 'Docente CEU').trim(),
        delegado: String((document.getElementById('cf-del') || {}).value || 'Por definir').trim(),
        horario: String((document.getElementById('cf-hor') || {}).value || 'A combinar').trim(),
        alunos: 1,
        vagas: 60,
        programa: rawProg.length ? rawProg : [
          `Unidade 1 · Introdução e Conceitos Fundamentais de ${nome}`,
          'Unidade 2 · Exercícios Práticos e Casos Aplicados',
          'Unidade 3 · Revisão Geral e Preparação de Avaliação',
        ],
        mural: [],
      };
      st.classes.unshift(rec);
      st.joinedClasses.push(rec.id);
      CS.showCreateClass = false;
      persistLocal();
      saveToMvpDb('classes', rec);
      if (typeof toast === 'function') toast(`🏫 Turma ${rec.codigo} criada com programa estruturado!`);
      if (typeof render === 'function') render();
    },
    publishLesson(customPayload = null) {
      const st = loadState();
      let turmaId, titulo, tipo, resumo, deckId, slidesText, subject, autor;
      if (customPayload) {
        ({ turmaId, titulo, tipo = 'Slides 3D + PDF', resumo, deckId = '', slidesText = '', subject = 'geral', autor = 'Docente CEU' } = customPayload);
      } else {
        turmaId = CS.activeClassId || String((document.getElementById('lf-turma') || {}).value || (st.classes[0] && st.classes[0].id) || '');
        titulo = String((document.getElementById('lf-titulo') || {}).value || '').trim();
        tipo = String((document.getElementById('lf-tipo') || {}).value || 'Slides 3D + PDF');
        deckId = String((document.getElementById('lf-deck') || {}).value || '');
        resumo = String((document.getElementById('lf-resumo') || {}).value || '').trim();
        slidesText = resumo;
        subject = 'geral';
        autor = (window.S && window.S.user && window.S.user.nome) || getStudentCard().nome || 'Docente CEU';
      }
      if (!titulo) return;
      const turma = st.classes.find((c) => c.id === turmaId) || st.classes[0];
      const rec = {
        id: `les-${Date.now()}`,
        turmaId: turma ? turma.id : 'cls-geral',
        turmaNome: turma ? `${turma.codigo} · ${turma.instituicao}` : 'Turma Geral',
        titulo,
        autor,
        tipo,
        data: 'Agora mesmo',
        resumo: resumo || titulo,
        slidesText: slidesText || resumo || titulo,
        deckId,
        subject,
      };
      st.lessons.unshift(rec);
      CS.showPublishLesson = false;
      persistLocal();
      saveToMvpDb('lessons', rec);
      if (typeof toast === 'function') toast(`📢 Aula "${rec.titulo}" publicada em ${rec.turmaNome}!`);
      if (!customPayload && typeof render === 'function') render();
      return rec;
    },
    openLessonInProjector(id) {
      const st = loadState();
      const l = st.lessons.find((x) => x.id === id);
      if (!l) return;
      if (l.deckId && window.AMAProjector && typeof window.AMAProjector.openSaved === 'function') {
        location.hash = '#/projetor';
        setTimeout(() => window.AMAProjector.openSaved(l.deckId), 60);
        return;
      }
      sendTextToProjector(l.titulo, l.subject || 'geral', l.slidesText || l.resumo, l.turmaNome || 'Campus CEU');
    },
    addUniversity() {
      const st = loadState();
      const sigla = String((document.getElementById('uf-sigla') || {}).value || '').trim();
      const nome = String((document.getElementById('uf-nome') || {}).value || '').trim();
      if (!sigla || !nome) return;
      const facs = String((document.getElementById('uf-facs') || {}).value || '').split(',').map((s) => s.trim()).filter(Boolean);
      const rec = {
        id: `u-${Date.now()}`,
        sigla,
        nome,
        tipo: String((document.getElementById('uf-tipo') || {}).value || 'Universidade Privada'),
        provincia: String((document.getElementById('uf-prov') || {}).value || 'Luanda').trim(),
        faculdades: facs.length ? facs : ['Ciências & Tecnologia', 'Gestão'],
        parceria: 'Nova Parceria CEU',
        turmasAtivas: 1,
      };
      st.universities.unshift(rec);
      CS.showAddUni = false;
      persistLocal();
      saveToMvpDb('universities', rec);
      if (typeof toast === 'function') toast(`🎓 ${rec.sigla} adicionada à rede parceira!`);
      if (typeof render === 'function') render();
    },
    addDelegate() {
      const st = loadState();
      const nome = String((document.getElementById('df-nome') || {}).value || '').trim();
      const inst = String((document.getElementById('df-inst') || {}).value || '').trim();
      if (!nome || !inst) return;
      const rec = {
        id: `del-${Date.now()}`,
        nome,
        cargo: String((document.getElementById('df-cargo') || {}).value || 'Delegado de Turma'),
        instituicao: inst,
        faculdade: String((document.getElementById('df-fac') || {}).value || 'Geral').trim(),
        contacto: String((document.getElementById('df-cont') || {}).value || 'Contacto via CEU Academy').trim(),
        comunicado: String((document.getElementById('df-msg') || {}).value || '').trim(),
      };
      st.delegates.unshift(rec);
      CS.showAddDelegate = false;
      persistLocal();
      saveToMvpDb('delegates', rec);
      if (typeof toast === 'function') toast(`🏅 ${rec.cargo} (${rec.nome}) registado!`);
      if (typeof render === 'function') render();
    },
    bookMentorship(id) {
      const st = loadState();
      const m = st.mentorships.find((x) => x.id === id);
      if (!m) return;
      const idx = st.bookedMentorships.indexOf(id);
      if (idx >= 0) {
        st.bookedMentorships.splice(idx, 1);
        if (typeof toast === 'function') toast(`Marcação com ${m.mentor} cancelada.`);
      } else {
        st.bookedMentorships.push(id);
        saveToMvpDb('mentorships', { ...m, lastBookingBy: getStudentCard().nome, bookedAt: new Date().toISOString() });
        if (typeof toast === 'function') toast(`🧭 Mentoria marcada com ${m.mentor} (${m.horario})!`);
      }
      persistLocal();
      if (typeof render === 'function') render();
    },
    applyInternship(id) {
      const st = loadState();
      const item = st.internships.find((x) => x.id === id);
      if (!item) return;
      const card = getStudentCard();
      if (!st.appliedInternships.includes(id)) {
        st.appliedInternships.push(id);
        persistLocal();
        saveToMvpDb('internships', { ...item, lastApplicant: card.nome, studentCard: card.numero, appliedAt: new Date().toISOString() });
        if (typeof toast === 'function') toast(`💼 Candidatura enviada para "${item.titulo}" com Cartão ${card.numero}!`);
        if (typeof render === 'function') render();
      } else if (typeof toast === 'function') {
        toast('Já se candidatou a este estágio.');
      }
    },
    listClasses() { return loadState().classes; },
  };

  // Atalho global Ctrl+K / Cmd+K para Pesquisa Académica Instantânea em qualquer página CEU
  document.addEventListener('keydown', (ev) => {
    if ((ev.ctrlKey || ev.metaKey) && ev.key.toLowerCase() === 'k') {
      if (document.documentElement.dataset.brand !== 'ceu') return;
      ev.preventDefault();
      window.CEUCampus.toggleFinder(!CS.showFinder);
    }
  });

  if (typeof on === 'function') {
    on('/campus', campusView);
    on('/escolas', campusView);
    on('/turmas', campusView);
    on('/materias', () => { CS.tab = 'materias'; return campusView(); });
    on('/exames', () => { CS.tab = 'exames'; return campusView(); });
    on('/aulas-online', () => { CS.tab = 'online'; return campusView(); });
    on('/mentorias', () => { CS.tab = 'carreira'; CS.careerSubTab = 'mentorias'; return campusView(); });
    on('/estagios', () => { CS.tab = 'carreira'; CS.careerSubTab = 'estagios'; return campusView(); });
  }
})();
