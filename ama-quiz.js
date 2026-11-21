/* AMA — Modo Quiz Interativo (Núcleo AMA)
   Permite testar conhecimentos sobre qualquer aula do catálogo AMA, caderno guardado
   em /estudar ou módulo temático, com barra de progresso, pontuação em direto,
   sequência (streak), animações imediatas de feedback e repetição focada nos erros. */
(function () {
  'use strict';

  const HIST_KEY = 'ama-quiz-history-v1';
  const STUDY_KEY = 'ama-study-v1';

  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const escAttr = esc;

  const BUILTIN_MODULES = [
    {
      id: 'mod-financas',
      title: 'Juro Composto, Inflação e Reserva em Kwanzas',
      course: 'Núcleo AMA · Finanças',
      subject: 'financas',
      visual: 'media/nucleo-code-fin-3d.jpg?v=71',
      text: 'Juro composto é o rendimento calculado sobre o capital inicial somado aos juros acumulados nos períodos anteriores. A inflação é a subida generalizada dos preços que reduz o poder de compra do kwanza ao longo do tempo.\n\nPor exemplo, aplicar 100.000 Kz a 12% ao ano gera 12.000 Kz no primeiro ano, mas 13.440 Kz no segundo ano porque o juro incide sobre 112.000 Kz. O tempo amplifica exponencialmente o capital investido.\n\nFundo de emergência é a reserva líquida equivalente a 3 a 6 meses de despesas fixas. Só existe ganho real quando a taxa de rendimento supera a inflação anual.',
    },
    {
      id: 'mod-fisica',
      title: 'Leis de Newton, Força Resultante e Inércia',
      course: 'Núcleo AMA · Física',
      subject: 'fisica',
      visual: 'media/nucleo-physics-3d.jpg?v=71',
      text: 'Movimento retilíneo uniforme é o deslocamento de um corpo em linha reta com velocidade constante e aceleração nula. A força resultante é a soma vetorial de todas as forças que atuam sobre um objeto.\n\nPela segunda lei de Newton, a força é igual ao produto da massa pela aceleração (F = m × a). Um veículo de 1000 kg que acelera a 2 m/s² requer uma força resultante de 2000 N. Quanto maior a massa de um corpo, maior a sua inércia.\n\nA terceira lei estabelece que toda ação provoca uma reação de mesma intensidade e sentido oposto.',
    },
    {
      id: 'mod-programacao',
      title: 'Algoritmos, Funções e Pesquisa Binária',
      course: 'Núcleo AMA · Tecnologia',
      subject: 'programacao',
      visual: 'media/nucleo-math-3d.jpg?v=71',
      text: 'Algoritmo é uma sequência finita e ordenada de passos claros para resolver um problema computacional. Uma função é um bloco reutilizável de código que recebe entradas, processa dados e devolve um resultado.\n\nA pesquisa binária consiste em dividir repetidamente uma lista ordenada ao meio para localizar um elemento. Numa lista ordenada com 1000 registos de estudantes, a pesquisa binária encontra qualquer nome em no máximo 10 comparações porque elimina metade das hipóteses a cada passo.\n\nDecompor problemas em funções e escolher algoritmos O(log n) reduz erros e acelera aplicações.',
    },
  ];

  const Q = {
    session: null,
    courseFilter: 'all',
    inlineSession: null,
    inlineRecId: null,
    justAnswered: false,
    savedHistoryForId: null,
  };

  function S_() {
    return window.Study || null;
  }

  function loadHistory() {
    try {
      const arr = JSON.parse(localStorage.getItem(HIST_KEY) || '[]');
      return Array.isArray(arr) ? arr : [];
    } catch { return []; }
  }

  function saveHistory(entry) {
    try {
      const list = loadHistory().filter((x) => x.sessionId !== entry.sessionId);
      list.unshift(entry);
      localStorage.setItem(HIST_KEY, JSON.stringify(list.slice(0, 20)));
    } catch { }
  }

  function loadNotebooks() {
    try {
      const raw = JSON.parse(localStorage.getItem(STUDY_KEY) || '{}');
      return Array.isArray(raw.recs) ? raw.recs : [];
    } catch { return []; }
  }

  function mapCategoryToSubject(cat) {
    return ({
      'Tecnologia': 'programacao',
      'Finanças': 'financas',
      'Negócios': 'empreendedorismo',
      'Desenvolvimento Pessoal': 'geral',
    })[cat] || 'geral';
  }

  function collectCatalogLessons() {
    const data = window.AMA_DATA;
    if (!data || !Array.isArray(data.cursos) || !data.detalhe) return [];
    const out = [];
    for (const curso of data.cursos) {
      const det = data.detalhe[String(curso.id)];
      if (!det || !Array.isArray(det.seccoes)) continue;
      for (const sec of det.seccoes) {
        const aulas = sec.aulas || [];
        // Aggregate section context so even short individual lesson summaries generate rich multi-question quizzes
        const secContext = aulas.map((a) => `${a.titulo}. ${a.resumo || ''}`).join('\n\n');
        for (const aula of aulas) {
          if (!aula.resumo || aula.resumo.length < 40) continue;
          const richText = `${aula.titulo}. ${aula.resumo}\n\nContexto do módulo «${sec.titulo}» (${curso.titulo}):\n${secContext}`;
          out.push({
            id: `aula-${curso.id}-${aula.id}`,
            courseId: String(curso.id),
            lessonId: aula.id,
            title: aula.titulo,
            course: curso.titulo,
            section: sec.titulo,
            subject: mapCategoryToSubject(curso.categoria),
            category: curso.categoria,
            summary: aula.resumo,
            text: richText,
          });
        }
      }
    }
    return out;
  }

  function waitForStudy(cb) {
    if (S_() && S_().buildQuizQuestions) return cb();
    const onReady = () => {
      window.removeEventListener('study-ready', onReady);
      cb();
    };
    window.addEventListener('study-ready', onReady);
  }

  function createSessionFromPayload({ id, title, subject, sourceType, text, analysis, maxQuestions = 6 }) {
    const eng = S_();
    if (!eng || !eng.buildQuizQuestions) return null;
    const questions = eng.buildQuizQuestions({ analysis, title, subject, text, maxQuestions });
    if (!questions.length) return null;
    return eng.createQuizSession({ id, title, subject, sourceType, questions });
  }

  /* ------------------------------------------------------------------ */
  /* Renderização do Runner Interativo (reutilizado em #/quiz e tab)    */
  /* ------------------------------------------------------------------ */
  function renderQuizStage(session, { inline = false } = {}) {
    const eng = S_();
    if (!eng || !session) return '';
    const m = eng.quizMetrics(session);
    const prefix = inline ? 'inline' : 'main';

    if (session.completed) {
      if (Q.savedHistoryForId !== session.id && m.total > 0) {
        Q.savedHistoryForId = session.id;
        saveHistory({
          sessionId: session.id,
          title: session.title,
          subject: session.subject,
          score: m.score,
          total: m.total,
          pct: m.finalPct,
          xp: m.xp,
          maxStreak: m.maxStreak,
          at: new Date().toISOString(),
        });
      }
      const reviewItems = session.questions.map((q, idx) => {
        const ans = session.answers.find((a) => a.questionIndex === idx);
        const ok = ans ? ans.isCorrect : false;
        return `<li class="qz-rev-item ${ok ? 'ok' : 'bad'}">
          <span class="qz-rev-mark" aria-hidden="true">${ok ? '✓' : '✕'}</span>
          <div>
            <strong>${esc(q.prompt)}</strong>
            <p class="qz-rev-ans">Resposta correta: <b>${esc(q.options[q.correct])}</b>${!ok && ans ? ` · Sua escolha: <em>${esc(q.options[ans.chosen] || '—')}</em>` : ''}</p>
            ${q.explanation ? `<small>${esc(q.explanation)}</small>` : ''}
          </div>
        </li>`;
      }).join('');

      return `<section class="qz-result card" data-testid="quiz-result">
        <div class="qz-res-top">
          <div class="qz-ring" style="--qz-p:${m.finalPct}" aria-label="Precisão final ${m.finalPct}%">
            <div class="qz-ring-in">
              <strong>${m.finalPct}%</strong>
              <span>${m.score}/${m.total}</span>
            </div>
          </div>
          <div class="qz-res-copy">
            <span class="eyebrow-t">${I.spark} QUIZ CONCLUÍDO</span>
            <h2>${esc(m.tier)}</h2>
            <p class="qz-res-sub">${esc(session.title)} · <b>+${m.xp} XP</b> · Melhor sequência: <b>${m.maxStreak}×</b></p>
            <div class="qz-res-actions">
              ${m.missedQuestions.length ? `<button type="button" class="btn btn-f" onclick="AMAQuiz.retryMissed('${prefix}')">${I.spark} Refazer ${m.missedQuestions.length} erro${m.missedQuestions.length === 1 ? '' : 's'}</button>` : ''}
              <button type="button" class="btn btn-p" onclick="AMAQuiz.restart('${prefix}')">Repetir quiz</button>
              ${!inline ? `<button type="button" class="btn btn-o" onclick="AMAQuiz.backToPicker()">Escolher outra aula</button>` : ''}
            </div>
          </div>
        </div>
        <div class="qz-rev-wrap">
          <h3>Revisão detalhada das perguntas</h3>
          <ol class="qz-rev-list">${reviewItems}</ol>
        </div>
      </section>`;
    }

    const q = session.questions[session.currentIndex];
    const fb = session.lastFeedback;
    const isLast = session.currentIndex + 1 >= session.questions.length;
    const letters = ['A', 'B', 'C', 'D'];
    const kindLabel = ({
      definicao: 'Definição',
      aplicacao: 'Aplicação',
      compreensao: 'Compreensão',
      conceito: 'Conceito',
      ideia: 'Ideia-chave',
    })[q.kind] || 'Verificação';

    return `<section class="qz-stage card ${fb ? (fb.isCorrect ? 'has-ok' : 'has-bad') : ''}" data-testid="quiz-stage" data-q-index="${session.currentIndex}">
      <header class="qz-hud">
        <div class="qz-hud-top">
          <div class="qz-title-wrap">
            ${!inline ? `<button type="button" class="qz-back-btn" onclick="AMAQuiz.backToPicker()" aria-label="Voltar à lista de aulas">${I.back} Aulas</button>` : ''}
            <div>
              <span class="qz-kicker">${esc(kindLabel)} · Pergunta ${session.currentIndex + 1} de ${m.total}</span>
              <h2 class="qz-lesson-name">${esc(session.title)}</h2>
            </div>
          </div>
          <div class="qz-metrics" aria-live="polite">
            <span class="qz-metric" data-testid="quiz-score"><b>${m.score}</b>/${m.total} certas</span>
            <i aria-hidden="true">·</i>
            <span class="qz-metric ${m.streak >= 2 ? 'hot' : ''}" data-testid="quiz-streak"><b>${m.streak}×</b> sequência</span>
            <i aria-hidden="true">·</i>
            <span class="qz-metric" data-testid="quiz-xp"><b>+${m.xp}</b> XP</span>
          </div>
        </div>
        <div class="qz-progress-track" role="progressbar" aria-valuenow="${m.progressPct}" aria-valuemin="0" aria-valuemax="100" aria-label="Progresso do quiz">
          <div class="qz-progress-fill" style="width:${m.progressPct}%"></div>
        </div>
      </header>

      <div class="qz-question-body">
        <h3 class="qz-prompt" data-testid="quiz-prompt">${esc(q.prompt)}</h3>
        <div class="qz-options" role="group" aria-label="Opções de resposta">
          ${q.options.map((opt, idx) => {
            let cls = 'qz-opt';
            let stateIcon = '';
            if (fb) {
              if (idx === fb.correct) {
                cls += fb.isCorrect && idx === fb.chosen ? ' is-correct anim-pop' : ' is-reveal';
                stateIcon = '<span class="qz-opt-mark ok" aria-hidden="true">✓</span>';
              } else if (idx === fb.chosen && !fb.isCorrect) {
                cls += ' is-wrong anim-shake';
                stateIcon = '<span class="qz-opt-mark bad" aria-hidden="true">✕</span>';
              } else {
                cls += ' is-dim';
              }
            }
            return `<button type="button" class="${cls}" ${fb ? 'disabled' : ''} data-opt-index="${idx}" onclick="AMAQuiz.answer('${prefix}',${idx})">
              <span class="qz-opt-key">${letters[idx] || idx + 1}</span>
              <span class="qz-opt-text">${esc(opt)}</span>
              ${stateIcon}
            </button>`;
          }).join('')}
        </div>

        ${fb ? `<div class="qz-feedback ${fb.isCorrect ? 'ok' : 'bad'} anim-slide" role="status" aria-live="polite" data-testid="quiz-feedback">
          <div class="qz-fb-head">
            <strong>${fb.isCorrect ? `Resposta correta! +${fb.gainedXp} XP` : 'Quase lá — reveja o conceito'}</strong>
            ${fb.isCorrect && fb.streak >= 2 ? `<span class="qz-streak-burst">Sequência ${fb.streak}×</span>` : ''}
          </div>
          ${fb.explanation ? `<p>${esc(fb.explanation)}</p>` : ''}
          <div class="qz-fb-foot">
            <button type="button" class="btn ${fb.isCorrect ? 'btn-p' : 'btn-f'}" onclick="AMAQuiz.next('${prefix}')" data-testid="quiz-next">
              ${isLast ? 'Ver resultado final' : 'Próxima pergunta'} ${I.arrow}
            </button>
            <span class="qz-kbd-hint">Prima <kbd>Enter</kbd> para continuar</span>
          </div>
        </div>` : `<p class="qz-kbd-hint" style="margin-top:14px">Atalho: teclas <kbd>1</kbd>–<kbd>${q.options.length}</kbd> escolhem a resposta.</p>`}
      </div>
    </section>`;
  }

  /* ------------------------------------------------------------------ */
  /* Página Principal #/quiz (Seletor de Aulas + Runner)                */
  /* ------------------------------------------------------------------ */
  function wrapShell(inner) {
    if (S && S.user) {
      const m = S.user.papel === 'ADMIN' ? MENU.admin : S.user.papel === 'INSTRUCTOR' ? MENU.instrutor : MENU.aluno;
      return panelShell('quiz', inner, m);
    }
    return shellPublic(`<div class="qz-public-wrap">${inner}</div>`, 'universidade');
  }

  function quizPickerHtml() {
    const notebooks = loadNotebooks();
    const lessons = collectCatalogLessons();
    const history = loadHistory();
    const courses = (window.AMA_DATA && window.AMA_DATA.cursos) || [];
    const filteredLessons = Q.courseFilter === 'all'
      ? lessons
      : lessons.filter((l) => l.courseId === Q.courseFilter);

    const avgPct = history.length
      ? Math.round(history.reduce((s, h) => s + (h.pct || 0), 0) / history.length)
      : 0;
    const totalXp = history.reduce((s, h) => s + (h.xp || 0), 0);

    return `
      <div class="page-h qz-page-head">
        <div>
          <span class="eyebrow-t">${I.quiz} NÚCLEO AMA · MODO QUIZ INTERATIVO</span>
          <h1 style="margin-top:6px">Teste o seu domínio por aula</h1>
          <p>Escolha uma lição do catálogo AMA, um dos seus cadernos de estudo ou um módulo do Núcleo. Feedback imediato, pontuação em tempo real e revisão focada nos erros.</p>
        </div>
        <div class="flex wrap" style="gap:8px">
          <a class="btn btn-o" href="#/estudar">${I.book} Estúdio de Estudo</a>
          <a class="btn btn-o" href="#/projetor">${I.play} Projetor de Aulas</a>
        </div>
      </div>

      <div class="st-summary-strip" style="margin-bottom:22px">
        <span><b>${history.length}</b> quiz${history.length === 1 ? '' : 'zes'} concluídos</span><i>·</i>
        <span><b>${avgPct}%</b> precisão média</span><i>·</i>
        <span><b>${totalXp}</b> XP acumulados</span><i>·</i>
        <span><b>${lessons.length + notebooks.length + BUILTIN_MODULES.length}</b> lições disponíveis</span>
      </div>

      <section class="qz-section">
        <div class="qz-sec-head">
          <h2>Módulos prontos do Núcleo AMA</h2>
          <span class="st-meta-inline">Comece em 1 clique com 5–6 perguntas por tema</span>
        </div>
        <div class="qz-featured-grid">
          ${BUILTIN_MODULES.map((mod) => `
            <article class="qz-mod-card">
              <div class="qz-mod-media"><img src="${escAttr(mod.visual)}" alt="${escAttr(mod.title)}" loading="lazy" decoding="async"></div>
              <div class="qz-mod-body">
                <span class="qz-mod-meta">${esc(mod.course)}</span>
                <h3>${esc(mod.title)}</h3>
                <button type="button" class="btn btn-p btn-sm" onclick="AMAQuiz.startBuiltin('${mod.id}')">${I.quiz} Iniciar Quiz</button>
              </div>
            </article>
          `).join('')}
        </div>
      </section>

      ${notebooks.length ? `
      <section class="qz-section">
        <div class="qz-sec-head">
          <h2>Os seus cadernos de estudo</h2>
          <span class="st-meta-inline">${notebooks.length} caderno${notebooks.length === 1 ? '' : 's'} guardados localmente</span>
        </div>
        <div class="qz-lesson-grid">
          ${notebooks.slice(0, 8).map((r) => {
            const qCount = ((r.analysis && r.analysis.quiz) || []).length + ((r.analysis && r.analysis.definitions) || []).length;
            return `<article class="card qz-lesson-card">
              <div class="qz-lc-meta">Caderno pessoal · ~${Math.min(8, Math.max(2, qCount))} perguntas</div>
              <h3>${esc(r.title)}</h3>
              <p>${esc((r.analysis && r.analysis.centralIdea) || 'Pratique com perguntas geradas a partir das suas notas.')}</p>
              <div class="qz-lc-foot">
                <button type="button" class="btn btn-p btn-sm" onclick="AMAQuiz.startNotebook('${escAttr(r.id)}')">${I.quiz} Fazer Quiz</button>
                <a class="btn btn-o btn-sm" href="#/estudar/${escAttr(r.id)}">Ver caderno</a>
              </div>
            </article>`;
          }).join('')}
        </div>
      </section>` : ''}

      <section class="qz-section">
        <div class="qz-sec-head">
          <h2>Aulas dos cursos AMA</h2>
          <span class="st-meta-inline">Selecione uma aula específica para gerar um quiz direcionado</span>
        </div>
        <div class="sc-pills" style="margin-bottom:16px" role="tablist" aria-label="Filtrar aulas por curso">
          <button type="button" class="${Q.courseFilter === 'all' ? 'on' : ''}" onclick="AMAQuiz.filterCourse('all')">Todos os cursos</button>
          ${courses.map((c) => `<button type="button" class="${Q.courseFilter === String(c.id) ? 'on' : ''}" onclick="AMAQuiz.filterCourse('${c.id}')">${esc(c.titulo)}</button>`).join('')}
        </div>
        <div class="qz-lesson-grid">
          ${filteredLessons.slice(0, 12).map((l) => `
            <article class="card qz-lesson-card">
              <div class="qz-lc-meta">${esc(l.course)} · ${esc(l.section)}</div>
              <h3>${esc(l.title)}</h3>
              <p>${esc(l.summary.slice(0, 130))}${l.summary.length > 130 ? '…' : ''}</p>
              <div class="qz-lc-foot">
                <button type="button" class="btn btn-p btn-sm" onclick="AMAQuiz.startLesson('${escAttr(l.courseId)}',${l.lessonId})">${I.quiz} Testar esta aula</button>
              </div>
            </article>
          `).join('')}
        </div>
      </section>

      ${history.length ? `
      <section class="qz-section">
        <div class="qz-sec-head">
          <h2>Histórico recente</h2>
          <span class="st-meta-inline">Guardado apenas neste navegador</span>
        </div>
        <div class="card qz-hist-list">
          ${history.slice(0, 6).map((h) => `
            <div class="qz-hist-row">
              <div><strong>${esc(h.title)}</strong><small>${new Date(h.at).toLocaleDateString('pt-AO', { day: '2-digit', month: 'short' })} · Melhor sequência ${h.maxStreak || 0}×</small></div>
              <div class="qz-hist-score"><b>${h.score}/${h.total}</b> <span>(${h.pct}%)</span></div>
            </div>
          `).join('')}
        </div>
      </section>` : ''}
    `;
  }

  function quizRouteView({ q }) {
    if (!S_() || !S_().buildQuizQuestions) {
      waitForStudy(() => { if (/^#\/quiz/.test(location.hash)) render(); });
      return wrapShell('<div class="spinner"></div>');
    }
    if (q && q.rec && (!Q.session || Q.session.id !== `rec-${q.rec}`)) {
      const rec = loadNotebooks().find((r) => r.id === q.rec);
      if (rec) {
        Q.session = createSessionFromPayload({
          id: `rec-${rec.id}`,
          title: rec.title,
          subject: rec.subject,
          sourceType: 'notebook',
          text: rec.text,
          analysis: rec.analysis,
          maxQuestions: 8,
        });
        Q.savedHistoryForId = null;
      }
    } else if (q && q.aula && (!Q.session || Q.session.lessonId !== Number(q.aula))) {
      const match = collectCatalogLessons().find((l) => l.lessonId === Number(q.aula));
      if (match) {
        const sess = createSessionFromPayload({
          id: match.id,
          title: `${match.title} · ${match.course}`,
          subject: match.subject,
          sourceType: 'lesson',
          text: match.text,
          maxQuestions: 6,
        });
        if (sess) { sess.lessonId = match.lessonId; Q.session = sess; Q.savedHistoryForId = null; }
      }
    }
    const inner = Q.session ? renderQuizStage(Q.session, { inline: false }) : quizPickerHtml();
    return wrapShell(inner);
  }

  /* ------------------------------------------------------------------ */
  /* API Pública AMAQuiz                                                */
  /* ------------------------------------------------------------------ */
  const AMAQuiz = {
    filterCourse(cid) {
      Q.courseFilter = String(cid || 'all');
      render();
    },
    startBuiltin(modId) {
      const mod = BUILTIN_MODULES.find((m) => m.id === modId);
      if (!mod) return;
      const sess = createSessionFromPayload({
        id: `${mod.id}-${Date.now()}`,
        title: mod.title,
        subject: mod.subject,
        sourceType: 'module',
        text: mod.text,
        maxQuestions: 6,
      });
      if (!sess) return toast('O motor de quiz ainda está a carregar.');
      Q.session = sess;
      Q.savedHistoryForId = null;
      if (!/^#\/quiz/.test(location.hash)) go('/quiz');
      else render();
    },
    startNotebook(recId) {
      const rec = loadNotebooks().find((r) => r.id === recId);
      if (!rec) return toast('Caderno não encontrado.');
      const sess = createSessionFromPayload({
        id: `rec-${rec.id}-${Date.now()}`,
        title: rec.title,
        subject: rec.subject,
        sourceType: 'notebook',
        text: rec.text,
        analysis: rec.analysis,
        maxQuestions: 8,
      });
      if (!sess) return toast('Este caderno ainda não tem texto suficiente para quiz.');
      Q.session = sess;
      Q.savedHistoryForId = null;
      if (!/^#\/quiz/.test(location.hash)) go('/quiz');
      else render();
    },
    startLesson(courseId, lessonId) {
      const match = collectCatalogLessons().find((l) => l.courseId === String(courseId) && l.lessonId === Number(lessonId));
      if (!match) return toast('Aula não encontrada.');
      const sess = createSessionFromPayload({
        id: `${match.id}-${Date.now()}`,
        title: `${match.title} · ${match.course}`,
        subject: match.subject,
        sourceType: 'lesson',
        text: match.text,
        maxQuestions: 6,
      });
      if (!sess) return toast('Não foi possível gerar perguntas para esta aula.');
      sess.lessonId = match.lessonId;
      Q.session = sess;
      Q.savedHistoryForId = null;
      if (!/^#\/quiz/.test(location.hash)) go('/quiz');
      else render();
    },
    inlineTabHtml(rec) {
      if (!rec || !S_() || !S_().buildQuizQuestions) {
        return '<div class="card st-block"><p class="muted">A carregar o Modo Quiz interativo…</p></div>';
      }
      if (!Q.inlineSession || Q.inlineRecId !== rec.id) {
        Q.inlineRecId = rec.id;
        Q.inlineSession = createSessionFromPayload({
          id: `inline-${rec.id}-${Date.now()}`,
          title: rec.title,
          subject: rec.subject,
          sourceType: 'notebook',
          text: rec.text,
          analysis: rec.analysis,
          maxQuestions: 8,
        });
      }
      if (!Q.inlineSession) {
        return '<div class="card empty"><h3>Sem perguntas suficientes</h3><p>Adicione mais texto ao caderno para gerar um quiz interativo.</p></div>';
      }
      return `<div id="ama-inline-quiz-host">${renderQuizStage(Q.inlineSession, { inline: true })}</div>`;
    },
    _get(prefix) {
      return prefix === 'inline' ? Q.inlineSession : Q.session;
    },
    _set(prefix, nextSess) {
      if (prefix === 'inline') {
        Q.inlineSession = nextSess;
        const host = document.getElementById('ama-inline-quiz-host');
        if (host) { host.innerHTML = renderQuizStage(Q.inlineSession, { inline: true }); return; }
      } else {
        Q.session = nextSess;
      }
      render();
    },
    answer(prefix, idx) {
      const eng = S_();
      const cur = this._get(prefix);
      if (!eng || !cur || cur.lastFeedback || cur.completed) return;
      const next = eng.submitQuizAnswer(cur, idx);
      this._set(prefix, next);
    },
    next(prefix) {
      const eng = S_();
      const cur = this._get(prefix);
      if (!eng || !cur) return;
      const next = eng.nextQuizStep(cur);
      this._set(prefix, next);
    },
    restart(prefix) {
      const eng = S_();
      const cur = this._get(prefix);
      if (!eng || !cur) return;
      Q.savedHistoryForId = null;
      const fresh = eng.createQuizSession({
        id: `retry-${Date.now()}`,
        title: cur.title,
        subject: cur.subject,
        sourceType: cur.sourceType,
        questions: cur.questions,
      });
      this._set(prefix, fresh);
    },
    retryMissed(prefix) {
      const eng = S_();
      const cur = this._get(prefix);
      if (!eng || !cur) return;
      const m = eng.quizMetrics(cur);
      if (!m.missedQuestions.length) return this.restart(prefix);
      Q.savedHistoryForId = null;
      const fresh = eng.createQuizSession({
        id: `missed-${Date.now()}`,
        title: `${cur.title} (Revisão de erros)`,
        subject: cur.subject,
        sourceType: cur.sourceType,
        questions: m.missedQuestions,
      });
      this._set(prefix, fresh);
    },
    backToPicker() {
      Q.session = null;
      render();
    },
  };

  window.AMAQuiz = AMAQuiz;
  on('/quiz', quizRouteView);

  if (/^#\/quiz/.test(location.hash)) setTimeout(() => render(), 0);

  // Keyboard shortcuts for active Quiz Mode (1-4 to pick, Enter/Space to continue)
  document.addEventListener('keydown', (ev) => {
    if (ev.metaKey || ev.ctrlKey || ev.altKey) return;
    const t = ev.target;
    if (t && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName))) return;
    const isMain = /^#\/quiz/.test(location.hash) && Q.session && !Q.session.completed;
    const isInline = /^#\/estudar\//.test(location.hash) && !!document.getElementById('ama-inline-quiz-host') && Q.inlineSession && !Q.inlineSession.completed;
    if (!isMain && !isInline) return;
    const prefix = isMain ? 'main' : 'inline';
    const sess = isMain ? Q.session : Q.inlineSession;
    const k = ev.key;
    if (!sess.lastFeedback && /^[1-4]$/.test(k)) {
      const idx = Number(k) - 1;
      const curQ = sess.questions[sess.currentIndex];
      if (curQ && idx < curQ.options.length) {
        ev.preventDefault();
        AMAQuiz.answer(prefix, idx);
      }
    } else if (sess.lastFeedback && (k === 'Enter' || k === ' ')) {
      ev.preventDefault();
      AMAQuiz.next(prefix);
    }
  });
})();
