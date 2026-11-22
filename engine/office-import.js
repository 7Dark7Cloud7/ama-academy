// Kuzaya AI · Slide Studio — leitura local de .docx / .pptx.
// O ficheiro nunca sai do navegador. Usa apenas DecompressionStream (nativo).
// Se o navegador não o tiver, devolvemos um erro honesto a pedir PDF ou TXT.

const MAX_BYTES = 20 * 1024 * 1024;
const MAX_CHARS = 20000;

export function canReadOffice() {
  return typeof window !== 'undefined' && typeof window.DecompressionStream === 'function';
}

function u16(view, at) { return view.getUint16(at, true); }
function u32(view, at) { return view.getUint32(at, true); }

async function unzipEntries(buffer) {
  const view = new DataView(buffer);
  const bytes = new Uint8Array(buffer);
  let eocd = -1;
  for (let i = bytes.length - 22; i >= Math.max(0, bytes.length - 66000); i -= 1) {
    if (u32(view, i) === 0x06054b50) { eocd = i; break; }
  }
  if (eocd < 0) throw new Error('zip');
  const count = u16(view, eocd + 10);
  let pos = u32(view, eocd + 16);
  const out = new Map();
  for (let n = 0; n < count && pos + 46 <= bytes.length; n += 1) {
    if (u32(view, pos) !== 0x02014b50) break;
    const method = u16(view, pos + 10);
    const compSize = u32(view, pos + 20);
    const nameLen = u16(view, pos + 28);
    const extraLen = u16(view, pos + 30);
    const commentLen = u16(view, pos + 32);
    const local = u32(view, pos + 42);
    const name = new TextDecoder().decode(bytes.subarray(pos + 46, pos + 46 + nameLen));
    if (local + 30 <= bytes.length && u32(view, local) === 0x04034b50) {
      const lName = u16(view, local + 26);
      const lExtra = u16(view, local + 28);
      const start = local + 30 + lName + lExtra;
      const raw = bytes.subarray(start, start + compSize);
      let textBytes = raw;
      if (method === 8) {
        const ds = new DecompressionStream('deflate-raw');
        textBytes = new Uint8Array(await new Response(new Blob([raw]).stream().pipeThrough(ds)).arrayBuffer());
      } else if (method !== 0) {
        throw new Error('compression');
      }
      out.set(name, new TextDecoder('utf-8', { fatal: false }).decode(textBytes));
    }
    pos += 46 + nameLen + extraLen + commentLen;
  }
  return out;
}

function xmlToText(xml) {
  return String(xml || '')
    .replace(/<w:tab\b[^>]*>/g, '\t')
    .replace(/<\/(w:p|a:p|w:tr|text:p)>/g, '\n')
    .replace(/<w:br\b[^>]*>/g, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"').replace(/&apos;/g, "'")
    .replace(/[ \t]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

const slideNumber = (name) => {
  const m = name.match(/slide(\d+)\.xml$/i);
  return m ? Number(m[1]) : 999;
};

export async function extractOfficeText(file) {
  if (!canReadOffice()) {
    return { ok: false, code: 'office-unsupported', text: '', pages: [], filename: file.name };
  }
  if (file.size > MAX_BYTES) {
    return { ok: false, code: 'size', text: '', pages: [], filename: file.name };
  }
  const isDocx = /\.docx$/i.test(file.name);
  const isPptx = /\.pptx$/i.test(file.name);
  if (!isDocx && !isPptx) return { ok: false, code: 'type', text: '', pages: [], filename: file.name };
  try {
    const entries = await unzipEntries(await file.arrayBuffer());
    const names = [...entries.keys()].filter((n) => isDocx
      ? /^word\/(document|footnotes|endnotes)\.xml$/i.test(n)
      : /^ppt\/slides\/slide\d+\.xml$/i.test(n));
    if (isPptx) names.sort((a, b) => slideNumber(a) - slideNumber(b));
    const pages = names.map((name, i) => ({ page: i + 1, text: xmlToText(entries.get(name)).slice(0, MAX_CHARS) })).filter((p) => p.text.length > 8);
    if (!pages.length) return { ok: false, code: 'no-text', text: '', pages: [], filename: file.name };
    const text = pages.map((p) => p.text).join('\n\n').slice(0, MAX_CHARS);
    return { ok: true, text, pages, filename: file.name, method: isDocx ? 'docx' : 'pptx' };
  } catch {
    return { ok: false, code: 'unknown', text: '', pages: [], filename: file.name };
  }
}
