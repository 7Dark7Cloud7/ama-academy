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
      { ic: '✦', t: 'PDF → Slides com IA', d: 'Carregue um PDF, Ata ou sebenta: a IA reorganiza para ensinar, junta imagens da web e modelos 3D.', href: '#/projetor', cta: 'Abrir projetor' },
      { ic: '▤', t: 'Cursos universitários', d: 'Matemática, Física, Tecnologia e Técnicas de Estudo com aulas curtas e progresso guardado.', href: '#/catalogo', cta: 'Explorar cursos' },
      { ic: 'ID', t: 'Cartão de estudante', d: 'Personalize e guarde o seu Cartão CEU digital na base de dados, com acesso às suas apresentações.', href: '#/cartao-ceu', cta: 'Abrir cartão' },
      { ic: '▦', t: 'Turmas & Prática', d: 'Acompanhe materiais de turma, aulas ao vivo e questionários interativos.', href: '#/turmas', cta: 'Abrir turmas' },
    ];
    const inner = `<section class="ceu-landing">
      <div class="ceu-hero">
        <div class="ceu-hero-copy">
          <span class="eyebrow-t">CEU ACADEMY · +10.000 ESTUDANTES EM ANGOLA</span>
          <h1>Estude com clareza.<br><em>Ensine com IA e 3D.</em></h1>
          <p>A plataforma académica ligada ao <b>Cartão Nacional de Estudante Universitário (ceu.ao)</b>: cursos universitários gratuitos e um projetor inteligente que transforma qualquer PDF em slides visuais.</p>
          <div class="ceu-cta">
            <a class="btn btn-p" href="#/projetor">✦ Criar slides com PDF</a>
            <a class="btn btn-o" href="#/catalogo">Ver cursos</a>
          </div>
          <div class="ceu-hero-facts"><span><b>MESCTI</b> Reconhecido</span><span><b>BCI</b> Cartão CEU</span><span><b>IA + 3D</b> Automático</span></div>
        </div>
        <aside class="ceu-hero-card" aria-label="Cartão de estudante CEU Academy">
          <div class="ceu-card-top">
            <img src="assets/ceu-logo.png?v=1" alt="Logótipo CEU" class="ceu-hero-logo">
            <div>
              <span class="ceu-card-kicker">CARTÃO UNIVERSITÁRIO · CEU.AO</span>
              <b>Núcleo CEU · Academy</b>
            </div>
          </div>
          <div class="ceu-card-line"></div>
          <span class="ceu-card-note">Base de dados local + nuvem para guardar apresentações, progresso de cursos e cartão digital em qualquer dispositivo.</span>
          <div class="ceu-card-foot">
            <a href="https://ceu.ao/register" target="_blank" rel="noopener noreferrer">Pedir Cartão CEU ↗</a>
            <small>APP FEITO PELA HORIZONTE FUTURO</small>
          </div>
        </aside>
      </div>

      <div class="ceu-partners" aria-label="Instituições universitárias em Angola">
        <small>COMUNIDADE CEU</small>
        <span>ISPTEC</span><span>UCAN</span><span>Universidade de Luanda</span><span>UMA</span><span>IMETRO</span><span>INSUTEC</span><span>Unibelas</span><span>UGS</span>
      </div>

      <div class="ceu-section-head">
        <span class="eyebrow-t">SALA DIGITAL INTEGRADA</span>
        <h2>Tudo num só espaço académico</h2>
      </div>
      <div class="ceu-features">
        ${features.map((f) => `<a class="ceu-feature" href="${f.href}">
          <span class="ceu-feature-ic">${esc(f.ic)}</span><b>${esc(f.t)}</b><p>${esc(f.d)}</p><span class="ceu-feature-cta">${esc(f.cta)} →</span>
        </a>`).join('')}
      </div>

      <div class="ceu-section-head">
        <span class="eyebrow-t">CURSOS UNIVERSITÁRIOS</span>
        <h2>Matemática, Física e Técnicas de Estudo</h2>
        <p>Aulas práticas com progresso guardado na base de dados e certificado digital no fim.</p>
      </div>
      <div class="ceu-courses">${cursos.map(courseCard).join('')}</div>
      <div class="ceu-all-courses"><a class="btn btn-o" href="#/catalogo">Ver catálogo completo →</a></div>

      <div class="ceu-band">
        <div>
          <span class="eyebrow-t">ECOSSISTEMA CEU · ANGOLA</span>
          <h2>Do PDF à sala de aula em segundos.</h2>
          <p>Carregue qualquer ficheiro ou ata: a IA organiza, adapta para ensinar, ilustra com imagens e 3D coerente e projeta com ponteiro laser automático.</p>
        </div>
        <div class="flex wrap" style="gap:10px">
          <a class="btn btn-p" href="#/projetor">Abrir Projetor →</a>
          <a class="btn btn-o" href="https://ceu.ao/" target="_blank" rel="noopener noreferrer">Visitar ceu.ao ↗</a>
        </div>
      </div>
      <div class="ceu-mobile-bar" aria-label="Navegação rápida">
        <a href="#/ceu-inicio" class="active">Início</a>
        <a href="#/catalogo">Cursos</a>
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
    const inner = `<section class="ceu-landing" style="padding-top:24px">
      <div class="page-h" style="margin-bottom:20px">
        <div>
          <span class="eyebrow-t">CARTÃO DIGITAL · BASE DE DADOS MVP</span>
          <h1 style="margin-top:6px">Cartão CEU &amp; Minhas Apresentações</h1>
          <p class="muted">Os seus dados de estudante e apresentações PDF → Slides ficam guardados em IndexedDB e sincronizados com o servidor MVP.</p>
        </div>
        <div class="flex wrap" style="gap:8px">
          <a class="btn btn-p btn-sm" href="#/projetor">✦ Novo slide PDF</a>
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
            <h2 id="ceu-id-name">${esc(card.nome)}</h2>
            <p id="ceu-id-uni">${esc(card.universidade)} · ${esc(card.curso)}</p>
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
    install() {
      if (!installEvent) return;
      installEvent.prompt();
      installEvent.userChoice.then(() => { installEvent = null; });
    },
  };
})();
