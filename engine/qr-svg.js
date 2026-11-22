// CEU Academy — Gerador QR Code ISO/IEC 18004 (Model 2, Nível L, 100% offline em SVG)
// Zero dependências externas: funciona offline no projetor de sala e no Cartão CEU.

const VERSIONS = [
  null,
  { size: 21, total: 26, data: 19, blocks: [[1, 19, 7]], align: [] },
  { size: 25, total: 44, data: 34, blocks: [[1, 34, 10]], align: [6, 18] },
  { size: 29, total: 70, data: 55, blocks: [[1, 55, 15]], align: [6, 22] },
  { size: 33, total: 100, data: 80, blocks: [[1, 80, 20]], align: [6, 26] },
  { size: 37, total: 134, data: 108, blocks: [[1, 108, 26]], align: [6, 30] },
  { size: 41, total: 172, data: 136, blocks: [[2, 68, 18]], align: [6, 34] },
  { size: 45, total: 196, data: 156, blocks: [[2, 78, 20]], align: [6, 22, 38], vbits: 0x07c94 },
  { size: 49, total: 242, data: 194, blocks: [[2, 97, 24]], align: [6, 24, 42], vbits: 0x085bc },
  { size: 53, total: 292, data: 232, blocks: [[2, 116, 30]], align: [6, 26, 46], vbits: 0x09a99 },
  { size: 57, total: 346, data: 274, blocks: [[2, 68, 18], [2, 69, 18]], align: [6, 28, 50], vbits: 0x0a4d3 },
];

// GF(256) com polinómio primitivo 0x11d para Reed-Solomon
const GF_EXP = new Uint8Array(512);
const GF_LOG = new Uint8Array(256);
(() => {
  let x = 1;
  for (let i = 0; i < 255; i += 1) {
    GF_EXP[i] = x;
    GF_LOG[x] = i;
    x <<= 1;
    if (x & 0x100) x ^= 0x11d;
  }
  for (let i = 255; i < 512; i += 1) GF_EXP[i] = GF_EXP[i - 255];
})();

function gfMul(a, b) {
  return (a === 0 || b === 0) ? 0 : GF_EXP[GF_LOG[a] + GF_LOG[b]];
}

function rsGeneratorPoly(degree) {
  let poly = [1];
  for (let i = 0; i < degree; i += 1) {
    const next = new Array(poly.length + 1).fill(0);
    const factor = GF_EXP[i];
    for (let j = 0; j < poly.length; j += 1) {
      next[j] ^= poly[j];
      next[j + 1] ^= gfMul(poly[j], factor);
    }
    poly = next;
  }
  return poly;
}

function rsEncode(data, ecCount) {
  const gen = rsGeneratorPoly(ecCount);
  const rem = new Uint8Array(ecCount);
  for (let i = 0; i < data.length; i += 1) {
    const factor = data[i] ^ rem[0];
    for (let j = 0; j < ecCount - 1; j += 1) rem[j] = rem[j + 1];
    rem[ecCount - 1] = 0;
    if (factor !== 0) {
      for (let j = 0; j < ecCount; j += 1) rem[j] ^= gfMul(gen[j + 1], factor);
    }
  }
  return rem;
}

function toUtf8Bytes(str) {
  if (typeof TextEncoder !== 'undefined') return Array.from(new TextEncoder().encode(str));
  const out = [];
  for (let i = 0; i < str.length; i += 1) {
    const c = str.charCodeAt(i);
    if (c < 0x80) out.push(c);
    else if (c < 0x800) out.push(0xc0 | (c >> 6), 0x80 | (c & 0x3f));
    else out.push(0xe0 | (c >> 12), 0x80 | ((c >> 6) & 0x3f), 0x80 | (c & 0x3f));
  }
  return out;
}

function pickVersion(byteLen) {
  for (let v = 1; v < VERSIONS.length; v += 1) {
    const countBits = v <= 9 ? 8 : 16;
    const capBits = VERSIONS[v].data * 8;
    if (4 + countBits + byteLen * 8 <= capBits) return v;
  }
  return 10;
}

function buildCodewords(bytes, ver) {
  const spec = VERSIONS[ver];
  const countBits = ver <= 9 ? 8 : 16;
  const maxBytes = Math.floor((spec.data * 8 - 4 - countBits) / 8);
  const clipped = bytes.slice(0, maxBytes);

  const bits = [];
  const pushBits = (val, n) => {
    for (let i = n - 1; i >= 0; i -= 1) bits.push((val >> i) & 1);
  };
  pushBits(0b0100, 4); // Modo Byte
  pushBits(clipped.length, countBits);
  for (const b of clipped) pushBits(b, 8);

  const capBits = spec.data * 8;
  const term = Math.min(4, capBits - bits.length);
  for (let i = 0; i < term; i += 1) bits.push(0);
  while (bits.length % 8 !== 0) bits.push(0);

  const dataCw = [];
  for (let i = 0; i < bits.length; i += 8) {
    let v = 0;
    for (let j = 0; j < 8; j += 1) v = (v << 1) | bits[i + j];
    dataCw.push(v);
  }
  const pads = [0xec, 0x11];
  let p = 0;
  while (dataCw.length < spec.data) {
    dataCw.push(pads[p & 1]);
    p += 1;
  }

  // Dividir em blocos e gerar correcção Reed-Solomon
  const dBlocks = [];
  const eBlocks = [];
  let offset = 0;
  for (const [count, dc, ec] of spec.blocks) {
    for (let b = 0; b < count; b += 1) {
      const slice = dataCw.slice(offset, offset + dc);
      offset += dc;
      dBlocks.push(slice);
      eBlocks.push(rsEncode(slice, ec));
    }
  }

  const out = [];
  const maxD = Math.max(...dBlocks.map((b) => b.length));
  for (let i = 0; i < maxD; i += 1) {
    for (const blk of dBlocks) if (i < blk.length) out.push(blk[i]);
  }
  const maxE = Math.max(...eBlocks.map((b) => b.length));
  for (let i = 0; i < maxE; i += 1) {
    for (const blk of eBlocks) if (i < blk.length) out.push(blk[i]);
  }
  return out;
}

function formatBitsL(mask) {
  const data = (0b01 << 3) | (mask & 7);
  let rem = data << 10;
  for (let i = 14; i >= 10; i -= 1) {
    if ((rem >> i) & 1) rem ^= (0x537 << (i - 10));
  }
  return ((data << 10) | rem) ^ 0x5412;
}

function makeBaseMatrix(ver) {
  const spec = VERSIONS[ver];
  const n = spec.size;
  const mat = Array.from({ length: n }, () => new Uint8Array(n));
  const res = Array.from({ length: n }, () => new Uint8Array(n));

  const setFn = (r, c, dark) => {
    if (r < 0 || c < 0 || r >= n || c >= n) return;
    mat[r][c] = dark ? 1 : 0;
    res[r][c] = 1;
  };

  // 3 padrões de deteção (7x7 + separador branco)
  const drawFinder = (r0, c0) => {
    for (let dr = -1; dr <= 7; dr += 1) {
      for (let dc = -1; dc <= 7; dc += 1) {
        const r = r0 + dr;
        const c = c0 + dc;
        if (r < 0 || c < 0 || r >= n || c >= n) continue;
        const inOuter = dr >= 0 && dr <= 6 && dc >= 0 && dc <= 6;
        const dark = inOuter && (
          dr === 0 || dr === 6 || dc === 0 || dc === 6 ||
          (dr >= 2 && dr <= 4 && dc >= 2 && dc <= 4)
        );
        setFn(r, c, dark);
      }
    }
  };
  drawFinder(0, 0);
  drawFinder(0, n - 7);
  drawFinder(n - 7, 0);

  // Linhas de temporização
  for (let i = 8; i < n - 8; i += 1) {
    setFn(6, i, (i & 1) === 0);
    setFn(i, 6, (i & 1) === 0);
  }

  // Padrões de alinhamento
  for (const ar of spec.align) {
    for (const ac of spec.align) {
      if ((ar <= 8 && ac <= 8) || (ar <= 8 && ac >= n - 9) || (ar >= n - 9 && ac <= 8)) continue;
      for (let dr = -2; dr <= 2; dr += 1) {
        for (let dc = -2; dc <= 2; dc += 1) {
          const dist = Math.max(Math.abs(dr), Math.abs(dc));
          setFn(ar + dr, ac + dc, dist !== 1);
        }
      }
    }
  }

  // Módulo escuro fixo + reservar áreas de formato
  setFn(4 * ver + 9, 8, true);
  for (let i = 0; i < 9; i += 1) {
    if (i !== 6) { res[8][i] = 1; res[i][8] = 1; }
  }
  for (let i = 0; i < 8; i += 1) {
    res[8][n - 1 - i] = 1;
    res[n - 1 - i][8] = 1;
  }

  // Informação de versão (V7+)
  if (spec.vbits) {
    for (let i = 0; i < 18; i += 1) {
      const bit = (spec.vbits >> i) & 1;
      const a = Math.floor(i / 3);
      const b = n - 11 + (i % 3);
      setFn(a, b, bit === 1);
      setFn(b, a, bit === 1);
    }
  }

  return { mat, res, size: n };
}

function applyFormat(mat, mask) {
  const n = mat.length;
  const bits = formatBitsL(mask);
  const topLeft = [
    [8, 0], [8, 1], [8, 2], [8, 3], [8, 4], [8, 5], [8, 7], [8, 8],
    [7, 8], [5, 8], [4, 8], [3, 8], [2, 8], [1, 8], [0, 8],
  ];
  for (let i = 0; i < 15; i += 1) {
    const bit = (bits >> (14 - i)) & 1;
    const [r1, c1] = topLeft[i];
    mat[r1][c1] = bit;
    if (i < 7) mat[n - 1 - i][8] = bit;
    else mat[8][n - 15 + i] = bit;
  }
}

function maskCond(mask, r, c) {
  switch (mask) {
    case 0: return ((r + c) % 2) === 0;
    case 1: return (r % 2) === 0;
    case 2: return (c % 3) === 0;
    case 3: return ((r + c) % 3) === 0;
    case 4: return ((Math.floor(r / 2) + Math.floor(c / 3)) % 2) === 0;
    case 5: return (((r * c) % 2) + ((r * c) % 3)) === 0;
    case 6: return ((((r * c) % 2) + ((r * c) % 3)) % 2) === 0;
    default: return ((((r + c) % 2) + ((r * c) % 3)) % 2) === 0;
  }
}

function penaltyScore(mat) {
  const n = mat.length;
  let score = 0;
  let dark = 0;
  for (let r = 0; r < n; r += 1) {
    let runR = 1;
    let runC = 1;
    for (let c = 0; c < n; c += 1) {
      if (mat[r][c]) dark += 1;
      if (c > 0) {
        if (mat[r][c] === mat[r][c - 1]) runR += 1;
        else { if (runR >= 5) score += 3 + (runR - 5); runR = 1; }
        if (mat[c][r] === mat[c - 1][r]) runC += 1;
        else { if (runC >= 5) score += 3 + (runC - 5); runC = 1; }
      }
      if (r < n - 1 && c < n - 1) {
        const v = mat[r][c];
        if (v === mat[r][c + 1] && v === mat[r + 1][c] && v === mat[r + 1][c + 1]) score += 3;
      }
    }
    if (runR >= 5) score += 3 + (runR - 5);
    if (runC >= 5) score += 3 + (runC - 5);
  }
  const pct = (dark * 100) / (n * n);
  score += Math.floor(Math.abs(pct - 50) / 5) * 10;
  return score;
}

export function generateQrMatrix(text) {
  const raw = String(text || 'https://ceu-academy.com');
  const bytes = toUtf8Bytes(raw);
  const ver = pickVersion(bytes.length);
  const codewords = buildCodewords(bytes, ver);
  const base = makeBaseMatrix(ver);
  const n = base.size;

  // Colocação zigzag dos bits de dados + correcção
  const dataBits = [];
  for (const cw of codewords) {
    for (let i = 7; i >= 0; i -= 1) dataBits.push((cw >> i) & 1);
  }
  const unmasked = base.mat.map((row) => new Uint8Array(row));
  let bitIdx = 0;
  let upward = true;
  for (let col = n - 1; col > 0; col -= 2) {
    if (col === 6) col -= 1;
    for (let i = 0; i < n; i += 1) {
      const r = upward ? (n - 1 - i) : i;
      for (let dc = 0; dc < 2; dc += 1) {
        const c = col - dc;
        if (base.res[r][c]) continue;
        unmasked[r][c] = bitIdx < dataBits.length ? dataBits[bitIdx] : 0;
        bitIdx += 1;
      }
    }
    upward = !upward;
  }

  // Escolher a melhor máscara (0..7)
  let bestMat = null;
  let bestMask = 0;
  let bestScore = Infinity;
  for (let m = 0; m < 8; m += 1) {
    const cand = unmasked.map((row, r) => {
      const out = new Uint8Array(row);
      for (let c = 0; c < n; c += 1) {
        if (!base.res[r][c] && maskCond(m, r, c)) out[c] ^= 1;
      }
      return out;
    });
    applyFormat(cand, m);
    const sc = penaltyScore(cand);
    if (sc < bestScore) {
      bestScore = sc;
      bestMask = m;
      bestMat = cand;
    }
  }

  return { version: ver, size: n, mask: bestMask, modules: bestMat };
}

export function renderQrSvg(text, opts = {}) {
  const { size = 180, fg = '#00217e', bg = '#ffffff', quiet = 2, label = 'Código QR' } = opts;
  const qr = generateQrMatrix(text);
  const total = qr.size + quiet * 2;
  const paths = [];
  for (let r = 0; r < qr.size; r += 1) {
    let runStart = -1;
    for (let c = 0; c <= qr.size; c += 1) {
      const dark = c < qr.size && qr.modules[r][c] === 1;
      if (dark && runStart < 0) runStart = c;
      else if (!dark && runStart >= 0) {
        paths.push(`M${runStart + quiet} ${r + quiet}h${c - runStart}v1h-${c - runStart}z`);
        runStart = -1;
      }
    }
  }
  const safeLabel = String(label || 'Código QR').replace(/[&<>"']/g, '');
  return `<svg class="ceu-qr-svg" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${total} ${total}" width="${size}" height="${size}" role="img" aria-label="${safeLabel}" shape-rendering="crispEdges"><rect width="${total}" height="${total}" fill="${bg}" rx="1.5"/><path d="${paths.join('')}" fill="${fg}"/></svg>`;
}
