// CEU Academy · Layout-Aware PDF Engine (v3)
// Client-side PDF.js parser with coordinate-based line grouping (±4px Y tolerance),
// automatic heading detection (height >= 1.25 * median), repeated header/footer
// stripping across >= 3 pages, formula/list preservation, page-range picker,
// proportional chunking for long PDFs (>3000 words), and scanned-PDF OCR fallback.

const PDFJS_CDN = 'https://cdn.jsdelivr.net/npm/pdfjs-dist@4.7.76/build/pdf.min.mjs';
const PDFJS_WORKER = 'https://cdn.jsdelivr.net/npm/pdfjs-dist@4.7.76/build/pdf.worker.min.mjs';
const TESSERACT_CDN = 'https://cdn.jsdelivr.net/npm/tesseract.js@5.1.1/dist/tesseract.min.js';

const clean = (s, max = 4000) => String(s ?? '').replace(/\s+/g, ' ').trim().slice(0, max);
const FORMULA_RE = /(?:[A-Za-zÀ-ÿ]\s*=\s*[^.,;]{2,48}|[∑∫√ΔπλΩ±≤≥×÷]|->|→|\^2|\^\d)/;
const NUMBERED_HEADING_RE = /^(?:\d+(?:\.\d+){0,3}[.)]?\s+[A-ZÁÀÂÃÉÈÊÍÌÓÒÔÕÚÙÇ]|(?:CAP[ÍI]TULO|UNIDADE|SEC[ÇC][ÃA]O|M[ÓO]DULO|TEMA|AULA|CHAPTER|SECTION|UNIT)\s+\d+)/i;
const LIST_ITEM_RE = /^(?:[-•*▪◦‣]|\d+[.)]|[a-z][.)])\s+\S/i;

/* ------------------------------------------------------------------ */
/* Pure Layout Analysis (testable in Node & Browser without PDF.js)   */
/* ------------------------------------------------------------------ */

function median(nums) {
  const arr = nums.filter((n) => Number.isFinite(n) && n > 0).sort((a, b) => a - b);
  if (!arr.length) return 12;
  const mid = Math.floor(arr.length / 2);
  return arr.length % 2 ? arr[mid] : (arr[mid - 1] + arr[mid]) / 2;
}

/**
 * Groups PDF.js textContent items [{ str, transform: [a,b,c,d,x,y], height, fontName }]
 * into sorted visual lines using ±4px Y-coordinate tolerance.
 */
export function groupItemsIntoLines(items = [], yTolerance = 4) {
  const raw = (Array.isArray(items) ? items : [])
    .map((it) => {
      const str = String(it?.str ?? '').replace(/\u00a0/g, ' ');
      const tr = Array.isArray(it?.transform) ? it.transform : [12, 0, 0, 12, 0, 0];
      const x = Number.isFinite(it?.x) ? it.x : Number(tr[4]) || 0;
      const y = Number.isFinite(it?.y) ? it.y : Number(tr[5]) || 0;
      const h = Number.isFinite(it?.height) && it.height > 0
        ? it.height
        : Math.max(Math.abs(Number(tr[0]) || 0), Math.abs(Number(tr[3]) || 0), 11);
      const bold = /bold|black|heavy|semibold|medi/i.test(String(it?.fontName || ''));
      return { str, x, y, h, bold };
    })
    .filter((it) => it.str.trim().length > 0);

  // Sort top-to-bottom (higher PDF Y is higher on page), then left-to-right
  raw.sort((a, b) => (Math.abs(b.y - a.y) <= yTolerance ? a.x - b.x : b.y - a.y));

  const lines = [];
  for (const item of raw) {
    const bucket = lines.find((l) => Math.abs(l.y - item.y) <= yTolerance);
    if (bucket) {
      bucket.items.push(item);
      bucket.maxH = Math.max(bucket.maxH, item.h);
      bucket.bold = bucket.bold || item.bold;
    } else {
      lines.push({ y: item.y, maxH: item.h, bold: item.bold, items: [item] });
    }
  }

  return lines.map((line) => {
    line.items.sort((a, b) => a.x - b.x);
    let text = '';
    let prevEnd = null;
    for (const part of line.items) {
      if (prevEnd !== null && part.x - prevEnd > 2 && !text.endsWith(' ') && !part.str.startsWith(' ')) {
        text += ' ';
      }
      text += part.str;
      prevEnd = part.x + part.str.length * (part.h * 0.45);
    }
    return {
      y: Math.round(line.y),
      height: Number(line.maxH.toFixed(2)),
      bold: line.bold,
      text: text.replace(/\s+/g, ' ').trim(),
    };
  }).filter((l) => l.text.length > 0);
}

/**
 * Strips repeated headers/footers appearing on >= 3 pages (or >= 50% of pages when >= 3 pages),
 * plus isolated page numbers.
 */
export function stripRepeatedHeadersFooters(structuredPages = []) {
  if (!Array.isArray(structuredPages) || structuredPages.length < 3) {
    return { pages: structuredPages, strippedCount: 0 };
  }
  const edgeCounts = new Map();
  const normEdge = (t) => String(t || '').toLowerCase().replace(/\d+/g, '#').replace(/\s+/g, ' ').trim();

  for (const p of structuredPages) {
    const lines = p.lines || [];
    const edges = [...lines.slice(0, 2), ...lines.slice(-2)];
    const seenOnPage = new Set();
    for (const line of edges) {
      const k = normEdge(line.text);
      if (!k || k.length > 90 || seenOnPage.has(k)) continue;
      seenOnPage.add(k);
      edgeCounts.set(k, (edgeCounts.get(k) || 0) + 1);
    }
  }

  const threshold = Math.max(3, Math.ceil(structuredPages.length * 0.45));
  const repeated = new Set([...edgeCounts.entries()].filter(([, c]) => c >= threshold).map(([k]) => k));
  let strippedCount = 0;

  const cleaned = structuredPages.map((p) => {
    const kept = (p.lines || []).filter((line, idx, arr) => {
      const t = line.text.trim();
      const isEdge = idx < 2 || idx >= arr.length - 2;
      if (isEdge && /^(?:p[áa]g\.?|page)?\s*\d+(?:\s*(?:\/|de|of)\s*\d+)?$/i.test(t)) {
        strippedCount += 1;
        return false;
      }
      if (isEdge && repeated.has(normEdge(t))) {
        strippedCount += 1;
        return false;
      }
      return true;
    });
    return { ...p, lines: kept };
  });

  return { pages: cleaned, strippedCount };
}

/**
 * Converts structured pages [{ page, lines: [{ text, height, bold, y }] }]
 * into layout-aware Markdown + headings + formulas + lists + proportional chunks.
 */
export function analyzePagesLayout(rawPages = [], meta = {}) {
  const inputPages = (Array.isArray(rawPages) ? rawPages : []).map((p, idx) => {
    if (Array.isArray(p.lines)) return { page: p.page || idx + 1, lines: p.lines };
    if (Array.isArray(p.items)) return { page: p.page || idx + 1, lines: groupItemsIntoLines(p.items) };
    const textLines = String(p.text || '')
      .replace(/\r\n?/g, '\n')
      .split('\n')
      .map((t, li) => ({ text: t.trim(), height: li === 0 && t.trim().length <= 68 && !/[.!?]$/.test(t.trim()) ? 16 : 12, bold: li === 0, y: 800 - li * 16 }))
      .filter((l) => l.text.length > 0);
    return { page: p.page || idx + 1, lines: textLines };
  });

  const { pages: cleanPages, strippedCount } = stripRepeatedHeadersFooters(inputPages);

  const headings = [];
  const formulas = [];
  const listBlocks = [];
  const pageTexts = [];
  let totalChars = 0;

  for (const p of cleanPages) {
    const heights = (p.lines || []).map((l) => l.height || 12);
    const bodyMedian = median(heights);
    const mdLines = [];

    for (const line of (p.lines || [])) {
      const t = line.text;
      totalChars += t.length;
      const isHeading = (
        (line.height >= bodyMedian * 1.25 && t.length >= 3 && t.length <= 96 && !/[.!?]$/.test(t))
        || (NUMBERED_HEADING_RE.test(t) && t.length <= 88 && !/[.!?]$/.test(t))
        || (line.bold && t.length >= 4 && t.length <= 68 && !/[.!?]$/.test(t) && !LIST_ITEM_RE.test(t))
      );

      if (FORMULA_RE.test(t) && t.length <= 180) {
        formulas.push({ page: p.page, text: t });
        mdLines.push(t);
      } else if (isHeading) {
        headings.push({ page: p.page, text: t.replace(/^#+\s*/, '') });
        mdLines.push(`## ${t.replace(/^#+\s*/, '')}`);
      } else if (LIST_ITEM_RE.test(t)) {
        listBlocks.push({ page: p.page, text: t });
        mdLines.push(t);
      } else {
        mdLines.push(t);
      }
    }

    pageTexts.push({
      page: p.page,
      text: mdLines.join('\n'),
    });
  }

  const pageCount = Math.max(1, cleanPages.length);
  const avgCharsPerPage = Math.round(totalChars / pageCount);
  const isScanned = avgCharsPerPage < 30;

  const fullMarkdown = pageTexts.map((p) => p.text).filter(Boolean).join('\n\n');
  const words = (fullMarkdown.match(/[\p{L}\p{N}]+/gu) || []).length;
  const estimatedReadingMin = Math.max(1, Math.round(words / 180));

  // Proportional chunking for long documents (> 3,000 words) so the end is never dropped
  const chunks = buildProportionalChunks(pageTexts, words > 3000 ? 12 : 16);

  return {
    ok: !isScanned && fullMarkdown.trim().length >= 30,
    isScanned,
    warning: isScanned
      ? 'Este PDF parece digitalizado (imagem). Execute o OCR local no navegador ou cole o texto manualmente.'
      : '',
    filename: meta.filename || '',
    totalPages: meta.totalPages || cleanPages.length,
    extractedPages: cleanPages.length,
    pageRange: meta.pageRange || { start: cleanPages[0]?.page || 1, end: cleanPages[cleanPages.length - 1]?.page || cleanPages.length },
    avgCharsPerPage,
    wordCount: words,
    estimatedReadingMin,
    strippedHeadersFooters: strippedCount,
    headingsCount: headings.length,
    headings: headings.slice(0, 40),
    formulas: formulas.slice(0, 24),
    listItemsCount: listBlocks.length,
    pageTexts,
    chunks,
    text: fullMarkdown,
    title: clean(meta.title || headings[0]?.text || String(meta.filename || '').replace(/\.[^.]+$/, '').replace(/[_-]+/g, ' '), 90),
  };
}

/**
 * Splits extracted pages by Markdown `## ` headings and samples proportionally
 * across the entire document when a PDF exceeds 3,000 words.
 */
export function buildProportionalChunks(pageTexts = [], maxChunks = 12) {
  const sections = [];
  let cur = null;
  for (const pt of (Array.isArray(pageTexts) ? pageTexts : [])) {
    const lines = String(pt.text || '').split('\n');
    for (const rawLine of lines) {
      const line = rawLine.trim();
      if (!line) continue;
      if (line.startsWith('## ')) {
        if (cur && cur.body.length) sections.push(cur);
        cur = { heading: line.slice(3).trim(), page: pt.page || 1, body: [] };
      } else {
        if (!cur) cur = { heading: `Secção ${sections.length + 1}`, page: pt.page || 1, body: [] };
        cur.body.push(line);
      }
    }
  }
  if (cur && cur.body.length) sections.push(cur);

  if (sections.length <= maxChunks) {
    return sections.map((s) => ({
      heading: s.heading,
      page: s.page,
      text: s.body.join('\n').slice(0, 1800),
    }));
  }

  // Proportional sampling from start -> middle -> end so final chapters are preserved
  const picked = [];
  const step = (sections.length - 1) / Math.max(1, maxChunks - 1);
  for (let i = 0; i < maxChunks; i += 1) {
    const idx = Math.round(i * step);
    const s = sections[idx];
    if (s && !picked.includes(s)) {
      picked.push(s);
    }
  }
  return picked.map((s) => ({
    heading: s.heading,
    page: s.page,
    text: s.body.join('\n').slice(0, 1500),
  }));
}

/* ------------------------------------------------------------------ */
/* Browser PDF.js Loader & Metadata Peek                              */
/* ------------------------------------------------------------------ */

let pdfjsPromise = null;
async function loadPdfJs() {
  if (!pdfjsPromise) {
    pdfjsPromise = import(PDFJS_CDN).then((lib) => {
      if (lib && lib.GlobalWorkerOptions) lib.GlobalWorkerOptions.workerSrc = PDFJS_WORKER;
      return lib;
    });
  }
  return pdfjsPromise;
}

export async function inspectPdfMetadata(file) {
  const pdfjs = await loadPdfJs();
  const data = new Uint8Array(await file.arrayBuffer());
  const doc = await pdfjs.getDocument({ data }).promise;
  let infoTitle = '';
  try {
    const meta = await doc.getMetadata();
    infoTitle = clean(meta?.info?.Title || '', 90);
  } catch { }
  const totalPages = doc.numPages || 1;
  return {
    filename: file.name,
    size: file.size,
    totalPages,
    defaultEndPage: Math.min(15, totalPages),
    title: infoTitle || clean(file.name.replace(/\.[^.]+$/, '').replace(/[_-]+/g, ' '), 90),
  };
}

export async function extractPdfLayout(file, opts = {}) {
  const { startPage = 1, endPage = null, onProgress = null } = opts;
  const pdfjs = await loadPdfJs();
  const data = new Uint8Array(await file.arrayBuffer());
  const doc = await pdfjs.getDocument({ data }).promise;
  const totalPages = doc.numPages || 1;
  const pStart = Math.max(1, Math.min(totalPages, Number(startPage) || 1));
  const pEnd = Math.max(pStart, Math.min(totalPages, Number(endPage) || Math.min(15, totalPages)));

  let infoTitle = '';
  try {
    const meta = await doc.getMetadata();
    infoTitle = clean(meta?.info?.Title || '', 90);
  } catch { }

  const rawPages = [];
  const totalToRead = pEnd - pStart + 1;
  for (let pNum = pStart; pNum <= pEnd; pNum += 1) {
    const page = await doc.getPage(pNum);
    const tc = await page.getTextContent();
    const lines = groupItemsIntoLines(tc.items || [], 4);
    rawPages.push({ page: pNum, lines });
    if (typeof onProgress === 'function') {
      onProgress({
        page: pNum,
        total: totalToRead,
        progress: (pNum - pStart + 1) / Math.max(1, totalToRead),
      });
    }
  }

  return analyzePagesLayout(rawPages, {
    filename: file.name,
    totalPages,
    title: infoTitle,
    pageRange: { start: pStart, end: pEnd },
  });
}

/* Optional lazy-loaded browser OCR fallback for scanned PDFs (PT + EN) */
export async function runOcrOnPdf(file, opts = {}) {
  const { startPage = 1, endPage = 5, lang = 'por+eng', onProgress = null } = opts;
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    throw new Error('OCR só está disponível no navegador.');
  }
  const pdfjs = await loadPdfJs();
  if (!window.Tesseract) {
    await new Promise((resolve, reject) => {
      const s = document.createElement('script');
      s.src = TESSERACT_CDN;
      s.onload = resolve;
      s.onerror = () => reject(new Error('Não foi possível carregar Tesseract.js para OCR.'));
      document.head.appendChild(s);
    });
  }
  const data = new Uint8Array(await file.arrayBuffer());
  const doc = await pdfjs.getDocument({ data }).promise;
  const totalPages = doc.numPages || 1;
  const pStart = Math.max(1, Math.min(totalPages, Number(startPage) || 1));
  const pEnd = Math.max(pStart, Math.min(totalPages, Number(endPage) || Math.min(pStart + 4, totalPages)));
  const rawPages = [];

  for (let pNum = pStart; pNum <= pEnd; pNum += 1) {
    const page = await doc.getPage(pNum);
    const vp = page.getViewport({ scale: 1.7 });
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(vp.width);
    canvas.height = Math.round(vp.height);
    await page.render({ canvasContext: canvas.getContext('2d'), viewport: vp }).promise;
    if (onProgress) onProgress({ page: pNum, total: pEnd - pStart + 1, progress: (pNum - pStart) / Math.max(1, pEnd - pStart + 1), status: `OCR página ${pNum}/${pEnd}…` });
    const ocr = await window.Tesseract.recognize(canvas, lang);
    const text = String(ocr?.data?.text || '').trim();
    rawPages.push({ page: pNum, text });
  }

  return analyzePagesLayout(rawPages, {
    filename: file.name,
    totalPages,
    pageRange: { start: pStart, end: pEnd },
  });
}
