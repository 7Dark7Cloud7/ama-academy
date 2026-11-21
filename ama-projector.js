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
  };

  const P = {
    deck: null,
    slideIdx: 0,
    mode: 'slides', // 'slides' | 'reading' | 'grid'
    theme: 'editorial', // 'editorial' | 'dark' | 'pine'
    showNotes: true,
    fullscreen: false,
    readTheme: 'paper', // 'paper' | 'sepia' | 'night'
    readScale: 100, // 85..135
    readLine: 'comfort', // 'compact' | 'comfort' | 'wide'
    showCreator: true,
    uploadStatus: '',
    pendingPages: null,
    pendingSource: '',
  };

  function S_() {
    return window.Study || null;
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
  }

  function deleteSavedDeck(id) {
    try {
      const list = loadDecks().filter((d) => d.id !== id);
      localStorage.setItem(DECKS_KEY, JSON.stringify(list));
    } catch { }
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
  /* Renderização do Slide Visual 16:9                                  */
  /* ------------------------------------------------------------------ */
  function renderSlideContent(slide, deck, index, total) {
    const numStr = `${String(index + 1).padStart(2, '0')} / ${String(total).padStart(2, '0')}`;
    const pct = Math.round(((index + 1) / Math.max(1, total)) * 100);
    let inner = '';

    if (slide.layout === 'cover') {
      inner = `<div class="pj-layout-cover">
        <div class="pj-cover-copy">
          <span class="pj-kicker">${esc(slide.kicker)}</span>
          <h2>${esc(slide.title)}</h2>
          ${slide.subtitle ? `<p class="pj-sub">${esc(slide.subtitle)}</p>` : ''}
          <div class="pj-cover-meta">
            <span><b>${deck.stats.slides}</b> slides</span><i>·</i>
            <span><b>~${deck.stats.estMinutes} min</b> estimados</span><i>·</i>
            <span><b>${deck.stats.pages}</b> bloco${deck.stats.pages === 1 ? '' : 's'}</span>
            ${slide.meta && slide.meta.author ? `<i>·</i><span>${esc(slide.meta.author)}</span>` : ''}
          </div>
        </div>
        ${slide.visual ? `<figure class="pj-cover-art"><img src="${escAttr(slide.visual)}" alt="Ilustração 3D da aula"></figure>` : ''}
      </div>`;
    } else if (slide.layout === 'agenda') {
      inner = `<div class="pj-layout-agenda">
        <span class="pj-kicker">${esc(slide.kicker)}</span>
        <h2>${esc(slide.title)}</h2>
        ${slide.subtitle ? `<p class="pj-sub">${esc(slide.subtitle)}</p>` : ''}
        <ol class="pj-agenda-grid">
          ${(slide.bullets || []).map((b, i) => `<li><span class="pj-ag-n">${String(i + 1).padStart(2, '0')}</span><strong>${esc(b)}</strong></li>`).join('')}
        </ol>
      </div>`;
    } else if (slide.layout === 'highlight') {
      inner = `<div class="pj-layout-highlight">
        <span class="pj-kicker">${esc(slide.kicker)}</span>
        <h2>${esc(slide.title)}</h2>
        <div class="pj-formula-card"><code>${esc(slide.highlight || '')}</code></div>
        ${(slide.bullets || []).length ? `<ul class="pj-bullets">${slide.bullets.map((b) => `<li>${esc(b)}</li>`).join('')}</ul>` : ''}
      </div>`;
    } else if (slide.layout === 'concept') {
      inner = `<div class="pj-layout-split">
        <div class="pj-split-copy">
          <span class="pj-kicker">${esc(slide.kicker)}</span>
          <h2>${esc(slide.title)}</h2>
          <p class="pj-concept-def">${esc(slide.subtitle || '')}</p>
          ${(slide.bullets || []).length ? `<ul class="pj-bullets">${slide.bullets.map((b) => `<li>${esc(b)}</li>`).join('')}</ul>` : ''}
        </div>
        ${slide.visual ? `<figure class="pj-split-art"><img src="${escAttr(slide.visual)}" alt="Visual do conceito"></figure>` : ''}
      </div>`;
    } else if (slide.layout === 'split') {
      inner = `<div class="pj-layout-split">
        <div class="pj-split-copy">
          <span class="pj-kicker">${esc(slide.kicker)}</span>
          <h2>${esc(slide.title)}</h2>
          ${slide.subtitle ? `<p class="pj-sub">${esc(slide.subtitle)}</p>` : ''}
          ${(slide.bullets || []).length ? `<ul class="pj-bullets">${slide.bullets.map((b) => `<li>${esc(b)}</li>`).join('')}</ul>` : ''}
        </div>
        ${slide.visual ? `<figure class="pj-split-art"><img src="${escAttr(slide.visual)}" alt="Síntese visual"></figure>` : ''}
      </div>`;
    } else if (slide.layout === 'closing') {
      inner = `<div class="pj-layout-closing">
        <span class="pj-kicker">${esc(slide.kicker)}</span>
        <h2>${esc(slide.title)}</h2>
        <div class="pj-closing-cols">
          <div class="pj-closing-col">
            <h3>Ideias para levar</h3>
            <ul class="pj-bullets">${(slide.bullets || []).map((b) => `<li>${esc(b)}</li>`).join('')}</ul>
          </div>
          <div class="pj-closing-col pj-check-box">
            <h3>Perguntas à turma</h3>
            <ol>${(slide.checkQuestions || []).map((q) => `<li>${esc(q)}</li>`).join('')}</ol>
          </div>
        </div>
      </div>`;
    } else {
      inner = `<div class="pj-layout-bullets">
        <span class="pj-kicker">${esc(slide.kicker)}</span>
        <h2>${esc(slide.title)}</h2>
        <ul class="pj-bullets pj-bullets-grid">${(slide.bullets || []).map((b, i) => `<li><span class="pj-b-idx">${String(i + 1).padStart(2, '0')}</span><span>${esc(b)}</span></li>`).join('')}</ul>
      </div>`;
    }

    return `<div class="pj-slide pj-theme-${escAttr(P.theme)}" data-testid="projector-slide" data-slide-index="${index}">
      <div class="pj-slide-inner">${inner}</div>
      <footer class="pj-slide-foot">
        <span class="pj-foot-brand">AMA · ${esc(deck.title)}</span>
        <span class="pj-foot-num">${numStr}</span>
      </footer>
      <div class="pj-slide-progress" aria-hidden="true"><i style="width:${pct}%"></i></div>
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

          ${(rd.definitions || []).length ? `<div class="pj-read-defs">
            <h3>Glossário extraído</h3>
            <dl>${rd.definitions.map((d) => `<dt>${esc(d.term)}</dt><dd>${esc(d.sentence)}</dd>`).join('')}</dl>
          </div>` : ''}

          ${(rd.sections || []).map((sec) => `
            <section class="pj-read-sec" id="${escAttr(sec.id)}">
              <span class="pj-read-pg">Secção ${sec.number} · Pág. ${sec.page}</span>
              <h2>${esc(sec.heading)}</h2>
              ${sec.paragraphs.map((p) => `<p>${esc(p)}</p>`).join('')}
            </section>
          `).join('')}
        </article>
      </div>
    </section>`;
  }

  /* ------------------------------------------------------------------ */
  /* Painel de Criação / Importação PDF                                 */
  /* ------------------------------------------------------------------ */
  function renderCreatorPanel() {
    const notebooks = loadNotebooks();
    const savedDecks = loadDecks();
    return `<section class="card pj-creator" data-testid="projector-creator">
      <div class="pj-creator-head">
        <div>
          <span class="eyebrow-t">${I.doc} CONVERSOR PDF → SLIDES VISUAIS</span>
          <h2 style="margin-top:6px">Envie um PDF ou notas de aula</h2>
          <p class="muted">Cada página do PDF é organizada automaticamente em slides visuais 16:9 com notas do docente e Modo Leitura — processado localmente neste navegador.</p>
        </div>
        <div class="pj-samples">
          <span>Testar com aula pronta:</span>
          <button type="button" class="btn btn-o btn-sm" onclick="AMAProjector.loadSample('fisica')">Física · Newton</button>
          <button type="button" class="btn btn-o btn-sm" onclick="AMAProjector.loadSample('financas')">Finanças · Kz</button>
          <button type="button" class="btn btn-o btn-sm" onclick="AMAProjector.loadSample('programacao')">Python · Algoritmos</button>
        </div>
      </div>

      <div class="pj-creator-grid">
        <div class="pj-dropzone">
          <label class="pj-drop-label" for="pj-file-input">
            <span class="pj-drop-ic">${I.doc}</span>
            <strong>Carregar PDF, imagem ou ficheiro de texto</strong>
            <small>Suporta .pdf (multi-página), .txt, .md, .png, .jpg · 100% no seu dispositivo</small>
            <span class="btn btn-f btn-sm" style="margin-top:8px">Selecionar ficheiro PDF</span>
            <input id="pj-file-input" type="file" accept=".pdf,.txt,.md,image/png,image/jpeg,image/webp" hidden onchange="AMAProjector.handleFile(this)">
          </label>
          <p class="pj-upload-st" id="pj-upload-st" aria-live="polite">${esc(P.uploadStatus || (P.pendingSource ? `Ficheiro pronto: ${P.pendingSource}` : ''))}</p>

          ${notebooks.length ? `<div class="field" style="margin-top:14px">
            <label for="pj-nb-select">Ou abrir caderno do Estúdio de Estudo</label>
            <div class="flex" style="gap:8px">
              <select id="pj-nb-select">${notebooks.map((r) => `<option value="${escAttr(r.id)}">${esc(r.title)}</option>`).join('')}</select>
              <button type="button" class="btn btn-o btn-sm" onclick="AMAProjector.fromSelectedNotebook()">Projetar</button>
            </div>
          </div>` : ''}
        </div>

        <div class="pj-text-form">
          <div class="st-grid-in">
            <div class="field"><label for="pj-title">Título da apresentação</label><input id="pj-title" maxlength="90" placeholder="Ex.: Dinâmica e Leis de Newton"></div>
            <div class="field"><label for="pj-subject">Disciplina</label>
              <select id="pj-subject">
                <option value="geral">Geral</option>
                <option value="matematica">Matemática</option>
                <option value="fisica">Física</option>
                <option value="programacao">Programação</option>
                <option value="financas">Finanças</option>
                <option value="empreendedorismo">Negócios &amp; Comunicação</option>
              </select>
            </div>
          </div>
          <div class="field">
            <label for="pj-text">Conteúdo extraído ou notas da aula</label>
            <textarea id="pj-text" rows="5" placeholder="Cole o texto da aula separado por parágrafos (ou importe um PDF à esquerda)…"></textarea>
          </div>
          <div class="flex wrap" style="gap:8px;align-items:center">
            <button type="button" class="btn btn-p" onclick="AMAProjector.generateFromForm()">${I.spark} Gerar Apresentação Visual</button>
            ${P.deck ? `<button type="button" class="btn btn-o btn-sm" onclick="AMAProjector.toggleCreator(false)">Voltar à apresentação atual</button>` : ''}
          </div>
        </div>
      </div>

      ${savedDecks.length ? `<div class="pj-saved-wrap">
        <h3>Apresentações guardadas neste navegador</h3>
        <div class="pj-saved-grid">
          ${savedDecks.slice(0, 4).map((dk) => `<div class="pj-saved-item">
            <button type="button" class="pj-saved-open" onclick="AMAProjector.openSaved('${escAttr(dk.id)}')">
              <strong>${esc(dk.title)}</strong>
              <small>${dk.stats.slides} slides · ~${dk.stats.estMinutes} min${dk.sourceName ? ` · ${esc(dk.sourceName)}` : ''}</small>
            </button>
            <button type="button" class="icon-btn" title="Apagar apresentação" aria-label="Apagar ${escAttr(dk.title)}" onclick="AMAProjector.removeSaved('${escAttr(dk.id)}')">${I.close}</button>
          </div>`).join('')}
        </div>
      </div>` : ''}
    </section>`;
  }

  /* ------------------------------------------------------------------ */
  /* Workspace do Projetor                                              */
  /* ------------------------------------------------------------------ */
  function renderDeckWorkspace(deck) {
    const idx = Math.max(0, Math.min(P.slideIdx, deck.slides.length - 1));
    P.slideIdx = idx;
    const slide = deck.slides[idx];

    const toolbar = `<div class="pj-toolbar" data-testid="projector-toolbar">
      <div class="pj-tb-left">
        <button type="button" class="btn btn-o btn-sm" onclick="AMAProjector.toggleCreator(true)">${I.plus} Novo PDF</button>
        <div class="pj-mode-seg" role="tablist" aria-label="Modo de visualização">
          <button type="button" role="tab" aria-selected="${P.mode === 'slides'}" class="${P.mode === 'slides' ? 'on' : ''}" onclick="AMAProjector.setMode('slides')">Slides</button>
          <button type="button" role="tab" aria-selected="${P.mode === 'reading'}" class="${P.mode === 'reading' ? 'on' : ''}" onclick="AMAProjector.setMode('reading')">Modo Leitura</button>
          <button type="button" role="tab" aria-selected="${P.mode === 'grid'}" class="${P.mode === 'grid' ? 'on' : ''}" onclick="AMAProjector.setMode('grid')">Grelha (${deck.slides.length})</button>
        </div>
      </div>
      <div class="pj-tb-right">
        ${P.mode !== 'reading' ? `<div class="pj-theme-seg" role="group" aria-label="Tema dos slides">
          <button type="button" class="${P.theme === 'editorial' ? 'on' : ''}" onclick="AMAProjector.setTheme('editorial')">Claro</button>
          <button type="button" class="${P.theme === 'dark' ? 'on' : ''}" onclick="AMAProjector.setTheme('dark')">Escuro</button>
          <button type="button" class="${P.theme === 'pine' ? 'on' : ''}" onclick="AMAProjector.setTheme('pine')">Pinho</button>
        </div>` : ''}
        ${P.mode === 'slides' ? `<button type="button" class="btn btn-o btn-sm ${P.showNotes ? 'is-on' : ''}" onclick="AMAProjector.toggleNotes()">Notas</button>` : ''}
        <button type="button" class="btn btn-o btn-sm" onclick="AMAProjector.printDeck()">Imprimir</button>
        <button type="button" class="btn btn-p btn-sm" onclick="AMAProjector.toggleFullscreen()">${P.fullscreen ? 'Sair ecrã inteiro' : 'Projetar'}</button>
      </div>
    </div>`;

    let body = '';
    if (P.mode === 'reading') {
      body = renderReadingMode(deck);
    } else if (P.mode === 'grid') {
      body = `<div class="pj-grid-view" data-testid="projector-grid">
        ${deck.slides.map((sl, i) => `<button type="button" class="pj-grid-card ${i === idx ? 'on' : ''}" onclick="AMAProjector.jumpSlide(${i})">
          <span class="pj-gc-n">${String(i + 1).padStart(2, '0')} · ${esc(sl.layout)}</span>
          <strong>${esc(sl.title)}</strong>
          <small>${esc(sl.subtitle || (sl.bullets && sl.bullets[0]) || sl.kicker)}</small>
        </button>`).join('')}
      </div>`;
    } else {
      body = `<div class="pj-stage-wrap ${P.fullscreen ? 'is-fs' : ''}">
        <div class="pj-stage-main">
          ${renderSlideContent(slide, deck, idx, deck.slides.length)}
          <div class="pj-nav-bar">
            <button type="button" class="btn btn-o btn-sm" ${idx === 0 ? 'disabled' : ''} onclick="AMAProjector.step(-1)">${I.back} Anterior</button>
            <span class="pj-nav-pos" data-testid="projector-counter">Slide <b>${idx + 1}</b> de ${deck.slides.length} · ~${slide.durationMin || 3} min</span>
            <button type="button" class="btn btn-p btn-sm" ${idx >= deck.slides.length - 1 ? 'disabled' : ''} onclick="AMAProjector.step(1)">Próximo ${I.arrow}</button>
          </div>
        </div>
        ${P.showNotes && !P.fullscreen ? `<aside class="card pj-notes" data-testid="projector-notes">
          <div class="pj-notes-h"><span>Notas do Docente</span><small>Slide ${idx + 1}</small></div>
          <p>${esc(slide.notes || 'Sem notas adicionais para este slide.')}</p>
          <div class="pj-notes-keys">
            <span><kbd>←</kbd><kbd>→</kbd> Navegar</span>
            <span><kbd>R</kbd> Leitura</span>
            <span><kbd>N</kbd> Notas</span>
            <span><kbd>F</kbd> Ecrã inteiro</span>
          </div>
        </aside>` : ''}
      </div>

      ${!P.fullscreen ? `<div class="pj-strip" aria-label="Miniaturas dos slides">
        ${deck.slides.map((sl, i) => `<button type="button" class="pj-thumb ${i === idx ? 'on' : ''}" onclick="AMAProjector.jumpSlide(${i})">
          <span>${String(i + 1).padStart(2, '0')}</span>
          <b>${esc(sl.title)}</b>
        </button>`).join('')}
      </div>` : ''}`;
    }

    return `<div class="pj-workspace ${P.fullscreen ? 'is-fs-overlay' : ''}">${toolbar}${body}</div>`;
  }

  function wrapShell(inner) {
    if (S && S.user) {
      const m = S.user.papel === 'ADMIN' ? MENU.admin : S.user.papel === 'INSTRUCTOR' ? MENU.instrutor : MENU.aluno;
      return panelShell('projetor', inner, m);
    }
    return shellPublic(`<div class="pj-public-wrap">${inner}</div>`, 'universidade');
  }

  function projectorRouteView({ q }) {
    if (!S_() || !S_().buildProjectorDeck) {
      waitForStudy(() => { if (/^#\/projetor/.test(location.hash)) render(); });
      return wrapShell('<div class="spinner"></div>');
    }
    if (q && q.rec && (!P.deck || P.deck.sourceRecId !== q.rec)) {
      const rec = loadNotebooks().find((r) => r.id === q.rec);
      if (rec) {
        const deck = S_().buildProjectorDeck({
          title: rec.title,
          subject: rec.subject,
          text: rec.text,
          sourceName: 'Caderno AMA',
          theme: P.theme,
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
    const header = !P.fullscreen ? `<div class="page-h">
      <div>
        <span class="eyebrow-t">${I.play} NÚCLEO AMA · PROJETOR DOCENTE</span>
        <h1 style="margin-top:6px">Projetor de Aulas &amp; Modo Leitura</h1>
        <p>Converta PDFs, sebentas ou notas de aula em apresentações visuais 16:9 prontas a projetar em sala, com notas do docente e Modo Leitura configurável.</p>
      </div>
      <div class="flex wrap" style="gap:8px">
        <a class="btn btn-o" href="#/quiz">${I.quiz} Modo Quiz</a>
        <a class="btn btn-o" href="#/universidade">${I.grad} Universidade</a>
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
    loadSample(key) {
      const eng = S_();
      const sample = SAMPLE_LECTURES[key];
      if (!eng || !eng.buildProjectorDeck || !sample) return toast('Motor do projetor a carregar…');
      const deck = eng.buildProjectorDeck({
        title: sample.title,
        subject: sample.subject,
        pageTexts: sample.pageTexts,
        sourceName: sample.sourceName,
        theme: P.theme,
        author: (S && S.user && S.user.nome) || 'Docente AMA',
      });
      if (!deck || !deck.ok) return toast('Não foi possível criar a apresentação.');
      P.deck = deck;
      P.slideIdx = 0;
      P.mode = 'slides';
      P.showCreator = false;
      saveDeck(deck);
      toast(`Apresentação pronta · ${deck.stats.slides} slides gerados de ${sample.sourceName}`);
      if (!/^#\/projetor/.test(location.hash)) go('/projetor');
      else render();
    },
    async handleFile(input) {
      const file = input && input.files && input.files[0];
      if (input) input.value = '';
      if (!file) return;
      const stEl = document.getElementById('pj-upload-st');
      const say = (msg) => { P.uploadStatus = msg; if (stEl) stEl.textContent = msg; };

      // Plain text / markdown direct support
      if (/\.(txt|md)$/i.test(file.name)) {
        try {
          const txt = await file.text();
          P.pendingPages = null;
          P.pendingSource = file.name;
          const ti = document.getElementById('pj-title');
          const ta = document.getElementById('pj-text');
          if (ti && !ti.value) ti.value = file.name.replace(/\.[^.]+$/, '').replace(/[_-]+/g, ' ');
          if (ta) ta.value = txt;
          say(`Texto carregado de ${file.name} (${txt.length} caracteres).`);
          this.generateFromForm();
          return;
        } catch {
          say('Não foi possível ler o ficheiro de texto.');
          return;
        }
      }

      // PDF or image via local file-import.js (pdf.js + Tesseract)
      try {
        const mod = await import('./engine/file-import.js');
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
        const titleVal = (ti && ti.value.trim()) || r.title || mod.filenameToTitle(file.name);
        if (ti) ti.value = titleVal;
        if (ta) ta.value = r.text || '';
        say(`Extraído · ${r.pages || 1} página(s). A montar slides…`);
        const eng = S_();
        const subj = (document.getElementById('pj-subject') || {}).value || 'geral';
        const deck = eng.buildProjectorDeck({
          title: titleVal,
          subject: subj,
          text: r.text || '',
          pageTexts: P.pendingPages || [],
          sourceName: file.name,
          theme: P.theme,
          author: (S && S.user && S.user.nome) || 'Docente AMA',
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
      const deck = eng.buildProjectorDeck({
        title,
        subject,
        text,
        pageTexts: P.pendingPages || [],
        sourceName: P.pendingSource || 'Notas da Aula',
        theme: P.theme,
        author: (S && S.user && S.user.nome) || 'Docente AMA',
      });
      if (!deck || !deck.ok) return toast('Cole pelo menos 60 caracteres ou carregue um PDF para gerar slides.');
      P.deck = deck;
      P.slideIdx = 0;
      P.mode = 'slides';
      P.showCreator = false;
      P.pendingPages = null;
      saveDeck(deck);
      toast(`Apresentação criada · ${deck.stats.slides} slides prontos.`);
      render();
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
      const deck = eng.buildProjectorDeck({
        title: rec.title,
        subject: rec.subject,
        text: rec.text,
        sourceName: 'Caderno AMA',
        theme: P.theme,
        author: (S && S.user && S.user.nome) || 'Docente AMA',
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
      render();
    },
    setMode(mode) {
      P.mode = mode;
      if (mode !== 'slides') P.fullscreen = false;
      render();
    },
    setTheme(theme) {
      P.theme = theme;
      render();
    },
    toggleNotes() {
      P.showNotes = !P.showNotes;
      render();
    },
    step(delta) {
      if (!P.deck) return;
      P.slideIdx = Math.max(0, Math.min(P.deck.slides.length - 1, P.slideIdx + delta));
      render();
    },
    jumpSlide(i) {
      if (!P.deck) return;
      P.slideIdx = Math.max(0, Math.min(P.deck.slides.length - 1, Number(i) || 0));
      P.mode = 'slides';
      render();
    },
    toggleFullscreen() {
      P.fullscreen = !P.fullscreen;
      if (P.fullscreen) P.mode = 'slides';
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
    printDeck() {
      if (!P.deck) return;
      const deck = P.deck;
      const html = `<!doctype html><html lang="pt"><head><meta charset="utf-8"><title>AMA Projetor · ${esc(deck.title)}</title>
        <style>
          body{font-family:'Instrument Sans',system-ui,sans-serif;margin:0;padding:24px;color:#12221c;background:#fff}
          .slide{border:1px solid #d7dfd9;border-radius:14px;padding:28px 34px;margin:0 auto 22px;max-width:860px;page-break-after:always;break-after:page}
          .k{font:700 11px monospace;letter-spacing:.12em;text-transform:uppercase;color:#15704c}
          h2{font-size:26px;margin:8px 0 12px}
          ul,ol{line-height:1.6;padding-left:20px}
          .hl{background:#edf5da;padding:16px 20px;border-radius:10px;font:700 20px monospace;margin:12px 0}
          .note{margin-top:16px;padding-top:10px;border-top:1px dashed #cfd8d1;font-size:12.5px;color:#485b50}
        </style></head><body>
        ${deck.slides.map((sl, i) => `<section class="slide">
          <div class="k">${String(i + 1).padStart(2, '0')} / ${deck.slides.length} · ${esc(sl.kicker)}</div>
          <h2>${esc(sl.title)}</h2>
          ${sl.subtitle ? `<p>${esc(sl.subtitle)}</p>` : ''}
          ${sl.highlight ? `<div class="hl">${esc(sl.highlight)}</div>` : ''}
          ${(sl.bullets || []).length ? `<ul>${sl.bullets.map((b) => `<li>${esc(b)}</li>`).join('')}</ul>` : ''}
          ${(sl.checkQuestions || []).length ? `<p><strong>Verificação em sala:</strong></p><ol>${sl.checkQuestions.map((q) => `<li>${esc(q)}</li>`).join('')}</ol>` : ''}
          ${sl.notes ? `<div class="note"><strong>Notas do docente:</strong> ${esc(sl.notes)}</div>` : ''}
        </section>`).join('')}
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

  // Keyboard shortcuts for Projector Mode
  document.addEventListener('keydown', (ev) => {
    if (!/^#\/projetor/.test(location.hash) || !P.deck || P.showCreator) return;
    if (ev.metaKey || ev.ctrlKey || ev.altKey) return;
    const t = ev.target;
    if (t && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName))) return;
    const k = ev.key;
    if (P.mode === 'slides' && (k === 'ArrowRight' || k === 'PageDown' || k === ' ')) {
      ev.preventDefault(); AMAProjector.step(1);
    } else if (P.mode === 'slides' && (k === 'ArrowLeft' || k === 'PageUp')) {
      ev.preventDefault(); AMAProjector.step(-1);
    } else if (k.toLowerCase() === 'r') {
      ev.preventDefault(); AMAProjector.setMode(P.mode === 'reading' ? 'slides' : 'reading');
    } else if (k.toLowerCase() === 'n' && P.mode === 'slides') {
      ev.preventDefault(); AMAProjector.toggleNotes();
    } else if (k.toLowerCase() === 'f') {
      ev.preventDefault(); AMAProjector.toggleFullscreen();
    } else if (k === 'Escape' && P.fullscreen) {
      ev.preventDefault(); P.fullscreen = false; render();
    }
  });
})();
