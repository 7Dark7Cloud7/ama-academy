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
      instrutor: 'Prof.ª Sofia Mateus', poster: 'catalog-student', estado: 'PUBLIC',
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
  ];

  function injectCourses() {
    if (!isCeu()) return;
    const data = window.AMA_DATA || (window.AMA_DATA = { cursos: [] });
    data.cursos = Array.isArray(data.cursos) ? data.cursos : [];
    const detail = data.detalhe || (data.detalhe = {});
    CEU_COURSES.forEach((c, ci) => {
      if (!data.cursos.some((x) => x.id === c.id || x.slug === c.slug)) data.cursos.unshift(JSON.parse(JSON.stringify(c)));
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

  function courseCard(c) {
    return `<a class="ceu-course" href="#/curso/${esc(c.id)}">
      <span class="ceu-course-art"><img src="media/${esc(c.poster || 'catalog-student')}.jpg?v=70" alt="" loading="lazy"></span>
      <span class="ceu-course-body">
        <small>${esc(c.categoria)} · ${esc(c.nivel)}</small>
        <b>${esc(c.titulo)}</b>
        <span class="ceu-course-meta">★ ${Number(c.rating || 4.7).toFixed(1).replace('.', ',')} · ${c.aulas || 6} aulas · ${(c.alunos || 0).toLocaleString('pt-PT')} estudantes</span>
        <span class="ceu-course-cta">Abrir curso →</span>
      </span>
    </a>`;
  }

  function ceuHomeView() {
    const logged = !!(window.AMAState && window.AMAState.user);
    const cursos = (window.AMA_DATA && window.AMA_DATA.cursos ? window.AMA_DATA.cursos : [])
      .filter((c) => [101, 102, 103, 104].includes(c.id))
      .slice(0, 4);
    const features = [
      { ic: 'ID', t: 'Cartão de estudante', d: 'O seu cartão digital, sempre à mão, ligado às turmas e aos cursos da CEU Academy.', href: '#/meus-bilhetes', cta: 'Ver cartão' },
      { ic: '▦', t: 'Turmas e aulas', d: 'Entre na sua turma, acompanhe os materiais e participe nas aulas ao vivo.', href: '#/turmas', cta: 'Abrir turmas' },
      { ic: '▤', t: 'Cursos universitários', d: 'Matemática, Física e estudo, organizados do básico ao avançado.', href: '#/catalogo', cta: 'Ver catálogo' },
      { ic: '✦', t: 'PDF → Slides com IA', d: 'Transforme apontamentos em slides claros, com notas, imagens e fontes verificadas.', href: '#/projetor', cta: 'Criar aula' },
    ];
    const inner = `<section class="ceu-landing">
      <div class="ceu-hero">
        <div class="ceu-hero-copy">
          <span class="eyebrow-t">CEU ACADEMY · +10.000 ESTUDANTES UNIVERSITÁRIOS</span>
          <h1>Cursos universitários,<br><em>claros, visuais e 3D.</em></h1>
          <p>Matemática, Física, Tecnologia e técnicas de estudo ligados ao ecossistema do <b>Cartão Nacional de Estudante Universitário (ceu.ao)</b>. Transforme qualquer PDF em slides 16:9 com IA, imagens da web, YouTube e modelos 3D interactivos.</p>
          <div class="ceu-cta">
            <a class="btn btn-p" href="#/projetor">Criar slides com PDF + IA</a>
            <a class="btn btn-o" href="#/catalogo">Ver cursos</a>
            <a class="btn btn-o" href="https://ceu.ao/register" target="_blank" rel="noopener noreferrer">Pedir Cartão CEU ↗</a>
          </div>
          <div class="ceu-hero-facts"><span><b>MESCTI</b> Reconhecido</span><span><b>BCI</b> Cartão CEU</span><span><b>IA + 3D</b> PDF → Slides</span></div>
        </div>
        <aside class="ceu-hero-card" aria-label="Cartão de estudante CEU Academy">
          <img src="assets/ceu-logo.png?v=1" alt="Logótipo CEU" class="ceu-hero-logo">
          <span class="ceu-card-kicker">CARTÃO DE ESTUDANTE UNIVERSITÁRIO · CEU.AO</span>
          <b>CEU Academy</b>
          <small>Comunidade Académica · Angola</small>
          <div class="ceu-card-line"></div>
          <span class="ceu-card-note">A IA funde o seu PDF com Wikipédia, imagens Wikimedia, YouTube e 3D interactivo para ensinar com clareza visual.</span>
        </aside>
      </div>

      <div class="ceu-partners" aria-label="Instituições universitárias em Angola">
        <small>COMUNIDADE CEU EM ANGOLA</small>
        <span>ISPTEC</span><span>UCAN</span><span>Universidade de Luanda</span><span>UMA</span><span>IMETRO</span><span>INSUTEC</span><span>Unibelas</span><span>UGS</span>
      </div>

      <div class="ceu-quickbar" aria-label="Ações rápidas">
        <a href="#/app"><span>▤</span><b>Abrir Webapp</b><small>Projetor, slides e estudo</small></a>
        <a href="#/projetor"><span>✦</span><b>PDF → Slides</b><small>Organizado com IA, com fontes</small></a>
        <a href="#/meus-bilhetes"><span>ID</span><b>Cartão de estudante</b><small>Digital, sempre à mão</small></a>
        <button type="button" id="ceu-install" ${typeof installEvent !== 'undefined' && installEvent ? '' : 'hidden'} onclick="CEUHome.install()"><span>↓</span><b>Instalar app</b><small>Website + webapp no telemóvel</small></button>
      </div>

      <div class="ceu-how">
        <span class="eyebrow-t">COMO FUNCIONA · 3 PASSOS</span>
        <div class="ceu-how-grid">
          <div><b>1. Escolha</b><p>Carregue um PDF, uma imagem ou cole o texto da aula.</p></div>
          <div><b>2. A IA organiza</b><p>Lê, limpa o ruído, condensa as ideias e acrescenta fontes da web com origem.</p></div>
          <div><b>3. Apresente</b><p>Projecte slides 16:9 com notas, mapas, perguntas e imagens.</p></div>
        </div>
      </div>

      <div class="ceu-section-head">
        <span class="eyebrow-t">COMECE PELOS CURSOS INICIAIS</span>
        <h2>Estudo, Matemática e Física</h2>
        <p>Escolha um curso para começar hoje. Todos gratuitos nesta versão, com aulas curtas e exercícios práticos.</p>
      </div>
      <div class="ceu-courses">${cursos.map(courseCard).join('')}</div>
      <div class="ceu-all-courses"><a class="btn btn-o" href="#/catalogo">Ver todos os cursos →</a></div>

      <div class="ceu-section-head">
        <span class="eyebrow-t">A SUA SALA DIGITAL</span>
        <h2>Tudo o que precisa para estudar</h2>
      </div>
      <div class="ceu-features">
        ${features.map((f) => `<a class="ceu-feature" href="${f.href}">
          <span class="ceu-feature-ic">${esc(f.ic)}</span><b>${esc(f.t)}</b><p>${esc(f.d)}</p><span class="ceu-feature-cta">${esc(f.cta)} →</span>
        </a>`).join('')}
      </div>

      <div class="ceu-band">
        <div><span class="eyebrow-t">UMA ACADEMIA, UM ESPAÇO DIGITAL</span>
          <h2>Do ficheiro à sala de aula, sem perder o fio.</h2>
          <p>O conteúdo do seu curso continua a ser a verdade: a IA só organiza, condensa e acrescenta fontes verificáveis.</p></div>
        <a class="btn btn-o" href="https://ceu.ao/" target="_blank" rel="noopener noreferrer">Visitar ceu.ao ↗</a>
      </div>
      <div class="ceu-mobile-bar" aria-label="Navegação rápida">
        <a href="#/ceu-inicio" class="active">Início</a>
        <a href="#/catalogo">Cursos</a>
        <a href="#/app" class="primary">Criar aula</a>
        <a href="#/meus-bilhetes">Cartão</a>
      </div>
    </section>`;
    return typeof shellPublic === 'function' ? shellPublic(inner, 'universidade') : inner;
  }

  on('/ceu-inicio', ceuHomeView);
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
    courses: CEU_COURSES,
    install() {
      if (!installEvent) return;
      installEvent.prompt();
      installEvent.userChoice.then(() => { installEvent = null; });
    },
  };
})();
