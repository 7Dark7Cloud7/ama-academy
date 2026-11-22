/* AMA / CEU — duas marcas, uma aplicação.
   / (ou ?marca=ama)  → AMA — Aristides Miguel Academy (verde, identidade completa)
   /ceu (ou ?marca=ceu) → CEU · Universidade (azul, foco universitário, link ceu.ao) */
(function () {
  'use strict';
  var qs = new URLSearchParams(location.search);
  var path = location.pathname.replace(/\/+$/, '');
  var root = document.documentElement;
  var isCeu = root.dataset.brand === 'ceu' || qs.get('marca') === 'ceu' || /(^|\/)ceu$/.test(path);
  root.dataset.brand = isCeu ? 'ceu' : 'ama';

  var credit = document.createElement('div');
  credit.className = 'hf-credit';
  credit.innerHTML = 'APP FEITO PELA <b>HORIZONTE FUTURO</b>';
  document.body.appendChild(credit);

  if (!isCeu) return;

  document.title = 'CEU Academy — Cursos para universitários';
  var metaDesc = document.querySelector('meta[name="description"]');
  if (metaDesc) metaDesc.setAttribute('content', 'CEU Academy: cursos de Matemática, Física e estudo para universitários, cartão de estudante digital e slides com IA. https://ceu.ao/');
  var metaTheme = document.querySelector('meta[name="theme-color"]');
  if (metaTheme) metaTheme.setAttribute('content', '#0b1f44');
  var appleTitle = document.querySelector('meta[name="apple-mobile-web-app-title"]');
  if (appleTitle) appleTitle.setAttribute('content', 'CEU');

  var corner = document.createElement('a');
  corner.className = 'ceu-corner';
  corner.href = 'https://ceu.ao/';
  corner.target = '_blank';
  corner.rel = 'noopener noreferrer';
  corner.textContent = 'CEU Academy ↗';
  corner.setAttribute('aria-label', 'Abrir o site da CEU Academy');
  document.body.appendChild(corner);

  function rewriteText(node) {
    if (!node) return;
    var walker = document.createTreeWalker(node, NodeFilter.SHOW_TEXT, null, false);
    var seen = [];
    while (walker.nextNode()) seen.push(walker.currentNode);
    seen.forEach(function (n) {
      var v = n.nodeValue || '';
      if (v.indexOf('Aristides Miguel Academy') >= 0) n.nodeValue = v.replace('Aristides Miguel Academy', 'Universidade CEU');
      if (/N[úu]cleo\s+AMA/i.test(v)) n.nodeValue = v.replace(/N[úu]cleo\s+AMA/gi, 'Núcleo CEU');
      if (v.indexOf('ola@ama.ao') >= 0) n.nodeValue = v.replace(/ola@ama\.ao/g, 'geral@ceu.ao');
      if (v.indexOf('AMA') >= 0) n.nodeValue = v.replace(/AMA/g, 'CEU');
    });
  }

  function patchBrand() {
    var app = document.getElementById('app') || document.body;
    rewriteText(app);
    document.querySelectorAll('.lw').forEach(function (el) {
      var b = el.querySelector('b');
      if (b) b.textContent = 'ACADEMY';
      Array.from(el.childNodes).forEach(function (n) {
        if (n.nodeType === 3 && n.nodeValue && n.nodeValue.trim()) n.nodeValue = n.nodeValue.replace(/AMA/g, 'CEU');
      });
      var chip = el.parentElement && el.parentElement.querySelector('.logo-chip');
      if (chip && !chip.querySelector('.ceu-logo-img')) {
        chip.innerHTML = '<img src="assets/ceu-logo.png?v=1" alt="CEU" class="ceu-logo-img">';
      }
    });
    document.querySelectorAll('.logo-chip').forEach(function (chip) {
      if (!chip.querySelector('.ceu-logo-img')) {
        chip.innerHTML = '<img src="assets/ceu-logo.png?v=1" alt="CEU" class="ceu-logo-img">';
      }
    });
    document.querySelectorAll('.brand div').forEach(function (div) {
      var b = div.querySelector('b');
      if (b) b.textContent = 'CEU';
      var sub = div.querySelector('span');
      if (sub) sub.textContent = 'ACADEMY';
    });
    document.querySelectorAll('[title]').forEach(function (el) {
      var t = el.getAttribute('title');
      if (t && t.indexOf('AMA') >= 0) el.setAttribute('title', t.replace(/AMA/g, 'CEU'));
    });
    document.querySelectorAll('a.logo,a.brand').forEach(function (a) { a.setAttribute('href', '#/ceu-inicio'); });
    document.querySelectorAll('.pj-foot-brand').forEach(function (el) {
      el.textContent = el.textContent.replace(/AMA/g, 'CEU');
    });
  }

  window.addEventListener('hashchange', function () {
    var h = location.hash || '';
    if (!h || h === '#/') location.hash = '#/ceu-inicio';
    patchBrand();
  });
  // A rota /ceu-inicio só existe depois de ama-ceu.js correr: esperar o load.
  window.addEventListener('load', function () {
    var h = location.hash || '';
    if (!h || h === '#/') location.hash = '#/ceu-inicio';
    patchBrand();
  });
  setTimeout(function () {
    var h = location.hash || '';
    if (!h || h === '#/') location.hash = '#/ceu-inicio';
    patchBrand();
  }, 300);
  var target = document.getElementById('app') || document.body;
  var pending = false;
  var observer = new MutationObserver(function () {
    if (pending) return;
    pending = true;
    setTimeout(function () { pending = false; patchBrand(); }, 60);
  });
  observer.observe(target, { childList: true, subtree: true, characterData: true });
  setTimeout(patchBrand, 0);
  setTimeout(patchBrand, 600);
})();
