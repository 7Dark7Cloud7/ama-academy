/* AMA — Aristides Miguel Academy · SPA sem build, router por hash, backend local em localStorage. */
'use strict';

/* ================================ utils ================================== */
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const kz = (v) => new Intl.NumberFormat('pt-AO', { style: 'currency', currency: 'AOA', maximumFractionDigits: 0 }).format(v || 0).replace('AOA', 'Kz');
const durMin = (s) => s >= 3600 ? Math.round(s / 60) + ' min' : Math.max(1, Math.round(s / 60)) + ' min';
/* "1 alunos ao vivo" lia-se na sala. A contagem em direto muda de um para dois
   a cada minuto, por isso o plural vai na própria string. */
const pl1 = (n, um, varios) => `${n} ${n === 1 ? um : varios}`;
const escAttr = esc;

/* Todas as chamadas passam pelo backend local (localStorage). O contrato de cada
   rota é igual ao do servidor original para que as vistas não tenham de mudar. */
async function api(path, opts = {}) { return window.AMA_LOCAL_API(path, opts); }
let toastT;
function toast(msg) { const t = $('#toast'); t.textContent = msg; t.classList.add('show'); clearTimeout(toastT); toastT = setTimeout(() => t.classList.remove('show'), 3200); }

/* Sistema de ícones AMA: grelha 24, traço 2.25, pontas redondas, 1 símbolo + 1 detalhe.
   Famílias: nav / aprendizagem / ao vivo / categorias / estado. Cor semântica via contentor. */
const o = (g) => `<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2.25" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${g}</svg>`;
const OR = '#c7e86a', TL = '#2f7f68', RD = '#c0392b', PK = '#6f8a7a';
const I = {
  home: o('<path d="M4 10.4 12 4l8 6.4V19a1.6 1.6 0 0 1-1.6 1.6H5.6A1.6 1.6 0 0 1 4 19Z"/><path d="M9.6 20.4v-6h4.8v6"/>'),
  book: o('<path d="M12 6.6C10.2 5.3 8 4.9 5.6 5.3v13c2.4-.4 4.6 0 6.4 1.3 1.8-1.3 4-1.7 6.4-1.3v-13C16 4.9 13.8 5.3 12 6.6Z"/><path d="M12 6.6v13"/>'),
  video: o('<rect x="3" y="6.6" width="12.4" height="10.8" rx="3.2"/><path d="M15.4 10.9 21 8.1v7.8l-5.6-2.8Z"/>'),
  library: o('<rect x="4.4" y="4.6" width="4" height="14.8" rx="1.3"/><rect x="10" y="4.6" width="4" height="14.8" rx="1.3"/><path d="M16.1 5.8l3.4-.7 2.1 14.2-3.4.7Z"/>'),
  search: o('<circle cx="10.8" cy="10.8" r="6.9"/><path d="M15.9 15.9 21 21"/>'),
  bell: o('<path d="M12 3.6a6 6 0 0 1 6 6c0 3.2.7 4.7 1.6 5.8H4.4C5.3 14.3 6 12.8 6 9.6a6 6 0 0 1 6-6Z"/><path d="M9.8 18.6a2.4 2.4 0 0 0 4.4 0"/><circle cx="17.6" cy="5.4" r="2.7" fill="' + OR + '" stroke="none"/>'),
  profile: o('<circle cx="12" cy="12" r="8.6"/><circle cx="12" cy="10" r="3"/><path d="M6.6 18.3a6.6 6.6 0 0 1 10.8 0"/>'),
  play: o('<rect x="3" y="5.6" width="18" height="12.8" rx="3.4"/><path d="M10.3 9.3l4.9 2.7-4.9 2.7Z"/>'),
  clock: o('<circle cx="12" cy="12" r="8.6"/><path d="M12 7.4V12l3.1 2"/>'),
  cert: o('<path d="M8 8h6M8 11.4h4"/><path d="M18.6 3.6H6.4A2.4 2.4 0 0 0 4 6v12a2.4 2.4 0 0 0 2.4 2.4h5"/><path d="M6.4 3.6h12.2A2.4 2.4 0 0 1 21 6v6"/><circle cx="16.6" cy="16.2" r="3.1"/><path d="M15.2 18.9l-.9 3.1 2.3-1.2 2.3 1.2-.9-3.1"/>'),
  level: o('<rect x="4.4" y="13" width="3.6" height="7" rx="1.2"/><rect x="10.2" y="8.6" width="3.6" height="11.4" rx="1.2"/><rect x="16" y="4.2" width="3.6" height="15.8" rx="1.2"/>'),
  target: o('<circle cx="12" cy="12" r="7.8"/><circle cx="12" cy="12" r="3.9"/><path d="M19.4 4.6 14.8 9.2M19.4 4.6h-3.3M19.4 4.6v3.3"/>'),
  bulb: o('<path d="M9.6 17.6a6.4 6.4 0 1 1 4.8 0c-.6.5-1 1.2-1 1.9h-2.8c0-.7-.4-1.4-1-1.9Z"/><path d="M10.4 20.6h3.2M12 2.8v1.4M4.6 7.6l1.3.8M19.4 7.6l-1.3.8"/>'),
  grad: o('<path d="M2.6 9.4 12 5l9.4 4.4L12 13.8Z"/><path d="M6.6 11.7v4.3c0 1.5 2.4 2.9 5.4 2.9s5.4-1.4 5.4-2.9v-4.3M21.4 9.4v5"/>'),
  live: o('<g stroke="' + OR + '"><rect x="3" y="6.6" width="12.4" height="10.8" rx="3.2"/><path d="M15.4 10.9 21 8.1v7.8l-5.6-2.8Z"/></g>'),
  calendar: o('<g stroke="' + TL + '"><rect x="4" y="5.6" width="16" height="14.8" rx="3"/><path d="M4 10.2h16M9 3.6v4M15 3.6v4"/><rect x="7.6" y="13" width="4.2" height="4.2" rx="1.2" fill="' + TL + '" stroke="none" opacity=".4"/></g>'),
  users: o('<circle cx="9.4" cy="9" r="3.4"/><path d="M3.9 19.2a5.6 5.6 0 0 1 11 0"/><circle cx="16.9" cy="10" r="2.6"/><path d="M15.6 14.7a4.6 4.6 0 0 1 4.8 4.5"/>'),
  chat: o('<path d="M20 11.6c0 3.9-3.6 7-8 7-.9 0-1.9-.1-2.7-.4l-4.8 1.4 1.3-3.4a6.7 6.7 0 0 1-1.8-4.6c0-3.9 3.6-7 8-7s8 3.1 8 7Z"/><path d="M9 11.6h.01M12 11.6h.01M15 11.6h.01" stroke-width="2.9"/>'),
  mic: o('<g stroke="' + TL + '"><rect x="9.5" y="3.4" width="5" height="10.2" rx="2.5"/><path d="M6.4 11.2a5.6 5.6 0 0 0 11.2 0M12 16.8v3.2M9.2 20.6h5.6"/></g>'),
  screen: o('<rect x="3.4" y="4.4" width="17.2" height="12" rx="2.6"/><path d="M12 12.6V8.2M9.8 10.3 12 8.1l2.2 2.2M8.4 20.4h7.2M12 16.4v4"/>'),
  hand: o('<path d="M7.2 11.6V6.2a1.6 1.6 0 0 1 3.2 0v4.6M10.4 10.8V4.8a1.6 1.6 0 0 1 3.2 0v6M13.6 10.8V6.2a1.6 1.6 0 0 1 3.2 0v6.4M16.8 12.6V9.4a1.6 1.6 0 0 1 3.2 0v5.2c0 4.1-2.9 7-7 7-3.3 0-5-1.6-6.5-4.3l-1.7-3a1.7 1.7 0 0 1 2.9-1.7l1.5 2.1"/>'),
  endcall: o('<g stroke="' + RD + '"><path d="M20.4 13.6c-5 3.4-11.8 3.4-16.8 0-.6-.4-.7-1.2-.3-1.8l1.5-2.1c.4-.5 1.1-.7 1.7-.4l2.4 1.1c.6.3.9.9.8 1.5l-.2 1c1.6.6 3.4.6 5 0l-.2-1c-.1-.6.2-1.2.8-1.5l2.4-1.1c.6-.3 1.3-.1 1.7.4l1.5 2.1c.4.6.3 1.4-.3 1.8Z"/></g>'),
  mega: o('<g stroke="' + OR + '"><path d="M14.2 5.4 7.2 9H4.6A1.6 1.6 0 0 0 3 10.6v2.8A1.6 1.6 0 0 0 4.6 15h2.6l7 3.6Z"/><path d="M7.2 15l1 4.6h2.5L9.8 15M17.2 14.6c0-3 1.4-5.4 3.8-7.1M21 7.5h-2.7M21 7.5v2.7"/></g>'),
  brand: o('<rect x="4.6" y="3.6" width="14.8" height="16.8" rx="4.6"/><path d="M9.6 8h3a2.2 2.2 0 0 1 0 4.4h-3ZM9.6 12.4h3.6a2.3 2.3 0 0 1 0 4.6h-3.6ZM9.6 8v9"/>'),
  speak: o('<rect x="4.6" y="4.2" width="4.6" height="8.2" rx="2.3"/><path d="M2.8 10.4a4.1 4.1 0 0 0 8.2 0M6.9 14.6v2.6M4.8 17.2h4.2"/><path d="M21 9.2c0 2.6-2.2 4.6-5 4.6-.5 0-1-.1-1.4-.2l-2.4 1 .7-2.1a4.4 4.4 0 0 1-1.2-3.3c0-2.6 2.2-4.6 5-4.6s4.3 2 4.3 4.6Z"/><path d="M14.6 9.2h2.8"/>'),
  code: o('<path d="M8.4 7.4 4 12l4.4 4.6M15.6 7.4 20 12l-4.4 4.6M13.3 5.4l-2.6 13.2"/>'),
  fin: o('<g stroke="' + TL + '"><rect x="4" y="14" width="3.4" height="6" rx="1.1"/><rect x="9.4" y="10.6" width="3.4" height="9.4" rx="1.1"/><rect x="14.8" y="7.2" width="3.4" height="12.8" rx="1.1"/><path d="M4.6 9.4 9 6.4l3.4 2L19 4.4M19 7.9V4.4h-3.5"/></g>'),
  heart: o('<g stroke="' + PK + '"><path d="M12 20.2S4.4 15.5 4.4 10A4.4 4.4 0 0 1 12 7.5 4.4 4.4 0 0 1 19.6 10c0 5.5-7.6 10.2-7.6 10.2Z"/></g>'),
  money: o('<circle cx="12" cy="12" r="8.6"/><path d="M12 6.8v10.4M14.9 9.1c-.6-.9-1.7-1.4-2.9-1.4-1.6 0-2.9.9-2.9 2.2 0 3 5.8 1.8 5.8 4.7 0 1.3-1.3 2.2-2.9 2.2-1.2 0-2.3-.5-2.9-1.4"/>'),
  chart: o('<rect x="4.4" y="13" width="3.6" height="7" rx="1.2"/><rect x="10.2" y="8.6" width="3.6" height="11.4" rx="1.2"/><rect x="16" y="4.2" width="3.6" height="15.8" rx="1.2"/>'),
  cog: o('<circle cx="12" cy="12" r="3"/><path d="M12 3.4v2.2M12 18.4v2.2M20.6 12h-2.2M5.6 12H3.4M18.1 5.9l-1.6 1.6M7.5 16.5l-1.6 1.6M16.5 16.5l1.6 1.6M5.9 5.9l1.6 1.6"/>'),
  shield: o('<path d="M12 3 19.6 5.8v5.4c0 4.6-3.1 8.1-7.6 9.8-4.5-1.7-7.6-5.2-7.6-9.8V5.8Z"/><path d="M9 11.8l2.3 2.3 3.9-4.2"/>'),
  check: o('<path d="M5 12.6l4.4 4.4L19 7.2"/>'),
  lock: o('<rect x="5" y="10.4" width="14" height="10" rx="3"/><path d="M8.4 10.4V8a3.6 3.6 0 0 1 7.2 0v2.4M12 14.4v2.6"/>'),
  doc: o('<path d="M6.4 3.6h11.2A2.4 2.4 0 0 1 20 6v12a2.4 2.4 0 0 1-2.4 2.4H6.4A2.4 2.4 0 0 1 4 18V6a2.4 2.4 0 0 1 2.4-2.4Z"/><path d="M8.4 8.4h7.2M8.4 12h7.2M8.4 15.6h4.4"/>'),
  quiz: o('<circle cx="12" cy="12" r="8.6"/><path d="M9.8 9.5a2.3 2.3 0 1 1 4 1.6c-.8.9-1.8 1.2-1.8 2.6M12 17.2v.01"/>'),
  spark: o('<path d="M11.4 3.2l1.9 5.3 5.3 1.9-5.3 1.9-1.9 5.3-1.9-5.3-5.3-1.9 5.3-1.9Z"/><path d="M18.4 15.6l.8 1.9 1.9.8-1.9.8-.8 1.9-.8-1.9-1.9-.8 1.9-.8Z" fill="currentColor" stroke="none"/>'),
  logout: o('<path d="M10 4.6H6.6A2.6 2.6 0 0 0 4 7.2v9.6a2.6 2.6 0 0 0 2.6 2.6H10"/><path d="M15.4 8.4 19 12l-3.6 3.6M19 12H9"/>'),
  arrow: o('<path d="M4.6 12h13.8M13 6.6 18.4 12 13 17.4"/>'),
  back: '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M19.4 12H5.6M11 6.6 5.6 12 11 17.4"/></svg>',
  chev: o('<path d="M6.5 9.5 12 15l5.5-5.5"/>'),
  menu: o('<path d="M4 7h16M4 12h16M4 17h16"/>'),
  close: o('<path d="M6.4 6.4 17.6 17.6M17.6 6.4 6.4 17.6"/>'),
  globe: o('<circle cx="12" cy="12" r="8.6"/><path d="M3.4 12h17.2M12 3.4c-2.6 2.9-2.6 14.3 0 17.2M12 3.4c2.6 2.9 2.6 14.3 0 17.2"/>'),
  plus: o('<path d="M12 5.4v13.2M5.4 12h13.2"/>'),
  star: '★',
  cam: o('<rect x="3" y="6.6" width="12.4" height="10.8" rx="3.2"/><path d="M15.4 10.9 21 8.1v7.8l-5.6-2.8Z"/><path d="M7.4 10.4a2 2 0 0 1 0 3.4"/>'),
  full: o('<path d="M9.2 4.4H4.4V9.2M14.8 4.4h4.8V9.2M14.8 19.6h4.8v-4.8M9.2 19.6H4.4v-4.8"/>'),
  cc: o('<rect x="3.4" y="6" width="17.2" height="12" rx="3"/><path d="M10.2 10.8a2.3 2.3 0 1 0 0 2.6M16.6 10.8a2.3 2.3 0 1 0 0 2.6"/>'),
  flag: o('<path d="M6.2 3.8v16.4M6.2 5h11.4l-2.3 4 2.3 4H6.2"/>'),
};
/* Símbolo da marca: o "A" de AMA desenhado a traço e fechado por um golpe de
   marcador — a letra só existe quando a caneta passa. O traço usa a classe
   .lg-mark para pintar por contexto (verde sobre o chip lima, lima sobre fundo
   escuro), porque um acento fixo desaparecia num dos dois mundos. */
const LOGO = `<svg class="logo-sym" viewBox="0 0 64 64" fill="none" aria-hidden="true">
<path d="M15.5 51.5 32 12.5 48.5 51.5" stroke="currentColor" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/>
<path class="lg-mark" pathLength="100" d="M18.5 41.6C26 38.9 38 37.1 45.6 36.3" stroke="currentColor" stroke-width="6.4" stroke-linecap="round"/></svg>`;
const wordmark = () => `${LOGO}<span class="lw">AMA<b>ARISTIDES MIGUEL</b></span>`;
/* Todas as marcas usam o MESMO símbolo (o da navbar). LOGO_SM é apenas um apelido
   para não partir chamadas antigas — uma variante desenhada à parte ficava
   ilegível a 24px (o arco tracejado lia-se como um círculo partido). */
const LOGO_SM = LOGO;
/* Casa que substitui o "A" quando se passa o rato por cima de qualquer logo
   clicável — as mesmas duas pernas do A ganham chão e porta: o lettering é
   literalmente a estrutura de uma casa. injetaHouse() adiciona este SVG a todos
   os .logo-chip após cada render; a troca é um cross-fade em CSS. */
const LOGO_HOUSE = `<svg class="logo-house" viewBox="0 0 64 64" fill="none" aria-hidden="true">
<path d="M15.5 51.5 32 12.5 48.5 51.5" stroke="currentColor" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/>
<path d="M11 51.5h42" stroke="currentColor" stroke-width="5.4" stroke-linecap="round"/>
<path class="lg-mark" d="M26.5 51.5v-10a1.6 1.6 0 0 1 1.6-1.6h7.8a1.6 1.6 0 0 1 1.6 1.6v10" stroke="currentColor" stroke-width="5"/>
</svg>`;
/* Bandas de blob abstracto (mesma linguagem do hero) reutilizáveis em cabeçalhos de página */
const blobSvg = (cls = 'hero-blobs') => `<svg class="${cls}" viewBox="0 0 1440 700" preserveAspectRatio="none" aria-hidden="true">
  <path fill="#1a211c" d="M-80,-70 C110,-90 250,40 232,180 C214,318 60,382 -70,318 C-190,258 -230,20 -80,-70 Z"/>
  <path fill="#1a211c" d="M1150,-80 C1330,-60 1470,60 1452,190 C1436,300 1320,330 1236,262 C1150,192 1060,20 1150,-80 Z"/>
  <path fill="#202823" d="M300,-60 C560,-40 640,150 520,270 C420,370 470,470 620,520 C790,576 760,790 560,800 C380,808 300,660 380,540 C450,436 330,360 250,240 C180,134 180,-70 300,-60 Z"/>
  <path fill="#1a211c" d="M1080,760 C1000,600 1120,470 1290,486 C1430,500 1500,620 1452,760 Z"/>
  <ellipse cx="1010" cy="430" rx="150" ry="112" fill="#26302a" opacity=".75"/>
</svg>`;
/* Variante para secções baixas (footer, bandas, cabeçalhos curtos): o blob de
   1440x700 com preserveAspectRatio=none ficava visivelmente esticado quando a
   caixa tinha ~200px de altura. Aqui as formas já são desenhadas para a altura
   curta — só cantos e uma elipse a meio, sem esmagamento vertical. */
const blobSvgShort = (cls = 'hero-blobs') => `<svg class="${cls}" viewBox="0 0 1440 260" preserveAspectRatio="none" aria-hidden="true">
  <path fill="#1a211c" d="M-60,-40 C90,-58 200,30 182,120 C164,208 30,250 -80,206 C-180,166 -190,10 -60,-40 Z"/>
  <path fill="#1a211c" d="M1290,-46 C1420,-30 1500,50 1478,132 C1458,206 1352,228 1284,176 C1214,122 1180,10 1290,-46 Z"/>
  <path fill="#202823" d="M470,-70 C640,-52 700,80 610,150 C540,206 580,268 700,292 L700,320 L420,320 C360,250 380,160 330,90 C290,32 330,-78 470,-70 Z"/>
  <ellipse cx="1050" cy="188" rx="170" ry="62" fill="#26302a" opacity=".75"/>
</svg>`;
/* Tempo relativo em pt-AO a partir de datetime SQLite (UTC "YYYY-MM-DD HH:MM:SS") */
const relTime = (s) => {
  if (!s) return '';
  const t = new Date(String(s).replace(' ', 'T') + 'Z').getTime();
  const m = Math.max(0, Math.round((Date.now() - t) / 60000));
  if (m < 1) return 'agora mesmo';
  if (m < 60) return `há ${m} min`;
  const h = Math.round(m / 60); if (h < 24) return `há ${h} h`;
  const d = Math.round(h / 24); if (d === 1) return 'ontem'; if (d < 7) return `há ${d} dias`;
  return new Date(t).toLocaleDateString('pt-PT', { day: 'numeric', month: 'short' });
};
/* Sublinhado de marcador (animação de desenho) sob uma palavra */
const mark = (word) => `<span class="mkw">${word}<svg class="mk" viewBox="0 0 120 12" preserveAspectRatio="none" aria-hidden="true"><path d="M4 8.5C30 4.5 62 3.5 116 6.5" pathLength="100"/></svg></span>`;
/* Bandeira de Angola em miniatura (faixas + estrela/gear simplificados) */
const FLAG_AO = `<svg class="flag-ao" viewBox="0 0 24 16" aria-label="Angola" role="img"><rect width="24" height="8" rx="2" fill="#000"/><rect y="8" width="24" height="8" rx="2" fill="#ce1126"/><circle cx="12" cy="8" r="3.1" fill="none" stroke="#ffcd00" stroke-width="1.3" stroke-dasharray="2.4 1.3"/><path d="M12 5.2l.8 1.7 1.8.2-1.4 1.2.5 1.8L12 10.9l-1.7.9.5-1.8L9.4 8.8l1.8-.2Z" fill="#ffcd00"/></svg>`;
const navIcon = (k) => I[k] || I.home;
const PAPEL_LABEL = { STUDENT: 'Aluno', INSTRUCTOR: 'Professor', ADMIN: 'Administrador' };

/* ================================ state ================================== */
const S = { user: null, catalogo: null, filters: { q: '', cat: 'Todas', nivel: 'Todos', sort: 'pop' }, navStack: [] };
const byId = (id, arr) => arr.find(x => x.id == id);

/* Largura a partir da qual a barra pública passa a hambúrguer. Tem de bater
   certo com o @media(max-width:992px) de styles.css — é aqui que o mega-menu
   decide se abre ao rato ou se vai para o painel. */
const NAV_BP = 992;

/* ================================ router ================================= */
const routes = [];
const on = (path, view, opt = {}) => routes.push({ path, view, ...opt });
function go(hash) { const t = hash.startsWith('#') ? hash : '#' + hash; if (location.hash === t) render(); else location.hash = t; }
window.go = go;
/* Navegação de retorno estilo Android: mantemos a NOSSA pilha de rotas (S.navStack)
   em vez de depender de history.back() — dentro desta SPA de hash, history.back()
   pode saltar para páginas externas ao app (ou não disparar se o utilizador entrou
   por um link direto); a pilha gerida replica o gesto "voltar" do Android de forma fiável. */
window.goBack = () => { const prev = S.navStack.pop(); updateBackBtn(); go(prev || '/'); };
function updateBackBtn() { $$('.nav-back').forEach(b => { b.hidden = S.navStack.length === 0; }); }
async function render() {
  closeSide();
  if (!location.hash.startsWith('#/sala')) cleanupLive();
  const hash = location.hash.slice(1) || '/';
  /* pilha de rotas: guarda a rota de onde vimos antes de renderizar a nova
     (cobre cliques em links, go() e o "voltar" do navegador via hashchange);
     sem duplicados consecutivos, comprimento limitado a 25 */
  if (S.navCur !== undefined && S.navCur !== hash && S.navStack[S.navStack.length - 1] !== S.navCur) {
    S.navStack.push(S.navCur);
    if (S.navStack.length > 25) S.navStack.shift();
  }
  S.navCur = hash;
  const [pathRaw, query = ''] = hash.split('?');
  const params = new URLSearchParams(query);
  const q = Object.fromEntries(params.entries());
  for (const r of routes) {
    const m = r.path.replace(/:[^/]+/g, '([^/]+)').replace(/\//g, '\\/');
    const exec = new RegExp('^' + m + '$').exec(pathRaw);
    if (!exec) continue;
    const prot = /^\/(aluno|certificados|aprender|instrutor|admin|assistente|estudar|revisao|professor|turmas?|lecionar)/.test(pathRaw);
    if (prot && !S.user) { return renderAuthNeeded(); }
    const need = { instrutor: ['INSTRUCTOR', 'ADMIN'], professor: ['INSTRUCTOR', 'ADMIN'], admin: ['ADMIN'], lecionar: ['INSTRUCTOR', 'ADMIN'] }[pathRaw.split('/')[1]];
    if (need && !need.includes(S.user?.papel)) { toast('Sem permissão para essa área.'); return go('/' + homePath()); }
    const names = (r.path.match(/:[^/]+/g) || []).map(s => s.slice(1));
    const args = Object.fromEntries(names.map((n, i) => [n, exec[i + 1]]));
    $('#app').innerHTML = '<div class="spinner"></div>';
    try { $('#app').innerHTML = await r.view({ args, q }); }
    catch (e) { $('#app').innerHTML = shellPublic(`<div class="empty"><h2>Ops</h2><p>${esc(e.message)}</p><button class="btn btn-p" onclick="go('/catalogo')">Voltar ao catálogo</button></div>`); }
    window.scrollTo({ top: 0, behavior: 'instant' });
    afterRender();
    updateBackBtn();
    return;
  }
  go('/');
}
function renderAuthNeeded() {
  $('#app').innerHTML = viewEntrar(true);
  afterRender();
  updateBackBtn();
}
function afterRender() {
  $$('canvas[data-chart]').forEach(drawChart);
  $$('.acc-h').forEach(h => h.onclick = () => h.parentElement.classList.toggle('open'));
  /* Casa dentro de cada chip de logo (cross-fade no hover) + mega-menu abre/fecha com o rato */
  $$('.logo-chip').forEach(ch => { if (!ch.querySelector('.logo-house')) ch.insertAdjacentHTML('beforeend', LOGO_HOUSE); });
  const mw = $('.lnk-wrap');
  if (mw) {
    mw.addEventListener('mouseenter', () => { clearTimeout(window.__megiT); if (innerWidth > NAV_BP) $('#mega')?.classList.add('open'); });
    mw.addEventListener('mouseleave', () => { window.__megiT = setTimeout(closeMega, 180); });
    $$('.mega-card').forEach(a => a.addEventListener('click', closeMega));
    if ($('.pnav')) megaCounts();
  }
  const rvs = $$('.rv');
  const revealNow = () => rvs.forEach(el => { if (!el.classList.contains('in') && el.getBoundingClientRect().top < innerHeight * 0.92) el.classList.add('in'); });
  revealNow();
  if (window.__revealOff) window.__revealOff();
  addEventListener('scroll', revealNow, { passive: true });
  window.__revealOff = () => removeEventListener('scroll', revealNow);
  enhanceFun();
  if (window.UNI && typeof window.UNI.sync3D === 'function') window.UNI.sync3D();
}
/* Camada lúdica: marcador de caneta, números que contam, luz/inclinação do herói.
   Sob prefers-reduced-motion tudo aparece já pintado. */
const noMotion = () => matchMedia('(prefers-reduced-motion:reduce)').matches;
let __funOff;
/* Estado da camada lúdica chama-se .drawn e NÃO .in: os contentores de layout
   (.hero .in, .ws-hero .in, .pnav .in) apanhavam o span do marcador e
   herdavam o padding deles — o sublinhado saltava para fora da palavra. */
function enhanceFun() {
  const fun = $$('.hl,.mkw,.doodle');
  const count = $$('[data-count]');
  const hero = $('.hero');
  if (noMotion()) {
    fun.forEach(e => e.classList.add('drawn'));
    count.forEach(e => { e.textContent = e.dataset.count + (e.dataset.suffix || ''); });
    return;
  }
  const paint = () => {
    fun.forEach(e => { if (!e.classList.contains('drawn') && e.getBoundingClientRect().top < innerHeight * .9) e.classList.add('drawn'); });
    count.forEach(e => {
      if (e.dataset.done || e.getBoundingClientRect().top > innerHeight * .9) return;
      e.dataset.done = '1';
      const alvo = Number(e.dataset.count) || 0, suf = e.dataset.suffix || '', t0 = performance.now();
      const passo = (agora) => {
        const k = Math.min(1, (agora - t0) / 1100);
        e.textContent = Math.round(alvo * (1 - Math.pow(1 - k, 3))) + suf;
        if (k < 1) requestAnimationFrame(passo);
      };
      requestAnimationFrame(passo);
    });
  };
  paint();
  if (__funOff) __funOff();
  addEventListener('scroll', paint, { passive: true });
  __funOff = () => removeEventListener('scroll', paint);
  if (hero && matchMedia('(hover:hover) and (pointer:fine)').matches) {
    const frame = $('.hero-frame', hero);
    hero.addEventListener('mousemove', (e) => {
      const r = hero.getBoundingClientRect();
      const nx = (e.clientX - r.left) / r.width, ny = (e.clientY - r.top) / r.height;
      hero.style.setProperty('--hx', (nx * 100).toFixed(1) + '%');
      hero.style.setProperty('--hy', (ny * 100).toFixed(1) + '%');
      if (frame) {
        frame.style.setProperty('--rx', ((ny - .5) * -4).toFixed(2) + 'deg');
        frame.style.setProperty('--ry', ((nx - .5) * 5).toFixed(2) + 'deg');
      }
      hero.classList.add('is-live');
    });
    hero.addEventListener('mouseleave', () => {
      hero.classList.remove('is-live');
      if (frame) { frame.style.setProperty('--rx', '0deg'); frame.style.setProperty('--ry', '0deg'); }
    });
  }
}
window.carScroll = (dir) => { const c = $('.carousel'); if (c) c.scrollBy({ left: dir * 580, behavior: 'smooth' }); };
let __rz; addEventListener('resize', () => { clearTimeout(__rz); __rz = setTimeout(() => $$('canvas[data-chart]').forEach(drawChart), 160); }, { passive: true });
window.addEventListener('hashchange', () => { closeMenu(); closeMega(); render(); });

/* ================================ shells ================================= */
/* Botão "Voltar" (estilo Android) — visível só quando há página anterior na pilha.
   A visibilidade é calculada ao renderizar (S.navStack.length) e ajustada ao vivo
   por updateBackBtn() após cada navegação. */
const navBackBtn = () => `<button type="button" class="icon-btn nav-back" aria-label="Voltar à página anterior" title="Voltar" onclick="goBack()"${S.navStack.length ? '' : ' hidden'}>${I.back}<span class="nb-lbl">Voltar</span></button>`;

const isCeuSite = () => document.documentElement.dataset.brand === 'ceu';
const brandLogoMarkup = () => isCeuSite()
  ? `<a class="logo" href="#/ceu-inicio"><span class="logo-chip"><img src="assets/ceu-logo.png?v=1" alt="CEU" class="ceu-logo-img"></span><span class="lw">CEU<b>ACADEMY</b></span></a>`
  : `<a class="logo" href="#/"><span class="logo-chip">${LOGO}</span><span class="lw">AMA<b>ARISTIDES MIGUEL</b></span></a>`;
const brandArtMarkup = () => isCeuSite()
  ? `<a class="brand" href="#/ceu-inicio" title="CEU Academy" aria-label="Ir para a página inicial"><span class="logo-chip"><img src="assets/ceu-logo.png?v=1" alt="CEU" class="ceu-logo-img"></span><div><b style="font-family:var(--font-d);font-size:19px;color:#fff">CEU</b><span class="brand-sub">ACADEMY</span></div></a>`
  : `<a class="brand" href="#/" title="AMA · Aristides Miguel Academy" aria-label="Ir para a página inicial"><span class="logo-chip">${LOGO}</span><div><b style="font-family:var(--font-d);font-size:19px;color:#fff">AMA</b><span class="brand-sub">ARISTIDES MIGUEL</span></div></a>`;

function shellPublic(content, active = '') {
  const megaCats = [
    ['Desenvolvimento Pessoal', 'users', 'Oratória, liderança e inteligência emocional'],
    ['Tecnologia', 'code', 'Programação, IA e automação do zero ao avançado'],
    ['Negócios', 'mega', 'Vendas, marketing digital e gestão'],
    ['Finanças', 'fin', 'Educação financeira e investimento em Kz'],
  ];
  const ceu = isCeuSite();
  const navLinksHtml = ceu
    ? `<a href="#/ceu-inicio" class="lnk ${active == 'inicio' ? 'on' : ''}">Início</a>
      <a href="#/projetor" class="lnk ${active == 'projetor' ? 'on' : ''}">Projetor IA</a>
      <a href="#/catalogo" class="lnk ${active == 'catalogo' ? 'on' : ''}">Cursos</a>
      <a href="#/campus" class="lnk ${active == 'campus' ? 'on' : ''}">Campus &amp; Turmas</a>
      <a href="#/cartao-ceu" class="lnk ${active == 'cartao' ? 'on' : ''}">Cartão CEU</a>
      ${S.user ? `<a href="#/${homePath()}" class="lnk ${active == 'painel' ? 'on' : ''}">Painel</a>` : ''}`
    : `<span class="lnk-wrap"><button class="lnk ${active == 'catalogo' ? 'on' : ''}" onclick="toggleMega(event)" aria-haspopup="true" aria-expanded="false">Cursos ${I.chev}</button>
        <div class="mega" id="mega"><div class="mega-in">
          <div class="mega-grid">${megaCats.map(([c]) => `<a class="mega-card" href="#/catalogo" onclick="setCat('${escAttr(c)}')">
            <img src="media/${CAT_MEGA[c]}.jpg?v=70" alt="" loading="lazy" decoding="async" onerror="this.remove()">
            <span class="mc-shade"></span>
            <span class="mc-cap"><b>${esc(c)}</b><small><span class="mega-n" data-cat="${escAttr(c)}"></span></small></span></a>`).join('')}
          </div>
          <a class="mega-all" href="#/catalogo">Ver todos os cursos ${I.arrow}</a>
        </div></div></span>
      <a href="#/ao-vivo" class="lnk ${active == 'live' ? 'on' : ''}">Aulas ao vivo</a>
      <a href="#/universidade" class="lnk ${active == 'universidade' ? 'on' : ''}">Universidade</a>
      <a href="#/projetor" class="lnk ${active == 'projetor' ? 'on' : ''}" title="PDF → slides → projetor (uma só ferramenta)">Projetor &amp; Slides</a>
      <a href="#/workshops" class="lnk ${active == 'workshops' ? 'on' : ''}">Workshops</a>
      <a href="#/publicar" class="lnk ${active == 'publicar' ? 'on' : ''}">Publicar</a>
      ${S.user ? `<a href="#/${homePath()}" class="lnk ${active == 'painel' ? 'on' : ''}">Meu painel</a>` : ''}`;
  return `<div>
  <nav class="pnav"><div class="in">
    <button class="nav-burger" id="burger-top" aria-label="Abrir menu" aria-expanded="false" onclick="toggleMenu()">${I.menu}</button>
    ${S.user ? `<div class="dd notif-dd" id="notif-dd"><button class="nav-ic tb-notif" title="Notificações" aria-label="Notificações" aria-haspopup="true" onclick="ddToggle(event);notifToggle(event)">${I.bell}<b class="nb" id="notif-n" hidden>0</b></button><div class="dd-menu notif-menu" id="notif-menu"></div></div>` : ''}
    ${navBackBtn()}
    ${brandLogoMarkup()}
    <div class="links" id="navlinks">
      ${navLinksHtml}
      <div class="m-only">
        ${S.user
          ? `<button class="btn btn-ghost btn-sm m-sair" onclick="logout()">${I.logout} Terminar sessão</button>`
          : `<div class="m-auth"><a class="btn btn-ghost btn-sm" href="#/entrar">Entrar</a><a class="btn btn-f btn-sm" href="#/registo">Criar conta</a></div>`}
      </div>
    </div>
    <label class="search">${I.search}<input id="nav-q" aria-label="Pesquisar cursos ou temas" placeholder="Pesquisar cursos…" value="${escAttr(S.filters.q)}" onkeydown="if(event.key==='Enter'){S.filters.q=this.value;go('/catalogo?q='+encodeURIComponent(this.value))}"></label>
    <div class="sp"></div>
    ${themeBtn()}
    ${S.user
      ? `<div class="flex bar-act"><a class="nav-av" href="#/${homePath()}" title="${escAttr(S.user.nome)}" style="background:${escAttr(S.user.avatar_cor)}">${escAttr(S.user.nome.split(' ').map(w => w[0]).slice(0, 2).join(''))}</a>
         <button class="btn btn-ghost btn-sm" onclick="logout()">${I.logout}<span class="lbl-sair"> Sair</span></button></div>`
      : `<span class="flex bar-act"><a class="btn btn-ghost btn-sm" href="#/entrar">Entrar</a><a class="btn btn-f btn-sm" href="#/registo">Criar conta</a></span>`}
  </div></nav>
  ${content}
  ${footer()}</div>`;
}
window.toggleMega = (e) => {
  if (e) e.stopPropagation();
  if (matchMedia(`(max-width:${NAV_BP}px)`).matches) { closeMenu(); go('/catalogo'); return; }
  const m = $('#mega'); m.classList.toggle('open');
  const b = m.closest('.lnk-wrap')?.querySelector('.lnk');
  if (b) b.setAttribute('aria-expanded', m.classList.contains('open') ? 'true' : 'false');
};
window.closeMega = () => {
  const m = $('#mega'); if (!m) return;
  m.classList.remove('open');
  const b = m.closest('.lnk-wrap')?.querySelector('.lnk');
  if (b) b.setAttribute('aria-expanded', 'false');
};
/* Contagens reais de cursos por categoria no mega-menu (via API, tolerante a falhas) */
async function megaCounts() {
  try {
    const d = await api('/api/catalogo');
    const counts = {};
    (d.cursos || []).forEach(c => counts[c.categoria] = (counts[c.categoria] || 0) + 1);
    $$('.mega-n').forEach(el => { const n = counts[el.dataset.cat]; if (n != null) el.textContent = n + (n === 1 ? ' curso' : ' cursos'); });
  } catch { }
}
window.toggleMenu = () => {
  const l = $('#navlinks'); if (!l) return;
  const open = l.classList.toggle('open');
  const b = $('#burger-top');
  if (b) { b.innerHTML = open ? I.close : I.menu; b.setAttribute('aria-expanded', open ? 'true' : 'false'); b.setAttribute('aria-label', open ? 'Fechar menu' : 'Abrir menu'); }
};
window.closeMenu = () => {
  const l = $('#navlinks'); if (!l || !l.classList.contains('open')) return;
  l.classList.remove('open');
  const b = $('#burger-top');
  if (b) { b.innerHTML = I.menu; b.setAttribute('aria-expanded', 'false'); b.setAttribute('aria-label', 'Abrir menu'); }
};
window.toggleSide = () => { const s = $('#sb'), c = $('#sb-scrim'); if (!s) return; const on = s.classList.toggle('open'); if (c) c.classList.toggle('on', on); };
window.closeSide = () => { const s = $('#sb'), c = $('#sb-scrim'); if (s) s.classList.remove('open'); if (c) c.classList.remove('on'); };
window.ddToggle = (e) => { e.stopPropagation(); const dd = e.currentTarget.closest('.dd'); const was = dd.classList.contains('open'); $$('.dd.open').forEach(x => x.classList.remove('open')); if (!was) dd.classList.add('open'); };
document.addEventListener('click', (e) => {
  const m = $('#mega'); if (m && !e.target.closest('.lnk-wrap')) m.classList.remove('open');
  // Se o alvo foi desanexado do DOM (ex.: o painel re-renderizou-se durante o clique),
  // ele vivia num dropdown — não fechar.
  if (e.target.isConnected && !e.target.closest('.dd')) $$('.dd.open').forEach(x => x.classList.remove('open'));
  if (e.target.isConnected && !e.target.closest('.pnav')) closeMenu();
});
function footer() {
  if (isCeuSite()) {
    return `<footer class="ft ceu-ft"><div class="in">
      <div class="ft-brand">
        ${brandLogoMarkup()}
        <p>Plataforma académica universitária ligada ao Cartão Nacional de Estudante (ceu.ao): cursos práticos, cartão digital e projetor PDF → Slides com IA e 3D.</p>
      </div>
      <div class="ft-col"><h4>Plataforma</h4><a href="#/projetor">Projetor IA</a><a href="#/catalogo">Cursos universitários</a><a href="#/cartao-ceu">Cartão CEU</a><a href="#/entrar">Entrar / Conta</a></div>
      <div class="ft-col"><h4>Contacto</h4><a href="mailto:geral@ceu.ao">geral@ceu.ao</a><a href="https://ceu.ao/" target="_blank" rel="noopener noreferrer">Portal oficial ceu.ao ↗</a><a>Luanda, Angola</a></div>
    </div><div class="bar"><span>© 2026 CEU Academy · APP FEITO PELA HORIZONTE FUTURO</span><span>Base de dados local + sincronização MVP</span></div></footer>`;
  }
  const soc = [['f', 'M13.5 21v-7h2.4l.4-3h-2.8V9.1c0-.9.3-1.5 1.6-1.5h1.3V4.9c-.3 0-1.1-.1-2-.1-2 0-3.4 1.2-3.4 3.5V11H8.5v3h2.4v7h2.6z'], ['x', 'M17.5 5h-2.1l-3.3 4.7L6.4 5H3.9l6.6 9.3L4.2 19h2.1l3.5-5 4.9 5h2.5l-6.9-9.6L17.5 5z'], ['in', 'M7 10v9H4v-9h3zM5.5 4.2a1.8 1.8 0 110 3.6 1.8 1.8 0 010-3.6zM20 14.4c0-3-1.6-4.4-3.7-4.4-1.7 0-2.5.9-2.9 1.6V10H10.4v9H13.3v-5c0-1.4.7-2.2 1.8-2.2s1.8.7 1.8 2.1V19H20v-4.6z'], ['yt', 'M21.3 8.6c-.2-1.4-.9-2.2-2.3-2.4C17.2 6 14.8 6 12 6s-5.2 0-7 .2c-1.4.2-2.1 1-2.3 2.4C2.5 10 2.5 11.4 2.5 12.5s0 2.5.2 3.9c.2 1.4.9 2.2 2.3 2.4 1.8.2 4.2.2 7 .2s5.2 0 7-.2c1.4-.2 2.1-1 2.3-2.4.2-1.4.2-2.8.2-3.9s0-2.5-.2-3.9zM10.2 15.4V9.6l5 2.9-5 2.9z']];
  return `<footer class="ft">${blobSvgShort()}<div class="in">
    <div class="ft-brand">
      <a class="logo" href="#/"><span class="logo-chip">${LOGO}</span><span class="lw">AMA<b>ARISTIDES MIGUEL</b></span></a>
      <p>A academia online feita em Angola. Cursos gravados, aulas ao vivo e Kuzaya AI — conhecimento que abre portas, dos nossos mentores para o seu futuro.</p>
      <div class="soc">${soc.map(([k, d]) => `<a class="soc-i" href="#/" aria-label="${k}"><svg viewBox="0 0 24 24" width="17" height="17" fill="currentColor" aria-hidden="true"><path d="${d}"/></svg></a>`).join('')}</div>
    </div>
    <div class="ft-col"><h4>Explorar</h4><a href="#/catalogo">Catálogo de cursos</a><a href="#/workshops">Workshops e eventos</a><a href="#/ao-vivo">Aulas ao vivo</a><a href="#/boas-vindas">Como funciona</a><a href="#/registo">Criar conta</a></div>
    <div class="ft-col"><h4>Apoio</h4><a href="#/boas-vindas">Centro de ajuda</a><a href="mailto:ola@ama.ao">ola@ama.ao</a><a>+244 900 000 000</a><a>Luanda, Angola</a></div>
    <div class="ft-col"><h4>Legal</h4><a>Termos de utilização</a><a>Política de privacidade</a><a>Reembolsos (7 dias)</a></div>
    <div class="ft-news">
      <h4>Métodos de pagamento</h4>
      <div class="pay-chips"><span class="pay kz">Kz</span><span class="pay mcx">MULTICAIXA Express</span><span class="pay um">Unitel Money</span></div>
      <h4 style="margin-top:20px">Receba novidades</h4>
      <form class="news-f" onsubmit="event.preventDefault();toast('Inscrição confirmada — obrigado!');this.reset()"><input type="email" required placeholder="O seu e-mail"><button class="btn btn-f btn-sm" type="submit">Inscrever-me</button></form>
    </div>
  </div><div class="bar"><span>© 2026 AMA — Aristides Miguel Academy · Luanda, Angola</span><span>Modo local · os dados ficam guardados neste navegador</span></div></footer>`;
}
const homePath = () => S.user ? ({ STUDENT: 'aluno', INSTRUCTOR: 'instrutor', ADMIN: 'admin' }[S.user.papel] || 'aluno') : '/';
window.logout = async () => { try { await api('/api/auth/logout', { method: 'POST' }); } catch { } S.user = null; notifLogout(); toast('Sessão terminada.'); go('/'); };

/* Sidebar: no desktop expande no hover (o CSS trata do atraso de recolha).
   Mobile usa o hamburger e não passa por aqui. */
window.sbHover = (on) => {
  if (!matchMedia('(min-width:1081px)').matches) return;
  const sh = document.querySelector('.shell');
  if (sh) sh.classList.toggle('sb-open', !!on);
};

function panelShell(active, content, items, opts = {}) {
  const initials = S.user.nome.split(' ').map(w => w[0]).slice(0, 2).join('');
  const dicas = ['Marque uma aula como concluída para o Kuzaya AI sugerir o próximo passo.', 'Pergunte ao Kuzaya AI: ele responde citando a aula exata do seu curso.', 'Aulas ao vivo ficam gravadas — reveja quando quiser no seu painel.', 'O assistente no canto inferior direito também encontra cursos para si.'];
  const dica = dicas[new Date().getDate() % dicas.length];
  return `<div class="shell${opts.full ? ' shell-full' : ''}">
  <div class="sb-scrim" id="sb-scrim" onclick="closeSide()"></div>
  <aside class="sidebar" id="sb" onmouseenter="sbHover(true)" onmouseleave="sbHover(false)">
    <span class="sb-grip" aria-hidden="true"><i></i><i></i></span>
    ${brandArtMarkup()}
    ${items.map(g => `<div class="nav-h">${esc(g.h)}</div>` + g.i.map(([k, ic, label, n]) =>
      `<a class="nav-i ${active === k ? 'on' : ''}" href="#/${k}" title="${escAttr(label)}">${navIcon(ic)}<span class="ni-l">${esc(label)}</span>${n ? `<span class="nav-n">${n}</span>` : ''}</a>`).join('')).join('')}
    <div class="side-tip"><span class="st-ic">${I.bulb}</span><b>Dica rápida</b><p>${esc(dica)}</p><a href="#/boas-vindas">Ver dicas ${I.arrow}</a></div>
    <div class="side-foot"><span class="av" style="background:${escAttr(S.user.avatar_cor)}">${escAttr(initials)}</span>
      <div style="flex:1"><b>${esc(S.user.nome)}</b><small>${PAPEL_LABEL[S.user.papel] || 'Convidado'}</small></div>
      <button class="icon-btn" style="color:#7d867f" title="Sair" onclick="logout()">${I.logout}</button></div>
  </aside>
  <div class="main">
    <header class="topbar">
      <button class="icon-btn sb-burger" id="burger" aria-label="Abrir menu" onclick="toggleSide()">${I.menu}</button>
      ${navBackBtn()}
      <div class="search">${I.search}<input placeholder="Pesquisar cursos, professores ou tópicos..." onkeydown="if(event.key==='Enter'){S.filters.q=this.value;go('/catalogo?q='+encodeURIComponent(this.value))}"></div>
      <div class="sp"></div>
      ${themeBtn()}
      <a class="icon-btn" href="#/ao-vivo" title="Aulas ao vivo">${I.live}</a>
      <button class="icon-btn tb-spark" title="Kuzaya AI" aria-label="Abrir Kuzaya AI" onclick="omaToggle()">${I.spark}</button>
      <div class="dd notif-dd" id="notif-dd">
        <button class="icon-btn tb-notif" title="Notificações" aria-label="Notificações" aria-haspopup="true" onclick="ddToggle(event);notifToggle(event)">${I.bell}<b class="nb" id="notif-n" hidden>0</b></button>
        <div class="dd-menu notif-menu" id="notif-menu"></div>
      </div>
      <span class="chip chip-v tb-papel" title="O portal que está a usar">${PAPEL_LABEL[S.user.papel] || 'Convidado'}</span>
    </header>
    <div class="content angola-bg${opts.bare ? ' no-pad' : ''}">${content}</div>
  </div>
  ${omaDockHTML()}
  </div>`;
}
const MENU = {
  aluno: [{ h: 'Aprendizagem', i: [['aluno', 'home', 'Painel'], ['turmas', 'users', 'Turmas'], ['estudar', 'spark', 'Estudar'], ['quiz', 'quiz', 'Modo Quiz'], ['revisao', 'clock', 'Revisão SM-2'], ['projetor', 'play', 'Projetor de Aulas'], ['catalogo', 'book', 'Explorar cursos'], ['workshops', 'mega', 'Workshops e eventos'], ['meus-bilhetes', 'cert', 'Os meus bilhetes'], ['certificados', 'cert', 'Certificados'], ['ao-vivo', 'live', 'Aulas ao vivo']] },
  { h: 'Ensinar e Publicar', i: [['publicar', 'plus', 'Estúdio de publicação'], ['instrutor/criar', 'book', 'Publicar curso'], ['workshops/criar', 'mega', 'Publicar workshop']] }],
  instrutor: [{ h: 'Ensino', i: [['instrutor', 'home', 'Painel'], ['projetor', 'play', 'Projetor PDF'], ['professor', 'grad', 'Oficina Docente'], ['turmas', 'users', 'Turmas'], ['publicar', 'plus', 'Estúdio de publicação'], ['instrutor/cursos', 'book', 'Meus cursos'], ['instrutor/criar', 'plus', 'Criar curso'], ['workshops/criar', 'mega', 'Publicar workshop'], ['quiz', 'quiz', 'Modo Quiz'], ['workshops', 'mega', 'Workshops e eventos'], ['ao-vivo', 'live', 'Aulas ao vivo']] },
  { h: 'Conta', i: [['instrutor/financeiro', 'money', 'Financeiro'], ['aluno', 'chart', 'Modo aluno']] }],
  admin: [{ h: 'Gestão', i: [['admin', 'home', 'Painel'], ['publicar', 'plus', 'Estúdio de publicação'], ['turmas', 'users', 'Turmas'], ['admin/cursos', 'book', 'Gestão de cursos'], ['admin/utilizadores', 'users', 'Utilizadores'], ['admin/financeiro', 'money', 'Financeiro']] },
  { h: 'Plataforma', i: [['estudar', 'spark', 'Estudar'], ['quiz', 'quiz', 'Modo Quiz'], ['projetor', 'play', 'Projetor PDF'], ['professor', 'grad', 'Oficina Docente'], ['workshops', 'mega', 'Workshops e eventos'], ['workshops/criar', 'plus', 'Publicar workshop'], ['admin/auditoria', 'shield', 'Auditoria'], ['ao-vivo', 'live', 'Aulas ao vivo'], ['instrutor/criar', 'plus', 'Criar curso']] }],
};

/* ================================ charts ================================= */
function drawChart(cv) {
  const kind = cv.dataset.chart, data = JSON.parse(cv.dataset.data || '[]');
  const dpr = devicePixelRatio || 1, H = Number(cv.dataset.h || 210);
  cv.style.width = '100%'; cv.style.height = H + 'px';
  const W = cv.clientWidth;
  cv.width = W * dpr; cv.height = H * dpr; const c = cv.getContext('2d'); c.scale(dpr, dpr);
  const dark = document.documentElement.dataset.theme === 'dark';
  const ink = dark ? '#f2f6f4' : '#111815', muted = dark ? '#93a39b' : '#5b6862';
  const grid = dark ? 'rgba(147,163,155,.16)' : 'rgba(17,24,21,.08)';
  const verde = '#10b981', blue = '#0f7a53', flame = '#84cc16', teal = '#0e7490', slate = '#475569';
  const pad = { l: 42, r: 12, t: 14, b: 26 };
  if (kind === 'line') {
    const has2 = data.some(d => d.s2 != null);
    const vals = has2 ? data.flatMap(d => [d.v, d.s2 || 0]) : data.map(d => d.v), max = Math.max(...vals, 1);
    c.strokeStyle = grid; c.fillStyle = muted; c.font = '600 11px "Instrument Sans", sans-serif'; c.lineWidth = 1;
    for (let g = 0; g <= 4; g++) { const y = pad.t + (H - pad.t - pad.b) * g / 4; c.beginPath(); c.moveTo(pad.l, y); c.lineTo(W - pad.r, y); c.stroke(); c.fillText(Math.round(max * (1 - g / 4) / 1000) + 'k', 4, y + 4); }
    const X = i => pad.l + (W - pad.l - pad.r) * i / Math.max(data.length - 1, 1), Y = v => pad.t + (H - pad.t - pad.b) * (1 - v / max);
    const grad = c.createLinearGradient(0, pad.t, 0, H); grad.addColorStop(0, 'rgba(16,185,129,.26)'); grad.addColorStop(1, 'rgba(16,185,129,0)');
    c.beginPath(); data.forEach((d, i) => i ? c.lineTo(X(i), Y(d.v)) : c.moveTo(X(i), Y(d.v)));
    c.strokeStyle = verde; c.lineWidth = 3; c.lineJoin = 'round'; c.stroke();
    c.lineTo(X(data.length - 1), H - pad.b); c.lineTo(X(0), H - pad.b); c.closePath(); c.fillStyle = grad; c.fill();
    c.fillStyle = verde; data.forEach((d, i) => { c.beginPath(); c.arc(X(i), Y(d.v), 4, 0, 7); c.fill(); });
    if (has2) {
      c.beginPath(); data.forEach((d, i) => i ? c.lineTo(X(i), Y(d.s2 || 0)) : c.moveTo(X(i), Y(d.s2 || 0)));
      c.strokeStyle = teal; c.lineWidth = 2.4; c.stroke();
      c.fillStyle = teal; data.forEach((d, i) => { c.beginPath(); c.arc(X(i), Y(d.s2 || 0), 3.2, 0, 7); c.fill(); });
    }
    c.fillStyle = muted; data.forEach((d, i) => data.length <= 12 && c.fillText(d.l, X(i) - 8, H - 8));
  } else if (kind === 'bars') {
    const series = data[0]?.s || []; const colors = [verde, slate, teal];
    const max = Math.max(...data.flatMap(d => d.s), 1);
    const bw = (W - pad.l - pad.r) / data.length;
    c.strokeStyle = grid; c.lineWidth = 1; c.fillStyle = muted; c.font = '600 11px "Instrument Sans", sans-serif';
    for (let g = 0; g <= 4; g++) { const y = pad.t + (H - pad.t - pad.b) * g / 4; c.beginPath(); c.moveTo(pad.l, y); c.lineTo(W - pad.r, y); c.stroke(); c.fillText(Math.round(max * (1 - g / 4)) + (max > 999 ? 'k' : ''), 6, y + 4); }
    data.forEach((d, i) => d.s.forEach((v, j) => {
      const h = (H - pad.t - pad.b) * v / max, x = pad.l + bw * i + bw * .24 + j * 14;
      c.fillStyle = colors[j % 3]; c.beginPath(); c.roundRect(x, H - pad.b - h, 11, Math.max(h, 3), 5); c.fill();
    }));
    c.fillStyle = muted; data.forEach((d, i) => c.fillText(d.l, pad.l + bw * i + bw * .25, H - 8));
  } else if (kind === 'donut') {
    const total = data.reduce((a, d) => a + d.v, 0) || 1; const cx = H / 2 + 8, cy = H / 2, r = H / 2 - 18;
    let ang = -Math.PI / 2; const cols = [verde, blue, teal, slate, flame, '#64748b'];
    data.forEach((d, i) => { const a2 = ang + d.v / total * Math.PI * 2; c.beginPath(); c.arc(cx, cy, r, ang, a2); c.arc(cx, cy, r * .62, a2, ang, true); c.closePath(); c.fillStyle = cols[i % 6]; c.fill(); ang = a2; });
    c.fillStyle = ink; c.font = '800 22px "Plus Jakarta Sans", sans-serif'; c.textAlign = 'center'; c.fillText(total, cx, cy + 3);
    c.font = '600 11px "Instrument Sans", sans-serif'; c.fillStyle = muted; c.fillText('cursos', cx, cy + 19); c.textAlign = 'left';
    const lx = cx + r + 26; c.font = '600 12.5px "Instrument Sans", sans-serif';
    const pctX = W - 10, labMax = pctX - 44 - (lx + 18);
    const fit = (t) => { if (c.measureText(t).width <= labMax) return t; while (t.length > 2 && c.measureText(t + '…').width > labMax) t = t.slice(0, -1); return t + '…'; };
    data.forEach((d, i) => { c.fillStyle = cols[i % 6]; c.beginPath(); c.roundRect(lx, 16 + i * 24, 11, 11, 4); c.fill(); c.fillStyle = ink; c.textAlign = 'left'; c.fillText(fit(d.l), lx + 18, 25 + i * 24); c.fillStyle = muted; c.textAlign = 'right'; c.fillText(Math.round(d.v / total * 100) + '%', pctX, 25 + i * 24); });
    c.textAlign = 'left';
  }
}

/* ================================ views: public =========================== */
const MENTORS = [
  { id: 2, nome: 'Prof. Adolfo Camacho', role: 'Oratória e Liderança', img: 'mentor-adolfo', curso: 1, tags: ['Palco', 'Discurso', 'Liderança'], bio: 'Formou mais de 400 profissionais em palco e comunicação executiva em Luanda.' },
  { id: 14, nome: 'Eng.ª Mei Lin Zhao', role: 'Programação e Dados', img: 'mentor-meilin', curso: 2, tags: ['Python', 'Automação', 'Dados'], bio: 'Engenheira de software especializada em automação e análise de dados reais.' },
  { id: 3, nome: 'Profa. Ana Baptista', role: 'Inteligência Emocional', img: 'mentor-ana', curso: 3, tags: ['Autocontrolo', 'Empatia', 'Equipas'], bio: 'Psicóloga organizacional, facilita equipas de alta pressão há 12 anos.' },
  { id: 13, nome: 'Prof. Nelson Tavares', role: 'Vendas e Negociação', img: 'mentor-nelson', curso: 4, tags: ['Prospecção', 'Fecho', 'B2B'], bio: 'Vendedor B2B de topo no mercado angolano, do primeiro contacto ao fecho.' },
  { id: 15, nome: 'Profa. Sofia Almeida', role: 'Marketing Digital', img: 'mentor-sofia', curso: 5, tags: ['Estratégia', 'Conteúdo', 'Marca'], bio: 'Estrategista de conteúdo e anúncios com campanhas em 6 províncias.' },
  { id: 16, nome: 'Prof. Duarte Costa', role: 'Finanças Pessoais', img: 'mentor-duarte', curso: 6, tags: ['Poupança', 'Kwanzas', 'Investimento'], bio: 'Consultor financeiro focado em poupança e investimento em kwanzas.' },
];
const mentorDe = (instrutorId) => MENTORS.find(m => m.id == instrutorId) || MENTORS[0];
/* Copy por curso: promessa do hero + descrições de "O que vai aprender" (painel zip7) */
const COURSE_COPY = {
  1: { promise: 'Fale com confiança em qualquer sala.', learn: [
    'Supere o medo de falar em público e transmita segurança em qualquer situação.',
    'Organize a sua mensagem de forma clara para engajar e ser lembrado.',
    'Comunique-se de forma autêntica e impactante com postura, voz e gestos.',
    'Apresente projetos e propostas a investidores sem perder o fio da meada.'] },
  2: { promise: 'Escreva o seu primeiro programa hoje.', learn: [
    'Comece do zero absoluto e escreva código Python 3 que funciona.',
    'Domine listas, dicionários e ficheiros — o dia a dia de quem programa.',
    'Crie scripts que automatizam tarefas repetitivas do seu trabalho.',
    'Consuma APIs reais e trate dados de verdade, do pedido ao resultado.'] },
  3: { promise: 'A emoção certa, no momento certo.', learn: [
    'Identifique as 5 emoções básicas e os sinais que o corpo dá primeiro.',
    'Use técnicas práticas para regular a raiva e a ansiedade sob pressão.',
    'Dê e receba feedback sem que a conversa descambe para o conflito.',
    'Lidere equipas lendo o estado emocional de cada pessoa.'] },
  4: { promise: 'Venda com método, não com sorte.', learn: [
    'Qualifique clientes com SPIN Selling antes de falar de preço.',
    'Transforme as 5 objeções mais comuns em oportunidades de conversa.',
    'Conduza o fecho com contrato assinado e peça referências.',
    'Monte um pipeline com follow-up disciplinado que não esquece ninguém.'] },
  5: { promise: 'Atenção que se transforma em vendas.', learn: [
    'Monte um calendário de conteúdo que atrai e converte.',
    'Segmenta anúncios pagos para o mercado angolano, sem desperdiçar orçamento.',
    'Meça CAC, ROAS e funil com números, não com achismos.',
    'Construa marca e prova social que sustentam o seu preço.'] },
  6: { promise: 'O seu Kwanza com plano de futuro.', learn: [
    'Monte um orçamento 50/30/20 ajustado à realidade de Angola.',
    'Crie um fundo de emergência que resiste aos imprevistos.',
    'Entenda juros, inflação e câmbio e o efeito no bolso.',
    'Dê os primeiros passos em investimento com segurança.'] },
  7: { promise: 'Lidere pessoas, não apenas tarefas.', learn: [
    'Defina papéis e delegue tarefas com expectativa clara.',
    'Dê feedback que corrige sem desmotivar.',
    'Conduza reuniões curtas que terminam com decisões.',
    'Mantenha a equipa motivada mesmo sob pressão.'] },
};
const copyDe = (id) => COURSE_COPY[id] || { promise: '', learn: [] };
/* Mini-capa: ícone vetorial por tópico (os antigos PNG 3D deixaram de existir) */
const OBJ_ART = {};
const nAulas = (n) => n + (n === 1 ? ' aula' : ' aulas');
const CAT_BANNER = { 'Desenvolvimento Pessoal': 'mega-pessoal', 'Tecnologia': 'mega-tecnologia', 'Negócios': 'mega-negocios', 'Finanças': 'mega-financas' };
/* artes verticais próprias do mega-menu Cursos (v39) */
const CAT_MEGA = { 'Desenvolvimento Pessoal': 'mega-pessoal', 'Tecnologia': 'mega-tecnologia', 'Negócios': 'mega-negocios', 'Finanças': 'mega-financas' };

let HOME_CAT = '';
window.setHomeCat = (cat) => { HOME_CAT = cat; render(); };

on('/', async () => {
  const { cursos } = await api('/api/catalogo');
  const live = await api('/api/ao-vivo').catch(() => []);
  const aoVivo = live.find(r => r.estado === 'AO_VIVO');
  const painel = S.user && S.user.papel === 'STUDENT' ? await api('/api/aluno/painel').catch(() => null) : null;
  const cont = painel && painel.cursos && painel.cursos[0];
  const dest = S.user ? `#/${homePath()}` : '#/registo';
  const counts = {};
  cursos.forEach(c => counts[c.categoria] = (counts[c.categoria] || 0) + 1);
  const totalAlunos = cursos.reduce((a, c) => a + (c.alunos || 0), 0).toLocaleString('pt-PT').replace(/\s/g, '.');
  const media = (cursos.reduce((a, c) => a + (c.rating || 0), 0) / Math.max(cursos.length, 1)).toFixed(1).replace('.', ',');
  const featured = cursos.find(c => c.id === 2) || cursos[0];
  const mostrados = HOME_CAT ? cursos.filter(c => c.categoria === HOME_CAT) : cursos.slice(0, 6);
  return shellPublic(`
  <main class="academy-home ama-studio">
    <section class="ama-hero-stage" aria-labelledby="home-title">
      <div class="ama-hero-center">
        <span class="ama-pill-kicker">Academia Prática de Angola · Cursos, Universidade &amp; Workshops</span>
        <h1 id="home-title">Conhecimento real.<br>Evolução <span class="ama-accent-word">ao seu ritmo.<svg viewBox="0 0 360 18" preserveAspectRatio="none" aria-hidden="true"><path d="M4 13 Q180 2 356 12"/></svg></span></h1>
        <p class="ama-hero-lead">Cursos gravados em kwanzas, turmas universitárias com o Núcleo AMA de aprendizagem ativa, workshops presenciais e um tutor que cita as suas aulas.</p>
        <div class="ama-hero-ctas">
          <a class="btn btn-p btn-lg" href="${dest}">${S.user ? 'Abrir o meu painel' : 'Começar agora'} ${I.arrow}</a>
          <a class="btn btn-o btn-lg" href="#/catalogo">${I.book} Explorar catálogo</a>
          <a class="btn btn-ghost btn-lg" href="#/universidade">${I.grad} Universidade</a>
        </div>
        <div class="ama-hero-metrics" aria-label="Números da academia">
          <span><b>${cursos.length}</b> cursos práticos</span>
          <i></i>
          <span><b>${totalAlunos}+</b> alunos a aprender</span>
          <i></i>
          <span><b>${media} ★</b> avaliação média</span>
          <i></i>
          <span class="ama-flag-pill">${FLAG_AO} Feita em Angola</span>
        </div>
      </div>

      <div class="ama-bento-hero">
        <article class="bento-tile bento-mentor">
          <div class="bt-mentor-copy">
            <span class="bt-live-tag">${aoVivo ? '<i class="dot"></i>Ao vivo agora' : 'Mentoria prática'}</span>
            <h2>Aprender com quem vive o mercado todos os dias.</h2>
            <p>${aoVivo ? esc(aoVivo.titulo) : 'Salas interativas, mentores em Luanda e material guardado neste navegador.'}</p>
            <div class="bt-mentor-acts">
              <a class="btn btn-p btn-sm" href="${aoVivo ? '#/sala/' + aoVivo.id : '#/ao-vivo'}">${I.video} ${aoVivo ? 'Entrar na sala' : 'Ver aulas ao vivo'}</a>
              <span class="bt-local-note">${I.check} Progresso local</span>
            </div>
          </div>
          <figure class="bt-mentor-photo">
            <img src="media/hero-mentor-v3.jpg?v=70" alt="Mentor AMA" fetchpriority="high" decoding="async">
          </figure>
        </article>

        <a class="bento-tile bento-uni" href="#/universidade">
          <div class="bt-top"><span class="bt-badge lime">NÚCLEO AMA</span><span class="bt-go">${I.arrow}</span></div>
          <div class="bt-uni-svg" aria-hidden="true">
            <svg viewBox="0 0 210 74" fill="none">
              <path d="M18 56 H192" stroke="rgba(255,255,255,.16)" stroke-width="1.5"/>
              <path d="M24 52 C68 50, 96 14, 146 22 S182 14, 192 10" stroke="#b9f257" stroke-width="2.5" stroke-linecap="round"/>
              <line x1="120" y1="16" x2="120" y2="56" stroke="rgba(185,242,87,.45)" stroke-width="1.2" stroke-dasharray="3 3"/>
              <circle cx="120" cy="23" r="5.5" fill="#10b981" stroke="#fff" stroke-width="2"/>
              <rect x="24" y="61" width="162" height="4" rx="2" fill="rgba(255,255,255,.18)"/>
              <rect x="24" y="61" width="96" height="4" rx="2" fill="#b9f257"/>
              <circle cx="120" cy="63" r="4.5" fill="#fff"/>
              <text x="132" y="21" font-size="9.5" font-weight="700" fill="#d4fa8a" font-family="monospace">Δy / Δx</text>
            </svg>
          </div>
          <h3>Universidade &amp; Núcleo AMA</h3>
          <p>Turmas, simulador de grandezas em tempo real, mapas de conceitos e revisão.</p>
        </a>

        ${featured ? `<a class="bento-tile bento-course" href="#/curso/${featured.id}">
          <div class="bt-top"><span class="bt-meta-k">${esc(featured.categoria)}</span><span class="bt-rate">★ ${featured.rating.toFixed(1).replace('.', ',')}</span></div>
          <div class="bt-course-thumb"><img src="media/${escAttr(courseArt(featured))}.jpg?v=70" alt="${escAttr(featured.titulo)}" decoding="async"></div>
          <h3>${esc(featured.titulo)}</h3>
          <div class="bt-course-foot"><b>${kz(featured.preco_kz)}</b><span>${nAulas(featured.aulas)} ${I.arrow}</span></div>
        </a>` : ''}

        <a class="bento-tile bento-ws" href="#/workshops">
          <div class="bt-top"><span class="bt-meta-k">Presencial &amp; online</span><span class="bt-go">${I.arrow}</span></div>
          <div class="bt-ws-row">
            <span class="bt-ws-ic">${I.users}</span>
            <div><h3>Workshops &amp; Networking</h3><p>Reserve lugar, troque contactos e transforme notas em cartões.</p></div>
          </div>
          <div class="bt-ws-meta">Luanda · Bilhete digital · Estudo local</div>
        </a>
      </div>
    </section>

    <section class="ama-section ama-courses-studio" aria-labelledby="home-courses">
      <div class="ama-sec-head">
        <div>
          <span class="eyebrow-t">${I.book} CATÁLOGO PRÁTICO</span>
          <h2 id="home-courses">Escolha a competência que quer dominar.</h2>
          <p>Filtre por área aqui mesmo ou abra o catálogo completo com pesquisa avançada.</p>
        </div>
        <a class="btn btn-o" href="#/catalogo">Ver catálogo completo ${I.arrow}</a>
      </div>
      <div class="ama-filter-pills" role="tablist" aria-label="Filtrar cursos por área">
        <button type="button" class="${!HOME_CAT ? 'on' : ''}" onclick="setHomeCat('')">Todos <span>${cursos.length}</span></button>
        ${Object.keys(CAT_BANNER).map(cat => `<button type="button" class="${HOME_CAT === cat ? 'on' : ''}" onclick="setHomeCat('${escAttr(cat)}')">${esc(cat)} <span>${counts[cat] || 0}</span></button>`).join('')}
      </div>
      <div class="grid g-3">${mostrados.map(c => courseCardHTML(c)).join('')}</div>
      <p class="academy-smallprint">Valores em kwanzas · pagamentos por MULTICAIXA e Unitel Money simulados no modo local.</p>
    </section>

    <section class="academy-campus ama-uni-showcase" aria-labelledby="home-campus">
      <div class="academy-campus-copy">
        <span class="bt-badge lime" style="margin-bottom:16px">UNIVERSIDADE · NÚCLEO AMA</span>
        <h2 id="home-campus">A sua turma.<br>A sua matéria.<br><span class="hl">Tudo ligado.</span></h2>
        <p>Da sala de aula à retenção duradoura: escolas, horário semanal, simuladores de grandezas em tempo real, mapas de conceitos, prática Feynman e revisão espaçada neste navegador.</p>
        <div class="flex" style="gap:10px;flex-wrap:wrap;margin-top:24px">
          <a class="btn btn-p btn-lg" href="#/universidade">Abrir Universidade ${I.arrow}</a>
          <a class="btn btn-o btn-ghost-d btn-lg" href="#/universidade/ferramentas">${I.spark} Laboratório Interativo</a>
        </div>
        <small>Guardado neste navegador. A chamada local não substitui o registo oficial da secretaria.</small>
      </div>
      <div class="academy-campus-links">
        <a href="#/turmas"><span>${I.users}</span><div><h3>Escolas e Turmas</h3><p>Disciplina, horário, sala, docente e código de entrada.</p></div>${I.arrow}</a>
        <a href="#/universidade/ferramentas"><span>${I.spark}</span><div><h3>Simulador de Grandezas &amp; Regras</h3><p>Isole qualquer variável, ajuste valores em direto e treine no modo desafio.</p></div>${I.arrow}</a>
        <a href="#/estudar"><span>${I.book}</span><div><h3>Dê vida à matéria</h3><p>Cole apontamentos e gere síntese, mapa de conceitos, cartões e espaço Feynman.</p></div>${I.arrow}</a>
        <a href="#/revisao"><span>${I.quiz}</span><div><h3>Revisão espaçada</h3><p>Previsão de carga de 7 dias e cartões que voltam no momento certo.</p></div>${I.arrow}</a>
      </div>
    </section>

    <section class="ama-section ama-mentors-editorial" aria-labelledby="home-mentors">
      <div class="ama-sec-head">
        <div>
          <span class="eyebrow-t">${I.users} EQUIPA DE MENTORES</span>
          <h2 id="home-mentors">Quem ensina na AMA pratica no terreno.</h2>
          <p>Profissionais experientes de Angola em comunicação, engenharia, vendas, marketing e finanças.</p>
        </div>
        <a class="btn btn-o btn-sm" href="#/catalogo">Ver todos os cursos ${I.arrow}</a>
      </div>
      <div class="ama-mentor-grid">
        ${MENTORS.map(m => `<a class="ama-mentor-row" href="#/mentor/${m.id}">
          <span class="amr-face"><img src="media/${m.img}.jpg?v=70" alt="${escAttr(m.nome)}" loading="lazy" decoding="async"></span>
          <div class="amr-body">
            <b>${esc(m.nome)}</b>
            <span class="amr-role">${esc(m.role)}</span>
            <p>${esc(m.bio)}</p>
            <div class="amr-meta">${m.tags.map(t => esc(t)).join(' · ')}</div>
          </div>
          <span class="amr-go" aria-hidden="true">${I.arrow}</span>
        </a>`).join('')}
      </div>
    </section>

    <section class="ama-dual-cta" aria-label="Workshops e Kuzaya AI">
      <article class="ama-split-card light">
        <div class="asc-top">
          <span class="eyebrow-t">WORKSHOPS &amp; EVENTOS</span>
          <h2>Aprender também é encontrar pessoas.</h2>
          <p>Agenda de workshops em Luanda e online, lista de participantes e networking preparado antes do evento.</p>
          <a class="btn btn-o" href="#/workshops">Explorar workshops ${I.arrow}</a>
          <small>Inscrições, pagamentos e networking de demonstração local.</small>
        </div>
        <div class="asc-img"><img src="media/live-host-v2.jpg?v=70" alt="Apresentador de workshop AMA" loading="lazy" decoding="async"></div>
      </article>
      <article class="ama-split-card dark">
        <span class="asc-ic">${I.spark}</span>
        <span class="bt-badge lime">KUZAYA AI · 24/7</span>
        <h2>Uma dúvida na aula? Comece uma conversa.</h2>
        <p>O Kuzaya AI consulta o conteúdo dos seus cursos e responde citando a aula exata de origem — sem invenções.</p>
        <div class="asc-actions">
          <a class="btn btn-p btn-lg" href="${S.user ? '#/assistente' : '#/entrar'}">Perguntar ao tutor ${I.arrow}</a>
          <a class="btn btn-o btn-ghost-d" href="#/estudar">Espaço de estudo</a>
        </div>
      </article>
    </section>
  </main>`, 'home');
});

/* v6: artes de cartão com o título impresso — sem overlays redundantes (painel catálogo) */
const CARD_BY_ID = { 1: 'card-oratoria-v2', 2: 'card-python-v2', 3: 'card-emocional-v2', 4: 'card-vendas-v2', 5: 'card-marketing-v2', 6: 'card-financas-v2', 7: 'card-lideranca-v2' };
const courseArt = (c) => CARD_BY_ID[c.id] || c.poster;
function courseCardHTML(c, rank) {
  const art = courseArt(c);
  return `<a class="course" href="#/curso/${c.id}" aria-label="Curso ${escAttr(c.titulo)}">
    <div class="thumb"><img src="media/${escAttr(art)}.jpg?v=70" alt="" loading="lazy" decoding="async">${rank ? `<span class="rank r${rank}">${rank}</span>` : ''}</div>
    <div class="body">
      <h3>${esc(c.titulo)}</h3>
      <div class="crow"><span class="lvl">${esc(c.nivel)}</span><span class="rate">${c.rating ? `★ ${c.rating.toFixed(1).replace('.', ',')} <small>(${c.alunos.toLocaleString('pt-PT').replace(/ /g, '.')})</small>` : '<small>Novo</small>'}</span><span class="ls">${I.play} ${nAulas(c.aulas)}</span></div>
      <div class="price">${c.preco_kz ? `<b>${kz(c.preco_kz)}</b>${c.preco_anterior_kz > c.preco_kz ? `<s>${kz(c.preco_anterior_kz)}</s>` : ''}` : '<b class="free">Grátis</b>'}</div>
    </div></a>`;
}
/* v18 — "Escolha o seu próximo passo": três caminhos prioritários (continuar / ao vivo / descobrir),
   com dados reais de inscrição, sala ao vivo e catálogo. Refs: desktop 16:9 e android 9:16. */
function nextStepHTML(cursos, live, cont) {
  const popular = [...cursos].sort((a, b) => b.alunos - a.alunos)[0];
  const room = live.find(r => r.estado === 'AO_VIVO') || live.find(r => r.estado !== 'ENCERRADA');
  const mm = room ? mentorDe(room.instrutor_id) : null;
  const disc = cursos.find(c => (!cont || c.id !== cont.id) && (!popular || c.id !== popular.id)) || cursos[cursos.length - 1];
  const stars = (c) => (c.rating ? `★ ${c.rating.toFixed(1).replace('.', ',')}` : 'Novo');
  const learnt = (c) => `${c.alunos.toLocaleString('pt-PT').replace(/ /g, '.')} a aprender`;

  const c1 = cont ? {
    ic: I.book, k: 'Continuar a aprender', t: cont.titulo,
    fig: `<figure class="ns-fig"><img src="media/${escAttr(courseArt(cont))}.jpg?v=70" alt="" loading="lazy" decoding="async"><span class="ns-tag ns-tag-p">O seu curso</span></figure>`,
    m: `<div class="ns-prog"><i><b style="width:${cont.pct}%"></b></i><span>${cont.pct}% · ${cont.concluidas} de ${cont.aulas} aulas concluídas</span></div>`,
    btn: `<a class="btn btn-p" href="#/aprender/${cont.id}">Continuar curso ${I.arrow}</a>`
  } : {
    ic: I.book, k: 'Comece por aqui', t: popular ? popular.titulo : 'Oratória e Comunicação',
    fig: `<figure class="ns-fig"><img src="media/${escAttr(courseArt(popular || cursos[0]))}.jpg?v=60" alt="" loading="lazy" decoding="async"><span class="ns-tag ns-tag-p">O mais procurado</span></figure>`,
    m: `<div class="ns-facts"><span>${stars(popular)}</span><span>${popular ? learnt(popular) : ''}</span><span>${nAulas(popular ? popular.aulas : 0)}</span></div>`,
    btn: `<a class="btn btn-p" href="#/curso/${popular ? popular.id : 1}">Ver o curso ${I.arrow}</a>`
  };

  const c2 = room ? {
    ic: I.video, k: 'Aprender ao vivo', t: room.titulo || room.curso || 'Aula ao vivo',
    fig: `<figure class="ns-fig ns-fig-live">${mm ? `<img src="media/${escAttr(mm.img)}.jpg?v=70" alt="" loading="lazy" decoding="async" onerror="this.style.display='none'">` : ''}<span class="ns-tag ${room.estado === 'AO_VIVO' ? 'ns-tag-live' : 'ns-tag-i'}">${room.estado === 'AO_VIVO' ? '● Ao vivo agora' : esc(fmtAgenda(room.agenda_em))}</span></figure>`,
    m: `<div class="ns-facts"><span>${esc(room.instrutor || '')}</span><span>${room.inscritos || 0} inscritos</span><span>${room.duracao_min || 60} min</span></div>`,
    btn: `<a class="btn btn-f" href="#/sala/${room.id}">${room.estado === 'AO_VIVO' ? 'Entrar na sala' : 'Reservar lugar'} ${I.arrow}</a>`
  } : {
    ic: I.video, k: 'Aprender ao vivo', t: 'Aulas ao vivo com mentores',
    fig: `<figure class="ns-fig ns-fig-live"><img src="media/mentor-1.jpg?v=70" alt="Instrutora AMA a conduzir uma aula ao vivo" loading="lazy" decoding="async"><span class="ns-tag ns-tag-i">Toda a semana</span></figure>`,
    m: `<div class="ns-facts"><span>Pergunte em direto</span><span>Fica gravada</span></div>`,
    btn: `<a class="btn btn-f" href="#/ao-vivo">Ver a agenda ${I.arrow}</a>`
  };

  const c3 = {
    ic: I.target, k: 'Descobrir um curso', t: disc ? disc.titulo : 'Explorar o catálogo',
    fig: `<figure class="ns-fig"><img src="media/${escAttr(courseArt(disc))}.jpg?v=70" alt="" loading="lazy" decoding="async"><span class="ns-tag ns-tag-n">${esc(disc ? disc.nivel : '')}</span></figure>`,
    m: `<div class="ns-facts"><span>${disc ? kz(disc.preco_kz) : 'Grátis'}</span><span>${nAulas(disc ? disc.aulas : 0)}</span><span>${stars(disc)}</span></div>`,
    btn: `<a class="btn btn-o" href="#/curso/${disc ? disc.id : 1}">Explorar ${I.arrow}</a>`
  };

  const cards = [c1, c2, c3];
  return `<section class="nextstep rv"><div class="ns-in">
    <div class="ns-head">
      <div class="ns-h">
        <h2 class="ns-title">Escolha o seu próximo passo<svg class="ns-rays" viewBox="0 0 44 44" aria-hidden="true"><path d="M22 4v9M8.5 9.5l6 6.5M35.5 9.5l-6 6.5M4 24h9M31 24h9"/></svg></h2>
        <p class="ns-sub">Aprenda no seu ritmo, com cursos práticos e mentores que conhecem o caminho.</p>
      </div>
      <a class="ns-all" href="#/catalogo">${I.book} Ver catálogo completo ${I.arrow}</a>
    </div>
    <div class="ns-grid">${cards.map((c, i) => `<article class="ns-card">
      <header class="ns-chd"><span class="ns-ic">${c.ic}</span><span class="ns-ck">${i + 1}. ${esc(c.k)}</span></header>
      ${c.fig}
      <b class="ns-t">${esc(c.t)}</b>
      ${c.m}
      ${c.btn}
    </article>`).join('')}</div>
  </div></section>`;
}
const DIAS_SEM = ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado'];
function fmtAgenda(s) {
  if (!s) return 'A definir';
  const d = new Date(String(s).replace(' ', 'T'));
  if (isNaN(d)) return String(s).slice(0, 16);
  return `${DIAS_SEM[d.getDay()]} · ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}
function liveRoomCard(r) {
  const badge = r.estado === 'AO_VIVO' ? '<span class="pill pill-r">● AO VIVO</span>' : `<span class="pill pill-i">${esc(fmtAgenda(r.agenda_em))}</span>`;
  return `<div class="list-row" style="border:1px solid var(--line);border-radius:2px;padding:14px 16px;margin-bottom:10px;background:#fff;cursor:pointer" onclick="go('/sala/${r.id}')">
    <span style="width:46px;height:46px;border-radius:14px;background:rgba(192,57,43,.1);color:var(--red);display:grid;place-items:center">${I.live}</span>
    <div class="t"><b>${esc(r.titulo)}</b><small>${esc(r.instrutor)} · ${r.participantes} confirmados · ${r.curso ? esc(r.curso) : 'Sessão aberta'}</small></div>
    ${badge}</div>`;
}

const CAT_ICON = { 'Todas': 'globe', 'Desenvolvimento Pessoal': 'users', 'Tecnologia': 'cog', 'Negócios': 'chart', 'Finanças': 'money' };
window.setCat = (c) => { S.filters.cat = c; go('/catalogo'); };
window.setNivel = (n) => { S.filters.nivel = n; go('/catalogo'); };
window.setSort = (v) => { S.filters.sort = v; go('/catalogo'); };
const SORTS = { pop: (a, b) => b.alunos - a.alunos, rating: (a, b) => b.rating - a.rating, new: (a, b) => b.id - a.id, price: (a, b) => a.preco_kz - b.preco_kz };

on('/catalogo', async ({ q }) => {
  if (q.q) S.filters.q = q.q;
  const { cursos, categorias, inscritos } = await api('/api/catalogo');
  S.catalogo = { inscritos };
  const counts = {};
  cursos.forEach(c => counts[c.categoria] = (counts[c.categoria] || 0) + 1);
  const q0 = S.filters.q.trim().toLowerCase();
  const filtered = q0 || S.filters.cat !== 'Todas' || S.filters.nivel !== 'Todos';
  const rows = cursos.filter(c =>
    (!q0 || (`${c.titulo} ${c.resumo} ${c.categoria}`).toLowerCase().includes(q0)) &&
    (S.filters.cat === 'Todas' || c.categoria === S.filters.cat) &&
    (S.filters.nivel === 'Todos' || c.nivel === S.filters.nivel));
  const top3 = [...cursos].sort((a, b) => b.alunos - a.alunos).slice(0, 3);
  const novidades = [...cursos].sort((a, b) => b.id - a.id).slice(0, 8);
  const rail = categorias.map(c => `<button class="rail-i ${S.filters.cat === c ? 'on' : ''}" onclick="setCat('${escAttr(c)}')">${navIcon(CAT_ICON[c] || 'book')}${esc(c)}<span class="n">${c === 'Todas' ? cursos.length : (counts[c] || 0)}</span></button>`).join('');
  const niveis = ['Todos', 'Iniciante', 'Intermédio', 'Todos os níveis'].map(n => `<span class="chip ${S.filters.nivel === n ? 'chip-f' : ''}" style="cursor:pointer" onclick="setNivel('${escAttr(n)}')">${esc(n)}</span>`).join('');
  rows.sort(SORTS[S.filters.sort] || SORTS.pop);
  const SORT_L = { pop: 'Mais populares', rating: 'Melhor avaliados', new: 'Mais recentes', price: 'Preço mais baixo' };
  const sortSel = `<div class="dd"><span class="dd-lbl">Ordenar</span>
    <button class="dd-btn" onclick="ddToggle(event)" aria-haspopup="listbox">${esc(SORT_L[S.filters.sort] || SORT_L.pop)} ${I.chev}</button>
    <div class="dd-menu" role="listbox">${Object.entries(SORT_L).map(([v, l]) => `<button role="option" aria-selected="${S.filters.sort === v}" class="dd-i ${S.filters.sort === v ? 'on' : ''}" onclick="setSort('${v}')">${esc(l)}${S.filters.sort === v ? I.check : ''}</button>`).join('')}</div>
  </div>`;
  const grid = rows.map(c => courseCardHTML(c)).join('') || `<div class="empty">${I.search}<h2>Nenhum curso encontrado</h2><p>Tente outra categoria ou termo de pesquisa.</p></div>`;
  const bn = CAT_BANNER[S.filters.cat];
  const head = bn
    ? `<div class="cat-banner rv"><img src="media/${bn}.jpg?v=70" alt="" decoding="async"><div class="cb-o"><h1>${esc(S.filters.cat)}</h1><p>${rows.length} cursos${q0 ? ` para “${esc(S.filters.q)}”` : ''} · nível: ${esc(S.filters.nivel)}</p></div></div>`
    : filtered
      ? `<div class="cat-head"><div><span class="eyebrow-pill">${I.book} CATÁLOGO DE CURSOS</span><h1>${q0 ? `Resultados para “${esc(S.filters.q)}”` : 'Cursos filtrados'}</h1>
        <p>${rows.length} cursos${q0 ? '' : ' · '} ${q0 ? '' : esc(S.filters.nivel)}</p></div></div>`
      : `<div class="cat-hero rv"><div class="ch-t">
          <span class="eyebrow-pill">${I.book} CATÁLOGO DE CURSOS</span>
          <h1>Explora cursos que fazem ${mark('diferença')}</h1>
          <p>Aprende ao teu ritmo com cursos práticos, mentoria e certificado. Investe em ti, transforma o teu futuro.</p>
          <div class="ch-stats"><b>${cursos.length}</b><span>cursos</span><i></i><b>${Object.keys(counts).length}</b><span>áreas</span><i></i><b>Kz</b><span>pagamento local</span></div>
        </div>
        <div class="ch-v"><img src="media/catalog-student-v2.jpg?v=70" alt="Estudante a explorar o catálogo da AMA" decoding="async">
          <svg class="rays" viewBox="0 0 44 44" aria-hidden="true"><path d="M22 4v9M8.5 9.5l6 6.5M35.5 9.5l-6 6.5M4 24h9M31 24h9"/></svg></div>
        </div>`;
  return shellPublic(`<div class="cat-layout">
    <aside class="cat-rail"><div class="rail-h">Categorias</div>${rail}</aside>
    <div class="cat-main">
      ${head}
      <div class="tag-row" style="margin:0 0 18px">${niveis}${sortSel}</div>
      ${filtered ? `<div class="grid g-3 rv">${grid}</div>` : `
      <div class="top-banner rv"><span style="width:54px;height:54px;border-radius:17px;background:var(--green);display:grid;place-items:center;color:#fff;flex:none;box-shadow:0 3px 0 var(--green-700)">${I.chart}</span>
        <div style="flex:1;min-width:200px"><h2>Top 3 para começar</h2><p>Uma seleção de partida com aulas escritas, resumos e ferramentas de estudo prontas a usar.</p></div></div>
      <h3 class="cat-sec-t">${I.users} Mais populares</h3>
      <div class="top-grid rv">${top3.map((c, i) => courseCardHTML(c, i + 1)).join('')}</div>
      <div class="car-head"><h3 class="cat-sec-t" style="margin:0">${I.spark} Novidades da academia</h3>
        <div class="car-nav"><button class="icon-btn car-b flip" onclick="carScroll(-1)" aria-label="Anteriores">${I.arrow}</button><button class="icon-btn car-b" onclick="carScroll(1)" aria-label="Seguintes">${I.arrow}</button></div></div>
      <div class="carousel rv">${novidades.map(c => courseCardHTML(c)).join('')}</div>
      <h3 class="cat-sec-t" style="margin-top:10px">${I.book} Todos os cursos</h3>
      <div class="grid g-3 rv">${grid}</div>
      <div class="know-band rv"><span class="kb-flame">${LOGO}</span>
        <div class="kb-t"><h2>Mais conhecimento, mais possibilidades.</h2>
          <div class="kb-items">
            <span>${I.globe} Aprende onde estiveres</span>
            <span>${I.cert} Certificado incluído</span>
            <span>${I.users} Apoio da nossa comunidade</span>
          </div></div>
        <svg class="kb-scribble" viewBox="0 0 120 48" aria-hidden="true"><path d="M6 30c10-18 18 14 28-4s18 14 28-4 18 14 28-4 14 10 18 4" pathLength="100"/></svg>
      </div>`}
    </div>
  </div>`, 'catalogo');
});

const REVIEW_POOL = [
  ['Lurdes Neto', 'O ritmo das aulas é certo e os exemplos são do nosso mercado. Refiz os exercícios duas vezes e saiu tudo a funcionar.'],
  ['Edson Kiala', 'Explicações claras, sem enrolação. O módulo final virou o meu portfólio e já me rendeu uma entrevista.'],
  ['Marta Cassoma', 'As aulas ao vivo de dúvidas valem o preço sozinhas. O professor responde mesmo, não fica só no gravado.'],
  ['Nelson Prata', 'Comecei do zero absoluto e consegui acompanhar. O Kuzaya AI ajuda a rever exatamente a aula onde fiquei preso.'],
  ['Isabel Kanda', 'Conteúdo direto ao ponto e bem organizado por módulos. Paguei por MULTICAIXA e comecei no mesmo minuto.'],
  ['Tiago Bumba', 'Bom equilíbrio entre teoria e prática. Os quizzes no fim de cada módulo ajudam a fixar antes de avançar.'],
];
function reviewsHTML(curso) {
  const r = curso.rating;
  let p5 = Math.round(56 + (r - 4.5) * 46), p4 = Math.round(27 + (4.6 - r) * 12), p3 = 9, p2 = 4, p1 = 3;
  p5 = Math.max(40, Math.min(88, p5)); const sum = p5 + p4 + p3 + p2 + p1; p4 += 100 - sum;
  const bars = [[5, p5], [4, p4], [3, p3], [2, p2], [1, p1]];
  const pick = (k) => REVIEW_POOL[(curso.id * 2 + k) % REVIEW_POOL.length];
  return `<h2 class="section-title">Avaliações de alunos</h2>
    <div class="rev-wrap rv"><div class="rev-score"><b>${r.toFixed(1).replace('.', ',')}</b><span class="q-stars">★★★★★</span><small>${curso.alunos.toLocaleString('pt-PT').replace(/ /g, '.')} avaliações</small></div>
      <div class="rev-bars">${bars.map(([s, p]) => `<div class="rb"><span>${s}★</span><span class="rbt"><i style="width:${Math.max(p, 2)}%"></i></span><em>${p}%</em></div>`).join('')}</div></div>
    <div class="grid g-2 rv">${[0, 1].map(k => { const [n, t] = pick(k); return `<figure class="quote"><div class="q-stars">${'★'.repeat(5 - k)}${'☆'.repeat(k)}</div><p>“${esc(t)}”</p><figcaption><span class="av" style="background:var(--green)">${esc(n.split(' ').map(w => w[0]).slice(0, 2).join(''))}</span><div><b>${esc(n)}</b><small>Aluno verificado</small></div></figcaption></figure>`; }).join('')}</div>`;
}

window.projectCourse = async (courseId) => {
  try {
    const { curso, seccoes } = await api('/api/cursos/' + courseId);
    const subjMap = { 'Matemática': 'matematica', 'Física': 'fisica', 'Tecnologia': 'programacao', 'Finanças': 'financas', 'Biologia': 'biologia', 'História': 'historia', 'Negócios': 'empreendedorismo' };
    const lessonsText = (seccoes || []).flatMap((s) => (s.aulas || []).map((a) => `${a.titulo}\n${a.resumo || ''}`)).join('\n\n');
    const fullText = `${curso.titulo}\n${curso.resumo || ''}\n\n${(curso.aprendizagens || []).join('. ')}\n\n${lessonsText}`;
    sessionStorage.setItem('ama-pj-prefill', JSON.stringify({
      title: curso.titulo,
      subject: subjMap[curso.categoria] || 'geral',
      sourceName: `Curso ${curso.titulo}`,
      text: fullText.slice(0, 6000),
    }));
    go('/projetor');
    toast('Curso enviado para o Projetor — clique em «Gerar slides» ou ajuste à vontade!');
  } catch { go('/projetor'); }
};

on('/curso/:id', async ({ args }) => {
  const { curso, seccoes, instrutor, inscrito, progresso, proximaAula } = await api('/api/cursos/' + args.id);
  const done = new Set(progresso.filter(p => p.concluido).map(p => p.lesson_id));
  const totalAulas = seccoes.reduce((a, s) => a + s.aulas.length, 0); const pctDone = Math.round(done.size / Math.max(totalAulas, 1) * 100);
  const m = mentorDe(instrutor.id);
  const heroTopic = courseArt(curso).replace(/^card-/, '').replace(/-v2$/, '');
  const heroMentor = (MENTORS.find((m) => m.curso == curso.id) || MENTORS[0]).img;
  const copy = copyDe(curso.id);
  const objImg = OBJ_ART[heroTopic];
  const objIcon = { oratoria: I.mic, python: I.code, emocional: I.heart, vendas: I.hand, marketing: I.speak, financas: I.chart, lideranca: I.users }[heroTopic] || I.mic;
  const fmtH = (h) => (h < 1 ? Math.round(h * 60) + ' min' : String(h).replace('.', ',').replace(/,0$/, '') + 'h');
  const learnIcons = ['mic', 'target', 'users', 'chat'];
  const lvlNote = { Iniciante: 'Comece do zero, sem pré-requisitos', Intermédio: 'Ideal para quem já tem noções básicas', 'Todos os níveis': 'Aberto a quem quiser evoluir' }[curso.nivel] || 'Conteúdo prático e direto';
  const testi = REVIEW_POOL[curso.id % REVIEW_POOL.length];
  const nAval = curso.alunos.toLocaleString('pt-PT').replace(/ /g, '.');
  return shellPublic(`<div class="detail-hero angola-bg">
  <div class="in">
    <nav class="crumbs"><a href="#/">${I.home}</a><span>/</span><a href="#/catalogo">Cursos</a><span>/</span><span class="cr-cur">${esc(curso.titulo)}</span></nav>
    <div class="dh-grid">
      <div class="dh-left">
        <span class="chip chip-lav cat-uppercase">${esc(curso.categoria)}</span>
        <h1>${esc(curso.titulo)}</h1>
        ${copy.promise ? `<p class="promise">${esc(copy.promise)}</p>` : ''}
        <p class="dh-desc">${esc(curso.resumo)}</p>
        <div class="rate-pill"><b>★ ${curso.rating.toFixed(1).replace('.', ',')} ★</b><span>(${nAval} avaliações)</span></div>
        <div class="cta-row">
          ${inscrito
            ? `<button class="btn btn-f btn-lg" onclick="go('/aprender/${curso.id}')">Continuar a aprender <span class="btn-arr">${I.arrow}</span></button>
               <button class="btn btn-prog btn-lg" onclick="projectCourse(${curso.id})">✦ Abrir em Slides 3D</button>`
            : `<button class="btn btn-f btn-lg" onclick="openCheckout(${curso.id})">Começar agora <span class="btn-arr">${I.arrow}</span></button>
               <button class="btn btn-prog btn-lg" onclick="projectCourse(${curso.id})">✦ Abrir em Slides 3D</button>`}
        </div>
      </div>
      <div class="dh-right">
        <div class="arch-stack">
          <div class="arch-back" aria-hidden="true"></div>
          <div class="arch-ring" aria-hidden="true"></div>
          <div class="arch-photo"><img src="media/${heroMentor}.jpg?v=70" alt="${escAttr(instrutor.nome)} a apresentar a aula" decoding="async"></div>
          <div class="cover-card">
            <span class="cc-head">${I.brand}<b>AMA<i>Academy</i></b></span>
            <h4 class="cc-title">${esc(curso.titulo)}</h4>
            <div class="cc-art"><i class="cc-crescent" aria-hidden="true"></i><span class="cc-bubble">${objImg ? `<img src="media/${objImg}.jpg?v=70" alt="" decoding="async">` : objIcon}</span><i class="cc-bubble2" aria-hidden="true"></i></div>
            <span class="cc-foot"><em>${esc(copy.promise || curso.aprendizagens[0])}</em><i class="cc-bar" aria-hidden="true"></i></span>
          </div>
        </div>
      </div>
    </div>
  </div>
  <div class="info-strip"><div class="is-in">
    <span><i class="is-ic">${I.play}</i><div><b>${nAulas(totalAulas)}</b><small>Conteúdo prático e direto ao ponto</small></div></span>
    <span><i class="is-ic">${I.clock}</i><div><b>${fmtH(curso.duracaoH)}</b><small>Carga horária total do curso</small></div></span>
    <span><i class="is-ic">${I.level}</i><div><b>${esc(curso.nivel)}</b><small>${lvlNote}</small></div></span>
    <span><i class="is-ic">${I.cert}</i><div><b>Certificado</b><small>Receba o seu certificado de conclusão</small></div></span>
  </div></div></div>
  <div class="detail-body">
    <div class="db-left">
      <div class="learn-card rv">
        <h2 class="section-title" style="margin-top:0">O que vai aprender</h2>
        <div class="learn-list">${curso.aprendizagens.map((a, i) => `<div class="learn-row"><span class="li">${I[learnIcons[i % learnIcons.length]]}</span><div class="lr-t"><b>${esc(a)}</b>${copy.learn[i] ? `<p>${esc(copy.learn[i])}</p>` : ''}</div></div>`).join('')}</div>
        <button class="see-all" style="margin-top:14px" onclick="document.getElementById('programa').scrollIntoView({behavior:'smooth'})">Ver programa completo ${I.arrow}</button>
      </div>
      <h2 class="section-title" id="programa">Conteúdo do curso</h2>
      <p class="muted" style="font-size:13.5px;margin-bottom:14px">${seccoes.length} módulos · ${nAulas(totalAulas)} · ${fmtH(curso.duracaoH)}</p>
      ${seccoes.map((s, i) => `<div class="acc ${i === 0 ? 'open' : ''}"><div class="acc-h"><span>${esc(s.titulo)}</span><span class="muted" style="font-weight:400;font-size:13px">${nAulas(s.aulas.length)}</span></div>
        <div class="acc-b">${s.aulas.map(a => `<div class="lesson-row ${done.has(a.id) ? 'done' : ''}" onclick="playLesson(${curso.id},${a.id},${a.livre},${inscrito})">
          <span class="ic">${done.has(a.id) ? I.check : (a.tipo === 'quiz' ? I.quiz : (a.livre ? I.play : I.lock))}</span>
          <span>${esc(a.titulo)}</span>${a.livre ? '<span class="free">GRÁTIS</span>' : ''}<span class="dur">${durMin(a.dur_seg)}</span></div>`).join('')}</div></div>`).join('')}
      <h2 class="section-title">Requisitos</h2><ul class="req-list">${curso.requisitos.map(r => `<li>${esc(r)}</li>`).join('')}</ul>
      ${reviewsHTML(curso)}
      <div class="trust-4 rv">
        <span>${I.shield}<b>Compra segura</b><small>MULTICAIXA e Unitel Money</small></span>
        <span>${I.check}<b>7 dias de garantia</b><small>reembolso total</small></span>
        <span>${I.globe}<b>Acesso em qualquer lugar</b><small>telemóvel, tablet, PC</small></span>
        <span>${I.chat}<b>Suporte dedicado</b><small>mentores e tutores</small></span>
      </div>
    </div>
    <aside class="db-right">
      <div class="buy-card">
        ${inscrito
          ? `<span class="chip chip-g">✓ Matriculado · ${pctDone}% concluído</span><div class="prog-bar" style="margin:12px 0 14px"><i style="width:${pctDone}%"></i></div><button class="btn btn-p btn-lg" style="width:100%;justify-content:center" onclick="go('/aprender/${curso.id}')">Entrar no player</button>`
          : `<div class="bc-price"><b>${kz(curso.preco_kz)}</b><s>${kz(curso.preco_anterior_kz)}</s></div>
             <p class="bc-inst">ou <b>${kz(Math.round(curso.preco_kz / 3))}</b> × 3 com MULTICAIXA</p>
             <button class="btn btn-f btn-lg" style="width:100%;justify-content:center" onclick="openCheckout(${curso.id})">Comprar curso</button>
             <button class="btn btn-o" style="width:100%;margin-top:10px" onclick="go('/aprender/${curso.id}/${(seccoes[0].aulas.find(a=>a.livre)||{}).id||''}')">${I.play} Assistir aula grátis</button>`}
        <ul class="bc-perks"><li>✓ Acesso vitalício + certificado</li><li>✓ Aulas ao vivo com o professor</li><li>✓ Kuzaya AI incluído</li><li>✓ Pagamento em Kz · garantia 7 dias</li></ul>
      </div>
      <div class="instrutor-panel rv">
        <span class="ip-eyebrow">SEU INSTRUTOR</span>
        <h3>${esc(instrutor.nome)}</h3>
        <p class="ip-role">${esc(m.role)}</p>
        <div class="ip-rows">
          <span>${I.users}<b>${curso.alunos.toLocaleString('pt-PT').replace(/ /g, '.')}</b> alunos</span>
          <span>${I.star}<b>${curso.rating.toFixed(1).replace('.', ',')}</b> avaliação média</span>
          <span>${I.grad}<b>${fmtH(curso.duracaoH)}</b> de conteúdo</span>
        </div>
        <a class="see-all" href="#/mentor/${instrutor.id}">Ver perfil do mentor ${I.arrow}</a>
        <img class="ip-face" src="media/${m.img}.jpg?v=70" alt="" loading="lazy" decoding="async">
      </div>
      <div class="testi-card rv">
        <div class="tc-main"><span class="tc-q">&ldquo;&rdquo;</span>
          <p>“${esc(testi[1])}”</p>
          <small>— ${esc(testi[0])}, aluno verificado</small>
        </div>
        <div class="tc-side"><b>${curso.rating.toFixed(1).replace('.', ',')}<span class="q-stars">★</span></b><span class="tc-stars">★★★★★</span><small>(${nAval} avaliações)</small></div>
      </div>
    </aside>
  </div>`, 'catalogo');
});
window.playLesson = (cid, aid, livre, inscrito) => { if (livre || inscrito) go(`/aprender/${cid}/${aid}`); else toast('Matricule-se para aceder a esta aula.'); };

/* ================================ mentor ================================== */
const CHIP_ICONS = [I.target, I.doc, I.level];
on('/mentor/:id', async ({ args }) => {
  const m = mentorDe(args.id);
  const { cursos } = await api('/api/catalogo');
  let meus = cursos.filter(c => String(c.instrutor_id) === String(args.id));
  if (!meus.length) meus = cursos.filter(c => c.id === m.curso);
  const alunos = meus.reduce((a, c) => a + c.alunos, 0);
  const rated = meus.filter(c => c.rating > 0);
  const rating = rated.length ? rated.reduce((a, c) => a + c.rating, 0) / rated.length : 4.8;
  return shellPublic(`<div class="mp-page">
  <div class="mp-in">
    <div class="mp-grid">
      <div class="mp-left rv">
        <h1>Mentores com<br><span class="mp-o">prática real</span></h1>
        <span class="mp-dash"></span>
        <p class="mp-sub">Aprenda com quem vive o que ensina e transforma conhecimento em <b>impacto</b> todos os dias.</p>
        <img class="mp-art" src="media/community.svg?v=6" alt="Comunidade AMA" decoding="async">
        <div class="mp-comm"><span class="mp-comm-ic">${I.users}</span><p>Uma comunidade que aprende, apoia e cresce <b>junta.</b></p></div>
      </div>
      <div class="mp-right rv">
        <div class="mp-frame"><i class="ring r1" aria-hidden="true"></i><i class="ring r2" aria-hidden="true"></i>
          <img src="media/${m.img}.jpg?v=70" alt="${escAttr(m.nome)}" decoding="async"></div>
        <div class="mp-card">
          <h2>${esc(m.nome)}</h2>
          <p class="mp-role">${esc(m.role)}</p><span class="mp-dash o"></span>
          <div class="mp-chips">${m.tags.map((t, i) => `<span>${CHIP_ICONS[i % 3]}${esc(t)}</span>`).join('')}</div>
          <div class="mp-stats"><div><b>${alunos.toLocaleString('pt-PT').replace(/ /g, '.')}</b><span>alunos</span></div>
            <div><b>${rating.toFixed(1).replace('.', ',')}★</b><span>avaliação</span></div>
            <div><b>${meus.length}</b><span>curso${meus.length === 1 ? '' : 's'}</span></div></div>
        </div>
        <button class="btn mp-pill" onclick="document.getElementById('mp-cursos').scrollIntoView({behavior:'smooth'})"><span class="arw">${I.arrow}</span> Ver cursos</button>
      </div>
    </div>
    <p class="mp-bio">${esc(m.bio)}</p>
    <h2 class="section-title" id="mp-cursos" style="color:#fff">Cursos de ${esc(m.nome)}</h2>
    <div class="grid g-3 mp-cursos">${meus.map(courseCardHTML).join('') || '<p class="muted">Sem cursos publicados.</p>'}</div>
  </div></div>`, 'cursos');
});

/* ================================ auth =================================== */
function viewEntrar(needed) {
  return `<div class="auth">
    <div class="art angola-bg">${brandArtMarkup()}
      <div><p class="q">${isCeuSite() ? '"Conhecimento claro, acessível e ligado à universidade."' : '"Grandes sonhos exigem grandes aprendizados."'}</p><h2 style="margin-top:18px;font-size:28px">Bem-vindo de volta. O seu ${mark('próximo módulo')} está à espera.</h2></div>
      <div class="flex" style="gap:20px;font-size:13px;color:#b8d7f5"><span>${isCeuSite() ? '+10.000 estudantes' : '24.532 estudantes'}</span><span>·</span><span>Luanda, Angola</span></div></div>
    <div class="form">
      <div class="auth-top-m">${brandLogoMarkup()}
        <a class="auth-back-m" href="${isCeuSite() ? '#/ceu-inicio' : '#/'}">${I.arrow} Voltar ao início</a></div>
      <div class="box">
      ${needed ? '<div class="err">Precisa de entrar na sua conta para aceder a esta área.</div>' : ''}
      <h1>Entrar</h1><p>Use o seu email de estudante, professor ou administrador.</p>
      <div id="login-err"></div>
      <div class="field"><label>Email</label><input id="l-email" type="email" placeholder="voce@exemplo.ao" autocomplete="username"></div>
      <div class="field"><label>Palavra-passe</label><input id="l-senha" type="password" placeholder="••••••••" autocomplete="current-password" onkeydown="if(event.key==='Enter')doLogin()"></div>
      <button class="btn btn-p btn-lg" style="width:100%;justify-content:center" onclick="doLogin()">Entrar ${I.arrow}</button>
      <div class="demo-creds" style="margin-top:14px">
        <b>Acesso rápido MVP (1 clique)</b>
        <div class="flex wrap" style="gap:8px;margin-top:8px">
          <button type="button" class="btn btn-o btn-sm" onclick="doQuickMvpLogin('INSTRUCTOR')">Docente Demo</button>
          <button type="button" class="btn btn-o btn-sm" onclick="doQuickMvpLogin('STUDENT')">Estudante Demo</button>
        </div>
      </div>
      <p class="muted" style="text-align:center;font-size:14px;margin-top:16px">Ainda sem conta? <a href="#/registo" style="color:var(--green);font-weight:600">Criar conta grátis</a></p>
    </div></div></div>`;
}
window.doLogin = async () => {
  try { const { user } = await api('/api/auth/login', { method: 'POST', body: { email: $('#l-email').value, senha: $('#l-senha').value } });
    S.user = user; notifLogin(); toast(`Bem-vindo, ${user.handle}!`); go('/' + homePath());
  } catch (e) { $('#login-err').innerHTML = `<div class="err">${esc(e.message)}</div>`; }
};
window.doQuickMvpLogin = async (papel = 'STUDENT') => {
  const isDoc = papel === 'INSTRUCTOR';
  const email = isDoc ? 'docente.demo@ceu.ao' : 'estudante.demo@ceu.ao';
  const nome = isDoc ? 'Prof.ª Ana Silva' : 'João Mateus';
  const senha = isDoc ? 'ceu-docente-2026' : 'ceu-estudante-2026';
  try {
    try { await api('/api/auth/registo', { method: 'POST', body: { nome, email, senha } }); } catch { }
    const { user } = await api('/api/auth/login', { method: 'POST', body: { email, senha } });
    if (isDoc && user.papel === 'STUDENT') {
      try {
        const raw = JSON.parse(localStorage.getItem('ama-v1-db') || '{}');
        const found = (raw.usuarios || []).find((u) => u.email === email);
        if (found) { found.papel = 'INSTRUCTOR'; localStorage.setItem('ama-v1-db', JSON.stringify(raw)); user.papel = 'INSTRUCTOR'; }
      } catch { }
    }
    if (window.Study && window.Study.MvpDB) {
      window.Study.MvpDB.saveStudentCard({ id: `card-${user.id}`, nome: user.nome, universidade: 'Universidade de Luanda', curso: isDoc ? 'Docência & Engenharia' : 'Engenharia Informática' }).catch(() => {});
    }
    S.user = user; notifLogin(); toast(`Sessão MVP iniciada: ${user.nome}`); go('/' + homePath());
  } catch (e) { $('#login-err').innerHTML = `<div class="err">${esc(e.message)}</div>`; }
};
on('/entrar', async () => { if (S.user) go('/' + homePath()); return viewEntrar(); });

on('/registo', async () => { if (S.user) go('/' + homePath()); return `<div class="auth">
  <div class="art angola-bg">${brandArtMarkup()}
    <div><h2 style="color:#fff;font-size:30px">Crie a sua conta.<br>${isCeuSite() ? 'Estude e crie slides com ' + mark('IA e 3D') + '.' : 'O primeiro curso é ' + mark('oferta') + '.'}</h2>
      <ul style="margin-top:20px;list-style:none;font-size:14.5px;color:#d6e9ff;display:flex;flex-direction:column;gap:10px">
        ${isCeuSite()
          ? '<li>✓ Projetor PDF → Slides com IA e 3D</li><li>✓ Cursos universitários gratuitos</li><li>✓ Cartão digital de estudante CEU</li><li>✓ Progresso guardado na base de dados</li>'
          : '<li>✓ Curso de Inteligência Emocional grátis 7 dias</li><li>✓ Acesso a aulas ao vivo semanais</li><li>✓ Kuzaya AI disponível 24/7</li><li>✓ Pague em Kz com MULTICAIXA Express</li>'}</ul></div>
    <span class="muted" style="color:#b8d7f5;font-size:12.5px">Gratuito para começar. Dados seguros.</span></div>
  <div class="form">
    <div class="auth-top-m">${brandLogoMarkup()}
      <a class="auth-back-m" href="${isCeuSite() ? '#/ceu-inicio' : '#/'}">${I.arrow} Voltar ao início</a></div>
    <div class="box"><h1>Criar conta</h1><p>Leva menos de um minuto. A primeira conta deste dispositivo torna-se administradora da escola; as seguintes entram como alunos.</p>
    <div id="reg-err"></div>
    <div class="field"><label>Nome completo</label><input id="r-nome" placeholder="Ex.: Maria dos Santos"></div>
    <div class="field"><label>Email</label><input id="r-email" type="email" placeholder="voce@exemplo.ao"></div>
    <div class="field"><label>Palavra-passe</label><input id="r-senha" type="password" placeholder="mínimo 6 caracteres"></div>
    <label class="flex" style="font-size:13px;color:var(--muted);margin-bottom:16px"><input type="checkbox" id="r-termos" style="width:auto" checked> Aceito os termos e a política de privacidade</label>
    <button class="btn btn-f btn-lg" style="width:100%;justify-content:center" onclick="doRegisto()">Criar conta e ganhar curso grátis</button>
    <p class="muted" style="text-align:center;font-size:14px;margin-top:16px">Já tem conta? <a href="#/entrar" style="color:var(--green);font-weight:600">Entrar</a></p>
  </div></div></div>`; });
window.doRegisto = async () => {
  try { await api('/api/auth/registo', { method: 'POST', body: { nome: $('#r-nome').value, email: $('#r-email').value, senha: $('#r-senha').value } });
    const { user } = await api('/api/auth/login', { method: 'POST', body: { email: $('#r-email').value, senha: $('#r-senha').value } });
    S.user = user; notifLogin(); toast('Conta criada! Inteligência Emocional é oferta de boas-vindas.'); go('/aluno');
  } catch (e) { $('#reg-err').innerHTML = `<div class="err">${esc(e.message)}</div>`; }
};

/* ============================== onboarding ================================ */
on('/boas-vindas', async () => {
  const steps = [
    [I.book, 'ic-v', 'Escolha o seu curso', 'Explore o catálogo por categoria, nível e preço — tudo em kwanzas, com pagamento MULTICAIXA Express e Unitel Money.'],
    [I.play, 'ic-f', 'Aprenda no seu ritmo', 'Vídeo com transcrição, progresso guardado automaticamente e notas por aula. Continue de onde parou em qualquer dispositivo.'],
    [I.spark, 'ic-t', 'Pergunte ao Kuzaya AI', 'O Kuzaya AI responde com base apenas nas aulas dos seus cursos e cita sempre a aula de origem. Disponível 24/7.'],
    [I.live, 'ic-b', 'Viva a aula ao vivo', 'Todas as semanas os mentores abrem salas ao vivo: pergunte, participe e a aula fica gravada no seu curso.'],
    [I.cert, 'ic-g', 'Receba o certificado', 'Ao concluir 100% das aulas, o certificado verificável é emitido automaticamente com código de validação.'],
  ];
  return `<div class="ob">
    <header class="ob-top"><a class="brand" href="#/" title="AMA · Aristides Miguel Academy" aria-label="Ir para a página inicial"><span class="logo-chip">${LOGO}</span><div><b>AMA</b><span class="brand-sub">ARISTIDES MIGUEL</span></div></a>
      <a class="ob-skip" href="${S.user ? '#/' + homePath() : '#/catalogo'}">${S.user ? 'Ir para o painel' : 'Saltar introdução'} ${I.arrow}</a></header>
    <div class="ob-hero rv">
      <span class="chip chip-v ob-eyebrow">Bem-vindo à AMA · Aristides Miguel Academy</span>
      <h1>Aprender aqui é simples ${mark('de verdade')}.</h1>
      <p>Cinco passos entre onde está e onde quer chegar. Sem menus infinitos, sem letras pequenas.</p>
      <span class="ob-ray" aria-hidden="true"><svg viewBox="0 0 60 60"><g stroke="var(--flame-2)" stroke-width="4" stroke-linecap="round"><path d="M30 6v10M48 12l-7 7M54 30H44M12 12l7 7M6 30h10"/></g></svg></span>
    </div>
    <div class="ob-steps">
      ${steps.map(([ic, cls, t, p], i) => `<div class="ob-step rv" style="--d:${i * 70}ms">
        <span class="ob-n">0${i + 1}</span>
        <span class="ic ${cls} ob-ic">${ic}</span>
        <div class="ob-tx"><h3>${esc(t)}</h3><p>${esc(p)}</p></div>
      </div>`).join('')}
    </div>
    <div class="ob-cta rv">
      <div><h2>Pronto para o ${mark('primeiro passo')}?</h2>
        <p>${S.user ? 'O seu painel já está à espera — escolha uma aula e comece agora.' : 'Crie a sua conta em menos de um minuto e receba o primeiro curso de oferta.'}</p></div>
      <div class="ob-cta-btns">${S.user ? `<a class="btn btn-f btn-lg" href="#/${homePath()}">Abrir o meu painel ${I.arrow}</a>` : `<a class="btn btn-f btn-lg" href="#/registo">Criar conta grátis ${I.arrow}</a><a class="btn btn-o btn-lg" href="#/catalogo">Explorar catálogo</a>`}</div>
    </div>
    <footer class="ob-foot">Luanda, Angola · ola@ama.ao · <a href="#/catalogo">Catálogo</a> · <a href="#/ao-vivo">Aulas ao vivo</a></footer>
  </div>`;
});

/* =============================== biblioteca =============================== */
const BIB_LUV = 'Aristides Miguel Academy · Luanda, Angola\n\n';
const BIB_RESOURCES = [
  { ic: 'speak', cor: 'v', tipo: 'Guia · 2 páginas', titulo: 'Método PREP', desc: 'O esqueleto de 4 passos para falar em público sem enroscar — com exemplos de apresentações a investidores.', ficheiro: 'guia-metodo-prep.txt',
    texto: 'MÉTODO PREP — FALAR EM PÚBLICO SEM ENROSCAR\n\n1. PONTO — Diga a sua ideia em uma frase.\n2. RAZÃO — Explique porquê (1–2 razões).\n3. EXEMPLO — Conte uma história ou dê um número concreto.\n4. PONTO — Repita a frase inicial e peça a ação.\n\nExemplo (60 segundos):\n"Quero propor que a loja abra aos sábados. (P)\nO nosso tráfego de sábado é o dobro e hoje estamos fechados. (R)\nNa semana passada, 14 clientes voltaram sem comprar porque encontrámos a porta fechada. (E)\nPortanto: abrir aos sábados, a começar dia 4. (P)"\n\nDica: treine em voz alta 3 vezes antes de qualquer apresentação.\n'},
  { ic: 'fin', cor: 'f', tipo: 'Planilha · Kz', titulo: 'Orçamento 50/30/20', desc: 'Divida o salário do mês em necessidades, desejos e poupança — já com as faixas em kwanzas.', ficheiro: 'planilha-50-30-20.csv',
    texto: 'Rubrica,Percentagem,Exemplo com 150000 Kz\nNecessidades (renda, comida, transporte),50%,75000\nDesejos (saída, streaming, roupa),30%,45000\nPoupança / dívida,20%,30000\n\nRegra: pague a poupança no dia do salário, antes de gastar.\n' },
  { ic: 'check', cor: 't', tipo: 'Checklist', titulo: 'Funil de vendas digital', desc: 'Os 9 passos para transformar uma publicação em cliente — do primeiro contacto ao recibo em kwanza.', ficheiro: 'checklist-funil.txt',
    texto: 'CHECKLIST — FUNIL DE VENDAS DIGITAL\n\n[ ] 1. Defina UMA pessoa ideal (idade, bairro, profissão, dor)\n[ ] 2. Escreva o benefício principal em uma frase\n[ ] 3. Publique conteúdo que mostra o problema (topo)\n[ ] 4. Mostre prova: foto de antes/depois ou testemunho (meio)\n[ ] 5. tenha um catálogo simples (PDF ou WhatsApp Business)\n[ ] 6. Responda em menos de 1 hora\n[ ] 7. Envie o valor + MULTICAIXA/Unitel Money no primeiro dia\n[ ] 8. Peça avaliação 5 estrelas após a entrega\n[ ] 9. Reative quem não comprou após 7 dias\n' },
  { ic: 'heart', cor: 'p', tipo: 'Mapa imprimível', titulo: 'Mapa das emoções', desc: 'Ferramenta de registo emocional para usar antes de reuniões difíceis — nomear para acalmar.', ficheiro: 'mapa-das-emocoes.txt',
    texto: 'MAPA DAS EMOÇÕES — 5 MINUTOS ANTES DE UMA REUNIÃO DIFÍCIL\n\n1. O que sinto agora? (raiva / medo / vergonha / ansiedade / nada)\n2. Onde sinto no corpo? (peito, garganta, barriga, mãos)\n3. Que história estou a contar a mim mesmo?\n4. Qual seria a leitura mais generosa da outra pessoa?\n5. O que eu quero que fique desta conversa?\n\nNomear a emoção reduz a intensidade — é o passo que separa reagir de responder.\n' },
  { ic: 'chat', cor: 'f', tipo: 'Guião · WhatsApp', titulo: 'Guião de fecho no WhatsApp', desc: 'Modelo de resposta para quem pergunta "quanto custa?" e depois desaparece.', ficheiro: 'guiao-whatsapp.txt',
    texto: 'GUIÃO DE FECHO NO WHATSAPP\n\nCliente: "Quanto custa?"\nVocê: "Olá [nome]! O [produto] está [preço] com [inclusão]. Para eu indicar o valor certo, é para [uso A] ou [uso B]?"\n\n(espere a resposta — nunca mande preço sem qualificar)\n\nCliente hesita:\nVocê: "Sem problema. A maioria dos nossos clientes começou com [opção mais simples]. Se não resolver nas primeiras 2 semanas, devolvo o valor. Quer experimentar?"\n\nRegra de ouro: 1 pergunta por mensagem. Nunca três áudios seguidos.\n' },
  { ic: 'code', cor: 'v', tipo: 'Glossário · 30 termos', titulo: 'Python em miúdos', desc: 'Os 30 termos de programação que aparecem no curso — explicados em português corrente.', ficheiro: 'glossario-python.txt',
    texto: 'GLOSSÁRIO PYTHON EM MIÚDOS (amostra)\n\nvariável — caixa com nome onde guardamos um valor: idade = 25\nstring — texto entre aspas: "Olá, Angola"\nlista — fila de itens: precos = [1200, 3500]\ndicionário — etiqueta e valor: {"bairro": "Talatona"}\nfunção — bloco de código com nome que usamos quando quiser\ndef — palavra que cria uma função\nloop for — repetir para cada item da lista\nif/else — se acontecer isto, faz aquilo; senão, faz aquilo outro\nerro/exception — o programa avisa onde tropeçou, lê a última linha\nAPI — um balcão: você pede por um canal próprio e recebe\n\nCompleto no curso Python do Zero ao Avançado, aula 2.\n' },
];
window.dlBib = (r) => {
  const blob = new Blob([BIB_LUV + r.texto], { type: 'text/plain;charset=utf-8' });
  const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = r.ficheiro; a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 4000);
  toast(`A descarregar "${r.titulo}" (${r.ficheiro})`);
};
on('/biblioteca', async () => {
  const live = await api('/api/ao-vivo').catch(() => []);
  const replays = live.filter(r => r.estado === 'ENCERRADA');
  const agenda = live.filter(r => r.estado !== 'ENCERRADA').slice(0, 2);
  let meus = [];
  if (S.user) { try { meus = (await api('/api/aluno/painel')).cursos.filter(c => c.pct < 100).slice(0, 4); } catch (e) { meus = []; } }
  return shellPublic(`
  <section class="bib-hero angola-bg"><div class="in rv">
    <span class="hero-eyebrow">${I.library} Biblioteca da academia</span>
    <h1>Conhecimento que se leva ${mark('para casa')}.</h1>
    <p>Guias, planilhas e checklists que os mentores usam nas aulas — gratuitos, sem matrícula. E os replays de tudo o que já aconteceu ao vivo.</p>
  </div></section>
  <div class="bib-wrap"><div class="in">
    ${meus.length ? `<div class="sec-head"><div><span class="eyebrow-t">${I.play} RETOMAR</span><h2 class="section-title" style="margin:6px 0 0">Continue onde parou</h2></div>
      <a class="see-all" href="#/aluno">Meu painel ${I.arrow}</a></div>
    <div class="bib-resume rv">${meus.map(c => `<button class="bib-rs" onclick="go('/aprender/${c.id}')">
      <img src="media/${escAttr(courseArt(c))}.jpg?v=70" alt="" loading="lazy">
      <div><b>${esc(c.titulo)}</b><div class="bar"><i style="width:${c.pct}%"></i></div><small>${c.pct}% concluído · ${c.concluidas} aulas feitas</small></div>
      <span class="bib-go">${I.play}</span></button>`).join('')}</div>` : ''}
    <div class="sec-head rv" style="margin-top:38px"><div><span class="eyebrow-t">${I.doc} MATERIAIS</span><h2 class="section-title" style="margin:6px 0 0">Guias e modelos dos mentores</h2></div>
      <span class="bib-note">Descarregue e use hoje — sem conta</span></div>
    <div class="grid g-3 rv" style="margin-top:18px">${BIB_RESOURCES.map(r => `<div class="card bib-card">
      <div class="bib-top"><span class="ic ic-${r.cor} bib-ic">${I[r.ic]}</span><small class="muted">${esc(r.tipo)}</small></div>
      <h3>${esc(r.titulo)}</h3><p>${esc(r.desc)}</p>
      <button class="btn btn-o btn-sm bib-dl" onclick="dlBib(BIB_RESOURCES[${BIB_RESOURCES.indexOf(r)}])">Descarregar ${I.arrow}</button>
    </div>`).join('')}</div>
    <div class="sec-head rv" style="margin-top:46px"><div><span class="eyebrow-t">${I.live} AULAS GRAVADAS</span><h2 class="section-title" style="margin:6px 0 0">Tudo o que já aconteceu ao vivo</h2></div>
      <a class="see-all" href="#/ao-vivo">Agenda completa ${I.arrow}</a></div>
    ${replays.length ? `<div class="rv" style="margin-top:14px">${replays.map(r => `<div class="list-row bib-replay" onclick="go('/sala/${r.id}')">
      <span class="bib-play">${I.play}</span>
      <div class="t"><b>${esc(r.titulo)}</b><small>${esc(r.instrutor)} · ${r.participantes} participaram${r.duracao_min ? ' · ' + r.duracao_min + ' min' : ''}${r.curso ? ' · ' + esc(r.curso) : ''}</small></div>
      <span class="pill pill-v">Replay ${I.arrow}</span></div>`).join('')}</div>`
      : '<p class="muted rv" style="margin-top:14px">Ainda sem replays — a primeira aula ao vivo encerrada aparece aqui automaticamente. <a href="#/ao-vivo">Ver agenda</a></p>'}
    ${agenda.length ? `<div class="bib-upnext rv"><span>${I.calendar}<b>Próxima aula ao vivo:</b> ${esc(agenda[0].titulo)} · ${esc(fmtAgenda(agenda[0].agenda_em))}</span><a class="btn btn-f btn-sm" href="#/sala/${agenda[0].id}">Reservar lugar</a></div>` : ''}
  </div></div>`, 'biblioteca');
});

/* ================================ checkout ================================ */
window.openCheckout = async (cursoId) => {
  if (!S.user) return go('/entrar');
  const { curso } = await api('/api/cursos/' + cursoId);
  $('#overlay')?.remove();
  const ov = document.createElement('div'); ov.className = 'overlay'; ov.id = 'overlay';
  ov.innerHTML = `<div class="modal"><div class="mh"><h3>Matrícula · simulação local</h3><button class="icon-btn" onclick="document.getElementById('overlay').remove()">✕</button></div>
  <div class="mb" id="ck-body">
    <div class="flex" style="justify-content:space-between;margin-bottom:6px"><span>${esc(curso.titulo)}</span><b>${kz(curso.preco_anterior_kz || curso.preco_kz)}</b></div>
    <div class="flex" style="justify-content:space-between;color:var(--green);font-size:13.5px"><span>Desconto lançamento</span><span>−${kz(curso.preco_anterior_kz - curso.preco_kz)}</span></div>
    <div class="flex" style="justify-content:space-between;border-top:1px dashed var(--line);margin-top:12px;padding-top:12px"><b>Total</b><b style="font-family:var(--font-d);font-size:20px">${kz(curso.preco_kz)}</b></div>
    <div class="field" style="margin-top:16px"><label>Cupão (opcional)</label><input id="ck-coupon" placeholder="BEMVINDO10"></div>
    <div class="field"><label>Método de pagamento</label>
      <select id="ck-metodo"><option value="MULTICAIXA">MULTICAIXA Express (referência)</option><option value="UNITEL">Unitel Money</option></select></div>
    <button class="btn btn-p btn-lg" style="width:100%;justify-content:center" onclick="ckGenerate(${curso.id},${curso.preco_kz})">Gerar referência ${I.arrow}</button>
    <p class="muted" style="font-size:11.5px;text-align:center;margin-top:10px">${I.lock} Modo local: nenhum valor real é movido. A matrícula e o progresso ficam guardados neste navegador.</p>
  </div></div>`;
  document.body.appendChild(ov);
  ov.onclick = (e) => { if (e.target === ov) ov.remove(); };
};
window.ckGenerate = async (cursoId, preco) => {
  const coupon = $('#ck-coupon').value.trim();
  try {
    const o = await api('/api/checkout', { method: 'POST', body: { cursoId, metodo: $('#ck-metodo').value, coupon: coupon || undefined } });
    $('#ck-body').innerHTML = `
      <div class="ref-box"><small class="muted">Entidade / Referência</small><div class="ref">${esc(o.referencia)}</div><small class="muted">${esc(o.instrucoes)}</small></div>
      <div class="pay-steps" id="steps">
        <div class="pay-step on" data-i="0"><span class="n">1</span> Referência gerada com sucesso</div>
        <div class="pay-step" data-i="1"><span class="n">2</span> A aguardar pagamento no ${o.metodo === 'UNITEL' ? 'Unitel Money' : 'MULTICAIXA App'}…</div>
        <div class="pay-step" data-i="2"><span class="n">3</span> Confirmação simulada neste dispositivo</div>
        <div class="pay-step" data-i="3"><span class="n">4</span> Matrícula e acesso imediato</div>
      </div>
      <button class="btn btn-f btn-lg" id="paybtn" style="width:100%;justify-content:center;margin-top:18px" onclick="ckPay(${o.encomendaId},${cursoId})">Simular pagamento</button>
      <p class="muted" style="font-size:11.5px;text-align:center;margin-top:8px">Simulação: o botão marca a encomenda como paga localmente, sem contactar nenhum gateway.</p>`;
  } catch (e) { toast(e.message); }
};
window.ckPay = async (oid, cid) => {
  $('#paybtn').disabled = true;
  const step = (i, done) => { const s = $(`.pay-step[data-i="${i}"]`); if (!s) return; s.classList.toggle('done', done); s.classList.toggle('on', !done); };
  step(1, false); $('#steps .pay-step[data-i="1"] .n').innerHTML = '…';
  await new Promise(r => setTimeout(r, 900)); step(1, true); step(2, false);
  try { await api('/api/pagamentos/simular', { method: 'POST', body: { encomendaId: oid } }); } catch (e) { toast(e.message); }
  await new Promise(r => setTimeout(r, 700)); step(2, true); step(3, true);
  $('#ck-body').insertAdjacentHTML('beforeend', `<div class="ok" style="margin-top:14px">✓ Pagamento confirmado! Matriculado em <b>${esc((await api('/api/cursos/' + cid)).curso.titulo)}</b>.</div>`);
  const { user } = await api('/api/me'); S.user = user;
  setTimeout(() => { $('#overlay')?.remove(); render(); }, 1600);
};

/* ================================ aluno ================================== */
on('/aluno', async () => {
  const d = await api('/api/aluno/painel');
  const live = (await api('/api/ao-vivo').catch(() => [])).filter(r => r.estado !== 'ENCERRADA');
  const certs = await api('/api/certificados').catch(() => []);
  const cur = d.cursos[0];
  const next = live[0];
  const mm = next ? mentorDe(next.instrutor_id) : null;
  return panelShell('aluno', `
    <div class="page-h"><div><h1>Olá, ${esc(S.user.handle)} 👋</h1><p>Continue a aprender e a alcançar os seus objetivos.</p></div>
      <a class="btn btn-p" href="#/catalogo">${I.plus} Explorar novos cursos</a></div>
    <div class="grid g-3 dash-feat">
      <div class="card feat">
        <h3>Continuar a aprender</h3>
        ${cur ? `<div class="feat-cont"><img src="media/${escAttr(courseArt(cur))}.jpg?v=70" alt="">
          <div><b>${esc(cur.titulo)}</b><small>${cur.concluidas}/${cur.aulas} aulas concluídas</small>
            <div class="prog-bar" style="margin-top:8px"><i style="width:${cur.pct}%"></i></div><small class="pct">${cur.pct}%</small></div></div>
          <button class="btn btn-f feat-pill" onclick="go('/aprender/${cur.id}')">${I.play} Continuar curso</button>
          <a class="see-all" href="#/curso/${cur.id}">Ver curso ${I.arrow}</a>`
        : `<p class="feat-empty">Ainda sem cursos ativos. Escolha um e o progresso passa a guardar-se neste navegador.</p>
          <ol class="feat-start">
            <li><a href="#/catalogo"><span>1</span><b>Escolha um curso</b><small>Programa, mentor e aulas antes de começar.</small></a></li>
            <li><a href="#/estudar"><span>2</span><b>Estude a sua matéria</b><small>Cole o texto e gere resumos, cartões e quiz.</small></a></li>
            <li><a href="#/revisao"><span>3</span><b>Revise por repetição</b><small>Os cartões voltam na altura certa.</small></a></li>
          </ol><a class="see-all" href="#/boas-vindas">Ver a oferta de boas-vindas ${I.arrow}</a>`}
      </div>
      <div class="card feat">
        <h3>O meu progresso</h3>
        <div class="feat-donut"><svg viewBox="0 0 120 120"><circle cx="60" cy="60" r="50" fill="none" stroke="var(--line)" stroke-width="13"/><circle class="fd-ring" cx="60" cy="60" r="50" fill="none" stroke="url(#pg)" stroke-width="13" stroke-linecap="round" stroke-dasharray="${d.progressoGlobal * 3.14} 400" transform="rotate(-90 60 60)"/><defs><linearGradient id="pg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#10b981"/><stop offset="1" stop-color="#0e7490"/></linearGradient></defs></svg>
          <div><b>${d.progressoGlobal}%</b><small>concluído</small></div></div>
        <ul class="feat-stats">
          <li>${I.chev}<span>Cursos em progresso</span><b>${d.stats.cursos}</b></li>
          <li>${I.chev}<span>Aulas concluídas</span><b>${d.stats.aulasConcluidas}</b></li>
          <li>${I.chev}<span>Horas de estudo</span><b>${d.stats.horas}h</b></li>
          <li>${I.chev}<span>Certificados</span><b>${d.stats.certificados}</b></li>
        </ul>
        <a class="see-all" href="#/certificados">Ver detalhes ${I.arrow}</a>
      </div>
      <div class="card feat">
        <h3>Próxima aula ao vivo <span class="chip chip-g">Ao vivo</span></h3>
        ${next ? `<b class="feat-titulo">${esc(next.titulo)}</b>
          <p class="feat-mentor"><img src="media/${mm.img}.jpg?v=70" alt="" onerror="this.remove()">${esc(next.instrutor)}</p>
          <p class="feat-quando">${I.calendar} ${esc(fmtAgenda(next.estado === 'AO_VIVO' ? new Date().toISOString() : next.agenda_em))}</p>
          ${mm ? `<img class="feat-face" src="media/${mm.img}.jpg?v=70" alt="" loading="lazy">` : ''}
          <button class="btn btn-o feat-enter" onclick="go('/sala/${next.id}')">Entrar na sala</button>
          <a class="see-all" href="#/ao-vivo">Ver todas as aulas ao vivo ${I.arrow}</a>`
        : '<p class="muted" style="font-size:14px">Sem salas agendadas — veja a agenda da semana.</p><a class="see-all" href="#/ao-vivo">Ver agenda ${I.arrow}</a>'}
      </div>
    </div>
    <div class="grid dash-duo" style="gap:22px;margin-top:22px">
      <div class="card">
        <h3>Cursos inscritos <a href="#/catalogo">Ver todos</a></h3>
        <div class="enr-strip">
          ${d.cursos.slice(0, 3).map(c => `<div class="enr" onclick="go('/curso/${c.id}')"><img src="media/${escAttr(courseArt(c))}.jpg?v=70" alt="">
            <b>${esc(c.titulo)}</b><div class="prog-bar"><i style="width:${c.pct}%"></i></div><small>${c.pct}%</small></div>`).join('')}
          <div class="enr more" onclick="go('/catalogo')"><span>${I.plus}</span><b>Explorar mais cursos</b></div>
        </div>
        <h3 style="margin-top:22px">Recomendados para si</h3>
        <div class="grid g-2">${d.recomendados.slice(0, 2).map(courseCardHTML).join('')}</div>
      </div>
      <div>
        <div class="card"><h3>Certificados <a href="#/certificados">Ver todos</a></h3><div class="list">
          ${certs.slice(0, 3).map(c => `<div class="list-row"><span class="cert-ic">${I.cert}</span><div class="t"><b>${esc(c.curso)}</b><small>Emitido em ${esc((c.emitido_em || '').slice(0, 10))}</small></div><span class="chip chip-g">Verificado</span></div>`).join('') || '<p class="muted" style="font-size:13.5px;padding:6px 0">Conclua um curso para emitir o primeiro certificado.</p>'}
        </div></div>
        <div class="card explore-cta"><h4>Explorar cursos</h4><p>Descubra novos temas e desenvolva habilidades que transformam.</p>
          <span class="cap-art">${I.grad}</span>
          <button class="btn btn-f" onclick="go('/catalogo')">Explorar cursos</button></div>
      </div>
    </div>`, MENU.aluno);
});
function kpi(cls, ic, v, l, d, link, sub) { return `<div class="card kpi"><div class="kt"><span class="ic ${cls}">${ic}</span><span>${esc(l)}</span></div><div class="v">${esc(String(v))}</div>${sub ? `<div class="d sub">${esc(sub)}</div>` : ''}${d ? `<div class="d up">▲ ${esc(d)}</div>` : ''}${link ? `<a class="kl" href="${link[1]}">${esc(link[0])} ${I.arrow}</a>` : ''}</div>`; }

/* ================================ certificados ============================== */
const fmtData = (s) => { try { return new Date(String(s).slice(0, 10) + 'T12:00:00Z').toLocaleDateString('pt-PT', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' }); } catch { return String(s || '').slice(0, 10); } };
const CERT_SEAL = `<svg viewBox="0 0 96 96" aria-hidden="true"><defs><linearGradient id="omasealg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#2a8f5f"/><stop offset="1" stop-color="#0a4229"/></linearGradient></defs>
<circle cx="48" cy="48" r="44" fill="none" stroke="#2a8f5f" stroke-width="5" stroke-dasharray="1.5 6.8" stroke-linecap="round"/>
<circle cx="48" cy="48" r="36" fill="url(#omasealg)"/><circle cx="48" cy="48" r="30" fill="none" stroke="#cfe6d8" stroke-width="1.4"/>
<path d="M48 26c7 8 11.5 12.8 11.5 19.6a11.5 11.5 0 0 1-23 0c0-5 2.6-8.7 6-13 .6 3.1 2.1 5 4.4 6.1-1.1-4.1-.8-8.4 1.1-12.7Z" fill="#c7e86a"/>
<path d="M30 66l-4 14 8-4 8 4-4-14Z" fill="#16744a" opacity=".9"/>
<text x="48" y="60" text-anchor="middle" font-family="JetBrains Mono,monospace" font-size="9" font-weight="800" letter-spacing="2" fill="#fff">AMA</text></svg>`;
/* Quatro esquadros em vez de um SVG esticado: com preserveAspectRatio="none"
   as marcas deformavam com a proporção do documento e a do canto superior
   esquerdo ia cair sobre o logótipo. Cada bracket tem tamanho fixo e roda. */
const CERT_CORNERS = `<span class="cert-corners" aria-hidden="true">${['tl', 'tr', 'br', 'bl'].map(p =>
  `<svg class="cb cb-${p}" viewBox="0 0 28 28"><path d="M2 11V6a4 4 0 0 1 4-4h5" fill="none" stroke="#8fbf4a" stroke-width="2" stroke-linecap="round"/></svg>`).join('')}</span>`;
/* Estilo do certificado — única fonte: injetado na página E no separador de impressão */
const CERT_CSS = `
.cert-doc{position:relative;max-width:940px;margin:0 auto;background:linear-gradient(160deg,#fdfefb 0%,#f6f8f2 55%,#eef2e6 100%);color:#121615;border:1px solid #d9ddd7;border-radius:2px;padding:36px 44px 24px;overflow:hidden;box-shadow:0 24px 60px -30px rgba(12,17,14,.45);font-family:'Instrument Sans','Segoe UI',system-ui,sans-serif}
.cert-doc::before{content:'';position:absolute;inset:0;background:radial-gradient(620px 320px at 88% -12%,rgba(22,116,74,.09),transparent 60%),radial-gradient(520px 320px at -6% 112%,rgba(143,191,74,.14),transparent 60%);pointer-events:none}
.cert-corners{position:absolute;inset:12px;pointer-events:none}.cb{position:absolute;width:24px;height:24px;opacity:.9}.cb-tl{top:0;left:0}.cb-tr{top:0;right:0;transform:rotate(90deg)}.cb-br{bottom:0;right:0;transform:rotate(180deg)}.cb-bl{bottom:0;left:0;transform:rotate(270deg)}
.cert-in{position:relative;z-index:1}
.cert-top{display:flex;align-items:center;gap:12px}
.cert-top .logo-sym{width:31px;height:31px;flex:none}
.cert-mark{color:#fff;display:inline-grid;place-items:center;width:44px;height:44px;flex:none;border-radius:2px;background:linear-gradient(140deg,#16744a,#0a4229);box-shadow:inset 0 0 0 1.5px rgba(255,255,255,.18)}
.cert-top b{display:block;font-family:'Bricolage Grotesque','Segoe UI',sans-serif;font-weight:800;font-size:17px;color:#121615;line-height:1.15;letter-spacing:-.01em}
.cert-top small{display:block;color:#5a655e;font-size:11.5px;font-weight:500}
.cert-kicker{margin:26px 0 4px;text-align:center;font-family:'JetBrains Mono',ui-monospace,monospace;font-weight:600;font-size:clamp(17px,2.6vw,26px);letter-spacing:.16em;text-transform:uppercase;color:#0a3b26}
.cert-lead{margin:16px 0 6px;text-align:center;color:#5a655e;font-size:13.5px;letter-spacing:.05em}
.cert-name{margin:0;text-align:center;font-family:'Bricolage Grotesque','Segoe UI',sans-serif;font-weight:800;font-size:clamp(38px,6.4vw,56px);line-height:1.14;letter-spacing:-.025em;color:#0a3b26}
.cert-rule{display:block;width:min(300px,66%);height:12px;margin:0 auto}
.cert-rule path{fill:none;stroke:#16744a;stroke-width:2.4;stroke-linecap:round}
.cert-course{margin:10px 0 0;text-align:center;font-family:'Bricolage Grotesque','Segoe UI',sans-serif;font-weight:600;font-size:clamp(19px,2.8vw,27px);color:#121615}
.cert-meta{margin:9px 0 0;text-align:center;font-family:'JetBrains Mono',ui-monospace,monospace;font-size:11px;font-weight:500;letter-spacing:.14em;text-transform:uppercase;color:#5a655e}
.cert-signs{display:grid;grid-template-columns:1fr auto 1fr;align-items:end;gap:16px;margin-top:38px}
.cert-sign{min-width:150px;text-align:center}
.cert-sign::before{content:'';display:block;width:78%;margin:0 auto 8px;border-top:1.6px solid #8fbf4a}
.cs-nome{display:block;font-family:'Bricolage Grotesque','Segoe UI',sans-serif;font-weight:600;font-size:22px;line-height:1.3;color:#121615}
.cs-data{display:block;font-size:14.5px;font-weight:600;color:#121615;padding:2px 0 4px}
.cs-lbl{display:block;font-family:'JetBrains Mono',ui-monospace,monospace;font-size:9.5px;font-weight:500;letter-spacing:.16em;text-transform:uppercase;color:#5a655e}
.cert-stamp{width:104px;text-align:center}
.cert-stamp svg{display:block;width:104px;height:104px;margin:0 auto -4px}
.cert-foot{display:flex;justify-content:space-between;align-items:center;gap:14px;flex-wrap:wrap;margin-top:30px;padding-top:12px;border-top:1px dashed #d9ddd7;font-size:11.5px;color:#5a655e}
.cert-foot b{font-family:'JetBrains Mono',ui-monospace,monospace;color:#121615;letter-spacing:.05em;font-size:12px}
.cert-foot a{color:#16744a;font-weight:700;text-decoration:none}
@media (max-width:640px){.cert-doc{padding:24px 16px 14px;border-radius:2px}.cert-kicker{font-size:clamp(17px,5.2vw,22px);letter-spacing:.07em}.cert-name{font-size:clamp(32px,8.6vw,42px)}.cert-signs{grid-template-columns:1fr;gap:24px;margin-top:28px}.cert-sign{min-width:0}.cs-nome{font-size:26px;overflow-wrap:anywhere}.cs-data{font-size:13px}.cert-stamp{margin:0 auto}.cert-foot{flex-direction:column;align-items:flex-start;gap:6px}.cert-foot a{display:inline-flex;align-items:center;min-height:44px;padding:0 6px}}
@media print{@page{size:A4 landscape;margin:0}body.cert-print{margin:0;background:#fff}body.cert-print .cert-doc{max-width:none;width:297mm;height:210mm;min-height:210mm;margin:0;border:none;border-radius:0;box-shadow:none;page-break-inside:avoid;-webkit-print-color-adjust:exact;print-color-adjust:exact}}`;
document.head.insertAdjacentHTML('beforeend', '<style id="oma-cert-css">' + CERT_CSS + '</style>');
function certDocHTML(c) {
  const horas = Math.round((c.dur_seg || 0) / 360) / 10;
  return `<article class="cert-doc">
  ${CERT_CORNERS}
  <div class="cert-in">
    <div class="cert-top"><span class="cert-mark">${LOGO_SM}</span><div><b>Aristides Miguel Academy</b><small>Academia online feita em Angola · Luanda</small></div></div>
    <p class="cert-kicker">Certificado de Conclusão</p>
    <p class="cert-lead">A Aristides Miguel Academy certifica que</p>
    <h2 class="cert-name">${esc(c.nome)}</h2>
    <svg class="cert-rule" viewBox="0 0 320 12" preserveAspectRatio="none" aria-hidden="true"><path d="M6 8C80 3 240 3 314 8" pathLength="100"/></svg>
    <p class="cert-lead">concluiu com aproveitamento o curso</p>
    <p class="cert-course">${esc(c.curso)}</p>
    <p class="cert-meta">${c.aulas} aulas · ${String(horas).replace('.', ',')} h de formação · ${esc(c.nivel)}</p>
    <div class="cert-signs">
      <div class="cert-sign"><span class="cs-nome">${esc(c.instrutor)}</span><span class="cs-lbl">Instrutor</span></div>
      <div class="cert-stamp">${CERT_SEAL}</div>
      <div class="cert-sign"><span class="cs-data">${esc(fmtData(c.emitido_em))}</span><span class="cs-lbl">Emitido em</span></div>
    </div>
    <div class="cert-foot"><span>Código de verificação <b>${esc(c.codigo)}</b></span><a href="#/verificar/${escAttr(c.codigo)}">verificar na app ${I.arrow}</a></div>
  </div></article>`;
}
window.printCert = (i) => {
  const c = (window.__certs || [])[i]; if (!c) return;
  const w = window.open('', '_blank', 'width=1080,height=780');
  if (!w) { toast('Permita janelas pop-up para imprimir o certificado.'); return; }
  w.document.write(`<!DOCTYPE html><html lang="pt-AO"><head><meta charset="UTF-8"><title>Certificado ${esc(c.codigo)} — Aristides Miguel Academy</title>
  <link href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,400;12..96,600;12..96,700;12..96,800&family=Instrument+Sans:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600&display=swap" rel="stylesheet">
  <style>${CERT_CSS}</style></head><body class="cert-print">${certDocHTML(c)}</body></html>`);
  w.document.close(); w.focus();
  setTimeout(() => { try { w.print(); } catch (e) { } }, 600);
};
window.copyCertCode = (code) => { navigator.clipboard.writeText(code).then(() => toast('Código copiado: ' + code)).catch(() => toast('Código: ' + code)); };

on('/certificados', async () => {
  const certs = await api('/api/certificados');
  window.__certs = certs;
  const horasTot = Math.round(certs.reduce((a, c) => a + (c.dur_seg || 0), 0) / 360) / 10;
  /* Sem certificados a página era uma frase dentro de um cartão vazio. Vale
     mais mostrar o que está a ser ganho: o documento verdadeiro, com o nome de
     quem olha e um curso do catálogo. Marcado como exemplo e inerte — o código
     AMA-EXEMPLO não existe no registo deste navegador, logo nada dentro dele
     responde ao rato. */
  let amostra = '';
  if (!certs.length && S.user) {
    const cat = await api('/api/catalogo').catch(() => null);
    const c = cat && (cat.cursos.find(x => x.estado === 'PUBLIC') || cat.cursos[0]);
    if (c) amostra = `<div class="ce-demo" inert><span class="ce-tag">${I.spark} Assim ficará o seu</span>
      ${certDocHTML({ nome: S.user.nome, curso: c.titulo, aulas: c.aulas || 12, dur_seg: Math.round((c.duracaoH || 8) * 3600), nivel: c.nivel || 'Iniciação', instrutor: mentorDe(c.instrutor_id).nome, emitido_em: new Date().toISOString().slice(0, 10), codigo: 'AMA-EXEMPLO' })}</div>`;
  }
  return panelShell('certificados', `
    <section class="page-hero rv"><div class="ph-in">${blobSvgShort()}
      <div><span class="ph-eye">${I.cert} Certificados de conclusão</span><h1>Meus certificados</h1>
      <p>Cada certificado é emitido automaticamente ao concluir 100% das aulas e tem um código que pode ser conferido na app.</p></div>
      <div class="ph-stats">
        <div class="phs"><b>${certs.length}</b><span>certificado${certs.length === 1 ? '' : 's'}</span></div>
        <div class="phs"><b>${String(horasTot).replace('.', ',')} h</b><span>de formação</span></div>
        <div class="phs"><b>100%</b><span>conferível na app</span></div>
      </div>
    </div></section>
    ${certs.length ? certs.map((c, i) => `<div class="cert-slot rv">
      ${certDocHTML(c)}
      <div class="cert-acts">
        <button class="btn btn-p" onclick="printCert(${i})">${I.cert} Descarregar PDF</button>
        <button class="btn btn-o" onclick="copyCertCode('${escAttr(c.codigo)}')">${I.doc} Copiar código</button>
        <a class="btn btn-ghost" href="#/verificar/${escAttr(c.codigo)}">${I.shield} Verificar autenticidade</a>
      </div></div>`).join('')
      : `<div class="cert-empty"><div class="card empty ce-msg">${I.cert}<h3>Ainda sem certificados</h3><p>Conclua 100% das aulas de um curso para emitir automaticamente — o certificado aparece aqui com código verificável.</p><button class="btn btn-f" style="margin-top:14px" onclick="go('/catalogo')">Explorar cursos</button></div>${amostra}</div>`}`, MENU.aluno);
});

/* verificação local — confirma um código no registo deste navegador */
on('/verificar/:codigo', async ({ args }) => {
  let d = null, erro = '';
  try { d = await api('/api/verificar/' + encodeURIComponent(args.codigo)); } catch (e) { erro = e.message; }
  return shellPublic(`<section class="vf-wrap">
    ${d ? `<div class="vf-banner ok">${I.check}<div><h1>Certificado válido</h1><p>Este código corresponde a um certificado emitido pela Aristides Miguel Academy e registado neste navegador. Noutro dispositivo, o código não é reconhecido.</p></div></div>
      ${certDocHTML({ ...d, nome: d.aluno })}`
      : `<div class="vf-banner bad">${I.close}<div><h1>Código não encontrado</h1><p>${esc(erro)} Confirme o código impresso no rodapé do certificado.</p></div></div>
      <div class="card empty">${I.search}<h3>Certificado não registado</h3><p>Os códigos têm o formato <b>AMA-XX-00000-0000</b> e são emitidos apenas no fim de um curso.</p></div>`}
    <div class="vf-cta"><a class="btn btn-f" href="#/catalogo">Estudar na AMA ${I.arrow}</a><a class="btn btn-o" href="#/">Voltar ao início</a></div>
  </section>`);
});

/* ================================ player ================================= */
let wmTimer = null, sseSrc = null;
const aprenderView = async ({ args }) => {
  const { curso, seccoes, inscrito, progresso } = await api('/api/cursos/' + args.cid);
  if (!inscrito) { const temLivre = seccoes.some(s => s.aulas.some(a => a.livre)); if (!temLivre) { toast('Matricule-se para aceder.'); return go('/curso/' + args.cid); } }
  const todas = seccoes.flatMap(s => s.aulas);
  const done = new Set(progresso.filter(p => p.concluido).map(p => p.lesson_id));
  const aula = byId(args.aid, todas) || todas.find(a => !done.has(a.id) && (inscrito || a.livre)) || todas[0];
  const pct = Math.round(done.size / todas.length * 100);
  const ix = todas.findIndex(a => a.id === aula.id);
  const sec = seccoes.find(s => s.aulas.some(a => a.id === aula.id));
  const prev = todas[ix - 1], next = todas[ix + 1], doneAula = done.has(aula.id);
  const minsTot = Math.round(todas.reduce((a, x) => a + (x.dur_seg || 0), 0) / 60);
  window.__aulaId = aula.id;
  window.__aulaCtx = { id: aula.id, titulo: aula.titulo, resumo: aula.resumo || '', curso: curso.titulo, categoria: curso.categoria };
  if (wmTimer) clearInterval(wmTimer);
  setTimeout(() => initPlayer(aula, curso, inscrito), 50);
  return panelShell('aluno', `<div class="learn-wrap">
    <section class="learn-head"><div class="lh-in">${blobSvgShort()}
      <a class="lh-back" href="#/curso/${curso.id}"><span class="lh-arr">${I.chev}</span> Voltar ao curso</a>
      <div class="lh-row"><div class="lh-txt">
        <span class="lh-eye">${esc(curso.categoria)}${sec ? ' · ' + esc(sec.titulo) : ''}</span>
        <h1>${esc(curso.titulo)}</h1>
        <p class="lh-meta">com <b>${esc(curso.instrutor)}</b> · ${todas.length} aulas · ${Math.floor(minsTot / 60)}h ${minsTot % 60}m de conteúdo</p>
      </div>
      <div class="lh-prog"><svg viewBox="0 0 120 120" aria-hidden="true"><circle cx="60" cy="60" r="50" fill="none" stroke="rgba(255,255,255,.17)" stroke-width="12"/><circle cx="60" cy="60" r="50" fill="none" stroke="#c7e86a" stroke-width="12" stroke-linecap="round" stroke-dasharray="${pct * 3.14} 400" transform="rotate(-90 60 60)"/></svg>
        <div><b>${pct}%</b><span>${done.size} de ${todas.length} concluídas</span></div></div>
      </div></div></section>
    <div class="learn">
      <div class="player-col">
        <div class="player" id="player">
          <div class="wm" id="wm" style="top:16px;left:16px"></div>
          <div id="stage" style="flex:1;display:grid;place-items:center;color:#5f6a62;background:#000"><p>A preparar o vídeo protegido…</p></div>
        </div>
        <div class="learn-foot">
          <div class="lf-l">
            <span class="lf-chip">Aula ${ix + 1} de ${todas.length}</span>
            <h2>${esc(aula.titulo)}</h2>
            ${aula.resumo ? `<p>${esc(aula.resumo)}…</p>` : ''}
          </div>
          <div class="lf-r">
            <button class="btn ${doneAula ? 'btn-o' : 'btn-f'}" id="markbtn" onclick="markDone(${aula.id},${curso.id})">${doneAula ? I.check + ' Concluída — anular' : I.check + ' Marcar aula como concluída'}</button>
            ${next ? `<button class="btn btn-o lf-next" onclick="go('/aprender/${curso.id}/${next.id}')">Próxima aula ${I.arrow}</button>` : `<span class="lf-end">${I.cert} Última aula — conclua para o certificado</span>`}
          </div>
        </div>
      </div>
      <div class="side-tabs">
        <div class="tabs"><button class="on" data-t="conteudo" onclick="playerTab(this)">Conteúdo</button>
          <button data-t="estudo" onclick="playerTab(this)">Resumo IA</button>
          <button data-t="ia" onclick="playerTab(this)">Kuzaya AI</button>
          <button data-t="resumo" onclick="playerTab(this)">Notas</button></div>
        <div class="tab-body" id="tab-body">
          ${seccoes.map(s => `<div class="nav-h lh-sec">${esc(s.titulo)}<b>${s.aulas.filter(a => done.has(a.id)).length}/${s.aulas.length}</b></div>` + s.aulas.map(a =>
            `<div class="lesson-row ${done.has(a.id) ? 'done' : ''} ${a.id === aula.id ? 'on' : ''}" onclick="go('/aprender/${curso.id}/${a.id}')">
            <span class="ic" style="color:${done.has(a.id) ? 'var(--green)' : 'var(--green)'}">${done.has(a.id) ? I.check : (a.tipo === 'quiz' ? I.quiz : (a.livre || inscrito ? I.play : I.lock))}</span>
            <span style="font-size:13.5px">${esc(a.titulo)}</span><span class="dur">${durMin(a.dur_seg)}</span></div>`).join('')).join('')}
        </div>
      </div>
    </div></div>`, MENU.aluno, { bare: true });
};
on('/aprender/:cid', aprenderView);
on('/aprender/:cid/:aid', aprenderView);
window.playerTab = (btn) => {
  $$('.tabs button').forEach(b => b.classList.toggle('on', b === btn));
  const body = $('#tab-body'); const t = btn.dataset.t;
  if (t === 'conteudo') return render();
  if (t === 'estudo') {
    body.innerHTML = '<div class="spinner"></div>';
    const ctx = window.__aulaCtx || { titulo: '', resumo: '' };
    if (window.AMAStudy) window.AMAStudy.quickSummary(ctx, body);
    else body.innerHTML = '<p class="muted">O módulo de estudo ainda está a carregar. Tente novamente.</p>';
    return;
  }
  if (t === 'resumo') {
    body.innerHTML = `<div class="field"><label>As suas notas desta aula</label><textarea id="nota-in" rows="12" placeholder="Escreva aqui os pontos principais — ficam guardadas na sua conta, nesta e em qualquer dispositivo.">…</textarea></div><div class="nota-foot"><button class="btn btn-p btn-sm" onclick="saveAulaNota()">Guardar notas</button><span id="nota-st" class="muted"></span></div>`;
    api('/api/aulas/' + window.__aulaId + '/nota').then(n => {
      const ta = $('#nota-in'); if (!ta) return; ta.value = n.texto || '';
      const st = $('#nota-st'); if (st) st.textContent = n.atualizado_em ? 'Guardado ' + relTime(n.atualizado_em) : 'Ainda sem notas guardadas';
    }).catch(() => { const ta = $('#nota-in'); if (ta) ta.value = ''; });
    return;
  }
  body.innerHTML = `<div id="ai-log"></div><div class="flex wrap" style="gap:7px;margin-bottom:12px">${['resume esta aula','dá-me um exemplo prático','recomenda-me um curso relacionado'].map(s => `<span class="chip" style="cursor:pointer" onclick="askAI('${escAttr(s)}')">${esc(s)}</span>`).join('')}</div>
    <div class="chat-in" style="border-top:1px solid var(--line);padding:12px 0"><input id="ai-in" placeholder="Pergunte ao Kuzaya AI…" onkeydown="if(event.key==='Enter')askAI()"><button class="btn btn-p btn-sm" onclick="askAI()">➤</button></div>`;
  aiLog = $('#ai-log'); addAI('me', 'Olá! Sou o Kuzaya AI. Respondo com base nas transcrições das aulas a que tem acesso, sempre com a fonte — e também encontro cursos para si.');
};
window.saveAulaNota = async () => {
  try {
    await api('/api/aulas/' + window.__aulaId + '/nota', { method: 'POST', body: { texto: $('#nota-in').value } });
    const st = $('#nota-st'); if (st) st.textContent = 'Guardado ✓ agora';
    toast('Notas guardadas na sua conta.');
  } catch (e) { toast(e.message); }
};
let aiLog = null;
function addAI(who, html) { if (!aiLog) return; aiLog.insertAdjacentHTML('beforeend', `<div class="ai-msg ${who === 'me' ? 'me' : ''}"><span class="av" style="background:${who === 'me' ? 'var(--navy)' : 'linear-gradient(135deg,var(--green),var(--flame-2))'}">${who === 'me' ? esc(S.user.handle[0]) : 'AI'}</span><div class="bub">${html}</div></div>`); aiLog.parentElement.scrollTop = 1e6; }
window.askAI = async (preset) => {
  aiLog = $('#ai-log') || aiLog;
  const inp = $('#ai-in'); const pergunta = preset || inp.value.trim(); if (!pergunta) return;
  if (!preset) inp.value = '';
  addAI('me', esc(pergunta)); addAI('ai', '<span class="muted">A consultar os materiais…</span>');
  try { const r = await api('/api/ia/pergunta', { method: 'POST', body: { pergunta, cursoId: Number(location.hash.match(/aprender\/(\d+)/)?.[1]) || undefined } });
    $$('#ai-log .ai-msg').pop().remove();
    addAI('ai', esc(r.resposta) + (r.cursos && r.cursos.length ? `<div class="oma-cards" style="margin-top:10px">${r.cursos.map(omaCourseMini).join('')}</div>` : '') + `<div class="src">${I.doc}${(r.fontes || []).map(f => `<span class="chip">${esc(f.curso)} · ${esc(f.aula)}</span>`).join('') || '<span class="chip">sem fontes</span>'}</div>`);
  } catch (e) { $$('#ai-log .ai-msg').pop().remove(); addAI('ai', `<span style="color:var(--red)">${esc(e.message)}</span>`); }
};
async function initPlayer(aula, curso, inscrito) {
  const stage = $('#stage');
  try {
    const m = await api('/api/aulas/' + aula.id + '/manifest');
    if (m.local) {
      const texto = (aula.resumo || '').trim();
      const pontos = texto ? texto.split(/(?<=[.!?])\s+/).slice(0, 5) : [];
      stage.style.background = '#0d1b1d';
      stage.innerHTML = `<div class="lesson-sheet">
        <div class="ls-top"><span class="chip chip-f">Modo local</span><span class="ls-min">${durMin(aula.dur_seg)} de leitura</span></div>
        <h3>${esc(aula.titulo)}</h3>
        <p class="ls-aviso">${esc(m.aviso)}</p>
        <div class="ls-body">${pontos.length ? pontos.map(p => `<p>${esc(p)}</p>`).join('') : '<p class="muted">Esta aula ainda não tem texto escrito. As notas e o tutor continuam disponíveis nas abas laterais.</p>'}</div>
        <div class="ls-act"><button class="btn btn-f" onclick="markDone(${aula.id},${curso.id})">${I.check} Marcar como concluída</button><a class="btn btn-o" href="#/estudar?aula=${aula.id}">${I.spark} Gerar resumo e cartões</a></div>
      </div>`;
      const wm = $('#wm'); if (wm) wm.textContent = m.watermark;
      return;
    }
    stage.innerHTML = `<video id="vid" controls playsinline src="${m.url}" style="width:100%;height:100%"></video>`;
    const wm = $('#wm'); const wmPos = [{ top: '16px', left: '16px' }, { top: '16px', right: '16px' }, { bottom: '64px', right: '16px' }, { top: '120px', right: '16px' }];
    let wi = 0; wm.textContent = m.watermark;
    wmTimer = setInterval(() => { wi = (wi + 1) % 4; Object.assign(wm.style, { top: '', left: '', right: '', bottom: '' }, wmPos[wi]); }, 4000);
    const vid = $('#vid');
    vid.addEventListener('error', async () => { // URL temporária expirou → renovar manifest e retomar
      try {
        const m2 = await api('/api/aulas/' + aula.id + '/manifest');
        const t = vid.currentTime; vid.src = m2.url; vid.load(); vid.currentTime = t;
        wm.textContent = m2.watermark; toast('Link de vídeo renovado');
      } catch { }
    });
    vid.addEventListener('timeupdate', () => { if (vid.currentTime % 15 < .5) api('/api/progresso', { method: 'POST', body: { aulaId: aula.id, vistoSeg: Math.round(vid.currentTime), concluido: false } }).catch(() => { }); });
    vid.addEventListener('ended', () => markDone(aula.id, curso.id, true));
  } catch (e) {
    stage.innerHTML = `<div style="text-align:center;padding:30px"><div style="width:60px;height:60px;border-radius:20px;background:rgba(255,255,255,.06);display:grid;place-items:center;margin:0 auto 14px;color:#94a3b8">${I.lock}</div>
      <p style="color:#cfd4cd;font-weight:600">${esc(e.message)}</p>
      ${!inscrito ? `<button class="btn btn-f" style="margin-top:14px" onclick="openCheckout(${curso.id})">Comprar por ${kz(curso.preco_kz)}</button>` : ''}</div>`;
  }
}
window.markDone = async (aid, cid, silent) => {
  const cur = await api('/api/cursos/' + cid); const doneIds = new Set(cur.progresso.filter(p => p.concluido).map(p => p.lesson_id));
  const nowDone = !doneIds.has(aid);
  try {
    const r = await api('/api/progresso', { method: 'POST', body: { aulaId: aid, concluido: nowDone, vistoSeg: 0 } });
    if (r.certificado) toast('🎉 Parabéns! Curso concluído — certificado ' + r.certificado + ' emitido.');
    else if (!silent) toast(nowDone ? `Aula concluída · ${r.pct}% do curso` : 'Progresso atualizado');
    if (silent && !r.certificado) toast('Aula concluída automaticamente ✓');
    render();
  } catch (e) { toast(e.message); }
};

/* ================================ instrutor =============================== */
on('/instrutor', async () => {
  const d = await api('/api/instrutor/painel');
  const live = (await api('/api/ao-vivo').catch(() => [])).filter(r => r.instrutor_id === S.user.id && r.estado !== 'ENCERRADA');
  const next = live[0];
  const nm = next ? mentorDe(next.instrutor_id) : null;
  const rascunhos = d.cursos.filter(c => c.estado !== 'PUBLIC').length;
  const vendas = d.vendas30d.length ? d.vendas30d : [{ l: 'hoje', v: 0 }];
  const prog = d.cursos.slice(0, 5).map((c, i) => ({ nome: c.titulo, pct: [80, 65, 45, 35, 20][i] ?? 20, img: mentorDe(c.instrutor_id)?.img }));
  return panelShell('instrutor', `
    <div class="page-h"><div><h1>Olá, ${esc(S.user.handle)} 👋</h1><p>Aqui está o resumo das suas atividades.</p></div>
      <a class="btn btn-f" href="#/instrutor/criar">${I.plus} Criar aula</a></div>
    <div class="grid i-feat">
      <div class="card feat next-class">
        <h3>Próxima aula <span class="chip chip-g">Ao vivo</span></h3>
        ${next ? `<b class="nc-title">${esc(next.titulo)}</b>
          <p class="nc-when">${I.calendar} ${esc(fmtAgenda(next.estado === 'AO_VIVO' ? new Date().toISOString() : next.agenda_em))}</p>
          <div class="nc-avs">${['A','C','L','P'].map((x, i) => `<span class="av" style="background:${['#16744a','#6b7a4a','#2f7f68','#3f6f7d'][i]}">${x}</span>`).join('')}<span class="nc-more">+18</span></div>
          <a class="kl" href="#/sala/${next.id}">Entrar na sala ${I.arrow}</a>`
        : '<p class="muted" style="font-size:14px">Sem aulas agendadas. Crie uma sala ao vivo para os seus alunos.</p><a class="kl" href="#/ao-vivo">Ver agenda ${I.arrow}</a>'}
      </div>
      ${kpi('ic-b', I.book, d.cursos.length, 'Os meus cursos', '', ['Ver todos os cursos', '#/instrutor/cursos'], `${d.cursos.length - rascunhos} ativos · ${rascunhos} rascunhos`)}
      ${kpi('ic-v', I.users, d.stats.alunos, 'Alunos ativos', '18% vs semana passada', ['Ver alunos', '#/instrutor/cursos'], 'a aprender os seus cursos')}
      ${kpi('ic-g', I.money, kz(d.stats.receitaKz), 'Receita este mês', '15% vs mês passado', ['Ver análise', '#/instrutor/financeiro'])}
    </div>
    <div class="grid i-trio">
      <div class="card"><div class="card-h"><h3>Desempenho dos cursos</h3><span class="flex" style="gap:14px;font-size:12px;font-weight:400;color:var(--muted)"><span><i style="display:inline-block;width:9px;height:9px;border-radius:50%;background:var(--green)"></i> Conclusão</span><span><i style="display:inline-block;width:9px;height:9px;border-radius:50%;background:var(--teal)"></i> Engajamento</span><select class="mini-sel"><option>Este mês</option></select></span></div>
        <canvas data-chart="line" data-h="230" data-data='${JSON.stringify(vendas.map((v, i) => ({ l: (v.dia || '').slice(8, 10) + '/' + (v.dia || '').slice(5, 7), v: Number(v.v), s2: Math.round(Number(v.v) * (0.55 + (i % 4) * 0.08)) })))}'></canvas></div>
      <div class="card"><div class="card-h"><h3>Progresso dos alunos</h3><a class="see-all" href="#/instrutor/cursos" style="font-size:13px">Ver todos</a></div><div class="plist">
        ${prog.map(p => `<div class="prow"><span class="av" style="background:${esc(p.img ? '#16744a' : '#2f7f68')}">${esc((p.nome)[0])}</span><div class="pt"><b>${esc(p.nome.split(' ').slice(0, 2).join(' '))}</b><div class="prog-bar"><i style="width:${p.pct}%"></i></div></div><span class="pp">${p.pct}%</span></div>`).join('')}</div></div>
      <div class="card"><div class="card-h"><h3>Agenda</h3><a class="see-all" href="#/ao-vivo" style="font-size:13px">Ver calendário</a></div><div class="alist">
        ${(live.slice(0, 3).length ? live.slice(0, 3) : [{ id: 0, titulo: 'Sem aulas marcadas', agenda_em: null, estado: 'AGENDADA' }]).map((r, i) => `<div class="arow"><span class="aic" style="background:${['#c7e86a', '#2f7f68', '#16744a'][i % 3]}">${I.video}</span><div class="at"><small>${esc(r.estado === 'AO_VIVO' ? 'Agora' : fmtAgenda(r.agenda_em))}</small><b>${esc(r.titulo)}</b><small class="muted">${esc(r.estado === 'AO_VIVO' ? 'Ao vivo' : 'Agendada')}</small></div></div>`).join('')}</div>
        <a class="see-all" href="#/ao-vivo" style="font-size:13px;margin-top:8px">Ver toda a agenda ${I.arrow}</a></div>
    </div>
    <div class="grid i-duo" style="margin-top:18px">
      <div class="card"><div class="card-h"><h3>Seus cursos</h3><a class="see-all" href="#/instrutor/cursos" style="font-size:13px">Ver todos</a></div><div class="list">
        ${d.cursos.map(c => `<div class="list-row"><img src="media/${escAttr(courseArt(c))}.jpg?v=70" style="width:56px;height:40px;border-radius:8px;object-fit:cover">
          <div class="t"><b>${esc(c.titulo)}</b><small>${c.alunos} alunos · ★ ${c.rating.toFixed(1)} · ${c.aulas} aulas</small></div>
          <span class="pill ${c.estado === 'PUBLIC' ? 'pill-p' : 'pill-w'}">${esc(c.estado)}</span></div>`).join('')}</div></div>
      <div class="card"><h3>Últimas atividades</h3><div class="list">
        ${(d.atividades.length ? d.atividades : [{ nome: '—', acao: 'Sem atividade ainda' }]).map(a => `<div class="list-row"><span class="av" style="background:var(--green)">${esc((a.nome || '?')[0])}</span><div class="t"><small><b>${esc(a.nome)}</b> ${esc(a.acao)}</small><small class="muted">${esc((a.criado_em || '').slice(0, 16))}</small></div></div>`).join('')}</div></div>
    </div>`, MENU.instrutor);
});
const COURSE_COVERS = [
  ['card-lideranca-v2', 'Liderança'],
  ['card-python-v2', 'Tecnologia'],
  ['card-oratoria-v2', 'Oratória'],
  ['card-vendas-v2', 'Vendas'],
  ['card-marketing-v2', 'Marketing'],
  ['card-financas-v2', 'Finanças'],
];
const COURSE_TEMPLATES = {
  rapido: {
    titulo: 'Comunicação Prática para Equipas Modernas',
    categoria: 'Desenvolvimento Pessoal', nivel: 'Iniciante', preco: 19900, poster: 'card-oratoria-v2',
    resumo: 'Domine reuniões curtas, apresentações claras e feedback construtivo em menos de uma semana.',
    aprendizagens: 'Estruturar apresentações de 5 minutos com clareza\nConduzir reuniões que terminam em decisões\nDar feedback direto sem criar conflito',
    seccoes: [
      { titulo: 'Módulo 1 — Clareza e Estrutura', aulas: [
        { titulo: 'O método de uma ideia por ecrã', duracao_min: 10, transcript: 'Comece sempre pela conclusão e apresente uma ideia principal por diapositivo.' },
        { titulo: 'Como abrir uma apresentação em 30 segundos', duracao_min: 12, transcript: 'Uma abertura forte começa com uma pergunta real do público ou um dado concreto.' },
      ] },
      { titulo: 'Módulo 2 — Reuniões e Prática', aulas: [
        { titulo: 'Reuniões de 20 minutos com agenda clara', duracao_min: 14, transcript: 'Defina objetivo, tempo por tópico e responsável por cada decisão.' },
        { titulo: 'Exercício final gravado', duracao_min: 15, transcript: 'Prepare um discurso de 3 minutos e teste a sua dicção e ritmo.' },
      ] },
    ],
  },
  pro: {
    titulo: 'Automação e Dados com Python para Negócios',
    categoria: 'Tecnologia', nivel: 'Intermédio', preco: 34900, poster: 'card-python-v2',
    resumo: 'Automatize folhas de cálculo, relatórios semanais e dashboards reais usando Python passo a passo.',
    aprendizagens: 'Escrever scripts Python para tarefas repetitivas\nLer e tratar ficheiros CSV e Excel\nCriar relatórios automáticos em poucos minutos',
    seccoes: [
      { titulo: 'Módulo 1 — Fundamentos Práticos', aulas: [
        { titulo: 'Configuração rápida e primeiro script', duracao_min: 12, transcript: 'Instale o ambiente e execute o seu primeiro script de automação.' },
        { titulo: 'Listas, dicionários e limpeza de dados', duracao_min: 18, transcript: 'Organize registos de clientes e vendas sem fórmulas manuais.' },
      ] },
      { titulo: 'Módulo 2 — Relatórios Automáticos', aulas: [
        { titulo: 'Gerar resumos de vendas em kwanzas', duracao_min: 20, transcript: 'Some receitas por mês e exporte o resumo pronto para a equipa.' },
        { titulo: 'Projeto prático completo', duracao_min: 25, transcript: 'Junte leitura, validação e exportação num fluxo reutilizável.' },
      ] },
    ],
  },
  gratis: {
    titulo: 'Finanças Pessoais em Kwanzas — Primeiros Passos',
    categoria: 'Finanças', nivel: 'Iniciante', preco: 0, poster: 'card-financas-v2',
    resumo: 'Mini-curso gratuito para organizar o orçamento mensal, criar reserva de emergência e evitar dívidas caras.',
    aprendizagens: 'Aplicar a regra 50/30/20 ao seu rendimento\nCalcular o valor ideal do fundo de emergência\nIdentificar despesas invisíveis no mês',
    seccoes: [
      { titulo: 'Módulo Único — Plano em 3 Aulas', aulas: [
        { titulo: 'Diagnóstico do seu orçamento mensal', duracao_min: 10, transcript: 'Separe rendimento fixo, despesas essenciais e margem de poupança.' },
        { titulo: 'Como montar o fundo de emergência', duracao_min: 12, transcript: 'Comece com 1 mês de despesas fixas e avance gradualmente até 6 meses.' },
        { titulo: 'Checklist de hábitos financeiros', duracao_min: 10, transcript: 'Revise o seu plano todos os domingos durante 10 minutos.' },
      ] },
    ],
  },
};
const CR = {
  titulo: '', categoria: 'Negócios', nivel: 'Iniciante', preco: 24900, poster: 'card-lideranca-v2',
  resumo: '', aprendizagens: '', publicarAgora: true,
  seccoes: [{ titulo: 'Módulo 1 — Introdução', aulas: [{ titulo: 'Aula de abertura', duracao_min: 12, transcript: '' }, { titulo: 'Primeiro exercício prático', duracao_min: 15, transcript: '' }] }],
  published: null,
};

on('/publicar', async () => {
  const user = S.user;
  const body = `
  <main class="ama-studio pub-hub">
    <section class="pub-hero">
      <span class="ama-pill-kicker"><i></i>Estúdio de Criação AMA · Cursos, Workshops &amp; Aulas ao Vivo</span>
      <h1>Publique o seu conhecimento.<br>Ensine <span class="ama-accent-word">em minutos.<svg viewBox="0 0 280 18" preserveAspectRatio="none" aria-hidden="true"><path d="M4 13 Q140 2 276 12"/></svg></span></h1>
      <p>Crie um curso gravado com módulos, agende um workshop com bilhetes e check-in, abra uma sala ao vivo ou crie a sua turma universitária — tudo simples, visual e pronto a partilhar.</p>
      <div class="ama-hero-ctas">
        <a class="btn btn-p btn-lg" href="${user ? '#/instrutor/criar' : '#/registo'}">${I.plus} Publicar curso agora</a>
        <a class="btn btn-f btn-lg" href="#/workshops/criar">${I.mega} Publicar workshop</a>
      </div>
    </section>

    <section class="pub-grid">
      <article class="pub-card">
        <span class="pub-ic">${I.book}</span>
        <span class="bt-badge soft">CURSO GRAVADO</span>
        <h2>Criar e dar um curso</h2>
        <p>Use um modelo pronto, adicione módulos e aulas, veja o cartão em tempo real e publique no catálogo em 1 clique.</p>
        <ul class="pub-list"><li>Modelos prontos para começar rápido</li><li>Pré-visualização ao vivo do cartão</li><li>Partilha direta, sala ao vivo e Kuzaya AI</li></ul>
        <a class="btn btn-p" href="${user ? '#/instrutor/criar' : '#/entrar'}">Abrir estúdio de cursos ${I.arrow}</a>
      </article>

      <article class="pub-card">
        <span class="pub-ic">${I.mega}</span>
        <span class="bt-badge dark">EVENTO &amp; NETWORKING</span>
        <h2>Publicar um workshop</h2>
        <p>Configure data, local ou link online, vagas, preço em kwanzas e agenda. Bilhetes e check-in são gerados automaticamente.</p>
        <ul class="pub-list"><li>Bilhete digital e código de entrada</li><li>Networking de participantes integrado</li><li>Funciona já neste navegador</li></ul>
        <a class="btn btn-f" href="#/workshops/criar">Publicar workshop ${I.arrow}</a>
      </article>

      <article class="pub-card">
        <span class="pub-ic">${I.video}</span>
        <span class="bt-badge lime">EM DIRETO</span>
        <h2>Dar uma aula ao vivo</h2>
        <p>Abra uma sala ao vivo agora mesmo para ensinar, responder a perguntas em direto e acompanhar a presença da turma.</p>
        <ul class="pub-list"><li>Chat, perguntas votadas e presença</li><li>Ligada ao seu curso ou aberta</li><li>Abertura instantânea em 1 clique</li></ul>
        <button type="button" class="btn btn-o" onclick="abrirAulaInstantanea()">${I.video} Abrir sala ao vivo agora</button>
      </article>

      <article class="pub-card">
        <span class="pub-ic">${I.grad}</span>
        <span class="bt-badge soft">UNIVERSIDADE · NÚCLEO AMA</span>
        <h2>Criar turma e enviar matérias</h2>
        <p>Organize disciplinas, horário semanal, chamada local, fichas imprimíveis e kits interativos gerados pelo Núcleo AMA.</p>
        <ul class="pub-list"><li>Código partilhável para estudantes</li><li>Consola de lecionação com cronómetro</li><li>Simuladores de grandezas e revisão</li></ul>
        <a class="btn btn-o" href="${user ? '#/turmas' : '#/universidade'}">Abrir Universidade ${I.arrow}</a>
      </article>
    </section>

    <section class="pub-steps">
      <div><i>01</i><b>Escolha o formato</b><p>Curso gravado, workshop, sala ao vivo ou turma universitária.</p></div>
      <div><i>02</i><b>Preencha com modelos</b><p>Comece de um modelo pronto e personalize título, aulas e preço em Kz.</p></div>
      <div><i>03</i><b>Publique e ensine</b><p>Partilhe o link, abra a sala ao vivo e acompanhe os seus alunos.</p></div>
    </section>
  </main>`;
  return shellPublic(body, 'publicar');
});

window.abrirAulaInstantanea = async (cursoId, tituloSug) => {
  if (!S.user) { toast('Entre ou crie a sua conta para abrir uma sala ao vivo.'); return go('/registo'); }
  const titulo = tituloSug || prompt('Título da sua aula ao vivo:', 'Sessão prática ao vivo com ' + S.user.handle);
  if (!titulo || !titulo.trim()) return;
  try {
    const r = await api('/api/instrutor/ao-vivo', { method: 'POST', body: { titulo: titulo.trim(), cursoId, agora: true } });
    if (S.user.papel === 'STUDENT') S.user.papel = 'INSTRUCTOR';
    toast('Sala ao vivo aberta!');
    go('/sala/' + r.id);
  } catch (e) { toast(e.message); }
};

window.copiarLinkCurso = (id, titulo) => {
  const url = location.origin + location.pathname + '#/curso/' + id;
  try { navigator.clipboard?.writeText(url); } catch { }
  toast(`Link de «${titulo}» copiado!`);
};

on('/instrutor/cursos', async () => {
  if (!S.user) return viewEntrar(true);
  const d = await api('/api/instrutor/painel');
  const m = S.user.papel === 'ADMIN' ? MENU.admin : S.user.papel === 'INSTRUCTOR' ? MENU.instrutor : MENU.aluno;
  return panelShell('instrutor/cursos', `<div class="page-h"><div><h1>Meus cursos</h1><p>${d.cursos.length} cursos · publique, partilhe e dê aulas ao vivo com um clique.</p></div>
    <div class="flex" style="gap:8px;flex-wrap:wrap"><a class="btn btn-o btn-sm" href="#/workshops/criar">${I.mega} Publicar workshop</a><a class="btn btn-p" href="#/instrutor/criar">${I.plus} Novo curso</a></div></div>
    ${d.cursos.length ? `<div class="grid g-3">${d.cursos.map(c => `<div class="course" style="cursor:default"><div class="thumb"><img src="media/${escAttr(courseArt(c))}.jpg?v=70"><span class="cat chip ${c.estado === 'PUBLIC' ? 'chip-g' : 'chip-f'}">${esc(c.estado)}</span></div>
      <div class="body"><h4>${esc(c.titulo)}</h4><div class="meta"><span>★ ${(c.rating || 5).toFixed(1)}</span><span>${c.alunos} alunos</span><span>${c.aulas} aulas</span></div>
      <div class="price"><b>${c.preco_kz ? kz(c.preco_kz) : 'Grátis'}</b></div>
      <div class="flex" style="gap:6px;flex-wrap:wrap;margin-top:10px">
        <a class="btn btn-p btn-sm" href="#/aprender/${c.id}">${I.play} Dar/Ver aulas</a>
        <button class="btn btn-o btn-sm" onclick="abrirAulaInstantanea(${c.id}, 'Aula ao vivo — ${escAttr(c.titulo)}')">${I.video} Ao vivo</button>
        <button class="btn btn-o btn-sm" onclick="copiarLinkCurso(${c.id}, '${escAttr(c.titulo)}')">Partilhar</button>
        <a class="btn btn-o btn-sm" href="#/curso/${c.id}">Página</a>
      </div></div></div>`).join('')}</div>`
    : `<div class="card empty"><h3>Ainda não publicou nenhum curso</h3><p>Use o estúdio visual para montar módulos e publicar o seu primeiro curso em minutos.</p><a class="btn btn-p" href="#/instrutor/criar">${I.plus} Criar primeiro curso</a></div>`}`, m);
});

function crPreviewHTML() {
  const totalAulas = CR.seccoes.reduce((n, s) => n + s.aulas.length, 0);
  return `<div class="cr-preview-card">
    <span class="cr-prev-lbl">PRÉ-VISUALIZAÇÃO NO CATÁLOGO</span>
    <div class="course" style="pointer-events:none">
      <div class="thumb"><img src="media/${escAttr(CR.poster)}.jpg?v=70" alt=""><span class="cat chip chip-g">${esc(CR.categoria)}</span></div>
      <div class="body">
        <h3>${esc(CR.titulo || 'Título do seu curso aparece aqui')}</h3>
        <div class="crow"><span class="lvl">${esc(CR.nivel)}</span><span class="rate">★ 5,0 <small>(Novo)</small></span><span class="ls">${I.play} ${nAulas(totalAulas)}</span></div>
        <div class="price">${Number(CR.preco) > 0 ? `<b>${kz(Number(CR.preco))}</b>` : '<b class="free">Grátis</b>'}</div>
      </div>
    </div>
    <div class="cr-prev-meta">
      <div><b>${CR.seccoes.length}</b><span>módulo(s)</span></div>
      <div><b>${totalAulas}</b><span>aula(s)</span></div>
      <div><b>${CR.publicarAgora ? 'Imediata' : 'Revisão'}</b><span>publicação</span></div>
    </div>
  </div>`;
}

window.crApplyTpl = (k) => {
  const t = COURSE_TEMPLATES[k]; if (!t) return;
  Object.assign(CR, {
    titulo: t.titulo, categoria: t.categoria, nivel: t.nivel, preco: t.preco, poster: t.poster,
    resumo: t.resumo, aprendizagens: t.aprendizagens, publicarAgora: true, published: null,
    seccoes: JSON.parse(JSON.stringify(t.seccoes)),
  });
  toast('Modelo carregado! Personalize como quiser e publique.');
  render();
};
window.crSync = () => {
  CR.titulo = ($('#nc-titulo')?.value ?? CR.titulo);
  CR.categoria = ($('#nc-cat')?.value ?? CR.categoria);
  CR.nivel = ($('#nc-niv')?.value ?? CR.nivel);
  CR.preco = Number($('#nc-preco')?.value ?? CR.preco);
  CR.resumo = ($('#nc-resumo')?.value ?? CR.resumo);
  CR.aprendizagens = ($('#nc-learn')?.value ?? CR.aprendizagens);
  const pub = $('#nc-pubnow'); if (pub) CR.publicarAgora = !!pub.checked;
  const pv = $('#cr-prev-slot'); if (pv) pv.innerHTML = crPreviewHTML();
};
window.crPickCover = (img) => { CR.poster = img; render(); };
window.crAddMod = () => {
  CR.seccoes.push({ titulo: `Módulo ${CR.seccoes.length + 1} — Prática`, aulas: [{ titulo: 'Nova aula', duracao_min: 12, transcript: '' }] });
  render();
};
window.crDelMod = (mi) => {
  if (CR.seccoes.length <= 1) return toast('O curso precisa de pelo menos 1 módulo.');
  CR.seccoes.splice(mi, 1); render();
};
window.crAddLesson = (mi) => {
  CR.seccoes[mi].aulas.push({ titulo: `Aula ${CR.seccoes[mi].aulas.length + 1}`, duracao_min: 10, transcript: '' });
  render();
};
window.crDelLesson = (mi, ai) => {
  if (CR.seccoes[mi].aulas.length <= 1) return toast('Cada módulo precisa de pelo menos 1 aula.');
  CR.seccoes[mi].aulas.splice(ai, 1); render();
};
window.crSetMod = (mi, val) => { CR.seccoes[mi].titulo = val; };
window.crSetLesson = (mi, ai, field, val) => {
  CR.seccoes[mi].aulas[ai][field] = field === 'duracao_min' ? Math.max(2, Number(val) || 10) : val;
  const pv = $('#cr-prev-slot'); if (pv) pv.innerHTML = crPreviewHTML();
};

on('/instrutor/criar', async () => {
  if (!S.user) return viewEntrar(true);
  const m = S.user.papel === 'ADMIN' ? MENU.admin : S.user.papel === 'INSTRUCTOR' ? MENU.instrutor : MENU.aluno;
  const pub = CR.published;
  return panelShell('instrutor/criar', `
    <div class="page-h">
      <div><h1>Estúdio de criação de curso</h1><p>Comece de um modelo pronto, organize os módulos e publique diretamente no catálogo para começar a ensinar.</p></div>
      <div class="flex" style="gap:8px;flex-wrap:wrap">
        <a class="btn btn-o btn-sm" href="#/workshops/criar">${I.mega} Publicar workshop</a>
        <a class="btn btn-o btn-sm" href="#/instrutor/cursos">${I.book} Meus cursos</a>
      </div>
    </div>

    ${pub ? `<div class="card cr-launched">
      <span class="bt-badge lime">CURSO PUBLICADO</span>
      <h2>«${esc(pub.titulo)}» está pronto a ensinar!</h2>
      <p>O curso já aparece no catálogo local, tem sala de aulas pronta e está ligado ao Kuzaya AI.</p>
      <div class="flex" style="gap:10px;flex-wrap:wrap;margin-top:14px">
        <a class="btn btn-p" href="#/curso/${pub.id}">${I.book} Ver página pública</a>
        <a class="btn btn-f" href="#/aprender/${pub.id}">${I.play} Abrir aulas como aluno</a>
        <button type="button" class="btn btn-o" onclick="abrirAulaInstantanea(${pub.id}, 'Lançamento ao vivo — ${escAttr(pub.titulo)}')">${I.video} Dar aula ao vivo agora</button>
        <button type="button" class="btn btn-o" onclick="copiarLinkCurso(${pub.id}, '${escAttr(pub.titulo)}')">Copiar link</button>
        <button type="button" class="btn btn-o" onclick="CR.published=null;render()">Criar outro</button>
      </div>
    </div>` : ''}

    <div class="cr-tpl-bar">
      <span>Começar com modelo:</span>
      <button type="button" class="btn btn-o btn-sm" onclick="crApplyTpl('rapido')">⚡ Curso Prático (4 aulas)</button>
      <button type="button" class="btn btn-o btn-sm" onclick="crApplyTpl('pro')">💼 Formação Pro (Python)</button>
      <button type="button" class="btn btn-o btn-sm" onclick="crApplyTpl('gratis')">🎁 Mini-Curso Grátis</button>
    </div>

    <div class="cr-layout">
      <div class="cr-form-col">
        <div class="card">
          <div id="nc-msg"></div>
          <h3 style="margin-bottom:14px">1. Identidade e preço</h3>
          <div class="field"><label>Título do curso</label><input id="nc-titulo" value="${escAttr(CR.titulo)}" oninput="crSync()" placeholder="Ex.: Liderança e Gestão de Equipas em Angola"></div>
          <div class="grid g-3" style="gap:14px">
            <div class="field"><label>Categoria</label><select id="nc-cat" onchange="crSync()">${['Negócios', 'Tecnologia', 'Finanças', 'Desenvolvimento Pessoal', 'Idiomas'].map(c => `<option ${CR.categoria === c ? 'selected' : ''}>${c}</option>`).join('')}</select></div>
            <div class="field"><label>Nível</label><select id="nc-niv" onchange="crSync()">${['Iniciante', 'Intermédio', 'Avançado', 'Todos os níveis'].map(n => `<option ${CR.nivel === n ? 'selected' : ''}>${n}</option>`).join('')}</select></div>
            <div class="field"><label>Preço em Kz (0 = Grátis)</label><input id="nc-preco" type="number" min="0" step="500" value="${CR.preco}" oninput="crSync()"></div>
          </div>
          <div class="field"><label>Resumo (promessa para o aluno)</label><textarea id="nc-resumo" rows="3" oninput="crSync()" placeholder="O que o aluno vai conseguir fazer quando terminar este curso?">${esc(CR.resumo)}</textarea></div>
          <div class="field"><label>O que vão aprender (1 ponto por linha)</label><textarea id="nc-learn" rows="3" oninput="crSync()" placeholder="Ex.: Estruturar um plano de vendas&#10;Apresentar propostas com confiança">${esc(CR.aprendizagens)}</textarea></div>

          <div class="field"><label>Capa do curso</label>
            <div class="cr-covers">
              ${COURSE_COVERS.map(([img, lbl]) => `<button type="button" class="cr-cov ${CR.poster === img ? 'on' : ''}" onclick="crPickCover('${img}')"><img src="media/${img}.jpg?v=70" alt="${lbl}"><span>${lbl}</span></button>`).join('')}
            </div>
          </div>
        </div>

        <div class="card" style="margin-top:18px">
          <div class="card-h"><h3>2. Módulos e aulas</h3><button type="button" class="btn btn-o btn-sm" onclick="crAddMod()">${I.plus} Novo módulo</button></div>
          <div class="cr-mods">
            ${CR.seccoes.map((sec, mi) => `<div class="cr-mod">
              <div class="cr-mod-h">
                <input value="${escAttr(sec.titulo)}" oninput="crSetMod(${mi},this.value)" placeholder="Nome do módulo">
                <button type="button" class="btn btn-o btn-sm" onclick="crAddLesson(${mi})">${I.plus} Aula</button>
                <button type="button" class="btn btn-o btn-sm btn-danger" onclick="crDelMod(${mi})">Remover</button>
              </div>
              <div class="cr-lessons">
                ${sec.aulas.map((a, ai) => `<div class="cr-lesson">
                  <div class="cr-lesson-top">
                    <span class="cr-lno">${ai + 1}</span>
                    <input value="${escAttr(a.titulo)}" oninput="crSetLesson(${mi},${ai},'titulo',this.value)" placeholder="Título da aula">
                    <input class="cr-dur" type="number" min="2" max="180" value="${a.duracao_min || 10}" oninput="crSetLesson(${mi},${ai},'duracao_min',this.value)" title="Duração (min)">
                    <button type="button" class="cr-del" onclick="crDelLesson(${mi},${ai})" title="Remover aula">✕</button>
                  </div>
                  <textarea rows="2" oninput="crSetLesson(${mi},${ai},'transcript',this.value)" placeholder="Texto/guião da aula (usado pelo aluno, pelo Kuzaya AI e pelo Núcleo AMA)…">${esc(a.transcript || '')}</textarea>
                </div>`).join('')}
              </div>
            </div>`).join('')}
          </div>
        </div>

        <div class="card cr-pub-box" style="margin-top:18px">
          <label class="checkline"><input id="nc-pubnow" type="checkbox" ${CR.publicarAgora ? 'checked' : ''} onchange="crSync()"> <b>Publicar imediatamente no catálogo</b> (desmarque para enviar para revisão)</label>
          <div class="flex" style="gap:10px;flex-wrap:wrap;margin-top:14px">
            <button type="button" class="btn btn-p btn-lg" onclick="criarCurso()">${I.check} Publicar curso agora</button>
            <span class="muted" style="font-size:12px;align-self:center">Guardado localmente neste navegador.</span>
          </div>
        </div>
      </div>

      <aside class="cr-side-col" id="cr-prev-slot">${crPreviewHTML()}</aside>
    </div>`, m);
});

window.criarCurso = async () => {
  crSync();
  try {
    const r = await api('/api/instrutor/cursos', {
      method: 'POST',
      body: {
        titulo: CR.titulo, categoria: CR.categoria, nivel: CR.nivel,
        precoKz: Number(CR.preco) || 0, resumo: CR.resumo,
        aprendizagens: CR.aprendizagens, poster: CR.poster,
        publicarAgora: CR.publicarAgora, seccoes: CR.seccoes,
      },
    });
    if (S.user && S.user.papel === 'STUDENT') S.user.papel = 'INSTRUCTOR';
    CR.published = { id: r.id, titulo: CR.titulo };
    toast(r.mensagem);
    render();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  } catch (e) {
    const el = $('#nc-msg'); if (el) el.innerHTML = `<div class="err">${esc(e.message)}</div>`;
    toast(e.message);
  }
};
on('/instrutor/financeiro', async () => {
  const d = await api('/api/instrutor/painel');
  return panelShell('instrutor/financeiro', `<div class="page-h"><div><h1>Financeiro do instrutor</h1><p>Repasse de 80% por venda confirmada pelo gateway.</p></div></div>
    <div class="grid g-3">${kpi('ic-g', I.money, kz(d.stats.receitaKz), 'Disponível para levantamento', '')}${kpi('ic-v', I.chart, kz(d.stats.pagamentos), 'Total processado', '')}${kpi('ic-b', I.users, d.stats.alunos, 'Alunos pagos', '')}</div>
    <div class="card mt"><h3>Como funciona</h3><p class="muted" style="font-size:14px">Cada pagamento confirmado pelo webhook MULTICAIXA gera um registo de payout de 80% do valor líquido. Levantamentos via Multicaixa Express — no protótipo, use o botão abaixo.</p>
    <button class="btn btn-o btn-sm" style="margin-top:12px" onclick="toast('Pedido de levantamento registado (demo).')">Levantar agora</button></div>`, MENU.instrutor);
});

/* ================================ admin ================================== */
on('/admin', async () => {
  const d = await api('/api/admin/painel');
  const cres = {}; for (const g of d.crescimento) { (cres[g.mes] ||= {})[g.papel] = g.n; }
  const meses = Object.keys(cres);
  const MES3 = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
  const rec6 = {}; for (const o of d.ordens) if (o.estado === 'PAGO') { const m = (o.pago_em || o.criado_em || '').slice(0, 7); if (m) rec6[m] = (rec6[m] || 0) + Number(o.valor_kz); }
  const recMeses = Object.keys(rec6).sort().slice(-6);
  const pend = d.cursos.filter(c => c.estado === 'PENDENTE');
  return panelShell('admin', `
    <div class="page-h"><div><h1>Visão geral</h1><p>Acompanhe o desempenho da plataforma.</p></div>
      <a class="btn btn-f" href="#/admin/cursos">${I.shield} Aprovar cursos ${d.stats.pendentes ? `<span class="pill pill-r" style="margin-left:6px;background:rgba(255,255,255,.22)">${d.stats.pendentes}</span>` : ''}</a></div>
    <div class="grid g-4" style="margin-top:22px">
      ${kpi('ic-v', I.users, d.stats.usuarios, 'Utilizadores ativos', '14% vs mês passado', ['Ver utilizadores', '#/admin/utilizadores'])}
      ${kpi('ic-b', I.book, d.stats.cursosAtivos, 'Cursos publicados', '8% vs mês passado', ['Ver cursos', '#/admin/cursos'])}
      ${kpi('ic-f', I.chart, d.stats.transacoes, 'Transações pagas', '18% vs mês passado', ['Ver financeiro', '#/admin/financeiro'])}
      ${kpi('ic-g', I.money, kz(d.stats.receitaKz), 'Receita total', '22% vs mês passado', ['Ver relatório', '#/admin/auditoria'])}
    </div>
    <div class="grid i-trio">
      <div class="card"><div class="card-h"><h3>Crescimento de utilizadores</h3><span class="flex" style="gap:12px;font-size:12px;font-weight:400;color:var(--muted)"><span><i style="display:inline-block;width:9px;height:9px;border-radius:50%;background:var(--green)"></i> Alunos</span><span><i style="display:inline-block;width:9px;height:9px;border-radius:50%;background:var(--blue)"></i> Professores</span><span><i style="display:inline-block;width:9px;height:9px;border-radius:50%;background:var(--teal)"></i> Admins</span><select class="mini-sel"><option>Mensal</option></select></span></div>
        <canvas data-chart="bars" data-h="230" data-data='${JSON.stringify(meses.map(m => ({ l: MES3[Number(m.slice(5, 7)) - 1] || m, s: [cres[m].STUDENT || 0, cres[m].INSTRUCTOR || 0, cres[m].ADMIN || 0] })))}'></canvas></div>
      <div class="card"><div class="card-h"><h3>Aprovações pendentes</h3><a class="see-all" href="#/admin/cursos" style="font-size:13px">Ver todas</a></div>
        ${pend.length ? pend.slice(0, 3).map(c => `<div class="appr"><img src="media/${escAttr(courseArt(c))}.jpg?v=70" alt=""><div class="t"><b>${esc(c.titulo)}</b><small>por ${esc(c.instrutor || 'instrutor')}</small></div>
          <div class="appr-btns"><button class="btn btn-p btn-sm" onclick="aprovCurso(${c.id},'PUBLIC')">Aprovar</button><button class="btn btn-o btn-sm" onclick="aprovCurso(${c.id},'RASCUNHO')">Rejeitar</button></div></div>`).join('')
        : '<div class="appr-empty">' + I.shield + '<b>Fila limpa</b><small>Nenhum curso à espera de aprovação.</small></div>'}
        <a class="see-all" href="#/admin/cursos" style="font-size:13px;margin-top:auto;padding-top:10px">Ver todas as pendências ${I.arrow}</a></div>
      <div class="card"><div class="card-h"><h3>Receita <small class="muted" style="font-weight:400">· últimos 6 meses</small></h3><select class="mini-sel"><option>Mensal</option></select></div>
        <canvas data-chart="bars" data-h="180" data-data='${JSON.stringify(recMeses.length ? recMeses.map(m => ({ l: MES3[Number(m.slice(5, 7)) - 1], s: [Math.round(rec6[m] / 1000)] })) : [{ l: '—', s: [0] }])}'></canvas>
        <a class="see-all" href="#/admin/financeiro" style="font-size:13px;margin-top:10px">Relatório completo ${I.arrow}</a></div>
    </div>
    <div class="grid i-duo" style="margin-top:18px">
      <div class="card"><div class="card-h"><h3>Últimos utilizadores registados</h3><a class="see-all" href="#/admin/utilizadores" style="font-size:13px">Gerir</a></div><div class="list">
        ${d.ultimosUsuarios.map(u => `<div class="list-row"><span class="av" style="background:${escAttr(u.papel === 'ADMIN' ? '#c0392b' : u.papel === 'INSTRUCTOR' ? '#6b7a4a' : '#16744a')}">${esc(u.nome[0])}</span><div class="t"><b>${esc(u.nome)}</b><small>${esc(u.email)} · ${esc((u.criado_em || '').slice(0, 16))}</small></div><span class="pill ${u.papel === 'ADMIN' ? 'pill-r' : u.papel === 'INSTRUCTOR' ? 'pill-w' : 'pill-v'}">${esc(u.papel)}</span></div>`).join('')}</div></div>
      <div class="card"><h3>Distribuição por categoria</h3><canvas data-chart="donut" data-h="210" data-data='${JSON.stringify(d.categorias.map(c => ({ l: c.categoria, v: c.n })))}'></canvas></div>
    </div>`, MENU.admin);
});
on('/admin/utilizadores', async () => {
  const d = await api('/api/admin/painel');
  return panelShell('admin/utilizadores', `<div class="page-h"><div><h1>Utilizadores</h1><p>${d.utilizadores.length} contas · papéis e acesso.</p></div></div>
    <div class="card" style="overflow-x:auto"><table class="tbl"><tr><th>Nome</th><th>Email</th><th>Papel</th><th>Estado</th><th>Desde</th><th></th></tr>
    ${d.utilizadores.map(u => `<tr><td><b>${esc(u.nome)}</b></td><td class="muted">${esc(u.email)}</td>
      <td><select onchange="setPapel(${u.id},this.value)" style="border:1px solid var(--line);border-radius:8px;padding:5px 8px;font-size:13px" ${u.id === S.user.id ? 'disabled' : ''}>${['STUDENT', 'INSTRUCTOR', 'ADMIN'].map(p => `<option ${p === u.papel ? 'selected' : ''}>${p}</option>`).join('')}</select></td>
      <td>${u.ativo ? '<span class="pill pill-p">ativo</span>' : '<span class="pill pill-r">bloqueado</span>'}</td>
      <td class="muted">${esc((u.criado_em || '').slice(0, 10))}</td>
      <td>${u.id === S.user.id ? '' : `<button class="btn btn-o btn-sm" onclick="toggleUser(${u.id},${u.ativo ? 0 : 1})">${u.ativo ? 'Bloquear' : 'Ativar'}</button>`}</td></tr>`).join('')}</table></div>`, MENU.admin);
});
window.setPapel = async (id, papel) => { try { await api('/api/admin/utilizadores/' + id, { method: 'PATCH', body: { papel } }); toast('Papel atualizado. Sessões terminadas.'); } catch (e) { toast(e.message); } };
window.toggleUser = async (id, ativo) => { try { await api('/api/admin/utilizadores/' + id, { method: 'PATCH', body: { ativo } }); toast(ativo ? 'Utilizador reativado.' : 'Utilizador bloqueado e sessões terminadas.'); render(); } catch (e) { toast(e.message); } };
on('/admin/cursos', async () => {
  const d = await api('/api/admin/painel');
  return panelShell('admin/cursos', `<div class="page-h"><div><h1>Gestão de cursos</h1><p>Fila de aprovação e catálogo.</p></div></div>
    <div class="card" style="overflow-x:auto"><table class="tbl"><tr><th>Curso</th><th>Instrutor</th><th>Preço</th><th>Alunos</th><th>Estado</th><th>Decisão</th></tr>
    ${d.cursos.map(c => `<tr><td><b>${esc(c.titulo)}</b><br><small class="muted">${esc(c.categoria)} · ${esc(c.nivel)}</small></td><td>${esc(c.instrutor)}</td><td>${kz(c.preco_kz)}</td><td>${c.alunos}</td>
      <td><span class="pill ${c.estado === 'PUBLIC' ? 'pill-p' : c.estado === 'PENDENTE' ? 'pill-w' : 'pill-i'}">${esc(c.estado)}</span></td>
      <td>${c.estado === 'PENDENTE' ? `<button class="btn btn-p btn-sm" onclick="aprovCurso(${c.id},'PUBLIC')">Aprovar</button> <button class="btn btn-o btn-sm" onclick="aprovCurso(${c.id},'RASCUNHO')">Rejeitar</button>` : c.estado === 'PUBLIC' ? `<button class="btn btn-o btn-sm" onclick="aprovCurso(${c.id},'ARQUIVADO')">Arquivar</button>` : `<button class="btn btn-o btn-sm" onclick="aprovCurso(${c.id},'PENDENTE')">Reenviar</button>`}</td></tr>`).join('')}</table></div>`, MENU.admin);
});
window.aprovCurso = async (id, estado) => { try { await api('/api/admin/cursos/' + id, { method: 'PATCH', body: { estado } }); toast('Curso ' + estado.toLowerCase() + '.'); render(); } catch (e) { toast(e.message); } };
on('/admin/financeiro', async () => {
  const d = await api('/api/admin/painel');
  return panelShell('admin/financeiro', `<div class="page-h"><div><h1>Financeiro</h1><p>Encomendas, webhooks e repasses.</p></div></div>
    <div class="grid g-3">${kpi('ic-g', I.money, kz(d.stats.receitaKz), 'Receita confirmada', '')}${kpi('ic-b', I.chart, d.stats.transacoes, 'Transações pagas', '')}${kpi('ic-f', I.users, d.stats.pendentes, 'Cursos pendentes', '')}</div>
    <div class="card mt" style="overflow-x:auto"><h3>Encomendas recentes</h3><table class="tbl"><tr><th>Ref</th><th>Aluno</th><th>Curso</th><th>Valor</th><th>Estado</th><th>Quando</th></tr>
    ${d.ordens.map(o => `<tr><td style="font-family:monospace">${esc(o.referencia)}</td><td>${esc(o.aluno)}</td><td>${esc(o.curso)}</td><td><b>${kz(o.valor_kz)}</b></td>
      <td><span class="pill ${o.estado === 'PAGO' ? 'pill-p' : o.estado === 'PENDENTE' ? 'pill-w' : 'pill-r'}">${esc(o.estado)}</span></td><td class="muted">${esc((o.pago_em || o.criado_em || '').slice(0, 16))}</td></tr>`).join('')}</table></div>`, MENU.admin);
});
on('/admin/auditoria', async () => {
  const d = await api('/api/admin/painel');
  return panelShell('admin/auditoria', `<div class="page-h"><div><h1>Auditoria e conformidade</h1><p>Todos os eventos sensíveis são registados de forma imutável.</p></div></div>
    <div class="card"><div class="list">${d.auditoria.map(a => `<div class="list-row"><span class="av" style="background:var(--navy)">${esc((a.nome || '?')[0])}</span><div class="t"><b>${esc(a.nome || 'sistema')}</b> <span class="chip">${esc(a.acao)}</span><small>${esc(a.detalhe)} · ${esc((a.criado_em || '').slice(0, 16))}</small></div></div>`).join('')}</div></div>`, MENU.admin);
});

/* ================================ ao vivo (v14) ============================ */
const LV_PARTICIPANTS = [['L', 'Lívia', 'var(--green)'], ['C', 'Carlos', 'var(--flame-2)'], ['B', 'Beatriz', 'var(--teal)']];
const TIPO_PILL = { PUBLICA: '<span class="pill pill-v">Pública</span>', CURSO: '<span class="pill pill-i">Exclusiva do curso</span>', PREMIUM: '<span class="pill pill-r">Premium</span>' };
function quandoLabel(s) {
  if (!s) return 'A definir';
  const d = new Date(String(s).replace(' ', 'T')); if (isNaN(d)) return String(s).slice(0, 16);
  const hm = String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0');
  const now = new Date(), tm = new Date(now); tm.setDate(now.getDate() + 1);
  if (d <= now) return fmtAgenda(s);   /* passou: dizer "AGORA" de uma aula que já acabou é mentira */
  if (d.toDateString() === now.toDateString()) return 'HOJE · ' + hm;
  if (d.toDateString() === tm.toDateString()) return 'AMANHÃ · ' + hm;
  return fmtAgenda(s);
}
window.lvTabSet = (t) => { S.lvTab = t; render(); };
window.lvInscriver = async (id, btn) => {
  if (!S.user) return go('/entrar');
  try { const r = await api(`/api/ao-vivo/${id}/inscrever`, { method: 'POST' }); toast('Lugar reservado! Envia-te o lembrete antes da aula.'); render(); } catch (e) { toast(e.message); }
};
window.lvLembre = async (id) => {
  if (!S.user) return go('/entrar');
  try { await api(`/api/ao-vivo/${id}/lembrete`, { method: 'POST' }); toast('Ok! Avisamos-te 10 minutos antes da aula.'); render(); } catch (e) { toast(e.message); }
};
on('/ao-vivo', async () => {
  const rooms = await api('/api/ao-vivo');
  const grav = await api('/api/ao-vivo/gravadas').catch(() => []);
  const live = rooms.filter(r => r.estado === 'AO_VIVO');
  const soon = rooms.filter(r => r.estado === 'AGENDADA');
  /* Os emojis 🔴📅🎬 ficavam em quatro estilos de glifo diferentes conforme o
     sistema (e o vermelho do 🔴 não é cor da marca); os ícones SVG da app já
     descrevem as mesmas três coisas. */
  const tabs = [['agora', I.video + 'Ao vivo agora', live.length], ['proximas', I.calendar + 'Próximas', soon.length], ['gravadas', I.play + 'Gravadas', grav.length]];
  const tab = tabs.some(t => t[0] === S.lvTab) ? S.lvTab : (live.length ? 'agora' : soon.length ? 'proximas' : 'gravadas');
  const featured = live[0] || soon[0] || null;
  const agenda = [...live, ...soon];
  const nowPanel = featured ? `<div class="lv-grid">
      <section class="lv-room rv">
        <div class="lv-video">
          <img src="media/live-host-v2.jpg?v=70" alt="Sala ao vivo: ${escAttr(featured.titulo)}" decoding="async">
          <span class="lv-chip ${live.length ? 'on' : ''}"><i></i>${live.length ? 'Ao vivo agora' : 'Começa em ' + quandoLabel(featured.agenda_em).toLowerCase()}</span>
          <span class="lv-viewers">${I.users} ${live.length ? featured.presenca : featured.inscritos}</span>
          <div class="lv-cap"><h2>${esc(featured.titulo)}</h2><p><i class="dot-t"></i>${esc(featured.instrutor)} ${TIPO_PILL[featured.tipo] || ''}</p></div>
          <div class="lv-ctrl">
            <button class="btn btn-f" style="padding:10px 18px" onclick="go('/sala/${featured.id}')">${live.length ? I.video + ' Entrar na sala' : I.calendar + ' Abrir lobby da aula'}</button>
          </div>
        </div>
        <div class="lv-tiles">${LV_PARTICIPANTS.map(([a, n]) => `<div class="lv-tile">
          <span class="lv-mic">${I.mic}</span><b class="lv-ini">${a}</b><span class="lv-tn">${n}<i></i></span></div>`).join('')}
          <div class="lv-tile more" onclick="go('/sala/${featured.id}')">+${Math.max((featured.presenca || featured.inscritos || 24) - 3, 1)}</div>
        </div>
      </section>
      <aside class="lv-sched rv">
        <div class="lv-sh"><span class="lv-sh-ic">${I.calendar}</span><h3>Agenda da<br>semana</h3></div>
        ${agenda.map(r => { const mm = mentorDe(r.instrutor_id); const lv = r.estado === 'AO_VIVO';
          return `<div class="lv-row ${lv ? 'now' : ''}" onclick="go('/sala/${r.id}')">
            <span class="lv-ri">${lv ? '<i class="d"></i>' : I.calendar}</span>
            <div><small>${lv ? '<b class="lv-live-t">Ao vivo agora</b>' : esc(quandoLabel(r.agenda_em))}</small><b>${esc(r.titulo)}</b>
              <p><img src="media/${mm.img}.jpg?v=70" alt="" onerror="this.style.display='none'">${esc(r.instrutor)} · ${lv ? r.presenca : r.inscritos} ${lv ? 'a assistir' : 'inscritos'}</p></div>
            ${lv ? `<span class="lv-flame">${I.spark}</span>` : ''}</div>`; }).join('') || '<p class="muted" style="padding:10px 4px">Sem salas no ar esta semana.</p>'}
        <button class="btn lv-pill" onclick="go('/catalogo')">Explorar os cursos ${I.arrow}</button>
        ${S.user && S.user.papel !== 'STUDENT' ? '<button class="btn btn-o lv-pill" style="margin-top:8px" onclick="novaSala()">Agendar nova sala</button>' : ''}
      </aside>
    </div>` : '<div class="empty rv">Nada no ar neste momento — vê as próximas aulas ou as gravações.</div>';
  const proxPanel = `<div class="up-grid rv">${soon.map(r => { const mm = mentorDe(r.instrutor_id);
    return `<div class="up-card">
      <div class="up-top"><span class="up-when">${I.calendar} ${esc(quandoLabel(r.agenda_em))}</span>${TIPO_PILL[r.tipo] || ''}</div>
      <h3>${esc(r.titulo)}</h3>
      <p>${esc((r.descricao || '').slice(0, 120))}${(r.descricao || '').length > 120 ? '…' : ''}</p>
      <div class="up-prof"><img src="media/${mm.img}.jpg?v=70" alt="" onerror="this.style.display='none'"><span>${esc(r.instrutor)}</span><small>${r.duracao_min || 60} min · ${r.inscritos} inscritos${r.curso ? ' · ' + esc(r.curso) : ''}</small></div>
      <div class="up-act">
        ${r.inscrito || r.acesso.ok ? `<button class="btn btn-f btn-sm" onclick="go('/sala/${r.id}')">${I.video} Ver a sala</button>`
          : `<button class="btn btn-f btn-sm" onclick="lvInscriver(${r.id})">Inscrever-me ${I.arrow}</button>`}
        <button class="btn btn-o btn-sm ${r.lembrou ? 'on' : ''}" onclick="lvLembre(${r.id})">${r.lembrou ? I.check + ' Lembrete activo' : I.bell + ' Lembrar-me'}</button>
      </div></div>`; }).join('') || '<div class="empty">Sem aulas agendadas — volta amanhã.</div>'}</div>`;
  const gravPanel = `<div class="up-grid rv">${grav.map(r => `<div class="up-card rec">
      <div class="up-thumb" onclick="go('/sala/${r.id}')"><img src="media/live-host-v2.jpg?v=70" alt="" loading="lazy"><span class="up-play">${I.play}</span><small>${r.duracao_min || 60} min</small></div>
      <h3>${esc(r.titulo)}</h3>
      <p>${esc((r.resumo || '').slice(0, 120))}…</p>
      <div class="up-prof"><span>${esc(r.instrutor)}</span><small>${esc(fmtAgenda(r.agenda_em))}${r.curso ? ' · ' + esc(r.curso) : ''}</small></div>
      <div class="up-act"><button class="btn btn-f btn-sm" onclick="go('/sala/${r.id}')">${I.play} Assistir gravação</button>
        ${r.curso_id ? `<a class="btn btn-o btn-sm" href="#/curso/${r.curso_id}">Ir para o curso</a>` : ''}</div>
    </div>`).join('') || '<div class="empty">Ainda sem gravações — a primeira aula encerrada aparece aqui automaticamente.</div>'}</div>`;
  return shellPublic(`<div class="lv-page">
  <div class="lv-in">
    <header class="lv-head rv">
      <div>
        <h1>Aulas ao vivo<br><span class="lv-v">esta semana</span> <svg class="lv-rays" viewBox="0 0 40 40" aria-hidden="true"><path d="M28 4l4 6M34 10l7 1M36 18l7 4" pathLength="1"/></svg></h1>
        <p class="lv-sub">Aprenda, participe e conecte-se em tempo real com os seus professores e colegas.
          <svg class="lv-squig" viewBox="0 0 90 14" aria-hidden="true"><path d="M4 9C18 2 30 12 44 7s34-6 42 1" pathLength="1"/></svg></p>
      </div>
      <svg class="lv-cam" viewBox="0 0 150 74" aria-hidden="true"><path class="loop" d="M4 44c14-16 26 10 38-4" /><rect x="52" y="16" width="52" height="42" rx="10"/><path d="M104 30l24-11v46l-24-11z"/><path class="ray" d="M136 22l10-6M140 37h11M136 52l10 6"/></svg>
    </header>
    <nav class="lv-tabs rv" role="tablist">${tabs.map(([k, l, n]) => `<button role="tab" aria-selected="${tab === k}" class="lv-tab ${tab === k ? 'on' : ''}" onclick="lvTabSet('${k}')">${l}<b>${n}</b></button>`).join('')}</nav>
    ${tab === 'agora' ? nowPanel : tab === 'proximas' ? proxPanel : gravPanel}
    <div class="lv-bottom rv">
      <div class="lv-bcard">
        <div class="lv-bart"><span class="vbub vb1">${I.heart}</span><span class="vbub vb2">•••</span>
          <svg viewBox="0 0 190 110" aria-hidden="true"><circle cx="52" cy="38" r="16" /><path d="M28 106c0-18 11-28 24-28s24 10 24 28"/><circle cx="118" cy="30" r="15"/><path d="M96 106c0-17 10-26 22-26s22 9 22 26"/><path class="lap" d="M62 84h66v6H62z"/><path d="M70 66h50v18H70z"/></svg></div>
        <div><h3>Participe, pergunte,<br>compartilhe.</h3><p>As aulas ao vivo são o lugar onde a aprendizagem ganha vida — e as suas dúvidas têm prioridade.</p></div>
      </div>
      <div class="lv-bcard tips">
        <h4>${I.spark} Dicas para aproveitar ao máximo</h4>
        <ul>${['Entre alguns minutos antes', 'Participe no chat', 'Faça perguntas e vote nas dos colegas', 'Veja a gravação e o quiz depois'].map(t => `<li><span>${I.check}</span>${t}</li>`).join('')}</ul>
        <svg class="lv-bulb" viewBox="0 0 70 84" aria-hidden="true"><path d="M35 6a22 22 0 0113 39c-4 3-5 7-5 11h-16c0-4-1-8-5-11A22 22 0 0135 6z"/><path d="M27 64h16M29 71h12M33 78h4"/><path class="ray" d="M35-2v0M8 20l-6-4M62 20l6-4M3 44h-0"/></svg>
      </div>
    </div>
  </div></div>`, 'live');
});
window.novaSala = async () => {
  const titulo = prompt('Título da aula ao vivo:'); if (!titulo) return;
  try { const r = await api('/api/ao-vivo', { method: 'POST', body: { titulo } }); toast('Sala criada!'); go('/sala/' + r.id); } catch (e) { toast(e.message); }
};
/* ---- vista bloqueada (live exclusiva / premium) ---- */
function salaLocked(r) {
  const premium = r.acesso.motivo === 'premium';
  return `<div class="sala-wrap"><a class="sala-back" href="#/ao-vivo">${I.arrow} Voltar à agenda</a>
    <div class="lock-card rv"><span class="lock-ic">${premium ? I.spark : I.lock}</span>
      <h1>${esc(r.titulo)}</h1>
      <p>${esc((r.descricao || '').slice(0, 220))}</p>
      <div class="lock-prof">${I.grad} com ${esc(r.instrutor)} · ${esc(quandoLabel(r.agenda_em))}</div>
      <div class="lock-cta">
        ${premium ? `<button class="btn btn-f" onclick="lvInscriver(${r.id})">Inscrever-me (${esc(r.curso || 'evento premium')}) ${I.arrow}</button>`
        : r.curso_id ? `<a class="btn btn-f" href="#/curso/${r.curso_id}">Matricular-me no curso ${I.arrow}</a>` : ''}
        <a class="btn btn-o" href="#/ao-vivo">Ver outras aulas</a>
      </div>
      <small class="muted">${premium ? 'Live premium: a inscrição garante o teu lugar e a gravação fica na tua Biblioteca.' : 'Esta live é exclusiva dos alunos matriculados — é só fazer a matrícula e entras na sala.'}</small>
    </div></div>`;
}
/* ---- lobby pré-aula ---- */
function salaLobby(r, host) {
  const mm = mentorDe(r.instrutor_id);
  const mats = (r.materiais || []).map(m => `<a class="lb-file" href="${escAttr(m.u)}" target="_blank" rel="noopener">${I.doc}<span>${esc(m.t || m.u.split('/').pop())}</span><small>PDF</small></a>`).join('') || '<p class="muted" style="font-size:13px">O professor ainda não partilhou materiais.</p>';
  const objs = (r.objetivos || []).map(o => `<li>${I.target} ${esc(o)}</li>`).join('') || `<li>${I.target} Perguntar, praticar e avançar — ao vivo.</li>`;
  return `<div class="sala-wrap lobby">
    <a class="sala-back" href="#/ao-vivo">${I.arrow} Voltar à agenda</a>
    <div class="lb-card rv">
      <div class="lb-stage"><img src="media/live-host-v2.jpg?v=70" alt="" decoding="async"><div class="lb-veil" aria-hidden="true"></div>
        <span class="lb-sched">${I.calendar} ${esc(quandoLabel(r.agenda_em))} · ${r.duracao_min || 60} min</span>
        <div class="lb-count"><small>A aula começa em</small><b id="cd">--:--</b><span id="cd-day"></span></div>
        <div class="lb-pi"><span class="pi-label">Câmara desligada</span></div>
      </div>
      <div class="ctl-bar lb-ctl">
        <button class="ctl off" id="lb-mic" title="Microfone">${I.mic}</button>
        <button class="ctl off" id="lb-cam" title="Câmara">${I.cam}</button>
        <span class="ctl-note">Está tudo a funcionar? Testa aqui antes de entrar.</span>
        <span class="ctl-sep"></span>
        <button class="btn btn-f" onclick="enterSala(${r.id})">${I.video} Entrar na aula</button>
        ${host ? `<button class="btn btn-r" onclick="toggleHost(${r.id},'AGENDADA')">${I.play} Iniciar agora</button>` : ''}
      </div>
    </div>
    <div class="lb-body rv">
      <div class="lb-main">
        <h1>${esc(r.titulo)}</h1>
        <p class="lb-desc">${esc(r.descricao || '')}</p>
        <div class="lb-prof"><img src="media/${mm.img}.jpg?v=70" alt="" onerror="this.style.display='none'"><div><b>${esc(r.instrutor)}</b><small>${esc(r.curso || 'Sessão aberta a toda a academia')}</small></div></div>
        <div class="lb-block"><h3>${I.target} O que vai aprender</h3><ul class="lb-objs">${objs}</ul></div>
        <div class="lb-block"><h3>${I.doc} Materiais da aula</h3><div class="lb-files">${mats}</div></div>
      </div>
      <aside class="lb-side">
        <div class="lb-info"><h3>Detalhes</h3>
          <dl><div><dt>Horário</dt><dd>${esc(quandoLabel(r.agenda_em))}</dd></div>
            <div><dt>Duração</dt><dd>${r.duracao_min || 60} minutos</dd></div>
            <div><dt>Professor</dt><dd>${esc(r.instrutor)}</dd></div>
            <div><dt>Inscritos</dt><dd><b>${r.inscritos}</b> pessoas</dd></div>
            <div><dt>Tipo</dt><dd>${TIPO_PILL[r.tipo] || ''}</dd></div></dl>
          <button class="btn btn-o lv-pill" onclick="lvLembre(${r.id})">${r.lembrou ? I.check + ' Lembrete activo' : I.bell + ' Lembrar-me'}</button>
        </div>
      </aside>
    </div></div>`;
}
/* ---- pós-aula: gravação, resumo, Q&A, presença, certificado ---- */
function salaEnd(r) {
  const mm = mentorDe(r.instrutor_id);
  return `<div class="sala-wrap end">
    <a class="sala-back" href="#/ao-vivo">${I.arrow} Voltar à agenda</a>
    <div class="end-head rv"><span class="end-emoji">🎉</span>
      <div><h1>A aula terminou</h1><p><b>${esc(r.titulo)}</b> · ${esc(r.instrutor)} · ${esc(fmtAgenda(r.agenda_em))}${r.duracao_min ? ' · ' + r.duracao_min + ' min' : ''}</p></div>
      <span class="pill pill-v">${r.participantes} participaram</span>
    </div>
    <div class="end-grid">
      <section class="end-player rv">
        ${r.gravacao ? `<div class="end-poster" id="end-poster" onclick="playReplay('${escAttr(r.gravacao)}')">
          <img src="media/live-host-v2.jpg?v=70" alt=""><span class="end-bigplay">${I.play}</span><b>Gravação disponível</b></div>` : '<div class="empty">Sem gravação para esta sessão.</div>'}
        <div class="end-block"><h3>${I.spark} Resumo da aula</h3><p>${esc(r.resumo || 'O resumo fica disponível assim que o professor publicar as notas da sessão.')}</p></div>
        <div class="end-block"><h3>${I.quiz} Depois da aula</h3>
          <div class="end-next">
            <a href="#/biblioteca"><span>${I.library}</span><div><b>Aulas gravadas</b><small>Ficou na tua Biblioteca</small></div></a>
            ${r.curso_id ? `<a href="#/curso/${r.curso_id}"><span>${I.book}</span><div><b>Quiz do curso</b><small>Testa o que aprendeste</small></div></a>
            <a href="#/curso/${r.curso_id}"><span>${I.cert}</span><div><b>Certificado</b><small>Ao concluir o curso</small></div></a>` : ''}
            <a href="#/ao-vivo"><span>${I.calendar}</span><div><b>Próxima live</b><small>Reserva já o teu lugar</small></div></a>
          </div></div>
      </section>
      <aside class="end-side rv">
        <div class="end-block"><h3>${I.doc} Materiais</h3><div class="lb-files">${(r.materiais || []).map(m => `<a class="lb-file" href="${escAttr(m.u)}" target="_blank" rel="noopener">${I.doc}<span>${esc(m.t || m.u.split('/').pop())}</span><small>PDF</small></a>`).join('') || '<p class="muted" style="font-size:13px">Sem materiais.</p>'}</div></div>
        <div class="end-block"><h3>${I.chat} Perguntas &amp; respostas</h3><div id="end-q"><p class="muted" style="font-size:13px">A carregar…</p></div></div>
      </aside>
    </div></div>`;
}
/* ---- sala ao vivo (layout desktop: vídeo > chat/perguntas > informações) ---- */
function salaRoom(r, host) {
  const live = r.estado === 'AO_VIVO';
  return `<div class="sala-wrap v14">
    <a class="sala-back" href="#/ao-vivo">${I.arrow} Voltar à agenda</a>
    <div class="sala-grid v14">
      <div class="sala-main">
        <div class="live-stage" id="stage">
          <img class="stage-cam" src="media/live-host-v2.jpg?v=70" alt="Transmissão do professor" decoding="async">
          <div class="stage-veil" aria-hidden="true"></div>
          <div class="live-badge" id="badge" style="${live ? '' : 'background:#3c443e;box-shadow:none'}"><i></i><span id="badgetxt">${live ? 'AO VIVO' : 'AGUARDANDO'}</span></div>
          <div class="live-viewers" id="viewers">${I.users} ${r.presenca} a assistir</div>
          <div class="stage-title"><h1>${esc(r.titulo)}</h1><p><i class="dot"></i>${esc(r.instrutor)} · AMA</p></div>
          <div class="wait-note" id="wait-note" ${live ? 'hidden' : ''}>${I.clock} O professor ainda não começou — podes ficar na sala, avisamos aqui.</div>
          <div class="subs-bar" id="subs" hidden><span>Legendas · <i>o professor demonstra agora o primeiro exercício prático…</i></span></div>
          <div class="hand-banner" id="hand-banner" hidden></div>
          <div class="live-pi" id="pi"><span class="pi-label">Tu</span></div>
          ${host ? `<div class="host-row">
            <button class="host-chip" onclick="pollOpen()" title="Criar enquete">${I.chart} <span>Enquete</span></button>
            <button class="host-chip" onclick="materialOpen(${r.id})" title="Enviar material">${I.doc} <span>Material</span></button>
            <button class="host-chip" onclick="recToggle()" id="b-rec" title="Gravar sessão"><i class="rec-dot" aria-hidden="true"></i> <span>Gravar</span></button>
            <button class="host-chip danger" onclick="toggleHost(${r.id},'AO_VIVO')" title="Encerrar aula">${I.close} <span>Encerrar</span></button>
          </div>` : ''}
        </div>
        <div class="ctl-bar" id="ctlbar">
          <button class="ctl on" id="b-mic" title="Microfone">${I.mic}</button>
          <button class="ctl on" id="b-cam" title="Câmara">${I.cam}</button>
          <button class="ctl" id="b-screen" title="Partilhar ecrã">${I.screen}</button>
          <button class="ctl" id="b-hand" title="Levantar a mão">${I.hand}</button>
          ${host ? '' : `<button class="ctl" id="b-ask" title="Perguntar agora" onclick="liveTabName('perguntas')">${I.quiz}</button>`}
          <span class="ctl-sep"></span>
          <span class="ctl-count" id="ctl-count" title="A assistir agora">${I.users} ${pl1(r.presenca, 'aluno', 'alunos')}</span>
          <span class="conn" id="conn" title="Ligação por SSE"><i></i>Conexão excelente</span>
          <button class="ctl" id="b-cc" title="Legendas">${I.cc}</button>
          <button class="ctl txt" id="b-speed" title="Velocidade">1×</button>
          <button class="ctl txt" id="b-qual" title="Qualidade">1080p</button>
          <button class="ctl" id="b-full" title="Tela cheia">${I.full}</button>
          <button class="ctl" id="b-report" title="Reportar problema">${I.flag}</button>
          <button class="ctl leave" title="Sair" onclick="leaveLive()">${I.endcall}</button>
        </div>
        <div class="info-bar">
          <div class="ib-head"><div><h2>${esc(r.titulo)}</h2><p>${esc(r.instrutor)} ${TIPO_PILL[r.tipo] || ''}${r.curso ? `<span class="ib-cur">${I.book} ${esc(r.curso)}</span>` : ''}</p></div>
            <span class="ib-live"><i></i><b id="presenca">${r.presenca}</b> ${pl1(r.presenca, 'aluno ao vivo', 'alunos ao vivo')}</span></div>
          <div class="tabs ib-tabs">
            <button class="on" onclick="ibTab(this,'desc')">Descrição</button>
            <button onclick="ibTab(this,'mat')">Materiais${r.materiais.length ? ` (${r.materiais.length})` : ''}</button>
            <button onclick="ibTab(this,'perg')">Perguntas${r.perguntas ? ` (${r.perguntas})` : ''}</button>
            <button onclick="ibTab(this,'not')">Anotações</button>
          </div>
          <div id="ib-desc" class="ib-panel"><p>${esc(r.descricao || 'O professor partilhará a descrição da sessão antes de começar.')}</p></div>
          <div id="ib-mat" class="ib-panel" hidden><div class="lb-files" id="ib-mats">${r.materiais.map(m => `<a class="lb-file" href="${escAttr(m.u)}" target="_blank" rel="noopener">${I.doc}<span>${esc(m.t || m.u.split('/').pop())}</span><small>PDF</small></a>`).join('') || '<p class="muted" style="font-size:13px">Ainda sem materiais partilhados.</p>'}</div></div>
          <div id="ib-perg" class="ib-panel" hidden><div class="ib-qmirror" id="ib-qs"><p class="muted" style="font-size:13px">Sem perguntas ainda — usa a aba Perguntas ao lado.</p></div></div>
          <div id="ib-not" class="ib-panel" hidden><div class="nota-in"><textarea id="nota-txt" rows="2" placeholder="Anota aqui o que queres guardar desta aula…"></textarea><button class="btn btn-p btn-sm" onclick="saveNota(${r.id})">${I.plus} Guardar nota</button></div><div class="nota-list" id="nota-list"><p class="muted" style="font-size:13px">As tuas notas desta aula aparecem aqui — só tu as vês.</p></div></div>
        </div>
      </div>
      <aside class="sala-side">
        <div class="tabs side-tabs14">
          <button class="on" onclick="liveTab(this,'chat')">${I.chat} Chat</button>
          <button onclick="liveTab(this,'perguntas')">${I.quiz} Perguntas<b id="qcount" ${r.perguntas ? '' : 'hidden'}>${r.perguntas || ''}</b></button>
          <button onclick="liveTab(this,'pessoas')">${I.users} Pessoas (${r.presenca})</button>
        </div>
        <div class="chat" id="tab-chat">
          <div class="chat-filt"><span class="chip on" data-f="todos" onclick="chatFilt(this)">Todos</span><span class="chip" data-f="perg" onclick="chatFilt(this)">Perguntas</span>
            <span class="chat-sp"></span>
            <span class="reac-row"><button onclick="react('❤️')" title="Adorei">❤️</button><button onclick="react('👍')" title="Boa">👍</button><button onclick="react('👏')" title="Aplauso">👏</button><button onclick="react('🎉')" title="Festa">🎉</button></span>
          </div>
          <div class="chat-log" id="chatlog"></div>
          <div class="chat-in"><input id="chat-in" placeholder="Escreva uma mensagem…" onkeydown="if(event.key==='Enter')sendChat(${r.id})"><button class="send" aria-label="Enviar mensagem" onclick="sendChat(${r.id})">${I.arrow}</button></div>
          <div class="floaters" id="floaters"></div>
        </div>
        <div class="qlist" id="tab-perguntas" hidden>
          <div class="q-head"><h3>Sessão de perguntas</h3><p>Vota nas que quiseres ver respondidas primeiro — as mais votadas sobem.</p></div>
          <div id="qlist-items"></div>
          <div class="chat-in q-in"><input id="q-in" placeholder="Como faço para conseguir meu primeiro cliente?" onkeydown="if(event.key==='Enter')askPergunta(${r.id})"><button class="send" aria-label="Perguntar" onclick="askPergunta(${r.id})">${I.arrow}</button></div>
        </div>
        <div class="people" id="tab-pessoas" hidden></div>
      </aside>
    </div></div>`;
}
window.enterSala = (id) => { S.salaEntered = id; render(); };
on('/sala/:id', async ({ args }) => {
  const rooms = await api('/api/ao-vivo'); const r = byId(args.id, rooms);
  if (!r) return shellPublic('<div class="empty">Sala não encontrada.</div>');
  if (r.acesso && !r.acesso.ok) return shellPublic(salaLocked(r), 'live');
  const host = !!(S.user && r.acesso && r.acesso.host);
  if (r.estado === 'ENCERRADA') { setTimeout(() => initEnd(r), 30); return shellPublic(salaEnd(r), 'live'); }
  if (r.estado === 'AGENDADA' && S.salaEntered !== r.id) { setTimeout(() => initLobby(r, host), 30); return shellPublic(salaLobby(r, host), 'live'); }
  if (S.user) await api('/api/ao-vivo/' + r.id + '/entrar', { method: 'POST' }).catch(e => toast(e.message));
  setTimeout(() => initLive(r, host), 40);
  return shellPublic(salaRoom(r, host), 'live');
});
/* ---- lógica da sala v14 ---- */
const LV = { r: null, host: false, stream: null, es: null, others: new Map(), questions: [], hands: new Map(), myHand: false, timers: [], voted: new Set() };
function cleanupLive() {
  LV.timers.forEach(clearInterval); LV.timers = [];
  try { LV.es && LV.es.close(); } catch { }
  try { LV.stream && LV.stream.getTracks().forEach(t => t.stop()); } catch { }
  LV.es = null; LV.stream = null; LV.myHand = false; LV.hands.clear(); LV.others.clear();
}
function stopStream() { try { LV.stream && LV.stream.getTracks().forEach(t => t.stop()); } catch { } LV.stream = null; }
/* — lobby — */
function initLobby(r, host) {
  const target = new Date(String(r.agenda_em).replace(' ', 'T')).getTime();
  const cd = $('#cd');
  const tick = () => {
    if (!document.body.contains(cd)) return;
    let s = Math.max(0, Math.round((target - Date.now()) / 1000));
    const d = new Date(target);
    $('#cd-day') && ($('#cd-day').textContent = s <= 0 ? 'Já está a começar!' : quandoLabel(r.agenda_em));
    if (s <= 0) { cd.textContent = '00:00'; return; }
    const p = n => String(n).padStart(2, '0');
    cd.textContent = s >= 86400 ? `${Math.floor(s / 86400)}d ${p(Math.floor(s / 3600) % 24)}:${p(Math.floor(s / 60) % 60)}:${p(s % 60)}` : s >= 3600 ? `${Math.floor(s / 3600)}:${p(Math.floor(s / 60) % 60)}:${p(s % 60)}` : `${p(Math.floor(s / 60))}:${p(s % 60)}`;
  };
  tick(); LV.timers.push(setInterval(tick, 1000));
  const attach = (btnId, kind, label) => {
    const btn = $(btnId); if (!btn) return;
    btn.onclick = async () => {
      try {
        if (!LV.stream) LV.stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        const t = kind === 'mic' ? LV.stream.getAudioTracks()[0] : LV.stream.getVideoTracks()[0];
        if (!t) { toast('Este dispositivo não tem ' + label + '.'); return; }
        t.enabled = btn.classList.contains('off');
        btn.classList.toggle('off', !t.enabled);
        const pi = $('.lb-pi');
        if (kind === 'cam') {
          if (t.enabled) { pi.innerHTML = '<video id="lb-self" autoplay muted playsinline></video><span class="pi-label">' + label + ' activa</span>'; $('#lb-self').srcObject = LV.stream; }
          else { pi.innerHTML = '<span class="pi-label">Câmara desligada</span>'; }
        } else { pi && (pi.querySelector('.pi-label').textContent = t.enabled ? 'Microfone activo' : 'Microfone desligado'); }
      } catch { toast('Permite o acesso ao microfone/câmara para testar.'); }
    };
  };
  attach('#lb-mic', 'mic', 'Microfone'); attach('#lb-cam', 'cam', 'Câmara');
}
/* — pós-aula — */
async function initEnd(r) {
  try {
    const qs = await api(`/api/ao-vivo/${r.id}/perguntas`);
    const el = $('#end-q'); if (!el) return;
    el.innerHTML = qs.map(q => `<div class="q-item mini ${q.respondida ? 'done' : ''}"><span class="q-v static">👍 ${q.votos}</span><div class="q-txt"><b>${esc(q.texto)}</b><p>${esc(q.nome)}</p>${q.respondida ? `<div class="q-ans"><b>✓ ${esc(r.instrutor)}</b> ${esc(q.resposta || 'Respondida em direto.')}</div>` : ''}</div></div>`).join('') || '<p class="muted" style="font-size:13px">Sem perguntas registadas.</p>';
  } catch { }
}
window.playReplay = (src) => {
  const poster = $('#end-poster'); if (!poster) return;
  poster.outerHTML = `<video class="end-video" src="${escAttr(src)}" controls autoplay playsinline></video>`;
};
/* — sala ao vivo — */
async function initLive(r, host) {
  cleanupLive();
  Object.assign(LV, { r, host, questions: [] });
  const log = $('#chatlog');
  try {
    const evs = await api('/api/ao-vivo/' + r.id + '/eventos?after=0');
    for (const e of evs) {
      if (e.tipo === 'chat') logMsg(log, e.nome, e.texto, e.user_id);
      if (e.tipo === 'join' && e.user_id !== (S.user && S.user.id)) LV.others.set(e.nome, e.user_id);
      if (e.tipo === 'mao') {
        if (e.texto === 'on') LV.hands.set(e.user_id, e.nome);
        else if (e.texto === 'off') LV.hands.delete(e.user_id);
        else if (e.texto.startsWith('aceitar:')) LV.hands.delete(Number(e.texto.split(':')[1]));
      }
    }
    if (!evs.some(e => e.tipo === 'chat')) logMsg(log, 'Sistema', 'Bem-vindo à sala! Chat e perguntas ficam registados em auditoria.');
  } catch { }
  try { LV.questions = await api('/api/ao-vivo/' + r.id + '/perguntas'); } catch { }
  if (S.user && LV.hands.has(S.user.id)) { LV.myHand = true; const hb = $('#b-hand'); if (hb) hb.classList.add('on'); }
  updateHandBanner();
  renderQs(); renderPeople(r);
  if (!S.user) return;
  try {
    if (!LV.stream) LV.stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true }).catch(() => null);
    if (LV.stream) {
      $('#pi').insertAdjacentHTML('afterbegin', '<video id="self" autoplay muted playsinline></video>');
      $('#self').srcObject = LV.stream;
      if (host) { $('#pi').classList.add('speaking'); $('#pi .pi-label').textContent = 'Professor · tu'; }
    } else $('#pi').classList.add('pi-off');
  } catch { $('#pi').classList.add('pi-off'); }
  bindControls(r, host);
  try {
    const ES = window.AMAEventSource || EventSource;
    const es = new ES(`/api/ao-vivo/${r.id}/stream`); LV.es = es;
    es.onmessage = (m) => onSSE(r, host, JSON.parse(m.data));
    es.onerror = () => { const c = $('#conn'); if (c) { c.classList.add('bad'); c.title = 'A tentar religar…'; } };
    es.onopen = () => { const c = $('#conn'); if (c) c.classList.remove('bad'); };
  } catch { }
  const beat = async () => {
    try { await api(`/api/ao-vivo/${r.id}/ping`, { method: 'POST' }); } catch { }
    try {
      const rooms = await api('/api/ao-vivo'); const rr = byId(r.id, rooms); if (!rr) return;
      const p = $('#presenca'); if (p) p.textContent = rr.presenca;
      const cc = $('#ctl-count'); if (cc) cc.innerHTML = I.users + ' ' + pl1(rr.presenca, 'aluno', 'alunos');
      const v = $('#viewers'); if (v) v.innerHTML = I.users + ' ' + rr.presenca + ' a assistir';
    } catch { }
  };
  beat(); LV.timers.push(setInterval(beat, 30000));
  try {
    const notas = await api(`/api/ao-vivo/${r.id}/notas`);
    if (notas.length) renderNotas(notas);
  } catch { }
}
function bindControls(r, host) {
  const st = () => LV.stream;
  const mic = $('#b-mic'), cam = $('#b-cam');
  if (mic) mic.onclick = () => { const t = st() && st().getAudioTracks()[0]; if (!t) return toast('Sem microfone disponível.'); t.enabled = !t.enabled; mic.classList.toggle('off', !t.enabled); };
  if (cam) cam.onclick = () => { const t = st() && st().getVideoTracks()[0]; if (!t) return toast('Sem câmara disponível.'); t.enabled = !t.enabled; cam.classList.toggle('off', !t.enabled); };
  const scr = $('#b-screen');
  if (scr) scr.onclick = async () => {
    try { const s = await navigator.mediaDevices.getDisplayMedia({ video: true });
      $('#self') && ($('#self').srcObject = s); s.getVideoTracks()[0].onended = () => { const v = $('#self'); if (v) v.srcObject = st(); };
      scr.classList.add('on'); toast('A partilhar o ecrã com a sala.');
    } catch { }
  };
  const hand = $('#b-hand');
  if (hand) hand.onclick = async () => {
    LV.myHand = !LV.myHand;
    try { await api(`/api/ao-vivo/${r.id}/mao`, { method: 'POST', body: { acao: LV.myHand ? 'on' : 'off' } }); } catch { }
    hand.classList.toggle('on', LV.myHand);
    toast(LV.myHand ? 'Mão levantada — o professor foi notificado.' : 'Mão baixada.');
    if (!host) updateHandBanner();
  };
  const q = ['Auto', '1080p', '720p']; let qi = 1;
  const qb = $('#b-qual'); if (qb) qb.onclick = () => { qi = (qi + 1) % q.length; qb.textContent = q[qi]; toast('Qualidade: ' + q[qi]); };
  const sp = ['1×', '1.25×', '1.5×', '0.75×']; let si = 0;
  const sb = $('#b-speed'); if (sb) sb.onclick = () => { si = (si + 1) % sp.length; sb.textContent = sp[si]; toast('Velocidade da transmissão: ' + sp[si]); };
  const cc = $('#b-cc'); if (cc) cc.onclick = () => { const on = $('#subs').hidden; $('#subs').hidden = !on; cc.classList.toggle('on', on); toast(on ? 'Legendas activadas.' : 'Legendas desactivadas.'); };
  const fl = $('#b-full'); if (fl) fl.onclick = () => { const s = $('#stage'); if (document.fullscreenElement) document.exitFullscreen(); else s.requestFullscreen && s.requestFullscreen(); };
  const rep = $('#b-report'); if (rep) rep.onclick = () => toast('Problema reportado — a equipa da AMA foi avisada (ref. ' + Date.now().toString(36) + ').');
}
function onSSE(r, host, e) {
  const log = $('#chatlog');
  if (e.tipo === 'chat') logMsg(log, e.nome, e.texto, e.user_id);
  if (e.tipo === 'join' && e.user_id !== S.user.id) { LV.others.set(e.nome, e.user_id); logMsg(log, 'Sistema', `${e.nome} entrou na sala`); renderPeople(r); bumpPresenca(1); }
  if (e.tipo === 'status') {
    const on2 = e.texto === 'AO_VIVO';
    const badge = $('#badge'), txt = $('#badgetxt');
    if (badge) { badge.style.background = on2 ? 'var(--flame-2)' : '#5b6784'; badge.classList.toggle('pulse', !on2); }
    if (txt) txt.textContent = on2 ? 'AO VIVO' : 'AGUARDANDO';
    const wn = $('#wait-note'); if (wn) wn.hidden = on2;
    logMsg(log, 'Sistema', on2 ? `${e.nome} iniciou a transmissão!` : 'A aula foi encerrada — a gravação vai chegar já à tua Biblioteca.');
    if (!on2) setTimeout(() => { cleanupLive(); render(); }, 1800);
  }
  if (e.tipo === 'pergunta' && !LV.questions.some(x => x.id === e.id)) { LV.questions.unshift({ id: e.id, nome: e.nome, texto: e.texto, votos: 0, respondida: 0, fixada: 0, resposta: null, user_id: e.user_id }); renderQs(); logMsg(log, 'Sistema', '❓ Nova pergunta de ' + e.nome + ' na aba Perguntas'); }
  if (e.tipo === 'voto') { const q = LV.questions.find(x => x.id === e.id); if (q) { q.votos = e.votos; renderQs(); } }
  if (e.tipo === 'pergunta-estado') { const q = LV.questions.find(x => x.id === e.id); if (q) { Object.assign(q, { fixada: e.fixada, respondida: e.respondida, resposta: e.resposta }); renderQs(); if (e.respondida && e.user_id !== S.user.id) logMsg(log, 'Sistema', '✓ O professor respondeu à pergunta de ' + q.nome + '.'); } }
  if (e.tipo === 'mao') {
    if (e.acao === 'off') LV.hands.delete(e.user_id); else LV.hands.set(e.user_id, e.nome);
    if (host || e.user_id === S.user.id) updateHandBanner();
    if (host && e.acao === 'on') toast('🙋 ' + e.nome + ' pediu para falar');
  }
  if (e.tipo === 'falar') {
    LV.hands.delete(e.user_id); updateHandBanner();
    if (e.user_id === S.user.id) { $('#stage').classList.add('speaking'); $('#pi').classList.add('speaking'); toast('🎙️ O professor deu-te a palavra — és tu na transmissão!'); logMsg(log, 'Sistema', '🎙️ Agora a falar: ' + (S.user ? S.user.nome : '')); }
    else logMsg(log, 'Sistema', '🎙️ O professor deu a palavra a ' + e.nome);
  }
  if (e.tipo === 'mao-recusada' && e.user_id === S.user.id) toast('Sem problema — deixa a tua pergunta na aba Perguntas.');
  if (e.tipo === 'reacao') { spawnFloater(e.emoji); }
  if (e.tipo === 'enquete') { renderPoll(e); if (host) LV.voted.add(e.id); }
  if (e.tipo === 'enquete-voto') { paintPoll(e.id, e.tally); }
  if (e.tipo === 'material') { logMsg(log, 'Sistema', '📁 Novo material na aula: ' + e.nome); const f = $('#ib-mats'); if (f) { f.querySelector('.muted') && f.querySelector('.muted').remove(); f.insertAdjacentHTML('beforeend', `<a class="lb-file" href="/media/${encodeURIComponent(e.nome)}" target="_blank" rel="noopener">${I.doc}<span>${esc(e.nome)}</span><small>PDF</small></a>`); } }
  if (e.tipo === 'moderar' && e.user_id === S.user.id) {
    if (e.acao === 'silenciar') { const t = LV.stream && LV.stream.getAudioTracks()[0]; if (t) t.enabled = false; $('#b-mic') && $('#b-mic').classList.add('off'); toast('O professor silenciou o teu microfone nesta sessão.'); logMsg(log, 'Sistema', '🔇 ' + (S.user ? S.user.nome : '') + ' foi silenciado pelo professor'); }
    if (e.acao === 'remover') { toast('Foste removido da sala pelo professor.'); setTimeout(leaveLive, 1200); }
  }
}
function bumpPresenca(n) { const p = $('#presenca'); if (p) p.textContent = Math.max(0, Number(p.textContent) + n); const v = $('#viewers'); if (v) v.innerHTML = I.users + ' ' + (p ? p.textContent : '?') + ' a assistir'; const cc = $('#ctl-count'); if (cc && p) cc.innerHTML = I.users + ' ' + pl1(Number(p.textContent), 'aluno', 'alunos'); }
function updateHandBanner() {
  const b = $('#hand-banner'); if (!b) return;
  if (LV.host) {
    const hs = [...LV.hands.entries()];
    if (!hs.length) { b.hidden = true; return; }
    b.hidden = false;
    b.innerHTML = hs.map(([uid, nome]) => `<div class="hb-row">🙋 <b>${esc(nome)}</b> pediu para falar
      <span class="hb-act"><button class="btn btn-f btn-sm" onclick="acceptHand(${uid})">Aceitar</button>
      <button class="btn btn-o btn-sm" onclick="denyHand(${uid})">Recusar</button></span></div>`).join('');
  } else if (LV.myHand) { b.hidden = false; b.innerHTML = '<div class="hb-row me">✋ Levantaste a mão — o professor vai dar-te a palavra.</div>'; }
  else b.hidden = true;
}
window.acceptHand = async (uid) => {
  try { await api(`/api/ao-vivo/${LV.r.id}/mao/${uid}`, { method: 'POST', body: { acao: 'aceitar' } }); } catch (e) { toast(e.message); }
};
window.denyHand = async (uid) => {
  LV.hands.delete(uid); updateHandBanner();
  try { await api(`/api/ao-vivo/${LV.r.id}/mao/${uid}`, { method: 'POST', body: { acao: 'recusar' } }); } catch { }
};
window.recToggle = () => { const b = $('#b-rec'); const on = !b.classList.contains('on'); b.classList.toggle('on', on); b.innerHTML = '<i class="rec-dot" aria-hidden="true"></i> <span>' + (on ? 'A gravar…' : 'Gravar') + '</span>'; toast(on ? 'Gravação iniciada — a aula vai para a Biblioteca ao terminar.' : 'Gravação pausada.'); };
/* — perguntas — */
function renderQs() {
  const c = $('#qlist-items'); if (!c) return;
  const sorted = [...LV.questions].sort((a, b) => (b.fixada - a.fixada) || (a.respondida - b.respondida) || (b.votos - a.votos) || (b.id - a.id));
  c.innerHTML = sorted.map(q => `<div class="q-item ${q.fixada ? 'pin' : ''} ${q.respondida ? 'done' : ''}">
    <button class="q-v ${q.votou ? 'on' : ''}" onclick="qVote(${q.id})" title="Votar nesta pergunta">👍<b>${q.votos}</b><small>pergunta</small></button>
    <div class="q-txt"><b>${esc(q.texto)}</b><p>${esc(q.nome)}${q.user_id === (S.user && S.user.id) ? ' · tu' : ''}</p>
      ${q.fixada ? '<span class="q-tag">📌 fixada pelo professor</span>' : ''}
      ${q.respondida ? `<div class="q-ans"><b>✓ ${esc(LV.r ? LV.r.instrutor : '')}</b> ${esc(q.resposta || 'Respondida em direto na aula.')}</div>` : ''}
      ${LV.host ? `<span class="q-host"><button title="Fixar no topo" onclick="qFix(${q.id},${q.fixada ? 0 : 1})">📌</button><button title="Marcar como respondida" onclick="qAns(${q.id})">✔</button></span>` : ''}
    </div></div>`).join('') || '<p class="muted" style="font-size:13px;padding:10px 4px">Ainda sem perguntas — sê o primeiro a perguntar.</p>';
  const n = $('#qcount'); if (n) { n.textContent = LV.questions.length || ''; n.hidden = !LV.questions.length; }
  const mir = $('#ib-qs'); if (mir) mir.innerHTML = sorted.slice(0, 5).map(q => `<div class="q-item mini ${q.respondida ? 'done' : ''}"><span class="q-v static">👍 ${q.votos}</span><div class="q-txt"><b>${esc(q.texto)}</b><p>${esc(q.nome)}${q.respondida ? ' · respondida' : ''}</p></div></div>`).join('') || '<p class="muted" style="font-size:13px">Sem perguntas ainda — usa a aba Perguntas ao lado.</p>';
}
window.qVote = async (pid) => {
  try { const r = await api(`/api/ao-vivo/perguntas/${pid}/votar`, { method: 'POST' });
    const q = LV.questions.find(x => x.id === pid); if (q) { q.votos = r.votos; q.votou = r.votou; } renderQs();
  } catch (e) { toast(e.message); }
};
window.qFix = async (pid, v) => {
  try { await api(`/api/ao-vivo/perguntas/${pid}/estado`, { method: 'POST', body: { fixada: v } }); } catch (e) { toast(e.message); }
};
window.qAns = async (pid) => {
  const q = LV.questions.find(x => x.id === pid); if (!q) return;
  const resposta = prompt('Resposta para a pergunta de ' + q.nome + ':', '');
  try { await api(`/api/ao-vivo/perguntas/${pid}/estado`, { method: 'POST', body: { respondida: 1, resposta: resposta || null } }); } catch (e) { toast(e.message); }
};
window.askPergunta = async (rid) => {
  const inp = $('#q-in'); const v = inp.value.trim(); if (!v || !S.user) return;
  inp.value = '';
  try { const r = await api(`/api/ao-vivo/${rid}/pergunta`, { method: 'POST', body: { texto: v } });
    LV.questions.unshift({ id: r.id, nome: S.user.nome, texto: v, votos: 0, respondida: 0, fixada: 0, user_id: S.user.id, votou: false }); renderQs();
    toast('Pergunta enviada! Se a votarem, sobe no ranking da sessão.');
  } catch (e) { toast(e.message); }
};
/* — chat: reações e filtro — */
function spawnFloater(emoji) {
  const f = $('#floaters'); if (!f) return;
  const el = document.createElement('span'); el.className = 'float-emoji'; el.textContent = emoji;
  el.style.left = (8 + Math.random() * 80) + '%'; f.appendChild(el);
  setTimeout(() => el.remove(), 2600);
}
window.react = async (e) => { spawnFloater(e); try { await api(`/api/ao-vivo/${LV.r.id}/reacao`, { method: 'POST', body: { emoji: e } }); } catch { } };
window.chatFilt = (btn) => {
  btn.parentElement.querySelectorAll('.chip').forEach(c => c.classList.toggle('on', c === btn));
  $('#chatlog').classList.toggle('only-q', btn.dataset.f === 'perg');
};
/* — enquetes e material do professor — */
function showModal(html) {
  let root = $('#oma-modal-root');
  if (!root) { root = document.createElement('div'); root.id = 'oma-modal-root'; document.body.appendChild(root); }
  root.innerHTML = `<div class="oma-modal" onclick="if(event.target===this)hideModal()"><div class="om-card">${html}</div></div>`;
}
window.hideModal = () => { const r = $('#oma-modal-root'); if (r) r.innerHTML = ''; };
window.pollOpen = () => showModal(`<h3>${I.chart} Criar enquete</h3><p class="muted" style="font-size:13px">Aparece no chat de todos os alunos; os resultados actualizam em direto.</p>
  <input id="poll-q" class="om-in" placeholder="Pergunta — ex.: Qual destes sinais de compra é mais forte?">
  <textarea id="poll-o" class="om-in" rows="4" placeholder="Uma opção por linha&#10;O preço&#10;A urgência&#10;O tom de voz"></textarea>
  <div class="om-act"><button class="btn btn-p" onclick="pollSend()">Lançar enquete</button><button class="btn btn-o" onclick="hideModal()">Cancelar</button></div>`);
window.pollSend = async () => {
  const pergunta = $('#poll-q').value.trim();
  const opcoes = $('#poll-o').value.split('\n').map(s => s.trim()).filter(Boolean);
  try { await api(`/api/ao-vivo/${LV.r.id}/enquete`, { method: 'POST', body: { pergunta, opcoes } }); hideModal(); } catch (e) { toast(e.message); }
};
function renderPoll(e) {
  const log = $('#chatlog'); if (!log) return;
  log.insertAdjacentHTML('beforeend', `<div class="poll-card" data-pid="${e.id}"><b>${I.chart} ${esc(e.pergunta)}</b>
    ${(e.opcoes || []).map((op, i) => `<button class="poll-o" onclick="pollVote(${e.id},${i})">${esc(op)}<i></i></button>`).join('')}</div>`);
  log.scrollTop = 1e6;
}
window.pollVote = async (pid, oi) => {
  try { const r = await api(`/api/ao-vivo/enquetes/${pid}/votar`, { method: 'POST', body: { opcao: oi } }); paintPoll(pid, r.tally, oi); LV.voted.add(pid); } catch (e) { toast(e.message); }
};
function paintPoll(pid, tally, mine) {
  const card = document.querySelector(`.poll-card[data-pid="${pid}"]`); if (!card || !tally) return;
  const total = Math.max(1, tally.reduce((a, b) => a + b, 0));
  card.querySelectorAll('.poll-o').forEach((b, i) => { b.classList.add('bar'); b.querySelector('i').style.width = (tally[i] / total * 100).toFixed(0) + '%'; b.dataset.n = tally[i]; });
}
window.materialOpen = () => showModal(`<h3>${I.doc} Enviar material à aula</h3><p class="muted" style="font-size:13px">Fica logo na aba Materiais de todos os alunos.</p>
  <input id="mat-n" class="om-in" placeholder="Nome — ex.: Checklist da proposta comercial">
  <div class="om-act"><button class="btn btn-p" onclick="materialSend(${LV.r.id})">Enviar</button><button class="btn btn-o" onclick="hideModal()">Cancelar</button></div>`);
window.materialSend = async (rid) => {
  const nome = $('#mat-n').value.trim(); if (!nome) return toast('Indica o nome do material.');
  try { await api(`/api/ao-vivo/${rid}/material`, { method: 'POST', body: { nome } }); hideModal(); } catch (e) { toast(e.message); }
};
window.modAluno = async (rid, uid, acao) => {
  try { await api(`/api/ao-vivo/${rid}/moderar`, { method: 'POST', body: { user_id: uid, acao } }); toast(acao === 'silenciar' ? 'Aluno silenciado.' : 'Aluno removido da sala.'); } catch (e) { toast(e.message); }
};
/* — notas e tabs — */
window.saveNota = async (rid) => {
  const t = $('#nota-txt'); const v = t.value.trim(); if (!v) return;
  t.value = '';
  try { await api(`/api/ao-vivo/${rid}/nota`, { method: 'POST', body: { texto: v } }); const notas = await api(`/api/ao-vivo/${rid}/notas`); renderNotas(notas); toast('Nota guardada — só tu a vês.'); } catch (e) { toast(e.message); }
};
function renderNotas(notas) {
  const el = $('#nota-list'); if (!el) return;
  el.innerHTML = notas.map(n => `<div class="nota"><b>${esc((n.criado_em || '').slice(11, 16))}</b> ${esc(n.texto)}</div>`).join('') || '<p class="muted" style="font-size:13px">Ainda sem notas.</p>';
}
window.ibTab = (btn, t) => {
  btn.parentElement.querySelectorAll('button').forEach(b => b.classList.toggle('on', b === btn));
  ['desc', 'mat', 'perg', 'not'].forEach(k => { const p = $('#ib-' + k); if (p) p.hidden = k !== t; });
};
window.liveTab = (btn, t) => {
  btn.parentElement.querySelectorAll('button').forEach(b => b.classList.toggle('on', b === btn));
  $('#tab-chat').hidden = t !== 'chat';
  $('#tab-pessoas').hidden = t !== 'pessoas';
  const qp = $('#tab-perguntas'); if (qp) qp.hidden = t !== 'perguntas';
};
window.liveTabName = (t) => {
  const side = $('.sala-side .tabs'); if (!side) return;
  const i = { chat: 0, perguntas: 1, pessoas: 2 }[t];
  side.querySelectorAll('button')[i] && liveTab(side.querySelectorAll('button')[i], t);
  const inp = $('#q-in'); if (t === 'perguntas' && inp) inp.focus();
};
function renderPeople(r) {
  const people = $('#tab-pessoas'); if (!people) return;
  const row = (cor, letra, nome, sub, chip, uid) => `<div class="p"><span class="av" style="background:${cor}">${esc(letra)}</span><div class="pi-txt"><b>${esc(nome)}</b>${sub ? `<small>${esc(sub)}</small>` : ''}</div>
    ${uid && LV.host && uid !== S.user.id ? `<span class="p-mad"><button title="Silenciar" onclick="modAluno(${r.id},${uid},'silenciar')">🔇</button><button title="Remover" onclick="modAluno(${r.id},${uid},'remover')">🚫</button></span>` : ''}
    ${chip ? `<span class="chip" style="margin-left:auto">${esc(chip)}</span>` : ''}</div>`;
  const rows = [row('var(--green)', (r.instrutor || '?')[0], r.instrutor, 'À frente da aula', 'anfitrião')];
  if (S.user && S.user.id !== r.instrutor_id) rows.push(row(escAttr(S.user.avatar_cor || 'var(--flame-2)'), S.user.nome[0], S.user.nome, '@' + S.user.handle, 'tu', S.user.id));
  const seen = new Set([S.user && S.user.id, r.instrutor_id].filter(x => x != null));
  for (const [n, uid] of LV.others) { if (seen.has(uid)) continue; seen.add(uid); rows.push(row('var(--navy)', n[0], n, '', '', uid)); }
  people.innerHTML = `<p class="pp-h">Na sala agora · ${rows.length}</p>${rows.join('')}`;
  const tb = people.parentElement.querySelector('.tabs button:nth-child(3)'); if (tb) tb.innerHTML = `${I.users} Pessoas (${rows.length})`;
}
function logMsg(log, nome, texto, uid) {
  if (!log) return;
  if (nome === 'Sistema') { log.insertAdjacentHTML('beforeend', `<div class="ai-sys">${esc(texto)}</div>`); log.scrollTop = 1e6; return; }
  const me = uid != null ? uid === (S.user && S.user.id) : nome === (S.user && S.user.handle);
  const q = /\?/.test(texto) ? '1' : '0';
  log.insertAdjacentHTML('beforeend', `<div class="ai-msg ${me ? 'me' : ''}" data-q="${q}"><span class="av">${esc((nome || '?')[0])}</span><div class="bub"><b>${esc(nome)}</b><p>${esc(texto)}</p></div></div>`);
  log.scrollTop = 1e6;
}
window.sendChat = async (rid) => { const v = $('#chat-in').value.trim(); if (!v || !S.user) return; $('#chat-in').value = ''; try { await api(`/api/ao-vivo/${rid}/chat`, { method: 'POST', body: { texto: v } }); } catch (e) { toast(e.message); } };
window.toggleHost = async (rid, estado) => {
  const novo = estado === 'AO_VIVO' ? 'ENCERRADA' : 'AO_VIVO';
  try { await api(`/api/ao-vivo/${rid}/estado`, { method: 'POST', body: { estado: novo } }); toast(novo === 'AO_VIVO' ? 'Está no ar!' : 'Aula encerrada — a gravação já está na Biblioteca.'); cleanupLive(); render(); } catch (e) { toast(e.message); }
};
window.leaveLive = () => { cleanupLive(); go('/ao-vivo'); };

/* ====================== Kuzaya AI — dock flutuante ====================== */
const OMA_QUICK = ['Recomenda-me um curso para perder o medo de falar em público', 'Quanto custa o curso de Python?', 'Como funciona o certificado?', 'Resume a técnica STOP'];
function omaDockHTML() {
  return `
  <button class="oma-fab" id="oma-fab" title="Kuzaya AI — assistente" aria-label="Abrir Kuzaya AI" onclick="omaToggle()">
    <span class="fab-halo" aria-hidden="true"></span>${I.spark}<span class="fab-lbl">Kuzaya AI</span></button>
  <div class="oma-scrim" id="oma-scrim" onclick="omaToggle(false)"></div>
  <aside class="oma-panel" id="oma-panel" role="dialog" aria-label="Kuzaya AI">
    <header class="oma-head">${blobSvgShort()}
      <span class="oma-av">${LOGO_SM}</span>
      <div class="oma-id"><b>Kuzaya AI</b><small><i class="on-dot"></i>Online · responde com fontes dos seus cursos</small></div>
      <button class="icon-btn oma-x" onclick="omaToggle(false)" aria-label="Fechar assistente">${I.close}</button>
    </header>
    <div class="oma-tabs"><button class="on" onclick="omaTab(this, 'log')">Assistente</button><button onclick="omaTab(this, 'hist')">Histórico</button></div>
    <div class="oma-body" id="oma-log"></div>
    <div class="oma-body oma-hist" id="oma-hist" hidden></div>
    <div class="oma-quick" id="oma-quick">${OMA_QUICK.map(s => `<button class="chip" onclick="omaAsk('${escAttr(s)}')">${esc(s.length > 34 ? s.slice(0, 33) + '…' : s)}</button>`).join('')}</div>
    <div class="oma-in"><input id="oma-in" placeholder="Encontrar cursos, tirar dúvidas de aulas…" onkeydown="if(event.key==='Enter')omaAsk()"><button class="oma-send" onclick="omaAsk()" aria-label="Enviar pergunta">${I.arrow}</button></div>
    <footer class="oma-foot">20 perguntas/hora · RAG permission-aware · cita sempre a aula-fonte</footer>
  </aside>`;
}
window.omaToggle = (force) => {
  const p = $('#oma-panel'), f = $('#oma-fab'), sc = $('#oma-scrim');
  if (!p) return;
  const open = force === true ? true : force === false ? false : !p.classList.contains('open');
  p.classList.toggle('open', open); f.classList.toggle('hide', open);
  if (sc) sc.classList.toggle('on', open);
  if (open) {
    if (!p.dataset.init) {
      p.dataset.init = '1';
      omaSay('ai', `Olá, ${esc(S.user.nome.split(' ')[0])}! Sou o Kuzaya AI. Posso <b>encontrar cursos</b> para os seus objetivos, <b>explicar aulas</b> com a fonte exacta e dizer-lhe <b>como funcionam</b> certificados e pagamentos. Experimente: "quero aprender a vender".`);
    }
    setTimeout(() => { const i = $('#oma-in'); if (i && innerWidth > 720) i.focus(); }, 220);
  }
};
window.omaTab = (btn, t) => {
  $$('#oma-panel .oma-tabs button').forEach(b => b.classList.toggle('on', b === btn));
  $('#oma-log').hidden = t !== 'log'; $('#oma-hist').hidden = t !== 'hist';
  $('#oma-quick').style.display = t === 'log' ? '' : 'none';
  if (t === 'hist') api('/api/ia/historico').then(h => {
    $('#oma-hist').innerHTML = h.length ? h.map(m => `<div class="oh-i"><b>${esc(m.pergunta)}</b><p>${esc(m.resposta.slice(0, 140))}…</p><small>${esc(relTime(m.criado_em))}${(m.fontes || []).length ? ' · ' + esc(m.fontes[0].curso) : ''}</small></div>`).join('') : '<p class="muted" style="padding:18px;font-size:13px">Ainda sem perguntas. Comece pelo assistente.</p>';
  }).catch(() => { });
};
function omaSay(who, html) {
  const log = $('#oma-log'); if (!log) return;
  log.insertAdjacentHTML('beforeend', `<div class="ai-msg ${who === 'me' ? 'me' : ''}"><span class="av" style="background:${who === 'me' ? 'var(--navy)' : 'linear-gradient(135deg,var(--green),var(--flame-2))'}">${who === 'me' ? esc(S.user.handle[0]) : 'AI'}</span><div class="bub">${html}</div></div>`);
  log.scrollTop = 1e7;
  const last = log.lastElementChild;
  if (last && last.scrollIntoView) last.scrollIntoView({ block: 'end' });
  requestAnimationFrame(() => { log.scrollTop = 1e7; if (last && last.scrollIntoView) last.scrollIntoView({ block: 'end' }); });
}
function omaCourseMini(c) {
  return `<a class="oma-c" href="#/curso/${c.id}" onclick="omaToggle(false)">
    <img src="media/${escAttr(courseArt(c))}.jpg?v=70" alt="" loading="lazy">
    <div><b>${esc(c.titulo)}</b><small>★ ${c.rating} · ${c.alunos.toLocaleString('pt-PT').replace(/ /g, '.')} alunos · ${esc(c.nivel)}</small><em>${kz(c.preco_kz)}</em></div>
    ${I.arrow}</a>`;
}
let omaBusy = false;
window.omaAsk = async (preset) => {
  const inp = $('#oma-in'); const pergunta = preset || (inp && inp.value.trim()); if (!pergunta || omaBusy) return;
  if (!preset && inp) inp.value = '';
  omaBusy = true;
  omaSay('me', esc(pergunta));
  omaSay('ai', '<span class="muted">A consultar catálogo e materiais…</span>');
  try {
    const r = await api('/api/ia/pergunta', { method: 'POST', body: { pergunta, cursoId: Number(location.hash.match(/aprender\/(\d+)/)?.[1]) || undefined } });
    $$('#oma-log .ai-msg').pop().remove();
    let html = esc(r.resposta);
    if ((r.cursos || []).length) html += `<div class="oma-cards">${r.cursos.map(omaCourseMini).join('')}</div>`;
    if ((r.fontes || []).length) html += `<div class="src">${I.doc}${r.fontes.map(f => `<span class="chip">${esc(f.curso)} · ${esc(f.aula)}</span>`).join('')}</div>`;
    omaSay('ai', html);
  } catch (e) { $$('#oma-log .ai-msg').pop().remove(); omaSay('ai', `<span style="color:var(--red)">${esc(e.message)}</span>`); }
  omaBusy = false;
};
/* rota antiga → abre o dock sobre o painel */
on('/assistente', async () => { setTimeout(() => { go('/' + homePath()); setTimeout(() => omaToggle(true), 250); }, 0); return '<div class="spinner"></div>'; });

/* ================================ notificações =============================
   v30 — sistema de notificações: cada tipo tem ícone e cor próprios; a
   "anatomia mista" mostra capa do curso quando a novidade é sobre um curso,
   o avatar de quem escreveu quando é uma mensagem, e sempre um selo redondo
   com o ícone do tipo no canto. Tempo real por SSE (com replay de eventos),
   queda automática para sondagem se o canal falhar e sincronia entre abas. */
const NTYPE = {
  cert:    { ic: 'cert',   tone: 'nv', lbl: 'Certificado' },
  curso:   { ic: 'book',   tone: 'nv', lbl: 'Curso' },
  aprov:   { ic: 'shield', tone: 'nv', lbl: 'Revisão de curso' },
  live:    { ic: 'live',   tone: 'no', lbl: 'Aula ao vivo' },
  conta:   { ic: 'money',  tone: 'nt', lbl: 'Pagamento' },
  venda:   { ic: 'money',  tone: 'nt', lbl: 'Venda' },
  aluno:   { ic: 'chat',   tone: 'no', lbl: 'Mensagem' },
  sistema: { ic: 'spark',  tone: 'nv', lbl: 'Aviso' },
};
const NCAT = { aprendizagem: 'Aprendizagem', aulas: 'Aulas', mensagens: 'Mensagens', pagamentos: 'Pagamentos', sistema: 'Sistema' };
const NCAT_DESC = {
  aprendizagem: 'Certificados, novas aulas e aprovações',
  aulas: 'Começo de diretos e lembretes de agenda',
  mensagens: 'Perguntas suas e respostas de professores',
  pagamentos: 'Matrículas, referências MULTICAIXA e vendas',
  sistema: 'Avisos importantes da academia',
};
const NTOAST = { live: 1, aluno: 1 }; /* só estas acordam um toast; o resto é badge silencioso */
const NM = { items: [], cats: [], naoLidas: 0, filtro: 'all', modo: 'lista', prefs: null, ultimoToast: 0, carregado: false };

/* tile com anatomia mista: capa do curso ▸ avatar do autor ▸ ícone do tipo, sempre com selo */
function notifTile(n) {
  const t = NTYPE[n.tipo] || NTYPE.sistema;
  const selo = `<i class="nm-badge t-${t.tone}" aria-hidden="true">${I[t.ic]}</i>`;
  const m = n.meta || {};
  const card = m.curso_id && CARD_BY_ID[m.curso_id];
  if (card) return `<span class="nm-thumb"><img src="media/${card}.jpg?v=70" alt="" loading="lazy" decoding="async">${selo}</span>`;
  if (m.actor) return `<span class="nm-av" style="background:${escAttr(m.actor_cor || 'var(--flame-2)')}">${escAttr(String(m.actor).split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase())}${selo}</span>`;
  return `<span class="nm-ic t-${t.tone}">${I[t.ic]}</span>`;
}
/* data local ("Hoje", "Ontem" ou "12 set") a partir do datetime UTC do servidor */
function notifDia(s) {
  if (!s) return '';
  const t = new Date(String(s).replace(' ', 'T') + 'Z');
  const hoje = new Date(); hoje.setHours(0, 0, 0, 0);
  const diff = Math.floor((hoje - new Date(t.getFullYear(), t.getMonth(), t.getDate())) / 864e5);
  if (diff <= 0) return 'Hoje';
  if (diff === 1) return 'Ontem';
  return t.toLocaleDateString('pt-PT', { day: 'numeric', month: 'short' });
}
function notifRow(n) {
  const t = NTYPE[n.tipo] || NTYPE.sistema;
  const m = n.meta || {};
  const extra = m.valor ? `<em class="nm-valor">+${Number(m.valor).toLocaleString('pt-AO')} Kz</em>` : '';
  return `<a class="nm-i ${n.lida ? '' : 'unread'}" href="${escAttr(n.link || '#/aluno')}" onclick="notifOne(${n.id})" title="${escAttr(new Date(String(n.criado_em).replace(' ', 'T') + 'Z').toLocaleString('pt-PT'))}">
    ${notifTile(n)}
    <span class="nm-tx"><b>${esc(n.titulo)}</b><p>${esc(n.texto || '')}</p><small>${esc(t.lbl)} · ${esc(relTime(n.criado_em))}</small></span>
    <span class="nm-side">${extra}${n.lida ? '' : '<i class="nm-dot"></i>'}</span></a>`;
}
function notifHtml() {
  const head = `<div class="nm-head"><b>Notificações${NM.naoLidas ? ` <i class="nm-count">${NM.naoLidas}</i>` : ''}</b>
    <span class="nm-acts"><button title="Preferências de notificações" aria-label="Preferências de notificações" onclick="notifPrefs()">${I.cog}</button></span></div>`;
  if (NM.modo === 'prefs') return head + notifPrefsHtml();
  const chips = `<div class="nm-chips" role="tablist">${['all', ...NM.cats].map(c =>
    `<button role="tab" aria-selected="${NM.filtro === c}" class="${NM.filtro === c ? 'on' : ''}" onclick="notifFiltro('${c}')">${c === 'all' ? 'Tudo' : esc(NCAT[c])}</button>`).join('')}</div>`;
  const itens = NM.items.filter(n => NM.filtro === 'all' || n.categoria === NM.filtro);
  const novas = itens.filter(n => !n.lida).slice(0, 8);
  const vistas = itens.filter(n => !novas.includes(n));
  let corpo = novas.length ? `<div class="nm-sep">Novidades</div>` + novas.map(notifRow).join('') : '';
  let ultimoDia = '';
  for (const n of vistas) {
    const dia = notifDia(n.criado_em);
    if (dia !== ultimoDia) { corpo += `<div class="nm-sep">${esc(dia)}</div>`; ultimoDia = dia; }
    corpo += notifRow(n);
  }
  if (!corpo) corpo = `<div class="nm-empty">${I.check}<p><b>Tudo em dia ✨</b><br>Nenhuma novidade ${NM.filtro !== 'all' ? 'em ' + esc(NCAT[NM.filtro]).toLowerCase() : 'por aqui'}.</p></div>`;
  const rodape = `<div class="nm-foot">${NM.naoLidas ? `<button onclick="notifReadAll()">Marcar todas como lidas</button>` : '<span>Sem novidades por ler</span>'}${itens.length >= 30 ? '<span>· últimos 30 itens</span>' : ''}</div>`;
  return head + chips + `<div class="nm-list">${corpo}</div>` + rodape;
}
function notifPrefsHtml() {
  if (!NM.prefs) return '<div class="nm-load">A carregar…</div>';
  return `<div class="nm-prefs-panel">${blobSvg()}
  <div class="nm-phead"><button title="Voltar" aria-label="Voltar às notificações" onclick="notifLista()">${I.back}</button>
    <div><b>Preferências</b><small>Escolha o que quer receber</small></div></div>
  ${Object.keys(NCAT).map(c => {
    const on = NM.prefs[c], bloqueada = c === 'sistema';
    return `<div class="nm-pref"><span class="nm-pref-ic t-${c === 'aulas' || c === 'mensagens' ? 'no' : c === 'pagamentos' ? 'nt' : 'nv'}">${I[NCAT_IC[c]]}</span>
      <div><b>${esc(NCAT[c])}</b><small>${esc(NCAT_DESC[c])}</small></div>
      <label class="nm-switch ${on ? 'on' : ''} ${bloqueada ? 'travada' : ''}"><input type="checkbox" ${on ? 'checked' : ''} ${bloqueada ? 'disabled' : ''} onchange="notifSetPref('${c}', this.checked)"><span></span>${bloqueada ? `<i class="nm-lock" title="Não pode ser desativada">${I.lock}</i>` : ''}</label></div>`;
  }).join('')}
  <p class="nm-prefs-nota">As novidades silenciadas deixam de aparecer na lista e no contador, mas ficam no histórico se voltar a ativá-las.</p></div>`;
}
/* ícone representativo de cada categoria (para o ecrã de preferências) */
const NCAT_IC = { aprendizagem: 'grad', aulas: 'live', mensagens: 'chat', pagamentos: 'money', sistema: 'spark' };

window.notifToggle = (ev) => {
  const dd = $('#notif-dd'); if (!dd || !dd.classList.contains('open')) return;
  notifOpen();
};
function notifSkeleton() {
  $('#notif-menu').innerHTML = `<div class="nm-head"><b>Notificações</b></div><div class="nm-list">${'<div class="nm-sk"><i></i><div><b></b><b class="w2"></b></div></div>'.repeat(3)}</div>`;
}
function notifOpen() {
  const menu = $('#notif-menu'); if (!menu) return;
  NM.modo = 'lista';
  if (!NM.carregado) notifSkeleton();
  else menu.innerHTML = notifHtml();
  api('/api/notificacoes').then(d => {
    NM.items = d.itens; NM.cats = d.cats; NM.naoLidas = d.naoLidas; NM.carregado = true;
    setNotifBadge(d.naoLidas);
    const dd = $('#notif-dd');
    if (dd && dd.classList.contains('open')) menu.innerHTML = notifHtml();
  }).catch(() => {
    const dd = $('#notif-dd');
    if (dd && dd.classList.contains('open')) menu.innerHTML = `<div class="nm-head"><b>Notificações</b></div><div class="nm-load">Não foi possível carregar. Verifique a ligação e tente novamente.</div>`;
  });
}
window.notifFiltro = (c) => { NM.filtro = c; const menu = $('#notif-menu'); if (menu) menu.innerHTML = notifHtml(); };
window.notifPrefs = () => {
  NM.modo = 'prefs'; const menu = $('#notif-menu'); if (!menu) return;
  if (!NM.prefs) menu.innerHTML = notifHtml();
  else menu.innerHTML = notifHtml();
  api('/api/notificacoes/prefs').then(d => { NM.prefs = d.prefs; if (NM.modo === 'prefs') menu.innerHTML = notifHtml(); }).catch(() => { });
};
window.notifLista = () => { NM.modo = 'lista'; const menu = $('#notif-menu'); if (menu) menu.innerHTML = notifHtml(); };
window.notifSetPref = async (c, on) => {
  if (NM.prefs) NM.prefs[c] = on;
  const menu = $('#notif-menu'); if (menu && NM.modo === 'prefs') menu.innerHTML = notifHtml();
  try {
    await api('/api/notificacoes/prefs', { method: 'POST', body: { categoria: c, ativo: on } });
    notifTick(); NM.carregado = false;
    if (NM.filtro === c && !on) NM.filtro = 'all';
    notifOpen();
    toast(on ? `Novidades de ${NCAT[c]} ativadas.` : `${NCAT[c]} silenciada na lista e no contador.`);
  } catch (e) { toast(e.message); NM.prefs[c] = !on; menu.innerHTML = notifHtml(); }
};
window.notifOne = (id) => {
  api('/api/notificacoes/lida', { method: 'POST', body: { id } }).then(() => { notifTick(); setTimeout(refreshNotifBadge, 400); }).catch(() => { });
};
window.notifReadAll = async () => {
  const antes = NM.items.map(n => ({ id: n.id, lida: n.lida }));
  NM.items.forEach(n => { n.lida = 1; }); NM.naoLidas = 0; setNotifBadge(0);
  const menu = $('#notif-menu'); if (menu) menu.innerHTML = notifHtml();
  try { await api('/api/notificacoes/ler-todas', { method: 'POST' }); notifTick(); }
  catch (e) { antes.forEach(a => { const n = NM.items.find(x => x.id === a.id); if (n) n.lida = a.lida; }); setNotifBadge(NM.items.filter(n => !n.lida).length); menu.innerHTML = notifHtml(); toast(e.message); }
};
function setNotifBadge(n, animar) {
  const b = $('#notif-n'); if (!b) return;
  const antes = parseInt(b.textContent, 10) || 0;
  b.hidden = !n; b.textContent = n > 9 ? '9+' : String(n);
  if (animar !== false && n > antes && n) { b.classList.remove('bounce'); void b.offsetWidth; b.classList.add('bounce'); }
}
async function refreshNotifBadge() {
  if (!S.user || document.hidden) return;
  try { const d = await api('/api/notificacoes'); NM.naoLidas = d.naoLidas; setNotifBadge(d.naoLidas); } catch (e) { }
}
/* aviso entre abas: quem marcou lida noutra janela faz esta atualizar-se */
function notifTick() { try { localStorage.setItem('oma_notif_tick', String(Date.now())); } catch { } }
window.addEventListener('storage', (e) => {
  if (e.key !== 'oma_notif_tick' || !S.user) return;
  refreshNotifBadge();
  const dd = $('#notif-dd'); if (dd && dd.classList.contains('open')) { NM.carregado = false; notifOpen(); }
});

/* ---------------- tempo real: SSE com replay + queda para sondagem ------------ */
let NT_ES = null, NT_FALHAS = 0, NT_POLL = null, NT_REDEB = 0;
function notifNova(item, naoLidas, replay) {
  if (typeof naoLidas === 'number') { NM.naoLidas = naoLidas; setNotifBadge(naoLidas); }
  if (replay) { /* reentrega do servidor: contar chega, não inundar a lista */ return; }
  if (NM.items.some(x => x.id === item.id)) return;
  NM.items.unshift(item);
  const menu = $('#notif-menu');
  if (menu && $('#notif-dd')?.classList.contains('open') && NM.modo === 'lista') menu.innerHTML = notifHtml();
  if (NTOAST[item.tipo] && !document.hidden && Date.now() - NM.ultimoToast > 15000) {
    NM.ultimoToast = Date.now(); toast(item.titulo);
  }
}
function notifPoll() {
  if (NT_POLL) return;
  NT_POLL = setInterval(refreshNotifBadge, 60000);
}
function startNotifStream() {
  if (!S.user || NT_ES) return;
  try { const ES = window.AMAEventSource || EventSource; NT_ES = new ES('/api/notificacoes/stream'); }
  catch { NT_ES = null; notifPoll(); return; }
  NT_ES.addEventListener('nova', (e) => {
    NT_FALHAS = 0;
    let p; try { p = JSON.parse(e.data); } catch { return; }
    notifNova(p.item, p.naoLidas, !!p.replay);
  });
  NT_ES.onopen = () => { if (NT_POLL) { clearInterval(NT_POLL); NT_POLL = null; } NT_FALHAS = 0; };
  NT_ES.onerror = () => {
    NT_FALHAS++;
    if (NT_ES && NT_ES.readyState === (window.AMAEventSource || EventSource).CLOSED) { NT_ES = null; notifPoll(); return; }
    if (NT_FALHAS >= 5) { try { NT_ES && NT_ES.close(); } catch { } NT_ES = null; notifPoll(); }
  };
}
document.addEventListener('visibilitychange', () => {
  if (document.hidden || !S.user) return;
  refreshNotifBadge();
  if (!NT_ES && NT_FALHAS < 5) { NT_FALHAS = 0; startNotifStream(); }
});
function notifLogin() { NM.carregado = false; refreshNotifBadge(); startNotifStream(); }
function notifLogout() {
  try { NT_ES && NT_ES.close(); } catch { }
  NT_ES = null; NT_FALHAS = 0;
  if (NT_POLL) { clearInterval(NT_POLL); NT_POLL = null; }
  NM.items = []; NM.prefs = null; NM.carregado = false; NM.naoLidas = 0; setNotifBadge(0, false);
}

/* ================================ tema ==================================== */
/* Preferência guardada só neste navegador. O claro vibrante (Viva Studio) é o
   padrão; o escuro usa azul-meia-noite com esmeralda e coral. */
const THEME_KEY = 'ama-theme-v2';
function syncThemeMeta(t) {
  const m = document.querySelector('meta[name="theme-color"]');
  if (m) m.setAttribute('content', t === 'dark' ? '#0f1320' : '#fdfbf7');
}
(function initTheme() {
  let t = 'light';
  try { t = localStorage.getItem(THEME_KEY) || 'light'; } catch { }
  const normT = t === 'dark' ? 'dark' : 'light';
  document.documentElement.dataset.theme = normT;
  syncThemeMeta(normT);
})();
const themeBtn = () => `<button class="theme-btn" type="button" title="Mudar para modo ${document.documentElement.dataset.theme === 'dark' ? 'claro' : 'escuro'}" aria-label="Alternar modo claro/escuro" onclick="themeToggle()"><svg class="sun" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg><svg class="moon" viewBox="0 0 24 24" aria-hidden="true"><path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8Z"/></svg></button>`;
window.themeToggle = () => {
  const next = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
  document.documentElement.dataset.theme = next;
  syncThemeMeta(next);
  try { localStorage.setItem(THEME_KEY, next); } catch { }
  render();
};

/* ================================ boot ==================================== */
async function boot() {
  /* A identidade é local, por isso pode ser lida sem esperar por nada. Pintar
     antes de qualquer promise evita o ecrã vazio inicial (principalmente na
     rota raiz, onde a página dependia de /api/me e do catálogo para aparecer). */
  try {
    const store = window.AMA_STORE;
    const local = store && typeof store.me === 'function' ? store.me() : null;
    S.user = local && store.publicUser ? store.publicUser(local) : null;
  } catch { }
  render();
  document.documentElement.dataset.amaBoot = '1';
  try {
    const { user } = await api('/api/me');
    if (user && user.id !== S.user?.id) { S.user = user; render(); }
  } catch { }
  if (S.user) { refreshNotifBadge(); startNotifStream(); }
  if (!window.__omaFab) { window.__omaFab = 1; }
}
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', boot, { once: true });
} else {
  boot();
}
window.S = S;

/* Camada offline: o service worker guarda o que o navegador já pediu e serve
   isso quando a rede falha — numa sala de aula sem internet a app continua a
   abrir, e passa a ser instalável no ecrã inicial. Depois do 'load' para não
   disputar a primeira pintura; um insucesso (file://, modo privado) não custa
   nada ao utilizador, por isso fica silencioso. */
window.addEventListener('load', () => {
  if (!('serviceWorker' in navigator) || !/^https?:$/.test(location.protocol)) return;
  navigator.serviceWorker.register('sw.js').catch(() => { });
});
