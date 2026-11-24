/* AMA / CEU — duas marcas, uma aplicação.
   / (ou ?marca=ama)  → AMA — Aristides Miguel Academy (verde esmeralda)
   /ceu (ou ?marca=ceu) → CEU Academy (azul universitário #00217E + #00A4DC, alinhado com ceu.ao) */
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
  if (metaDesc) metaDesc.setAttribute('content', 'CEU Academy: cursos universitários, cartão de estudante digital e projetor PDF para slides com IA e 3D. https://ceu.ao/');
  var metaTheme = document.querySelector('meta[name="theme-color"]');
  if (metaTheme) metaTheme.setAttribute('content', '#00217e');
  var appleTitle = document.querySelector('meta[name="apple-mobile-web-app-title"]');
  if (appleTitle) appleTitle.setAttribute('content', 'CEU');

  var corner = document.createElement('a');
  corner.className = 'ceu-corner';
  corner.href = 'https://ceu.ao/';
  corner.target = '_blank';
  corner.rel = 'noopener noreferrer';
  corner.textContent = 'ceu.ao ↗';
  corner.setAttribute('aria-label', 'Abrir o portal oficial CEU em ceu.ao');
  document.body.appendChild(corner);

  function syncChromeVisibility() {
    var onProjector = /^#\/projetor/.test(location.hash || '');
    var inFs = !!document.querySelector('.pj-workspace.is-fs-overlay');
    var hasFab = !!document.getElementById('oma-fab');
    corner.hidden = onProjector || inFs || hasFab;
    credit.hidden = inFs;
  }

  function rewriteText(node) {
    if (!node) return;
    var walker = document.createTreeWalker(node, NodeFilter.SHOW_TEXT, null, false);
    var seen = [];
    while (walker.nextNode()) seen.push(walker.currentNode);
    seen.forEach(function (n) {
      var v = n.nodeValue || '';
      var out = v;
      if (/Aristides Miguel Academy/i.test(out)) out = out.replace(/Aristides Miguel Academy/gi, 'CEU Academy');
      if (/ARISTIDES MIGUEL/g.test(out)) out = out.replace(/ARISTIDES MIGUEL/g, 'ACADEMY');
      if (/N[úu]cleo\s+AMA/i.test(out)) out = out.replace(/N[úu]cleo\s+AMA/gi, 'Núcleo CEU');
      if (/Kuzaya\s+AI/i.test(out)) out = out.replace(/Kuzaya\s+AI/gi, 'CEU AI');
      if (/ola@ama\.ao/i.test(out)) out = out.replace(/ola@ama\.ao/gi, 'geral@ceu.ao');
      if (/\bAMA\b/g.test(out)) out = out.replace(/\bAMA\b/g, 'CEU');
      if (out !== v) n.nodeValue = out;
    });
  }

  function patchBrand() {
    var app = document.getElementById('app') || document.body;
    rewriteText(app);
    document.querySelectorAll('.lw').forEach(function (el) {
      var b = el.querySelector('b');
      if (b) b.textContent = 'ACADEMY';
      Array.from(el.childNodes).forEach(function (n) {
        if (n.nodeType === 3 && n.nodeValue && n.nodeValue.trim()) n.nodeValue = n.nodeValue.replace(/\bAMA\b/g, 'CEU');
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
      if (t && /\bAMA\b|Aristides Miguel/i.test(t)) {
        el.setAttribute('title', t.replace(/Aristides Miguel Academy/gi, 'CEU Academy').replace(/\bAMA\b/g, 'CEU'));
      }
    });
    document.querySelectorAll('a.logo,a.brand').forEach(function (a) { a.setAttribute('href', '#/ceu-inicio'); });
    document.querySelectorAll('a[href*="ama.ao"]').forEach(function (a) {
      a.setAttribute('href', 'mailto:geral@ceu.ao');
      if (a.textContent && a.textContent.indexOf('ama.ao') >= 0) a.textContent = a.textContent.replace(/ola@ama\.ao/gi, 'geral@ceu.ao');
    });
    document.querySelectorAll('.pj-foot-brand').forEach(function (el) {
      el.textContent = el.textContent.replace(/\bAMA\b/g, 'CEU');
    });
    syncChromeVisibility();
  }

  window.addEventListener('hashchange', function () {
    var h = location.hash || '';
    if (!h || h === '#/') location.hash = '#/ceu-inicio';
    patchBrand();
  });
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
