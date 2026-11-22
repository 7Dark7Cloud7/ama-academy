// CEU Academy · Real Export Pipeline (SlidesAI + Gamma-inspired)
// 1. Native PowerPoint (.pptx) via lazy-loaded PptxGenJS (Ingenium 2.0 palette + cards + notes)
// 2. Standalone Offline HTML (single file for USB / school projectors without internet, includes 60s timer)
// 3. Printable PDF (16:9 landscape @media print, 1 slide per page, zero UI chrome)
// 4. Markdown (.md) + Companion Student Worksheet (Ficha do Aluno)

import { buildWorksheet, renderWorksheetHtml } from './worksheet-engine.js?v=1';

const PPTXGEN_CDN = 'https://cdn.jsdelivr.net/npm/pptxgenjs@3.12.0/dist/pptxgen.bundle.js';
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const slug = (s) => String(s || 'aula').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 44) || 'aula';

function triggerDownload(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  setTimeout(() => { URL.revokeObjectURL(url); a.remove(); }, 1800);
}

/* ------------------------------------------------------------------ */
/* 1. Native PowerPoint (.pptx) via PptxGenJS                         */
/* ------------------------------------------------------------------ */
async function loadPptxGen() {
  if (typeof window === 'undefined') throw new Error('Browser required for PPTX download');
  if (window.PptxGenJS) return window.PptxGenJS;
  await new Promise((resolve, reject) => {
    const s = document.createElement('script');
    s.src = PPTXGEN_CDN;
    s.onload = resolve;
    s.onerror = () => reject(new Error('Não foi possível carregar PptxGenJS (verifique a ligação à internet).'));
    document.head.appendChild(s);
  });
  return window.PptxGenJS;
}

export async function exportDeckToPptx(deck) {
  const PptxGenJS = await loadPptxGen();
  const pptx = new PptxGenJS();
  pptx.layout = 'LAYOUT_WIDE'; // 13.33 x 7.5 in (16:9)
  pptx.author = 'Núcleo CEU · HORIZONTE FUTURO';
  pptx.title = String(deck?.title || 'Aula Núcleo CEU');

  const PAPER = 'F7F5EF';
  const INK = '132238';
  const MUTED = '4B5B70';
  const LIME = 'B8F36B';
  const CORAL = 'FF6B57';
  const WHITE = 'FFFFFF';
  const CEU_BLUE = '00217E';

  const slides = Array.isArray(deck?.slides) ? deck.slides : [];
  slides.forEach((sl, idx) => {
    const slide = pptx.addSlide();
    const isDark = sl.layout === 'formula';
    slide.background = { color: isDark ? INK : PAPER };

    // Giant translucent slide number
    slide.addText(String(idx + 1).padStart(2, '0'), {
      x: 10.6, y: 5.2, w: 2.4, h: 1.8,
      fontSize: 72, bold: true, color: isDark ? '1E324F' : 'EAE7DE', align: 'right',
    });

    // Rhythm / Kicker pill badge
    slide.addShape(pptx.ShapeType.roundRect, {
      x: 0.6, y: 0.45, w: 3.4, h: 0.36, rectRadius: 0.12,
      fill: { color: LIME }, line: { color: INK, width: 1 },
    });
    slide.addText(String(sl.rhythm || sl.kicker || `SLIDE ${idx + 1}`).toUpperCase().slice(0, 34), {
      x: 0.68, y: 0.48, w: 3.24, h: 0.3,
      fontSize: 9.5, bold: true, fontFace: 'Courier New', color: INK,
    });

    // Title
    slide.addText(String(sl.title || ''), {
      x: 0.6, y: 0.98, w: 11.8, h: 0.9,
      fontSize: sl.layout === 'cover' ? 38 : 28, bold: true, fontFace: 'Arial',
      color: isDark ? WHITE : INK,
    });

    // Body by layout
    if (sl.layout === 'cover') {
      if (sl.subtitle) {
        slide.addText(String(sl.subtitle), { x: 0.6, y: 2.2, w: 10.5, h: 1.2, fontSize: 18, color: MUTED });
      }
      slide.addShape(pptx.ShapeType.roundRect, {
        x: 0.6, y: 3.9, w: 6.2, h: 0.7, rectRadius: 0.15,
        fill: { color: WHITE }, line: { color: INK, width: 1.5 },
      });
      slide.addText(`${slides.length} slides · ~${deck?.stats?.estMinutes || slides.length * 3} min · Núcleo CEU`, {
        x: 0.8, y: 4.02, w: 5.8, h: 0.45, fontSize: 13, bold: true, color: CEU_BLUE,
      });
    } else if (sl.layout === 'formula' || sl.formula) {
      slide.addShape(pptx.ShapeType.roundRect, {
        x: 0.6, y: 2.0, w: 12.0, h: 1.5, rectRadius: 0.18,
        fill: { color: '1B2E4B' }, line: { color: LIME, width: 2 },
      });
      slide.addText(String(sl.formula || sl.highlight || ''), {
        x: 0.9, y: 2.35, w: 11.4, h: 0.8, fontSize: 28, bold: true, fontFace: 'Courier New', color: LIME, align: 'center',
      });
      const steps = (sl.steps || sl.bullets || []).slice(0, 4);
      steps.forEach((st, si) => {
        slide.addText(`${si + 1}. ${String(st)}`, {
          x: 0.7, y: 3.85 + si * 0.62, w: 11.6, h: 0.52, fontSize: 14.5, color: WHITE,
        });
      });
    } else if (sl.layout === 'comparison') {
      slide.addShape(pptx.ShapeType.roundRect, { x: 0.6, y: 2.05, w: 5.6, h: 2.2, rectRadius: 0.16, fill: { color: WHITE }, line: { color: INK, width: 1.5 } });
      slide.addText(`A · ${String(sl.left || '')}`, { x: 0.85, y: 2.3, w: 5.1, h: 1.7, fontSize: 18, bold: true, color: INK });
      slide.addShape(pptx.ShapeType.roundRect, { x: 7.0, y: 2.05, w: 5.6, h: 2.2, rectRadius: 0.16, fill: { color: WHITE }, line: { color: CEU_BLUE, width: 1.5 } });
      slide.addText(`B · ${String(sl.right || '')}`, { x: 7.25, y: 2.3, w: 5.1, h: 1.7, fontSize: 18, bold: true, color: CEU_BLUE });
      const notes = (sl.bullets || []).slice(0, 3);
      notes.forEach((b, bi) => {
        slide.addText(`• ${String(b)}`, { x: 0.7, y: 4.5 + bi * 0.55, w: 11.8, h: 0.5, fontSize: 13.5, color: INK });
      });
    } else if (sl.layout === 'quiz') {
      slide.addText(String(sl.question || ''), { x: 0.6, y: 1.95, w: 11.8, h: 0.9, fontSize: 18, bold: true, color: INK });
      (sl.options || []).slice(0, 4).forEach((opt, oi) => {
        slide.addShape(pptx.ShapeType.roundRect, { x: 0.6, y: 3.05 + oi * 0.85, w: 11.8, h: 0.7, rectRadius: 0.12, fill: { color: WHITE }, line: { color: INK, width: 1.2 } });
        slide.addText(`${String.fromCharCode(65 + oi)}) ${String(opt)}`, { x: 0.85, y: 3.18 + oi * 0.85, w: 11.2, h: 0.48, fontSize: 14.5, color: INK });
      });
    } else {
      const items = (sl.steps && sl.steps.length ? sl.steps : sl.bullets) || [];
      if (sl.subtitle && sl.layout !== 'agenda') {
        slide.addText(String(sl.subtitle), { x: 0.6, y: 1.92, w: 11.8, h: 0.75, fontSize: 15, color: MUTED });
      }
      const startY = sl.subtitle && sl.layout !== 'agenda' ? 2.75 : 2.05;
      items.slice(0, 4).forEach((b, bi) => {
        const col = bi % 2;
        const row = Math.floor(bi / 2);
        const x = 0.6 + col * 6.15;
        const y = startY + row * 1.65;
        slide.addShape(pptx.ShapeType.roundRect, {
          x, y, w: 5.85, h: 1.4, rectRadius: 0.16,
          fill: { color: WHITE }, line: { color: INK, width: 1.5 },
        });
        slide.addText(`${String(bi + 1).padStart(2, '0')}  ${String(b)}`, {
          x: x + 0.22, y: y + 0.18, w: 5.4, h: 1.05, fontSize: 13.5, color: INK, valign: 'top',
        });
      });
    }

    // Caveat-style handwritten margin note
    if (sl.handnote || sl.handNote) {
      slide.addText(String(sl.handnote || sl.handNote), {
        x: 8.6, y: 6.35, w: 4.1, h: 0.4, fontSize: 13, italic: true, bold: true, color: CORAL, align: 'right',
      });
    }

    // Footer + Horizonte Futuro credit
    slide.addText(`Núcleo CEU · ${String(deck?.title || '').slice(0, 48)} · APP FEITO PELA HORIZONTE FUTURO`, {
      x: 0.6, y: 6.95, w: 10.5, h: 0.35, fontSize: 9, fontFace: 'Courier New', color: isDark ? '9EB3A9' : MUTED,
    });

    if (sl.notes || sl.teacherNote) {
      slide.addNotes(String(sl.notes || sl.teacherNote));
    }
  });

  const fileName = `NucleoCEU-${slug(deck?.title)}.pptx`;
  await pptx.writeFile({ fileName });
  return { ok: true, fileName };
}

/* ------------------------------------------------------------------ */
/* 2. Standalone Offline HTML (USB-ready with 60s timer + Print CSS)  */
/* ------------------------------------------------------------------ */
export function buildStandaloneOfflineHtml(deck) {
  const slides = Array.isArray(deck?.slides) ? deck.slides : [];
  const L = deck?.language === 'en';
  const title = String(deck?.title || 'Aula Núcleo CEU');

  const renderBody = (sl) => {
    if (sl.layout === 'formula' || sl.formula) {
      return `<div class="formula-box"><code>${esc(sl.formula || sl.highlight || '')}</code></div>
        ${(sl.steps || sl.bullets || []).length ? `<ol class="cards">${(sl.steps || sl.bullets).slice(0, 4).map((b, i) => `<li><b>${String(i + 1).padStart(2, '0')}</b><span>${esc(b)}</span></li>`).join('')}</ol>` : ''}`;
    }
    if (sl.layout === 'comparison') {
      return `<div class="cmp"><div><span>A</span><b>${esc(sl.left || '')}</b></div><div><span>B</span><b>${esc(sl.right || '')}</b></div></div>
        ${(sl.bullets || []).length ? `<ul class="cards">${sl.bullets.slice(0, 4).map((b, i) => `<li><b>${String(i + 1).padStart(2, '0')}</b><span>${esc(b)}</span></li>`).join('')}</ul>` : ''}`;
    }
    if (sl.layout === 'quiz') {
      return `<p class="lead">${esc(sl.question || '')}</p>
        <div class="quiz" data-c="${Number(sl.correct) || 0}">${(sl.options || []).map((o, i) => `<button type="button" class="qopt" data-i="${i}"><b>${String.fromCharCode(65 + i)}</b><span>${esc(o)}</span></button>`).join('')}
        <div class="qrev" hidden><b>${L ? 'Answer:' : 'Resposta:'}</b> ${esc(sl.explanation || '')}</div></div>`;
    }
    const list = (sl.steps && sl.steps.length ? sl.steps : sl.bullets) || [];
    return `${sl.subtitle ? `<p class="lead">${esc(sl.subtitle)}</p>` : ''}
      ${sl.intuition ? `<div class="intuition"><b>✦ INTUIÇÃO:</b> ${esc(sl.intuition)}</div>` : ''}
      ${list.length ? `<ul class="cards">${list.slice(0, 4).map((b, i) => `<li><b>${String(i + 1).padStart(2, '0')}</b><span>${esc(b)}</span></li>`).join('')}</ul>` : ''}
      ${sl.fusedInsight ? `<div class="fused"><b>🌐 ${esc(sl.fusedInsight.source || 'Wikipédia')}:</b> ${esc(sl.fusedInsight.text)}</div>` : ''}`;
  };

  return `<!doctype html><html lang="${L ? 'en' : 'pt-AO'}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Núcleo CEU · ${esc(title)}</title>
<style>
  *{box-sizing:border-box}
  body{margin:0;font-family:system-ui,-apple-system,Segoe UI,sans-serif;background:#0e1929;color:#132238}
  main{max-width:1120px;margin:18px auto;padding:0 16px}
  .slide{position:relative;aspect-ratio:16/9;background:#f7f5ef;color:#132238;border:1.5px solid #132238;border-radius:20px;padding:34px 42px 58px;box-shadow:0 8px 0 #091322;display:flex;flex-direction:column;overflow:hidden}
  .slide[hidden]{display:none}
  .slide.dark{background:#0e1929;color:#f7f5ef;border-color:#2c4364}
  .badge{display:inline-block;padding:5px 11px;border-radius:9px;background:#b8f36b;color:#132238;font:800 11px ui-monospace,monospace;letter-spacing:.12em;text-transform:uppercase;width:fit-content}
  h2{font-size:clamp(24px,3.6vw,44px);letter-spacing:-.04em;margin:12px 0 14px;line-height:1.08}
  .lead{font-size:clamp(15px,1.6vw,21px);color:#4b5b70;margin:0 0 14px}
  .slide.dark .lead{color:#b9cde4}
  .cards{list-style:none;padding:0;margin:0;display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px}
  .cards li{display:flex;gap:10px;align-items:flex-start;padding:13px 15px;border-radius:14px;background:#fff;border:1.5px solid #132238;box-shadow:0 5px 0 #132238;font-size:15px;line-height:1.45;color:#132238}
  .cards b{flex:none;width:28px;height:28px;border-radius:8px;background:#b8f36b;color:#132238;display:grid;place-items:center;font:800 11px ui-monospace,monospace}
  .formula-box{background:#132238;color:#b8f36b;border-radius:16px;padding:22px;text-align:center;font:800 clamp(22px,2.8vw,36px) ui-monospace,monospace;margin-bottom:16px}
  .cmp{display:grid;grid-template-columns:1fr 1fr;gap:14px;margin-bottom:14px}
  .cmp div{padding:16px;border-radius:14px;background:#fff;border:1.5px solid #132238;box-shadow:0 5px 0 #132238}
  .cmp span{display:block;font:800 10px ui-monospace,monospace;color:#2d6cdf;margin-bottom:6px}
  .quiz{display:grid;gap:9px}.qopt{display:flex;gap:10px;align-items:center;padding:11px 14px;border-radius:12px;background:#fff;border:1.5px solid #132238;text-align:left;font:600 15px inherit;cursor:pointer}
  .qopt.ok{background:#e7f9d3;border-color:#2f6b25}.qopt.no{background:#ffe8e4;border-color:#ff6b57}
  .qrev{padding:10px 14px;border-radius:10px;background:#e7f9d3;font-size:14px}
  .intuition,.fused{margin:8px 0;padding:10px 13px;border-radius:11px;font-size:13.5px;background:#eaf4ff;border-left:4px solid #2d6cdf}
  .fused{background:#fff;border-left-color:#ff6b57}
  .hand{position:absolute;right:34px;bottom:48px;color:#ff6b57;font:700 18px cursive;transform:rotate(-4deg)}
  .ghost{position:absolute;right:22px;bottom:6px;font:900 110px/1 system-ui;opacity:.05;pointer-events:none}
  footer{position:absolute;left:42px;right:42px;bottom:14px;border-top:1px solid rgba(19,34,56,.16);padding-top:8px;display:flex;justify-content:space-between;font:700 11px ui-monospace,monospace;opacity:.75}
  .bar{display:flex;flex-wrap:wrap;gap:8px;justify-content:center;align-items:center;margin:14px 0}
  .bar button{background:#152740;color:#fff;border:1px solid #35547d;border-radius:10px;padding:9px 14px;font-weight:700;cursor:pointer}
  .bar span{color:#b8f36b;font:700 13px ui-monospace,monospace}
  .notes{max-width:1120px;margin:0 auto 24px;padding:16px 20px;border-radius:14px;background:#152740;color:#e6f1ff;font-size:14px;line-height:1.55}
  .notes[hidden]{display:none}
  @media print{
    @page{size:A4 landscape;margin:8mm}
    body{background:#fff}
    .bar,.notes{display:none!important}
    main{margin:0;padding:0;max-width:none}
    .slide{display:flex!important;box-shadow:none;page-break-after:always;break-after:page;border-radius:0;min-height:185mm;aspect-ratio:auto}
  }
</style></head><body>
<main>
${slides.map((sl, i) => `<section class="slide" data-i="${i}" ${i ? 'hidden' : ''}>
  <span class="badge">${esc(sl.rhythm || sl.kicker || `SLIDE ${i + 1}`)}</span>
  <h2>${esc(sl.title || '')}</h2>
  ${renderBody(sl)}
  <span class="hand">${esc(sl.handnote || sl.handNote || 'Repara nisto ✎')}</span>
  <span class="ghost">${String(i + 1).padStart(2, '0')}</span>
  <footer><span>Núcleo CEU · ${esc(title)} · APP FEITO PELA HORIZONTE FUTURO</span><span>${String(i + 1).padStart(2, '0')} / ${String(slides.length).padStart(2, '0')}</span></footer>
</section>`).join('')}
</main>
<div class="bar">
  <button id="prev">← Anterior</button>
  <span id="pos">1 / ${slides.length}</span>
  <button id="next">Próximo →</button>
  <button id="notesBtn">Notas (N)</button>
  <button id="timerBtn">Cronómetro 60s (T)</button>
  <button id="themeBtn">Tema</button>
  <button id="printBtn">Imprimir / PDF</button>
</div>
<div class="notes" id="notesBox" hidden>${slides.map((sl, i) => `<div data-ni="${i}" ${i ? 'hidden' : ''}><b>Notas · Slide ${i + 1}:</b> ${esc(sl.notes || sl.teacherNote || '')}</div>`).join('')}</div>
<script>
(function(){var i=0,S=[].slice.call(document.querySelectorAll('.slide')),N=[].slice.call(document.querySelectorAll('[data-ni]')),nb=document.getElementById('notesBox'),pos=document.getElementById('pos'),tb=document.getElementById('timerBtn'),tId=null,sec=60;
function show(n){i=Math.max(0,Math.min(S.length-1,n));S.forEach(function(s,k){s.hidden=k!==i});N.forEach(function(x,k){x.hidden=k!==i});pos.textContent=(i+1)+' / '+S.length}
function toggleTimer(){if(tId){clearInterval(tId);tId=null;sec=60;tb.textContent='Cronómetro 60s (T)';return}sec=60;tb.textContent='⏱ 60s';tId=setInterval(function(){sec--;tb.textContent=sec>0?'⏱ '+sec+'s':'⏱ Tempo!';if(sec<=0){clearInterval(tId);tId=null}},1000)}
document.getElementById('prev').onclick=function(){show(i-1)};document.getElementById('next').onclick=function(){show(i+1)};
document.getElementById('notesBtn').onclick=function(){nb.hidden=!nb.hidden};tb.onclick=toggleTimer;
document.getElementById('themeBtn').onclick=function(){S.forEach(function(s){s.classList.toggle('dark')})};
document.getElementById('printBtn').onclick=function(){window.print()};
document.addEventListener('keydown',function(e){if(['ArrowRight',' '].indexOf(e.key)>=0){e.preventDefault();show(i+1)}if(e.key==='ArrowLeft'){e.preventDefault();show(i-1)}if(e.key.toLowerCase()==='n')nb.hidden=!nb.hidden;if(e.key.toLowerCase()==='t')toggleTimer()});
document.addEventListener('click',function(e){var b=e.target.closest('.qopt');if(!b)return;var q=b.closest('.quiz'),c=Number(q.dataset.c)||0;q.querySelectorAll('.qopt').forEach(function(x,k){x.classList.toggle('ok',k===c);if(x===b&&k!==c)x.classList.add('no')});q.querySelector('.qrev').hidden=false});
})();
<\/script></body></html>`;
}

export function exportDeckToOfflineHtml(deck) {
  const html = buildStandaloneOfflineHtml(deck);
  const fileName = `NucleoCEU-${slug(deck?.title)}-offline.html`;
  triggerDownload(new Blob([html], { type: 'text/html;charset=utf-8' }), fileName);
  return { ok: true, fileName };
}

export function exportDeckToPrintPdf(deck) {
  const html = buildStandaloneOfflineHtml(deck);
  const win = window.open('', '_blank');
  if (win) {
    win.document.open();
    win.document.write(html);
    win.document.close();
    setTimeout(() => { try { win.print(); } catch { } }, 350);
    return { ok: true, mode: 'print-window' };
  }
  return exportDeckToOfflineHtml(deck);
}

export function exportDeckToMarkdown(deck) {
  const slides = Array.isArray(deck?.slides) ? deck.slides : [];
  const md = [
    `# ${deck?.title || 'Aula Núcleo CEU'}`,
    `> Núcleo CEU · APP FEITO PELA HORIZONTE FUTURO`,
    '',
    ...slides.flatMap((sl, i) => [
      `## ${String(i + 1).padStart(2, '0')}. [${sl.rhythm || sl.layout}] ${sl.title}`,
      sl.subtitle ? `${sl.subtitle}` : '',
      sl.formula ? `\`${sl.formula}\`` : '',
      ...(sl.bullets || []).map((b) => `- ${b}`),
      ...(sl.steps || []).map((st, si) => `${si + 1}. ${st}`),
      sl.handnote || sl.handNote ? `*Nota de margem:* ${sl.handnote || sl.handNote}` : '',
      sl.notes || sl.teacherNote ? `> **Docente:** ${sl.notes || sl.teacherNote}` : '',
      '',
    ]).filter((line) => line !== undefined),
  ].join('\n');
  const fileName = `NucleoCEU-${slug(deck?.title)}.md`;
  triggerDownload(new Blob([md], { type: 'text/markdown;charset=utf-8' }), fileName);
  return { ok: true, fileName, markdown: md };
}

export function exportDeckWorksheet(deck, { includeAnswers = true } = {}) {
  const ws = buildWorksheet(deck);
  const html = renderWorksheetHtml(ws, { includeAnswers });
  const fileName = `NucleoCEU-Ficha-${slug(deck?.title)}.html`;
  triggerDownload(new Blob([html], { type: 'text/html;charset=utf-8' }), fileName);
  return { ok: true, fileName, worksheet: ws };
}
