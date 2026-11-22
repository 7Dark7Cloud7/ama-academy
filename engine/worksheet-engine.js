// CEU Academy · Companion Student Worksheet Generator (Chalkie AI-inspired)
// Generates a clean, printable 1-page "Ficha do Aluno" from the same source PDF/deck:
// key vocabulary, 3–5 practice questions (MC + short answer + application), and an
// optional Teacher Answer Key on page 2. Branded Núcleo CEU + HORIZONTE FUTURO.

const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const clean = (s, max = 220) => String(s ?? '').replace(/\s+/g, ' ').trim().slice(0, max);

export function buildWorksheet(deck, opts = {}) {
  const L = (opts.language || deck?.language || 'pt') === 'en';
  const title = clean(deck?.title || (L ? 'Lesson Worksheet' : 'Ficha de Estudo'), 80);
  const slides = Array.isArray(deck?.slides) ? deck.slides : [];
  const defs = Array.isArray(deck?.reading?.definitions) ? deck.reading.definitions : [];

  // 1. Key Vocabulary (4–6 crisp terms)
  const vocab = [];
  const seen = new Set();
  for (const d of defs) {
    const term = clean(d.term, 44);
    if (!term || seen.has(term.toLowerCase())) continue;
    seen.add(term.toLowerCase());
    vocab.push({ term, definition: clean(d.sentence || '', 155) });
    if (vocab.length >= 6) break;
  }
  if (vocab.length < 4) {
    for (const s of slides) {
      if (['cover', 'agenda', 'objectives', 'quiz', 'closing'].includes(s.layout)) continue;
      const term = clean(s.term || s.title, 44);
      if (!term || seen.has(term.toLowerCase())) continue;
      seen.add(term.toLowerCase());
      vocab.push({ term, definition: clean(s.subtitle || (s.bullets && s.bullets[0]) || s.formula || term, 155) });
      if (vocab.length >= 5) break;
    }
  }

  // 2. Practice Questions (4 questions: 1 MC, 2 Short Answer, 1 Application/Exit)
  const questions = [];
  const quizSlide = slides.find((s) => s.layout === 'quiz' && Array.isArray(s.options) && s.options.length >= 2);
  if (quizSlide) {
    questions.push({
      type: 'mc',
      prompt: clean(quizSlide.question, 170),
      options: quizSlide.options.slice(0, 4).map((o) => clean(o, 110)),
      answer: `${String.fromCharCode(65 + (Number(quizSlide.correct) || 0))}) ${clean(quizSlide.explanation || quizSlide.options[Number(quizSlide.correct) || 0], 140)}`,
    });
  }

  const formulaSlide = slides.find((s) => s.layout === 'formula' || s.formula);
  if (formulaSlide) {
    questions.push({
      type: 'short',
      prompt: L
        ? `Explain what each symbol represents in "${clean(formulaSlide.formula, 70)}" and when to apply it.`
        : `Explique o significado de cada símbolo em «${clean(formulaSlide.formula, 70)}» e indique quando deve aplicar esta relação.`,
      answer: clean((formulaSlide.steps && formulaSlide.steps.join(' ')) || formulaSlide.notes || formulaSlide.title, 180),
    });
  }

  for (const v of vocab.slice(0, 2)) {
    questions.push({
      type: 'short',
      prompt: L
        ? `In your own words, define "${v.term}" and give one real-world example.`
        : `Por palavras próprias, defina «${v.term}» e apresente um exemplo concreto do dia a dia.`,
      answer: v.definition,
    });
  }

  questions.push({
    type: 'application',
    prompt: L
      ? `Exit Ticket: What is the single most important takeaway from "${title}", and how would you teach it to a classmate in 2 sentences?`
      : `Bilhete de Saída: Qual é a ideia mais decisiva de «${title}» e como a explicaria a um colega em 2 frases?`,
    answer: clean(deck?.reading?.centralIdea || slides[slides.length - 1]?.bullets?.[0] || title, 180),
  });

  return {
    title,
    language: L ? 'en' : 'pt',
    brand: 'Núcleo CEU',
    credit: 'APP FEITO PELA HORIZONTE FUTURO',
    level: deck?.level || 'universitario',
    subject: deck?.subject || 'geral',
    sourceName: clean(deck?.sourceName || title, 80),
    vocab: vocab.slice(0, 6),
    questions: questions.slice(0, 5),
    generatedAt: new Date().toISOString(),
  };
}

export function renderWorksheetHtml(ws, { includeAnswers = true } = {}) {
  const L = ws.language === 'en';
  return `<!doctype html><html lang="${L ? 'en' : 'pt-AO'}"><head><meta charset="utf-8">
<title>${esc(ws.brand)} · ${L ? 'Student Worksheet' : 'Ficha do Aluno'} — ${esc(ws.title)}</title>
<style>
  @page{size:A4 portrait;margin:14mm}
  *{box-sizing:border-box}
  body{font-family:'Instrument Sans',system-ui,sans-serif;color:#132238;background:#f7f5ef;margin:0;padding:24px}
  .sheet{max-width:820px;margin:0 auto 24px;background:#fff;border:1.5px solid #132238;border-radius:18px;padding:28px 32px;box-shadow:0 5px 0 #132238}
  .top{display:flex;justify-content:space-between;align-items:flex-start;gap:16px;border-bottom:1.5px solid #132238;padding-bottom:14px;margin-bottom:18px}
  .badge{display:inline-block;padding:4px 10px;border-radius:8px;background:#b8f36b;color:#132238;font:800 10px monospace;letter-spacing:.12em;text-transform:uppercase}
  h1{font-size:24px;margin:8px 0 4px;letter-spacing:-.03em}
  .meta{font-size:12px;color:#4b5b70}
  .student-box{display:grid;grid-template-columns:1.4fr .8fr;gap:12px;margin-bottom:18px;font-size:12.5px}
  .student-box div{border-bottom:1px dashed #132238;padding:6px 2px}
  h2{font-size:14px;text-transform:uppercase;letter-spacing:.08em;color:#00217e;margin:18px 0 10px;display:flex;align-items:center;gap:8px}
  .vocab{display:grid;grid-template-columns:repeat(2,1fr);gap:10px}
  .v-card{border:1px solid #d6e4f5;border-left:4px solid #00a4dc;border-radius:10px;padding:10px 12px;background:#f8fbff}
  .v-card b{display:block;font-size:13px;color:#132238;margin-bottom:3px}
  .v-card span{font-size:12px;line-height:1.45;color:#41536e}
  .q-list{list-style:none;padding:0;margin:0;display:grid;gap:14px}
  .q-item{border:1px solid #dfe1da;border-radius:12px;padding:12px 14px;background:#fffdf8}
  .q-item p{margin:0 0 8px;font-size:13.5px;font-weight:600}
  .opts{list-style:upper-alpha;padding-left:20px;margin:6px 0 0;font-size:12.5px;line-height:1.6}
  .lines{height:44px;border-bottom:1px dotted #94a3b8;margin-top:6px}
  .key-sheet{page-break-before:always;break-before:page}
  .foot{margin-top:20px;padding-top:10px;border-top:1px solid #dfe1da;display:flex;justify-content:space-between;font:700 10px monospace;color:#4b5b70}
  .no-print{text-align:center;margin-bottom:16px}
  .no-print button{background:#00217e;color:#fff;border:0;border-radius:10px;padding:10px 18px;font-weight:700;cursor:pointer}
  @media print{body{background:#fff;padding:0}.sheet{box-shadow:none;margin:0;border-radius:0;border:none;padding:0}.no-print{display:none}}
</style></head><body>
<div class="no-print"><button onclick="window.print()">${L ? 'Print / Save as PDF' : 'Imprimir / Guardar como PDF'}</button></div>
<main class="sheet">
  <header class="top">
    <div>
      <span class="badge">${esc(ws.brand)} · ${L ? 'STUDENT WORKSHEET' : 'FICHA DO ALUNO'}</span>
      <h1>${esc(ws.title)}</h1>
      <div class="meta">${esc(ws.sourceName)} · ${esc(ws.level)}</div>
    </div>
  </header>
  <div class="student-box">
    <div><b>${L ? 'Student Name:' : 'Nome do Estudante:'}</b></div>
    <div><b>${L ? 'Date / Class:' : 'Data / Turma:'}</b></div>
  </div>
  <h2>01 · ${L ? 'Key Vocabulary' : 'Vocabulário-Chave'}</h2>
  <div class="vocab">
    ${ws.vocab.map((v) => `<div class="v-card"><b>${esc(v.term)}</b><span>${esc(v.definition)}</span></div>`).join('')}
  </div>
  <h2>02 · ${L ? 'Practice & Understanding' : 'Exercícios de Verificação'}</h2>
  <ol class="q-list">
    ${ws.questions.map((q, i) => `<li class="q-item">
      <p>${i + 1}. ${esc(q.prompt)}</p>
      ${q.type === 'mc' && q.options ? `<ol class="opts">${q.options.map((o) => `<li>${esc(o)}</li>`).join('')}</ol>` : '<div class="lines"></div><div class="lines"></div>'}
    </li>`).join('')}
  </ol>
  <footer class="foot"><span>${esc(ws.brand)}</span><span>${esc(ws.credit)}</span></footer>
</main>
${includeAnswers ? `<section class="sheet key-sheet">
  <span class="badge">${esc(ws.brand)} · ${L ? 'TEACHER ANSWER KEY' : 'CHAVE DE CORREÇÃO DO DOCENTE'}</span>
  <h1>${esc(ws.title)}</h1>
  <ol class="q-list" style="margin-top:14px">
    ${ws.questions.map((q, i) => `<li class="q-item"><p>${i + 1}. ${esc(q.prompt)}</p><div style="font-size:13px;color:#0f5132"><b>${L ? 'Expected Answer:' : 'Resposta esperada:'}</b> ${esc(q.answer)}</div></li>`).join('')}
  </ol>
  <footer class="foot"><span>${esc(ws.brand)} · ${L ? 'Teacher Copy' : 'Cópia do Docente'}</span><span>${esc(ws.credit)}</span></footer>
</section>` : ''}
</body></html>`;
}
