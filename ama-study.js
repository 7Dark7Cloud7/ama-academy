/* AMA — Aristides Miguel Academy · Núcleo AMA: Estúdio de Estudo, Revisão Espaçada e Oficina Docente.
   Camada clássica carregada depois de app.js: usa os motores determinísticos de
   engine/ (resumos, mapa de conceitos, SM-2, fichas, planos, rubricas, presenças)
   e guarda tudo no localStorage, sem enviar texto nem ficheiros para nenhum servidor. */
(function () {
  'use strict';

  const KEY = 'ama-study-v1';
  const SUBJECTS = [
    ['geral', 'Geral'], ['matematica', 'Matemática'], ['fisica', 'Física'], ['quimica', 'Química'],
    ['biologia', 'Biologia'], ['portugues', 'Língua Portuguesa'], ['historia', 'História'],
    ['geografia', 'Geografia'], ['ingles', 'Inglês'], ['programacao', 'Programação'],
    ['empreendedorismo', 'Empreendedorismo'], ['financas', 'Finanças'],
  ];
  const EXAMPLES = {
    financas: {
      title: 'Juro Composto e Inflação em Kwanzas',
      subject: 'financas',
      text: 'Juro composto é o rendimento calculado sobre o capital inicial somado aos juros acumulados nos períodos anteriores. A inflação é a subida generalizada dos preços que reduz o poder de compra do kwanza ao longo do tempo.\n\nPor exemplo, aplicar 100.000 Kz a 12% ao ano gera 12.000 Kz no primeiro ano, mas 13.440 Kz no segundo ano porque o juro incide sobre 112.000 Kz. Portanto, o tempo amplifica exponencialmente o capital investido.\n\nFundo de emergência é a reserva líquida equivalente a 3 a 6 meses de despesas fixas. Em resumo, só existe ganho real quando a taxa de rendimento supera a inflação anual.',
    },
    fisica: {
      title: 'Leis de Newton e Movimento Uniforme',
      subject: 'fisica',
      text: 'Movimento retilíneo uniforme é o deslocamento de um corpo em linha reta com velocidade constante e aceleração nula. A força resultante é a soma vetorial de todas as forças que atuam sobre um objeto.\n\nPela segunda lei de Newton, a força é igual ao produto da massa pela aceleração (F = m × a). Por exemplo, um veículo de 1000 kg que acelera a 2 m/s² requer uma força resultante de 2000 N. Logo, quanto maior a massa de um corpo, maior a sua inércia.\n\nEm resumo, força, massa e aceleração ligam-se diretamente e explicam como qualquer corpo altera o seu estado de movimento.',
    },
    programacao: {
      title: 'Algoritmos, Funções e Pesquisa Binária',
      subject: 'programacao',
      text: 'Algoritmo é uma sequência finita e ordenada de passos claros para resolver um problema computacional. Uma função é um bloco reutilizável de código que recebe entradas, processa dados e devolve um resultado.\n\nA pesquisa binária consiste em dividir repetidamente uma lista ordenada ao meio para localizar um elemento. Por exemplo, numa lista ordenada com 1000 registos de estudantes, a pesquisa binária encontra qualquer nome em no máximo 10 comparações porque elimina metade das hipóteses a cada passo.\n\nEm resumo, decompor problemas em funções e escolher algoritmos eficientes reduz erros e acelera qualquer aplicação.',
    },
  };
  const subjectLabel = (id) => (SUBJECTS.find((s) => s[0] === id) || ['', id])[1] || 'Geral';
  const uid = () => 'r' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
  const todayIso = () => new Date().toISOString().slice(0, 10);
  const fmtDay = (iso) => {
    if (!iso) return '';
    const d = new Date(iso + 'T00:00:00');
    if (Number.isNaN(d.getTime())) return iso;
    return d.toLocaleDateString('pt-AO', { weekday: 'short', day: '2-digit', month: 'short' });
  };
  const fmtShortDay = (iso, offset) => {
    if (offset === 0) return 'Hoje';
    if (offset === 1) return 'Amanhã';
    const d = new Date(iso + 'T00:00:00');
    if (Number.isNaN(d.getTime())) return iso.slice(5);
    return d.toLocaleDateString('pt-AO', { weekday: 'short' }).replace('.', '');
  };
  const fmtWhen = (iso) => {
    if (!iso) return '';
    const d = new Date(iso);
    return Number.isNaN(d.getTime()) ? '' : d.toLocaleDateString('pt-AO', { day: '2-digit', month: 'short', year: 'numeric' });
  };
  const S_ = () => window.Study || null;

  function store() {
    try {
      const raw = localStorage.getItem(KEY);
      const d = raw ? JSON.parse(raw) : null;
      if (d && Array.isArray(d.recs)) {
        if (!Array.isArray(d.attendance)) d.attendance = [];
        if (!Array.isArray(d.roster)) d.roster = [];
        return d;
      }
    } catch { }
    return { recs: [], attendance: [], roster: [] };
  }
  function save(d) {
    try { localStorage.setItem(KEY, JSON.stringify(d)); }
    catch { toast('Não foi possível guardar: o armazenamento deste navegador está cheio.'); }
  }
  const escAttr = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  function subjectOptions(current) {
    return SUBJECTS.map(([id, label]) => `<option value="${id}"${id === current ? ' selected' : ''}>${esc(label)}</option>`).join('');
  }

  /* ------------------------------------------------------------------ */
  /* Estado da vista de detalhe                                         */
  /* ------------------------------------------------------------------ */
  const VIEW = { recId: null, tab: 'sintese', mapNode: 0 };

  function ensureRichAnalysis(r) {
    const a = r && r.analysis;
    if (!a || a.insufficient) return a;
    if (a.conceptMap && a.activeRecall) return a;
    const S = S_();
    if (!S || !r.text) return a;
    try {
      const fresh = S.analyzeSummary({ text: r.text, title: r.title, subject: r.subject });
      if (fresh && !fresh.insufficient) return fresh;
    } catch { }
    return a;
  }

  function analyse(text, title, subject) {
    const S = S_();
    if (!S) return null;
    return S.analyzeSummary({ text: text || '', title: title || '', subject: subject || 'geral' });
  }

  /* ------------------------------------------------------------------ */
  /* Mapa de Conceitos SVG interativo                                   */
  /* ------------------------------------------------------------------ */
  function conceptMapBlock(a) {
    const cm = a.conceptMap || { center: a.title || 'Tema Central', nodes: [] };
    const nodes = cm.nodes || [];
    if (!nodes.length) {
      return '<div class="card st-block"><p class="muted">Sem termos suficientes para desenhar o mapa de conceitos.</p></div>';
    }
    const activeIdx = Math.min(VIEW.mapNode || 0, nodes.length - 1);
    const active = nodes[activeIdx];
    const cx = 320, cy = 175, rx = 215, ry = 122;
    const placed = nodes.map((n, i) => {
      const angle = (-Math.PI / 2) + (i * (Math.PI * 2)) / nodes.length;
      return { ...n, idx: i, x: Math.round(cx + Math.cos(angle) * rx), y: Math.round(cy + Math.sin(angle) * ry) };
    });
    const svg = `<svg class="cmap-svg" viewBox="0 0 640 350" role="img" aria-label="Mapa de conceitos de ${escAttr(cm.center)}">
      ${placed.map((p) => `<line x1="${cx}" y1="${cy}" x2="${p.x}" y2="${p.y}" class="cmap-edge ${p.idx === activeIdx ? 'on' : ''}"/>`).join('')}
      <g class="cmap-center">
        <rect x="${cx - 94}" y="${cy - 26}" width="188" height="52" rx="14"/>
        <text x="${cx}" y="${cy + 4}" text-anchor="middle">${esc(cm.center.length > 24 ? cm.center.slice(0, 23) + '…' : cm.center)}</text>
      </g>
      ${placed.map((p) => {
        const w = Math.max(108, Math.min(168, p.label.length * 7.6 + 26));
        return `<g class="cmap-node ${p.kind} ${p.idx === activeIdx ? 'on' : ''}" tabindex="0" role="button" onclick="AMAStudy.mapSelect(${p.idx})" onkeydown="if(event.key==='Enter'||event.key===' '){event.preventDefault();AMAStudy.mapSelect(${p.idx})}">
          <rect x="${p.x - w / 2}" y="${p.y - 19}" width="${w}" height="38" rx="10"/>
          <text x="${p.x}" y="${p.y + 4}" text-anchor="middle">${esc(p.label.length > 20 ? p.label.slice(0, 19) + '…' : p.label)}</text>
        </g>`;
      }).join('')}
    </svg>`;
    return `<div class="card st-block">
      <div class="st-block-head"><h3>Mapa de Conceitos</h3><span class="st-meta-inline">Toque num nó para inspecionar o contexto no texto</span></div>
      <div class="cmap-wrap">${svg}</div>
      <div class="cmap-detail" id="cmap-detail">
        <span class="cmap-kind">${active.kind === 'definition' ? 'Conceito definido' : 'Termo-chave'}</span>
        <strong>${esc(active.label)}</strong>
        <p>${esc(active.detail)}</p>
      </div>
    </div>`;
  }

  /* ------------------------------------------------------------------ */
  /* Renderização da análise (versão compacta ou caderno com abas)      */
  /* ------------------------------------------------------------------ */
  function analysisBody(a, opts = {}) {
    if (!a) return '<p class="muted">O Núcleo AMA ainda não carregou. Recarregue a página.</p>';
    if (a.insufficient) {
      return `<div class="card empty">${I.doc}<h3>Texto insuficiente</h3>
        <p>Preciso de pelo menos 120 caracteres e duas frases para analisar sem inventar. Cole mais conteúdo do material (${a.stats.words} palavras recebidas).</p></div>`;
    }
    const outline = (a.outline || []).map((b) => `
      <div class="st-outline-b"><h4>${esc(b.heading || 'Sem título')}</h4>
        <ul>${b.points.map((p) => `<li>${esc(p)}</li>`).join('')}</ul></div>`).join('');
    const defs = (a.definitions || []).map((d) => `<div class="st-def"><b>${esc(d.term)}</b><p>${esc(d.sentence)}</p></div>`).join('');
    const cards = (a.cards || []).map((c, i) => `<button type="button" class="st-card" onclick="this.classList.toggle('open')" aria-label="Virar cartão ${i + 1}">
      <small>${c.kind === 'cloze' ? 'Completar' : 'Definição'}</small><span class="st-front">${esc(c.front)}</span><span class="st-back">${esc(c.back)}</span></button>`).join('');
    const quiz = (a.quiz || []).map((q, i) => `<div class="st-quiz" data-q="${i}">
      <p class="st-qp">${esc(q.prompt)}</p>
      <div class="st-opts">${q.options.map((o, j) => `<button type="button" onclick="AMAStudy.quizPick(this,${j},${q.correct})" data-i="${j}">${esc(o)}</button>`).join('')}</div>
      <p class="st-exp" hidden>${esc(q.explanation || '')}</p></div>`).join('');
    const coverage = (a.coverage || []).map((c) => `<div class="st-cov-row ${c.ok ? 'ok' : ''}"><span>${c.ok ? '✓' : '○'}</span><p>${esc(c.hint)}</p></div>`).join('');
    const diffLabel = a.difficulty ? a.difficulty.label : '';
    const statsLine = `<div class="st-summary-strip">
      <span><b>${a.stats.words}</b> palavras</span><i>·</i>
      <span><b>${a.stats.sentences}</b> frases</span><i>·</i>
      <span><b>${a.stats.readingMinutes} min</b> leitura</span><i>·</i>
      ${diffLabel ? `<span>${esc(diffLabel)}</span><i>·</i>` : ''}
      <span><b>${(a.cards || []).length}</b> cartões</span><i>·</i>
      <span><b>${(a.quiz || []).length}</b> perguntas</span>
    </div>`;

    if (!opts.tabbed) {
      return `${statsLine}
        <div class="card st-block"><span class="eyebrow-t">${I.bulb} IDEIA CENTRAL</span><p class="st-lead">${esc(a.centralIdea || '')}</p></div>
        <div class="study-cols">
          <div class="card st-block"><h3>Pontos-chave</h3><ol class="st-list">${(a.keyIdeas || []).slice(0, 8).map((k) => `<li>${esc(k)}</li>`).join('')}</ol></div>
          <div class="card st-block"><h3>Definições</h3>${defs || '<p class="muted">O texto não define termos de forma explícita.</p>'}</div>
        </div>
        ${cards ? `<div class="card st-block"><h3>Cartões de revisão <small class="muted">· toque para virar</small></h3><div class="st-cards">${cards}</div></div>` : ''}
        ${quiz ? `<div class="card st-block"><h3>Quiz rápido</h3>${quiz}</div>` : ''}
        ${opts.extra || ''}`;
    }

    const tab = VIEW.tab || 'sintese';
    const rec = opts.record;
    const recallPrompts = (a.activeRecall || []).map((p) => `<div class="feynman-prompt">
      <span>${esc(p.stage)}</span>
      <strong>${esc(p.prompt)}</strong>
      ${p.hint ? `<details><summary>Ver pista do texto</summary><p>${esc(p.hint)}</p></details>` : ''}
    </div>`).join('');
    const feynmanNote = (rec && rec.progress && rec.progress.feynman) || '';

    return `${statsLine}
      <div class="st-tabs" role="tablist" aria-label="Modos de estudo">
        <button type="button" class="${tab === 'sintese' ? 'on' : ''}" onclick="AMAStudy.setTab('sintese')">Síntese &amp; Esquema</button>
        <button type="button" class="${tab === 'mapa' ? 'on' : ''}" onclick="AMAStudy.setTab('mapa')">Mapa de Conceitos <span>${((a.conceptMap && a.conceptMap.nodes) || []).length}</span></button>
        <button type="button" class="${tab === 'pratica' ? 'on' : ''}" onclick="AMAStudy.setTab('pratica')">Prática Ativa <span>${(a.cards || []).length + (a.quiz || []).length}</span></button>
        <button type="button" class="${tab === 'quiz' ? 'on' : ''}" onclick="AMAStudy.setTab('quiz')">Modo Quiz <span>${Math.min(8, Math.max(2, (a.quiz || []).length + (a.definitions || []).length))}</span></button>
      </div>

      ${tab === 'sintese' ? `
        <div class="card st-block"><span class="eyebrow-t">${I.bulb} IDEIA CENTRAL</span><p class="st-lead">${esc(a.centralIdea || '')}</p></div>
        <div class="study-cols">
          <div class="card st-block"><h3>Pontos-chave</h3><ol class="st-list">${(a.keyIdeas || []).slice(0, 8).map((k) => `<li>${esc(k)}</li>`).join('')}</ol></div>
          <div class="card st-block"><h3>Definições extraídas</h3>${defs || '<p class="muted">O texto não define termos de forma explícita.</p>'}</div>
        </div>
        ${outline ? `<div class="card st-block"><h3>Esquema estruturado</h3><div class="st-outline">${outline}</div></div>` : ''}
        <div class="study-cols">
          <div class="card st-block">
            <h3>Termos dominantes</h3>
            <div class="st-kw-list">${(a.keywords || []).map((k) => `<span class="st-kw"><b>${esc(k.term)}</b><em>${k.count}×</em></span>`).join('')}</div>
          </div>
          <div class="card st-block">
            <h3>Diagnóstico do apontamento</h3>
            <div class="st-cov">${coverage}</div>
          </div>
        </div>
      ` : ''}

      ${tab === 'mapa' ? conceptMapBlock(a) : ''}

      ${tab === 'pratica' ? `
        ${cards ? `<div class="card st-block"><h3>Cartões de memória <small class="muted">· toque para virar</small></h3><div class="st-cards">${cards}</div></div>` : ''}
        ${quiz ? `<div class="card st-block"><div class="st-block-head"><h3>Verificação rápida</h3><span id="st-quiz-score" class="st-meta-inline">0 / ${(a.quiz || []).length} respondidas</span></div>${quiz}</div>` : ''}
        <div class="card st-block feynman-box">
          <div class="st-block-head"><h3>Espaço Feynman · Explique sem consultar</h3><span class="st-meta-inline" id="st-feynman-st">${feynmanNote ? 'Guardado localmente' : 'Auto-avaliação ativa'}</span></div>
          ${recallPrompts ? `<div class="feynman-prompts">${recallPrompts}</div>` : ''}
          <div class="field" style="margin-top:12px">
            <label for="st-feynman-ta">A sua explicação por palavras próprias</label>
            <textarea id="st-feynman-ta" rows="4" placeholder="Escreva aqui a sua explicação simples do tema sem olhar às notas…" oninput="AMAStudy.saveFeynman('${escAttr(rec ? rec.id : '')}',this.value)">${esc(feynmanNote)}</textarea>
          </div>
        </div>
      ` : ''}

      ${tab === 'quiz' ? (window.AMAQuiz ? window.AMAQuiz.inlineTabHtml(rec) : '<div class="card st-block"><p class="muted">A carregar Modo Quiz…</p></div>') : ''}
      ${opts.extra || ''}`;
  }

  function planHtml() {
    const S = S_();
    if (!S) return '';
    const d = store();
    if (!d.recs.length) return '';
    const tasks = d.recs.map((r) => ({ title: 'Estudar: ' + r.title, subject: r.subject, duration: 30 }));
    const summaries = d.recs.map((r) => ({ id: r.id, title: r.title, subject: r.subject, href: '#/estudar/' + r.id }));
    let plan;
    try { plan = S.buildStudyPlan({ tasks, summaries, lang: 'pt' }); } catch { return ''; }
    if (!plan || !plan.sessions.length) return '';
    const days = {};
    plan.sessions.forEach((s) => { (days[s.date] = days[s.date] || []).push(s); });
    return `<div class="card st-block"><h3>Plano de estudo · próximos dias</h3>
      <p class="muted" style="font-size:13px">${esc(plan.note || 'Sessões curtas, alternando matérias, a partir dos resumos guardados.')}</p>
      <div class="st-plan">${Object.entries(days).map(([date, list]) => `<div class="st-plan-day">
        <b>${esc(fmtDay(date))}</b>${list.map((s) => `<span class="st-plan-i"><i></i>${esc(s.title)} <small>${s.duration} min</small></span>`).join('')}
      </div>`).join('')}</div></div>`;
  }

  /* ------------------------------------------------------------------ */
  /* Página /estudar                                                    */
  /* ------------------------------------------------------------------ */
  function meterText(text) {
    const len = String(text || '').trim().length;
    const words = (String(text || '').trim().match(/[\p{L}\p{N}]+/gu) || []).length;
    const ready = len >= 120;
    return {
      ready,
      text: ready
        ? `Pronto para análise · ${words} palavras · ${len} caracteres`
        : `${len}/120 caracteres mínimos · ${words} palavras`,
    };
  }

  function estudarView() {
    const d = store();
    let pre = null;
    try {
      pre = JSON.parse(sessionStorage.getItem('ama-uni-prefill') || 'null');
      sessionStorage.removeItem('ama-uni-prefill');
    } catch (e) { pre = null; }
    const cards = d.recs.reduce((n, r) => n + ((r.analysis && r.analysis.cards) || []).length, 0);
    const m = meterText(pre ? pre.text : '');
    const list = d.recs.length ? d.recs.slice().sort((a, b) => b.createdAt.localeCompare(a.createdAt)).map((r) => {
      const a = r.analysis || {};
      return `<div class="list-row st-row">
        <span class="st-ico">${I.doc}</span>
        <div class="t"><b>${esc(r.title)}</b><small>${esc(subjectLabel(r.subject))} · ${a.stats ? a.stats.words + ' palavras · ' : ''}${fmtWhen(r.createdAt)}</small></div>
        <button type="button" class="btn btn-f btn-sm" onclick="window.AMAQuiz?AMAQuiz.startNotebook('${r.id}'):go('/quiz?rec=${r.id}')">${I.quiz} Quiz</button>
        <a class="btn btn-o btn-sm" href="#/estudar/${r.id}">Abrir</a>
        <button class="icon-btn" title="Apagar resumo" onclick="AMAStudy.apagar('${r.id}')">${I.close}</button>
      </div>`;
    }).join('') : `<div class="card empty">${I.spark}<h3>Ainda sem apontamentos</h3><p>Cole o texto de uma aula, importe um PDF ou carregue um dos exemplos prontos à esquerda. O Núcleo AMA cria síntese, mapa de conceitos, cartões e quiz neste navegador.</p></div>`;

    return panelShell('estudar', `
      <div class="page-h"><div><h1>Estúdio de Estudo</h1><p>Núcleo AMA · transforme apontamentos em mapa de conceitos, cartões SM-2, Modo Quiz interativo e espaço Feynman — sem sair deste navegador.</p></div>
        <div class="flex wrap" style="gap:8px">
          <a class="btn btn-f" href="#/quiz">${I.quiz} Modo Quiz</a>
          <a class="btn btn-o" href="#/projetor">${I.play} Projetor</a>
          <a class="btn btn-o" href="#/revisao">${I.clock || I.quiz} Revisão SM-2</a>
        </div></div>
      <div class="st-summary-strip" style="margin-bottom:18px">
        <span><b data-count="${d.recs.length}">${d.recs.length}</b> caderno${d.recs.length === 1 ? '' : 's'}</span><i>·</i>
        <span><b data-count="${cards}">${cards}</b> cartões no baralho</span><i>·</i>
        <span>Processamento local determinístico</span>
      </div>
      <div class="st-grid">
        <div class="card st-form">
          <div class="st-form-head">
            <h3>Novo caderno de estudo</h3>
            <div class="st-examples">
              <span>Exemplos:</span>
              <button type="button" onclick="AMAStudy.loadExample('financas')">Finanças</button>
              <button type="button" onclick="AMAStudy.loadExample('fisica')">Física</button>
              <button type="button" onclick="AMAStudy.loadExample('programacao')">Programação</button>
            </div>
          </div>
          ${pre ? `<p class="st-prefill">${I.users} Conteúdo da sessão carregado. Reveja e gere o caderno.</p>` : ''}
          <div class="field"><label>Título</label><input id="st-title" maxlength="90" placeholder="Ex.: Juro Composto e Inflação" value="${pre ? esc(pre.title || '') : ''}"></div>
          <div class="field"><label>Matéria</label><select id="st-subject">${subjectOptions(pre ? pre.subject : 'geral')}</select></div>
          <div class="field">
            <label>Texto do material</label>
            <textarea id="st-text" rows="9" oninput="AMAStudy.updateMeter(this.value)" placeholder="Cole aqui o texto da aula, do manual ou das suas notas (mínimo 120 caracteres).">${pre ? esc(pre.text || '') : ''}</textarea>
            <div class="st-meter ${m.ready ? 'ok' : ''}" id="st-meter">${esc(m.text)}</div>
          </div>
          <div class="flex wrap" style="gap:8px;align-items:center">
            <button class="btn btn-p" onclick="AMAStudy.analisar()">${I.spark} Analisar no Núcleo AMA</button>
            <label class="btn btn-o btn-sm" style="cursor:pointer">${I.doc} Importar PDF/imagem<input type="file" accept=".pdf,image/png,image/jpeg,image/webp" hidden onchange="AMAStudy.importFile(this)"></label>
            <span id="st-file-st" class="muted" style="font-size:12.5px"></span>
          </div>
          <p class="muted" style="font-size:11.5px;margin-top:10px">A importação de PDFs e imagens usa OCR no seu dispositivo (carrega a biblioteca na primeira utilização). O texto nunca sai deste navegador.</p>
        </div>
        <div>
          <div class="card st-list-card"><h3>Os meus cadernos</h3>${list}</div>
          ${planHtml()}
        </div>
      </div>`, MENU.aluno);
  }

  async function estudarDetail(id) {
    const d = store();
    const r = d.recs.find((x) => x.id === id);
    if (!r) { toast('Caderno não encontrado.'); return go('/estudar'); }
    if (VIEW.recId !== id) { VIEW.recId = id; VIEW.tab = 'sintese'; VIEW.mapNode = 0; }
    const S = S_();
    const rich = ensureRichAnalysis(r);
    if (rich && rich !== r.analysis) { r.analysis = rich; save(d); }
    const body = analysisBody(rich, {
      tabbed: true,
      record: r,
      extra: `<div class="card st-block st-actions"><button class="btn btn-p" onclick="AMAStudy.setTab('quiz')">${I.quiz} Iniciar Modo Quiz</button>
        <button class="btn btn-f" onclick="window.AMAProjector?AMAProjector.openFromNotebook('${r.id}'):go('/projetor?rec=${r.id}')">${I.play} Projetar como Slides</button>
        <button class="btn btn-o" onclick="go('/revisao')">${I.clock || I.quiz} Rever cartões</button>
        <button class="btn btn-o" onclick="AMAStudy.exportSheet('${r.id}')">${I.doc} Exportar ficha</button>
        <button class="btn btn-o" onclick="AMAStudy.reanalisar('${r.id}')">${I.spark} Recalcular</button></div>`,
    });
    return panelShell('estudar', `
      <div class="page-h"><div><a class="lh-back" href="#/estudar" style="color:var(--muted)"><span class="lh-arr">${I.chev}</span> Estúdio de Estudo</a>
        <h1 style="margin-top:8px">${esc(r.title)}</h1>
        <p>${esc(subjectLabel(r.subject))} · ${fmtWhen(r.createdAt)} · ${S ? 'Núcleo AMA · análise local' : 'Núcleo AMA a carregar'}</p></div>
        <div class="flex wrap" style="gap:8px"><button class="btn btn-f btn-sm" onclick="AMAStudy.setTab('quiz')">${I.quiz} Modo Quiz</button><button class="btn btn-o btn-sm" onclick="window.AMAProjector?AMAProjector.openFromNotebook('${r.id}'):go('/projetor?rec=${r.id}')">${I.play} Projetar</button><a class="btn btn-o btn-sm" href="#/estudar">Novo caderno</a></div></div>
      ${body}`, MENU.aluno);
  }

  /* ------------------------------------------------------------------ */
  /* Revisão espaçada SM-2 + Previsão 7 dias                            */
  /* ------------------------------------------------------------------ */
  let RV = null;
  function queueFor(subject) {
    const S = S_();
    const d = store();
    const entries = d.recs.map((r) => ({ record: r, analysis: r.analysis }));
    try { return S.buildReviewQueue(entries, { subject: subject || 'all', limit: 20 }); }
    catch { return null; }
  }
  function forecastFor(subject) {
    const S = S_();
    if (!S || !S.reviewForecast) return null;
    const d = store();
    const entries = d.recs.map((r) => ({ record: r, analysis: r.analysis }));
    try { return S.reviewForecast(entries, { subject: subject || 'all', days: 7 }); }
    catch { return null; }
  }

  function revisaoView() {
    const S = S_();
    const q = queueFor(RV && RV.subject);
    if (!S || !q) return panelShell('revisao', '<div class="spinner"></div>', MENU.aluno);
    RV = { subject: (RV && RV.subject) || 'all', q, i: 0, revealed: false, done: 0 };
    const fc = forecastFor(RV.subject);
    const filt = `<div class="sc-pills" style="margin-bottom:16px">
      <button type="button" class="${RV.subject === 'all' ? 'on' : ''}" onclick="AMAStudy.rvFilter('all')">Todas</button>
      ${SUBJECTS.filter(([id]) => q.bySubject.some((b) => b.subject === id)).map(([id, label]) =>
      `<button type="button" class="${RV.subject === id ? 'on' : ''}" onclick="AMAStudy.rvFilter('${id}')">${esc(label)}</button>`).join('')}</div>`;
    const origens = q.records.slice(0, 6);
    const maxDay = fc ? Math.max(1, ...fc.days.map((d) => d.count)) : 1;
    const forecastHtml = fc && fc.total ? `<div class="rv-forecast card">
      <div class="rv-fc-head">
        <h3>Previsão de carga · 7 dias</h3>
        <span class="st-meta-inline">Dominados: <b>${fc.tiers.mastered}</b> · Estáveis: <b>${fc.tiers.steady}</b> · A consolidar: <b>${fc.tiers.learning}</b> · Novos: <b>${fc.tiers.new}</b></span>
      </div>
      <div class="rv-bars">
        ${fc.days.map((day) => `<div class="rv-bar-col">
          <span class="rv-bar-n">${day.count || ''}</span>
          <div class="rv-bar-track"><i style="height:${day.count ? Math.max(12, Math.round((day.count / maxDay) * 100)) : 4}%"></i></div>
          <small>${esc(fmtShortDay(day.date, day.offset))}</small>
        </div>`).join('')}
      </div>
    </div>` : '';
    const painel = origens.length ? `<div class="rv-side">
      <h2 class="rv-side-h">${I.book} De onde vêm estes cartões</h2>
      <div class="rv-orgs">${origens.map((r) => `<a class="rv-org" href="#/estudar/${escAttr(r.id)}">
        <b>${esc(r.title)}</b>
        <span class="rv-org-n"><i class="d" style="width:${Math.round(r.due / Math.max(1, r.total) * 100)}%"></i><i class="n" style="width:${Math.round(r.new / Math.max(1, r.total) * 100)}%"></i></span>
        <small>${r.due} a rever · ${r.new} novos · ${r.total} cartões</small></a>`).join('')}</div>
      <p class="rv-teclas"><span>Teclado</span><kbd>Espaço</kbd> mostra a resposta<kbd>1</kbd><kbd>2</kbd><kbd>3</kbd><kbd>4</kbd> avaliam — outra vez, difícil, bom, fácil</p>
    </div>` : '';
    return panelShell('revisao', `
      <div class="page-h"><div><h1>Revisão espaçada</h1><p>Núcleo AMA · cartões agendados pelo método SM-2 com previsão semanal de carga.</p></div>
        <a class="btn btn-o" href="#/estudar">${I.spark} Estúdio de Estudo</a></div>
      <div class="st-summary-strip" style="margin-bottom:14px">
        <span><b>${q.dueCount}</b> para rever</span><i>·</i>
        <span><b>${q.newCount}</b> novos</span><i>·</i>
        <span><b>${q.scheduledCount}</b> agendados</span><i>·</i>
        <span><b>${q.learned}</b> já estudados</span>
        ${q.nextDue ? `<i>·</i><span>Próximo: <b>${esc(fmtDay(q.nextDue))}</b></span>` : ''}
      </div>
      ${filt}
      <div id="rv-stage">${rvStageHtml()}</div>
      ${forecastHtml}
      ${painel}`, MENU.aluno);
  }

  function rvStageHtml() {
    const q = RV.q;
    if (!q.items.length) {
      return `<div class="card empty">${I.check}<h3>Nada para rever agora</h3>
        <p>${q.totalCards ? 'Todos os cartões estão agendados para os próximos dias.' : 'Crie um caderno em <b>Estudar</b> para gerar os primeiros cartões.'}</p>
        <a class="btn btn-f" style="margin-top:14px" href="#/estudar">Criar caderno</a></div>`;
    }
    if (RV.i >= q.items.length) {
      return `<div class="card empty">${I.check}<h3>Sessão concluída</h3>
        <p>Reviu ${RV.done} cartão${RV.done === 1 ? '' : 'ões'} nesta sessão. Os próximos ficam agendados automaticamente.</p>
        <div class="flex" style="gap:8px;justify-content:center;margin-top:14px"><button class="btn btn-p" onclick="AMAStudy.rvRestart()">Nova sessão</button><a class="btn btn-o" href="#/estudar">Estudar mais</a></div></div>`;
    }
    const it = q.items[RV.i];
    const iv = it.intervals || {};
    const statusLabel = it.status === 'due' ? `Em atraso · ${fmtDay(it.due)}` : 'Novo cartão';
    return `<div class="rv-wrap">
      <div class="rv-bar"><span class="muted">${RV.i + 1} de ${q.items.length}</span><span class="muted">${esc(it.recordTitle)}</span></div>
      <div class="card rv-card${RV.revealed ? ' revealed' : ''}">
        <div class="rv-card-meta"><span>${esc(statusLabel)}</span><i>·</i><span>${esc(subjectLabel(it.subject))}</span></div>
        <p class="rv-q">${esc(it.card.front)}</p>
        ${RV.revealed ? `<div class="rv-a"><h4>Resposta</h4><p>${esc(it.card.back)}</p></div>
          <div class="rv-rate">
            <button class="btn btn-o btn-sm" onclick="AMAStudy.rvRate('again')">Outra vez <small>${iv.again}d</small></button>
            <button class="btn btn-o btn-sm" onclick="AMAStudy.rvRate('hard')">Difícil <small>${iv.hard}d</small></button>
            <button class="btn btn-p btn-sm" onclick="AMAStudy.rvRate('good')">Bom <small>${iv.good}d</small></button>
            <button class="btn btn-f btn-sm" onclick="AMAStudy.rvRate('easy')">Fácil <small>${iv.easy}d</small></button>
          </div>`
          : `<button class="btn btn-p" style="margin-top:18px" onclick="AMAStudy.rvReveal()">Mostrar resposta</button>`}
      </div>
      <p class="muted" style="font-size:12px;text-align:center;margin-top:10px">Avalie com honestidade: o intervalo até à próxima revisão depende disso.</p>
    </div>`;
  }

  function rvRefresh() {
    const el = document.getElementById('rv-stage');
    if (el) el.innerHTML = rvStageHtml();
  }

  /* ------------------------------------------------------------------ */
  /* Oficina do professor                                               */
  /* ------------------------------------------------------------------ */
  function professorView() {
    const d = store();
    const menu = S.user && S.user.papel === 'ADMIN' ? MENU.admin : MENU.instrutor;
    const opts = d.recs.map((r) => `<option value="${r.id}">${esc(r.title)}</option>`).join('');
    const attendance = attendanceSection(d);
    return panelShell('professor', `
      <div class="page-h"><div><h1>Oficina Docente</h1><p>Núcleo AMA · projetor PDF→Slides com Modo Leitura, fichas imprimíveis, planos de aula, rubricas e presenças locais.</p></div>
        <a class="btn btn-f" href="#/projetor">${I.play} Abrir Projetor de Aulas</a></div>
      <div class="card st-block pj-prof-banner">
        <div class="pj-pb-copy">
          <span class="eyebrow-t">${I.play} NOVO · PROJETOR PDF → SLIDES + MODO LEITURA</span>
          <h3>Envie um PDF e transforme-o em apresentação visual de sala</h3>
          <p class="muted">Cada página do PDF vira um slide 16:9 organizado com destaques técnicos, notas do docente, temas de projeção e Modo Leitura configurável.</p>
          <div class="flex wrap" style="gap:8px;margin-top:12px">
            <a class="btn btn-p" href="#/projetor">${I.play} Abrir Projetor PDF</a>
            <button type="button" class="btn btn-o" onclick="window.AMAProjector&&AMAProjector.loadSample('fisica')">Ver aula exemplo (Física)</button>
          </div>
        </div>
        <figure class="pj-pb-art"><img src="media/nucleo-3d-hero.jpg?v=71" alt="Pré-visualização visual do Projetor AMA" loading="lazy" decoding="async"></figure>
      </div>
      <div class="card st-block">
        <h3>1 · Fonte do conteúdo e documentos</h3>
        <div class="st-grid-in">
          <div class="field"><label>Caderno guardado</label><select id="pf-rec"><option value="">— usar texto colado —</option>${opts}</select></div>
          <div class="field"><label>Título do documento</label><input id="pf-title" maxlength="90" placeholder="Ex.: Ficha de exercícios — Leis de Newton"></div>
        </div>
        <div class="field"><label>Texto base (se não escolher um caderno)</label><textarea id="pf-text" rows="5" placeholder="Cole o texto base para a ficha ou o plano de aula."></textarea></div>
        <div class="st-grid-in" style="margin-bottom:12px">
          <div class="field"><label>Modelo de rubrica</label><select id="pf-rubric-kind">
            <option value="lab">Laboratório / Relatório prático</option>
            <option value="project">Projeto aplicado</option>
            <option value="presentation">Apresentação oral</option>
          </select></div>
        </div>
        <div class="flex wrap" style="gap:8px">
          <button class="btn btn-p" onclick="AMAStudy.makeWorksheet()">${I.doc} Ficha de exercícios</button>
          <button class="btn btn-o" onclick="AMAStudy.makePlan()">${I.calendar} Plano de aula</button>
          <button class="btn btn-o" onclick="AMAStudy.makeRubric()">${I.check} Gerar rubrica</button>
          <a class="btn btn-f" href="#/projetor">${I.play} Transformar em Slides</a>
        </div>
        <p class="muted" style="font-size:11.5px;margin-top:10px">Os documentos abrem prontos a imprimir com identidade AMA. Nada é enviado para fora deste navegador.</p>
      </div>
      ${attendance}`, menu);
  }

  let AT = null;
  function attendanceSection(d) {
    if (!S_()) return '<div class="card">A carregar o Núcleo AMA…</div>';
    const sessions = d.attendance || [];
    const roster = (AT && AT.roster) || d.roster || [];
    const summary = (() => { try { return S_().attendanceSummary(sessions); } catch { return null; } })();
    const list = sessions.length ? sessions.map((s) => {
      const c = S_().attendanceCounts(s.entries);
      return `<div class="list-row"><span class="st-ico">${I.users}</span>
        <div class="t"><b>${esc(s.label)}</b><small>${esc(fmtDay(s.date))} · ${c.attended}/${c.total} presentes (${c.rate}%)</small></div>
        <button class="icon-btn" title="Exportar CSV desta sessão" onclick="AMAStudy.attExport('${s.id}')">${I.doc}</button></div>`;
    }).join('') : '<p class="muted" style="font-size:13px">Ainda sem sessões registadas.</p>';

    if (!AT) AT = { date: todayIso(), label: 'Aula', roster, marks: {}, prepared: false };
    const rosterBox = AT.prepared ? `<div class="att-list">${AT.roster.map((name) => {
      const st = AT.marks[name] || 'present';
      return `<div class="att-row"><b>${esc(name)}</b><div class="att-btns">
        <button class="${st === 'present' ? 'on p' : ''}" onclick="AMAStudy.attMark('${escAttr(name)}','present')">Presente</button>
        <button class="${st === 'late' ? 'on l' : ''}" onclick="AMAStudy.attMark('${escAttr(name)}','late')">Atrasado</button>
        <button class="${st === 'absent' ? 'on a' : ''}" onclick="AMAStudy.attMark('${escAttr(name)}','absent')">Ausente</button>
      </div></div>`;
    }).join('')}</div>` : '';

    return `<div class="card st-block" id="att-card">
      <div class="st-block-head"><h3>2 · Presenças em sala</h3><span class="st-meta-inline">Registo local de apoio</span></div>
      <p class="muted" style="font-size:12.5px">Este registo é uma ajuda de sala de aula e <b>não substitui o registo oficial da escola</b>. Fica apenas neste navegador.</p>
      <div class="st-grid-in">
        <div class="field"><label>Data</label><input type="date" id="att-date" value="${AT.date}" onchange="AMAStudy.attDate(this.value)"></div>
        <div class="field"><label>Identificação da aula</label><input id="att-label" value="${escAttr(AT.label)}" maxlength="60" onchange="AMAStudy.attLabel(this.value)"></div>
      </div>
      <div class="field"><label>Turma (um nome por linha, até 100)</label><textarea id="att-roster" rows="4" placeholder="Ana Domingos&#10;Bruno Kiala&#10;...">${esc(roster.join('\n'))}</textarea></div>
      <button class="btn btn-p btn-sm" onclick="AMAStudy.attPrepare()">${I.users} Preparar chamada</button>
      ${rosterBox}
      ${AT.prepared ? `<div class="flex wrap" style="gap:8px;margin-top:12px"><button class="btn btn-f" onclick="AMAStudy.attSave()">${I.check} Guardar sessão</button><button class="btn btn-o btn-sm" onclick="AMAStudy.attCancel()">Cancelar</button></div>` : ''}
      <div class="att-hist"><div class="flex" style="justify-content:space-between;align-items:center;margin:16px 0 8px"><h4 style="margin:0">Histórico</h4>${sessions.length ? `<button class="btn btn-o btn-sm" onclick="AMAStudy.attExport()">${I.doc} CSV completo</button>` : ''}</div>
        ${summary && summary.sessions ? `<p class="muted" style="font-size:12.5px">${summary.sessions} sessões · ${summary.rate}% de presença acumulada.</p>` : ''}
        ${list}</div>
    </div>`;
  }

  function refreshAtt() {
    const card = document.getElementById('att-card');
    if (card) card.outerHTML = attendanceSection(store());
  }

  /* ------------------------------------------------------------------ */
  /* Documentos imprimíveis                                             */
  /* ------------------------------------------------------------------ */
  function openDoc(title, body) {
    const S = S_();
    const html = S.sheetDocumentHtml({ title: 'AMA · ' + title, body, lang: 'pt' });
    const w = window.open('', '_blank');
    if (!w) { toast('Permita janelas pop-up para abrir o documento.'); return; }
    w.document.write(html); w.document.close();
    setTimeout(() => { try { w.focus(); w.print(); } catch { } }, 500);
  }
  const sheetHead = (title, meta) => `<div class="teacher-sheet"><header class="teacher-sheet-head">
    <div class="teacher-sheet-brand"><span>AMA</span><span>ARISTIDES MIGUEL ACADEMY</span></div>
    <div class="teacher-sheet-title"><h1>${esc(title)}</h1><div class="teacher-sheet-meta">${meta}</div></div>
    <div class="teacher-sheet-id"><span>Nome:</span><i></i><span>Turma:</span><i></i><span>Data:</span><i></i></div>
  </header>`;
  const sheetFoot = (note) => `<footer class="teacher-sheet-foot"><span>${esc(note)}</span><span>Gerado localmente · Núcleo AMA</span></footer></div>`;

  function worksheetDoc(w) {
    const body = sheetHead(w.title, `<span>${esc(subjectLabel(w.subject))}</span><span>${w.total} perguntas</span><span>${w.points} pontos</span>`) +
      `<p class="teacher-sheet-instructions">${esc(w.instructions)}</p>` +
      w.sections.map((sec) => `<section class="teacher-sheet-section"><h2>${esc(sec.title)}</h2><p class="teacher-sheet-section-note">${esc(sec.instructions)}</p>
        <ol class="teacher-sheet-questions">${sec.questions.map((q) => `<li>
          <div class="teacher-question-line"><span class="teacher-question-number">${q.number}.</span><p>${esc(q.prompt)}</p><small>${q.points ?? ''} pts</small></div>
          ${q.options && q.options.length ? `<div class="teacher-sheet-options">${q.options.map((o, i) => `<span><b>${'ABCD'[i]}.</b> ${esc(o)}</span>`).join('')}</div>` : '<div class="teacher-answer-lines"></div>'}
        </li>`).join('')}</ol></section>`).join('') +
      `<section class="teacher-sheet-key"><h2>Chave de resposta</h2><ol class="teacher-key-list">${w.answerKey.map((k) => `<li><strong>${k.number}.</strong> ${esc(k.answer)}${k.explanation ? `<br><small>${esc(k.explanation)}</small>` : ''}</li>`).join('')}</ol>
        <p class="teacher-sheet-key-note">Ficha gerada a partir do texto fornecido. Revise as respostas antes de usar em aula.</p></section>` +
      sheetFoot('Documento de apoio à aula — não é um exame oficial.');
    openDoc(w.title, body);
  }

  function planDoc(p) {
    const body = sheetHead(p.title, `<span>${esc(subjectLabel(p.subject))}</span>${p.className ? `<span>${esc(p.className)}</span>` : ''}${p.date ? `<span>${esc(fmtDay(p.date))}</span>` : ''}<span>${p.duration} min</span>`) +
      `<div class="teacher-plan-grid">
        <section><h2>Objetivos</h2><ul>${p.objectives.map((o) => `<li>${esc(o)}</li>`).join('')}</ul></section>
        <section><h2>Vocabulário</h2><div class="teacher-tags">${p.vocabulary.map((v) => `<span>${esc(v)}</span>`).join('') || '<span>—</span>'}</div></section>
        <section><h2>Materiais</h2><ul>${p.materials.map((m) => `<li>${esc(m)}</li>`).join('')}</ul></section>
      </div>
      <div class="teacher-plan-timeline"><h2>Sequência</h2><ol>${p.timeline.map((t) => `<li><div class="teacher-plan-time">${t.minutes}<small>min</small></div><div class="teacher-plan-step"><strong>${esc(t.title)}</strong><p>${esc(t.detail)}</p><em>${esc(t.teacherNote)}</em></div></li>`).join('')}</ol></div>
      <section><h2>Avaliação</h2><ol class="teacher-plan-assessment">${p.assessment.map((a) => `<li>${esc(a.prompt)}<small>${esc(a.answer)}</small></li>`).join('')}</ol></section>
      <div class="teacher-plan-diff"><section><h3>Apoio</h3><p>${esc(p.differentiation.support)}</p></section><section><h3>Desafio</h3><p>${esc(p.differentiation.challenge)}</p></section></div>
      <p class="teacher-sheet-key-note">${esc(p.sourceNote)}</p>` +
      sheetFoot('Plano de aula gerado localmente.');
    openDoc(p.title, body);
  }

  function rubricDoc(r) {
    const body = sheetHead(r.title, `<span>Escala de ${r.scale.length} níveis</span><span>${r.total}%</span>`) +
      `<div dir="ltr"><table class="teacher-rubric-table"><thead><tr><th>Critério</th>${r.scale.map((s) => `<th><b>${esc(s.label)}</b><span>${s.value} nível</span></th>`).join('')}<th class="is-weight">Peso</th></tr></thead>
        <tbody>${r.criteria.map((c) => `<tr><td><b>${esc(c.criterion)}</b></td>${c.levels.map((l) => `<td>${esc(l.descriptor)}</td>`).join('')}<td class="is-weight">${c.weight}%</td></tr>`).join('')}</tbody>
        <tfoot><tr><td colspan="${r.scale.length + 1}">Classificação final</td><td>${r.total}%</td></tr></tfoot></table></div>` +
      sheetFoot('Rubrica de avaliação — critérios e descritores. Confirme a escala da escola antes de usar.');
    openDoc(r.title, body);
  }

  /* ------------------------------------------------------------------ */
  /* API pública da camada                                              */
  /* ------------------------------------------------------------------ */
  const AMAStudy = {
    /* --- caderno & síntese --- */
    loadExample(key) {
      const ex = EXAMPLES[key];
      if (!ex) return;
      const ti = document.getElementById('st-title');
      const se = document.getElementById('st-subject');
      const ta = document.getElementById('st-text');
      if (ti) ti.value = ex.title;
      if (se) se.value = ex.subject;
      if (ta) ta.value = ex.text;
      this.updateMeter(ex.text);
      toast('Exemplo carregado. Clique em «Analisar no Núcleo AMA».');
    },
    updateMeter(val) {
      const el = document.getElementById('st-meter');
      if (!el) return;
      const m = meterText(val);
      el.textContent = m.text;
      el.classList.toggle('ok', m.ready);
    },
    setTab(tab) {
      VIEW.tab = tab;
      render();
    },
    mapSelect(idx) {
      VIEW.mapNode = Number(idx) || 0;
      render();
    },
    saveFeynman(id, val) {
      if (!id) return;
      const d = store();
      const rec = d.recs.find((r) => r.id === id);
      if (!rec) return;
      rec.progress = rec.progress || { cards: {}, studied: false };
      rec.progress.feynman = String(val || '').slice(0, 4000);
      save(d);
      const st = document.getElementById('st-feynman-st');
      if (st) st.textContent = rec.progress.feynman.trim() ? 'Guardado localmente' : 'Auto-avaliação ativa';
    },
    analisar() {
      const title = (document.getElementById('st-title') || {}).value || '';
      const subject = (document.getElementById('st-subject') || {}).value || 'geral';
      const text = (document.getElementById('st-text') || {}).value || '';
      const a = analyse(text, title, subject);
      if (!a) return toast('O Núcleo AMA ainda está a carregar — tente novamente.');
      if (a.insufficient) return toast('Texto demasiado curto: cole pelo menos 120 caracteres e duas frases.');
      const d = store();
      const rec = { id: uid(), title: a.title, subject, text: a.text, analysis: a, createdAt: new Date().toISOString(), progress: { cards: {}, studied: false, feynman: '' } };
      d.recs.unshift(rec);
      save(d);
      toast('Caderno criado · ' + (a.cards || []).length + ' cartões e mapa de conceitos');
      go('/estudar/' + rec.id);
    },
    async importFile(input) {
      const file = input && input.files && input.files[0];
      input.value = '';
      if (!file) return;
      const st = document.getElementById('st-file-st');
      const say = (m) => { if (st) st.textContent = m; };
      try {
        const mod = await import('./engine/file-import.js');
        const ok = mod.validateImportFile(file);
        if (!ok.ok) { say(mod.importErrorMessage(ok.code, 'pt', ok.detail)); return; }
        say('A ler ' + file.name + ' (' + mod.formatFileSize(file.size) + ')…');
        const r = await mod.extractFileText(file, { onProgress: (p) => say('A extrair texto… ' + Math.round((p.progress || 0) * 100) + '%') });
        const ta = document.getElementById('st-text');
        if (ta) { ta.value = r.text || ''; this.updateMeter(ta.value); }
        const ti = document.getElementById('st-title');
        if (ti && !ti.value) ti.value = r.title || mod.filenameToTitle(file.name);
        say('Texto extraído · ' + (r.pages || 1) + ' pág. (' + mod.sourceLabel(r.method || (r.ocrPages ? 'image-ocr' : 'pdf-text'), 'pt') + ')');
      } catch (e) {
        say(e && e.message ? e.message : 'Não foi possível ler o ficheiro.');
      }
    },
    quickSummary(ctx, el) {
      const S = S_();
      if (!S || !el) return;
      const a = analyse(ctx.resumo || '', ctx.titulo || '', 'geral');
      el.innerHTML = `<div class="quick-sum">${analysisBody(a)}
        <div class="flex wrap" style="gap:8px;margin-bottom:14px">
          <button class="btn btn-p btn-sm" onclick="AMAStudy.saveLesson()">${I.plus} Guardar nos meus cadernos</button>
          <a class="btn btn-o btn-sm" href="#/estudar?aula=${ctx.id || ''}">${I.spark} Abrir no Estúdio</a>
        </div></div>`;
    },
    saveLesson() {
      const ctx = window.__aulaCtx || {};
      const a = analyse(ctx.resumo || '', ctx.titulo || '', 'geral');
      if (!a || a.insufficient) return toast('Esta aula ainda não tem texto suficiente para resumir.');
      const d = store();
      const ja = d.recs.find((r) => r.title === a.title);
      if (ja) { toast('Já tem um caderno desta aula.'); return go('/estudar/' + ja.id); }
      const rec = { id: uid(), title: a.title, subject: 'geral', text: a.text, analysis: a, createdAt: new Date().toISOString(), progress: { cards: {}, studied: false, feynman: '' } };
      d.recs.unshift(rec); save(d);
      toast('Guardado · ' + (a.cards || []).length + ' cartões criados');
      go('/estudar/' + rec.id);
    },
    ingest({ title = '', subject = 'geral', text = '', src = '' } = {}) {
      const t = String(text || '').trim();
      if (t.length < 120) return false;
      const full = [title, src].filter(Boolean).join(' · ');
      const a = analyse(t, full, subject);
      if (!a || a.insufficient) return false;
      const d = store();
      let rec = d.recs.find((r) => r.title === full);
      if (rec) {
        rec.text = a.text; rec.analysis = a; rec.updatedAt = new Date().toISOString();
        d.recs.unshift(d.recs.splice(d.recs.indexOf(rec), 1)[0]);
      } else {
        rec = { id: uid(), title: full, subject, text: a.text, analysis: a, createdAt: new Date().toISOString(), progress: { cards: {}, studied: false, feynman: '' } };
        d.recs.unshift(rec);
      }
      save(d);
      return rec.id;
    },
    kit(titulo) {
      const r = store().recs.find((x) => x.title === titulo);
      if (!r) return false;
      const a = r.analysis || {};
      return {
        id: r.id, title: r.title, subject: r.subject, atualizado: r.updatedAt || r.createdAt,
        ideia: a.centralIdea || '', pontos: (a.keyIdeas || []).slice(0, 4),
        cartões: (a.cards || []).length, perguntas: (a.quiz || []).length,
        perguntasTxt: a.quiz || [], cartõesTxt: (a.cards || []).slice(0, 6),
        estatísticas: a.stats || {},
      };
    },
    async fromLesson(id) {
      if (!id) return;
      try {
        const { aula, curso } = await api('/api/aulas/' + id);
        const ti = document.getElementById('st-title'); const ta = document.getElementById('st-text'); const se = document.getElementById('st-subject');
        if (ti && !ti.value) ti.value = aula.titulo + ' · ' + curso.titulo;
        if (ta && !ta.value) { ta.value = aula.resumo || ''; this.updateMeter(ta.value); }
        if (se && curso.categoria) {
          const map = { 'Desenvolvimento Pessoal': 'geral', 'Tecnologia': 'programacao', 'Negócios': 'empreendedorismo', 'Finanças': 'financas' };
          se.value = map[curso.categoria] || 'geral';
        }
        if (ta && ta.value) toast('Texto da aula carregado. Reveja e analise no Núcleo AMA.');
      } catch (e) { toast(e.message); }
    },
    apagar(id) {
      if (!confirm('Apagar este caderno e os cartões associados?')) return;
      const d = store(); d.recs = d.recs.filter((r) => r.id !== id); save(d);
      toast('Caderno apagado.');
      RV = null; render();
    },
    reanalisar(id) {
      const d = store(); const r = d.recs.find((x) => x.id === id); if (!r) return;
      r.analysis = analyse(r.text, r.title, r.subject);
      save(d); toast('Caderno recalculado pelo Núcleo AMA.'); render();
    },
    exportSheet(id) {
      const d = store(); const r = d.recs.find((x) => x.id === id); if (!r) return;
      const S = S_();
      const w = S.worksheetFromAnalysis(r.analysis, { title: r.title, subject: r.subject, count: 8, lang: 'pt' });
      if (!w) return toast('Texto insuficiente para uma ficha.');
      worksheetDoc(w);
    },
    quizPick(btn, chosen, correct) {
      const box = btn.closest('.st-quiz');
      if (!box || box.dataset.answered) return;
      box.dataset.answered = '1';
      box.classList.add(chosen === correct ? 'right' : 'wrong');
      [...box.querySelectorAll('.st-opts button')].forEach((b, i) => {
        b.disabled = true;
        if (i === correct) b.classList.add('ok');
        else if (i === chosen) b.classList.add('bad');
      });
      const exp = box.querySelector('.st-exp'); if (exp) exp.hidden = false;
      const parent = box.closest('.st-block');
      const scoreEl = parent && parent.querySelector('#st-quiz-score');
      if (scoreEl && parent) {
        const all = parent.querySelectorAll('.st-quiz').length;
        const ans = parent.querySelectorAll('.st-quiz[data-answered]').length;
        const ok = parent.querySelectorAll('.st-quiz.right').length;
        scoreEl.textContent = `${ok} certas · ${ans}/${all} respondidas`;
      }
    },

    /* --- revisão --- */
    rvReveal() { RV.revealed = true; rvRefresh(); },
    rvRate(rating) {
      if (!RV) return;
      const it = RV.q.items[RV.i]; if (!it) return;
      const d = store(); const rec = d.recs.find((r) => r.id === it.recordId); if (!rec) return;
      try { rec.progress = S_().applyReview(rec.progress || {}, it.key, rating); } catch { }
      save(d);
      RV.i += 1; RV.done += 1; RV.revealed = false;
      rvRefresh();
      if (RV.i >= RV.q.items.length) {
        const q = queueFor(RV.subject);
        if (q) RV.q = q;
      }
    },
    rvFilter(subject) { RV = { subject }; render(); },
    rvRestart() { RV = { subject: (RV && RV.subject) || 'all' }; render(); },

    /* --- professor --- */
    _analysis() {
      const sel = (document.getElementById('pf-rec') || {}).value || '';
      if (sel) { const r = store().recs.find((x) => x.id === sel); if (r) return r.analysis; }
      const text = (document.getElementById('pf-text') || {}).value || '';
      const title = (document.getElementById('pf-title') || {}).value || '';
      return analyse(text, title, 'geral');
    },
    makeWorksheet() {
      const S = S_(); const a = this._analysis();
      if (!a) return toast('O Núcleo AMA ainda está a carregar.');
      if (a.insufficient) return toast('Precisa de mais texto: cole pelo menos 120 caracteres ou escolha um caderno.');
      const title = (document.getElementById('pf-title') || {}).value || '';
      const w = S.worksheetFromAnalysis(a, { title, subject: a.subject, count: 8, lang: 'pt' });
      if (!w) return toast('Não foi possível criar perguntas a partir deste texto.');
      worksheetDoc(w);
    },
    makePlan() {
      const S = S_(); const a = this._analysis();
      if (!a || a.insufficient) return toast('Precisa de mais texto para um plano de aula.');
      const title = (document.getElementById('pf-title') || {}).value || '';
      const p = S.lessonPlanFromAnalysis(a, { topic: title, duration: 90, lang: 'pt' });
      if (!p) return toast('Não foi possível gerar o plano.');
      planDoc(p);
    },
    makeRubric() {
      const S = S_();
      const title = (document.getElementById('pf-title') || {}).value || '';
      const kind = (document.getElementById('pf-rubric-kind') || {}).value || 'lab';
      const r = S.buildRubric(kind, { lang: 'pt', title });
      rubricDoc(r);
    },

    /* --- presenças --- */
    attDate(v) { if (AT) AT.date = v; },
    attLabel(v) { if (AT) AT.label = v; },
    attPrepare() {
      const S = S_();
      const ta = document.getElementById('att-roster');
      const roster = S.normalizeAttendanceRoster(ta ? ta.value : '');
      if (!roster.length) return toast('Escreva pelo menos um nome.');
      AT = { date: AT.date || todayIso(), label: AT.label || 'Aula', roster, marks: {}, prepared: true };
      roster.forEach((n) => { AT.marks[n] = 'present'; });
      refreshAtt();
    },
    attMark(name, status) { if (!AT) return; AT.marks[name] = status; refreshAtt(); },
    attCancel() { AT = null; refreshAtt(); },
    attSave() {
      const S = S_();
      const d = store();
      const session = { date: AT.date, label: AT.label, entries: AT.roster.map((n) => ({ name: n, status: AT.marks[n] || 'present' })) };
      const next = S.upsertAttendanceSession(d.attendance, session);
      if (!next.length) return toast('Não foi possível guardar a sessão.');
      d.attendance = next;
      d.roster = AT.roster;
      save(d);
      const saved = AT.roster.length;
      AT = null; toast('Sessão guardada · ' + saved + ' alunos.');
      render();
    },
    attExport(id) {
      const S = S_();
      const d = store();
      const sessions = id ? d.attendance.filter((s) => s.id === id) : d.attendance;
      if (!sessions.length) return toast('Sem sessões para exportar.');
      const csv = S.attendanceCsv(sessions, { lang: 'pt' });
      const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = 'AMA-presencas-' + todayIso() + '.csv';
      document.body.appendChild(a); a.click(); a.remove();
      setTimeout(() => URL.revokeObjectURL(a.href), 4000);
      toast('CSV exportado. Use-o como apoio — não substitui o registo oficial.');
    },
  };

  window.AMAStudy = AMAStudy;

  /* ------------------------------------------------------------------ */
  /* Rotas                                                              */
  /* ------------------------------------------------------------------ */
  on('/estudar', estudarView);
  on('/estudar/:id', ({ args }) => estudarDetail(args.id));
  on('/revisao', revisaoView);
  on('/professor', professorView);

  if (/^#\/(estudar|revisao|professor)/.test(location.hash)) setTimeout(() => render(), 0);

  if (/^#\/estudar\?/.test(location.hash)) {
    const aula = new URLSearchParams(location.hash.split('?')[1] || '').get('aula');
    if (aula) setTimeout(() => AMAStudy.fromLesson(aula), 60);
  }

  document.addEventListener('keydown', (ev) => {
    if (!RV || !RV.q || !/^#\/revisao/.test(location.hash)) return;
    if (ev.metaKey || ev.ctrlKey || ev.altKey) return;
    const t = ev.target;
    if (t && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT|BUTTON|A)$/.test(t.tagName))) return;
    const k = ev.key;
    if (k === ' ' || k === 'Enter') {
      if (RV.revealed || RV.i >= RV.q.items.length) return;
      ev.preventDefault(); AMAStudy.rvReveal(); return;
    }
    const nota = { '1': 'again', '2': 'hard', '3': 'good', '4': 'easy' }[k];
    if (!nota || !RV.revealed) return;
    ev.preventDefault(); AMAStudy.rvRate(nota);
  });

  window.__amaStudyReset = () => { RV = null; AT = null; VIEW.recId = null; };
})();
