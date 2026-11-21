/* AMA — Aristides Miguel Academy · Estudo, revisão espaçada e ferramentas do professor.
   Camada clássica carregada depois de app.js: usa os motores determinísticos de
   engine/ (resumos, SM-2, fichas, planos, rubricas, presenças) e guarda tudo no
   localStorage, sem enviar texto nem ficheiros para nenhum servidor. */
(function () {
  'use strict';

  const KEY = 'ama-study-v1';
  const SUBJECTS = [
    ['geral', 'Geral'], ['matematica', 'Matemática'], ['fisica', 'Física'], ['quimica', 'Química'],
    ['biologia', 'Biologia'], ['portugues', 'Língua Portuguesa'], ['historia', 'História'],
    ['geografia', 'Geografia'], ['ingles', 'Inglês'], ['programacao', 'Programação'],
    ['empreendedorismo', 'Empreendedorismo'], ['financas', 'Finanças'],
  ];
  const subjectLabel = (id) => (SUBJECTS.find((s) => s[0] === id) || ['', id])[1] || 'Geral';
  const uid = () => 'r' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
  const todayIso = () => new Date().toISOString().slice(0, 10);
  const fmtDay = (iso) => {
    if (!iso) return '';
    const d = new Date(iso + 'T00:00:00');
    if (Number.isNaN(d.getTime())) return iso;
    return d.toLocaleDateString('pt-AO', { weekday: 'short', day: '2-digit', month: 'short' });
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
  /* Resumo                                                            */
  /* ------------------------------------------------------------------ */
  function analyse(text, title, subject) {
    const S = S_();
    if (!S) return null;
    return S.analyzeSummary({ text: text || '', title: title || '', subject: subject || 'geral' });
  }

  function analysisBody(a, opts = {}) {
    const S = S_();
    if (!a) return '<p class="muted">O motor de estudo ainda não carregou. Recarregue a página.</p>';
    if (a.insufficient) {
      return `<div class="card empty">${I.doc}<h3>Texto insuficiente</h3>
        <p>Preciso de pelo menos 120 caracteres e duas frases para resumir sem inventar. Cole mais conteúdo do material (${a.stats.words} palavras recebidas).</p></div>`;
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
    return `
      <div class="study-stats">
        <span class="chip chip-v">${a.stats.words} palavras</span>
        <span class="chip">${a.stats.sentences} frases</span>
        <span class="chip">${a.stats.readingMinutes} min de leitura</span>
        <span class="chip chip-f">${(a.cards || []).length} cartões</span>
        <span class="chip chip-g">${(a.quiz || []).length} perguntas</span>
      </div>
      <div class="card st-block"><span class="eyebrow-t">${I.bulb} IDEIA CENTRAL</span><p class="st-lead">${esc(a.centralIdea || '')}</p></div>
      <div class="study-cols">
        <div class="card st-block"><h3>Pontos-chave</h3><ol class="st-list">${(a.keyIdeas || []).slice(0, 8).map((k) => `<li>${esc(k)}</li>`).join('')}</ol></div>
        <div class="card st-block"><h3>Definições</h3>${defs || '<p class="muted">O texto não define termos de forma explícita.</p>'}</div>
      </div>
      ${outline ? `<div class="card st-block"><h3>Esquema</h3><div class="st-outline">${outline}</div></div>` : ''}
      <div class="card st-block"><h3>Palavras-chave</h3><div class="flex wrap" style="gap:7px">${(a.keywords || []).map((k) => `<span class="chip">${esc(k.term)} · ${k.count}</span>`).join('')}</div></div>
      <div class="card st-block"><h3>Perguntas guia</h3><ul class="st-list">${(a.guidingQuestions || []).map((q) => `<li>${esc(q)}</li>`).join('')}</ul></div>
      ${cards ? `<div class="card st-block"><h3>Cartões de revisão <small class="muted">· toque para virar</small></h3><div class="st-cards">${cards}</div></div>` : ''}
      ${quiz ? `<div class="card st-block"><h3>Quiz rápido</h3>${quiz}</div>` : ''}
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
  function estudarView() {
    const d = store();
    let pre = null;
    try {
      pre = JSON.parse(sessionStorage.getItem('ama-uni-prefill') || 'null');
      sessionStorage.removeItem('ama-uni-prefill');
    } catch (e) { pre = null; }
    const cards = d.recs.reduce((n, r) => n + ((r.analysis && r.analysis.cards) || []).length, 0);
    const list = d.recs.length ? d.recs.slice().sort((a, b) => b.createdAt.localeCompare(a.createdAt)).map((r) => {
      const a = r.analysis || {};
      return `<div class="list-row st-row">
        <span class="st-ico">${I.doc}</span>
        <div class="t"><b>${esc(r.title)}</b><small>${esc(subjectLabel(r.subject))} · ${a.stats ? a.stats.words + ' palavras · ' : ''}${fmtWhen(r.createdAt)}</small></div>
        <a class="btn btn-o btn-sm" href="#/estudar/${r.id}">Abrir</a>
        <button class="icon-btn" title="Apagar resumo" onclick="AMAStudy.apagar('${r.id}')">${I.close}</button>
      </div>`;
    }).join('') : `<div class="card empty">${I.spark}<h3>Ainda sem resumos</h3><p>Cole o texto de uma aula, de um capítulo ou importe um PDF. O resumo, os cartões e o quiz são gerados neste navegador.</p></div>`;

    return panelShell('estudar', `
      <div class="page-h"><div><h1>Estudar</h1><p>Transforme texto em resumo, cartões de revisão e quiz — sem enviar nada para fora deste navegador.</p></div>
        <a class="btn btn-o" href="#/revisao">${I.quiz} Ir para a revisão</a></div>
      <div class="study-stats" style="margin-bottom:16px">
        <span class="chip chip-v"><b data-count="${d.recs.length}">${d.recs.length}</b> resumo${d.recs.length === 1 ? '' : 's'}</span>
        <span class="chip"><b data-count="${cards}">${cards}</b> cartões</span>
        <span class="chip chip-f">dados locais</span>
      </div>
      <div class="st-grid">
        <div class="card st-form">
          <h3>Novo resumo</h3>
          ${pre ? `<p class="st-prefill">${I.users} Conteúdo da sessão carregado. Reveja e gere o resumo.</p>` : ''}
          <div class="field"><label>Título</label><input id="st-title" maxlength="90" placeholder="Ex.: Fotossíntese — 10.º ano" value="${pre ? esc(pre.title || '') : ''}"></div>
          <div class="field"><label>Matéria</label><select id="st-subject">${subjectOptions(pre ? pre.subject : 'geral')}</select></div>
          <div class="field"><label>Texto do material</label><textarea id="st-text" rows="9" placeholder="Cole aqui o texto da aula, do manual ou das suas notas (mínimo 120 caracteres).">${pre ? esc(pre.text || '') : ''}</textarea></div>
          <div class="flex wrap" style="gap:8px;align-items:center">
            <button class="btn btn-p" onclick="AMAStudy.analisar()">${I.spark} Gerar resumo</button>
            <label class="btn btn-o btn-sm" style="cursor:pointer">${I.doc} Importar PDF/imagem<input type="file" accept=".pdf,image/png,image/jpeg,image/webp" hidden onchange="AMAStudy.importFile(this)"></label>
            <span id="st-file-st" class="muted" style="font-size:12.5px"></span>
          </div>
          <p class="muted" style="font-size:11.5px;margin-top:10px">A importação de PDFs e imagens usa OCR no seu dispositivo (carrega a biblioteca na primeira utilização) e pode demorar. O texto nunca sai deste navegador.</p>
        </div>
        <div>
          <div class="card st-list-card"><h3>Os meus resumos</h3>${list}</div>
          ${planHtml()}
        </div>
      </div>`, MENU.aluno);
  }

  async function estudarDetail(id) {
    const d = store();
    const r = d.recs.find((x) => x.id === id);
    if (!r) { toast('Resumo não encontrado.'); return go('/estudar'); }
    const S = S_();
    const body = analysisBody(r.analysis, {
      extra: `<div class="card st-block st-actions"><button class="btn btn-f" onclick="go('/revisao')">${I.quiz} Rever cartões</button>
        <button class="btn btn-o" onclick="AMAStudy.exportSheet('${r.id}')">${I.doc} Exportar ficha</button>
        <button class="btn btn-o" onclick="AMAStudy.reanalisar('${r.id}')">${I.spark} Recalcular</button></div>`,
    });
    return panelShell('estudar', `
      <div class="page-h"><div><a class="lh-back" href="#/estudar" style="color:var(--muted)"><span class="lh-arr">${I.chev}</span> Estudar</a>
        <h1 style="margin-top:8px">${esc(r.title)}</h1>
        <p>${esc(subjectLabel(r.subject))} · ${fmtWhen(r.createdAt)} · ${S ? 'motor local determinístico' : 'motor a carregar'}</p></div>
        <div class="flex" style="gap:8px"><a class="btn btn-o btn-sm" href="#/estudar">Novo resumo</a></div></div>
      ${body}`, MENU.aluno);
  }

  /* ------------------------------------------------------------------ */
  /* Revisão espaçada                                                   */
  /* ------------------------------------------------------------------ */
  let RV = null;
  function queueFor(subject) {
    const S = S_();
    const d = store();
    const entries = d.recs.map((r) => ({ record: r, analysis: r.analysis }));
    try { return S.buildReviewQueue(entries, { subject: subject || 'all', limit: 20 }); }
    catch { return null; }
  }

  function revisaoView() {
    const S = S_();
    const q = queueFor(RV && RV.subject);
    if (!S || !q) return panelShell('revisao', '<div class="spinner"></div>', MENU.aluno);
    RV = { subject: (RV && RV.subject) || 'all', q, i: 0, revealed: false, done: 0 };
    const filt = `<div class="flex wrap" style="gap:7px;margin-bottom:14px">
      <button class="chip ${RV.subject === 'all' ? 'chip-v' : ''}" onclick="AMAStudy.rvFilter('all')">Todas</button>
      ${SUBJECTS.filter(([id]) => q.bySubject.some((b) => b.subject === id)).map(([id, label]) =>
      `<button class="chip ${RV.subject === id ? 'chip-v' : ''}" onclick="AMAStudy.rvFilter('${id}')">${esc(label)}</button>`).join('')}</div>`;
    /* A sessão de um cartão deixava meia página vazia. Os números que faltam
       estão no próprio baralho: quantos cartões, de que resumo, e o que está a
       rever agora. Tudo contado pelo motor, nada inventado. */
    const origens = q.records.slice(0, 6);
    const painel = origens.length ? `<div class="rv-side">
      <h2 class="rv-side-h">${I.book} De onde vêm estes cartões</h2>
      <div class="rv-orgs">${origens.map((r) => `<a class="rv-org" href="#/estudar/${escAttr(r.id)}">
        <b>${esc(r.title)}</b>
        <span class="rv-org-n"><i class="d" style="width:${Math.round(r.due / Math.max(1, r.total) * 100)}%"></i><i class="n" style="width:${Math.round(r.new / Math.max(1, r.total) * 100)}%"></i></span>
        <small>${r.due} a rever · ${r.new} novos · ${r.total} cartões</small></a>`).join('')}</div>
      <p class="rv-teclas"><span>Teclado</span><kbd>Espaço</kbd> mostra a resposta<kbd>1</kbd><kbd>2</kbd><kbd>3</kbd><kbd>4</kbd> avaliam — outra vez, difícil, bom, fácil</p>
    </div>` : '';
    return panelShell('revisao', `
      <div class="page-h"><div><h1>Revisão espaçada</h1><p>Cartões dos seus resumos, agendados pelo método SM-2. A sessão fica guardada neste navegador.</p></div>
        <a class="btn btn-o" href="#/estudar">${I.spark} Estudar</a></div>
      <div class="study-stats" style="margin-bottom:14px">
        <span class="chip chip-f">${q.dueCount} para rever</span>
        <span class="chip chip-v">${q.newCount} novos</span>
        <span class="chip">${q.scheduledCount} agendados</span>
        <span class="chip chip-g">${q.learned} já estudados</span>
        ${q.nextDue ? `<span class="chip">Próximo: ${esc(fmtDay(q.nextDue))}</span>` : ''}
      </div>
      ${filt}
      <div id="rv-stage">${rvStageHtml()}</div>${painel}`, MENU.aluno);
  }

  function rvStageHtml() {
    const q = RV.q;
    if (!q.items.length) {
      return `<div class="card empty">${I.check}<h3>Nada para rever agora</h3>
        <p>${q.totalCards ? 'Todos os cartões estão agendados para os próximos dias.' : 'Gere um resumo em <b>Estudar</b> para criar os primeiros cartões.'}</p>
        <a class="btn btn-f" style="margin-top:14px" href="#/estudar">Gerar resumo</a></div>`;
    }
    if (RV.i >= q.items.length) {
      return `<div class="card empty">${I.check}<h3>Sessão concluída</h3>
        <p>Reviseu ${RV.done} cartão${RV.done === 1 ? '' : 'ões'} nesta sessão. Os próximos ficam agendados automaticamente.</p>
        <div class="flex" style="gap:8px;justify-content:center;margin-top:14px"><button class="btn btn-p" onclick="AMAStudy.rvRestart()">Nova sessão</button><a class="btn btn-o" href="#/estudar">Estudar mais</a></div></div>`;
    }
    const it = q.items[RV.i];
    const iv = it.intervals || {};
    const pill = it.status === 'due' ? `<span class="chip chip-f">Em atraso · ${esc(fmtDay(it.due))}</span>` : `<span class="chip chip-v">Novo cartão</span>`;
    return `<div class="rv-wrap">
      <div class="rv-bar"><span class="muted">${RV.i + 1} de ${q.items.length}</span><span class="muted">${esc(it.recordTitle)}</span></div>
      <div class="card rv-card${RV.revealed ? ' revealed' : ''}">
        <div class="flex" style="justify-content:space-between;margin-bottom:10px">${pill}<span class="chip">${esc(subjectLabel(it.subject))}</span></div>
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
  /* Ferramentas do professor                                           */
  /* ------------------------------------------------------------------ */
  function professorView() {
    const d = store();
    const menu = S.user && S.user.papel === 'ADMIN' ? MENU.admin : MENU.instrutor;
    const opts = d.recs.map((r) => `<option value="${r.id}">${esc(r.title)}</option>`).join('');
    const attendance = attendanceSection(d);
    return panelShell('professor', `
      <div class="page-h"><div><h1>Ferramentas do professor</h1><p>Fichas, planos de aula, rubricas e presenças — gerados a partir do texto, neste dispositivo.</p></div></div>
      <div class="card st-block">
        <h3>1 · Fonte do conteúdo</h3>
        <div class="st-grid-in">
          <div class="field"><label>Resumo guardado</label><select id="pf-rec"><option value="">— usar texto colado —</option>${opts}</select></div>
          <div class="field"><label>Título do documento</label><input id="pf-title" maxlength="90" placeholder="Ex.: Ficha de exercícios — Fotossíntese"></div>
        </div>
        <div class="field"><label>Texto (se não escolher um resumo)</label><textarea id="pf-text" rows="5" placeholder="Cole o texto base para a ficha, o plano ou a rubrica."></textarea></div>
        <div class="flex wrap" style="gap:8px">
          <button class="btn btn-p" onclick="AMAStudy.makeWorksheet()">${I.doc} Ficha de exercícios</button>
          <button class="btn btn-o" onclick="AMAStudy.makePlan()">${I.calendar} Plano de aula</button>
          <button class="btn btn-o" onclick="AMAStudy.makeRubric()">${I.check} Rubrica</button>
        </div>
        <p class="muted" style="font-size:11.5px;margin-top:10px">Os documentos abrem numa janela de impressão. Nada é enviado para fora deste navegador e nenhum resultado é publicado automaticamente.</p>
      </div>
      ${attendance}` , menu);
  }

  let AT = null;
  function attendanceSection(d) {
    if (!S_()) return '<div class="card">A carregar o motor de estudo…</div>';
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
      <h3>2 · Presenças <span class="chip chip-f">registo local</span></h3>
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
  const sheetFoot = (note) => `<footer class="teacher-sheet-foot"><span>${esc(note)}</span><span>Gerado localmente · AMA</span></footer></div>`;

  function worksheetDoc(w) {
    const S = S_();
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
  let pending = null;

  const AMAStudy = {
    /* --- resumo --- */
    analisar() {
      const title = (document.getElementById('st-title') || {}).value || '';
      const subject = (document.getElementById('st-subject') || {}).value || 'geral';
      const text = (document.getElementById('st-text') || {}).value || '';
      const a = analyse(text, title, subject);
      if (!a) return toast('O motor ainda está a carregar — tente novamente.');
      if (a.insufficient) return toast('Texto demasiado curto: cole pelo menos 120 caracteres.');
      const d = store();
      const rec = { id: uid(), title: a.title, subject, text: a.text, analysis: a, createdAt: new Date().toISOString(), progress: { cards: {}, studied: false } };
      d.recs.unshift(rec);
      save(d);
      toast('Resumo criado · ' + (a.cards || []).length + ' cartões');
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
        if (ta) ta.value = r.text || '';
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
          <button class="btn btn-p btn-sm" onclick="AMAStudy.saveLesson()">${I.plus} Guardar nos meus resumos</button>
          <a class="btn btn-o btn-sm" href="#/estudar?aula=${ctx.id || ''}">${I.spark} Abrir em Estudar</a>
        </div></div>`;
    },
    saveLesson() {
      const ctx = window.__aulaCtx || {};
      const a = analyse(ctx.resumo || '', ctx.titulo || '', 'geral');
      if (!a || a.insufficient) return toast('Esta aula ainda não tem texto suficiente para resumir.');
      const d = store();
      const ja = d.recs.find((r) => r.title === a.title);
      if (ja) { toast('Já tem um resumo desta aula.'); return go('/estudar/' + ja.id); }
      const rec = { id: uid(), title: a.title, subject: 'geral', text: a.text, analysis: a, createdAt: new Date().toISOString(), progress: { cards: {}, studied: false } };
      d.recs.unshift(rec); save(d);
      toast('Guardado · ' + (a.cards || []).length + ' cartões criados');
      go('/estudar/' + rec.id);
    },
    /* Entrada programática (workshops, turmas, aulas): manda texto para o motor sem
       passar pelo formulário. Devolve false quando há texto a mais curto e o id do
       registo quando há — quem chama precisa do id para apontar para a ficha.
       Reenviar o mesmo título atualiza a análise e preserva o progresso. */
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
        rec = { id: uid(), title: full, subject, text: a.text, analysis: a, createdAt: new Date().toISOString(), progress: { cards: {}, studied: false } };
        d.recs.unshift(rec);
      }
      save(d);
      return rec.id;
    },
    /* Ficha do material de um tema, pelo título exacto que ingest constrói.
       É assim que a universidade mostra a prática de uma sessão sem ler o
       store de estudo à mão — a posse dos dados continua aqui. */
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
        if (ta && !ta.value) ta.value = aula.resumo || '';
        if (se && curso.categoria) {
          const map = { 'Desenvolvimento Pessoal': 'geral', 'Tecnologia': 'programacao', 'Negócios': 'empreendedorismo', 'Finanças': 'financas' };
          se.value = map[curso.categoria] || 'geral';
        }
        if (ta && ta.value) toast('Texto da aula carregado. Reveja e gere o resumo.');
      } catch (e) { toast(e.message); }
    },
    apagar(id) {
      if (!confirm('Apagar este resumo e os cartões associados?')) return;
      const d = store(); d.recs = d.recs.filter((r) => r.id !== id); save(d);
      toast('Resumo apagado.');
      RV = null; render();
    },
    reanalisar(id) {
      const d = store(); const r = d.recs.find((x) => x.id === id); if (!r) return;
      r.analysis = analyse(r.text, r.title, r.subject);
      save(d); toast('Resumo recalculado.'); render();
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
      /* .right/.wrong existem no CSS (marcador de caneta na pergunta certa,
         tremer na errada) mas só são pintados se alguém os pôr aqui. */
      box.classList.add(chosen === correct ? 'right' : 'wrong');
      [...box.querySelectorAll('.st-opts button')].forEach((b, i) => {
        b.disabled = true;
        if (i === correct) b.classList.add('ok');
        else if (i === chosen) b.classList.add('bad');
      });
      const exp = box.querySelector('.st-exp'); if (exp) exp.hidden = false;
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
        const st = document.getElementById('rv-stage');
        if (st) { /* reconstrói com os novos números */ const q = queueFor(RV.subject); if (q) { RV.q = q; } }
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
      if (!a) return toast('O motor ainda está a carregar.');
      if (a.insufficient) return toast('Precisa de mais texto: cole pelo menos 120 caracteres ou escolha um resumo.');
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
      const r = S.buildRubric('lab', { lang: 'pt', title });
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

  /* Ligação direta (#/estudar...) antes das rotas existirem: re-renderiza. */
  if (/^#\/(estudar|revisao|professor)/.test(location.hash)) setTimeout(() => render(), 0);

  /* Preenche o formulário a partir de ?aula=ID */
  if (/^#\/estudar\?/.test(location.hash)) {
    const aula = new URLSearchParams(location.hash.split('?')[1] || '').get('aula');
    if (aula) setTimeout(() => AMAStudy.fromLesson(aula), 60);
  }

  /* Num baralho o rato é o atraso: Espaço vira a carta e 1-4 avaliam. O
     listener vive no documento porque cada resposta substitui o HTML da etapa. */
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

  /* Estado de presença sobrevive a refreshAtt() dentro da mesma página */
  window.__amaStudyReset = () => { RV = null; AT = null; };
})();
