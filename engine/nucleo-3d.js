// Interactive 3D Canvas Stage for Núcleo AMA (zero external CDN dependencies).
// Supports real-time perspective 3D projection, pointer drag-to-orbit with
// exponential damping, 4 discipline 3D models (polyhedron core, parabolic wave,
// mechanics gyroscope, compounding 3D columns), exploded-view factor, camera
// presets, and clickable orbiting discipline nodes.

const TAU = Math.PI * 2;

const DISCIPLINE_NODES = [
  { id: 'matematica', label: 'Funções', short: 'f(x)', color: '#10b981', angle: 0.2, elev: 0.35, r: 2.35 },
  { id: 'fisica', label: 'Física', short: 'F=ma', color: '#34d399', angle: 1.25, elev: -0.25, r: 2.45 },
  { id: 'algebra', label: 'Álgebra', short: '→v', color: '#b9f257', angle: 2.3, elev: 0.28, r: 2.3 },
  { id: 'programacao', label: 'Código', short: 'O(n)', color: '#2dd4bf', angle: 3.35, elev: -0.32, r: 2.5 },
  { id: 'financas', label: 'Finanças', short: 'Kz', color: '#84cc16', angle: 4.4, elev: 0.3, r: 2.38 },
  { id: 'comunicacao', label: 'Oratória', short: '5W', color: '#6ee7b7', angle: 5.45, elev: -0.22, r: 2.42 },
];

// Unit icosahedron geometry for the Núcleo AMA knowledge polyhedron
function buildIcosahedron(radius = 1.05) {
  const t = (1 + Math.sqrt(5)) / 2;
  const raw = [
    [-1, t, 0], [1, t, 0], [-1, -t, 0], [1, -t, 0],
    [0, -1, t], [0, 1, t], [0, -1, -t], [0, 1, -t],
    [t, 0, -1], [t, 0, 1], [-t, 0, -1], [-t, 0, 1],
  ];
  const verts = raw.map(([x, y, z]) => {
    const len = Math.hypot(x, y, z) || 1;
    return [x / len * radius, y / len * radius, z / len * radius];
  });
  const faces = [
    [0, 11, 5], [0, 5, 1], [0, 1, 7], [0, 7, 10], [0, 10, 11],
    [1, 5, 9], [5, 11, 4], [11, 10, 2], [10, 7, 6], [7, 1, 8],
    [3, 9, 4], [3, 4, 2], [3, 2, 6], [3, 6, 8], [3, 8, 9],
    [4, 9, 5], [2, 4, 11], [6, 2, 10], [8, 6, 7], [9, 8, 1],
  ];
  return { verts, faces };
}

function rotatePoint(p, rx, ry) {
  const cy = Math.cos(ry), sy = Math.sin(ry);
  const x1 = p[0] * cy + p[2] * sy;
  const z1 = -p[0] * sy + p[2] * cy;
  const cx = Math.cos(rx), sx = Math.sin(rx);
  const y2 = p[1] * cx - z1 * sx;
  const z2 = p[1] * sx + z1 * cx;
  return [x1, y2, z2];
}

function projectPoint(p, cx, cy, fov, dist) {
  const denom = Math.max(0.5, dist - p[2]);
  const scale = fov / denom;
  return [cx + p[0] * scale, cy - p[1] * scale, scale, p[2]];
}

function shadeColor(r, g, b, intensity) {
  const k = Math.max(0.18, Math.min(1.25, intensity));
  return `rgb(${Math.min(255, Math.round(r * k))},${Math.min(255, Math.round(g * k))},${Math.min(255, Math.round(b * k))})`;
}

export function mountNucleo3D(canvas, { onSelectNode = null, initialMode = 'core', customNodes = null, brand = '' } = {}) {
  if (!canvas || typeof canvas.getContext !== 'function') return null;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;

  const isCeu = brand === 'ceu' || (!brand && typeof document !== 'undefined' && document.documentElement?.dataset?.brand === 'ceu');
  const PAL = isCeu
    ? {
        bg0: '#0a2a6b', bg1: '#071940', bg2: '#040d24',
        ring1: 'rgba(0,164,220,0.58)', ring2: 'rgba(142,200,255,0.42)',
        edge: 'rgba(142,200,255,0.55)',
        faceA: [0, 132, 209], faceB: [0, 48, 138],
        accent: '#00a4dc', accentLight: '#9be5ff',
        nodeColors: ['#00a4dc', '#38bdf8', '#60a5fa', '#818cf8', '#22d3ee', '#7dd3fc'],
        barTopHi: '#7dd3fc', barTopLo: '#00a4dc',
        barS1: '#0b5cc5', barS2: '#084194', barS3: '#062f70', barS4: '#0d6ce0',
      }
    : {
        bg0: '#163427', bg1: '#0f1b16', bg2: '#0a100e',
        ring1: 'rgba(185,242,87,0.48)', ring2: 'rgba(16,185,129,0.38)',
        edge: 'rgba(185,242,87,0.52)',
        faceA: [28, 128, 86], faceB: [16, 76, 54],
        accent: '#b9f257', accentLight: '#d4fa8a',
        nodeColors: ['#10b981', '#34d399', '#b9f257', '#2dd4bf', '#84cc16', '#6ee7b7'],
        barTopHi: '#b9f257', barTopLo: '#34d399',
        barS1: '#0f7a53', barS2: '#14533c', barS3: '#114230', barS4: '#176649',
      };

  const activeNodes = Array.isArray(customNodes) && customNodes.length
    ? customNodes.slice(0, 6).map((cn, idx, arr) => ({
        id: cn.id || `n-${idx}`,
        label: String(cn.label || `Conceito ${idx + 1}`).slice(0, 22),
        short: String(cn.short || `${idx + 1}`).slice(0, 5),
        note: String(cn.note || ''),
        color: PAL.nodeColors[idx % PAL.nodeColors.length],
        angle: (idx / Math.max(1, arr.length)) * TAU + 0.25,
        elev: idx % 2 === 0 ? 0.34 : -0.28,
        r: 2.32 + (idx % 3) * 0.08,
      }))
    : DISCIPLINE_NODES.map((n, idx) => ({ ...n, color: PAL.nodeColors[idx % PAL.nodeColors.length] }));

  const ico = buildIcosahedron(1.06);
  const reducedMotion = typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

  const state = {
    mode: initialMode,
    explode: 0,
    targetExplode: 0,
    rx: 0.42,
    ry: 0.65,
    targetRx: 0.42,
    targetRy: 0.65,
    dragging: false,
    dragX: 0,
    dragY: 0,
    autoSpin: !reducedMotion,
    time: 0,
    activeNode: null,
    hoverNode: null,
    projectedNodes: [],
    rafId: 0,
    destroyed: false,
  };

  function resize() {
    const rect = canvas.getBoundingClientRect();
    const w = Math.max(320, Math.round(rect.width || 640));
    const h = Math.max(260, Math.round(rect.height || 360));
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    if (canvas.width !== Math.round(w * dpr) || canvas.height !== Math.round(h * dpr)) {
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
    }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    return { w, h };
  }

  function drawRing(cx, cy, fov, dist, radius, tiltX, tiltZ, color, width, dash = []) {
    const segs = 64;
    ctx.save();
    ctx.beginPath();
    ctx.strokeStyle = color;
    ctx.lineWidth = width;
    if (dash.length) ctx.setLineDash(dash);
    for (let i = 0; i <= segs; i += 1) {
      const a = (i / segs) * TAU;
      const x0 = Math.cos(a) * radius;
      const y0 = Math.sin(a) * radius * Math.sin(tiltX);
      const z0 = Math.sin(a) * radius * Math.cos(tiltX);
      const x1 = x0 * Math.cos(tiltZ) - y0 * Math.sin(tiltZ);
      const y1 = x0 * Math.sin(tiltZ) + y0 * Math.cos(tiltZ);
      const p = rotatePoint([x1, y1, z0], state.rx, state.ry);
      const [sx, sy] = projectPoint(p, cx, cy, fov, dist);
      if (i === 0) ctx.moveTo(sx, sy);
      else ctx.lineTo(sx, sy);
    }
    ctx.stroke();
    ctx.restore();
  }

  function drawCoreMode(cx, cy, fov, dist) {
    const exp = state.explode * 0.45;
    // Orbital measurement rings
    drawRing(cx, cy, fov, dist, 1.72 + exp * 0.6, 0.45, 0.28, PAL.ring1, 1.5);
    drawRing(cx, cy, fov, dist, 2.02 + exp * 0.8, -0.52, -0.35, PAL.ring2, 1.2, [5, 5]);

    // Depth-sorted icosahedron faces
    const light = [0.45, 0.72, 0.55];
    const tris = [];
    for (let i = 0; i < ico.faces.length; i += 1) {
      const [ia, ib, ic] = ico.faces[i];
      const va = ico.verts[ia], vb = ico.verts[ib], vc = ico.verts[ic];
      const nx0 = (va[0] + vb[0] + vc[0]) / 3;
      const ny0 = (va[1] + vb[1] + vc[1]) / 3;
      const nz0 = (va[2] + vb[2] + vc[2]) / 3;
      const nLen = Math.hypot(nx0, ny0, nz0) || 1;
      const ox = (nx0 / nLen) * exp;
      const oy = (ny0 / nLen) * exp;
      const oz = (nz0 / nLen) * exp;

      const pa = rotatePoint([va[0] + ox, va[1] + oy, va[2] + oz], state.rx, state.ry);
      const pb = rotatePoint([vb[0] + ox, vb[1] + oy, vb[2] + oz], state.rx, state.ry);
      const pc = rotatePoint([vc[0] + ox, vc[1] + oy, vc[2] + oz], state.rx, state.ry);

      const ux = pb[0] - pa[0], uy = pb[1] - pa[1], uz = pb[2] - pa[2];
      const vx = pc[0] - pa[0], vy = pc[1] - pa[1], vz = pc[2] - pa[2];
      const fnx = uy * vz - uz * vy;
      const fny = uz * vx - ux * vz;
      const fnz = ux * vy - uy * vx;
      const flen = Math.hypot(fnx, fny, fnz) || 1;
      const dot = (fnx * light[0] + fny * light[1] + fnz * light[2]) / flen;
      const avgZ = (pa[2] + pb[2] + pc[2]) / 3;
      tris.push({ pa, pb, pc, avgZ, dot, index: i });
    }
    tris.sort((a, b) => a.avgZ - b.avgZ);

    for (const tri of tris) {
      const sa = projectPoint(tri.pa, cx, cy, fov, dist);
      const sb = projectPoint(tri.pb, cx, cy, fov, dist);
      const sc = projectPoint(tri.pc, cx, cy, fov, dist);
      ctx.beginPath();
      ctx.moveTo(sa[0], sa[1]);
      ctx.lineTo(sb[0], sb[1]);
      ctx.lineTo(sc[0], sc[1]);
      ctx.closePath();
      const intensity = 0.45 + Math.max(-0.2, tri.dot) * 0.72;
      ctx.fillStyle = tri.index % 5 === 0
        ? shadeColor(PAL.faceA[0], PAL.faceA[1], PAL.faceA[2], intensity)
        : shadeColor(PAL.faceB[0], PAL.faceB[1], PAL.faceB[2], intensity);
      ctx.fill();
      ctx.strokeStyle = PAL.edge;
      ctx.lineWidth = 1;
      ctx.stroke();
    }
  }

  function drawWaveMode(cx, cy, fov, dist) {
    const n = 10;
    const span = 2.6;
    const amp = 0.45 + state.explode * 0.35;
    const grid = [];
    for (let ix = 0; ix <= n; ix += 1) {
      const row = [];
      for (let iz = 0; iz <= n; iz += 1) {
        const x = (ix / n - 0.5) * span;
        const z = (iz / n - 0.5) * span;
        const y = Math.sin(x * 1.8 + state.time * 1.4) * Math.cos(z * 1.6) * amp;
        row.push(rotatePoint([x, y, z], state.rx, state.ry));
      }
      grid.push(row);
    }
    const quads = [];
    for (let ix = 0; ix < n; ix += 1) {
      for (let iz = 0; iz < n; iz += 1) {
        const p00 = grid[ix][iz];
        const p10 = grid[ix + 1][iz];
        const p11 = grid[ix + 1][iz + 1];
        const p01 = grid[ix][iz + 1];
        const avgZ = (p00[2] + p10[2] + p11[2] + p01[2]) / 4;
        const avgY = (p00[1] + p10[1] + p11[1] + p01[1]) / 4;
        quads.push({ p00, p10, p11, p01, avgZ, avgY });
      }
    }
    quads.sort((a, b) => a.avgZ - b.avgZ);
    for (const q of quads) {
      const a = projectPoint(q.p00, cx, cy, fov, dist);
      const b = projectPoint(q.p10, cx, cy, fov, dist);
      const c = projectPoint(q.p11, cx, cy, fov, dist);
      const d = projectPoint(q.p01, cx, cy, fov, dist);
      ctx.beginPath();
      ctx.moveTo(a[0], a[1]);
      ctx.lineTo(b[0], b[1]);
      ctx.lineTo(c[0], c[1]);
      ctx.lineTo(d[0], d[1]);
      ctx.closePath();
      const t = (q.avgY + 0.8) / 1.6;
      ctx.fillStyle = shadeColor(18 + t * 90, 118 + t * 70, 74 + t * 20, 0.78);
      ctx.fill();
      ctx.strokeStyle = 'rgba(209,250,229,0.28)';
      ctx.lineWidth = 0.9;
      ctx.stroke();
    }
  }

  function drawGyroMode(cx, cy, fov, dist) {
    const exp = state.explode * 0.4;
    drawRing(cx, cy, fov, dist, 1.85 + exp, 0.12 + state.time * 0.35, 0.2, 'rgba(185,242,87,0.85)', 3);
    drawRing(cx, cy, fov, dist, 1.45 + exp * 0.7, 1.15 - state.time * 0.45, -0.5, 'rgba(52,211,153,0.85)', 2.6);
    drawRing(cx, cy, fov, dist, 1.05 + exp * 0.4, -0.8 + state.time * 0.55, 0.9, 'rgba(226,232,240,0.75)', 2.2);

    // Central axle vector arrows
    const axes = [
      { to: [0, 1.9, 0], color: '#b9f257', label: 'F' },
      { to: [1.9, 0, 0], color: '#34d399', label: 'v' },
      { to: [0, 0, 1.9], color: '#94a3b8', label: 'ω' },
    ];
    const origin = projectPoint(rotatePoint([0, 0, 0], state.rx, state.ry), cx, cy, fov, dist);
    for (const ax of axes) {
      const tip = projectPoint(rotatePoint(ax.to, state.rx, state.ry), cx, cy, fov, dist);
      ctx.beginPath();
      ctx.moveTo(origin[0], origin[1]);
      ctx.lineTo(tip[0], tip[1]);
      ctx.strokeStyle = ax.color;
      ctx.lineWidth = 2.2;
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(tip[0], tip[1], 4.5, 0, TAU);
      ctx.fillStyle = ax.color;
      ctx.fill();
    }
  }

  function drawMatrixMode(cx, cy, fov, dist) {
    const bars = [];
    const exp = state.explode * 0.32;
    for (let ix = -1; ix <= 1; ix += 1) {
      for (let iz = -1; iz <= 1; iz += 1) {
        const idx = (ix + 1) * 3 + (iz + 1);
        const h = 0.45 + (idx + 1) * 0.16 + Math.sin(state.time * 1.4 + idx) * 0.08;
        const x = ix * (0.72 + exp);
        const z = iz * (0.72 + exp);
        const center = rotatePoint([x, h * 0.5 - 0.65, z], state.rx, state.ry);
        bars.push({ x, z, h, avgZ: center[2], idx });
      }
    }
    bars.sort((a, b) => a.avgZ - b.avgZ);
    const s = 0.24;
    for (const b of bars) {
      const y0 = -0.75;
      const y1 = y0 + b.h;
      const pts = [
        [b.x - s, y0, b.z - s], [b.x + s, y0, b.z - s], [b.x + s, y0, b.z + s], [b.x - s, y0, b.z + s],
        [b.x - s, y1, b.z - s], [b.x + s, y1, b.z - s], [b.x + s, y1, b.z + s], [b.x - s, y1, b.z + s],
      ].map((pt) => projectPoint(rotatePoint(pt, state.rx, state.ry), cx, cy, fov, dist));

      const faces = [
        { ids: [4, 5, 6, 7], col: b.idx >= 6 ? PAL.barTopHi : PAL.barTopLo },
        { ids: [0, 1, 5, 4], col: PAL.barS1 },
        { ids: [1, 2, 6, 5], col: PAL.barS2 },
        { ids: [2, 3, 7, 6], col: PAL.barS3 },
        { ids: [3, 0, 4, 7], col: PAL.barS4 },
      ];
      for (const f of faces) {
        ctx.beginPath();
        ctx.moveTo(pts[f.ids[0]][0], pts[f.ids[0]][1]);
        for (let k = 1; k < 4; k += 1) ctx.lineTo(pts[f.ids[k]][0], pts[f.ids[k]][1]);
        ctx.closePath();
        ctx.fillStyle = f.col;
        ctx.fill();
        ctx.strokeStyle = 'rgba(255,255,255,0.2)';
        ctx.lineWidth = 0.8;
        ctx.stroke();
      }
    }
  }

  function renderFrame(dt) {
    const { w, h } = resize();
    const cx = w * 0.5;
    const cy = h * 0.52;
    const fov = Math.min(w, h) * 1.15;
    const dist = 6.2;

    // Smooth exponential damping
    const k = 1 - Math.exp(-8 * dt);
    if (state.autoSpin && !state.dragging) {
      state.targetRy += dt * 0.32;
    }
    state.rx += (state.targetRx - state.rx) * k;
    state.ry += (state.targetRy - state.ry) * k;
    state.explode += (state.targetExplode - state.explode) * k;
    state.time += dt;

    // Deep studio architectural background
    const bg = ctx.createRadialGradient(cx, cy * 0.78, 12, cx, cy, Math.max(w, h) * 0.72);
    bg.addColorStop(0, PAL.bg0);
    bg.addColorStop(0.58, PAL.bg1);
    bg.addColorStop(1, PAL.bg2);
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, w, h);

    // Subtle ground coordinate grid + contact shadow disc
    ctx.save();
    const shadowGrad = ctx.createRadialGradient(cx, cy + h * 0.31, 6, cx, cy + h * 0.31, w * 0.26);
    shadowGrad.addColorStop(0, 'rgba(0,0,0,0.52)');
    shadowGrad.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = shadowGrad;
    ctx.beginPath();
    ctx.ellipse(cx, cy + h * 0.31, w * 0.25, h * 0.08, 0, 0, TAU);
    ctx.fill();
    ctx.restore();

    // Draw selected 3D model
    if (state.mode === 'wave') drawWaveMode(cx, cy, fov, dist);
    else if (state.mode === 'gyro') drawGyroMode(cx, cy, fov, dist);
    else if (state.mode === 'matrix' || state.mode === 'finance') drawMatrixMode(cx, cy, fov, dist);
    else drawCoreMode(cx, cy, fov, dist);

    // Orbiting interactive concept / discipline nodes
    const orbitBoost = 1 + state.explode * 0.22;
    const nodes3d = activeNodes.map((n, idx) => {
      const a = n.angle + state.time * 0.16;
      const x = Math.cos(a) * n.r * orbitBoost;
      const z = Math.sin(a) * n.r * orbitBoost;
      const y = Math.sin(a * 1.5 + idx) * 0.55 + n.elev;
      const p = rotatePoint([x, y, z], state.rx, state.ry);
      const [sx, sy, sc, pz] = projectPoint(p, cx, cy, fov, dist);
      return { ...n, sx, sy, sc, pz };
    }).sort((a, b) => a.pz - b.pz);

    state.projectedNodes = nodes3d;

    for (const nd of nodes3d) {
      const isActive = state.activeNode === nd.id || state.hoverNode === nd.id;
      const radius = Math.max(12, Math.min(24, nd.sc * 0.16 + (isActive ? 4 : 0)));
      const alpha = Math.max(0.45, Math.min(1, (nd.pz + 2.8) / 4.8));

      ctx.save();
      ctx.globalAlpha = alpha;
      // Connecting filament to core
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(nd.sx, nd.sy);
      ctx.strokeStyle = isActive ? PAL.ring1 : PAL.ring2;
      ctx.lineWidth = isActive ? 1.8 : 1;
      ctx.stroke();

      // 3D shaded sphere badge
      const grad = ctx.createRadialGradient(
        nd.sx - radius * 0.35, nd.sy - radius * 0.35, radius * 0.15,
        nd.sx, nd.sy, radius
      );
      grad.addColorStop(0, '#f4fce8');
      grad.addColorStop(0.35, nd.color);
      grad.addColorStop(1, PAL.bg1);
      ctx.beginPath();
      ctx.arc(nd.sx, nd.sy, radius, 0, TAU);
      ctx.fillStyle = grad;
      ctx.fill();
      ctx.lineWidth = isActive ? 2.2 : 1.2;
      ctx.strokeStyle = isActive ? '#ffffff' : 'rgba(255,255,255,0.4)';
      ctx.stroke();

      // Crisp symbol inside sphere
      ctx.fillStyle = '#07131e';
      ctx.font = `800 ${Math.round(radius * 0.52)}px "JetBrains Mono", monospace`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(nd.short, nd.sx, nd.sy + 0.5);

      // Label below sphere
      ctx.fillStyle = isActive ? PAL.accentLight : 'rgba(232,245,238,0.92)';
      ctx.font = `700 11px "Instrument Sans", sans-serif`;
      ctx.fillText(nd.label, nd.sx, nd.sy + radius + 12);
      ctx.restore();
    }
  }

  function findHit(clientX, clientY) {
    const rect = canvas.getBoundingClientRect();
    const x = clientX - rect.left;
    const y = clientY - rect.top;
    for (let i = state.projectedNodes.length - 1; i >= 0; i -= 1) {
      const nd = state.projectedNodes[i];
      if (Math.hypot(x - nd.sx, y - nd.sy) <= 26) return nd;
    }
    return null;
  }

  let moved = false;
  const onPointerDown = (e) => {
    state.dragging = true;
    moved = false;
    state.dragX = e.clientX;
    state.dragY = e.clientY;
    canvas.setPointerCapture?.(e.pointerId);
  };
  const onPointerMove = (e) => {
    if (state.dragging) {
      const dx = e.clientX - state.dragX;
      const dy = e.clientY - state.dragY;
      if (Math.abs(dx) + Math.abs(dy) > 3) moved = true;
      state.dragX = e.clientX;
      state.dragY = e.clientY;
      state.targetRy += dx * 0.008;
      state.targetRx = Math.max(-1.25, Math.min(1.25, state.targetRx + dy * 0.008));
      return;
    }
    const hit = findHit(e.clientX, e.clientY);
    state.hoverNode = hit ? hit.id : null;
    canvas.style.cursor = hit ? 'pointer' : 'grab';
  };
  const onPointerUp = (e) => {
    if (!state.dragging) return;
    state.dragging = false;
    if (!moved) {
      const hit = findHit(e.clientX, e.clientY);
      if (hit) {
        state.activeNode = hit.id;
        if (typeof onSelectNode === 'function') onSelectNode(hit.id);
      }
    }
  };

  canvas.addEventListener('pointerdown', onPointerDown);
  canvas.addEventListener('pointermove', onPointerMove);
  canvas.addEventListener('pointerup', onPointerUp);
  canvas.addEventListener('pointercancel', onPointerUp);

  let lastTs = performance.now();
  function loop(now) {
    if (state.destroyed) return;
    const dt = Math.min(0.05, Math.max(0.001, (now - lastTs) / 1000));
    lastTs = now;
    renderFrame(dt);
    state.rafId = requestAnimationFrame(loop);
  }
  renderFrame(0.016);
  if (!reducedMotion) {
    state.rafId = requestAnimationFrame(loop);
  }

  return {
    setMode(mode) {
      state.mode = mode || 'core';
      if (reducedMotion) renderFrame(0.016);
    },
    setExplode(val) {
      state.targetExplode = Math.max(0, Math.min(1, Number(val) || 0));
      if (reducedMotion) { state.explode = state.targetExplode; renderFrame(0.016); }
    },
    setPreset(preset) {
      if (preset === 'top') { state.targetRx = 1.05; state.targetRy = 0.25; }
      else if (preset === 'front') { state.targetRx = 0.08; state.targetRy = 0; }
      else { state.targetRx = 0.42; state.targetRy = 0.65; }
      if (reducedMotion) { state.rx = state.targetRx; state.ry = state.targetRy; renderFrame(0.016); }
    },
    toggleSpin() {
      state.autoSpin = !state.autoSpin;
      return state.autoSpin;
    },
    destroy() {
      state.destroyed = true;
      if (state.rafId) cancelAnimationFrame(state.rafId);
      canvas.removeEventListener('pointerdown', onPointerDown);
      canvas.removeEventListener('pointermove', onPointerMove);
      canvas.removeEventListener('pointerup', onPointerUp);
      canvas.removeEventListener('pointercancel', onPointerUp);
    },
  };
}
