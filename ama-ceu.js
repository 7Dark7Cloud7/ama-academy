/* CEU Academy — entrada rebranded, focada em cursos para universitários.
   Os cursos de Matemática, Física e Estudo são acrescentados ao catálogo
   apenas na marca CEU (a versão AMA continua intacta). */
(function () {
  'use strict';
  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const isCeu = () => document.documentElement.dataset.brand === 'ceu'
    || new URLSearchParams(location.search).get('marca') === 'ceu'
    || /(^|\/)ceu$/.test(location.pathname.replace(/\/+$/, ''));

  const CEU_COURSES = [
    {
      id: 101, titulo: 'Matemática I — Álgebra e Funções', slug: 'matematica-i-algebra-e-funcoes',
      categoria: 'Matemática', nivel: 'Iniciante', preco_kz: 0, preco_anterior_kz: 0,
      rating: 4.8, alunos: 412, instrutor_id: 12, aulas: 8, duracaoH: 6,
      instrutor: 'Prof.ª Ana Silva', poster: 'nucleo-math-3d', estado: 'PUBLIC',
      resumo: 'Da algebra elementar às funções: bases sólidas para qualquer curso universitário de Ciências, Engenharia ou Economia.',
      aprendizagens: ['Rever operações com expressões algébricas', 'Resolver equações e inequações', 'Ler e representar funções', 'Aplicar funções a problemas reais'],
      requisitos: ['Nenhum pré-requisito', 'Caderno e calculadora'],
    },
    {
      id: 102, titulo: 'Física I — Leis de Newton', slug: 'fisica-i-leis-de-newton',
      categoria: 'Física', nivel: 'Iniciante', preco_kz: 0, preco_anterior_kz: 0,
      rating: 4.7, alunos: 386, instrutor_id: 2, aulas: 7, duracaoH: 5,
      instrutor: 'Prof. Nelson Duarte', poster: 'nucleo-physics-3d', estado: 'PUBLIC',
      resumo: 'Mecânica desde o zero: força, massa e aceleração com exemplos de Angola e exercícios resolvidos passo a passo.',
      aprendizagens: ['Enunciar as três leis de Newton', 'Calcular a força resultante', 'Distinguir massa e peso', 'Resolver problemas de dinâmica'],
      requisitos: ['Matemática básica', 'Vontade de praticar'],
    },
    {
      id: 103, titulo: 'Técnicas de Estudo para a Universidade', slug: 'tecnicas-de-estudo-universidade',
      categoria: 'Estudo', nivel: 'Todos os níveis', preco_kz: 0, preco_anterior_kz: 0,
      rating: 4.9, alunos: 940, instrutor_id: 3, aulas: 6, duracaoH: 3,
      instrutor: 'Prof.ª Sofia Mateus', poster: 'catalog-laptop-v2', estado: 'PUBLIC',
      resumo: 'Aprender a aprender: resumos inteligentes, revisão espaçada, gestão do tempo e preparação para exames.',
      aprendizagens: ['Transformar apontamentos em resumos úteis', 'Planear sessões de estudo', 'Usar revisão espaçada', 'Chegar preparado ao exame'],
      requisitos: ['Nenhum pré-requisito'],
    },
    {
      id: 104, titulo: 'Matemática II — Cálculo Diferencial', slug: 'matematica-calculo-diferencial',
      categoria: 'Matemática', nivel: 'Intermédio', preco_kz: 0, preco_anterior_kz: 0,
      rating: 4.6, alunos: 268, instrutor_id: 12, aulas: 9, duracaoH: 7,
      instrutor: 'Prof.ª Ana Silva', poster: 'nucleo-math-3d', estado: 'PUBLIC',
      resumo: 'Limites, derivadas e aplicações: a ferramenta que aparece em Engenharia, Economia e Ciências Naturais.',
      aprendizagens: ['Calcular limites', 'Derivar funções com regra da cadeia', 'Interpretar a derivada', 'Resolver problemas de optimização'],
      requisitos: ['Matemática I ou equivalente'],
    },
    {
      id: 105, titulo: 'Inglês Académico & Profissional (B1–C1)', slug: 'ingles-academico-profissional',
      categoria: 'Idiomas', nivel: 'Todos os níveis', preco_kz: 0, preco_anterior_kz: 0,
      rating: 4.9, alunos: 1120, instrutor_id: 15, aulas: 10, duracaoH: 8,
      instrutor: 'Prof.ª Carla Mendes', poster: 'catalog-student-v2', estado: 'PUBLIC',
      resumo: 'Domine inglês para apresentações universitárias, leitura de artigos científicos, entrevistas de estágio e bolsas internacionais.',
      aprendizagens: ['Falar com fluência em apresentações e entrevistas', 'Ler e resumir artigos académicos em inglês', 'Escrever emails profissionais e CV internacional', 'Vocabulário técnico para Tecnologia, Gestão e Engenharia'],
      requisitos: ['Inglês escolar básico', '15 min de prática oral por dia'],
    },
    {
      id: 106, titulo: 'Marketing Digital & Redes Sociais em Angola', slug: 'marketing-digital-angola-ceu',
      categoria: 'Marketing', nivel: 'Iniciante', preco_kz: 0, preco_anterior_kz: 0,
      rating: 4.8, alunos: 875, instrutor_id: 13, aulas: 8, duracaoH: 6,
      instrutor: 'Prof.ª Sofia Almeida', poster: 'card-marketing-v2', estado: 'PUBLIC',
      resumo: 'Estratégia digital aplicada ao mercado angolano: criação de conteúdo, Meta/TikTok Ads em kwanzas, funil de vendas e marca pessoal.',
      aprendizagens: ['Estruturar plano editorial que gera alcance e vendas', 'Configurar campanhas Meta Ads e WhatsApp Business em Angola', 'Analisar métricas reais (CTR, CPL, CAC e ROAS)', 'Construir portfólio prático para estágios em agências'],
      requisitos: ['Telemóvel ou computador com acesso à internet'],
    },
    {
      id: 107, titulo: 'Excel Avançado, Power BI & Análise de Dados', slug: 'excel-powerbi-dados',
      categoria: 'Tecnologia', nivel: 'Intermédio', preco_kz: 0, preco_anterior_kz: 0,
      rating: 4.8, alunos: 690, instrutor_id: 12, aulas: 9, duracaoH: 7,
      instrutor: 'Eng.º Mateus João', poster: 'nucleo-code-fin-3d', estado: 'PUBLIC',
      resumo: 'De fórmulas avançadas a dashboards executivos em Power BI — competência mais pedida em estágios de Banca, Petróleo e Gestão.',
      aprendizagens: ['Dominar PROCX, tabelas dinâmicas e limpeza de dados', 'Criar dashboards interativos em Power BI', 'Automatizar relatórios financeiros e académicos', 'Apresentar indicadores de gestão com clareza'],
      requisitos: ['Noções básicas de folhas de cálculo'],
    },
    {
      id: 108, titulo: 'Liderança Estudantil, Oratória & Gestão de Turmas', slug: 'lideranca-estudantil-delegados',
      categoria: 'Desenvolvimento Pessoal', nivel: 'Todos os níveis', preco_kz: 0, preco_anterior_kz: 0,
      rating: 4.9, alunos: 540, instrutor_id: 2, aulas: 6, duracaoH: 4,
      instrutor: 'Prof. Adolfo Camacho', poster: 'card-lideranca-v2', estado: 'PUBLIC',
      resumo: 'Formação prática para Delegados de Turma, Presidentes de Associações de Estudantes (AE) e estudantes em defesa de monografia.',
      aprendizagens: ['Conduzir reuniões, elaborar atas e mobilizar turmas', 'Negociar com coordenações académicas e parceiros', 'Falar com confiança em assembleias e defesas de tese', 'Organizar jornadas científicas, mentorias e eventos no campus'],
      requisitos: ['Nenhum pré-requisito'],
    },
  ];

  function injectCourses() {
    if (!isCeu()) return;
    const data = window.AMA_DATA || (window.AMA_DATA = { cursos: [] });
    data.cursos = Array.isArray(data.cursos) ? data.cursos : [];
    data.categorias = Array.isArray(data.categorias) ? data.categorias : ['Todas'];
    const detail = data.detalhe || (data.detalhe = {});
    CEU_COURSES.forEach((c, ci) => {
      if (!data.cursos.some((x) => x.id === c.id || x.slug === c.slug)) data.cursos.unshift(JSON.parse(JSON.stringify(c)));
      if (c.categoria && !data.categorias.includes(c.categoria)) data.categorias.push(c.categoria);
      if (!detail[String(c.id)]) {
        const lessons = (c.aprendizagens || []).slice(0, 5).map((a, li) => ({
          id: 9000 + ci * 10 + li,
          course_id: c.id,
          titulo: a,
          dur_seg: 360 + li * 60,
          livre: li === 0 ? 1 : 0,
          tipo: 'video',
          resumo: `${a}. Aula do curso ${c.titulo}, na CEU Academy.`,
        }));
        detail[String(c.id)] = {
          seccoes: [{ id: 900 + ci, course_id: c.id, titulo: 'Módulo 1 · Fundamentos', ordem: 1, aulas: lessons }],
          instrutor: { id: c.instrutor_id, nome: c.instrutor, handle: c.instrutor.split(' ').slice(-1)[0], avatar_cor: '#0b63c5' },
          aoVivo: [],
        };
      }
    });
    try { localStorage.setItem('ama-data-v1', JSON.stringify(data)); } catch { }
  }
  injectCourses();

  let homeCourseFilter = 'Todos';
  let homeShowcaseTab = 'turmas'; // 'turmas' | 'cartao' | 'slides'

  function courseCard(c) {
    return `<a class="ceu-course" href="#/curso/${esc(c.id)}">
      <span class="ceu-course-art">
        <img src="media/${esc(c.poster || 'catalog-student-v2')}.jpg?v=70" alt="${esc(c.titulo)}" loading="lazy">
        <span class="ceu-course-tag">${c.preco_kz ? `${Number(c.preco_kz).toLocaleString('pt-PT')} Kz` : 'Gratuito CEU'}</span>
      </span>
      <span class="ceu-course-body">
        <small>${esc(c.categoria)} · ${esc(c.nivel)}</small>
        <b>${esc(c.titulo)}</b>
        <span class="ceu-course-meta">★ ${Number(c.rating || 4.7).toFixed(1).replace('.', ',')} · ${c.aulas || 6} aulas · ${(c.alunos || 0).toLocaleString('pt-PT')} estudantes</span>
        <span class="ceu-course-cta">Abrir programa &amp; Slides 3D →</span>
      </span>
    </a>`;
  }

  function renderHeroShowcase(card) {
    if (homeShowcaseTab === 'cartao') {
      const verifyUrl = `https://ceu.ao/verify?num=${encodeURIComponent(card.numero)}&uni=${encodeURIComponent(card.universidade)}`;
      const miniQr = (window.Study && window.Study.QR && typeof window.Study.QR.renderQrSvg === 'function')
        ? window.Study.QR.renderQrSvg(verifyUrl, { size: 74, fg: '#00217e', bg: '#ffffff', label: 'QR CEU' })
        : '';
      return `<div class="uni-demo-pane" data-testid="hero-demo-cartao">
        <div class="uni-mini-id">
          <div class="uni-mini-id-top">
            <img src="assets/ceu-logo.png?v=1" alt="CEU" class="ceu-hero-logo">
            <div><small>CARTÃO NACIONAL · CEU.AO</small><b>${esc(card.nome)}</b></div>
            <span class="ceu-id-status">ACTIVO</span>
          </div>
          <div class="uni-mini-id-mid">
            <div>
              <span>${esc(card.universidade)}</span>
              <small>${esc(card.curso)} · ${esc(card.ano)}</small>
              <code>${esc(card.numero)}</code>
            </div>
            ${miniQr ? `<div class="uni-mini-qr">${miniQr}</div>` : ''}
          </div>
        </div>
        <div class="uni-demo-foot"><span>Verificação por QR Code offline e impressão direta</span><a href="#/cartao-ceu">Personalizar →</a></div>
      </div>`;
    }
    if (homeShowcaseTab === 'slides') {
      return `<div class="uni-demo-pane" data-testid="hero-demo-slides">
        <div class="uni-mini-slide">
          <div class="uni-ms-top"><span>✦ SLIDE 3D · SUPER-IA</span><small>QR Turma · Voz · Laser</small></div>
          <strong>Energia Solar &amp; Física Aplicada</strong>
          <div class="uni-ms-grid">
            <div class="uni-ms-stat"><b>2.200 h</b><span>Insolação/ano em Angola</span></div>
            <div class="uni-ms-pts">
              <span>• PDF, Ata ou guião ChatGPT → Slides</span>
              <span>• Imagens reais da Web + 3D interactivo</span>
              <span>• Exportação .PPTX, PDF e Ficha do Aluno</span>
            </div>
          </div>
        </div>
        <div class="uni-demo-foot"><span>Do documento à projeção em sala em segundos</span><a href="#/projetor">Abrir Projetor →</a></div>
      </div>`;
    }
    return `<div class="uni-demo-pane" data-testid="hero-demo-turmas">
      <div class="uni-mini-list">
        <a class="uni-mini-row" href="#/campus"><div><b>UAN-ENG-1A · Física I</b><small>Universidade Agostinho Neto · 72 alunos</small></div><span>Slides 3D</span></a>
        <a class="uni-mini-row" href="#/campus"><div><b>ISPTEC-INF-2A · Python &amp; IA</b><small>ISPTEC · 46 alunos · Delegado activo</small></div><span>Publicada</span></a>
        <a class="uni-mini-row" href="#/campus"><div><b>CEU-MKT-01 · Marketing Digital</b><small>Escola Online Aberta · 118 alunos</small></div><span>Ao Vivo</span></a>
        <a class="uni-mini-row" href="#/campus"><div><b>IMIL-INF-12A · Acesso Superior</b><small>Ensino Médio Técnico · 39 alunos</small></div><span>Ficha + IA</span></a>
      </div>
      <div class="uni-demo-foot"><span>Várias turmas em paralelo · escolas e universidades</span><a href="#/campus">Entrar no Campus →</a></div>
    </div>`;
  }

  function ceuHomeView() {
    const allCeu = (window.AMA_DATA && window.AMA_DATA.cursos ? window.AMA_DATA.cursos : [])
      .filter((c) => [105, 106, 101, 102, 107, 108, 103, 104].includes(c.id));
    const cursos = allCeu.filter((c) => {
      if (homeCourseFilter === 'Todos') return [105, 106, 101, 102, 107, 108].includes(c.id);
      if (homeCourseFilter === 'STEM & Dados') return ['Matemática', 'Física', 'Tecnologia'].includes(c.categoria);
      if (homeCourseFilter === 'Liderança') return ['Desenvolvimento Pessoal', 'Estudo'].includes(c.categoria);
      return c.categoria === homeCourseFilter;
    }).slice(0, 6);

    const portals = [
      { badge: 'ESTUDANTES', t: 'Turmas, Cursos & Estágios', d: 'Entre nas turmas da sua escola ou faculdade, aceda a aulas publicadas, mentorias e vagas de estágio.', href: '#/campus', cta: 'Abrir Campus' },
      { badge: 'DOCENTES', t: 'Publicar Aulas & Slides 3D', d: 'Transforme PDFs em slides interativos com voz e publique imediatamente nas suas turmas.', href: '#/projetor', cta: 'Criar Aula IA' },
      { badge: 'DELEGADOS & AE', t: 'Presidentes AE & Turmas', d: 'Coordene associações de estudantes, publique comunicados oficiais e organize jornadas científicas.', href: '#/campus', cta: 'Portal Direção AE', tab: 'delegados' },
      { badge: 'INSTITUIÇÕES', t: 'Escolas & Universidades', d: 'Rede nacional de faculdades, colégios e institutos médios técnicos ligados ao Cartão CEU.', href: '#/campus', cta: 'Ver Rede Parceira', tab: 'universidades' },
    ];

    const unis = ['UAN', 'ISPTEC', 'UCAN', 'ULuanda', 'UMA', 'UPRA', 'UTANGA', 'UJES', 'UMN', 'UKB', 'IMETRO', 'Unibelas', 'IMIL', 'IMEL'];
    const card = loadLocalCard();
    const inner = `<section class="ceu-landing uni-home">
      <div class="uni-notice-bar" role="region" aria-label="Destaque Académico">
        <span class="uni-dot"></span>
        <span><b>Ano Letivo 2026/2027</b> · Escola Online &amp; Portal Universitário de Angola — Turmas, Cursos, Mentorias, Estágios e Cartão CEU</span>
        <a href="#/campus">Explorar Campus →</a>
      </div>

      <div class="ceu-hero ceu-main-hero">
        <div class="ceu-hero-copy">
          <span class="uni-crest-pill">✦ ECOSSISTEMA ACADÉMICO · CEU.AO</span>
          <h1>A Escola e Universidade<br><em>Digital de Angola.</em></h1>
          <p>Um campus completo que ajuda mesmo a estudar: <b>salas de turma com programa oficial, sebentas PDF, aulas online com inscrição, cursos de Inglês e Marketing, simulador de média 0–20, mentorias, estágios</b> e Projetor IA 3D.</p>
          <div class="ceu-cta">
            <a class="btn btn-p" href="#/campus">🏫 Entrar no Campus &amp; Turmas</a>
            <button type="button" class="btn btn-o" onclick="if(window.CEUCampus)CEUCampus.toggleFinder(true);else location.hash='#/campus'">🔍 Pesquisar Matéria / Turma (Ctrl+K)</button>
          </div>
          <div class="ceu-hero-facts">
            <span><b>MESCTI</b> Reconhecido</span>
            <span><b>Sebentas PDF</b> + Slides 3D</span>
            <span><b>Aulas Online</b> + Inscrição</span>
            <span><b>14+</b> Instituições AO</span>
          </div>
        </div>

        <aside class="uni-showcase-card" aria-label="Demonstração interativa da plataforma">
          <div class="uni-sc-tabs" role="tablist" aria-label="Pré-visualização do sistema">
            <button type="button" role="tab" aria-selected="${homeShowcaseTab === 'turmas'}" class="${homeShowcaseTab === 'turmas' ? 'on' : ''}" onclick="CEUHome.setShowcaseTab('turmas')">🏫 Multi-Turmas</button>
            <button type="button" role="tab" aria-selected="${homeShowcaseTab === 'cartao'}" class="${homeShowcaseTab === 'cartao' ? 'on' : ''}" onclick="CEUHome.setShowcaseTab('cartao')">🎓 Cartão CEU</button>
            <button type="button" role="tab" aria-selected="${homeShowcaseTab === 'slides'}" class="${homeShowcaseTab === 'slides' ? 'on' : ''}" onclick="CEUHome.setShowcaseTab('slides')">✦ Slides 3D</button>
          </div>
          ${renderHeroShowcase(card)}
        </aside>
      </div>

      <div class="uni-metrics-strip" aria-label="Números do ecossistema CEU">
        <div><b>14+</b><span>Grandes Universidades &amp; Escolas Técnicas</span></div>
        <div><b>10+</b><span>Cursos: Inglês, Marketing, STEM &amp; Dados</span></div>
        <div><b>Multi-Turmas</b><span>Aulas publicadas, delegados e horários</span></div>
        <div><b>Carreira</b><span>Mentorias 1-a-1 &amp; Estágios em Angola</span></div>
      </div>

      <div class="ceu-section-head">
        <span class="eyebrow-t">PLATAFORMA COMPLETA · DEMONSTRAÇÃO AO VIVO</span>
        <h2>Tudo o que estudantes, docentes e escolas precisam num só lugar</h2>
        <p>Do ensino médio técnico às grandes faculdades — cada módulo funciona integrado para estudar, ensinar, representar turmas e conquistar estágios.</p>
      </div>

      <div class="uni-bento" data-testid="home-bento-showcase">
        <a class="uni-bento-card is-wide is-navy" href="#/campus">
          <div class="uni-b-top"><span class="uni-b-tag">SALAS DE TURMA · PROGRAMA &amp; MATERIAIS</span><span>🏫</span></div>
          <h3>Salas de Turma com Programa Oficial, Slides 3D &amp; Mural</h3>
          <p>Entre na sua turma por código, acompanhe e marque as unidades do programa estudadas, baixe sebentas PDF e tire dúvidas no mural.</p>
          <div class="uni-b-chips">
            <span>UAN-ENG-1A · Física I</span>
            <span>ISPTEC-INF-2A · Python</span>
            <span>CEU-MKT-01 · Marketing</span>
            <span>CEU-ING-B2 · Inglês</span>
            <span>IMIL-INF-12A · Acesso</span>
          </div>
          <span class="uni-b-cta">Abrir Salas de Turma →</span>
        </a>

        <a class="uni-bento-card" href="#/materias">
          <div class="uni-b-top"><span class="uni-b-tag">BIBLIOTECA DE ESTUDO</span><span>📚</span></div>
          <h3>Matérias, Sebentas PDF &amp; Fórmulas</h3>
          <p>8 disciplinas chave (Cálculo, Física, Python, Inglês, Marketing, Finanças, Direito e Biologia) com sebenta PDF pronta a imprimir.</p>
          <div class="uni-b-chips"><span>Sebenta A4 PDF</span><span>Questões Exame</span></div>
          <span class="uni-b-cta">Baixar Sebentas PDF →</span>
        </a>

        <a class="uni-bento-card" href="#/aulas-online">
          <div class="uni-b-top"><span class="uni-b-tag">TRANSMISSÕES &amp; REVISÕES</span><span>🔴</span></div>
          <h3>Aulas Online &amp; Inscrição 1-Clique</h3>
          <p>Inscreva-se gratuitamente nas revisões de exame e clubes de conversação em inglês, guarde no calendário (.ics) e entre na sala.</p>
          <div class="uni-b-chips"><span>● Ao Vivo Hoje</span><span>Agenda .ICS</span><span>Acesso Livre CEU</span></div>
          <span class="uni-b-cta">Inscrever em Aula Online →</span>
        </a>

        <a class="uni-bento-card" href="#/campus" onclick="setTimeout(()=>{if(window.CEUCampus){CEUCampus.toggleForm('showGradeCalc')}},60)">
          <div class="uni-b-top"><span class="uni-b-tag">FERRAMENTAS INTELIGENTES</span><span>🎯</span></div>
          <h3>Simulador de Média 0–20 &amp; Exame</h3>
          <p>Introduza as notas da 1.ª e 2.ª Parcelar: descubra na hora se dispensou (&ge; 14 valores) ou quanto precisa tirar no Exame Final.</p>
          <div class="uni-b-mini"><b>40% Freq + 60% Exame</b> ou 50%/50% — adaptado às universidades de Angola.</div>
          <span class="uni-b-cta">Calcular a Minha Média →</span>
        </a>

        <a class="uni-bento-card" href="#/estagios">
          <div class="uni-b-top"><span class="uni-b-tag">CARREIRA, AE &amp; PROJETOR 3D</span><span>💼</span></div>
          <h3>Mentorias, Estágios &amp; Presidentes AE</h3>
          <p>Candidate-se a estágios com o Cartão CEU, marque mentorias de carreira/bolsas e acompanhe comunicados das Associações de Estudantes.</p>
          <div class="uni-b-chips"><span>Estágios AO</span><span>Mentorias</span><span>Direção AE</span><span>Projetor 3D</span></div>
          <span class="uni-b-cta">Ver Mentorias &amp; Estágios →</span>
        </a>

        <div class="uni-bento-card is-full">
          <div class="uni-b-top"><span class="uni-b-tag">GRANDES UNIVERSIDADES &amp; ESCOLAS PARCEIRAS DE ANGOLA</span><span>🎓</span></div>
          <h3>Rede Nacional — Ensino Superior &amp; Ensino Médio Técnico</h3>
          <p>Clique em qualquer instituição para consultar as suas faculdades, turmas activas e representação estudantil.</p>
          <div class="uni-inst-grid">
            ${unis.map((u) => `<a href="#/campus" onclick="setTimeout(()=>{if(window.CEUCampus)CEUCampus.filterTurmasByInst('${u}')},40)">${u}</a>`).join('')}
          </div>
        </div>
      </div>

      <div class="ceu-section-head uni-courses-head">
        <div>
          <span class="eyebrow-t">FORMAÇÃO CONTÍNUA &amp; UNIVERSITÁRIA</span>
          <h2>Cursos de Inglês, Marketing, Dados, STEM &amp; Liderança</h2>
          <p>Aulas práticas com acompanhamento, certificação digital e abertura direta em Slides 3D.</p>
        </div>
        <div class="cp-pills" role="group" aria-label="Filtrar cursos na página inicial">
          ${['Todos', 'Idiomas', 'Marketing', 'STEM & Dados', 'Liderança'].map((cat) => `<button type="button" class="${homeCourseFilter === cat ? 'on' : ''}" onclick="CEUHome.setCourseFilter('${cat}')">${cat}</button>`).join('')}
        </div>
      </div>
      <div class="ceu-courses uni-courses-grid">${cursos.map(courseCard).join('')}</div>
      <div class="ceu-all-courses"><a class="btn btn-o" href="#/catalogo">Ver todos os cursos do catálogo →</a></div>

      <div class="ceu-section-head">
        <span class="eyebrow-t">ENTRADA POR PERFIL</span>
        <h2>Desenhado para cada papel da comunidade educativa</h2>
      </div>
      <div class="uni-portals" aria-label="Portais por perfil académico">
        ${portals.map((p) => `<a class="uni-portal-card" href="${p.href}" ${p.tab ? `onclick="setTimeout(()=>{if(window.CEUCampus)CEUCampus.setTab('${p.tab}')},40)"` : ''}>
          <span class="uni-portal-k">${esc(p.badge)}</span>
          <strong>${esc(p.t)}</strong>
          <p>${esc(p.d)}</p>
          <span>${esc(p.cta)} →</span>
        </a>`).join('')}
      </div>

      <div class="ceu-band uni-band">
        <div>
          <span class="eyebrow-t">CEU ACADEMY · ANGOLA</span>
          <h2>Comece hoje na sua escola ou faculdade.</h2>
          <p>Entre nas turmas da sua instituição, personalize o seu Cartão CEU com QR Code, inscreva-se em Inglês ou Marketing e aceda a mentorias e estágios.</p>
        </div>
        <div class="flex wrap" style="gap:10px">
          <a class="btn btn-p" href="#/campus">Entrar no Campus →</a>
          <a class="btn btn-o" href="#/cartao-ceu">Criar Cartão CEU</a>
        </div>
      </div>

      <div class="ceu-mobile-bar" aria-label="Navegação rápida">
        <a href="#/ceu-inicio" class="active">Início</a>
        <a href="#/campus">Campus</a>
        <a href="#/projetor" class="primary">Projetor</a>
        <a href="#/cartao-ceu">Cartão</a>
      </div>
    </section>`;
    return typeof shellPublic === 'function' ? shellPublic(inner, 'inicio') : inner;
  }

  const CARD_KEY = 'ceu-student-card-v1';
  function loadLocalCard() {
    try {
      const saved = JSON.parse(localStorage.getItem(CARD_KEY) || 'null');
      if (saved && saved.nome) return saved;
    } catch { }
    const u = window.S && window.S.user;
    return {
      id: 'card-primary',
      nome: (u && u.nome) || 'Estudante Universitário CEU',
      universidade: 'Universidade de Luanda',
      curso: 'Engenharia Informática',
      ano: '2.º Ano',
      numero: 'CEU-2026-0412',
    };
  }

  function ceuCardView() {
    const card = loadLocalCard();
    let decks = [];
    try { decks = JSON.parse(localStorage.getItem('ama-projector-v1') || '[]'); } catch { decks = []; }
    const unis = ['ISPTEC', 'UCAN', 'Universidade de Luanda', 'UMA', 'IMETRO', 'INSUTEC', 'Unibelas', 'UGS', 'Universidade Agostinho Neto'];
    const verifyUrl = `https://ceu.ao/verify?num=${encodeURIComponent(card.numero)}&uni=${encodeURIComponent(card.universidade)}`;
    let cardQr = '';
    if (window.Study && window.Study.QR && typeof window.Study.QR.renderQrSvg === 'function') {
      cardQr = window.Study.QR.renderQrSvg(verifyUrl, { size: 88, fg: '#00217e', bg: '#ffffff', label: `QR Cartão CEU ${card.numero}` });
    } else {
      window.addEventListener('study-ready', () => {
        if (/^#\/cartao-ceu/.test(location.hash) && typeof render === 'function') render();
      }, { once: true });
    }
    const inner = `<section class="ceu-landing" style="padding-top:24px">
      <div class="page-h" style="margin-bottom:20px">
        <div>
          <span class="eyebrow-t">CARTÃO DIGITAL · BASE DE DADOS MVP</span>
          <h1 style="margin-top:6px">Cartão CEU &amp; Minhas Apresentações</h1>
          <p class="muted">Os seus dados de estudante e apresentações PDF → Slides ficam guardados em IndexedDB e sincronizados com o servidor MVP.</p>
        </div>
        <div class="flex wrap" style="gap:8px">
          <a class="btn btn-p btn-sm" href="#/projetor">✦ Novo slide PDF</a>
          <button type="button" class="btn btn-o btn-sm" onclick="CEUHome.printCard()">🖨 Imprimir Cartão</button>
          <button type="button" class="btn btn-o btn-sm" onclick="if(window.AMAProjector)AMAProjector.exportBackup()">↓ Backup BD (.json)</button>
        </div>
      </div>

      <div class="ceu-card-studio">
        <div class="ceu-id-card" aria-label="Pré-visualização do Cartão CEU">
          <div class="ceu-id-head">
            <img src="assets/ceu-logo.png?v=1" alt="CEU" class="ceu-hero-logo">
            <div>
              <span class="ceu-card-kicker">CARTÃO NACIONAL DE ESTUDANTE · CEU.AO</span>
              <b>CEU Academy</b>
            </div>
            <span class="ceu-id-status">ACTIVO</span>
          </div>
          <div class="ceu-id-body">
            <div class="ceu-id-top">
              <div>
                <h2 id="ceu-id-name">${esc(card.nome)}</h2>
                <p id="ceu-id-uni">${esc(card.universidade)} · ${esc(card.curso)}</p>
              </div>
              ${cardQr ? `<div class="ceu-id-qr" title="Código QR de verificação CEU" data-testid="ceu-card-qr">${cardQr}</div>` : ''}
            </div>
            <div class="ceu-id-meta">
              <div><small>NÚMERO</small><b id="ceu-id-num">${esc(card.numero)}</b></div>
              <div><small>ANO</small><b id="ceu-id-ano">${esc(card.ano)}</b></div>
              <div><small>VALIDADE</small><b>2026 / 2027</b></div>
            </div>
          </div>
          <div class="ceu-id-foot">
            <span>APP FEITO PELA HORIZONTE FUTURO</span>
            <a href="https://ceu.ao/register" target="_blank" rel="noopener noreferrer">Validar em ceu.ao ↗</a>
          </div>
        </div>

        <form class="card ceu-id-form" onsubmit="event.preventDefault();CEUHome.saveCard()">
          <h3 style="margin:0 0 12px">Personalizar e guardar na Base de Dados</h3>
          <div class="field"><label for="cc-nome">Nome completo</label><input id="cc-nome" required value="${esc(card.nome)}"></div>
          <div class="field"><label for="cc-uni">Universidade</label>
            <select id="cc-uni">${unis.map((u) => `<option value="${esc(u)}" ${card.universidade === u ? 'selected' : ''}>${esc(u)}</option>`).join('')}</select>
          </div>
          <div class="st-grid-in">
            <div class="field"><label for="cc-curso">Curso</label><input id="cc-curso" value="${esc(card.curso)}"></div>
            <div class="field"><label for="cc-ano">Ano</label><input id="cc-ano" value="${esc(card.ano)}"></div>
          </div>
          <div class="field"><label for="cc-num">Número de estudante</label><input id="cc-num" value="${esc(card.numero)}"></div>
          <button type="submit" class="btn btn-p" style="width:100%;justify-content:center">Guardar Cartão na Base de Dados</button>
        </form>
      </div>

      <div class="ceu-section-head" style="margin-top:38px">
        <span class="eyebrow-t">BASE DE DADOS LOCAL + API</span>
        <h2>Apresentações guardadas (${decks.length})</h2>
      </div>
      ${decks.length ? `<div class="ceu-features">
        ${decks.slice(0, 8).map((dk) => `<a class="ceu-feature" href="#/projetor" onclick="setTimeout(()=>{if(window.AMAProjector)AMAProjector.openSaved('${esc(dk.id)}')},60)">
          <span class="ceu-feature-ic">${esc((dk.docTypeMeta && dk.docTypeMeta.icon) || '✦')}</span>
          <b>${esc(dk.title)}</b>
          <p>${dk.stats?.slides || (dk.slides || []).length} slides · ${esc(dk.sourceName || 'CEU Academy')}</p>
          <span class="ceu-feature-cta">Abrir no Projetor →</span>
        </a>`).join('')}
      </div>` : `<div class="card" style="padding:22px"><p class="muted" style="margin:0">Ainda não guardou nenhuma apresentação. <a href="#/projetor" style="color:#0066b8;font-weight:700">Crie a primeira com PDF + IA →</a></p></div>`}

      <div class="ceu-mobile-bar" aria-label="Navegação rápida">
        <a href="#/ceu-inicio">Início</a>
        <a href="#/catalogo">Cursos</a>
        <a href="#/projetor" class="primary">Projetor</a>
        <a href="#/cartao-ceu" class="active">Cartão</a>
      </div>
    </section>`;
    return typeof shellPublic === 'function' ? shellPublic(inner, 'cartao') : inner;
  }

  on('/ceu-inicio', ceuHomeView);
  on('/cartao-ceu', ceuCardView);
  on('/app', () => {
    if (location.hash !== '#/projetor') location.hash = '#/projetor';
    return '<div class="spinner"></div>';
  });

  let installEvent = null;
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    installEvent = e;
    const btn = document.getElementById('ceu-install');
    if (btn) btn.hidden = false;
    if (/^#\/ceu-inicio/.test(location.hash) && typeof render === 'function') render();
  });
  window.CEUHome = {
    view: ceuHomeView,
    cardView: ceuCardView,
    courses: CEU_COURSES,
    setCourseFilter(cat) {
      homeCourseFilter = cat || 'Todos';
      if (typeof render === 'function') render();
    },
    setShowcaseTab(tab) {
      homeShowcaseTab = tab || 'turmas';
      if (typeof render === 'function') render();
    },
    saveCard() {
      const card = {
        id: 'card-primary',
        nome: String((document.getElementById('cc-nome') || {}).value || '').trim() || 'Estudante CEU',
        universidade: String((document.getElementById('cc-uni') || {}).value || 'Universidade de Luanda'),
        curso: String((document.getElementById('cc-curso') || {}).value || 'Engenharia Informática').trim(),
        ano: String((document.getElementById('cc-ano') || {}).value || '2.º Ano').trim(),
        numero: String((document.getElementById('cc-num') || {}).value || 'CEU-2026-0412').trim(),
      };
      try { localStorage.setItem(CARD_KEY, JSON.stringify(card)); } catch { }
      if (window.Study && window.Study.MvpDB && typeof window.Study.MvpDB.saveStudentCard === 'function') {
        window.Study.MvpDB.saveStudentCard(card).catch(() => {});
      }
      if (typeof toast === 'function') toast('Cartão CEU guardado na base de dados!');
      if (typeof render === 'function') render();
    },
    printCard() {
      const card = loadLocalCard();
      const verifyUrl = `https://ceu.ao/verify?num=${encodeURIComponent(card.numero)}&uni=${encodeURIComponent(card.universidade)}`;
      const qr = (window.Study && window.Study.QR && typeof window.Study.QR.renderQrSvg === 'function')
        ? window.Study.QR.renderQrSvg(verifyUrl, { size: 120, fg: '#00217e', bg: '#ffffff', label: `QR ${card.numero}` })
        : '';
      const w = window.open('', 'ceu-print-card', 'width=640,height=440');
      if (!w) return typeof toast === 'function' && toast('Permita janelas popup para imprimir o Cartão CEU.');
      w.document.open();
      w.document.write(`<!doctype html><html lang="pt-AO"><head><meta charset="utf-8"><title>Cartão CEU · ${esc(card.nome)}</title>
      <style>
        *{box-sizing:border-box}body{margin:0;min-height:100vh;display:grid;place-items:center;background:#f0f6fc;font-family:system-ui,sans-serif}
        .card{width:460px;padding:26px;border-radius:22px;background:linear-gradient(135deg,#00217e,#0052a8 62%,#00a4dc);color:#fff;box-shadow:0 18px 40px rgba(0,33,126,.35)}
        .top{display:flex;justify-content:space-between;align-items:center;gap:14px}
        .k{font:700 10px monospace;letter-spacing:.12em;color:#8ee4ff}.st{padding:4px 10px;border-radius:999px;background:#b8f36b;color:#0b1c3d;font:800 10px monospace}
        .mid{display:flex;justify-content:space-between;align-items:center;gap:14px;margin:18px 0}
        h1{margin:0 0 4px;font-size:24px}p{margin:0;color:#d6ecff;font-size:13.5px}
        .qr{padding:6px;background:#fff;border-radius:12px;flex:none}
        .meta{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;padding:12px;border-radius:12px;background:rgba(0,18,64,.38)}
        .meta small{display:block;font:700 9px monospace;color:#8ee4ff}.meta b{font:700 12.5px monospace}
        .ft{margin-top:14px;padding-top:10px;border-top:1px solid rgba(255,255,255,.22);font:700 10px monospace;display:flex;justify-content:space-between;color:#cfe4ff}
        @media print{body{background:#fff}.card{box-shadow:none;-webkit-print-color-adjust:exact;print-color-adjust:exact}}
      </style></head><body>
      <div class="card">
        <div class="top"><div><div class="k">CARTÃO NACIONAL DE ESTUDANTE · CEU.AO</div><b>CEU Academy</b></div><span class="st">ACTIVO</span></div>
        <div class="mid"><div><h1>${esc(card.nome)}</h1><p>${esc(card.universidade)} · ${esc(card.curso)}</p></div>${qr ? `<div class="qr">${qr}</div>` : ''}</div>
        <div class="meta"><div><small>NÚMERO</small><b>${esc(card.numero)}</b></div><div><small>ANO</small><b>${esc(card.ano)}</b></div><div><small>VALIDADE</small><b>2026 / 2027</b></div></div>
        <div class="ft"><span>APP FEITO PELA HORIZONTE FUTURO</span><span>ceu.ao</span></div>
      </div>
      <script>setTimeout(()=>window.print(),250);</script></body></html>`);
      w.document.close();
    },
    install() {
      if (!installEvent) return;
      installEvent.prompt();
      installEvent.userChoice.then(() => { installEvent = null; });
    },
  };
})();
