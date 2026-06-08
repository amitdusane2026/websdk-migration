/* Migration-world shell behavior: theme (authoritative over device), mobile rail,
   the "Why" slide-over panel, and print. Ported from the single-file app. */
(function () {
  var docEl = document.documentElement, body = document.body;

  var tb = document.getElementById('themeBtn');
  function applyTheme(t) { docEl.setAttribute('data-theme', t); docEl.style.colorScheme = t; try { localStorage.setItem('site-theme', t); } catch (e) {} }
  if (tb) tb.addEventListener('click', function () { applyTheme(docEl.getAttribute('data-theme') === 'dark' ? 'light' : 'dark'); });

  var mb = document.getElementById('menuBtn'), scrim = document.getElementById('scrim');
  function closeNav() { body.classList.remove('nav-open'); }
  if (mb) mb.addEventListener('click', function () { body.classList.toggle('nav-open'); });

  var panel = document.getElementById('panel'), pBody = document.getElementById('panelBody'),
      pKind = document.getElementById('panelKind'), pClose = document.getElementById('panelClose');
  function openPanel() { body.classList.add('panel-open'); if (panel) panel.setAttribute('aria-hidden', 'false'); }
  function closePanel() { body.classList.remove('panel-open'); if (panel) panel.setAttribute('aria-hidden', 'true'); }
  if (pClose) pClose.addEventListener('click', closePanel);

  var idx = null, loading = false;
  function ensureIdx(cb) {
    if (idx) { cb(); return; }
    if (loading) return; loading = true;
    fetch(window.SEARCH_INDEX || '/index.json').then(function (r) { return r.json(); })
      .then(function (d) { idx = d; loading = false; cb(); }).catch(function () { loading = false; });
  }
  function firstSentences(t, n) { var p = (t || '').split(/(?<=[.!?])\s+/); return p.slice(0, n || 3).join(' '); }
  function openKB(id) {
    ensureIdx(function () {
      var e = null, i;
      if (idx) for (i = 0; i < idx.length; i++) { if (idx[i].url && idx[i].url.indexOf('/kb/' + id + '/') !== -1) { e = idx[i]; break; } }
      if (!e) return;
      if (pKind) pKind.textContent = e.group || 'Knowledge Base';
      pBody.innerHTML = '<h2>' + e.title + '</h2><p>' + firstSentences(e.text, 3) + '</p>' +
        '<div class="panel-foot"><a href="' + e.url + '">Read the full topic &rarr;</a></div>';
      openPanel();
    });
  }


  var refsDoc = null, refsLoading = false;
  function ensureRefs(cb) {
    if (refsDoc) { cb(); return; }
    if (refsLoading) return; refsLoading = true;
    fetch('/web-sdk-migration/references/').then(function (r) { return r.text(); })
      .then(function (html) { refsDoc = new DOMParser().parseFromString(html, 'text/html'); refsLoading = false; cb(); })
      .catch(function () { refsLoading = false; });
  }
  function openRef(n) {
    ensureRefs(function () {
      var li = refsDoc && refsDoc.getElementById('ref-' + n);
      if (!li) return;
      if (pKind) pKind.textContent = 'Reference';
      pBody.innerHTML = '<h2>Reference [' + n + ']</h2>' + li.innerHTML +
        '<div class="panel-foot"><a href="/web-sdk-migration/references/#ref-' + n + '">Open in the full reference list &rarr;</a></div>';
      openPanel();
    });
  }

  document.addEventListener('click', function (ev) {
    var a = ev.target.closest ? ev.target.closest('a.why[data-kb]') : null;
    if (a) { ev.preventDefault(); openKB(a.getAttribute('data-kb')); return; }
    var c = ev.target.closest ? ev.target.closest('a.cite') : null;
    if (c) { ev.preventDefault(); var n = c.getAttribute('data-ref') || (c.getAttribute('href') || '').replace(/.*#ref-/, ''); openRef(n); return; }
    if (ev.target === scrim) { closePanel(); closeNav(); }
  });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') { closePanel(); closeNav(); } });

  var prb = document.getElementById('printBtn');
  if (prb) prb.addEventListener('click', function () {
    var av = document.querySelector('.main .view.active'), pb = document.getElementById('printBody'), ctx = document.getElementById('printCtx'), h1 = document.querySelector('.main h1');
    if (pb && av) pb.innerHTML = av.innerHTML;
    if (ctx) ctx.textContent = h1 ? h1.textContent : '';
    window.print();
  });
})();
