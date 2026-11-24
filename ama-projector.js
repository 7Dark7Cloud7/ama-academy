/* AMA — Projetor de Aulas (PDF -> Slides Visuais + Modo Leitura)
   Ferramenta docente do Núcleo AMA: importa um PDF, imagem ou texto de aula,
   organiza automaticamente uma apresentação visual 16:9 com notas do docente,
   temas de projeção, grelha de slides, ecrã inteiro e Modo Leitura configurável. */
(function () {
  'use strict';

  const DECKS_KEY = 'ama-projector-v1';
  const STUDY_KEY = 'ama-study-v1';

  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const escAttr = esc;
  const brandName = () => (document.documentElement.dataset.brand === 'ceu' ? 'CEU Academy' : 'AMA');
  const nucleoName = () => (document.documentElement.dataset.brand === 'ceu' ? 'NÚCLEO CEU' : 'NÚCLEO AMA');

  const SAMPLE_LECTURES = {
    fisica: {
      title: 'Leis de Newton & Dinâmica Aplicada',
      subject: 'fisica',
      sourceName: 'Fisica-Aula04-Dinamica.pdf',
      pageTexts: [
        {
          page: 1,
          text: 'Primeira Lei e Inércia\nInércia é a tendência de qualquer corpo manter o seu estado de repouso ou de movimento retilíneo uniforme enquanto a força resultante for nula. Quanto maior a massa de um objeto, maior é a sua resistência a mudar de velocidade.\nEm automóveis, o cinto de segurança atua como força externa para travar o corpo do passageiro numa paragem brusca.',
        },
        {
          page: 2,
          text: 'Segunda Lei: Força, Massa e Aceleração\nF = m × a relaciona diretamente a força resultante aplicada, a massa do corpo e a aceleração obtida.\nPor exemplo, um veículo de 1000 kg que acelera a 2 m/s² exige uma força resultante de 2000 N.\nDuplicar a massa mantendo a mesma força reduz a aceleração para metade.',
        },
        {
          page: 3,
          text: 'Terceira Lei: Ação e Reação\nA toda força de ação corresponde uma força de reação de igual intensidade, mesma direção e sentido oposto. As duas forças atuam sempre em corpos diferentes, por isso nunca se anulam mutuamente.\nUm foguetão acelera no espaço ao expelir gases para trás e receber o impulso igual para a frente.',
        },
        {
          page: 4,
          text: 'Aplicação Prática em Sala\nPara resolver qualquer exercício de dinâmica, desenhe primeiro o diagrama de forças sobre o corpo. Identifique peso, normal, atrito e tração antes de somar as componentes.\nEm resumo, dominar as três leis permite prever o movimento de sistemas mecânicos reais.',
        },
      ],
    },
    financas: {
      title: 'Juro Composto, Inflação e Planeamento em Kwanzas',
      subject: 'financas',
      sourceName: 'Financas-Unidade02-Kwanzas.pdf',
      pageTexts: [
        {
          page: 1,
          text: 'O Poder do Juro Composto\nJuro composto é o rendimento calculado sobre o capital inicial somado aos juros acumulados nos períodos anteriores. Ao contrário do juro simples, o crescimento acelera em curva exponencial com o tempo.\nComeçar cinco anos mais cedo pesa mais do que tentar compensar com depósitos maiores no final.',
        },
        {
          page: 2,
          text: 'Fórmula de Capitalização\nM = C × (1 + i)^n determina o montante final acumulado após n períodos à taxa i.\nAplicar 100.000 Kz a 12% ao ano rende 12.000 Kz no 1.º ano e 13.440 Kz no 2.º ano porque o rendimento incide sobre 112.000 Kz.\nUse a Regra dos 72 (72 ÷ taxa) para estimar em quantos anos o capital duplica.',
        },
        {
          page: 3,
          text: 'Inflação e Ganho Real\nInflação é a subida generalizada dos preços que reduz o poder de compra do kwanza ao longo do tempo. Só existe ganho real quando o rendimento líquido da aplicação supera a inflação anual.\nDinheiro parado perde valor todos os meses mesmo que o saldo nominal pareça intacto.',
        },
        {
          page: 4,
          text: 'Fundo de Emergência e Diversificação\nFundo de emergência é a reserva líquida equivalente a 3 a 6 meses de despesas fixas do agregado. Deve permanecer acessível e de baixo risco antes de avançar para investimentos de longo prazo.\nSepare sempre os 20% da poupança no dia em que recebe o rendimento.',
        },
      ],
    },
    programacao: {
      title: 'Estruturas de Dados e Pesquisa Binária em Python',
      subject: 'programacao',
      sourceName: 'PROG102-Algoritmos-Slides.pdf',
      pageTexts: [
        {
          page: 1,
          text: 'Pensamento Algorítmico\nAlgoritmo é uma sequência finita e ordenada de passos inequívocos para resolver um problema computacional. Antes de escrever código Python, decomponha o problema em entradas, processamento e saída esperada.\nFunções pequenas e testáveis facilitam a leitura em equipa e evitam repetição de código.',
        },
        {
          page: 2,
          text: 'Pesquisa Linear vs Pesquisa Binária\nA pesquisa binária consiste em dividir repetidamente uma lista ordenada ao meio para localizar um elemento em tempo O(log n).\nNuma pauta ordenada com 1024 estudantes, a pesquisa linear pode exigir 1024 passos, enquanto a pesquisa binária encontra qualquer nome em no máximo 10 comparações.',
        },
        {
          page: 3,
          text: 'Complexidade e Escalabilidade\npassos = log2(n) mostra porque algoritmos logarítmicos continuam instantâneos mesmo com milhões de registos.\nPré-requisito obrigatório: a lista precisa estar ordenada antes de aplicar a divisão binária.\nSempre que uma consulta se repete milhares de vezes, ordenar uma vez compensa o custo inicial.',
        },
      ],
    },
    biologia: {
      title: 'Fotossíntese e Ecossistemas de Angola',
      subject: 'biologia',
      sourceName: 'BIO101-Fotossintese-Maiombe.pdf',
      pageTexts: [
        {
          page: 1,
          text: 'O Motor Solar das Plantas\nFotossíntese é o processo bioquímico pelo qual plantas, algas e cianobactérias convertem luz solar, água e dióxido de carbono em glicose e oxigénio.\nNa Floresta do Maiombe em Cabinda, este mecanismo sustenta uma das maiores reservas de biodiversidade de África Central.',
        },
        {
          page: 2,
          text: 'Equação Global da Fotossíntese\n6 CO2 + 6 H2O + luz → C6H12O6 + 6 O2 resume a transformação da energia luminosa em energia química.\nA clorofila presente nos cloroplastos absorve sobretudo luz azul e vermelha, reflectindo o verde característico das folhas.',
        },
        {
          page: 3,
          text: 'Fase Clara vs Fase Escura\nEnquanto a fase fotoquímica ocorre nos tilacoides e depende directamente da luz solar para gerar ATP e libertar oxigénio, o Ciclo de Calvin ocorre no estroma e fixa o carbono em açúcares.\nSem esta cooperação entre as duas fases, a planta não consegue armazenar energia para crescer.',
        },
      ],
    },
    ata: {
      title: 'Ata n.º 14 — Reunião da Direcção Académica',
      subject: 'geral',
      sourceName: 'Ata-14-Direccao-Academica-Luanda.pdf',
      pageTexts: [
        {
          page: 1,
          text: 'Ata n.º 14 da Reunião Ordinária da Direcção Académica\nAos 18 dias do mês de Novembro de 2026, na Sala de Conferências da Universidade em Luanda, reuniram sob presidência do Prof. Manuel António os seguintes presentes: Ana Silva, Nelson Duarte, Sofia Mateus e Carlos Mendes.\nOrdem de Trabalhos: 1. Expansão das salas digitais com projetores; 2. Lançamento do Cartão de Estudante digital; 3. Calendário de exames do 2.º semestre.',
        },
        {
          page: 2,
          text: 'Deliberações e Decisões Aprovadas\nDeliberou-se por unanimidade aprovar a instalação de 12 projetores interactivos nas salas do bloco B até 10 de Dezembro.\nDecidiu-se aprovar o orçamento de 4.500.000 Kz para formação dos docentes em ferramentas de ensino visual com IA.\nFicou encarregue Ana Silva de coordenar a entrega dos equipamentos e apresentar o relatório de instalação até 5 de Dezembro.\nFicou encarregue Nelson Duarte de preparar o calendário final de exames e enviar às turmas até 28 de Novembro.\nPonto pendente: aguarda confirmação da ligação de fibra óptica no polo de Viana para a próxima reunião agendada para 12 de Dezembro.',
        },
      ],
    },
  };

  let active3DCtrl = null;
  let classTimerId = null;
  let activeSpeechRec = null;
  let tour3DId = null;
  const syncChannel = (typeof BroadcastChannel !== 'undefined') ? new BroadcastChannel('ceu-projector-sync') : null;
  function broadcastPresenterState() {
    if (!syncChannel || !P.deck) return;
    const sl = P.deck.slides[P.slideIdx] || {};
    const nxt = P.deck.slides[P.slideIdx + 1] || null;
    try {
      syncChannel.postMessage({
        type: 'state',
        deckTitle: P.deck.title,
        idx: P.slideIdx,
        total: P.deck.slides.length,
        title: sl.title || '',
        kicker: sl.kicker || '',
        notes: sl.notes || sl.narration || sl.subtitle || 'Sem notas para este slide.',
        nextTitle: nxt ? nxt.title : 'Fim da apresentação',
        nextSub: nxt ? (nxt.subtitle || (nxt.bullets && nxt.bullets[0]) || '') : '',
        blackout: !!P.blackout,
        narrating: !!P.narrating,
      });
    } catch { }
  }
  if (syncChannel) {
    syncChannel.onmessage = (ev) => {
      const msg = ev && ev.data;
      if (!msg || !msg.cmd || !window.AMAProjector) return;
      if (msg.cmd === 'next') window.AMAProjector.step(1);
      else if (msg.cmd === 'prev') window.AMAProjector.step(-1);
      else if (msg.cmd === 'blackout') window.AMAProjector.toggleBlackout();
      else if (msg.cmd === 'pulse') window.AMAProjector.togglePulse();
      else if (msg.cmd === 'narrate') window.AMAProjector.toggleNarrate();
      else if (msg.cmd === 'sync') broadcastPresenterState();
    };
  }
  function destroyActive3D() {
    if (tour3DId) { clearInterval(tour3DId); tour3DId = null; }
    if (active3DCtrl && typeof active3DCtrl.destroy === 'function') {
      try { active3DCtrl.destroy(); } catch { }
    }
    active3DCtrl = null;
  }

  const P = {
    deck: null,
    outline: null,
    slideIdx: 0,
    mode: 'slides', // 'slides' | 'reading' | 'grid'
    theme: document.documentElement.dataset.brand === 'ceu' ? 'ceu' : 'editorial', // 'editorial' | 'dark' | 'pine' | 'ceu'
    slideScale: 100, // 85..125
    timerSec: 60,
    timerRunning: false,
    showNotes: false,
    showPlan: false,
    moreOpen: false,
    fullscreen: false,
    readTheme: 'paper', // 'paper' | 'sepia' | 'night'
    readScale: 100, // 85..135
    readLine: 'comfort', // 'compact' | 'comfort' | 'wide'
    showCreator: true,
    webBusy: false,
    webStatus: '',
    aiBusy: false,
    aiStatus: '',
    uploadStatus: '',
    pendingPages: null,
    pendingSource: '',
    pdfFile: null,
    pdfMeta: null,
    pageStart: 1,
    pageEnd: 15,
    isScanned: false,
    eduLevel: 'universitario', // secundario | universitario | profissional
    eduLang: 'auto', // auto | pt | en
    density: 'completo', // essencial | completo | detalhado
    docType: 'auto', // auto | ata | relatorio | regulamento | cientifico | plano | aula
    extraLinks: '',
    selected3DNode: 0,
    explode3D: 0,
    activeFormulaVar: 0,
    laserOn: true, // Automático: ponteiro laser suave ao passar o rato sobre o slide
    drawOn: false,
    drawColor: '#ff6b57',
    drawings: {}, // slideId -> Array<{ color, points: Array<[nx, ny]> }>
    blackout: false,
    revealMode: false,
    revealStep: 99,
    editingSlide: false,
    level: 'auto', // auto | basico | intermediario | avancado
    source: null,  // parâmetros originais, para reconstruir ao mudar o nível
    brief: '', // Descrição por áudio ou texto de como os slides e imagens devem sair
    voiceListening: false,
    voiceTarget: 'brief',
    narrating: false,
    pulseOpen: false,
    pulseVotes: { ok: 0, mid: 0, rev: 0 },
    creatorTab: 'direct', // 'direct' | 'chatgpt'
    tour3DRunning: false,
    imgGallery: [],
    imgGalleryBusy: false,
    transition: (() => { try { return localStorage.getItem('ceu-pj-trans') || 'slide'; } catch { return 'slide'; } })(),
    shareModalUrl: '',
    showShortcuts: false,
  };

  function getSlideRevealTotal(slide) {
    if (!slide) return 0;
    if (Array.isArray(slide.steps) && slide.steps.length) return slide.steps.length;
    if (Array.isArray(slide.bullets) && slide.bullets.length) return slide.bullets.length;
    return 0;
  }

  function mountProjectionOverlays(slide) {
    setTimeout(() => {
      const slideEl = document.querySelector('.pj-slide');
      if (!slideEl || !slide) return;

      // 1. Progressive 1-by-1 reveal
      const items = slideEl.querySelectorAll('.pj-bullets > li, .pj-timeline-list > li, .pj-formula-steps ol > li, .pj-objectives > li, .pj-agenda-grid > li');
      items.forEach((el, idx) => {
        const hidden = P.revealMode && idx >= P.revealStep;
        el.classList.toggle('pj-rev-hidden', hidden);
        el.classList.toggle('pj-rev-focus', P.revealMode && idx === P.revealStep - 1);
      });

      // 2. Ponteiro laser automático (activo por omissão ao sobrevoar o slide, desliga ao desenhar ou em 3D)
      const laserDot = slideEl.querySelector('.pj-laser-dot');
      if (laserDot && P.laserOn && !P.drawOn && slide.layout !== 'scene-3d') {
        slideEl.onpointermove = (ev) => {
          if (ev.target && ev.target.closest && ev.target.closest('button, a, input, select, iframe, canvas.pj-mini-3d-canvas')) {
            laserDot.style.opacity = '0';
            return;
          }
          const rect = slideEl.getBoundingClientRect();
          const x = ev.clientX - rect.left;
          const y = ev.clientY - rect.top;
          laserDot.style.opacity = '1';
          laserDot.style.transform = `translate(${x}px, ${y}px)`;
        };
        slideEl.onpointerleave = () => { laserDot.style.opacity = '0'; };
      }

      // 3. Whiteboard chalk annotation canvas
      const canvas = slideEl.querySelector('.pj-draw-canvas');
      if (canvas) {
        const rect = slideEl.getBoundingClientRect();
        const w = Math.max(300, Math.round(rect.width));
        const h = Math.max(180, Math.round(rect.height));
        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        canvas.width = Math.round(w * dpr);
        canvas.height = Math.round(h * dpr);
        const ctx = canvas.getContext('2d');
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';

        const sid = slide.id || `s-${P.slideIdx}`;
        const strokes = P.drawings[sid] || [];
        const redraw = () => {
          ctx.clearRect(0, 0, w, h);
          for (const st of strokes) {
            if (!st.points || st.points.length < 2) continue;
            ctx.beginPath();
            ctx.strokeStyle = st.color || '#ff6b57';
            ctx.lineWidth = 3.5;
            ctx.moveTo(st.points[0][0] * w, st.points[0][1] * h);
            for (let i = 1; i < st.points.length; i += 1) {
              ctx.lineTo(st.points[i][0] * w, st.points[i][1] * h);
            }
            ctx.stroke();
          }
        };
        redraw();

        if (P.drawOn) {
          let activeStroke = null;
          canvas.onpointerdown = (ev) => {
            ev.preventDefault();
            canvas.setPointerCapture?.(ev.pointerId);
            const r = canvas.getBoundingClientRect();
            const nx = (ev.clientX - r.left) / Math.max(1, r.width);
            const ny = (ev.clientY - r.top) / Math.max(1, r.height);
            activeStroke = { color: P.drawColor, points: [[nx, ny]] };
            strokes.push(activeStroke);
            P.drawings[sid] = strokes;
          };
          canvas.onpointermove = (ev) => {
            if (!activeStroke) return;
            const r = canvas.getBoundingClientRect();
            const nx = (ev.clientX - r.left) / Math.max(1, r.width);
            const ny = (ev.clientY - r.top) / Math.max(1, r.height);
            activeStroke.points.push([nx, ny]);
            redraw();
          };
          const endDraw = () => { activeStroke = null; };
          canvas.onpointerup = endDraw;
          canvas.onpointercancel = endDraw;
        }
      }

      // 4. Touch swipe navigation on mobile/tablet when not drawing or orbiting 3D
      if (!P.drawOn && slide.layout !== 'scene-3d') {
        let sx = 0, sy = 0;
        slideEl.ontouchstart = (ev) => {
          if (ev.touches && ev.touches[0]) { sx = ev.touches[0].clientX; sy = ev.touches[0].clientY; }
        };
        slideEl.ontouchend = (ev) => {
          if (!ev.changedTouches || !ev.changedTouches[0]) return;
          const dx = ev.changedTouches[0].clientX - sx;
          const dy = ev.changedTouches[0].clientY - sy;
          if (Math.abs(dx) > 54 && Math.abs(dx) > Math.abs(dy) * 1.4) {
            AMAProjector.step(dx < 0 ? 1 : -1);
          }
        };
      }
    }, 25);
  }

  function S_() {
    return window.Study || null;
  }

  /* Guarda os parâmetros originais para poder reconstruir o deck quando o
     docente muda o nível ou o tipo de documento — sem perder o PDF extraído. */
  function buildDeck(params) {
    P.source = { ...params };
    const eng = S_();
    if (!eng || !eng.buildProjectorDeck) return null;
    const rawText = String(params.text || (Array.isArray(params.pageTexts) ? params.pageTexts.map((p) => p.text).join('\n\n') : '')).trim();
    const author = params.author || ((typeof S !== 'undefined' && S.user && S.user.nome) || `Docente ${brandName()}`);

    // 1. Análise inteligente do tipo de documento (Ata, Relatório, Regulamento, Científico, Plano vs Aula)
    let deck = null;
    if (eng.DocAnalyzer && typeof eng.DocAnalyzer.buildAdaptiveDocumentDeck === 'function') {
      try {
        deck = eng.DocAnalyzer.buildAdaptiveDocumentDeck(rawText, {
          title: params.title,
          sourceName: params.sourceName,
          forcedType: params.docType || P.docType || 'auto',
          author,
          theme: P.theme,
          language: P.eduLang === 'en' ? 'en' : 'pt',
        });
      } catch { deck = null; }
    }

    // 2. Se for aula académica ('aula'), usa o motor didáctico Ingenium 3.0 completo
    if (!deck) {
      deck = eng.buildProjectorDeck({
        ...params,
        theme: P.theme,
        level: P.level,
        author,
      });
      if (deck && deck.ok && eng.DocAnalyzer && typeof eng.DocAnalyzer.analyzeDocument === 'function') {
        try {
          const da = eng.DocAnalyzer.analyzeDocument(rawText, { title: params.title, sourceName: params.sourceName, forcedType: 'aula' });
          deck.docType = 'aula';
          deck.docTypeMeta = da.meta;
          deck.docAnalysis = da;
        } catch { }
      }
    }

    if (deck && deck.ok) {
      if (document.documentElement.dataset.brand === 'ceu') {
        deck.brand = 'Núcleo CEU';
        deck.credit = 'APP FEITO PELA HORIZONTE FUTURO';
      }
      // Síntese pedagógica automática + 3D coerente (para aulas transforma & expande; para atas/normas define 3D executivo)
      if (window.Study && window.Study.AI) {
        try {
          if (deck.docType === 'aula' && typeof window.Study.AI.synthesizeAndFuseDeck === 'function') {
            window.Study.AI.synthesizeAndFuseDeck(deck, deck.web || null);
          } else {
            if (typeof window.Study.AI.pickCoherent3DMode === 'function') {
              const m3d = window.Study.AI.pickCoherent3DMode(deck.subject, deck.docType, deck.title);
              (deck.slides || []).forEach((s) => { s.mode3d = s.mode3d || m3d; });
            }
            if (typeof window.Study.AI.autoSelfAnalyzeAndHeal === 'function') {
              window.Study.AI.autoSelfAnalyzeAndHeal(deck);
            }
          }
        } catch { }
      }
      // Auto-otimização silenciosa para qualidade 100/100 (sem precisar de botão extra)
      if (window.Study && window.Study.Quality) {
        try {
          if (deck.docType === 'aula') {
            if (typeof window.Study.Quality.optimizeTo100 === 'function') {
              window.Study.Quality.optimizeTo100(deck, { enforceCeuBrand: document.documentElement.dataset.brand === 'ceu' });
            } else {
              window.Study.Quality.improveDeck(deck);
            }
          } else if (typeof window.Study.Quality.evaluateRubric === 'function') {
            const rb = window.Study.Quality.evaluateRubric(deck, { enforceCeuBrand: document.documentElement.dataset.brand === 'ceu' });
            deck.rubricScore = rb.qualityScore;
            deck.rubric = rb.rubric;
          }
        } catch { }
      }
    }
    return deck;
  }

  function loadDecks() {
    try {
      const list = JSON.parse(localStorage.getItem(DECKS_KEY) || '[]');
      return Array.isArray(list) ? list : [];
    } catch { return []; }
  }

  function saveDeck(deck) {
    try {
      const list = loadDecks().filter((d) => d.id !== deck.id);
      list.unshift(deck);
      localStorage.setItem(DECKS_KEY, JSON.stringify(list.slice(0, 12)));
    } catch { }
    try {
      if (window.Study && window.Study.MvpDB && typeof window.Study.MvpDB.saveDeckRecord === 'function') {
        window.Study.MvpDB.saveDeckRecord(deck).catch(() => {});
      }
    } catch { }
  }

  function deleteSavedDeck(id) {
    try {
      const list = loadDecks().filter((d) => d.id !== id);
      localStorage.setItem(DECKS_KEY, JSON.stringify(list));
    } catch { }
    try {
      if (window.Study && window.Study.MvpDB && typeof window.Study.MvpDB.deleteDeckRecord === 'function') {
        window.Study.MvpDB.deleteDeckRecord(id).catch(() => {});
      }
    } catch { }
  }

  /* ------------------------------------------------------------------ */
  /* Fusão Web + Wikipédia + Wikimedia Commons + YouTube + 3D           */
  /* Tudo entra EMBUTIDO directamente nos slides por omissão!           */
  /* ------------------------------------------------------------------ */
  const webImageUrl = (item) => {
    const img = item && item.image;
    if (typeof img === 'string') return img;
    return img && img.url ? String(img.url) : '';
  };

  async function enrichDeckWithWeb(deck, force = false) {
    const web = (window.Study && window.Study.SlideStudioWeb) || null;
    const ai = (window.Study && window.Study.AI) || null;
    if (!deck || !web || typeof web.enrichFromWeb !== 'function') return null;
    const parsedBrief = (ai && typeof ai.parseCreativeBrief === 'function' && P.brief)
      ? ai.parseCreativeBrief(P.brief)
      : null;
    if (parsedBrief && parsedBrief.themeHint) P.theme = parsedBrief.themeHint;
    if (!force && deck.docType === 'ata' && !(parsedBrief && parsedBrief.imageQueries && parsedBrief.imageQueries.length)) {
      P.webStatus = 'Ata analisada localmente · decisões, responsáveis e prazos preservados.';
      if (P.deck && P.deck.id === deck.id) render();
      return null;
    }
    if (!force && deck.web && deck.web.items && deck.web.items.length) return deck.web;
    P.webBusy = true;
    P.webStatus = parsedBrief && parsedBrief.imageQueries.length
      ? `A procurar imagens coerentes (${parsedBrief.imageQueries.slice(0, 3).join(', ')}) e contexto web…`
      : 'A pesquisar imagens coerentes, Wikipédia e vídeos para fundir nos slides…';
    render();
    let res = null;
    try {
      const fullText = (deck.reading && deck.reading.fullText) || '';
      const links = typeof web.collectLinks === 'function' ? web.collectLinks(P.extraLinks || '', fullText) : [];
      res = await web.enrichFromWeb({
        title: deck.title,
        keyTerms: (deck.stats && deck.stats.keywords) || [],
        centralIdea: (deck.reading && deck.reading.centralIdea) || '',
      }, {
        sourceText: fullText,
        sections: (deck.reading && deck.reading.sections) || [],
        links,
        brief: parsedBrief,
        maxItems: 8,
      });
    } catch {
      res = null;
    }
    P.webBusy = false;
    if (!res || !res.ok) {
      P.webStatus = 'Sem ligação: aula sintetizada localmente com modelos 3D coerentes.';
      if (P.deck && P.deck.id === deck.id) render();
      return null;
    }
    deck.web = {
      items: res.items || [],
      images: res.images || [],
      places: res.places || [],
      videos: res.videos || [],
      searchVideos: res.searchVideos || [],
      note: res.note || '',
      checkedAt: new Date().toISOString(),
    };
    // FUNDIR directamente em TODOS os slides (texto + imagens coerentes + vídeos + 3D)
    if (ai && typeof ai.synthesizeAndFuseDeck === 'function') {
      ai.synthesizeAndFuseDeck(deck, deck.web, parsedBrief);
    }
    if (window.Study && window.Study.Quality && deck.docType === 'aula') {
      try { window.Study.Quality.improveDeck(deck); } catch { }
    }
    const syn = deck.synthesis || {};
    P.webStatus = `Fusão concluída: ${syn.imagesEmbedded || 0} imagem(ns) coerente(s) e 3D activos.`;
    saveDeck(deck);
    if (P.deck && P.deck.id === deck.id) render();
    return deck.web;
  }

  /* IA real (Chrome Prompt API / Gemini API) recebendo PDF + Web + Descrição do docente juntos! */
  async function improveDeckWithAI(deck, manual = false) {
    const ai = (window.Study && window.Study.AI) || null;
    if (!ai || !deck || !deck.plan || P.aiBusy) return null;
    if (!manual && deck.ai && ['chrome-language-model', 'gemini-api'].includes(deck.ai.engine)) return null;
    P.aiBusy = true;
    P.aiStatus = 'A IA está a adaptar os slides à sua descrição e ao contexto web…';
    render();
    try {
      const info = await ai.aiStatus();
      if (!info.available) throw new Error(info.chromeState || 'indisponível');
      const result = await ai.improvePlan(deck.plan, {
        title: deck.title,
        subject: deck.subject,
        docType: deck.docType || 'aula',
        docTone: (deck.docTypeMeta && deck.docTypeMeta.tone) || '',
        coreMessage: (deck.docAnalysis && deck.docAnalysis.extracted && deck.docAnalysis.extracted.coreMessage) || '',
        creativeBrief: P.brief || '',
        web: deck.web || null,
        onProgress: (msg) => { P.aiStatus = msg; render(); },
      });
      const applied = ai.applyImprovement(deck, result);
      const parsedBrief = typeof ai.parseCreativeBrief === 'function' && P.brief ? ai.parseCreativeBrief(P.brief) : null;
      if (typeof ai.synthesizeAndFuseDeck === 'function') {
        ai.synthesizeAndFuseDeck(deck, deck.web || null, parsedBrief);
      }
      const engineLabel = result.engine === 'gemini-api' ? 'Gemini AI' : 'IA do Chrome';
      P.aiStatus = applied
        ? `${engineLabel} activa · ${result.blocks.length} bloco(s) adaptados.`
        : `${engineLabel} activa · síntese visual aplicada.`;
      if (applied) saveDeck(deck);
    } catch (err) {
      P.aiStatus = 'Síntese Pedagógica Local + 3D activos.';
    }
    P.aiBusy = false;
    if (P.deck && P.deck.id === deck.id) render();
    return null;
  }

  function mountActive3DScene(slide, deck) {
    destroyActive3D();
    if (!slide) return;
    setTimeout(() => {
      const eng = S_();
      if (!eng || typeof eng.mountNucleo3D !== 'function') return;
      const isFull3D = slide.layout === 'scene-3d';
      const canvas = document.querySelector(isFull3D ? '.pj-3d-canvas' : '.pj-mini-3d-canvas');
      if (!canvas) return;
      const mode3d = slide.mode3d || (eng.AI && typeof eng.AI.pickCoherent3DMode === 'function'
        ? eng.AI.pickCoherent3DMode(deck?.subject, deck?.docType, `${deck?.title || ''} ${slide.title || ''}`)
        : 'core');
      const nodes = Array.isArray(slide.nodes3d) && slide.nodes3d.length
        ? slide.nodes3d
        : (Array.isArray(slide.bullets) ? slide.bullets.slice(0, 3).map((b, i) => ({
            label: String(b).split(/[:→]/)[0].trim().slice(0, 18),
            short: String(i + 1).padStart(2, '0'),
            note: String(b),
          })) : []);
      active3DCtrl = eng.mountNucleo3D(canvas, {
        initialMode: mode3d,
        mini: !isFull3D,
        sceneSpec: slide.sceneSpec || null,
        customNodes: nodes.map((n, i) => ({ id: `n-${i}`, label: n.label, short: n.short || String(i + 1), note: n.note })),
        brand: document.documentElement.dataset.brand === 'ceu' ? 'ceu' : 'ama',
        onSelectNode: isFull3D ? (id) => {
          const idx = Number(String(id || '').replace('n-', '')) || 0;
          P.selected3DNode = idx;
          const card = document.getElementById('pj-3d-inspector');
          const picked = nodes[idx];
          if (card && picked) {
            card.innerHTML = `<span class="pj-3d-tag">CONCEITO ${String(idx + 1).padStart(2, '0')} · 3D</span><strong>${esc(picked.label)}</strong><p>${esc(picked.note)}</p>`;
          }
          document.querySelectorAll('.pj-3d-pill').forEach((b, i) => b.classList.toggle('on', i === idx));
        } : null,
      });
      if (isFull3D && active3DCtrl && P.explode3D) active3DCtrl.setExplode(P.explode3D);
    }, 30);
  }

  function loadNotebooks() {
    try {
      const raw = JSON.parse(localStorage.getItem(STUDY_KEY) || '{}');
      return Array.isArray(raw.recs) ? raw.recs : [];
    } catch { return []; }
  }

  function waitForStudy(cb) {
    if (S_() && S_().buildProjectorDeck) return cb();
    const onReady = () => {
      window.removeEventListener('study-ready', onReady);
      cb();
    };
    window.addEventListener('study-ready', onReady);
  }

  /* ------------------------------------------------------------------ */
  /* Renderização do Slide Visual 16:9 (Ingenium 3.0 + 3D + Web Fusion) */
  /* ------------------------------------------------------------------ */
  function chipHtml(slide) {
    const chips = Array.isArray(slide.chips) ? slide.chips.filter(Boolean).slice(0, 3) : [];
    const webSrc = (Array.isArray(slide.sources) ? slide.sources : []).find((s) => s.url);
    if (!chips.length && !webSrc) return '';
    return `<div class="pj-chips" aria-label="Termos-chave">
      ${chips.map((c) => `<span>${esc(c)}</span>`).join('')}
      ${webSrc ? `<a class="pj-src-chip pj-src-web" href="${escAttr(webSrc.url)}" target="_blank" rel="noopener noreferrer">${esc(webSrc.label)} ↗</a>` : ''}
    </div>`;
  }

  /* Destaca o gancho em negrito ("Termo: explicação" ou "Termo → explicação") */
  function formatRichBullet(text) {
    const s = String(text || '');
    const m = s.match(/^([^:→]{2,38})([:→])\s+(.+)$/);
    if (m) return `<strong>${esc(m[1])}${m[2] === '→' ? ' →' : ':'}</strong> ${esc(m[3])}`;
    return esc(s);
  }

  /* Bloco "Intuição" + "Fusão Web" integrado dentro do próprio slide */
  function renderFusedContext(slide) {
    const parts = [];
    if (slide.intuition && !['cover', 'agenda', 'objectives', 'closing', 'quiz', 'scene-3d', 'map-spotlight'].includes(slide.layout)) {
      parts.push(`<div class="pj-intuition-box"><span class="pj-int-tag">✦ INTUIÇÃO SIMPLES</span><p>${esc(slide.intuition)}</p></div>`);
    }
    if (slide.fusedInsight && slide.fusedInsight.text) {
      parts.push(`<div class="pj-fused-card">
        <div class="pj-fused-h"><span>🌐 INTEGRADO DA WEB · ${esc(slide.fusedInsight.source || 'Wikipédia')}</span>
          ${slide.fusedInsight.url ? `<a href="${escAttr(slide.fusedInsight.url)}" target="_blank" rel="noopener noreferrer">${esc(slide.fusedInsight.heading || 'Ver fonte')} ↗</a>` : ''}
        </div>
        <p>${esc(slide.fusedInsight.text)}</p>
      </div>`);
    }
    if (slide.embeddedVideo) {
      const v = slide.embeddedVideo;
      if (v.embed) {
        parts.push(`<details class="pj-inline-video">
          <summary>
            ${v.image && v.image.url ? `<img src="${escAttr(v.image.url)}" alt="" loading="lazy">` : '<span class="pj-vid-ic">▶</span>'}
            <div><small>${esc(v.source || 'YouTube')} · Vídeo integrado</small><b>${esc(v.title)}</b></div>
            <span class="pj-vid-btn">Ver vídeo ▶</span>
          </summary>
          <div class="pj-vid-frame"><iframe src="${escAttr(v.embed)}" title="${escAttr(v.title)}" loading="lazy" allow="accelerometer;autoplay;clipboard-write;encrypted-media;picture-in-picture" allowfullscreen referrerpolicy="no-referrer-when-downgrade"></iframe></div>
          <a class="pj-web-link" href="${escAttr(v.url)}" target="_blank" rel="noopener noreferrer">Abrir no YouTube ↗</a>
        </details>`);
      } else if (v.url) {
        parts.push(`<a class="pj-inline-video-link" href="${escAttr(v.url)}" target="_blank" rel="noopener noreferrer">
          <span class="pj-vid-ic">▶</span>
          <div><small>${esc(v.source || 'YouTube')}</small><b>${esc(v.title)}</b></div>
          <span>Explorar ↗</span>
        </a>`);
      }
    }
    return parts.length ? `<div class="pj-fused-stack">${parts.join('')}</div>` : '';
  }

  /* Diagrama SVG animado estilo Ingenium 3.0 para slides sem foto da net */
  function renderIngeniumSvg(slide, deck) {
    const subj = (deck && deck.subject) || 'geral';
    if (subj === 'fisica') {
      return `<svg class="pj-ig-svg" viewBox="0 0 320 200" aria-hidden="true">
        <defs><linearGradient id="igG1" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="currentColor" stop-opacity=".22"/><stop offset="100%" stop-color="currentColor" stop-opacity=".03"/></linearGradient></defs>
        <rect x="14" y="14" width="292" height="172" rx="18" fill="url(#igG1)" stroke="currentColor" stroke-opacity=".2"/>
        <line x1="36" y1="150" x2="284" y2="150" stroke="currentColor" stroke-opacity=".35" stroke-width="2"/>
        <rect class="ig-pulse" x="96" y="88" width="76" height="62" rx="12" fill="var(--ig-accent,#00a4dc)" fill-opacity=".22" stroke="var(--ig-accent,#00a4dc)" stroke-width="2.5"/>
        <text x="134" y="124" text-anchor="middle" font-weight="800" font-size="16" fill="currentColor">m</text>
        <path class="ig-draw" d="M174 119 L254 119 M242 109 L256 119 L242 129" fill="none" stroke="var(--ig-coral,#f17868)" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"/>
        <text x="220" y="102" text-anchor="middle" font-weight="800" font-size="14" fill="var(--ig-coral,#f17868)">F = m·a</text>
        <path class="ig-draw" d="M134 86 L134 40 M125 50 L134 38 L143 50" fill="none" stroke="var(--ig-accent,#00a4dc)" stroke-width="2.5" stroke-linecap="round"/>
        <text x="150" y="52" font-size="12" font-weight="700" fill="currentColor" opacity=".75">N</text>
      </svg>`;
    }
    if (subj === 'financas' || subj === 'matematica') {
      return `<svg class="pj-ig-svg" viewBox="0 0 320 200" aria-hidden="true">
        <rect x="14" y="14" width="292" height="172" rx="18" fill="currentColor" fill-opacity=".04" stroke="currentColor" stroke-opacity=".18"/>
        <line x1="42" y1="158" x2="284" y2="158" stroke="currentColor" stroke-opacity=".35" stroke-width="2"/>
        <line x1="42" y1="36" x2="42" y2="158" stroke="currentColor" stroke-opacity=".35" stroke-width="2"/>
        <path class="ig-draw" d="M46 150 Q130 144 185 110 T276 42" fill="none" stroke="var(--ig-accent,#00a4dc)" stroke-width="4" stroke-linecap="round"/>
        <circle class="ig-pulse" cx="276" cy="42" r="7" fill="var(--ig-coral,#f17868)"/>
        <circle cx="185" cy="110" r="5" fill="var(--ig-accent,#00a4dc)"/>
        <circle cx="114" cy="138" r="4.5" fill="var(--ig-accent,#00a4dc)"/>
        <text x="234" y="34" font-size="11" font-weight="800" fill="var(--ig-coral,#f17868)">crescimento ↗</text>
      </svg>`;
    }
    return `<svg class="pj-ig-svg" viewBox="0 0 320 200" aria-hidden="true">
      <rect x="14" y="14" width="292" height="172" rx="18" fill="currentColor" fill-opacity=".04" stroke="currentColor" stroke-opacity=".18"/>
      <path class="ig-draw" d="M68 100 C115 48, 205 48, 252 100" fill="none" stroke="var(--ig-accent,#00a4dc)" stroke-width="2.5" stroke-dasharray="6 4"/>
      <path class="ig-draw" d="M68 100 C115 152, 205 152, 252 100" fill="none" stroke="var(--ig-coral,#f17868)" stroke-width="2.5"/>
      <circle class="ig-pulse" cx="68" cy="100" r="24" fill="var(--ig-accent,#00a4dc)" fill-opacity=".22" stroke="var(--ig-accent,#00a4dc)" stroke-width="2.5"/>
      <circle cx="160" cy="100" r="28" fill="var(--ig-accent,#00a4dc)" fill-opacity=".35" stroke="currentColor" stroke-width="2"/>
      <circle cx="252" cy="100" r="24" fill="var(--ig-coral,#f17868)" fill-opacity=".22" stroke="var(--ig-coral,#f17868)" stroke-width="2.5"/>
      <text x="68" y="104" text-anchor="middle" font-size="11" font-weight="800" fill="currentColor">PDF</text>
      <text x="160" y="104" text-anchor="middle" font-size="11" font-weight="800" fill="currentColor">IA+WEB</text>
      <text x="252" y="104" text-anchor="middle" font-size="11" font-weight="800" fill="currentColor">AULA</text>
    </svg>`;
  }

  function renderSlideContent(slide, deck, index, total) {
    const numStr = `${String(index + 1).padStart(2, '0')} / ${String(total).padStart(2, '0')}`;
    const pct = Math.round(((index + 1) / Math.max(1, total)) * 100);
    let inner = '';

    if (slide.layout === 'cover') {
      const heroSrc = (slide.webHero && slide.webHero.url) || slide.visual;
      const heroCredit = slide.webHero ? slide.webHero.credit : 'Ilustração 3D da aula';
      inner = `<div class="pj-layout-cover">
        <div class="pj-cover-copy">
          <span class="pj-kicker">${esc(slide.kicker)}</span>
          <h2>${esc(slide.title)}</h2>
          ${slide.subtitle ? `<p class="pj-sub">${esc(slide.subtitle)}</p>` : ''}
          <div class="pj-cover-meta">
            <span><b>${deck.stats.slides}</b> slides</span><i>·</i>
            <span><b>~${deck.stats.estMinutes} min</b> estimados</span><i>·</i>
            <span><b>${deck.stats.pages}</b> bloco${deck.stats.pages === 1 ? '' : 's'}</span>
            ${deck.synthesis && deck.synthesis.fusedSlides ? `<i>·</i><span class="pj-meta-ai">✦ PDF + Web + 3D</span>` : ''}
            ${slide.meta && slide.meta.author ? `<i>·</i><span>${esc(slide.meta.author)}</span>` : ''}
          </div>
        </div>
        ${heroSrc ? `<figure class="pj-cover-art"><img src="${escAttr(heroSrc)}" alt="${escAttr(heroCredit)}" referrerpolicy="no-referrer">${slide.webHero ? `<figcaption>${esc(heroCredit)}</figcaption>` : ''}</figure>` : ''}
      </div>`;
    } else if (slide.layout === 'scene-3d') {
      const nodes = Array.isArray(slide.nodes3d) ? slide.nodes3d : [];
      const curIdx = Math.min(Math.max(0, P.selected3DNode || 0), Math.max(0, nodes.length - 1));
      const cur = nodes[curIdx] || { label: deck.title, note: slide.subtitle || '' };
      inner = `<div class="pj-layout-3d">
        <div class="pj-3d-head">
          <span class="pj-kicker">${esc(slide.kicker)}</span>
          <h2>${esc(slide.title)}</h2>
        </div>
        <div class="pj-3d-grid">
          <div class="pj-3d-stage-box">
            <canvas class="pj-3d-canvas" aria-label="Modelo 3D interactivo de ${escAttr(deck.title)}"></canvas>
            <div class="pj-3d-controls">
              <button type="button" class="pj-3d-hi" onclick="AMAProjector.toggle3DTour()">${P.tour3DRunning ? '⏹ Parar Guia' : '▶ Explicar 3D'}</button>
              <button type="button" onclick="AMAProjector.set3DMode('flow')">Fluxo</button>
              <button type="button" onclick="AMAProjector.set3DMode('layers')">Camadas</button>
              <button type="button" onclick="AMAProjector.set3DMode('network')">Rede</button>
              <button type="button" onclick="AMAProjector.set3DMode('physics')">Física</button>
              <button type="button" onclick="AMAProjector.set3DMode('finance')">Barras</button>
              <button type="button" onclick="AMAProjector.set3DMode('bio')">Hélice</button>
              <button type="button" onclick="AMAProjector.toggle3DExplode()">${P.explode3D ? 'Juntar' : 'Explodir'}</button>
            </div>
          </div>
          <div class="pj-3d-side">
            <div class="pj-3d-inspector" id="pj-3d-inspector">
              <span class="pj-3d-tag">CONCEITO ${String(curIdx + 1).padStart(2, '0')} · 3D</span>
              <strong>${esc(cur.label)}</strong>
              <p>${esc(cur.note)}</p>
            </div>
            <div class="pj-3d-pills">
              ${nodes.map((n, i) => `<button type="button" class="pj-3d-pill ${i === curIdx ? 'on' : ''}" onclick="AMAProjector.select3DNode(${i})"><span>${String(i + 1).padStart(2, '0')}</span>${esc(n.label)}</button>`).join('')}
            </div>
          </div>
        </div>
      </div>`;
    } else if (slide.layout === 'map-spotlight') {
      const pl = slide.place || {};
      const others = Array.isArray(slide.otherPlaces) ? slide.otherPlaces : [];
      inner = `<div class="pj-layout-map">
        <span class="pj-kicker">${esc(slide.kicker)}</span>
        <h2>${esc(slide.title)}</h2>
        <div class="pj-map-grid">
          <div class="pj-map-frame">
            ${pl.map ? `<iframe src="${escAttr(pl.map)}" title="Mapa de ${escAttr(pl.name || 'Angola')}" loading="lazy" referrerpolicy="no-referrer-when-downgrade"></iframe>` : ''}
          </div>
          <div class="pj-map-info">
            <span class="pj-int-tag">🇦🇴 CONTEXTO EM ANGOLA</span>
            <h3>${esc(pl.name || pl.title || 'Angola')}</h3>
            <p>${esc(pl.text || '')}</p>
            ${others.length ? `<div class="pj-map-others"><span>Outros locais ligados:</span><div>${others.map((o) => `<a href="${escAttr(o.url || '#')}" target="_blank" rel="noopener noreferrer">${esc(o.name)} ↗</a>`).join('')}</div></div>` : ''}
            ${pl.url ? `<a class="pj-web-link" href="${escAttr(pl.url)}" target="_blank" rel="noopener noreferrer">Ver referência geográfica ↗</a>` : ''}
          </div>
        </div>
      </div>`;
    } else if (slide.layout === 'agenda') {
      inner = `<div class="pj-layout-agenda">
        <span class="pj-kicker">${esc(slide.kicker)}</span>
        <h2>${esc(slide.title)}</h2>
        ${slide.subtitle ? `<p class="pj-sub">${esc(slide.subtitle)}</p>` : ''}
        <ol class="pj-agenda-grid">
          ${(slide.bullets || []).map((b, i) => `<li style="--i:${i}"><span class="pj-ag-n">${String(i + 1).padStart(2, '0')}</span><strong>${esc(b)}</strong></li>`).join('')}
        </ol>
      </div>`;
    } else if (slide.layout === 'objectives') {
      inner = `<div class="pj-layout-objectives">
        <span class="pj-kicker">${esc(slide.kicker)}</span>
        <h2>${esc(slide.title)}</h2>
        <ul class="pj-objectives">
          ${(slide.bullets || []).map((b, i) => `<li style="--i:${i}"><span class="pj-obj-n">${String(i + 1).padStart(2, '0')}</span><strong>${esc(b)}</strong></li>`).join('')}
        </ul>
      </div>`;
    } else if (slide.layout === 'formula' || slide.layout === 'highlight') {
      const vars = Array.isArray(slide.formulaVars) ? slide.formulaVars : [];
      const activeV = vars[Math.min(P.activeFormulaVar || 0, Math.max(0, vars.length - 1))] || null;
      inner = `<div class="pj-layout-formula">
        <div class="pj-formula-head">
          <span class="pj-kicker">${esc(slide.kicker)}</span>
          <h2>${esc(slide.title)}</h2>
        </div>
        <div class="pj-formula-main">
          <div class="pj-formula-card">
            <span class="pj-formula-label">Laboratório interactivo de fórmula · clique nas variáveis</span>
            <code>${esc(slide.formula || slide.highlight || '')}</code>
            ${vars.length ? `<div class="pj-fvars">
              ${vars.map((v, i) => `<button type="button" class="pj-fvar ${i === (P.activeFormulaVar || 0) ? 'on' : ''}" onclick="AMAProjector.selectFormulaVar(${i})"><b>${esc(v.symbol)}</b><span>${esc(v.name)}</span></button>`).join('')}
            </div>
            ${activeV ? `<div class="pj-fvar-detail"><b>${esc(activeV.symbol)} — ${esc(activeV.name)}</b> <em>(${esc(activeV.unit)})</em>: ${esc(activeV.hint)}</div>` : ''}` : ''}
          </div>
          ${(slide.steps || []).length ? `<div class="pj-formula-steps">
            <span class="pj-mini-h">Como aplicar, passo a passo</span>
            <ol>${slide.steps.map((s, i) => `<li style="--i:${i}"><span class="pj-step-n">${i + 1}</span><span>${formatRichBullet(s)}</span></li>`).join('')}</ol>
          </div>` : ''}
        </div>
        ${renderFusedContext(slide)}
      </div>`;
    } else if (slide.layout === 'comparison') {
      inner = `<div class="pj-layout-comparison">
        <span class="pj-kicker">${esc(slide.kicker)}</span>
        <h2>${esc(slide.title)}</h2>
        <div class="pj-compare-grid">
          <div class="pj-compare-side a"><span class="pj-compare-tag">LADO A</span><b>${esc(slide.left || '')}</b></div>
          <div class="pj-compare-vs" aria-hidden="true">VS</div>
          <div class="pj-compare-side b"><span class="pj-compare-tag">LADO B</span><b>${esc(slide.right || '')}</b></div>
        </div>
        ${(slide.bullets || []).length ? `<ul class="pj-bullets pj-compare-notes">${slide.bullets.map((b) => `<li>${formatRichBullet(b)}</li>`).join('')}</ul>` : ''}
        ${renderFusedContext(slide)}
      </div>`;
    } else if (slide.layout === 'timeline' || slide.layout === 'animated-flow') {
      inner = `<div class="pj-layout-timeline ${slide.layout === 'animated-flow' ? 'pj-flow' : ''}">
        <span class="pj-kicker">${esc(slide.kicker)}</span>
        <h2>${esc(slide.title)}</h2>
        <ol class="pj-timeline-list">
          ${(slide.steps || []).map((s, i) => `<li style="--i:${i}"><span class="pj-tl-n">${String(i + 1).padStart(2, '0')}</span><div><p>${formatRichBullet(s)}</p></div></li>`).join('')}
        </ol>
        ${renderFusedContext(slide)}
        ${chipHtml(slide)}
      </div>`;
    } else if (slide.layout === 'mindmap') {
      const nodes = Array.isArray(slide.nodes) ? slide.nodes.slice(0, 6) : [];
      inner = `<div class="pj-layout-mindmap">
        <span class="pj-kicker">${esc(slide.kicker)}</span>
        <h2>${esc(slide.title)}</h2>
        <div class="pj-mindmap">
          <svg class="pj-mm-lines" viewBox="0 0 600 220" preserveAspectRatio="none" aria-hidden="true">
            <path class="ig-draw" d="M300 45 Q180 75 100 120 M300 45 Q300 90 300 120 M300 45 Q420 75 500 120" fill="none" stroke="currentColor" stroke-opacity=".22" stroke-width="2.5"/>
          </svg>
          <div class="pj-mm-center"><span>${esc(slide.center || deck.title)}</span></div>
          ${nodes.map((n, i) => `<div class="pj-mm-node" style="--i:${i}" title="${escAttr(n.note || '')}"><b>${esc(n.term)}</b>${n.note ? `<small>${esc(n.note)}</small>` : ''}</div>`).join('')}
        </div>
        ${chipHtml(slide)}
      </div>`;
    } else if (slide.layout === 'web-spotlight') {
      const items = Array.isArray(slide.items) ? slide.items.slice(0, 3) : [];
      const places = Array.isArray(slide.places) ? slide.places.slice(0, 3) : [];
      const videos = Array.isArray(slide.videos) ? slide.videos.slice(0, 2) : [];
      inner = `<div class="pj-layout-web">
        <span class="pj-kicker"><em class="pj-ext-tag">EXTERNO</em> ${esc(slide.kicker)}</span>
        <h2>${esc(slide.title)}</h2>
        <div class="pj-web-grid">
          ${items.map((w) => `<a class="pj-web-card" href="${escAttr(w.url || '#')}" target="_blank" rel="noopener noreferrer">
          ${webImageUrl(w) ? `<img class="pj-web-img" src="${escAttr(webImageUrl(w))}" alt="${escAttr((w.image && w.image.alt) || w.title)}" loading="lazy" referrerpolicy="no-referrer">` : ''}
            <small>${esc(w.source || 'Wikipédia')}</small>
            <b>${esc(w.title)}</b>
            <p>${esc(w.text)}</p>
            <span class="pj-web-link">Ver origem ↗</span>
          </a>`).join('')}
          ${places.map((pl) => `<div class="pj-web-card pj-web-place">
            <small>Local · mapa</small>
            <b>${esc(pl.name)}</b>
            ${pl.map ? `<iframe src="${escAttr(pl.map)}" loading="lazy" title="Mapa de ${escAttr(pl.name)}"></iframe>` : ''}
            <a class="pj-web-link" href="${escAttr(pl.url || '#')}" target="_blank" rel="noopener noreferrer">Origem ↗</a>
          </div>`).join('')}
          ${videos.map((v) => `<a class="pj-web-card pj-web-video" href="${escAttr(v.url || '#')}" target="_blank" rel="noopener noreferrer">
            <small>Vídeo</small>
            <b>${esc(v.title || v.url)}</b>
            <span class="pj-web-link">Abrir vídeo ↗</span>
          </a>`).join('')}
        </div>
        <p class="pj-web-src">Conteúdo externo verificado nas fontes acima — fundido com o ficheiro do docente.</p>
      </div>`;
    } else if (slide.layout === 'check') {
      inner = `<div class="pj-layout-quiz pj-check">
        <span class="pj-kicker">${esc(slide.kicker)}</span>
        <h2>${esc(slide.title)}</h2>
        <p class="pj-quiz-q">${esc(slide.question || '')}</p>
        <div class="pj-check-answer"><b>Resposta no ficheiro</b><p>Discutam em grupos antes de avançar. Só depois voltem à passagem de origem e comparem.</p></div>
      </div>`;
    } else if (slide.layout === 'quiz') {
      const opts = Array.isArray(slide.options) ? slide.options : [];
      inner = `<div class="pj-layout-quiz" data-correct="${Number(slide.correct) || 0}">
        <span class="pj-kicker">${esc(slide.kicker)}</span>
        <h2>${esc(slide.title)}</h2>
        <p class="pj-quiz-q">${esc(slide.question || '')}</p>
        <div class="pj-quiz-options">
          ${opts.map((o, i) => `<button type="button" class="pj-quiz-option" data-index="${i}" aria-label="Opção ${String.fromCharCode(65 + i)}">` +
            `<span class="pj-q-letter">${String.fromCharCode(65 + i)}</span><span>${esc(o)}</span></button>`).join('')}
        </div>
        <div class="pj-quiz-reveal" hidden><b>Resposta do ficheiro:</b> ${esc(slide.explanation || '')}</div>
      </div>`;
    } else if (slide.layout === 'stat-spotlight' && slide.heroStat) {
      const st = slide.heroStat;
      const pctMatch = String(st.value || '').match(/(\d+(?:[.,]\d+)?)\s*%/);
      const barPct = pctMatch ? Math.max(8, Math.min(100, parseFloat(pctMatch[1].replace(',', '.')))) : 72;
      inner = `<div class="pj-layout-stat">
        <span class="pj-kicker">${esc(slide.kicker)}</span>
        <h2>${esc(slide.title)}</h2>
        <div class="pj-stat-grid">
          <div class="pj-stat-hero">
            <span class="pj-stat-lbl">${esc(st.label || 'Destaque')}</span>
            <strong class="pj-stat-val">${esc(st.value)}</strong>
            <svg class="pj-stat-svg" viewBox="0 0 220 14" aria-hidden="true">
              <rect x="0" y="3" width="220" height="8" rx="4" fill="currentColor" fill-opacity=".14"/>
              <rect class="ig-draw" x="0" y="3" width="${Math.round(2.2 * barPct)}" height="8" rx="4" fill="var(--s-accent,#00a4dc)"/>
            </svg>
            <p class="pj-stat-ctx">${esc(st.context || slide.subtitle || '')}</p>
          </div>
          <div class="pj-stat-side">
            ${(slide.bullets || []).length ? `<ul class="pj-bullets">${slide.bullets.slice(0, 3).map((b, i) => `<li style="--i:${i}"><span class="pj-b-idx">${String(i + 1).padStart(2, '0')}</span><span>${formatRichBullet(b)}</span></li>`).join('')}</ul>` : ''}
            ${renderFusedContext(slide)}
          </div>
        </div>
      </div>`;
    } else if (slide.layout === 'bento-grid') {
      const items = (slide.bullets || []).slice(0, 4);
      inner = `<div class="pj-layout-bento">
        <span class="pj-kicker">${esc(slide.kicker)}</span>
        <h2>${esc(slide.title)}</h2>
        <div class="pj-bento-grid">
          ${items.map((b, i) => `<div class="pj-bento-card ${i === 0 ? 'is-hero' : ''}" style="--i:${i}">
            <span class="pj-bento-n">${String(i + 1).padStart(2, '0')}</span>
            <p>${formatRichBullet(b)}</p>
          </div>`).join('')}
        </div>
        ${renderFusedContext(slide)}
      </div>`;
    } else if (slide.layout === 'quote') {
      inner = `<div class="pj-layout-quote">
        <span class="pj-kicker">${esc(slide.kicker)}</span>
        <h2>${esc(slide.title)}</h2>
        <div class="pj-quote-body">
          <span class="pj-quote-mark" aria-hidden="true">“</span>
          <blockquote class="pj-quote-text">${esc(slide.quote || '')}</blockquote>
          <span class="pj-quote-source">— ${esc(slide.source || deck.title)}</span>
        </div>
        ${(slide.bullets || []).length ? `<ul class="pj-bullets pj-quote-notes">${slide.bullets.map((b) => `<li>${formatRichBullet(b)}</li>`).join('')}</ul>` : ''}
        ${renderFusedContext(slide)}
      </div>`;
    } else if (slide.layout === 'concept' || slide.layout === 'split') {
      const isConcept = slide.layout === 'concept';
      inner = `<div class="pj-layout-split">
        <div class="pj-split-copy">
          <span class="pj-kicker">${esc(slide.kicker)}</span>
          <h2>${esc(slide.title)}</h2>
          ${slide.subtitle ? `<p class="${isConcept ? 'pj-concept-def' : 'pj-sub'}">${esc(slide.subtitle)}</p>` : ''}
          ${(slide.bullets || []).length ? `<ul class="pj-bullets">${slide.bullets.map((b, i) => `<li style="--i:${i}">${formatRichBullet(b)}</li>`).join('')}</ul>` : ''}
          ${renderFusedContext(slide)}
          ${chipHtml(slide)}
        </div>
        <figure class="pj-split-art">
          ${slide.visual
            ? `<img src="${escAttr(slide.visual)}" alt="${escAttr(slide.visualAlt || slide.title)}" loading="lazy" referrerpolicy="no-referrer" onerror="this.style.display='none'">`
            : `<canvas class="pj-mini-3d-canvas" aria-label="Visualização 3D de ${escAttr(slide.title)}"></canvas>`}
          ${slide.visualCredit ? `<figcaption>${slide.visualCredit.url ? `<a href="${escAttr(slide.visualCredit.url)}" target="_blank" rel="noopener noreferrer">` : ''}${esc(slide.visualCredit.text)}${slide.visualCredit.url ? ' ↗</a>' : ''}</figcaption>` : (!slide.visual ? '<figcaption>Modelo 3D interactivo · arraste para rodar</figcaption>' : '')}
        </figure>
      </div>`;
    } else if (slide.layout === 'closing') {
      inner = `<div class="pj-layout-closing">
        <span class="pj-kicker">${esc(slide.kicker)}</span>
        <h2>${esc(slide.title)}</h2>
        <div class="pj-closing-cols">
          <div class="pj-closing-col">
            <h3>Ideias para levar</h3>
            <ul class="pj-bullets">${(slide.bullets || []).map((b) => `<li>${formatRichBullet(b)}</li>`).join('')}</ul>
          </div>
          <div class="pj-closing-col pj-check-box">
            <h3>Perguntas à turma</h3>
            <ol>${(slide.checkQuestions || []).map((q) => `<li>${esc(q)}</li>`).join('')}</ol>
          </div>
        </div>
      </div>`;
    } else {
      inner = `<div class="pj-layout-bullets has-art">
        <div class="pj-bullets-main">
          <span class="pj-kicker">${esc(slide.kicker)}</span>
          <h2>${esc(slide.title)}</h2>
          <ul class="pj-bullets pj-bullets-grid">${(slide.bullets || []).map((b, i) => `<li style="--i:${i}"><span class="pj-b-idx">${String(i + 1).padStart(2, '0')}</span><span>${formatRichBullet(b)}</span></li>`).join('')}</ul>
          ${renderFusedContext(slide)}
          ${chipHtml(slide)}
        </div>
        <figure class="pj-slide-art">
          ${slide.visual
            ? `<img src="${escAttr(slide.visual)}" alt="${escAttr(slide.visualAlt || slide.title)}" loading="lazy" referrerpolicy="no-referrer" onerror="this.style.display='none'">`
            : `<canvas class="pj-mini-3d-canvas" aria-label="Visualização 3D de ${escAttr(slide.title)}"></canvas>`}
          ${slide.visualCredit ? `<figcaption>${slide.visualCredit.url ? `<a href="${escAttr(slide.visualCredit.url)}" target="_blank" rel="noopener noreferrer">` : ''}${esc(slide.visualCredit.text)}${slide.visualCredit.url ? ' ↗</a>' : ''}</figcaption>` : (!slide.visual ? '<figcaption>Modelo 3D interactivo · arraste para rodar</figcaption>' : '')}
        </figure>
      </div>`;
    }

    mountActive3DScene(slide, deck);
    mountProjectionOverlays(slide);

    const srcLabel = slide.page
      ? `${deck.sourceName ? deck.sourceName + ' · ' : ''}p.${slide.page}`
      : (deck.sourceName || `Núcleo ${brandName()}`);
    const sid = slide.id || `s-${index}`;
    const hasStrokes = Array.isArray(P.drawings[sid]) && P.drawings[sid].length > 0;
    const showHand = deck.docType === 'aula' && (slide.handnote || slide.handNote);
    return `<div class="pj-slide pj-tr-${escAttr(P.transition || 'slide')} pj-theme-${escAttr(P.theme)} ${slide.scene3d ? 'pj-scene3d' : ''} ${P.laserOn && !P.drawOn && P.fullscreen ? 'is-laser' : ''} ${P.drawOn ? 'is-draw' : ''}" style="--pj-slide-scale:${P.slideScale}%" role="region" aria-roledescription="slide" aria-label="Slide ${index + 1}: ${escAttr(slide.title || '')}" data-testid="projector-slide" data-slide-index="${index}">
      <div class="pj-slide-inner"><span class="pj-ghost" aria-hidden="true">${String(index + 1).padStart(2, '0')}</span>${showHand ? `<span class="pj-handnote" aria-hidden="true">${esc(slide.handnote || slide.handNote)}</span>` : ''}${inner}</div>
      <footer class="pj-slide-foot">
        <span class="pj-foot-brand">${nucleoName()} · ${esc(deck.title)} · APP FEITO PELA HORIZONTE FUTURO</span>
        <span class="pj-foot-src">${esc(srcLabel)}</span>
        <span class="pj-foot-num">${numStr}</span>
      </footer>
      <div class="pj-slide-progress" aria-hidden="true"><i style="width:${pct}%"></i></div>
      ${(P.drawOn || hasStrokes) ? `<canvas class="pj-draw-canvas ${P.drawOn ? 'active' : ''}" aria-label="Quadro de anotações do docente"></canvas>` : ''}
      ${(P.laserOn && !P.drawOn && slide.layout !== 'scene-3d') ? `<span class="pj-laser-dot" aria-hidden="true"></span>` : ''}
      ${P.narrating ? `<div class="pj-caption-bar" role="status" aria-live="polite">
        <span class="pj-cap-tag">🔊 AUTO-AULA</span>
        <p>${esc(slide.narration || slide.notes || slide.subtitle || slide.title || '')}</p>
        <button type="button" onclick="AMAProjector.toggleNarrate()" aria-label="Parar Auto-Aula">⏹</button>
      </div>` : ''}
      ${P.pulseOpen ? `<div class="pj-pulse-bar" role="region" aria-label="Pulso da turma" onclick="event.stopPropagation()">
        <span class="pj-pulse-q">⚡ A turma acompanhou este ponto?</span>
        <div class="pj-pulse-btns">
          <button type="button" class="p-ok" onclick="AMAProjector.votePulse('ok')">✓ Claro <b>${P.pulseVotes.ok}</b></button>
          <button type="button" class="p-mid" onclick="AMAProjector.votePulse('mid')">◐ Quase <b>${P.pulseVotes.mid}</b></button>
          <button type="button" class="p-rev" onclick="AMAProjector.votePulse('rev')">↻ Rever <b>${P.pulseVotes.rev}</b></button>
          <button type="button" class="p-x" title="Fechar pulso" onclick="AMAProjector.togglePulse()">✕</button>
        </div>
      </div>` : ''}
      ${P.blackout ? `<div class="pj-blackout" role="dialog" aria-label="Cortina de atenção" onclick="AMAProjector.toggleBlackout()">
        <span class="pj-kicker">PAUSA · ATENÇÃO AO DOCENTE</span>
        <strong>${esc(deck.title)}</strong>
        <p>Slide ${index + 1} de ${total} · Prima <kbd>B</kbd> ou clique para retomar a projeção</p>
      </div>` : ''}
    </div>`;
  }

  /* ------------------------------------------------------------------ */
  /* Modo Leitura (Reading Mode)                                        */
  /* ------------------------------------------------------------------ */
  function renderReadingMode(deck) {
    const rd = deck.reading || { sections: [], definitions: [], centralIdea: '' };
    return `<section class="pj-read-shell rt-${escAttr(P.readTheme)} rl-${escAttr(P.readLine)}" style="--pj-fs:${P.readScale}%" data-testid="projector-reading-mode">
      <div class="pj-read-bar">
        <div class="pj-read-bar-group" role="group" aria-label="Tema de leitura">
          <button type="button" class="${P.readTheme === 'paper' ? 'on' : ''}" onclick="AMAProjector.setReadTheme('paper')">Papel</button>
          <button type="button" class="${P.readTheme === 'sepia' ? 'on' : ''}" onclick="AMAProjector.setReadTheme('sepia')">Sépia</button>
          <button type="button" class="${P.readTheme === 'night' ? 'on' : ''}" onclick="AMAProjector.setReadTheme('night')">Noite</button>
        </div>
        <div class="pj-read-bar-group" role="group" aria-label="Tamanho da letra">
          <button type="button" onclick="AMAProjector.stepReadScale(-10)" aria-label="Diminuir letra">A−</button>
          <span class="pj-read-scale-val">${P.readScale}%</span>
          <button type="button" onclick="AMAProjector.stepReadScale(10)" aria-label="Aumentar letra">A+</button>
        </div>
        <div class="pj-read-bar-group" role="group" aria-label="Espaçamento entre linhas">
          <button type="button" class="${P.readLine === 'compact' ? 'on' : ''}" onclick="AMAProjector.setReadLine('compact')">Compacto</button>
          <button type="button" class="${P.readLine === 'comfort' ? 'on' : ''}" onclick="AMAProjector.setReadLine('comfort')">Confortável</button>
          <button type="button" class="${P.readLine === 'wide' ? 'on' : ''}" onclick="AMAProjector.setReadLine('wide')">Amplo</button>
        </div>
        <button type="button" class="btn btn-p btn-sm" onclick="AMAProjector.setMode('slides')">${I.play} Voltar aos Slides</button>
      </div>

      <div class="pj-read-layout">
        <aside class="pj-read-toc" aria-label="Índice do documento">
          <span class="pj-toc-h">Índice da Aula</span>
          <nav>
            ${(rd.sections || []).map((sec) => `<button type="button" onclick="AMAProjector.jumpSection('${sec.id}')"><span>${String(sec.number).padStart(2, '0')}</span>${esc(sec.heading)}</button>`).join('')}
          </nav>
          ${(deck.stats && deck.stats.keywords && deck.stats.keywords.length) ? `
            <div class="pj-toc-kw">
              <span class="pj-toc-h">Termos-chave</span>
              <div>${deck.stats.keywords.map((k) => `<span>${esc(k)}</span>`).join('')}</div>
            </div>` : ''}
        </aside>

        <article class="pj-read-article">
          <header class="pj-read-head">
            <span class="pj-read-kicker">MODO LEITURA · ${esc(deck.sourceName || 'NÚCLEO AMA')}</span>
            <h1>${esc(deck.title)}</h1>
            <p class="pj-read-meta">${deck.stats.words} palavras · ~${deck.stats.estMinutes} min · ${deck.stats.pages} secç${deck.stats.pages === 1 ? 'ão' : 'ões'}</p>
          </header>

          ${rd.centralIdea ? `<div class="pj-read-callout"><span>Ideia central</span><p>${esc(rd.centralIdea)}</p></div>` : ''}

          ${(deck.teaching || {}).tip ? `<div class="pj-read-guide">
            <span>Guia de ensino · nível ${esc(deck.teaching.label)}</span>
            <p>${esc(deck.teaching.tip)}</p>
            ${deck.teaching.auto ? '<small>Nível detetado automaticamente a partir do texto do ficheiro.</small>' : ''}
          </div>` : ''}

          ${(rd.comparisons || []).length ? `<div class="pj-read-comparisons">
            <h3>Comparações reconhecidas no documento</h3>
            <div class="pj-read-cmp-grid">${rd.comparisons.map((c) => `<div><b>${esc(c.left)}</b><span>vs</span><b>${esc(c.right)}</b><small>${esc(c.context)}</small></div>`).join('')}</div>
          </div>` : ''}

          ${(deck.mnemonics || []).length ? `<div class="pj-read-mnem">
            <h3>Truques de memória</h3>
            <ul>${deck.mnemonics.map((m) => `<li><b>${esc(m.term)}</b><span>${esc(m.mnemonic)}</span></li>`).join('')}</ul>
          </div>` : ''}

          ${(rd.definitions || []).length ? `<div class="pj-read-defs">
            <h3>Glossário extraído</h3>
            <dl>${rd.definitions.map((d) => `<dt>${esc(d.term)}</dt><dd>${esc(d.sentence)}</dd>`).join('')}</dl>
          </div>` : ''}

          ${(rd.sections || []).map((sec) => `
            <section class="pj-read-sec" id="${escAttr(sec.id)}">
              <span class="pj-read-pg">Secção ${sec.number} · Pág. ${sec.page}</span>
              <h2>${esc(sec.heading)}</h2>
              ${sec.paragraphs.map((p) => `<p>${esc(p)}</p>`).join('')}
              ${sec.definition ? `<div class="pj-read-def-inline"><b>${esc(sec.definition.term)}</b><span>${esc(sec.definition.sentence)}</span></div>` : ''}
              ${(sec.keyTerms || []).length ? `<div class="pj-read-terms"><span>Termos-chave:</span> ${sec.keyTerms.map((t) => `<em>${esc(t)}</em>`).join('')}</div>` : ''}
              ${sec.angola_example ? `<div class="pj-read-angola"><span>No contexto angolano</span><p>${esc(sec.angola_example)}</p></div>` : ''}
              ${sec.checkQuestion ? `<div class="pj-read-check"><span>Verifica a compreensão</span><p>${esc(sec.checkQuestion)}</p></div>` : ''}
            </section>
          `).join('')}
        </article>
      </div>
    </section>`;
  }

  /* ------------------------------------------------------------------ */
  /* Painel de Criação / Importação PDF                                 */
  /* ------------------------------------------------------------------ */
  function takePrefill() {
    try {
      const raw = sessionStorage.getItem('ama-pj-prefill');
      if (!raw) return null;
      sessionStorage.removeItem('ama-pj-prefill');
      const data = JSON.parse(raw);
      if (data && data.sourceName) P.pendingSource = data.sourceName;
      return data;
    } catch { return null; }
  }

  function renderCreatorPanel() {
    const notebooks = loadNotebooks();
    const savedDecks = loadDecks();
    const prefill = takePrefill();
    return `<section class="card pj-creator pj-creator-calm" data-testid="projector-creator">
      <div class="pj-creator-head">
        <div>
          <span class="eyebrow-t">${I.doc} PDF &amp; TEXTO → SLIDES INTELIGENTES</span>
          <h2 style="margin-top:6px">Carregue um ficheiro — a IA adapta, ilustra e cria os slides</h2>
          <p class="muted">Detecta automaticamente se é Aula, Ata, Relatório ou Regulamento, busca imagens em toda a web (Openverse, NASA, Wikimedia, OpenAlex) e monta cenas 3D dinâmicas.</p>
        </div>
        <div class="pj-creator-tabs" role="tablist" aria-label="Modo de criação">
          <button type="button" role="tab" aria-selected="${P.creatorTab !== 'chatgpt'}" class="${P.creatorTab !== 'chatgpt' ? 'on' : ''}" onclick="AMAProjector.setCreatorTab('direct')">📄 PDF / Texto Direto</button>
          <button type="button" role="tab" aria-selected="${P.creatorTab === 'chatgpt'}" class="${P.creatorTab === 'chatgpt' ? 'on' : ''}" onclick="AMAProjector.setCreatorTab('chatgpt')">✨ Super-IA (ChatGPT / Gemini)</button>
        </div>
      </div>

      ${P.creatorTab === 'chatgpt' ? `<div class="pj-chatgpt-panel" data-testid="projector-chatgpt-tab">
        <div class="pj-cg-steps">
          <div class="pj-cg-step">
            <span class="pj-b-idx">01</span>
            <div>
              <b>Copie o Prompt Profissional CEU-3D</b>
              <p>Este prompt pede ao ChatGPT, Gemini ou Claude para analisar o seu PDF e devolver instruções estruturadas com layouts, imagens e cena 3D volátil à medida.</p>
              <div class="flex wrap" style="gap:8px;margin-top:8px">
                <button type="button" class="btn btn-p btn-sm" onclick="AMAProjector.copyExternalPrompt(false)">📋 Copiar Prompt CEU-3D</button>
                <button type="button" class="btn btn-o btn-sm" onclick="AMAProjector.copyExternalPrompt(true)">📋 Prompt + Meu Texto/PDF</button>
                <a class="btn btn-o btn-sm" href="https://chatgpt.com/" target="_blank" rel="noopener noreferrer">ChatGPT ↗</a>
                <a class="btn btn-o btn-sm" href="https://gemini.google.com/" target="_blank" rel="noopener noreferrer">Gemini ↗</a>
              </div>
              <details class="pj-adv-opts" style="margin-top:10px">
                <summary>Ver texto completo do prompt pré-definido</summary>
                <pre class="pj-prompt-preview">${esc((window.Study && window.Study.AI && window.Study.AI.getExternalAIPrompt ? window.Study.AI.getExternalAIPrompt(P.brief) : ''))}</pre>
              </details>
            </div>
          </div>
          <div class="pj-cg-step">
            <span class="pj-b-idx">02</span>
            <div>
              <b>Envie o seu PDF + Prompt ao ChatGPT e cole a resposta aqui</b>
              <textarea id="pj-ext-json" rows="7" style="width:100%;margin-top:8px" placeholder='Cole aqui o bloco JSON (ou guião) devolvido pelo ChatGPT / Gemini…'></textarea>
              <div class="flex wrap" style="gap:10px;margin-top:10px;align-items:center">
                <button type="button" class="btn btn-p" onclick="AMAProjector.importExternalBlueprint()">✦ Construir Slides Super-IA + 3D + Imagens</button>
                <button type="button" class="btn btn-o btn-sm" onclick="AMAProjector.loadSuperIADemo()">▶ Testar exemplo Super-IA</button>
                ${P.deck ? `<button type="button" class="btn btn-o btn-sm" onclick="AMAProjector.toggleCreator(false)">Voltar aos slides</button>` : ''}
              </div>
            </div>
          </div>
        </div>
      </div>` : `<div class="pj-samples" style="margin-bottom:14px">
        <span>Experimentar:</span>
        <button type="button" class="pj-sample-pill is-hi" onclick="AMAProjector.loadSample('ata')">📋 Ata</button>
        <button type="button" class="pj-sample-pill" onclick="AMAProjector.loadSample('fisica')">Física</button>
        <button type="button" class="pj-sample-pill" onclick="AMAProjector.loadSample('financas')">Finanças</button>
        <button type="button" class="pj-sample-pill" onclick="AMAProjector.loadSample('programacao')">Python</button>
        <button type="button" class="pj-sample-pill" onclick="AMAProjector.loadSample('biologia')">Biologia</button>
      </div>
      <div class="pj-creator-grid">
        <div class="pj-dropzone">
          <label class="pj-drop-label" for="pj-file-input">
            <span class="pj-drop-ic">${I.doc}</span>
            <strong>Arraste ou escolha o ficheiro</strong>
            <small>.pdf · .docx · .pptx · .txt · .md · imagem</small>
            <span class="btn btn-p btn-sm" style="margin-top:10px">Escolher ficheiro</span>
            <input id="pj-file-input" type="file" accept=".pdf,.docx,.pptx,.txt,.md,image/png,image/jpeg,image/webp" hidden onchange="AMAProjector.handleFile(this)">
          </label>
          <p class="pj-upload-st" id="pj-upload-st" aria-live="polite">${esc(P.uploadStatus || (P.pendingSource ? `Ficheiro pronto: ${P.pendingSource}` : ''))}</p>

          ${P.pdfMeta ? `<div class="pj-pdf-meta-box">
            <div class="pj-pdf-meta-row">
              <b>${esc(P.pdfMeta.filename)}</b>
              <span>${P.pdfMeta.totalPages} pág.</span>
              ${P.pdfMeta.headingsCount ? `<span>${P.pdfMeta.headingsCount} títulos</span>` : ''}
            </div>
            <div class="pj-range-row">
              <label>Pág. <input type="number" min="1" max="${P.pdfMeta.totalPages}" value="${P.pageStart}" onchange="AMAProjector.setPageRange(this.value, null)"></label>
              <span>a</span>
              <label><input type="number" min="1" max="${P.pdfMeta.totalPages}" value="${P.pageEnd}" onchange="AMAProjector.setPageRange(null, this.value)"></label>
              <button type="button" class="btn btn-o btn-sm" onclick="AMAProjector.reextractPdfRange()">Aplicar</button>
            </div>
          </div>` : ''}

          ${P.isScanned ? `<div class="pj-scanned-warn" role="alert">
            <b>PDF digitalizado detectado.</b>
            <p>Pode correr OCR local (PT/EN) ou colar o texto ao lado.</p>
            <div class="flex wrap" style="gap:8px;margin-top:8px">
              <button type="button" class="btn btn-p btn-sm" onclick="AMAProjector.runOcr()">Executar OCR local</button>
              <button type="button" class="btn btn-o btn-sm" onclick="document.getElementById('pj-text')?.focus()">Colar texto</button>
            </div>
          </div>` : ''}
        </div>

        <div class="pj-text-form">
          <div class="field">
            <label for="pj-text">Ou cole o texto aqui (ata, sebenta, resumo ou artigo)</label>
            <textarea id="pj-text" rows="5" placeholder="Cole qualquer texto — a IA reorganiza, explica com exemplos, adiciona imagens e modelos 3D automaticamente…">${esc(prefill && prefill.text || '')}</textarea>
          </div>
          <div class="field pj-brief-field">
            <label for="pj-brief">Como quer os slides e as imagens? <small>(opcional · escreva ou fale por áudio)</small></label>
            <div class="pj-voice-row">
              <input id="pj-brief" maxlength="320" placeholder="Ex.: Fotos reais de foguetões e carros, tom simples para 1.º ano, tema escuro…" value="${escAttr(P.brief || '')}" oninput="AMAProjector.setBrief(this.value)">
              <button type="button" class="btn btn-o btn-sm pj-mic-btn ${P.voiceListening && P.voiceTarget === 'brief' ? 'is-rec' : ''}" title="Falar descrição por áudio (microfone)" onclick="AMAProjector.toggleVoice('brief')">${P.voiceListening && P.voiceTarget === 'brief' ? '● A ouvir…' : '🎙 Falar'}</button>
            </div>
          </div>
          <div class="flex wrap" style="gap:10px;align-items:center">
            <button type="button" class="btn btn-p" onclick="AMAProjector.generateFromForm()">${I.spark} Gerar slides automaticamente</button>
            ${P.deck ? `<button type="button" class="btn btn-o btn-sm" onclick="AMAProjector.toggleCreator(false)">Voltar aos slides</button>` : ''}
          </div>

          <details class="pj-adv-opts">
            <summary>⚙ Opções avançadas (título, tipo, roteiro editável, links)</summary>
            <div class="pj-adv-body">
              <div class="st-grid-in">
                <div class="field"><label for="pj-title">Título (auto se vazio)</label><input id="pj-title" maxlength="90" placeholder="Detectado automaticamente" value="${escAttr(prefill && prefill.title || '')}" oninput="this.removeAttribute('data-auto-title')"></div>
                <div class="field"><label for="pj-subject">Disciplina</label>
                  <select id="pj-subject" onchange="this.removeAttribute('data-auto-subject')">
                    ${[['geral', 'Auto / Geral'], ['matematica', 'Matemática'], ['fisica', 'Física'], ['programacao', 'Programação'], ['financas', 'Finanças'], ['empreendedorismo', 'Negócios'], ['biologia', 'Biologia'], ['historia', 'História']]
                      .map(([v, l]) => `<option value="${v}" ${(prefill && prefill.subject) === v ? 'selected' : ''}>${l}</option>`).join('')}
                  </select>
                </div>
              </div>
              <div class="pj-v3-controls">
                <div class="field"><label for="pj-doctype">Tipo de ficheiro</label>
                  <select id="pj-doctype" onchange="AMAProjector.setV3Opt('docType', this.value)">
                    <option value="auto" ${P.docType === 'auto' ? 'selected' : ''}>Auto-detectar</option>
                    <option value="ata" ${P.docType === 'ata' ? 'selected' : ''}>Ata de Reunião</option>
                    <option value="relatorio" ${P.docType === 'relatorio' ? 'selected' : ''}>Relatório</option>
                    <option value="regulamento" ${P.docType === 'regulamento' ? 'selected' : ''}>Regulamento</option>
                    <option value="cientifico" ${P.docType === 'cientifico' ? 'selected' : ''}>Artigo</option>
                    <option value="plano" ${P.docType === 'plano' ? 'selected' : ''}>Plano</option>
                    <option value="aula" ${P.docType === 'aula' ? 'selected' : ''}>Aula / Sebenta</option>
                  </select>
                </div>
                <div class="field"><label for="pj-edu-level">Público</label>
                  <select id="pj-edu-level" onchange="AMAProjector.setV3Opt('eduLevel', this.value)">
                    <option value="secundario" ${P.eduLevel === 'secundario' ? 'selected' : ''}>Secundário</option>
                    <option value="universitario" ${P.eduLevel === 'universitario' ? 'selected' : ''}>Universitário</option>
                    <option value="profissional" ${P.eduLevel === 'profissional' ? 'selected' : ''}>Profissional</option>
                  </select>
                </div>
                <div class="field"><label for="pj-density">Densidade</label>
                  <select id="pj-density" onchange="AMAProjector.setV3Opt('density', this.value)">
                    <option value="essencial" ${P.density === 'essencial' ? 'selected' : ''}>Essencial (6–7)</option>
                    <option value="completo" ${P.density === 'completo' ? 'selected' : ''}>Completo (10–11)</option>
                    <option value="detalhado" ${P.density === 'detalhado' ? 'selected' : ''}>Detalhado</option>
                  </select>
                </div>
              </div>
              <div class="field">
                <label for="pj-links">Links de apoio (YouTube / Wikipédia — opcional)</label>
                <input id="pj-links" placeholder="https://youtu.be/... ou https://pt.wikipedia.org/wiki/..." value="${escAttr(P.extraLinks || '')}" oninput="AMAProjector.setLinks(this.value)">
              </div>
              ${notebooks.length ? `<div class="field">
                <label for="pj-nb-select">Abrir caderno guardado</label>
                <div class="flex" style="gap:8px">
                  <select id="pj-nb-select">${notebooks.map((r) => `<option value="${escAttr(r.id)}">${esc(r.title)}</option>`).join('')}</select>
                  <button type="button" class="btn btn-o btn-sm" onclick="AMAProjector.fromSelectedNotebook()">Abrir</button>
                </div>
              </div>` : ''}
              <button type="button" class="btn btn-o btn-sm" onclick="AMAProjector.buildOutlineFromForm()">▤ Editar Roteiro antes de gerar</button>
            </div>
          </details>
        </div>
      </div>`}

      ${P.outline ? renderOutlineEditor(P.outline) : ''}

      ${savedDecks.length ? `<div class="pj-saved-wrap">
        <h3>Apresentações recentes</h3>
        <div class="pj-saved-grid">
          ${savedDecks.slice(0, 4).map((dk) => `<div class="pj-saved-item">
            <button type="button" class="pj-saved-open" onclick="AMAProjector.openSaved('${escAttr(dk.id)}')">
              <strong>${esc(dk.title)}</strong>
              <small>${dk.stats.slides} slides · ~${dk.stats.estMinutes} min</small>
            </button>
            <button type="button" class="icon-btn" title="Apagar apresentação" aria-label="Apagar ${escAttr(dk.title)}" onclick="AMAProjector.removeSaved('${escAttr(dk.id)}')">${I.close}</button>
          </div>`).join('')}
        </div>
      </div>` : ''}
    </section>`;
  }

  /* ------------------------------------------------------------------ */
  /* Editor de Roteiro (Passo 1 -> Passo 2, estilo Gamma)               */
  /* ------------------------------------------------------------------ */
  function renderOutlineEditor(outline) {
    if (!outline || !Array.isArray(outline.cards)) return '';
    const activeCount = outline.cards.filter((c) => c.enabled !== false).length;
    return `<div class="pj-outline-editor" data-testid="projector-outline">
      <div class="pj-outline-head">
        <div>
          <span class="pj-kicker">ETAPA 1 DE 2 · ROTEIRO EDITÁVEL (${activeCount} SLIDES ACTIVOS)</span>
          <h3>Revise, reordene ou edite os cartões antes de gerar</h3>
        </div>
        <div class="flex wrap" style="gap:8px">
          <button type="button" class="btn btn-o btn-sm" onclick="AMAProjector.addOutlineCard()">+ Adicionar slide</button>
          <button type="button" class="btn btn-p btn-sm" onclick="AMAProjector.renderDeckFromOutline()">${I.spark} Gerar Slides + Web + 3D</button>
        </div>
      </div>
      <ol class="pj-outline-list">
        ${outline.cards.map((c, idx) => `<li class="pj-out-card ${c.enabled === false ? 'is-off' : ''}">
          <div class="pj-out-top">
            <span class="pj-out-badge">${esc(c.rhythm)}</span>
            <span class="pj-out-lay">${esc(c.layout)}</span>
            <div class="pj-out-actions">
              <button type="button" title="Mover acima" ${idx === 0 ? 'disabled' : ''} onclick="AMAProjector.moveOutline(${idx}, -1)">↑</button>
              <button type="button" title="Mover abaixo" ${idx === outline.cards.length - 1 ? 'disabled' : ''} onclick="AMAProjector.moveOutline(${idx}, 1)">↓</button>
              <button type="button" title="Activar/Desactivar" onclick="AMAProjector.toggleOutline('${escAttr(c.id)}')">${c.enabled === false ? 'Ativar' : 'Ocultar'}</button>
            </div>
          </div>
          <input class="pj-out-title" value="${escAttr(c.title)}" maxlength="65" aria-label="Título do slide ${idx + 1}" onchange="AMAProjector.editOutlineTitle('${escAttr(c.id)}', this.value)">
          ${(c.bullets || []).length ? `<ul class="pj-out-bullets">${c.bullets.slice(0, 3).map((b) => `<li>${esc(b)}</li>`).join('')}</ul>` : ''}
        </li>`).join('')}
      </ol>
    </div>`;
  }

  /* ------------------------------------------------------------------ */
  /* Workspace do Projetor                                              */
  /* ------------------------------------------------------------------ */
  function renderDeckWorkspace(deck) {
    const idx = Math.max(0, Math.min(P.slideIdx, deck.slides.length - 1));
    P.slideIdx = idx;
    const slide = deck.slides[idx];
    const isBusy = P.webBusy || P.aiBusy;
    const statusLabel = P.webBusy
      ? 'A enriquecer com imagens e web…'
      : (P.aiBusy
          ? 'IA a refinar explicações…'
          : (deck.synthesis && deck.synthesis.imagesEmbedded ? `✦ IA · ${deck.synthesis.imagesEmbedded} img + 3D` : '✦ IA + 3D activos'));

    const morePopover = P.moreOpen ? `<div class="pj-more-pop" role="menu" aria-label="Mais opções" onclick="event.stopPropagation()">
      <div class="pj-mp-sec">
        <span class="pj-mp-h">Visual &amp; Tema</span>
        <div class="pj-mp-row">
          ${[['editorial', 'Papel'], ['dark', 'Escuro'], ['ceu', 'CEU Azul'], ['pine', 'Pinho']]
            .map(([k, l]) => `<button type="button" class="${P.theme === k ? 'on' : ''}" onclick="AMAProjector.setTheme('${k}')">${l}</button>`).join('')}
        </div>
        <div class="pj-mp-row" style="margin-top:6px">
          <button type="button" onclick="AMAProjector.stepSlideScale(-8)">Letra A−</button>
          <button type="button" onclick="AMAProjector.stepSlideScale(8)">Letra A+</button>
        </div>
        <div class="pj-mp-row" style="margin-top:6px">
          ${[['slide', 'Deslizar'], ['fade', 'Suave'], ['zoom', 'Zoom'], ['none', 'Sem']]
            .map(([k, l]) => `<button type="button" class="${P.transition === k ? 'on' : ''}" onclick="AMAProjector.setTransition('${k}')">${l}</button>`).join('')}
        </div>
      </div>
      <div class="pj-mp-sec">
        <span class="pj-mp-h">Sala de Aula (atalhos)</span>
        <div class="pj-mp-row">
          <button type="button" onclick="AMAProjector.openPresenterWindow()">🖥 Janela do Docente</button>
          <button type="button" class="${P.narrating ? 'on' : ''}" onclick="AMAProjector.toggleNarrate()">${P.narrating ? '⏹ Parar Auto-Aula' : '▶ Auto-Aula + Voz (V)'}</button>
          <button type="button" class="${P.pulseOpen ? 'on' : ''}" onclick="AMAProjector.togglePulse()">⚡ Pulso Turma (P)</button>
          <button type="button" class="${P.showNotes ? 'on' : ''}" onclick="AMAProjector.toggleNotes()">Notas (N)</button>
          <button type="button" class="${P.revealMode ? 'on' : ''}" onclick="AMAProjector.toggleRevealMode()">1-a-1 (S)</button>
          <button type="button" class="${P.drawOn ? 'on' : ''}" onclick="AMAProjector.toggleDraw()">Desenhar (D)</button>
          <button type="button" class="${P.blackout ? 'on' : ''}" onclick="AMAProjector.toggleBlackout()">Cortina (B)</button>
          <button type="button" class="${P.timerRunning ? 'on' : ''}" onclick="AMAProjector.toggleTimer()">⏱ ${P.timerRunning ? `${P.timerSec}s` : '60s'} (T)</button>
          <button type="button" class="${P.laserOn ? 'on' : ''}" onclick="AMAProjector.toggleLaser()">Laser Auto (L)</button>
          <button type="button" onclick="AMAProjector.toggleShortcuts()">⌨ Atalhos (?)</button>
        </div>
      </div>
      <div class="pj-mp-sec">
        <span class="pj-mp-h">Adaptação &amp; IA</span>
        <div class="pj-mp-row">
          ${[['auto', 'Auto'], ['basico', 'Básico'], ['intermediario', 'Médio'], ['avancado', 'Avançado']]
            .map(([k, l]) => `<button type="button" class="${P.level === k ? 'on' : ''}" onclick="AMAProjector.setLevel('${k}')">${l}</button>`).join('')}
        </div>
        <div class="pj-mp-row" style="margin-top:6px">
          <button type="button" onclick="AMAProjector.openChatGPTTab()">✨ Modo ChatGPT</button>
          <button type="button" onclick="AMAProjector.promptBrief()">🎙 Descrever estilo/imagens</button>
          <button type="button" onclick="AMAProjector.togglePlanPanel()">${P.showPlan ? 'Ocultar Plano' : 'Ver Plano IA'}</button>
          <button type="button" onclick="AMAProjector.improveAI()">Refinar IA</button>
          <button type="button" onclick="AMAProjector.configGeminiKey()">Chave Gemini</button>
        </div>
      </div>
      <div class="pj-mp-sec">
        <span class="pj-mp-h">Exportar &amp; Partilha</span>
        <div class="pj-mp-row">
          <button type="button" onclick="AMAProjector.shareDeck()">📱 Partilhar / QR (Q)</button>
          <button type="button" onclick="AMAProjector.publishToCampusClass()">📢 Publicar na Turma</button>
          <button type="button" onclick="AMAProjector.exportPptx()">.PPTX</button>
          <button type="button" onclick="AMAProjector.exportPrintPdf()">PDF</button>
          <button type="button" onclick="AMAProjector.exportOfflineHtml()">HTML Offline</button>
          <button type="button" onclick="AMAProjector.exportWorksheet()">Ficha Aluno</button>
          <button type="button" onclick="AMAProjector.practiceDeck()">Quiz</button>
          <button type="button" onclick="AMAProjector.exportBackup()">Backup BD</button>
          ${(typeof S !== 'undefined' && S.user && ['ADMIN', 'INSTRUCTOR'].includes(S.user.papel)) ? `<button type="button" onclick="AMAProjector.sendToClass()">Enviar à turma</button>` : ''}
        </div>
      </div>
    </div>` : '';

    const toolbar = `<div class="pj-toolbar pj-toolbar-calm" data-testid="projector-toolbar">
      <div class="pj-tb-left">
        <button type="button" class="btn btn-o btn-sm" onclick="AMAProjector.toggleCreator(true)">${I.plus} Novo</button>
        <div class="pj-mode-seg" role="tablist" aria-label="Modo de visualização">
          <button type="button" role="tab" aria-selected="${P.mode === 'slides'}" class="${P.mode === 'slides' ? 'on' : ''}" onclick="AMAProjector.setMode('slides')">Slides</button>
          <button type="button" role="tab" aria-selected="${P.mode === 'reading'}" class="${P.mode === 'reading' ? 'on' : ''}" onclick="AMAProjector.setMode('reading')">Leitura</button>
          <button type="button" role="tab" aria-selected="${P.mode === 'grid'}" class="${P.mode === 'grid' ? 'on' : ''}" onclick="AMAProjector.setMode('grid')">Grelha</button>
        </div>
      </div>
      <div class="pj-tb-center">
        ${deck.docTypeMeta ? `<label class="pj-doc-chip" data-testid="projector-doc-banner" title="${escAttr((deck.docAnalysis && deck.docAnalysis.extracted && deck.docAnalysis.extracted.coreMessage) || deck.docTypeMeta.tone)}">
          <span>${esc(deck.docTypeMeta.icon)}</span>
          <select aria-label="Reinterpretar documento como" onchange="AMAProjector.setDocType(this.value)">
            ${[['auto', 'Auto'], ['ata', 'Ata de Reunião'], ['relatorio', 'Relatório'], ['regulamento', 'Regulamento'], ['cientifico', 'Artigo'], ['plano', 'Plano'], ['aula', 'Aula']]
              .map(([v, l]) => `<option value="${v}" ${(deck.docType === v) ? 'selected' : ''}>${l}</option>`).join('')}
          </select>
        </label>` : ''}
        <span class="pj-auto-pill ${isBusy ? 'is-busy' : ''}" aria-live="polite">${esc(statusLabel)}</span>
      </div>
      <div class="pj-tb-right">
        ${P.drawOn ? `<div class="pj-ink-picker" role="group" aria-label="Caneta">
          ${[['#ff6b57', 'Coral'], ['#b8f36b', 'Lima'], ['#00a4dc', 'Azul']].map(([c, n]) => `<button type="button" class="pj-ink-dot ${P.drawColor === c ? 'on' : ''}" style="background:${c}" title="${n}" onclick="AMAProjector.setDrawColor('${c}')"></button>`).join('')}
          <button type="button" class="btn btn-o btn-sm" onclick="AMAProjector.clearDrawing()">Limpar</button>
          <button type="button" class="btn btn-o btn-sm" onclick="AMAProjector.toggleDraw()">✕</button>
        </div>` : ''}
        <button type="button" class="btn btn-o btn-sm ${P.editingSlide ? 'is-on' : ''}" title="Editar este slide (E)" onclick="AMAProjector.toggleEditSlide()">✎ Editar</button>
        <div class="pj-more-wrap">
          <button type="button" class="btn btn-o btn-sm ${P.moreOpen ? 'is-on' : ''}" aria-expanded="${P.moreOpen}" onclick="event.stopPropagation();AMAProjector.toggleMore()">⋯ Mais</button>
          ${morePopover}
        </div>
        <button type="button" class="btn btn-p btn-sm" onclick="AMAProjector.toggleFullscreen()">▶ Projetar</button>
      </div>
    </div>`;

    let body = '';
    const planPanel = (() => {
      const plan = deck.plan;
      if (!P.showPlan || !plan || !Array.isArray(plan.blocks) || !plan.blocks.length) return '';
      return `<details class="pj-plan" data-testid="projector-plan" open ontoggle="AMAProjector.planToggled(this.open)">
        <summary>
          <span class="pj-plan-k">${I.spark} Plano da IA · ${plan.condensed.sentencesRead} frases → ${plan.condensed.ideasKept} ideias</span>
          <small>Fechar</small>
        </summary>
        <div class="pj-plan-body">
          <ol class="pj-plan-steps">${(plan.steps || []).map((s) => `<li>${esc(s)}</li>`).join('')}</ol>
        </div>
      </details>`;
    })();

    if (P.mode === 'reading') {
      body = `${renderReadingMode(deck)}`;
    } else if (P.mode === 'grid') {
      body = `${planPanel}<div class="pj-grid-view" data-testid="projector-grid">
        ${deck.slides.map((sl, i) => `<div class="pj-grid-card ${i === idx ? 'on' : ''}">
          <button type="button" class="pj-gc-open" onclick="AMAProjector.jumpSlide(${i})">
            <span class="pj-gc-n">${String(i + 1).padStart(2, '0')} · ${esc(sl.layout)}${sl.visual ? ' · 🖼' : ''}${sl.layout === 'scene-3d' || sl.mode3d ? ' · 3D' : ''}</span>
            <strong>${esc(sl.title)}</strong>
            <small>${esc(sl.subtitle || (sl.bullets && sl.bullets[0]) || sl.kicker)}</small>
          </button>
          <div class="pj-gc-acts">
            <button type="button" title="Mover antes" ${i === 0 ? 'disabled' : ''} onclick="AMAProjector.moveSlideAt(${i}, -1)">←</button>
            <button type="button" title="Mover depois" ${i === deck.slides.length - 1 ? 'disabled' : ''} onclick="AMAProjector.moveSlideAt(${i}, 1)">→</button>
            <button type="button" title="Duplicar slide" onclick="AMAProjector.duplicateSlideAt(${i})">⧉</button>
            ${deck.slides.length > 2 ? `<button type="button" title="Apagar slide" onclick="AMAProjector.deleteSlideAt(${i})">✕</button>` : ''}
          </div>
        </div>`).join('')}
        <button type="button" class="pj-grid-card pj-gc-add" onclick="AMAProjector.addSlide()">
          <span>＋</span>
          <strong>Novo Slide</strong>
          <small>Inserir ponto personalizado</small>
        </button>
      </div>`;
    } else {
      const nextSlide = deck.slides[idx + 1] || null;
      const revTotal = getSlideRevealTotal(slide);
      const revBadge = (P.revealMode && revTotal > 0)
        ? `<span class="pj-rev-pill">Revelar ${Math.min(P.revealStep, revTotal)}/${revTotal}</span>`
        : '';
      const inlineEditor = P.editingSlide && !P.fullscreen ? `<section class="card pj-slide-editor" data-testid="projector-inline-editor">
        <div class="pj-ed-head">
          <b>Editar Slide ${idx + 1} de ${deck.slides.length}</b>
          <div class="flex wrap" style="gap:6px">
            <button type="button" class="btn btn-o btn-sm" ${idx === 0 ? 'disabled' : ''} title="Mover slide para trás" onclick="AMAProjector.moveSlide(-1)">← Mover</button>
            <button type="button" class="btn btn-o btn-sm" ${idx >= deck.slides.length - 1 ? 'disabled' : ''} title="Mover slide para a frente" onclick="AMAProjector.moveSlide(1)">Mover →</button>
            <button type="button" class="btn btn-o btn-sm" title="Inserir novo slide a seguir" onclick="AMAProjector.addSlide()">+ Slide</button>
            ${deck.slides.length > 2 ? `<button type="button" class="btn btn-o btn-sm" title="Remover este slide" onclick="AMAProjector.deleteSlide()">🗑 Apagar</button>` : ''}
            <button type="button" class="btn btn-p btn-sm" onclick="AMAProjector.toggleEditSlide()">Concluir</button>
          </div>
        </div>
        <div class="pj-ed-grid">
          <label>Título <input id="pj-ed-title" maxlength="65" value="${escAttr(slide.title || '')}" onchange="AMAProjector.saveInlineEdit()"></label>
          <label>Layout
            <select id="pj-ed-layout" onchange="AMAProjector.saveInlineEdit()">
              ${[['bento-grid', 'Grelha Bento'], ['stat-spotlight', 'Destaque Numérico'], ['bullets', 'Cartões'], ['concept', 'Conceito'], ['split', 'Visual 2-col'], ['formula', 'Fórmula'], ['comparison', 'Comparação'], ['animated-flow', 'Passo a Passo'], ['quote', 'Citação'], ['closing', 'Síntese']]
                .map(([v, l]) => `<option value="${v}" ${slide.layout === v ? 'selected' : ''}>${l}</option>`).join('')}
            </select>
          </label>
          <label>Nota manuscrita <input id="pj-ed-hand" maxlength="42" value="${escAttr(slide.handnote || slide.handNote || '')}" onchange="AMAProjector.saveInlineEdit()"></label>
        </div>
        <label style="display:block;margin-top:8px">Intuição / Subtítulo <input id="pj-ed-sub" value="${escAttr(slide.intuition || slide.subtitle || '')}" onchange="AMAProjector.saveInlineEdit()"></label>
        <div style="margin-top:8px">
          <label for="pj-ed-imgq">Descrição da imagem deste slide (escreva ou fale por áudio · busca em toda a web)</label>
          <div class="pj-voice-row" style="margin-top:4px">
            <input id="pj-ed-imgq" placeholder="Ex.: foguetão espacial, sala de reunião, energia solar, floresta do Maiombe…" value="${escAttr(slide.visualPrompt || '')}">
            <button type="button" class="btn btn-o btn-sm pj-mic-btn ${P.voiceListening && P.voiceTarget === 'slideImg' ? 'is-rec' : ''}" onclick="AMAProjector.toggleVoice('slideImg')">${P.voiceListening && P.voiceTarget === 'slideImg' ? '● Ouvir' : '🎙'}</button>
            <button type="button" class="btn btn-p btn-sm" onclick="AMAProjector.searchSlideImage()">${P.imgGalleryBusy ? 'A procurar…' : '↻ Galeria Web'}</button>
            <label class="btn btn-o btn-sm" style="margin:0;cursor:pointer">📷 Foto PC<input type="file" accept="image/*" hidden onchange="AMAProjector.uploadSlideImage(this)"></label>
            <button type="button" class="btn btn-o btn-sm" onclick="AMAProjector.useSlide3D()">Usar 3D</button>
          </div>
          ${(Array.isArray(P.imgGallery) && P.imgGallery.length) ? `<div class="pj-img-gallery" aria-label="Escolha uma imagem coerente">
            ${P.imgGallery.map((im, gi) => `<button type="button" class="pj-ig-thumb ${slide.visual === im.url ? 'on' : ''}" title="${escAttr(im.alt || im.credit)}" onclick="AMAProjector.pickGalleryImage(${gi})">
              <img src="${escAttr(im.url)}" alt="${escAttr(im.alt || '')}" loading="lazy" referrerpolicy="no-referrer">
              <span>${esc((im.credit || 'Web').split('·')[0].trim())}</span>
            </button>`).join('')}
          </div>` : ''}
        </div>
        <label style="display:block;margin-top:8px">Pontos do slide (1 por linha, máx. 4) <textarea id="pj-ed-bullets" rows="4" onchange="AMAProjector.saveInlineEdit()">${esc(((slide.steps && slide.steps.length ? slide.steps : slide.bullets) || []).join('\n'))}</textarea></label>
        <label style="display:block;margin-top:8px">Notas do Docente <textarea id="pj-ed-notes" rows="2" onchange="AMAProjector.saveInlineEdit()">${esc(slide.notes || slide.teacherNote || '')}</textarea></label>
      </section>` : '';

      const fsHud = P.fullscreen ? `<div class="pj-fs-hud" role="toolbar" aria-label="Controlos de projeção">
        <button type="button" ${idx === 0 ? 'disabled' : ''} onclick="AMAProjector.step(-1)">←</button>
        <span class="pj-fs-pos">${String(idx + 1).padStart(2, '0')} / ${String(deck.slides.length).padStart(2, '0')}</span>
        <button type="button" ${idx >= deck.slides.length - 1 && (!P.revealMode || P.revealStep >= revTotal) ? 'disabled' : ''} onclick="AMAProjector.step(1)">→</button>
        <i></i>
        <button type="button" class="${P.narrating ? 'on' : ''}" title="Narrar aula em voz alta (V)" onclick="AMAProjector.toggleNarrate()">${P.narrating ? '⏹ Voz' : '🔊 Voz'}</button>
        <button type="button" class="${P.drawOn ? 'on' : ''}" title="Desenhar (D)" onclick="AMAProjector.toggleDraw()">✎ Desenhar</button>
        ${P.drawOn ? `<button type="button" title="Limpar (C)" onclick="AMAProjector.clearDrawing()">Limpar</button>` : ''}
        <button type="button" class="${P.showNotes ? 'on' : ''}" title="Notas (N)" onclick="AMAProjector.toggleNotes()">Notas</button>
        <button type="button" class="${P.pulseOpen ? 'on' : ''}" title="Pulso da turma (P)" onclick="AMAProjector.togglePulse()">⚡</button>
        <button type="button" class="${P.blackout ? 'on' : ''}" title="Cortina (B)" onclick="AMAProjector.toggleBlackout()">■</button>
        ${P.timerRunning ? `<button type="button" class="on" title="Parar cronómetro (T)" onclick="AMAProjector.toggleTimer()">⏱ ${P.timerSec}s</button>` : ''}
        <button type="button" class="pj-fs-exit" title="Sair (Esc)" onclick="AMAProjector.toggleFullscreen()">Sair ✕</button>
      </div>` : '';

      body = `${!P.fullscreen ? planPanel : ''}<div class="pj-stage-wrap ${P.fullscreen ? 'is-fs' : ''}">
        <div class="pj-stage-main">
          ${renderSlideContent(slide, deck, idx, deck.slides.length)}
          ${!P.fullscreen ? `<div class="pj-nav-bar">
            <button type="button" class="btn btn-o btn-sm" ${idx === 0 ? 'disabled' : ''} onclick="AMAProjector.step(-1)">${I.back} Anterior</button>
            <span class="pj-nav-pos" aria-live="polite" data-testid="projector-counter">Slide <b>${idx + 1}</b> de ${deck.slides.length} ${revBadge}</span>
            <button type="button" class="btn btn-p btn-sm" ${idx >= deck.slides.length - 1 && (!P.revealMode || P.revealStep >= revTotal) ? 'disabled' : ''} onclick="AMAProjector.step(1)">${P.revealMode && P.revealStep < revTotal ? 'Revelar passo' : 'Próximo'} ${I.arrow}</button>
          </div>` : ''}
          ${inlineEditor}
        </div>
        ${P.showNotes ? `<aside class="card pj-notes ${P.fullscreen ? 'pj-notes-fs' : ''}" data-testid="projector-notes">
          <div class="pj-notes-h"><span>Notas do Docente</span><small>Slide ${idx + 1}/${deck.slides.length}</small></div>
          <p>${esc(slide.notes || slide.teacherNote || 'Sem notas adicionais para este slide.')}</p>
          ${nextSlide ? `<div class="pj-next-preview" onclick="AMAProjector.step(1)">
            <span class="pj-np-tag">PRÓXIMO · ${String(idx + 2).padStart(2, '0')}</span>
            <b>${esc(nextSlide.title)}</b>
          </div>` : `<div class="pj-next-preview"><span class="pj-np-tag">FIM</span><b>Último slide</b></div>`}
          <div class="pj-notes-keys">
            <span><kbd>←</kbd><kbd>→</kbd> Slides</span>
            <span><kbd>S</kbd> 1-a-1</span>
            <span><kbd>D</kbd> Caneta</span>
            <span><kbd>B</kbd> Cortina</span>
            <span><kbd>T</kbd> 60s</span>
            <span><kbd>F</kbd> Projetar</span>
          </div>
        </aside>` : ''}
      </div>
      ${fsHud}

      ${!P.fullscreen ? `<div class="pj-strip" aria-label="Miniaturas dos slides">
        ${deck.slides.map((sl, i) => `<button type="button" class="pj-thumb ${i === idx ? 'on' : ''}" onclick="AMAProjector.jumpSlide(${i})">
          <span>${String(i + 1).padStart(2, '0')}</span>
          <b>${esc(sl.title)}</b>
        </button>`).join('')}
      </div>` : ''}`;
    }

    const qrModal = P.shareModalUrl ? (() => {
      const qr = window.Study && window.Study.QR && typeof window.Study.QR.renderQrSvg === 'function'
        ? window.Study.QR.renderQrSvg(P.shareModalUrl, { size: 220, fg: '#00217e', bg: '#ffffff', label: `QR Code de ${deck.title}` })
        : '';
      return `<div class="pj-modal-bg" role="dialog" aria-modal="true" aria-label="Partilhar apresentação com QR Code" onclick="AMAProjector.closeShareModal()">
        <div class="pj-modal-card" onclick="event.stopPropagation()">
          <div class="pj-modal-head">
            <div><span class="pj-kicker">PARTILHA EM SALA · QR OFFLINE</span><h3>${esc(deck.title)}</h3></div>
            <button type="button" class="icon-btn" aria-label="Fechar" onclick="AMAProjector.closeShareModal()">✕</button>
          </div>
          <p class="pj-modal-sub">Os estudantes podem apontar a câmara do telemóvel para o ecrã do projetor para abrir estes slides imediatamente.</p>
          <div class="pj-qr-box" data-testid="projector-qr-box">${qr}</div>
          <div class="pj-voice-row" style="margin-top:12px">
            <input id="pj-share-url-in" readonly value="${escAttr(P.shareModalUrl)}" onclick="this.select()">
            <button type="button" class="btn btn-p btn-sm" onclick="AMAProjector.copyShareUrl()">📋 Copiar</button>
          </div>
        </div>
      </div>`;
    })() : '';

    const shortcutsModal = P.showShortcuts ? `<div class="pj-modal-bg" role="dialog" aria-modal="true" aria-label="Atalhos de teclado do Projetor" onclick="AMAProjector.toggleShortcuts()">
      <div class="pj-modal-card pj-modal-keys" onclick="event.stopPropagation()">
        <div class="pj-modal-head">
          <div><span class="pj-kicker">MODO DOCENTE</span><h3>Atalhos de Teclado</h3></div>
          <button type="button" class="icon-btn" aria-label="Fechar" onclick="AMAProjector.toggleShortcuts()">✕</button>
        </div>
        <div class="pj-keys-grid">
          <div><kbd>←</kbd> <kbd>→</kbd> / <kbd>Espaço</kbd><span>Mudar slide / revelar passo</span></div>
          <div><kbd>F</kbd><span>Projetar em ecrã inteiro</span></div>
          <div><kbd>G</kbd><span>Grelha visual de slides</span></div>
          <div><kbd>Q</kbd><span>Abrir QR Code para a turma</span></div>
          <div><kbd>V</kbd><span>Narrar aula em voz alta</span></div>
          <div><kbd>N</kbd><span>Mostrar / ocultar notas</span></div>
          <div><kbd>P</kbd><span>Pulso rápido da turma</span></div>
          <div><kbd>S</kbd><span>Revelar pontos 1-a-1</span></div>
          <div><kbd>D</kbd> / <kbd>C</kbd><span>Caneta no slide / limpar</span></div>
          <div><kbd>L</kbd><span>Ligar / desligar laser auto</span></div>
          <div><kbd>B</kbd><span>Cortina de atenção</span></div>
          <div><kbd>T</kbd><span>Cronómetro 60 segundos</span></div>
          <div><kbd>E</kbd><span>Editar slide atual</span></div>
          <div><kbd>R</kbd><span>Alternar Modo Leitura</span></div>
          <div><kbd>?</kbd><span>Mostrar esta ajuda</span></div>
          <div><kbd>Esc</kbd><span>Sair / fechar janela</span></div>
        </div>
      </div>
    </div>` : '';

    return `<div class="pj-workspace ${P.fullscreen ? 'is-fs-overlay' : ''}" onclick="if(window.AMAProjector&&AMAProjector.closeMore)AMAProjector.closeMore()">${!P.fullscreen ? toolbar : ''}${body}${qrModal}${shortcutsModal}</div>`;
  }

  function wrapShell(inner) {
    if (S && S.user) {
      const m = S.user.papel === 'ADMIN' ? MENU.admin : S.user.papel === 'INSTRUCTOR' ? MENU.instrutor : MENU.aluno;
      return panelShell('projetor', inner, m);
    }
    return shellPublic(`<div class="pj-public-wrap">${inner}</div>`, 'projetor');
  }

  function projectorRouteView({ q }) {
    if (!S_() || !S_().buildProjectorDeck) {
      waitForStudy(() => { if (/^#\/projetor/.test(location.hash)) render(); });
      return wrapShell('<div class="spinner"></div>');
    }
    if (sessionStorage.getItem('ama-pj-prefill')) {
      P.showCreator = true;
      P.creatorTab = 'direct';
    }
    if (q && q.deck && (!P.deck || P.deck.id !== q.deck)) {
      const localFound = loadDecks().find((d) => String(d.id) === String(q.deck));
      if (localFound) {
        P.deck = localFound;
        P.slideIdx = 0;
        P.mode = 'slides';
        P.showCreator = false;
      } else if (!P._loadingDeckId || P._loadingDeckId !== q.deck) {
        P._loadingDeckId = q.deck;
        fetch('/api/mvp?resource=decks').then((r) => r.ok ? r.json() : null).then((json) => {
          const rec = (json && Array.isArray(json.records) ? json.records : []).find((x) => String(x.id) === String(q.deck));
          const dk = rec && (rec.data || rec.payload || rec);
          if (dk && Array.isArray(dk.slides)) {
            P.deck = dk;
            P.slideIdx = 0;
            P.mode = 'slides';
            P.showCreator = false;
            saveDeck(dk);
            render();
          }
        }).catch(() => {});
      }
    }
    if (q && q.rec && (!P.deck || P.deck.sourceRecId !== q.rec)) {
      const rec = loadNotebooks().find((r) => r.id === q.rec);
      if (rec) {
        const deck = buildDeck({
          title: rec.title,
          subject: rec.subject,
          text: rec.text,
          sourceName: `Caderno ${brandName()}`,
          author: (S && S.user && S.user.nome) || '',
        });
        if (deck && deck.ok) {
          deck.sourceRecId = rec.id;
          P.deck = deck;
          P.slideIdx = 0;
          P.mode = 'slides';
          P.showCreator = false;
          saveDeck(deck);
        }
      }
    }
    const header = (!P.fullscreen && (!P.deck || P.showCreator)) ? `<div class="page-h pj-page-h-calm">
      <div>
        <span class="eyebrow-t">${I.play} ${nucleoName()} · PROJETOR INTELIGENTE</span>
        <h1 style="margin-top:6px">Projetor PDF → Slides</h1>
      </div>
      <div class="flex wrap" style="gap:8px">
        <a class="btn btn-o btn-sm" href="#/quiz">${I.quiz} Quiz</a>
        <a class="btn btn-o btn-sm" href="#/catalogo">Cursos</a>
      </div>
    </div>` : '';

    const main = (P.deck && !P.showCreator)
      ? renderDeckWorkspace(P.deck)
      : `${renderCreatorPanel()}${P.deck ? `<div style="margin-top:20px">${renderDeckWorkspace(P.deck)}</div>` : ''}`;

    return wrapShell(header + main);
  }

  /* ------------------------------------------------------------------ */
  /* API Pública AMAProjector                                           */
  /* ------------------------------------------------------------------ */
  const AMAProjector = {
    build(params) { return buildDeck(params); },
    planToggled(open) { P.showPlan = !!open; },
    togglePlanPanel() { P.showPlan = !P.showPlan; P.moreOpen = false; render(); },
    toggleMore() { P.moreOpen = !P.moreOpen; render(); },
    closeMore() { if (P.moreOpen) { P.moreOpen = false; render(); } },
    setBrief(v) { P.brief = String(v || '').slice(0, 320); },
    toggleVoice(target = 'brief') {
      const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (!SR) {
        return toast('Reconhecimento de voz não suportado neste navegador — escreva a descrição no campo ao lado.');
      }
      if (P.voiceListening && activeSpeechRec) {
        try { activeSpeechRec.stop(); } catch { }
        P.voiceListening = false;
        render();
        return;
      }
      try {
        const rec = new SR();
        rec.lang = 'pt-PT';
        rec.continuous = false;
        rec.interimResults = true;
        activeSpeechRec = rec;
        P.voiceListening = true;
        P.voiceTarget = target;
        const baseText = target === 'slideImg'
          ? String((document.getElementById('pj-ed-imgq') || {}).value || '').trim()
          : String(P.brief || '').trim();
        toast('🎙 A ouvir… descreva como quer os slides e as imagens.');
        render();
        rec.onresult = (ev) => {
          let transcript = '';
          for (let i = 0; i < ev.results.length; i += 1) {
            transcript += ev.results[i][0].transcript + ' ';
          }
          const combined = `${baseText ? baseText + ' ' : ''}${transcript.trim()}`.trim().slice(0, 320);
          if (target === 'slideImg') {
            const inp = document.getElementById('pj-ed-imgq');
            if (inp) inp.value = combined;
          } else {
            P.brief = combined;
            const inp = document.getElementById('pj-brief');
            if (inp) inp.value = combined;
          }
        };
        rec.onerror = () => {
          P.voiceListening = false;
          activeSpeechRec = null;
          toast('Não foi possível captar áudio — verifique a permissão do microfone ou escreva a descrição.');
          render();
        };
        rec.onend = () => {
          P.voiceListening = false;
          activeSpeechRec = null;
          render();
          if (target === 'slideImg') {
            const val = String((document.getElementById('pj-ed-imgq') || {}).value || '').trim();
            if (val) AMAProjector.searchSlideImage();
          }
        };
        rec.start();
      } catch {
        P.voiceListening = false;
        toast('Microfone indisponível neste momento.');
        render();
      }
    },
    promptBrief() {
      P.moreOpen = false;
      const val = window.prompt(
        'Descreva como quer os slides e que tipo de imagens usar (ex.: "fotos reais de foguetões e carros, tema escuro, tom simples"):',
        P.brief || ''
      );
      if (val === null) return;
      P.brief = String(val || '').trim().slice(0, 320);
      if (P.deck) {
        toast('A aplicar a sua descrição e a procurar imagens coerentes…');
        enrichDeckWithWeb(P.deck, true).then(() => improveDeckWithAI(P.deck, true));
      } else {
        render();
      }
    },
    async searchSlideImage() {
      if (!P.deck) return;
      const slide = P.deck.slides[P.slideIdx];
      const web = window.Study && window.Study.SlideStudioWeb;
      const q = String((document.getElementById('pj-ed-imgq') || {}).value || slide?.title || '').trim();
      if (!q) return toast('Escreva ou fale o que quer ver na imagem deste slide.');
      if (!web || (typeof web.searchCoherentImages !== 'function' && typeof web.searchCoherentImage !== 'function')) return toast('Motor de imagens a carregar…');
      slide.visualPrompt = q;
      P.imgGalleryBusy = true;
      render();
      try {
        const list = typeof web.searchCoherentImages === 'function'
          ? await web.searchCoherentImages(q, { limit: 6 })
          : [await web.searchCoherentImage(q)].filter(Boolean);
        P.imgGalleryBusy = false;
        P.imgGallery = list;
        if (!list.length) {
          toast('Nenhuma foto adequada encontrada — tente outras palavras ou clique em «Usar 3D».');
          return render();
        }
        const img = list[0];
        slide.visual = img.url;
        slide.visualAlt = img.alt || q;
        slide.visualCredit = { text: img.credit || `Web · ${q}`, url: img.page || '' };
        if (slide.layout === 'cover') slide.webHero = { url: img.url, credit: img.credit || q };
        saveDeck(P.deck);
        toast(`${list.length} imagem(ns) encontrada(s) na web — clique em qualquer miniatura para trocar!`);
        render();
      } catch {
        P.imgGalleryBusy = false;
        toast('Sem ligação para pesquisar imagens neste momento.');
        render();
      }
    },
    pickGalleryImage(gi) {
      if (!P.deck || !Array.isArray(P.imgGallery)) return;
      const img = P.imgGallery[Number(gi) || 0];
      const slide = P.deck.slides[P.slideIdx];
      if (!img || !slide) return;
      slide.visual = img.url;
      slide.visualAlt = img.alt || slide.title;
      slide.visualCredit = { text: img.credit || 'Web Educativa', url: img.page || '' };
      if (slide.layout === 'cover') slide.webHero = { url: img.url, credit: img.credit || 'Web Educativa' };
      saveDeck(P.deck);
      toast('Imagem do slide atualizada!');
      render();
    },
    uploadSlideImage(input) {
      const file = input && input.files && input.files[0];
      if (!file || !P.deck) return;
      const slide = P.deck.slides[P.slideIdx];
      if (!slide) return;
      const reader = new FileReader();
      reader.onload = () => {
        const dataUrl = String(reader.result || '');
        if (!dataUrl) return;
        slide.visual = dataUrl;
        slide.visualAlt = file.name;
        slide.visualCredit = { text: `Imagem local · ${file.name}`, url: '' };
        if (slide.layout === 'cover') slide.webHero = { url: dataUrl, credit: file.name };
        saveDeck(P.deck);
        toast(`Foto «${file.name}» aplicada ao slide!`);
        render();
      };
      reader.readAsDataURL(file);
    },
    openPresenterWindow() {
      P.moreOpen = false;
      if (!P.deck) return toast('Abra uma apresentação primeiro.');
      const win = window.open('', 'ceu-presenter-view', 'width=900,height=640');
      if (!win) return toast('Permita pop-ups para abrir a Janela do Docente (ecrã secundário).');
      win.document.open();
      win.document.write(`<!doctype html><html lang="pt"><head><meta charset="utf-8"><title>Janela do Docente · CEU Academy</title>
        <style>
          *{box-sizing:border-box}body{margin:0;background:#071226;color:#eef6ff;font-family:system-ui,-apple-system,sans-serif;padding:22px;display:flex;flex-direction:column;gap:16px;min-height:100vh}
          header{display:flex;justify-content:space-between;align-items:center;border-bottom:1px solid rgba(142,200,255,.22);padding-bottom:12px}
          .pos{font:800 18px monospace;color:#7ee0ff}.clk{font:700 16px monospace;color:#b8f36b}
          main{display:grid;grid-template-columns:1.35fr .85fr;gap:16px;flex:1}
          .box{background:#0e2042;border:1px solid rgba(142,200,255,.24);border-radius:16px;padding:18px;display:flex;flex-direction:column;gap:10px}
          .tag{font:800 10px monospace;letter-spacing:.12em;color:#7ee0ff;text-transform:uppercase}
          h1{margin:0;font-size:22px;line-height:1.25}.notes{font-size:18px;line-height:1.65;color:#dcecff;white-space:pre-wrap}
          .nxt b{font-size:16px;display:block;margin-top:4px}.nxt small{color:#9fb6d4;font-size:13px}
          footer{display:flex;gap:10px;flex-wrap:wrap;justify-content:center;padding-top:8px}
          button{padding:11px 18px;border-radius:12px;border:1px solid rgba(255,255,255,.22);background:#122b59;color:#fff;font:700 14px system-ui;cursor:pointer}
          button.pri{background:#00a4dc;color:#041638;border-color:#00a4dc}button:hover{filter:brightness(1.12)}
        </style></head><body>
        <header><span class="pos" id="p-pos">Slide 1</span><b id="p-deck">${esc(P.deck.title)}</b><span class="clk" id="p-clk">00:00</span></header>
        <main>
          <section class="box"><span class="tag" id="p-kick">NOTAS DO DOCENTE</span><h1 id="p-title">—</h1><div class="notes" id="p-notes">A sincronizar…</div></section>
          <aside class="box nxt"><span class="tag">PRÓXIMO SLIDE</span><b id="p-nt">—</b><small id="p-ns"></small></aside>
        </main>
        <footer>
          <button onclick="send('prev')">← Anterior</button>
          <button class="pri" onclick="send('next')">Próximo Slide →</button>
          <button onclick="send('narrate')">🔊 Voz</button>
          <button onclick="send('pulse')">⚡ Pulso</button>
          <button onclick="send('blackout')">■ Cortina</button>
        </footer>
        <script>
          const ch = new BroadcastChannel('ceu-projector-sync');
          function send(cmd){ ch.postMessage({ cmd }); }
          ch.onmessage = (e) => {
            const d = e.data || {}; if (d.type !== 'state') return;
            document.getElementById('p-pos').textContent = 'Slide ' + (d.idx + 1) + ' / ' + d.total;
            document.getElementById('p-deck').textContent = d.deckTitle || '';
            document.getElementById('p-kick').textContent = d.kicker || 'SLIDE ACTUAL';
            document.getElementById('p-title').textContent = d.title || '';
            document.getElementById('p-notes').textContent = d.notes || '';
            document.getElementById('p-nt').textContent = d.nextTitle || '';
            document.getElementById('p-ns').textContent = d.nextSub || '';
          };
          let sec = 0; setInterval(() => { sec++; const m = String(Math.floor(sec/60)).padStart(2,'0'); const s = String(sec%60).padStart(2,'0'); document.getElementById('p-clk').textContent = m+':'+s; }, 1000);
          send('sync');
        </script></body></html>`);
      win.document.close();
      setTimeout(broadcastPresenterState, 250);
      toast('🖥 Janela do Docente aberta e sincronizada em tempo real!');
    },
    useSlide3D() {
      if (!P.deck) return;
      const slide = P.deck.slides[P.slideIdx];
      if (!slide) return;
      slide.visual = '';
      slide.visualCredit = null;
      if (slide.layout === 'cover') slide.webHero = null;
      saveDeck(P.deck);
      toast('Slide alternado para o modelo 3D interactivo coerente.');
      render();
    },
    stopNarrate() {
      P.narrating = false;
      if (P._autoPlayTimer) { clearTimeout(P._autoPlayTimer); P._autoPlayTimer = null; }
      try { if (window.speechSynthesis) window.speechSynthesis.cancel(); } catch { }
    },
    toggleNarrate() {
      P.moreOpen = false;
      if (P.narrating) {
        this.stopNarrate();
        toast('Auto-Aula pausada.');
        return render();
      }
      if (!P.deck) return;
      P.narrating = true;
      const advanceSlide = () => {
        if (!P.narrating || !P.deck) return;
        if (P.slideIdx < P.deck.slides.length - 1) {
          P.slideIdx += 1;
          broadcastPresenterState();
          render();
          setTimeout(speakCurrent, 500);
        } else {
          this.stopNarrate();
          toast('🎉 Auto-Aula concluída!');
          render();
        }
      };
      const speakCurrent = () => {
        if (!P.narrating || !P.deck) return;
        if (P._autoPlayTimer) { clearTimeout(P._autoPlayTimer); P._autoPlayTimer = null; }
        const sl = P.deck.slides[P.slideIdx];
        if (!sl) { this.stopNarrate(); render(); return; }
        if (sl.layout === 'scene-3d' && !P.tour3DRunning) {
          setTimeout(() => { if (P.narrating && !P.tour3DRunning) this.toggle3DTour(); }, 250);
        }
        const txt = String(sl.narration || sl.notes || sl.subtitle || sl.title || '').trim();
        const estMs = Math.max(5200, Math.min(14000, txt.length * 62));
        if (window.speechSynthesis && typeof SpeechSynthesisUtterance !== 'undefined' && txt) {
          try { window.speechSynthesis.cancel(); } catch { }
          const u = new SpeechSynthesisUtterance(txt);
          u.lang = /[a-z]/i.test(txt) && /\b(the|and|with|presentation|interview)\b/i.test(txt) ? 'en-US' : 'pt-PT';
          u.rate = 1.02;
          const voices = window.speechSynthesis.getVoices ? window.speechSynthesis.getVoices() : [];
          const matchVoice = voices.find((v) => v.lang && v.lang.toLowerCase().startsWith(u.lang.slice(0, 2).toLowerCase()));
          if (matchVoice) u.voice = matchVoice;
          let handled = false;
          u.onend = () => { if (!handled) { handled = true; clearTimeout(P._autoPlayTimer); advanceSlide(); } };
          u.onerror = () => { if (!handled) { handled = true; clearTimeout(P._autoPlayTimer); P._autoPlayTimer = setTimeout(advanceSlide, 4500); } };
          window.speechSynthesis.speak(u);
          P._autoPlayTimer = setTimeout(() => { if (!handled) { handled = true; advanceSlide(); } }, estMs + 2500);
        } else {
          P._autoPlayTimer = setTimeout(advanceSlide, estMs);
        }
      };
      toast('▶ Auto-Aula iniciada com voz e legendas ao vivo (prima V para parar).');
      render();
      speakCurrent();
    },
    togglePulse() {
      P.pulseOpen = !P.pulseOpen;
      if (P.pulseOpen) P.pulseVotes = { ok: 0, mid: 0, rev: 0 };
      P.moreOpen = false;
      render();
    },
    votePulse(kind) {
      if (!['ok', 'mid', 'rev'].includes(kind)) return;
      P.pulseVotes[kind] = (P.pulseVotes[kind] || 0) + 1;
      render();
    },
    moveSlide(delta) {
      if (!P.deck || !Array.isArray(P.deck.slides)) return;
      const to = P.slideIdx + delta;
      if (to < 0 || to >= P.deck.slides.length) return;
      const arr = P.deck.slides;
      [arr[P.slideIdx], arr[to]] = [arr[to], arr[P.slideIdx]];
      arr.forEach((s, i) => { s.index = i + 1; });
      P.slideIdx = to;
      saveDeck(P.deck);
      render();
    },
    addSlide() {
      if (!P.deck || !Array.isArray(P.deck.slides)) return;
      const newSlide = {
        id: `s-custom-${Date.now()}`,
        layout: 'bento-grid',
        kicker: 'NOVO PONTO',
        title: 'Novo Slide Personalizado',
        bullets: ['Ideia principal: escreva aqui o ponto central', 'Exemplo prático: ligue ao contexto da turma', 'Resumo: o que os alunos devem reter'],
        notes: 'Personalize este slide clicando nos campos acima ou peça uma imagem coerente.',
        narration: 'Vamos analisar este novo ponto adicionado pelo docente.',
        durationMin: 3,
      };
      const at = P.slideIdx + 1;
      P.deck.slides.splice(at, 0, newSlide);
      P.deck.slides.forEach((s, i) => { s.index = i + 1; });
      if (P.deck.stats) P.deck.stats.slides = P.deck.slides.length;
      P.slideIdx = at;
      saveDeck(P.deck);
      toast('Novo slide inserido! Edite o título, pontos ou imagem.');
      render();
    },
    deleteSlide() {
      if (!P.deck || !Array.isArray(P.deck.slides) || P.deck.slides.length <= 2) return;
      P.deck.slides.splice(P.slideIdx, 1);
      P.deck.slides.forEach((s, i) => { s.index = i + 1; });
      if (P.deck.stats) P.deck.stats.slides = P.deck.slides.length;
      P.slideIdx = Math.max(0, Math.min(P.slideIdx, P.deck.slides.length - 1));
      saveDeck(P.deck);
      toast('Slide removido.');
      render();
    },
    moveSlideAt(fromIdx, delta) {
      if (!P.deck || !Array.isArray(P.deck.slides)) return;
      const to = fromIdx + delta;
      if (to < 0 || to >= P.deck.slides.length) return;
      const arr = P.deck.slides;
      [arr[fromIdx], arr[to]] = [arr[to], arr[fromIdx]];
      arr.forEach((s, i) => { s.index = i + 1; });
      if (P.slideIdx === fromIdx) P.slideIdx = to;
      saveDeck(P.deck);
      render();
    },
    duplicateSlideAt(idx) {
      if (!P.deck || !Array.isArray(P.deck.slides) || !P.deck.slides[idx]) return;
      const copy = JSON.parse(JSON.stringify(P.deck.slides[idx]));
      copy.id = `s-dup-${Date.now()}`;
      copy.title = `${copy.title || 'Slide'} (cópia)`.slice(0, 65);
      P.deck.slides.splice(idx + 1, 0, copy);
      P.deck.slides.forEach((s, i) => { s.index = i + 1; });
      if (P.deck.stats) P.deck.stats.slides = P.deck.slides.length;
      saveDeck(P.deck);
      toast('Slide duplicado.');
      render();
    },
    deleteSlideAt(idx) {
      if (!P.deck || !Array.isArray(P.deck.slides) || P.deck.slides.length <= 2) return;
      P.deck.slides.splice(idx, 1);
      P.deck.slides.forEach((s, i) => { s.index = i + 1; });
      if (P.deck.stats) P.deck.stats.slides = P.deck.slides.length;
      P.slideIdx = Math.max(0, Math.min(P.slideIdx, P.deck.slides.length - 1));
      saveDeck(P.deck);
      toast('Slide removido.');
      render();
    },
    setTransition(tr) {
      P.transition = ['slide', 'fade', 'zoom', 'none'].includes(tr) ? tr : 'slide';
      try { localStorage.setItem('ceu-pj-trans', P.transition); } catch { }
      render();
    },
    toggleShortcuts() {
      P.moreOpen = false;
      P.showShortcuts = !P.showShortcuts;
      render();
    },
    closeShareModal() {
      P.shareModalUrl = '';
      render();
    },
    async copyShareUrl() {
      const url = P.shareModalUrl;
      if (!url) return;
      try {
        if (navigator.clipboard && navigator.clipboard.writeText) {
          await navigator.clipboard.writeText(url);
          return toast('🔗 Link partilhável copiado!');
        }
      } catch { }
      const el = document.getElementById('pj-share-url-in');
      if (el) { el.select(); document.execCommand?.('copy'); toast('🔗 Link selecionado para copiar.'); }
    },
    publishToCampusClass() {
      P.moreOpen = false;
      if (!P.deck) return;
      saveDeck(P.deck);
      if (window.CEUCampus && typeof window.CEUCampus.publishLesson === 'function') {
        const classes = window.CEUCampus.listClasses ? window.CEUCampus.listClasses() : [];
        const first = classes[0];
        const summary = (P.deck.slides || []).slice(0, 3).map((s) => s.title).filter(Boolean).join(' · ');
        window.CEUCampus.publishLesson({
          turmaId: first ? first.id : 'cls-uan-eng1',
          titulo: P.deck.title || 'Aula em Slides 3D',
          tipo: 'Slides 3D',
          deckId: P.deck.id,
          resumo: `${P.deck.slides.length} slides gerados no Projetor IA: ${summary}`,
          slidesText: (P.deck.reading && P.deck.reading.fullText) || summary,
          subject: P.deck.subject || 'geral',
          autor: (typeof S !== 'undefined' && S.user && S.user.nome) || `Docente ${brandName()}`,
        });
        render();
        return;
      }
      toast('Abra Campus & Turmas para publicar esta aula.');
    },
    async shareDeck() {
      P.moreOpen = false;
      if (!P.deck) return;
      saveDeck(P.deck);
      const url = `${location.origin}${location.pathname}#/projetor?deck=${encodeURIComponent(P.deck.id)}`;
      P.shareModalUrl = url;
      render();
      try {
        if (navigator.clipboard && navigator.clipboard.writeText) {
          await navigator.clipboard.writeText(url);
          toast('📱 QR Code aberto & link copiado para partilhar com a turma!');
        }
      } catch { }
    },
    async exportBackup() {
      P.moreOpen = false;
      const db = window.Study && window.Study.MvpDB;
      if (!db || typeof db.exportFullBackup !== 'function') return toast('Base de dados MVP a carregar…');
      const snap = await db.exportFullBackup();
      const blob = new Blob([JSON.stringify(snap, null, 2)], { type: 'application/json;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `ceu-academy-backup-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      setTimeout(() => { URL.revokeObjectURL(url); a.remove(); }, 1500);
      toast('Backup completo da base de dados descarregado (.json).');
    },
    setLinks(v) { P.extraLinks = String(v || ''); },
    enrich() { if (P.deck) enrichDeckWithWeb(P.deck, true); },
    improveAI() { if (P.deck) improveDeckWithAI(P.deck, true); },
    configGeminiKey() {
      const ai = window.Study && window.Study.AI;
      if (!ai || typeof ai.setGeminiKey !== 'function') return toast('Motor de IA a carregar…');
      const cur = ai.getGeminiKey ? ai.getGeminiKey() : '';
      const val = window.prompt(
        'Cole a sua chave Google Gemini API (opcional — guardada só neste navegador para síntese LLM avançada; deixe vazio para remover):',
        cur ? '••••••••••••' : ''
      );
      if (val === null) return;
      if (val === '••••••••••••') return;
      ai.setGeminiKey(val.trim());
      toast(val.trim() ? 'Chave Gemini guardada localmente. A reprocessar aula com IA…' : 'Chave Gemini removida — a usar Chrome AI / Síntese Local.');
      if (val.trim() && P.deck) improveDeckWithAI(P.deck, true);
    },
    set3DMode(mode) {
      if (active3DCtrl && typeof active3DCtrl.setMode === 'function') active3DCtrl.setMode(mode);
      if (P.deck && P.deck.slides[P.slideIdx]) P.deck.slides[P.slideIdx].mode3d = mode;
    },
    toggle3DExplode() {
      P.explode3D = P.explode3D ? 0 : 1;
      if (active3DCtrl && typeof active3DCtrl.setExplode === 'function') active3DCtrl.setExplode(P.explode3D);
      render();
    },
    toggle3DSpin() {
      if (active3DCtrl && typeof active3DCtrl.toggleSpin === 'function') active3DCtrl.toggleSpin();
    },
    toggle3DTour() {
      if (tour3DId) {
        clearInterval(tour3DId);
        tour3DId = null;
        P.tour3DRunning = false;
        if (active3DCtrl && typeof active3DCtrl.setExplode === 'function') active3DCtrl.setExplode(0);
        toast('Explicação guiada 3D pausada.');
        return render();
      }
      const slide = P.deck && P.deck.slides[P.slideIdx];
      const nodes = (slide && slide.nodes3d) || [];
      if (!nodes.length || !active3DCtrl) return;
      P.tour3DRunning = true;
      let cur = 0;
      const visit = () => {
        if (!P.tour3DRunning || !active3DCtrl) return;
        P.selected3DNode = cur;
        if (typeof active3DCtrl.focusNode === 'function') active3DCtrl.focusNode(cur);
        else AMAProjector.select3DNode(cur);
        cur = (cur + 1) % nodes.length;
      };
      render();
      setTimeout(() => {
        visit();
        tour3DId = setInterval(visit, 3400);
      }, 60);
      toast('▶ Explicação dinâmica 3D em curso — a câmara foca cada conceito automaticamente.');
    },
    setCreatorTab(tab) {
      P.creatorTab = tab === 'chatgpt' ? 'chatgpt' : 'direct';
      render();
    },
    openChatGPTTab() {
      P.moreOpen = false;
      P.showCreator = true;
      P.creatorTab = 'chatgpt';
      P.fullscreen = false;
      document.body.classList.remove('pj-is-fs');
      render();
    },
    async copyExternalPrompt(includeText = false) {
      const ai = window.Study && window.Study.AI;
      let promptText = ai && typeof ai.getExternalAIPrompt === 'function' ? ai.getExternalAIPrompt(P.brief) : '';
      if (!promptText) return toast('Motor de IA a carregar…');
      if (includeText) {
        const rawSrc = (Array.isArray(P.pendingPages) && P.pendingPages.length ? P.pendingPages.map((p) => p.text).join('\n\n') : '')
          || (P.deck && P.deck.reading && P.deck.reading.fullText) || '';
        if (rawSrc.trim()) {
          promptText += `\n\n--- CONTEÚDO DO MEU FICHEIRO ---\n${rawSrc.trim().slice(0, 7500)}`;
        }
      }
      try {
        if (navigator.clipboard && navigator.clipboard.writeText) {
          await navigator.clipboard.writeText(promptText);
          return toast(includeText ? '📋 Prompt + texto do ficheiro copiados! Cole directamente no ChatGPT/Gemini.' : '📋 Prompt CEU-3D copiado! Cole no ChatGPT/Gemini juntamente com o seu PDF.');
        }
      } catch { }
      window.prompt('Copie o prompt pré-definido:', promptText);
    },
    loadSuperIADemo() {
      const sample = JSON.stringify({
        title: 'Energia Solar & Transição Energética em Angola',
        subject: 'fisica',
        docType: 'aula',
        theme: 'ceu',
        slides: [
          { layout: 'cover', kicker: 'SUPER-IA · CEU ACADEMY', title: 'Energia Solar em Angola', subtitle: 'Como a radiação solar abundante transforma escolas, hospitais e indústria em energia limpa.', imageQuery: 'solar energy space sunlight' },
          { layout: 'stat-spotlight', kicker: 'POTENCIAL NACIONAL', title: 'Um dos maiores potenciais solares de África', heroStat: { value: '2.200 h/ano', label: 'Insolação Média', context: 'Angola recebe radiação solar intensa praticamente todo o ano, reduzindo custos com geradores.' }, bullets: ['Autonomia energética: ideal para polos universitários e zonas rurais', 'Sustentabilidade: zero emissões durante a produção eléctrica'] },
          { layout: 'bento-grid', kicker: 'COMO FUNCIONA', title: 'Do fotão à tomada em 4 ideias simples', bullets: ['Efeito fotovoltaico: a luz liberta electrões nas placas de silício', 'Inversor inteligente: transforma corrente contínua (DC) em alternada (AC)', 'Armazenamento: baterias garantem energia estável durante a noite', 'Atenção técnica: a inclinação e limpeza dos painéis elevam o rendimento até 20%'], imageQuery: 'solar panels electricity' },
          { layout: 'scene-3d', kicker: 'MODELO 3D VOLÁTIL', title: 'Fluxo Fotovoltaico Interactivo em 3D', subtitle: 'Clique em «▶ Explicar 3D» para a câmara percorrer automaticamente cada etapa do sistema.', scene3d: { shape: 'flow', centerLabel: 'SOLAR', nodes: [{ label: 'Fotões', short: 'hν', note: 'A radiação solar atinge a superfície semicondutora do painel.' }, { label: 'Silício', short: 'Si', note: 'Os electrões saltam de banda e criam corrente contínua (DC).' }, { label: 'Inversor', short: 'AC', note: 'Converte DC em corrente alternada compatível com a rede.' }, { label: 'Bateria', short: 'kWh', note: 'Armazena excedente diurno para uso nocturno contínuo.' }, { label: 'Campus', short: 'CEU', note: 'Alimenta salas digitais, projetores e laboratórios em Angola.' }], links: [[0, 1], [1, 2], [2, 3], [2, 4], [3, 4]] } },
          { layout: 'closing', kicker: 'SÍNTESE', title: 'O que levar desta aula', bullets: ['A energia solar é modular, escalável e ideal para o clima angolano', 'Dominar fotões → silício → inversor → rede resolve qualquer exercício base'], checkQuestions: ['Qual é a função exacta do inversor num sistema fotovoltaico?', 'Por que motivo o dimensionamento da bateria é decisivo para escolas?'] },
        ],
      }, null, 2);
      const ta = document.getElementById('pj-ext-json');
      if (ta) ta.value = sample;
      this.importExternalBlueprint();
    },
    async importExternalBlueprint() {
      const ai = window.Study && window.Study.AI;
      const web = window.Study && window.Study.SlideStudioWeb;
      if (!ai || typeof ai.buildDeckFromExternalBlueprint !== 'function') return toast('Motor Super-IA a carregar…');
      const raw = String((document.getElementById('pj-ext-json') || {}).value || '').trim();
      const deck = ai.buildDeckFromExternalBlueprint(raw, {
        author: (typeof S !== 'undefined' && S.user && S.user.nome) || `Docente ${brandName()}`,
        theme: P.theme,
        brand: document.documentElement.dataset.brand === 'ceu' ? 'Núcleo CEU' : 'Núcleo AMA',
      });
      if (!deck || !deck.ok) return toast(deck && deck.error ? deck.error : 'Cole o bloco JSON devolvido pelo ChatGPT.');
      if (deck.theme) P.theme = deck.theme;
      P.deck = deck;
      P.slideIdx = 0;
      P.mode = 'slides';
      P.showCreator = false;
      P.moreOpen = false;
      saveDeck(deck);
      toast(`✨ Apresentação Super-IA criada (${deck.slides.length} slides)! A procurar imagens em toda a web…`);
      render();

      // Para cada slide que trouxe imageQuery do ChatGPT, procurar imagem real aberta em toda a web (Openverse + NASA + Wikimedia)
      if (web && typeof web.searchCoherentImage === 'function') {
        P.webBusy = true;
        render();
        const imgSlides = deck.slides.filter((s) => s.visualPrompt && !['scene-3d', 'quiz', 'agenda'].includes(s.layout)).slice(0, 8);
        let foundCount = 0;
        await Promise.allSettled(imgSlides.map(async (sl) => {
          const img = await web.searchCoherentImage(sl.visualPrompt);
          if (img && img.url) {
            sl.visual = img.url;
            sl.visualAlt = img.alt || sl.title;
            sl.visualCredit = { text: img.credit || `Web · ${sl.visualPrompt}`, url: img.page || '' };
            if (sl.layout === 'cover') sl.webHero = { url: img.url, credit: img.credit || 'Web Educativa' };
            foundCount += 1;
          }
        }));
        P.webBusy = false;
        deck.synthesis = { ...(deck.synthesis || {}), imagesEmbedded: foundCount, has3D: true };
        saveDeck(deck);
        if (P.deck && P.deck.id === deck.id) render();
        if (foundCount) toast(`🌐 ${foundCount} imagem(ns) da web ligadas ao guião do ChatGPT!`);
      }
    },
    select3DNode(idx) {
      P.selected3DNode = Number(idx) || 0;
      const slide = P.deck && P.deck.slides[P.slideIdx];
      const nodes = (slide && slide.nodes3d) || [];
      const picked = nodes[P.selected3DNode];
      const card = document.getElementById('pj-3d-inspector');
      if (card && picked) {
        card.innerHTML = `<span class="pj-3d-tag">CONCEITO ${String(P.selected3DNode + 1).padStart(2, '0')} · 3D</span><strong>${esc(picked.label)}</strong><p>${esc(picked.note)}</p>`;
      }
      document.querySelectorAll('.pj-3d-pill').forEach((b, i) => b.classList.toggle('on', i === P.selected3DNode));
    },
    selectFormulaVar(idx) {
      P.activeFormulaVar = Number(idx) || 0;
      render();
    },
    setV3Opt(key, val) { P[key] = val; },
    setDocType(type) {
      P.docType = type || 'auto';
      if (!P.source) return render();
      const deck = buildDeck({ ...P.source, docType: P.docType });
      if (deck && deck.ok) {
        P.deck = deck;
        P.slideIdx = 0;
        saveDeck(deck);
        toast(`Ficheiro reinterpretado como ${(deck.docTypeMeta && deck.docTypeMeta.label) || type} (${deck.slides.length} slides).`);
      }
      render();
    },
    setPageRange(start, end) {
      if (start !== null) P.pageStart = Math.max(1, Number(start) || 1);
      if (end !== null) P.pageEnd = Math.max(P.pageStart, Number(end) || P.pageStart);
    },
    async reextractPdfRange() {
      const pdfEng = window.Study && window.Study.PDF;
      if (!P.pdfFile || !pdfEng || typeof pdfEng.extractPdfLayout !== 'function') return toast('Carregue um PDF primeiro.');
      const stEl = document.getElementById('pj-upload-st');
      const say = (m) => { P.uploadStatus = m; if (stEl) stEl.textContent = m; };
      try {
        say(`A extrair páginas ${P.pageStart}–${P.pageEnd}…`);
        const r = await pdfEng.extractPdfLayout(P.pdfFile, {
          startPage: P.pageStart,
          endPage: P.pageEnd,
          onProgress: (p) => say(`A processar pág. ${p.page} (${Math.round(p.progress * 100)}%)…`),
        });
        P.pdfMeta = r;
        P.isScanned = !!r.isScanned;
        P.pendingPages = r.pageTexts;
        const ta = document.getElementById('pj-text');
        if (ta) ta.value = r.text || '';
        say(r.isScanned ? r.warning : `Extraídas pág. ${P.pageStart}–${P.pageEnd} · ${r.headingsCount} títulos · ${r.wordCount} palavras.`);
        render();
      } catch (e) {
        say(e && e.message ? e.message : 'Falha ao re-extrair intervalo.');
      }
    },
    async runOcr() {
      const pdfEng = window.Study && window.Study.PDF;
      if (!P.pdfFile || !pdfEng || typeof pdfEng.runOcrOnPdf !== 'function') return toast('Carregue um PDF digitalizado primeiro.');
      const stEl = document.getElementById('pj-upload-st');
      const say = (m) => { P.uploadStatus = m; if (stEl) stEl.textContent = m; };
      try {
        say('A iniciar OCR local (PT/EN) nas páginas selecionadas…');
        const r = await pdfEng.runOcrOnPdf(P.pdfFile, {
          startPage: P.pageStart,
          endPage: Math.min(P.pageEnd, P.pageStart + 4),
          onProgress: (p) => say(p.status || `OCR pág. ${p.page}…`),
        });
        P.isScanned = !!r.isScanned;
        P.pendingPages = r.pageTexts;
        const ta = document.getElementById('pj-text');
        if (ta) ta.value = r.text || '';
        say(`OCR concluído · ${r.wordCount} palavras reconhecidas.`);
        render();
      } catch (e) {
        say(e && e.message ? e.message : 'OCR indisponível neste navegador.');
      }
    },
    buildOutlineFromForm() {
      const outEng = window.Study && window.Study.Outline;
      if (!outEng) return toast('Motor de roteiro a carregar…');
      const title = ((document.getElementById('pj-title') || {}).value || '').trim();
      const subject = (document.getElementById('pj-subject') || {}).value || 'geral';
      const text = ((document.getElementById('pj-text') || {}).value || '').trim();
      if (text.length < 40 && !(P.pendingPages && P.pendingPages.length)) {
        return toast('Carregue um PDF ou cole pelo menos 40 caracteres para gerar o roteiro.');
      }
      P.outline = outEng.buildEditableOutline({
        title,
        subject,
        text,
        pageTexts: P.pendingPages || [],
        sourceName: P.pendingSource || title || 'Material de Aula',
        level: P.eduLevel,
        language: P.eduLang,
        density: P.density,
        forcedDocType: P.docType,
      });
      toast(`Roteiro pronto com ${P.outline.cards.length} cartões — edite, reordene ou gere os slides!`);
      render();
    },
    moveOutline(idx, delta) {
      const outEng = window.Study && window.Study.Outline;
      if (!P.outline || !outEng) return;
      P.outline = outEng.moveOutlineCard(P.outline, idx, delta);
      render();
    },
    toggleOutline(cardId) {
      const outEng = window.Study && window.Study.Outline;
      if (!P.outline || !outEng) return;
      P.outline = outEng.toggleOutlineCard(P.outline, cardId);
      render();
    },
    editOutlineTitle(cardId, val) {
      const outEng = window.Study && window.Study.Outline;
      if (!P.outline || !outEng) return;
      P.outline = outEng.updateOutlineCard(P.outline, cardId, { title: String(val || '').trim().slice(0, 65) });
    },
    addOutlineCard() {
      const outEng = window.Study && window.Study.Outline;
      if (!P.outline || !outEng) return;
      P.outline = outEng.addOutlineCard(P.outline, {});
      render();
    },
    renderDeckFromOutline() {
      const outEng = window.Study && window.Study.Outline;
      if (!P.outline || !outEng) return;
      const deck = outEng.buildDeckFromOutline(P.outline, {
        author: (typeof S !== 'undefined' && S.user && S.user.nome) || `Docente ${brandName()}`,
        theme: P.theme,
      });
      if (window.Study && window.Study.AI && typeof window.Study.AI.synthesizeAndFuseDeck === 'function') {
        try { window.Study.AI.synthesizeAndFuseDeck(deck, null); } catch { }
      }
      if (window.Study && window.Study.Quality && typeof window.Study.Quality.optimizeTo100 === 'function') {
        try { window.Study.Quality.optimizeTo100(deck, { enforceCeuBrand: document.documentElement.dataset.brand === 'ceu' }); } catch { }
      }
      P.deck = deck;
      P.outline = null;
      P.slideIdx = 0;
      P.mode = 'slides';
      P.showCreator = false;
      saveDeck(deck);
      toast(`Apresentação gerada a partir do roteiro (${deck.slides.length} slides · ${deck.rubricScore || 100}/100)!`);
      render();
      enrichDeckWithWeb(deck).then(() => improveDeckWithAI(deck));
    },
    stepSlideScale(delta) {
      P.slideScale = Math.max(84, Math.min(124, P.slideScale + delta));
      render();
    },
    toggleTimer() {
      if (classTimerId) {
        clearInterval(classTimerId);
        classTimerId = null;
        P.timerRunning = false;
        P.timerSec = 60;
        render();
        return;
      }
      P.timerSec = 60;
      P.timerRunning = true;
      render();
      classTimerId = setInterval(() => {
        P.timerSec -= 1;
        if (P.timerSec <= 0) {
          clearInterval(classTimerId);
          classTimerId = null;
          P.timerRunning = false;
          P.timerSec = 60;
          toast('⏱ Tempo esgotado! Peça as respostas à turma.');
        }
        if (/^#\/projetor/.test(location.hash)) render();
      }, 1000);
    },
    optimizeTo100() {
      const q = window.Study && window.Study.Quality;
      if (!P.deck || !q || typeof q.optimizeTo100 !== 'function') return;
      const res = q.optimizeTo100(P.deck, { enforceCeuBrand: document.documentElement.dataset.brand === 'ceu' });
      saveDeck(P.deck);
      toast(`✦ Rubrica pedagógica otimizada: ${res.qualityScore}/100!`);
      render();
    },
    async exportPptx() {
      const exp = window.Study && window.Study.Export;
      if (!P.deck || !exp) return toast('Motor de exportação a carregar…');
      toast('A gerar ficheiro PowerPoint (.pptx) com estilo Ingenium…');
      try {
        const r = await exp.exportDeckToPptx(P.deck);
        toast(`PowerPoint exportado: ${r.fileName}`);
      } catch (e) {
        toast(e && e.message ? e.message : 'Erro ao exportar .pptx — tente HTML Offline ou PDF.');
      }
    },
    exportPrintPdf() {
      const exp = window.Study && window.Study.Export;
      if (!P.deck || !exp) return this.printDeck();
      exp.exportDeckToPrintPdf(P.deck);
      toast('Vista de impressão 16:9 (1 slide por página) aberta.');
    },
    exportOfflineHtml() {
      const exp = window.Study && window.Study.Export;
      if (!P.deck || !exp) return this.printDeck();
      const r = exp.exportDeckToOfflineHtml(P.deck);
      toast(`HTML offline (pronto para pen USB) guardado: ${r.fileName}`);
    },
    exportWorksheet() {
      const exp = window.Study && window.Study.Export;
      if (!P.deck || !exp) return toast('Motor de Ficha do Aluno a carregar…');
      const r = exp.exportDeckWorksheet(P.deck, { includeAnswers: true });
      toast(`Ficha do Aluno + Chave de Correção guardada: ${r.fileName}`);
    },
    loadSample(key) {
      const eng = S_();
      const sample = SAMPLE_LECTURES[key];
      if (!eng || !eng.buildProjectorDeck || !sample) return toast('Motor do projetor a carregar…');
      const deck = buildDeck({
        title: sample.title,
        subject: sample.subject,
        pageTexts: sample.pageTexts,
        sourceName: sample.sourceName,
        theme: P.theme,
        author: (S && S.user && S.user.nome) || `Docente ${brandName()}`,
      });
      if (!deck || !deck.ok) return toast('Não foi possível criar a apresentação.');
      P.deck = deck;
      P.slideIdx = 0;
      P.mode = 'slides';
      P.showCreator = false;
      P.showPlan = true;
      saveDeck(deck);
      toast(`Apresentação pronta · ${deck.stats.slides} slides gerados de ${sample.sourceName}`);
      if (!/^#\/projetor/.test(location.hash)) go('/projetor');
      else render();
      enrichDeckWithWeb(deck).then(() => improveDeckWithAI(deck));
    },
    async handleFile(input) {
      const file = input && input.files && input.files[0];
      if (input) input.value = '';
      if (!file) return;
      const stEl = document.getElementById('pj-upload-st');
      const say = (msg) => { P.uploadStatus = msg; if (stEl) stEl.textContent = msg; };
      const mod = await import('./engine/file-import.js?v=4');
      const SUBJECT_FROM_FILE = {
        physics: 'fisica', math: 'matematica', algebra: 'matematica', chemistry: 'geral', general: 'geral',
        financas: 'financas', programacao: 'programacao', biologia: 'biologia', historia: 'historia', empreendedorismo: 'empreendedorismo',
      };
      const applyDetectedSubject = (text) => {
        const sel = document.getElementById('pj-subject');
        if (!sel) return;
        // Um título/disciplina escolhido pelo docente é sagrado; os valores
        // apenas inferidos de um ficheiro anterior podem ser substituídos.
        if (sel.value && sel.value !== 'geral' && !sel.dataset.autoSubject) return;
        const detected = SUBJECT_FROM_FILE[mod.suggestSubject(text)] || 'geral';
        if (detected !== 'geral') {
          sel.value = detected;
          sel.dataset.autoSubject = '1';
        }
      };
      const applyDetectedTitle = (ti, value) => {
        if (!ti) return value;
        ti.value = value;
        ti.dataset.autoTitle = '1';
        return value;
      };

      // DOCX / PPTX direct support via local office-import.js
      if (/\.(docx|pptx)$/i.test(file.name)) {
        try {
          say(`A ler documento Office ${file.name}…`);
          const office = await import('./engine/office-import.js?v=1');
          const r = await office.extractOfficeText(file);
          if (!r || !r.ok || !r.text) throw new Error('Não foi possível extrair texto deste ficheiro DOCX/PPTX.');
          P.pendingPages = Array.isArray(r.pages) && r.pages.length ? r.pages : null;
          P.pendingSource = file.name;
          const ti = document.getElementById('pj-title');
          const ta = document.getElementById('pj-text');
          const preferred = (ti && ti.value.trim() && !ti.dataset.autoTitle) ? ti.value.trim() : '';
          const titleVal = preferred || mod.inferImportTitle({ filename: file.name, text: r.text }) || file.name.replace(/\.[^.]+$/, '');
          applyDetectedTitle(ti, titleVal);
          if (ta) ta.value = r.text;
          applyDetectedSubject(r.text);
          say(`Office extraído (${r.text.length} caracteres). A gerar slides + fusão web…`);
          this.generateFromForm();
          return;
        } catch (err) {
          say(err && err.message ? err.message : 'Não foi possível ler o ficheiro DOCX/PPTX.');
          return;
        }
      }

      // Plain text / markdown direct support
      if (/\.(txt|md)$/i.test(file.name)) {
        try {
          const txt = await file.text();
          P.pendingPages = null;
          P.pendingSource = file.name;
          const ti = document.getElementById('pj-title');
          const ta = document.getElementById('pj-text');
          const preferred = (ti && ti.value.trim() && !ti.dataset.autoTitle) ? ti.value.trim() : '';
          const titleVal = preferred || mod.inferImportTitle({ filename: file.name, text: txt }) || file.name.replace(/\.[^.]+$/, '');
          applyDetectedTitle(ti, titleVal);
          if (ta) ta.value = txt;
          applyDetectedSubject(txt);
          say(`Texto carregado de ${file.name} (${txt.length} caracteres).`);
          this.generateFromForm();
          return;
        } catch {
          say('Não foi possível ler o ficheiro de texto.');
          return;
        }
      }

      // PDF via layout-aware pdf-engine.js (with heading detection, header/footer strip, page range, scanned detection)
      if (/\.pdf$/i.test(file.name) && window.Study && window.Study.PDF && typeof window.Study.PDF.extractPdfLayout === 'function') {
        try {
          P.pdfFile = file;
          P.isScanned = false;
          say(`A ler layout do PDF ${file.name} (${mod.formatFileSize(file.size)})…`);
          const meta = await window.Study.PDF.inspectPdfMetadata(file);
          P.pageStart = 1;
          P.pageEnd = meta.defaultEndPage;
          const r = await window.Study.PDF.extractPdfLayout(file, {
            startPage: P.pageStart,
            endPage: P.pageEnd,
            onProgress: (p) => say(`A extrair pág. ${p.page}/${p.total} (${Math.round(p.progress * 100)}%)…`),
          });
          P.pdfMeta = r;
          P.isScanned = !!r.isScanned;
          P.pendingPages = Array.isArray(r.pageTexts) && r.pageTexts.length ? r.pageTexts : null;
          P.pendingSource = file.name;
          const ti = document.getElementById('pj-title');
          const ta = document.getElementById('pj-text');
          const preferred = (ti && ti.value.trim() && !ti.dataset.autoTitle) ? ti.value.trim() : '';
          const titleVal = preferred || r.title || mod.filenameToTitle(file.name);
          applyDetectedTitle(ti, titleVal);
          if (ta) ta.value = r.text || '';
          applyDetectedSubject(r.text || '');
          if (r.isScanned) {
            say(r.warning);
            render();
            return;
          }
          say(`PDF pronto · ${r.totalPages} pág. (${r.headingsCount} títulos, ${r.strippedHeadersFooters} cabeçalhos removidos). A criar roteiro editável…`);
          this.buildOutlineFromForm();
          return;
        } catch (pdfErr) {
          say(`A tentar leitor alternativo… (${pdfErr && pdfErr.message ? pdfErr.message : 'fallback'})`);
        }
      }

      // PDF or image via local file-import.js (pdf.js + Tesseract)
      try {
        const check = mod.validateImportFile(file);
        if (!check.ok) { say(mod.importErrorMessage(check.code, 'pt', check.detail)); return; }
        say(`A extrair páginas de ${file.name} (${mod.formatFileSize(file.size)})…`);
        const r = await mod.extractFileText(file, {
          onProgress: (p) => say(`A processar ${file.name}… ${Math.round((p.progress || 0) * 100)}%`),
        });
        P.pendingPages = Array.isArray(r.pageTexts) && r.pageTexts.length ? r.pageTexts : null;
        P.pendingSource = file.name;
        const ti = document.getElementById('pj-title');
        const ta = document.getElementById('pj-text');
        const preferred = (ti && ti.value.trim() && !ti.dataset.autoTitle) ? ti.value.trim() : '';
        const titleVal = preferred || r.title || mod.filenameToTitle(file.name);
        applyDetectedTitle(ti, titleVal);
        if (ta) ta.value = r.text || '';
        applyDetectedSubject(r.text || '');
        say(`Extraído · ${r.pages || 1} página(s). A montar slides…`);
        const eng = S_();
        const subj = (document.getElementById('pj-subject') || {}).value || 'geral';
        const deck = buildDeck({
          title: titleVal,
          subject: subj,
          text: r.text || '',
          pageTexts: P.pendingPages || [],
          sourceName: file.name,
          theme: P.theme,
          author: (S && S.user && S.user.nome) || `Docente ${brandName()}`,
        });
        if (!deck || !deck.ok) {
          say('O ficheiro tinha pouco texto extraível. Reveja o campo à direita e tente novamente.');
          return;
        }
        P.deck = deck;
        P.slideIdx = 0;
        P.mode = 'slides';
        P.showCreator = false;
        saveDeck(deck);
        toast(`PDF convertido em ${deck.stats.slides} slides visuais.`);
        render();
        enrichDeckWithWeb(deck).then(() => improveDeckWithAI(deck));
      } catch (e) {
        say(e && e.message ? e.message : 'Erro ao ler o PDF neste navegador.');
      }
    },
    generateFromForm() {
      const eng = S_();
      if (!eng || !eng.buildProjectorDeck) return toast('Motor do projetor a carregar…');
      const title = ((document.getElementById('pj-title') || {}).value || '').trim();
      const subject = (document.getElementById('pj-subject') || {}).value || 'geral';
      const text = ((document.getElementById('pj-text') || {}).value || '').trim();
      const deck = buildDeck({
        title,
        subject,
        text,
        pageTexts: P.pendingPages || [],
        sourceName: P.pendingSource || 'Notas da Aula',
        theme: P.theme,
        author: (S && S.user && S.user.nome) || `Docente ${brandName()}`,
      });
      if (!deck || !deck.ok) return toast('Cole pelo menos 60 caracteres ou carregue um PDF para gerar slides.');
      P.deck = deck;
      P.slideIdx = 0;
      P.mode = 'slides';
      P.showCreator = false;
      P.showPlan = false;
      P.moreOpen = false;
      P.pendingPages = null;
      saveDeck(deck);
      toast(`Apresentação criada · ${deck.stats.slides} slides prontos.`);
      render();
      enrichDeckWithWeb(deck).then(() => improveDeckWithAI(deck));
    },
    fromSelectedNotebook() {
      const sel = document.getElementById('pj-nb-select');
      if (!sel || !sel.value) return;
      this.openFromNotebook(sel.value);
    },
    openFromNotebook(recId) {
      const rec = loadNotebooks().find((r) => r.id === recId);
      if (!rec) return toast('Caderno não encontrado.');
      const eng = S_();
      if (!eng || !eng.buildProjectorDeck) return go('/projetor?rec=' + encodeURIComponent(recId));
      const deck = buildDeck({
        title: rec.title,
        subject: rec.subject,
        text: rec.text,
        sourceName: 'Caderno AMA',
        theme: P.theme,
        author: (S && S.user && S.user.nome) || `Docente ${brandName()}`,
      });
      if (!deck || !deck.ok) return toast('Texto insuficiente para gerar slides.');
      deck.sourceRecId = rec.id;
      P.deck = deck;
      P.slideIdx = 0;
      P.mode = 'slides';
      P.showCreator = false;
      saveDeck(deck);
      if (!/^#\/projetor/.test(location.hash)) go('/projetor');
      else render();
    },
    openSaved(id) {
      const found = loadDecks().find((d) => d.id === id);
      if (!found) return;
      P.deck = found;
      P.slideIdx = 0;
      P.mode = 'slides';
      P.showCreator = false;
      render();
    },
    removeSaved(id) {
      deleteSavedDeck(id);
      if (P.deck && P.deck.id === id) { P.deck = null; P.showCreator = true; }
      toast('Apresentação removida.');
      render();
    },
    toggleCreator(on) {
      P.showCreator = !!on;
      P.fullscreen = false;
      document.body.classList.remove('pj-is-fs');
      render();
    },
    setMode(mode) {
      P.mode = mode;
      if (mode !== 'slides') {
        P.fullscreen = false;
        document.body.classList.remove('pj-is-fs');
      }
      render();
    },
    setTheme(theme) {
      P.theme = theme;
      P.moreOpen = false;
      render();
    },
    /* Reconstrói o deck com outra didática. O conteúdo vem sempre do ficheiro
       original guardado em P.source — nada é inventado fora do texto. */
    setLevel(level) {
      if (!['auto', 'basico', 'intermediario', 'avancado'].includes(level)) return;
      P.level = level;
      P.moreOpen = false;
      if (!P.source) return render();
      const deck = buildDeck(P.source);
      if (deck && deck.ok) {
        P.deck = deck;
        P.slideIdx = 0;
        saveDeck(deck);
        const lbl = (deck.teaching && deck.teaching.label) || level;
        toast(`Explicação adaptada ao nível ${lbl}. ${deck.slides.length} slides reconstruídos.`);
      }
      render();
    },
    /* Entrega o deck atual ao Modo Quiz. As perguntas são construídas a partir
       do mesmo texto extraído, mantendo coerência entre slides, notas e prática. */
    practiceDeck() {
      if (!P.deck) return toast('Gere primeiro uma apresentação a partir do ficheiro.');
      if (!window.AMAQuiz || !window.AMAQuiz.startProjectorDeck) return toast('Motor de quiz a carregar.');
      window.AMAQuiz.startProjectorDeck(P.deck);
    },
    /* Prepara o texto extraído para publicação local numa turma. A turma é
       escolhida pelo docente na página /turmas — nada é enviado para fora. */
    sendToClass() {
      if (!P.deck) return toast('Gere primeiro uma apresentação a partir do ficheiro.');
      const rd = P.deck.reading || {};
      try {
        sessionStorage.setItem('ama-uni-deck-prefill', JSON.stringify({
          title: P.deck.title,
          subject: P.deck.subject,
          sourceName: P.deck.sourceName || `Projetor ${brandName()}`,
          deckId: P.deck.id,
          text: String(rd.fullText || '').slice(0, 6000),
        }));
      } catch { return toast('Não foi possível preparar a publicação local.'); }
      go('/turmas');
      toast('Escolha a turma onde publicar esta aula.');
    },
    toggleNotes() {
      P.showNotes = !P.showNotes;
      P.moreOpen = false;
      render();
    },
    toggleRevealMode() {
      P.revealMode = !P.revealMode;
      P.revealStep = P.revealMode ? 1 : 99;
      P.moreOpen = false;
      toast(P.revealMode ? 'Modo Revelar 1-a-1 activado (prima Espaço ou → para revelar cada ponto).' : 'Todos os pontos visíveis ao mesmo tempo.');
      render();
    },
    toggleLaser() {
      P.laserOn = !P.laserOn;
      if (P.laserOn) P.drawOn = false;
      P.moreOpen = false;
      render();
    },
    toggleDraw() {
      P.drawOn = !P.drawOn;
      if (P.drawOn) P.laserOn = false;
      P.moreOpen = false;
      render();
    },
    setDrawColor(col) {
      P.drawColor = col || '#ff6b57';
      render();
    },
    clearDrawing() {
      if (!P.deck) return;
      const slide = P.deck.slides[P.slideIdx];
      const sid = (slide && slide.id) || `s-${P.slideIdx}`;
      delete P.drawings[sid];
      render();
    },
    toggleBlackout() {
      P.blackout = !P.blackout;
      P.moreOpen = false;
      render();
    },
    toggleEditSlide() {
      P.editingSlide = !P.editingSlide;
      if (P.editingSlide) P.fullscreen = false;
      P.moreOpen = false;
      render();
    },
    saveInlineEdit() {
      if (!P.deck) return;
      const slide = P.deck.slides[P.slideIdx];
      if (!slide) return;
      const ti = document.getElementById('pj-ed-title');
      const lay = document.getElementById('pj-ed-layout');
      const hand = document.getElementById('pj-ed-hand');
      const sub = document.getElementById('pj-ed-sub');
      const bul = document.getElementById('pj-ed-bullets');
      const nt = document.getElementById('pj-ed-notes');
      if (ti && ti.value.trim()) slide.title = ti.value.trim().slice(0, 65);
      if (lay && lay.value) slide.layout = lay.value;
      if (hand) { slide.handnote = hand.value.trim().slice(0, 42); slide.handNote = slide.handnote; }
      if (sub) {
        if (slide.intuition !== undefined) slide.intuition = sub.value.trim().slice(0, 200);
        else slide.subtitle = sub.value.trim().slice(0, 200);
      }
      if (bul) {
        const lines = bul.value.split(/\r?\n/).map((l) => l.trim()).filter(Boolean).slice(0, 4);
        if (slide.layout === 'animated-flow' || slide.layout === 'timeline') slide.steps = lines;
        else slide.bullets = lines;
      }
      if (nt) { slide.notes = nt.value.trim(); slide.teacherNote = slide.notes; }
      saveDeck(P.deck);
      render();
    },
    step(delta) {
      if (!P.deck) return;
      const slide = P.deck.slides[P.slideIdx];
      const revTotal = getSlideRevealTotal(slide);
      if (delta > 0 && P.revealMode && revTotal > 0 && P.revealStep < revTotal) {
        P.revealStep += 1;
        render();
        return;
      }
      if (delta < 0 && P.revealMode && P.revealStep > 1 && revTotal > 0) {
        P.revealStep -= 1;
        render();
        return;
      }
      const nextIdx = Math.max(0, Math.min(P.deck.slides.length - 1, P.slideIdx + delta));
      if (nextIdx !== P.slideIdx) {
        P.slideIdx = nextIdx;
        P.revealStep = P.revealMode ? 1 : 99;
        P.blackout = false;
        P.imgGallery = [];
      }
      broadcastPresenterState();
      render();
    },
    jumpSlide(i) {
      if (!P.deck) return;
      P.slideIdx = Math.max(0, Math.min(P.deck.slides.length - 1, Number(i) || 0));
      P.revealStep = P.revealMode ? 1 : 99;
      P.blackout = false;
      P.imgGallery = [];
      P.mode = 'slides';
      broadcastPresenterState();
      render();
    },
    toggleFullscreen() {
      P.fullscreen = !P.fullscreen;
      P.moreOpen = false;
      document.body.classList.toggle('pj-is-fs', P.fullscreen);
      if (P.fullscreen) {
        P.mode = 'slides';
        P.editingSlide = false;
        P.showNotes = false;
        try {
          if (document.documentElement.requestFullscreen && !document.fullscreenElement) {
            document.documentElement.requestFullscreen().catch(() => { });
          }
        } catch { }
      } else {
        P.blackout = false;
        try {
          if (document.fullscreenElement && document.exitFullscreen) {
            document.exitFullscreen().catch(() => { });
          }
        } catch { }
      }
      render();
    },
    setReadTheme(t) { P.readTheme = t; render(); },
    setReadLine(l) { P.readLine = l; render(); },
    stepReadScale(delta) {
      P.readScale = Math.max(85, Math.min(135, P.readScale + delta));
      render();
    },
    jumpSection(secId) {
      const el = document.getElementById(secId);
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    },
    /* Exportação fiel: todos os layouts do ecrã também existem no HTML
       impresso, com fonte/página, notas e um guia final do docente. */
    printSlideHtml(sl, deck, i, total) {
      const formula = sl.formula || sl.highlight || '';
      const src = sl.page
        ? `${deck.sourceName ? deck.sourceName + ' · ' : ''}p.${sl.page}`
        : (deck.sourceName || 'Núcleo AMA');
      let body = '';
      if (sl.layout === 'cover') {
        body = `${sl.subtitle ? `<p class="lead">${esc(sl.subtitle)}</p>` : ''}
          ${sl.meta ? `<p class="cover-meta">${deck.stats.slides} slides · ~${deck.stats.estMinutes} min · ${deck.stats.pages} bloco(s)${sl.meta.author ? ' · ' + esc(sl.meta.author) : ''}</p>` : ''}`;
      } else if (sl.layout === 'agenda') {
        body = `${sl.subtitle ? `<p>${esc(sl.subtitle)}</p>` : ''}
          <div class="agenda-grid">${(sl.bullets || []).map((b, n) => `<div><span>${String(n + 1).padStart(2, '0')}</span><b>${esc(b)}</b></div>`).join('')}</div>`;
      } else if (sl.layout === 'objectives') {
        body = `<ul class="objectives">${(sl.bullets || []).map((b) => `<li>${esc(b)}</li>`).join('')}</ul>`;
      } else if (sl.layout === 'closing') {
        body = `<div class="closing-cols">
          <div><b>Ideias para levar</b><ul>${(sl.bullets || []).map((b) => `<li>${esc(b)}</li>`).join('')}</ul></div>
          <div class="ask"><b>Verificação em sala</b><ol>${(sl.checkQuestions || []).map((q) => `<li>${esc(q)}</li>`).join('')}</ol></div>
        </div>`;
      } else if (sl.layout === 'mindmap') {
        body = `<div class="mm"><b>${esc(sl.center || deck.title)}</b><ul>${(sl.nodes || []).map((n) => `<li><b>${esc(n.term)}</b>${n.note ? ` — ${esc(n.note)}` : ''}</li>`).join('')}</ul></div>`;
      } else if (sl.layout === 'web-spotlight') {
        body = `<p class="ext">EXTERNO · A WEB ACRESCENTA — o ficheiro do docente continua a ser a verdade da aula.</p>
          <ul class="web">${(sl.items || []).map((w) => `<li><b>${esc(w.title)}</b> — ${esc(w.text)} <a href="${escAttr(w.url || '#')}">${esc(w.source || 'origem')}</a></li>`).join('')}
          ${(sl.places || []).map((p) => `<li><b>${esc(p.name)}</b> (local) — <a href="${escAttr(p.url || '#')}">origem</a></li>`).join('')}
          ${(sl.videos || []).map((v) => `<li><b>${esc(v.title || v.url)}</b> (vídeo) — <a href="${escAttr(v.url || '#')}">abrir</a></li>`).join('')}</ul>`;
      } else if (sl.layout === 'check') {
        body = `<p><b>${esc(sl.question || '')}</b></p><p class="qsrc">Resposta no ficheiro · discutir antes de avançar.</p>`;
      } else if (sl.layout === 'quiz') {
        body = `<p><b>${esc(sl.question || '')}</b></p><ol class="opts">${(sl.options || []).map((o) => `<li>${esc(o)}</li>`).join('')}</ol>` +
          (sl.explanation ? `<p class="qsrc">Resposta: ${esc(sl.explanation)}</p>` : '');
      } else if (formula) {
        body = `<div class="hl">${esc(formula)}</div>
          ${(sl.steps || []).length ? `<ol>${sl.steps.map((s) => `<li>${esc(s)}</li>`).join('')}</ol>` : ''}`;
      } else if (sl.layout === 'comparison' || (sl.left && sl.right)) {
        body = `<div class="cmp">
          <div><span>A</span><b>${esc(sl.left || '')}</b></div>
          <em>VS</em>
          <div><span>B</span><b>${esc(sl.right || '')}</b></div>
        </div>${(sl.bullets || []).length ? `<ul>${sl.bullets.map((b) => `<li>${esc(b)}</li>`).join('')}</ul>` : ''}`;
      } else if ((sl.layout === 'timeline' || (sl.steps || []).length) && !formula) {
        body = `<ol class="steps">${(sl.steps || []).map((s) => `<li>${esc(s)}</li>`).join('')}</ol>`;
      } else if (sl.quote) {
        body = `<blockquote>“${esc(sl.quote)}”</blockquote>
          <p class="qsrc">— ${esc(sl.source || deck.title)}</p>
          ${(sl.bullets || []).length ? `<ul>${sl.bullets.map((b) => `<li>${esc(b)}</li>`).join('')}</ul>` : ''}`;
      } else {
        if (sl.subtitle) body += `<p>${esc(sl.subtitle)}</p>`;
        if (sl.term) body += `<p class="term"><b>${esc(sl.term)}</b></p>`;
        if ((sl.bullets || []).length) {
          body += `<ul>${sl.bullets.map((b) => `<li>${esc(b)}</li>`).join('')}</ul>`;
        }
        if (sl.visualCredit) body += `<p class="img-credit">Imagem: ${esc(sl.visualCredit.text)} — ${esc(sl.visualCredit.url || '')}</p>`;
      }
      const ask = sl.layout === 'closing' ? '' : ((sl.checkQuestions || []).length
        ? `<div class="ask"><b>Verificação em sala</b><ol>${sl.checkQuestions.map((q) => `<li>${esc(q)}</li>`).join('')}</ol></div>` : '');
      return `<section class="slide lay-${escAttr(sl.layout || 'slide')}">
        <div class="head"><span class="k">${String(i + 1).padStart(2, '0')} / ${total} · ${esc(sl.kicker || '')}</span><span class="tag">${esc(sl.layout || 'slide')}</span></div>
        <h2>${esc(sl.title || '')}</h2>
        ${body}
        ${ask}
        ${sl.web ? `<div class="note ext-note"><b>A web acrescenta · EXTERNO:</b> ${esc(sl.web.text)} — <a href="${escAttr(sl.web.url || '#')}">${esc(sl.web.source || 'fonte')}</a></div>` : ''}
        ${sl.notes ? `<div class="note"><b>Notas do docente:</b> ${esc(sl.notes)}</div>` : ''}
        <footer>Fonte: ${esc(src)} · ${esc(brandName())} · ${String(i + 1).padStart(2, '0')}</footer>
      </section>`;
    },
    printGuideHtml(deck) {
      const rd = deck.reading || {};
      const checks = (rd.checkQuestions || []).concat(
        (deck.slides || []).flatMap((s) => s.checkQuestions || [])
      ).filter((v, i, arr) => v && arr.indexOf(v) === i).slice(0, 6);
      const teach = deck.teaching || {};
      return `<section class="slide extra">
        <div class="head"><span class="k">GUIA DO DOCENTE</span><span class="tag">plano rápido</span></div>
        <h2>Como ensinar esta aula</h2>
        ${teach.tip ? `<p><b>Nível ${esc(teach.label || '')}:</b> ${esc(teach.tip)}</p>` : ''}
        ${(deck.mnemonics || []).length ? `<h3>Truques de memória</h3><ul>${deck.mnemonics.map((m) => `<li><b>${esc(m.term)}:</b> ${esc(m.mnemonic)}</li>`).join('')}</ul>` : ''}
        ${(rd.definitions || []).length ? `<h3>Glossário do ficheiro</h3><ul>${rd.definitions.slice(0, 6).map((d) => `<li><b>${esc(d.term)}:</b> ${esc(d.sentence)}</li>`).join('')}</ul>` : ''}
        ${checks.length ? `<h3>Perguntas socráticas</h3><ol>${checks.map((q) => `<li>${esc(q)}</li>`).join('')}</ol>` : ''}
        <footer>Guia gerado localmente a partir de ${esc(deck.sourceName || deck.title)} · AMA</footer>
      </section>`;
    },
    printDeck() {
      if (!P.deck) return;
      const deck = P.deck;
      const html = `<!doctype html><html lang="pt"><head><meta charset="utf-8"><title>${esc(brandName())} Projetor · ${esc(deck.title)}</title>
        <style>
          @page{size:A4 landscape;margin:10mm}
          *{box-sizing:border-box}
          body{font-family:'Instrument Sans',system-ui,sans-serif;margin:0;padding:0;color:#12221c;background:#fff}
          .slide{position:relative;border:1px solid #d7dfd9;border-radius:14px;padding:24px 30px 54px;margin:0 auto 18px;
            max-width:1000px;min-height:168mm;page-break-after:always;break-after:page;display:flex;flex-direction:column}
          .head{display:flex;justify-content:space-between;gap:12px;align-items:center}
          .k{font:700 10px monospace;letter-spacing:.12em;text-transform:uppercase;color:#15704c}
          .tag{padding:3px 8px;border-radius:999px;background:#edf5da;color:#2d6a45;font:700 9px monospace;text-transform:uppercase}
          h2{font-size:26px;line-height:1.18;margin:10px 0 14px;color:#12221c}
          h3{font-size:14px;margin:14px 0 6px;color:#15704c}
          p,ul,ol{font-size:14px;line-height:1.55}
          ul,ol{padding-left:20px;margin:8px 0}
          .hl{background:#edf5da;padding:14px 18px;border-radius:10px;font:700 19px monospace;margin:10px 0;color:#173f2b}
          .cmp{display:grid;grid-template-columns:1fr auto 1fr;gap:12px;align-items:center;margin:10px 0}
          .cmp div{padding:14px;border:1px solid #d7dfd9;border-radius:10px;min-height:70px}
          .cmp span{display:block;font:700 9px monospace;color:#15704c;margin-bottom:6px}
          .cmp b{font-size:15px}
          .cmp em{font:800 12px monospace;color:#15704c}
          blockquote{margin:8px 0;padding:12px 16px;border-left:4px solid #15704c;background:#f4f7f3;font-size:17px;font-style:italic}
          .qsrc{font:600 11px monospace;color:#5c6f62}
          .term{font:700 13px monospace;color:#2d6a45}
          .ask{background:#f4f7f3;border:1px dashed #bfd0c4;border-radius:10px;padding:10px 14px;margin-top:10px}
          .ask b{font:800 10px monospace;text-transform:uppercase;color:#15704c}
          .ask ol{margin-bottom:0}
          .note{margin-top:auto;padding-top:10px;border-top:1px dashed #cfd8d1;font-size:11.5px;line-height:1.5;color:#485b50}
          footer{position:absolute;left:30px;right:30px;bottom:16px;border-top:1px solid #e5ebe6;padding-top:8px;
            font:600 9.5px monospace;color:#7b8c80;display:flex;justify-content:space-between}
          .extra{background:#fbfdfb}
          /* Cada layout do ecrã tem correspondência no papel — a exportação não
             pode transformar todos os slides na mesma lista de marcadores. */
          .lay-cover{background:linear-gradient(150deg,#f7fbf5,#eef5ea)}
          .lay-cover h2{font-size:40px;max-width:80%;margin:26px 0 14px}
          .lay-cover .lead{font-size:19px;line-height:1.45;max-width:82%;color:#31533e}
          .lay-cover .cover-meta{font:700 11px monospace;letter-spacing:.08em;text-transform:uppercase;color:#15704c;margin-top:22px}
          .lay-agenda .agenda-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:10px;margin-top:12px}
          .lay-agenda .agenda-grid div{display:flex;gap:10px;align-items:center;border:1px solid #d7dfd9;border-radius:8px;padding:10px 12px;background:#fff}
          .lay-agenda .agenda-grid span{font:800 13px monospace;color:#15704c}
          .lay-agenda .agenda-grid b{font-size:13.5px;line-height:1.3}
          .lay-concept .term{background:#edf5da;display:inline-block;padding:6px 12px;border-radius:6px;margin:4px 0 10px}
          .lay-split p:first-of-type{font-size:16px;color:#31533e;border-left:3px solid #15704c;padding-left:12px}
          .lay-closing .closing-cols{display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-top:10px}
          .lay-closing .closing-cols>div{border:1px solid #d7dfd9;border-radius:10px;padding:12px 16px;background:#fff}
          .lay-closing .closing-cols b{font:800 10px monospace;text-transform:uppercase;letter-spacing:.1em;color:#15704c}
          .lay-timeline ol.steps{list-style:none;padding:0;display:grid;gap:8px}
          .lay-timeline ol.steps li{position:relative;padding:10px 14px 10px 42px;border-left:3px solid #15704c;background:#f6faf4;border-radius:0 8px 8px 0;font-size:13.5px}
          .lay-timeline ol.steps li::before{content:counter(list-item,decimal-leading-zero);position:absolute;left:10px;top:10px;font:800 12px monospace;color:#15704c}
          .lay-quote blockquote{font-size:20px;max-width:84%}
           .mm{border:1px solid #d7dfd9;border-radius:10px;padding:14px 18px;background:#f7fbf5;margin:10px 0}
           .mm>b{font:800 12px monospace;color:#15704c;text-transform:uppercase;letter-spacing:.08em}
           .mm ul{display:grid;grid-template-columns:repeat(2,1fr);gap:6px;margin-bottom:0}
           .mm li{font-size:13px}
           .opts{list-style:upper-alpha;padding-left:24px}
           .objectives{display:grid;grid-template-columns:1fr 1fr;gap:8px;padding-left:0;list-style:none}
           .objectives li{padding:9px 12px;border-radius:8px;background:#f4f7f3;border:1px solid #d7dfd9;font-size:13px}
           .opts li{padding:6px 10px;border-radius:8px;background:#f4f7f3;margin-bottom:5px}
           .web li,.ext{padding:5px 0;font-size:12.5px}
           .ext-note{background:#f2f8ee;border-left:3px solid #15704c}
          @media print{.slide{border-color:#cbd5cd;box-shadow:none}}
        </style></head><body>
        ${deck.slides.map((sl, i) => this.printSlideHtml(sl, deck, i, deck.slides.length)).join('')}
        ${this.printGuideHtml(deck)}
        </body></html>`;
      const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `AMA-Slides-${deck.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 40)}.html`;
      document.body.appendChild(a);
      a.click();
      setTimeout(() => { URL.revokeObjectURL(url); a.remove(); }, 1500);
      toast('Apresentação exportada em HTML pronta para imprimir ou salvar como PDF.');
    },
  };

  window.AMAProjector = AMAProjector;
  on('/projetor', projectorRouteView);

  if (/^#\/projetor/.test(location.hash)) setTimeout(() => render(), 0);

  // Resposta do quiz do projetor — revelada só depois da escolha da turma.
  document.addEventListener('click', (ev) => {
    const btn = ev.target && ev.target.closest && ev.target.closest('.pj-quiz-option');
    if (!btn || !/^#\/projetor/.test(location.hash)) return;
    const box = btn.closest('.pj-layout-quiz');
    if (!box || box.dataset.answered === '1') return;
    box.dataset.answered = '1';
    const correct = Number(box.dataset.correct) || 0;
    const chosen = Number(btn.dataset.index);
    box.querySelectorAll('.pj-quiz-option').forEach((b, i) => {
      b.disabled = true;
      if (i === correct) b.classList.add('is-correct');
      else if (i === chosen) b.classList.add('is-wrong');
    });
    const reveal = box.querySelector('.pj-quiz-reveal');
    if (reveal) reveal.hidden = false;
  });

  document.addEventListener('fullscreenchange', () => {
    if (!document.fullscreenElement && P.fullscreen) {
      P.fullscreen = false;
      P.blackout = false;
      document.body.classList.remove('pj-is-fs');
      if (/^#\/projetor/.test(location.hash)) render();
    }
  });

  // Keyboard shortcuts for Projector Mode
  document.addEventListener('keydown', (ev) => {
    if (!/^#\/projetor/.test(location.hash) || !P.deck || P.showCreator) return;
    if (ev.metaKey || ev.ctrlKey || ev.altKey) return;
    const t = ev.target;
    if (t && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName))) return;
    const k = ev.key;
    const kl = k.toLowerCase();
    if (P.mode === 'slides' && (k === 'ArrowRight' || k === 'PageDown' || k === ' ')) {
      ev.preventDefault(); AMAProjector.step(1);
    } else if (P.mode === 'slides' && (k === 'ArrowLeft' || k === 'PageUp')) {
      ev.preventDefault(); AMAProjector.step(-1);
    } else if (kl === 'r') {
      ev.preventDefault(); AMAProjector.setMode(P.mode === 'reading' ? 'slides' : 'reading');
    } else if (kl === 'n' && P.mode === 'slides') {
      ev.preventDefault(); AMAProjector.toggleNotes();
    } else if (kl === 't' && P.mode === 'slides') {
      ev.preventDefault(); AMAProjector.toggleTimer();
    } else if (kl === 's' && P.mode === 'slides') {
      ev.preventDefault(); AMAProjector.toggleRevealMode();
    } else if (kl === 'l' && P.mode === 'slides') {
      ev.preventDefault(); AMAProjector.toggleLaser();
    } else if (kl === 'd' && P.mode === 'slides') {
      ev.preventDefault(); AMAProjector.toggleDraw();
    } else if (kl === 'c' && P.mode === 'slides' && P.drawOn) {
      ev.preventDefault(); AMAProjector.clearDrawing();
    } else if (kl === 'b' && P.mode === 'slides') {
      ev.preventDefault(); AMAProjector.toggleBlackout();
    } else if (kl === 'e' && P.mode === 'slides') {
      ev.preventDefault(); AMAProjector.toggleEditSlide();
    } else if (kl === 'v' && P.mode === 'slides') {
      ev.preventDefault(); AMAProjector.toggleNarrate();
    } else if (kl === 'p' && P.mode === 'slides') {
      ev.preventDefault(); AMAProjector.togglePulse();
    } else if (kl === 'g') {
      ev.preventDefault(); AMAProjector.setMode(P.mode === 'grid' ? 'slides' : 'grid');
    } else if (kl === 'q') {
      ev.preventDefault(); AMAProjector.shareDeck();
    } else if (k === '?') {
      ev.preventDefault(); AMAProjector.toggleShortcuts();
    } else if (kl === 'f') {
      ev.preventDefault(); AMAProjector.toggleFullscreen();
    } else if (k === 'Escape' && (P.shareModalUrl || P.showShortcuts || P.moreOpen || P.fullscreen || P.blackout)) {
      ev.preventDefault();
      if (P.shareModalUrl) { P.shareModalUrl = ''; render(); }
      else if (P.showShortcuts) { P.showShortcuts = false; render(); }
      else if (P.moreOpen) { P.moreOpen = false; render(); }
      else if (P.blackout) { P.blackout = false; render(); }
      else AMAProjector.toggleFullscreen();
    }
  });
})();
