/* AMA — Aristides Miguel Academy · camada de dados local
   ------------------------------------------------------------------
   A app OMA falava com um servidor /api. A AMA funciona no dispositivo:
   este ficheiro responde às MESMAS rotas sobre localStorage, para que todas
   as páginas continuem a funcionar sem servidor. Nada aqui sai do navegador.
   Identidade: a primeira conta criada neste dispositivo é ADMIN (dono da
   escola); o admin promove professores na área de utilizadores.
   Palavras-passe: nunca guardadas em claro — só o SHA-256 com sal. */
(function () {
  'use strict';

  const KEY = 'ama-v1-db';
  const TICK = 'ama_notif_tick';
  const DAY = 86400000;
  const nowIso = () => new Date().toISOString().replace('T', ' ').slice(0, 19);
  /* O formato das datas de agenda é lido como hora local em toda a app
     (novo Date("YYYY-MM-DD HH:MM:SS")), por isso quem escreve também escreve
     em hora local — com nowIso() (UTC) as aulas apareceriam deslocadas. */
  const localIso = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')} `
    + `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}:00`;
  const clone = (v) => JSON.parse(JSON.stringify(v));
  const data = () => window.AMA_DATA || { cursos: [], categorias: [], detalhe: {}, live: [] };

  /* ---------------------------------------------------------------- store */
  function blank() {
    return {
      seq: 100,
      usuarios: [],
      sessao: null,
      inscricoes: [],
      progresso: [],
      notas: {},
      certificados: [],
      encomendas: [],
      notificacoes: [],
      notifPrefs: { aprendizagem: true, aulas: true, mensagens: true, pagamentos: true, sistema: true },
      iaHist: [],
      cursosExtras: [],
      live: { salas: [], eventos: [], perguntas: [], notas: [], enqueteVotos: {}, presenca: {} },
      auditoria: [],
    };
  }
  let DB = null;
  function load() {
    if (DB) return DB;
    try {
      const raw = localStorage.getItem(KEY);
      DB = raw ? Object.assign(blank(), JSON.parse(raw)) : blank();
    } catch { DB = blank(); }
    return DB;
  }
  function save() {
    try { localStorage.setItem(KEY, JSON.stringify(DB)); } catch (e) { /* quota cheia: a app continua em memória */ }
  }
  function nextId() { const db = load(); db.seq += 1; return db.seq; }

  /* --------------------------------------------------------- passwords */
  function randomSalt() {
    const a = new Uint8Array(16);
    if (window.crypto?.getRandomValues) crypto.getRandomValues(a);
    else for (let i = 0; i < a.length; i += 1) a[i] = Math.floor(Math.random() * 256);
    return [...a].map((b) => b.toString(16).padStart(2, '0')).join('');
  }
  async function sha256(text) {
    const bytes = new TextEncoder().encode(text);
    if (window.crypto?.subtle) {
      const d = await crypto.subtle.digest('SHA-256', bytes);
      return [...new Uint8Array(d)].map((b) => b.toString(16).padStart(2, '0')).join('');
    }
    let h = 2166136261;
    for (const b of bytes) { h ^= b; h = Math.imul(h, 16777619); }
    return 'fnv' + (h >>> 0).toString(16);
  }
  const hashPass = (senha, salt) => sha256(`ama|${salt}|${senha}`);

  /* ---------------------------------------------------------- helpers */
  const handleDe = (nome) => String(nome || '').trim().split(/\s+/)[0] || 'Aluno';
  const publicUser = (u) => ({ id: u.id, nome: u.nome, email: u.email, papel: u.papel, handle: u.handle, ativo: u.ativo });
  const me = () => { const db = load(); return uById(db, db.sessao); };
  function uById(db, id) { return db.usuarios.find((u) => u.id === id) || null; }

  function seedCursos(db) {
    const base = data().cursos.map((c) => ({ ...c }));
    return base.concat(db.cursosExtras || []);
  }
  function detalheDe(db, id) {
    const extra = (db.cursosExtras || []).find((c) => String(c.id) === String(id));
    if (extra) return { seccoes: extra.seccoes || [], instrutor: extra.instrutorObj, aoVivo: [] };
    return data().detalhe[String(id)] || { seccoes: [], instrutor: null, aoVivo: [] };
  }
  function cursoPorId(db, id) { return seedCursos(db).find((c) => String(c.id) === String(id)) || null; }
  function aulasDe(db, id) { return (detalheDe(db, id).seccoes || []).flatMap((s) => s.aulas || []); }
  function cursoCompleto(db, c) {
    const aulas = aulasDe(db, c.id);
    return { ...c, aulas: aulas.length || c.aulas, duracaoH: Math.round(aulas.reduce((a, x) => a + (x.dur_seg || 0), 0) / 360) / 10 || c.duracaoH };
  }
  function inscritoEm(db, userId, cursoId) {
    return (db.inscricoes || []).some((i) => i.user_id === userId && String(i.curso_id) === String(cursoId));
  }
  function progressoDe(db, userId, cursoId) {
    return (db.progresso || []).filter((p) => p.user_id === userId && String(p.course_id) === String(cursoId));
  }
  function pctDe(db, userId, cursoId) {
    const total = aulasDe(db, cursoId).length || 1;
    const done = new Set(progressoDe(db, userId, cursoId).filter((p) => p.concluido).map((p) => p.lesson_id));
    return { pct: Math.round((done.size / total) * 100), concluidas: done.size, total, done };
  }

  function avisar(db, userId, tipo, categoria, titulo, texto, link, meta) {
    db.notificacoes.unshift({
      id: nextId(), user_id: userId, tipo, categoria, titulo, texto: texto || '', link: link || '#/aluno',
      meta: meta || {}, lida: 0, criado_em: nowIso(),
    });
    if (db.notificacoes.length > 200) db.notificacoes.length = 200;
    try { localStorage.setItem(TICK, String(Date.now())); } catch { }
  }
  function auditar(db, nome, acao, detalhe) {
    db.auditoria.unshift({ id: nextId(), nome, acao, detalhe, criado_em: nowIso() });
    if (db.auditoria.length > 400) db.auditoria.length = 400;
  }

  /* -------------------------------------------------------------- auth */
  function registar({ nome, email, senha }) {
    const db = load();
    const mail = String(email || '').trim().toLowerCase();
    nome = String(nome || '').trim();
    if (nome.length < 3) throw erro('Indique o nome completo (mínimo 3 letras).');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(mail)) throw erro('Email inválido.');
    if (String(senha || '').length < 6) throw erro('A senha precisa de pelo menos 6 caracteres.');
    if (db.usuarios.some((u) => u.email === mail)) throw erro('Já existe uma conta com este email neste dispositivo.');
    return (async () => {
      const salt = randomSalt();
      const primeiro = db.usuarios.length === 0;
      const user = {
        id: nextId(), nome, email: mail, papel: primeiro ? 'ADMIN' : 'STUDENT', handle: handleDe(nome),
        ativo: 1, salt, hash: await hashPass(senha, salt), criado_em: nowIso(),
      };
      db.usuarios.push(user);
      db.sessao = user.id;
      const brandLabel = document.documentElement.dataset.brand === 'ceu' ? 'CEU Academy' : 'AMA';
      avisar(db, user.id, 'sistema', 'sistema', primeiro ? `Bem-vindo, diretor da ${brandLabel}` : `Bem-vindo à ${brandLabel}`,
        primeiro
          ? 'Esta é a primeira conta deste dispositivo: tem o papel de administrador. Crie o seu perfil de estudante ou professor em Utilizadores.'
          : 'A sua conta e progresso ficam guardados em base de dados local com sincronização automática.',
        primeiro ? '#/admin/utilizadores' : '#/aluno');
      auditar(db, nome, 'registo', 'Conta criada' + (primeiro ? ' como administrador' : ''));
      save();
      try {
        if (window.Study && window.Study.MvpDB && typeof window.Study.MvpDB.saveStudentCard === 'function') {
          window.Study.MvpDB.saveStudentCard({ id: `card-${user.id}`, nome: user.nome }).catch(() => {});
        }
      } catch { }
      return { user: publicUser(user) };
    })();
  }
  function login({ email, senha }) {
    const db = load();
    const mail = String(email || '').trim().toLowerCase();
    const user = db.usuarios.find((u) => u.email === mail);
    if (!user) return Promise.reject(erro('Email ou senha incorretos.'));
    if (!user.ativo) return Promise.reject(erro('Conta bloqueada pelo administrador.'));
    return hashPass(String(senha || ''), user.salt).then((h) => {
      if (h !== user.hash) throw erro('Email ou senha incorretos.');
      db.sessao = user.id;
      save();
      return { user: publicUser(user) };
    });
  }

  /* ------------------------------------------------------- catálogo */
  function catalogo() {
    const db = load();
    const cursos = seedCursos(db)
      .filter((c) => c.estado === 'PUBLIC' || (db.sessao && c.instrutor_id === db.sessao))
      .map((c) => cursoCompleto(db, c));
    const cats = [...new Set(cursos.map((c) => c.categoria))];
    return { cursos, categorias: ['Todas', ...cats], inscritos: db.sessao ? db.inscricoes.filter((i) => i.user_id === db.sessao).map((i) => i.curso_id) : [] };
  }
  function cursoView(id) {
    const db = load();
    const c = cursoPorId(db, id);
    if (!c) throw erro('Curso não encontrado.');
    const det = detalheDe(db, id);
    const user = me();
    const pr = user ? progressoDe(db, user.id, id) : [];
    const done = new Set(pr.filter((p) => p.concluido).map((p) => p.lesson_id));
    const todas = (det.seccoes || []).flatMap((s) => s.aulas || []);
    return {
      curso: cursoCompleto(db, c),
      seccoes: det.seccoes || [],
      instrutor: det.instrutor || instrutorDe(db, c.instrutor_id),
      inscrito: user ? inscritoEm(db, user.id, id) : false,
      progresso: pr.map((p) => ({ lesson_id: p.lesson_id, concluido: p.concluido ? 1 : 0, visto_seg: p.visto_seg || 0 })),
      proximaAula: todas.find((a) => !done.has(a.id)) || todas[0] || null,
      aoVivo: rooms().filter((r) => String(r.curso_id) === String(id)),
    };
  }
  function instrutorDe(db, id) {
    const u = uById(db, id);
    if (u) return { id: u.id, nome: u.nome, handle: u.handle, avatar_cor: ['#f59e0b', '#0d7a6f', '#2563eb', '#ec4899'][u.id % 4] };
    for (const k of Object.keys(data().detalhe)) {
      const i = data().detalhe[k].instrutor;
      if (i && String(i.id) === String(id)) return i;
    }
    return { id, nome: 'Professor AMA', handle: 'Professor', avatar_cor: '#0d7a6f' };
  }

  /* --------------------------------------------------------- checkout */
  const REF = () => String(Math.floor(100000000 + Math.random() * 899999999)).replace(/(\d{3})(\d{3})(\d{3})/, '$1 $2 $3');
  function checkout({ cursoId, metodo, coupon }) {
    const db = load();
    const user = me(); if (!user) throw erro('Entre na sua conta.');
    const c = cursoPorId(db, cursoId); if (!c) throw erro('Curso não encontrado.');
    let total = Number(c.preco_kz) || 0;
    if (String(coupon || '').trim().toUpperCase() === 'BEMVINDO10') total = Math.round(total * 0.9);
    const enc = {
      id: nextId(), user_id: user.id, curso_id: c.id, curso: c.titulo, aluno: user.nome,
      valor_kz: total, metodo: metodo === 'UNITEL' ? 'UNITEL' : 'MULTICAIXA',
      referencia: REF(), estado: 'PENDENTE', criado_em: nowIso(), pago_em: null, coupon: coupon || null,
    };
    db.encomendas.unshift(enc);
    auditar(db, user.nome, 'checkout', `Referência ${enc.referencia} · ${c.titulo} · ${total} Kz`);
    save();
    return {
      encomendaId: enc.id, referencia: enc.referencia, metodo: enc.metodo, total,
      instrucoes: 'Referência criada neste dispositivo. No modo local o pagamento é simulado — nenhum valor real é movido.',
    };
  }
  function simularPagamento({ encomendaId }) {
    const db = load();
    const enc = db.encomendas.find((e) => e.id === Number(encomendaId));
    if (!enc) throw erro('Encomenda não encontrada.');
    if (enc.estado === 'PAGO') return { ok: true, jaPago: true };
    enc.estado = 'PAGO'; enc.pago_em = nowIso();
    const user = uById(db, enc.user_id);
    if (!inscritoEm(db, enc.user_id, enc.curso_id)) db.inscricoes.push({ user_id: enc.user_id, curso_id: enc.curso_id, criado_em: nowIso() });
    if (user) {
      avisar(db, user.id, 'conta', 'pagamentos', 'Matrícula confirmada', `Entrou em «${enc.curso}». Bom estudo!`, '#/aprender/' + enc.curso_id, { valor: enc.valor_kz, curso_id: enc.curso_id });
      const instr = cursoPorId(db, enc.curso_id)?.instrutor_id;
      if (instr && instr !== user.id) avisar(db, instr, 'venda', 'pagamentos', 'Nova matrícula', `${user.nome} matriculou-se em «${enc.curso}».`, '#/instrutor/financeiro', { valor: enc.valor_kz, curso_id: enc.curso_id });
    }
    auditar(db, enc.aluno, 'pagamento', `${enc.referencia} confirmada (simulação local)`);
    save();
    return { ok: true };
  }

  /* -------------------------------------------------------- progresso */
  function progresso({ aulaId, concluido, vistoSeg }) {
    const db = load();
    const user = me(); if (!user) throw erro('Entre na sua conta.');
    let cursoId = null, aula = null;
    for (const c of seedCursos(db)) {
      const found = aulasDe(db, c.id).find((a) => a.id === Number(aulaId));
      if (found) { cursoId = c.id; aula = found; break; }
    }
    if (!cursoId) throw erro('Aula não encontrada.');
    if (!inscritoEm(db, user.id, cursoId) && !aula.livre) throw erro('Matricule-se para registar progresso.');
    const curso = cursoPorId(db, cursoId);
    let row = db.progresso.find((p) => p.user_id === user.id && p.lesson_id === aula.id);
    if (!row) { row = { user_id: user.id, lesson_id: aula.id, course_id: cursoId, concluido: false, visto_seg: 0 }; db.progresso.push(row); }
    if (typeof concluido === 'boolean') row.concluido = concluido;
    if (vistoSeg != null) row.visto_seg = Math.max(row.visto_seg || 0, Number(vistoSeg) || 0);
    row.atualizado_em = nowIso();
    const pct = pctDe(db, user.id, cursoId);
    let certificado = null;
    if (pct.pct === 100) {
      const existe = db.certificados.find((c) => c.user_id === user.id && String(c.curso_id) === String(cursoId));
      if (!existe) certificado = emitirCertificado(db, user, curso);
    }
    save();
    return { pct: pct.pct, certificado };
  }
  function emitirCertificado(db, user, curso) {
    const det = detalheDe(db, curso.id);
    const aula = aulasDe(db, curso.id);
    const codigo = `AMA-${String(curso.id).padStart(2, '0')}-${String(user.id).padStart(5, '0')}-${String(nextId()).slice(-4)}`;
    const cert = {
      id: nextId(), user_id: user.id, curso_id: curso.id, curso: curso.titulo, nome: user.nome,
      instrutor: det.instrutor?.nome || 'Professor AMA', aulas: aula.length,
      dur_seg: aula.reduce((a, x) => a + (x.dur_seg || 0), 0), nivel: curso.nivel,
      emitido_em: nowIso(), codigo,
    };
    db.certificados.unshift(cert);
    avisar(db, user.id, 'cert', 'aprendizagem', 'Certificado emitido', `Concluiu «${curso.titulo}». Código ${codigo}.`, '#/certificados', { curso_id: curso.id });
    auditar(db, user.nome, 'certificado', `${codigo} · ${curso.titulo}`);
    return codigo;
  }

  /* ------------------------------------------------------------ aluno */
  function alunoPainel() {
    const db = load();
    const user = me(); if (!user) throw erro('Entre na sua conta.');
    const cursos = db.inscricoes.filter((i) => i.user_id === user.id).map((i) => {
      const c = cursoPorId(db, i.curso_id);
      if (!c) return null;
      const p = pctDe(db, user.id, c.id);
      return { ...cursoCompleto(db, c), pct: p.pct, concluidas: p.concluidas, aulas: p.total };
    }).filter(Boolean);
    const totalAulas = cursos.reduce((a, c) => a + c.aulas, 0);
    const feitas = cursos.reduce((a, c) => a + c.concluidas, 0);
    const seg = db.progresso.filter((p) => p.user_id === user.id).reduce((a, p) => a + (p.visto_seg || 0), 0);
    const certs = db.certificados.filter((c) => c.user_id === user.id);
    const inscritos = new Set(db.inscricoes.filter((i) => i.user_id === user.id).map((i) => String(i.curso_id)));
    return {
      cursos: cursos.length ? cursos : [],
      progressoGlobal: totalAulas ? Math.round((feitas / totalAulas) * 100) : 0,
      stats: { cursos: cursos.length, aulasConcluidas: feitas, horas: Math.round(seg / 3600), certificados: certs.length },
      recomendados: catalogo().cursos.filter((c) => !inscritos.has(String(c.id))).slice(0, 4),
    };
  }
  function certificados() {
    const db = load(); const user = me(); if (!user) return [];
    return db.certificados.filter((c) => c.user_id === user.id);
  }
  function verificar(codigo) {
    const db = load();
    const c = db.certificados.find((x) => x.codigo.toLowerCase() === String(codigo || '').toLowerCase());
    if (!c) throw erro('Código não encontrado neste dispositivo.');
    return { ...c, aluno: c.nome };
  }

  /* ------------------------------------------------------------ notas */
  function nota(aulaId, body) {
    const db = load(); const user = me(); if (!user) throw erro('Entre na sua conta.');
    const k = `${user.id}:${aulaId}`;
    if (body && typeof body.texto === 'string') {
      db.notas[k] = { texto: body.texto.slice(0, 20000), atualizado_em: nowIso() };
      save();
    }
    return db.notas[k] || { texto: '', atualizado_em: null };
  }

  /* ------------------------------------------------------------- IA */
  const STOP = new Set('a o e de da do das dos que em um uma para por com nao não se ao à às os as é ser são como mais mas ou quando onde qual quais quem este esta esse essa isto isso ja já muito pouco sobre entre até sem seu sua seus suas eu tu ele ela nos nós vos lhe the of and to in is are for with on at from this that'.split(' '));
  const words = (s) => String(s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').match(/[a-z0-9]{4,}/g) || [];
  function perguntaIA({ pergunta, cursoId }) {
    const db = load(); const user = me();
    const q = words(pergunta);
    const qSet = new Set(q.filter((w) => !STOP.has(w)));
    const universo = catalogo().cursos.filter((c) => !cursoId || String(c.id) === String(cursoId));
    const hits = [];
    for (const c of universo) {
      for (const s of detalheDe(db, c.id).seccoes) {
        for (const a of s.aulas) {
          const hay = new Set(words(`${a.titulo} ${a.resumo || ''}`));
          let score = 0;
          for (const w of qSet) if (hay.has(w)) score += 1;
          if (score) hits.push({ score, curso: c.titulo, aula: a.titulo, resumo: a.resumo || '', cursoId: c.id, aulaId: a.id });
        }
      }
    }
    hits.sort((a, b) => b.score - a.score);
    const top = hits.slice(0, 3);
    let resposta;
    if (!top.length) {
      resposta = 'Não encontrei nada no material dos cursos sobre isso. Neste dispositivo só respondo com base nas transcrições das aulas — não invento. Tente outras palavras ou cole o texto na área Estudar.';
    } else if (top[0].score < 2) {
      resposta = `O sinal mais próximo nos materiais é «${top[0].aula}» (${top[0].curso}), mas o texto não chega para responder com segurança. Posso ajudar com o que estiver escrito na aula — abra a aula e leia o resumo.`;
    } else {
      resposta = top.map((t) => `**${t.aula}** — ${t.resumo ? t.resumo.replace(/\s+/g, ' ').slice(0, 260).trim() + (t.resumo.length > 260 ? '…' : '') : 'Aula sem transcrição disponível.'}`).join('\n\n');
    }
    const reg = { id: nextId(), user_id: user?.id || null, pergunta, resposta, fontes: top.map((t) => ({ curso: t.curso, aula: t.aula })), criado_em: nowIso() };
    db.iaHist.unshift(reg); if (db.iaHist.length > 60) db.iaHist.length = 60;
    save();
    return { resposta, fontes: reg.fontes, cursos: top.slice(0, 2).map((t) => catalogo().cursos.find((c) => c.id === t.cursoId)).filter(Boolean) };
  }

  /* ------------------------------------------------------ notificações */
  function notificacoes() {
    const db = load(); const user = me();
    if (!user) return { itens: [], naoLidas: 0, cats: [] };
    const prefs = db.notifPrefs || {};
    const itens = db.notificacoes.filter((n) => n.user_id === user.id && prefs[n.categoria] !== false).slice(0, 30);
    return { itens, naoLidas: itens.filter((n) => !n.lida).length, cats: ['aprendizagem', 'aulas', 'mensagens', 'pagamentos', 'sistema'].filter((c) => prefs[c] !== false) };
  }

  /* ---------------------------------------------------------- ao vivo */
  function roomView(db, r) {
    const evs = db.live.eventos.filter((e) => e.room_id === r.id);
    const qs = db.live.perguntas.filter((q) => q.room_id === r.id);
    const user = me();
    return {
      ...r,
      mensagens: evs.filter((e) => e.tipo === 'chat').length,
      perguntas: qs.length,
      presenca: r.estado === 'AO_VIVO' ? Math.max(1, Object.keys(db.live.presenca[r.id] || {}).length) : 0,
      inscrito: !!user && !!r.inscritos?.[user.id],
      lembrou: !!user && !!r.lembretes?.[user.id],
      inscritos: 1 + Object.keys(r.inscritos || {}).length,
      acesso: { ok: true, host: !!user && (user.id === r.instrutor_id || user.papel === 'ADMIN') },
    };
  }
  /* As salas do seed têm datas escritas no dia em que o seed foi gerado. Sem
     reancoragem, "Workshop …" passado lia-se AGORA na agenda e a próxima aula
     caía às 01:03. Só tocamos nas salas de demonstração (os ids do seed); as
     salas que um professor cria neste dispositivo ficam como ele as pôs. */
  const HORAS_AULA = [10, 15, 18];
  const DEMO_IDS = () => new Set((data().live || []).map((r) => String(r.id)));
  function replan(r) {
    if (!DEMO_IDS().has(String(r.id))) return r;
    if (r.estado === 'AO_VIVO') return { ...r, agenda_em: localIso(new Date()) };
    const n = Math.abs(Number(r.id) || 1);
    const d = new Date();
    d.setDate(d.getDate() + 1 + (n % 3));
    d.setHours(HORAS_AULA[n % 3], 0, 0, 0);
    return { ...r, agenda_em: localIso(d) };
  }
  function rooms() {
    const db = load();
    const seed = (db.live.salas.length ? db.live.salas : data().live || []).map((r) => roomView(db, replan(r)));
    return seed;
  }
  function roomRaw(id) {
    const db = load();
    if (!db.live.salas.length) db.live.salas = clone(data().live || []);
    return db.live.salas.find((r) => String(r.id) === String(id)) || null;
  }

  /* ------------------------------------------------------ instrutor */
  function instrutorPainel() {
    const db = load(); const user = me();
    const cursos = seedCursos(db).filter((c) => c.instrutor_id === user?.id).map((c) => cursoCompleto(db, c));
    const alunos = new Set(db.inscricoes.filter((i) => cursos.some((c) => String(c.id) === String(i.curso_id))).map((i) => i.user_id)).size;
    const pagos = db.encomendas.filter((e) => e.estado === 'PAGO' && cursos.some((c) => String(c.id) === String(e.curso_id)));
    const vendas30d = [];
    for (let i = 29; i >= 0; i -= 1) {
      const d = new Date(Date.now() - i * DAY).toISOString().slice(0, 10);
      const v = pagos.filter((p) => String(p.pago_em || '').slice(0, 10) === d).reduce((a, p) => a + Number(p.valor_kz), 0);
      vendas30d.push({ dia: d, v });
    }
    return {
      cursos,
      stats: { alunos, receitaKz: Math.round(pagos.reduce((a, p) => a + Number(p.valor_kz), 0) * 0.8), pagamentos: pagos.reduce((a, p) => a + Number(p.valor_kz), 0) },
      vendas30d,
      atividades: db.auditoria.filter((a) => a.acao !== 'certificado').slice(0, 6),
    };
  }

  /* ---------------------------------------------------------- admin */
  function adminPainel() {
    const db = load();
    const cursos = seedCursos(db).map((c) => cursoCompleto(db, c));
    const ordens = db.encomendas.map((e) => ({ ...e, estado: e.estado }));
    const pagas = ordens.filter((o) => o.estado === 'PAGO');
    const crescimento = {};
    for (const u of db.usuarios) {
      const mes = String(u.criado_em || '').slice(0, 7);
      crescimento[mes] = crescimento[mes] || {};
      crescimento[mes][u.papel] = (crescimento[mes][u.papel] || 0) + 1;
    }
    const categorias = {};
    for (const c of cursos) categorias[c.categoria] = (categorias[c.categoria] || 0) + 1;
    return {
      stats: {
        usuarios: db.usuarios.filter((u) => u.ativo).length,
        cursosAtivos: cursos.filter((c) => c.estado === 'PUBLIC').length,
        transacoes: pagas.length, receitaKz: pagas.reduce((a, o) => a + Number(o.valor_kz), 0),
        pendentes: cursos.filter((c) => c.estado === 'PENDENTE').length,
      },
      crescimento: Object.entries(crescimento).flatMap(([mes, pap]) => Object.entries(pap).map(([papel, n]) => ({ mes, papel, n }))),
      ordens, cursos,
      utilizadores: db.usuarios.map((u) => ({ id: u.id, nome: u.nome, email: u.email, papel: u.papel, ativo: u.ativo, criado_em: u.criado_em })),
      ultimosUsuarios: db.usuarios.slice(-5).reverse().map((u) => ({ id: u.id, nome: u.nome, email: u.email, papel: u.papel, criado_em: u.criado_em })),
      categorias: Object.entries(categorias).map(([categoria, n]) => ({ categoria, n })),
      auditoria: db.auditoria.slice(0, 40),
    };
  }
  function criarCurso(body) {
    const db = load(); const user = me(); if (!user) throw erro('Entre na sua conta.');
    const titulo = String(body.titulo || '').trim();
    if (titulo.length < 3) throw erro('Indique um título com pelo menos 3 caracteres.');
    const rawSecs = Array.isArray(body.seccoes) && body.seccoes.length
      ? body.seccoes
      : [{ titulo: 'Módulo 1 — Introdução', aulas: [{ titulo: 'Aula de abertura', duracao_min: 10, livre: 1, transcript: body.resumo || '' }] }];
    let totalMin = 0;
    const seccoes = rawSecs.map((sec, si) => ({
      id: nextId(),
      titulo: String(sec.titulo || `Módulo ${si + 1}`).trim(),
      ordem: si + 1,
      aulas: (Array.isArray(sec.aulas) && sec.aulas.length ? sec.aulas : [{ titulo: 'Aula 1', duracao_min: 10 }]).map((a, ai) => {
        const dm = Math.max(2, Number(a.duracao_min) || 10);
        totalMin += dm;
        return {
          id: nextId(),
          titulo: String(a.titulo || `Aula ${ai + 1}`).trim(),
          ordem: ai + 1,
          duracao_min: dm,
          livre: (si === 0 && ai === 0) || a.livre ? 1 : 0,
          video: a.video || '',
          transcript: String(a.transcript || body.resumo || '').slice(0, 6000),
        };
      }),
    }));
    const publicarAgora = body.publicarAgora !== false;
    const estado = publicarAgora ? 'PUBLIC' : (ESTADOS.has(body.estado) ? body.estado : 'PENDENTE');
    const aprendizagens = Array.isArray(body.aprendizagens)
      ? body.aprendizagens.map((x) => String(x || '').trim()).filter(Boolean).slice(0, 8)
      : String(body.aprendizagens || '').split('\n').map((x) => x.trim()).filter(Boolean).slice(0, 8);
    const totalAulas = seccoes.flatMap((s) => s.aulas).length;
    const curso = {
      id: nextId(), titulo,
      slug: titulo.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''),
      categoria: body.categoria || 'Negócios', nivel: body.nivel || 'Iniciante', preco_kz: Math.max(0, Number(body.precoKz) || 0),
      preco_anterior_kz: Number(body.precoAnteriorKz) || Math.max(0, Number(body.precoKz) || 0),
      rating: 5.0, alunos: 1, instrutor_id: user.id,
      resumo: String(body.resumo || '').slice(0, 800),
      aprendizagens, requisitos: [],
      poster: body.poster || 'card-lideranca-v2',
      estado, criado_em: nowIso(), aulas: totalAulas, duracaoH: Math.max(1, Math.round(totalMin / 60)),
      instrutor: user.nome, instrutorObj: { id: user.id, nome: user.nome, handle: user.handle, avatar_cor: '#0f7a53' },
      seccoes,
    };
    db.cursosExtras.push(curso);
    if (!inscritoEm(db, user.id, curso.id)) db.inscricoes.push({ user_id: user.id, curso_id: curso.id, criado_em: nowIso() });
    if (user.papel === 'STUDENT') {
      const u = uById(db, user.id); if (u) u.papel = 'INSTRUCTOR';
    }
    auditar(db, user.nome, 'curso-criado', `${curso.titulo} (${estado})`);
    const admins = db.usuarios.filter((u) => u.papel === 'ADMIN');
    if (estado === 'PENDENTE') {
      admins.forEach((a) => avisar(db, a.id, 'aprov', 'aprendizagem', 'Curso à espera de aprovação', `${user.nome} submeteu «${curso.titulo}».`, '#/admin/cursos'));
    } else {
      avisar(db, user.id, 'aprov', 'aprendizagem', 'Curso publicado!', `«${curso.titulo}» já está visível no catálogo local.`, '#/curso/' + curso.id);
    }
    save();
    return {
      ok: true, id: curso.id, estado,
      mensagem: estado === 'PUBLIC' ? 'Curso publicado no catálogo! Já pode partilhar e dar aulas.' : 'Curso guardado — pronto para revisão ou publicação.',
    };
  }
  function criarSalaAoVivo(body) {
    const db = load(); const user = me(); if (!user) throw erro('Entre na sua conta.');
    if (!db.live.salas.length) db.live.salas = clone(data().live || []);
    const titulo = String(body.titulo || '').trim() || 'Aula ao vivo AMA';
    const cid = body.cursoId ? Number(body.cursoId) : null;
    const c = cid ? cursoPorId(db, cid) : null;
    const sala = {
      id: nextId(),
      titulo,
      curso_id: c ? c.id : 1,
      curso: c ? c.titulo : (body.curso || 'Sessão aberta AMA'),
      instrutor_id: user.id,
      instrutor: user.nome,
      estado: body.agora === false ? 'AGENDADA' : 'AO_VIVO',
      agenda_em: body.agendaEm || localIso(new Date()),
      duracao_min: Math.max(15, Number(body.duracaoMin) || 60),
      inscritos: { [user.id]: true },
      lembretes: {},
    };
    db.live.salas.unshift(sala);
    if (user.papel === 'STUDENT') { const u = uById(db, user.id); if (u) u.papel = 'INSTRUCTOR'; }
    auditar(db, user.nome, 'sala-criada', titulo);
    save();
    return { ok: true, id: sala.id, sala: roomView(db, sala) };
  }
  const ESTADOS = new Set(['PUBLIC', 'PENDENTE', 'RASCUNHO', 'ARQUIVADO']);

  /* -------------------------------------------------------------- erro */
  function erro(msg, status = 400) { return Object.assign(new Error(msg), { status }); }

  /* -------------------------------------------------------- router */
  async function handle(path, opts) {
    const [rawPath, rawQuery] = String(path).split('?');
    const p = rawPath.replace(/\/+$/, '');
    const qs = new URLSearchParams(rawQuery || '');
    const m = String(opts?.method || 'GET').toUpperCase();
    const body = opts?.body || {};
    const db = load();
    let mm;

    /* auth */
    if (p === '/api/auth/registo' && m === 'POST') return registar(body);
    if (p === '/api/auth/login' && m === 'POST') return login(body);
    if (p === '/api/auth/logout') { db.sessao = null; save(); return { ok: true }; }
    if (p === '/api/me') { const u = me(); if (!u) throw erro('Sessão terminada.', 401); return { user: publicUser(u) }; }

    /* catálogo */
    if (p === '/api/catalogo') return catalogo();
    if ((mm = p.match(/^\/api\/cursos\/(\d+)$/))) return cursoView(Number(mm[1]));
    /* aula individual (texto escrito) — usada pelo módulo de estudo */
    if ((mm = p.match(/^\/api\/aulas\/(\d+)$/))) {
      const user = me(); if (!user) throw erro('Entre na sua conta.', 401);
      const alvo = seedCursos(db).map((c) => ({ curso: c, aulas: aulasDe(db, c.id) }))
        .find((x) => x.aulas.some((a) => String(a.id) === mm[1]));
      if (!alvo) throw erro('Aula não encontrada.', 404);
      const aula = alvo.aulas.find((a) => String(a.id) === mm[1]);
      const podeAbrir = aula.livre || user.papel === 'ADMIN' ||
        String(alvo.curso.instrutor_id) === String(user.id) || inscritoEm(db, user.id, alvo.curso.id);
      if (!podeAbrir) throw erro('Matricule-se para abrir esta aula.', 403);
      return { aula: { ...aula, curso_id: alvo.curso.id }, curso: { id: alvo.curso.id, titulo: alvo.curso.titulo, categoria: alvo.curso.categoria } };
    }
    if (p === '/api/checkout' && m === 'POST') return checkout(body);
    if (p === '/api/pagamentos/simular' && m === 'POST') return simularPagamento(body);
    if (p === '/api/progresso' && m === 'POST') return progresso(body);
    if ((mm = p.match(/^\/api\/aulas\/(\d+)\/nota$/))) return nota(Number(mm[1]), m === 'POST' ? body : null);
    if ((mm = p.match(/^\/api\/aulas\/(\d+)\/manifest$/))) {
      const user = me(); if (!user) throw erro('Entre na sua conta.', 401);
      const alvo = seedCursos(db).map((c) => ({ curso: c, aulas: aulasDe(db, c.id) }))
        .find((x) => x.aulas.some((a) => String(a.id) === mm[1]));
      const aula = alvo && alvo.aulas.find((a) => String(a.id) === mm[1]);
      const podeAbrir = aula && (aula.livre || user.papel === 'ADMIN' ||
        String(alvo.curso.instrutor_id) === String(user.id) || inscritoEm(db, user.id, alvo.curso.id));
      if (!podeAbrir) throw erro('Matricule-se para abrir esta aula.', 403);
      return {
        local: true,
        url: null,
        watermark: `AMA · ${user.nome} · ${user.id}`,
        aula: aula ? { id: aula.id, titulo: aula.titulo, resumo: aula.resumo, dur_seg: aula.dur_seg, tipo: aula.tipo } : null,
        aviso: 'Aula em modo local: sem vídeo alojado. O conteúdo escrito abaixo é o material desta aula.',
      };
    }

    /* aluno */
    if (p === '/api/aluno/painel') return alunoPainel();
    if (p === '/api/certificados') return certificados();
    if ((mm = p.match(/^\/api\/verificar\/(.+)$/))) return verificar(decodeURIComponent(mm[1]));

    /* IA */
    if (p === '/api/ia/pergunta' && m === 'POST') return perguntaIA(body);
    if (p === '/api/ia/historico') { const u = me(); return (db.iaHist || []).filter((h) => h.user_id === u?.id).map((h) => ({ pergunta: h.pergunta, resposta: h.resposta, criado_em: h.criado_em })); }

    /* notificações */
    if (p === '/api/notificacoes') return notificacoes();
    if (p === '/api/notificacoes/lida' && m === 'POST') {
      const n = db.notificacoes.find((x) => x.id === Number(body.id)); if (n) n.lida = 1; save(); return { ok: true };
    }
    if (p === '/api/notificacoes/ler-todas' && m === 'POST') {
      const u = me(); db.notificacoes.filter((n) => n.user_id === u?.id).forEach((n) => { n.lida = 1; }); save(); return { ok: true };
    }
    if (p === '/api/notificacoes/prefs') {
      if (m === 'POST') { db.notifPrefs[body.categoria] = !!body.ativo; save(); }
      return { prefs: db.notifPrefs };
    }

    /* biblioteca de vídeos (modo local: sem ficheiros de vídeo) */
    if (p === '/api/biblioteca') return [];

    /* instrutor & criador */
    if (p === '/api/conta/modo-criador' && m === 'POST') {
      const u = me(); if (!u) throw erro('Entre na sua conta.');
      if (u.papel === 'STUDENT') { u.papel = 'INSTRUCTOR'; auditar(db, u.nome, 'modo-criador', 'Ativou perfil de formador'); save(); }
      return { ok: true, user: publicUser(u) };
    }
    if (p === '/api/instrutor/painel') return instrutorPainel();
    if (p === '/api/instrutor/cursos' && m === 'POST') return criarCurso(body);
    if (p === '/api/instrutor/ao-vivo' && m === 'POST') return criarSalaAoVivo(body);

    /* admin */
    if (p === '/api/admin/painel') return adminPainel();
    if ((mm = p.match(/^\/api\/admin\/utilizadores\/(\d+)$/)) && m === 'PATCH') {
      const u = uById(db, Number(mm[1])); if (!u) throw erro('Utilizador não encontrado.');
      if (body.papel && ['STUDENT', 'INSTRUCTOR', 'ADMIN'].includes(body.papel)) u.papel = body.papel;
      if (body.ativo != null) u.ativo = body.ativo ? 1 : 0;
      auditar(db, me()?.nome || 'admin', 'utilizador-atualizado', `${u.email} → ${u.papel}${u.ativo ? '' : ' (bloqueado)'}`);
      if (!u.ativo && db.sessao === u.id) db.sessao = null;
      save(); return { ok: true };
    }
    if ((mm = p.match(/^\/api\/admin\/cursos\/(\d+)$/)) && m === 'PATCH') {
      const c = cursoPorId(db, Number(mm[1])); if (!c) throw erro('Curso não encontrado.');
      if (ESTADOS.has(body.estado)) {
        if (c.instrutorObj) db.cursosExtras.find((x) => x.id === c.id).estado = body.estado;
        else {
          const base = data().cursos.find((x) => x.id === c.id);
          if (base) { (db.cursosExtras.find((x) => x.id === c.id) || db.cursosExtras.push({ ...base })) && (db.cursosExtras.find((x) => x.id === c.id).estado = body.estado); }
        }
        auditar(db, me()?.nome || 'admin', 'curso', `${c.titulo} → ${body.estado}`);
        save();
      }
      return { ok: true };
    }

    /* ao vivo */
    if (p === '/api/ao-vivo' && m === 'GET') return rooms();
    if (p === '/api/ao-vivo/gravadas') return rooms().filter((r) => r.estado === 'ENCERRADA');
    if (p === '/api/ao-vivo' && m === 'POST') {
      const user = me(); if (!user) throw erro('Entre na sua conta.', 401);
      if (!db.live.salas.length) db.live.salas = clone(data().live || []);
      const sala = {
        id: nextId(), instrutor_id: user.id, titulo: String(body.titulo || 'Aula ao vivo').slice(0, 120), curso_id: null,
        estado: 'AO_VIVO', agenda_em: nowIso(), criado_em: nowIso(), tipo: 'PUBLICA', descricao: 'Sala criada neste dispositivo.',
        objetivos: [], materiais: [], resumo: null, gravacao: null, duracao_min: 60, instrutor: user.nome, handle: user.nome.split(' ')[0],
        curso: null, inscritos: {}, lembretes: {},
      };
      db.live.salas.unshift(sala);
      auditar(db, user.nome, 'sala-criada', sala.titulo);
      save(); return { id: sala.id };
    }
    if ((mm = p.match(/^\/api\/ao-vivo\/(\d+)\/(inscrever|lembrete|entrar|ping)$/))) {
      const user = me(); if (!user) throw erro('Entre na sua conta.', 401);
      const r = roomRaw(Number(mm[1])); if (!r) throw erro('Sala não encontrada.');
      const acao = mm[2];
      if (acao === 'inscrever' || acao === 'lembrete') {
        const campo = acao === 'inscrever' ? 'inscritos' : 'lembretes';
        r[campo] = r[campo] || {}; r[campo][user.id] = true; save();
        return acao === 'inscrever' ? { ok: true, msg: 'Lugar reservado neste dispositivo.' } : { ok: true, msg: 'Lembrete ativo.' };
      }
      if (acao === 'entrar' || acao === 'ping') {
        db.live.presenca[r.id] = db.live.presenca[r.id] || {};
        db.live.presenca[r.id][user.id] = Date.now();
        db.live.eventos.push({ id: nextId(), room_id: r.id, tipo: 'join', user_id: user.id, nome: user.nome, texto: '', criado_em: Date.now() });
        save(); return { ok: true };
      }
    }
    if ((mm = p.match(/^\/api\/ao-vivo\/(\d+)\/eventos$/))) {
      const after = Number(qs.get('after') || 0);
      return db.live.eventos.filter((e) => e.room_id === Number(mm[1]) && e.id > after);
    }
    if ((mm = p.match(/^\/api\/ao-vivo\/(\d+)\/(chat|pergunta|reacao|nota)$/)) && m === 'POST') {
      const user = me(); if (!user) throw erro('Entre na sua conta.', 401);
      const r = roomRaw(Number(mm[1])); if (!r) throw erro('Sala não encontrada.');
      const kind = mm[2];
      const texto = String(body.texto || body.emoji || '').slice(0, 500);
      if (!texto) throw erro('Mensagem vazia.');
      if (kind === 'pergunta') {
        const q = { id: nextId(), room_id: r.id, user_id: user.id, nome: user.nome, texto, votos: 0, respondida: 0, resposta: null, criado_em: nowIso() };
        db.live.perguntas.push(q);
        db.live.eventos.push({ id: nextId(), room_id: r.id, tipo: 'pergunta', user_id: user.id, nome: user.nome, texto, criado_em: Date.now() });
        save(); return { ok: true, pergunta: q };
      }
      if (kind === 'nota') {
        db.live.notas.unshift({ id: nextId(), room_id: r.id, texto, criado_em: nowIso(), autor: user.nome });
        save(); return { ok: true };
      }
      db.live.eventos.push({ id: nextId(), room_id: r.id, tipo: kind === 'chat' ? 'chat' : 'reacao', user_id: user.id, nome: user.nome, texto, criado_em: Date.now() });
      save(); return { ok: true };
    }
    if ((mm = p.match(/^\/api\/ao-vivo\/(\d+)\/perguntas$/))) return db.live.perguntas.filter((q) => q.room_id === Number(mm[1])).sort((a, b) => b.votos - a.votos);
    if ((mm = p.match(/^\/api\/ao-vivo\/(\d+)\/notas$/))) return db.live.notas.filter((n) => n.room_id === Number(mm[1])).slice(0, 30);
    if ((mm = p.match(/^\/api\/ao-vivo\/perguntas\/(\d+)\/votar$/)) && m === 'POST') {
      const q = db.live.perguntas.find((x) => x.id === Number(mm[1])); if (!q) throw erro('Pergunta não encontrada.');
      q.votos += 1; save(); return { votos: q.votos };
    }
    if ((mm = p.match(/^\/api\/ao-vivo\/perguntas\/(\d+)\/estado$/)) && m === 'POST') {
      const q = db.live.perguntas.find((x) => x.id === Number(mm[1])); if (!q) throw erro('Pergunta não encontrada.');
      if (body.fixada != null) q.fixada = body.fixada ? 1 : 0;
      if (body.respondida != null) { q.respondida = body.respondida ? 1 : 0; q.resposta = body.resposta || null; }
      save(); return { ok: true };
    }
    if ((mm = p.match(/^\/api\/ao-vivo\/(\d+)\/estado$/)) && m === 'POST') {
      const r = roomRaw(Number(mm[1])); if (!r) throw erro('Sala não encontrada.');
      if (['AO_VIVO', 'AGENDADA', 'ENCERRADA'].includes(body.estado)) {
        r.estado = body.estado;
        if (body.estado === 'ENCERRADA') r.resumo = 'Aula registada neste dispositivo.';
        auditar(db, me()?.nome || 'professor', 'sala', `${r.titulo} → ${body.estado}`);
        save();
      }
      return { ok: true };
    }
    if ((mm = p.match(/^\/api\/ao-vivo\/(\d+)\/mao$/)) && m === 'POST') {
      const user = me(); if (!user) throw erro('Entre na sua conta.', 401);
      db.live.eventos.push({ id: nextId(), room_id: Number(mm[1]), tipo: 'mao', user_id: user.id, nome: user.nome, texto: body.acao === 'off' ? 'off' : 'on', criado_em: Date.now() });
      save(); return { ok: true };
    }
    if ((mm = p.match(/^\/api\/ao-vivo\/(\d+)\/mao\/(\d+)$/)) && m === 'POST') {
      const user = me();
      db.live.eventos.push({ id: nextId(), room_id: Number(mm[1]), tipo: 'mao', user_id: Number(mm[2]), nome: user?.nome || '', texto: `${body.acao}:${mm[2]}`, criado_em: Date.now() });
      save(); return { ok: true };
    }
    if ((mm = p.match(/^\/api\/ao-vivo\/(\d+)\/(material|enquete|moderar)$/)) && m === 'POST') { save(); return { ok: true }; }
    if (p === '/api/ao-vivo/enquetes/1/votar') return { ok: true, tally: {} };

    throw erro('Rota local desconhecida: ' + p, 404);
  }

  /* EventSource local: a sala e as notificações vivem em localStorage, por isso
     o "stream" é uma sondagem que reemite os eventos novos no mesmo formato SSE. */
  class LocalEventSource {
    constructor(url) {
      this.url = String(url);
      this.readyState = 1;
      this._listeners = {};
      this.closed = false;
      const room = this.url.match(/\/api\/ao-vivo\/(\d+)\/stream/);
      this.room = room ? Number(room[1]) : null;
      this.notif = /\/api\/notificacoes\/stream/.test(this.url);
      this.cursor = 0;
      if (this.notif) {
        const u = me();
        const db = load();
        this.cursor = Math.max(0, ...db.notificacoes.filter((n) => !u || n.user_id === u.id).map((n) => n.id));
      }
      setTimeout(() => { if (!this.closed && this.onopen) this.onopen({}); }, 40);
      this.timer = setInterval(() => this.tick(), 1200);
    }
    addEventListener(type, fn) { (this._listeners[type] ||= []).push(fn); }
    removeEventListener(type, fn) { const l = this._listeners[type]; if (l) this._listeners[type] = l.filter((f) => f !== fn); }
    emit(type, data) {
      (this._listeners[type] || []).forEach((fn) => { try { fn({ data }); } catch { } });
      const h = this[type === 'message' ? 'onmessage' : 'on' + type];
      if (typeof h === 'function') { try { h({ data }); } catch { } }
    }
    tick() {
      if (this.closed) return;
      const db = load();
      if (this.notif) {
        const u = me(); if (!u) return;
        const fresh = db.notificacoes.filter((n) => n.user_id === u.id && n.id > this.cursor);
        if (!fresh.length) return;
        this.cursor = Math.max(...fresh.map((n) => n.id));
        const naoLidas = db.notificacoes.filter((n) => n.user_id === u.id && !n.lida).length;
        fresh.reverse().forEach((item) => this.emit('nova', JSON.stringify({ item, naoLidas, replay: false })));
        return;
      }
      if (this.room == null) return;
      db.live.eventos.filter((e) => e.room_id === this.room && e.id > this.cursor).forEach((e) => {
        this.cursor = e.id;
        this.emit('message', JSON.stringify(e));
      });
    }
    close() { this.closed = true; this.readyState = 2; clearInterval(this.timer); }
  }
  LocalEventSource.CONNECTING = 0; LocalEventSource.OPEN = 1; LocalEventSource.CLOSED = 2;
  window.AMAEventSource = LocalEventSource;

  window.AMA_LOCAL_API = handle;
  window.AMA_STORE = { load, save, me, publicUser, reset() { DB = blank(); save(); } };
})();
