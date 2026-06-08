/* Site search. Lazy-loads the build-time index (window.SEARCH_INDEX), filters entirely
   in the browser, no external service or tracker. Open with the topbar button or "/" or
   Cmd/Ctrl-K; Esc closes; Up/Down select; Enter opens. */
(function () {
  var overlay = document.getElementById('searchOverlay');
  var input = document.getElementById('searchInput');
  var results = document.getElementById('searchResults');
  var btn = document.getElementById('searchBtn');
  if (!overlay || !input || !results) return;

  var index = null, loading = false, sel = -1, current = [];

  function load() {
    if (index || loading) return;
    loading = true;
    fetch(window.SEARCH_INDEX || '/index.json')
      .then(function (r) { return r.json(); })
      .then(function (d) { index = d; loading = false; if (overlay.hidden === false) run(input.value); })
      .catch(function () { loading = false; results.innerHTML = '<div class="search-hint">Search index could not be loaded.</div>'; });
  }
  function open() {
    overlay.hidden = false; load();
    setTimeout(function () { input.focus(); input.select(); }, 0);
  }
  function close() { overlay.hidden = true; sel = -1; }

  function esc(s) { return s.replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function escRe(s) { return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }

  function snippet(text, tokens) {
    var lc = text.toLowerCase(), at = -1;
    for (var i = 0; i < tokens.length; i++) { var p = lc.indexOf(tokens[i]); if (p !== -1 && (at === -1 || p < at)) at = p; }
    if (at === -1) at = 0;
    var start = Math.max(0, at - 50), end = Math.min(text.length, at + 130);
    var s = (start > 0 ? '… ' : '') + text.slice(start, end) + (end < text.length ? ' …' : '');
    s = esc(s);
    tokens.forEach(function (t) { if (t) s = s.replace(new RegExp('(' + escRe(t) + ')', 'ig'), '<mark>$1</mark>'); });
    return s;
  }

  function run(q) {
    q = (q || '').trim().toLowerCase();
    sel = -1;
    if (!q) { results.innerHTML = '<div class="search-hint">Type to search the guide.</div>'; current = []; return; }
    if (!index) { results.innerHTML = '<div class="search-hint">Loading…</div>'; return; }
    var tokens = q.split(/\s+/).filter(Boolean);
    var scored = [];
    index.forEach(function (e) {
      var title = e.title.toLowerCase(), text = (e.text || '').toLowerCase(), score = 0, all = true;
      tokens.forEach(function (t) {
        var inTitle = title.indexOf(t) !== -1, inText = text.indexOf(t) !== -1;
        if (!inTitle && !inText) all = false;
        if (inTitle) score += 10;
        if (inText) score += 1;
      });
      if (all) scored.push({ e: e, score: score });
    });
    scored.sort(function (a, b) { return b.score - a.score; });
    current = scored.slice(0, 12).map(function (x) { return x.e; });
    if (!current.length) { results.innerHTML = '<div class="search-hint">No matches for &ldquo;' + esc(q) + '&rdquo;.</div>'; return; }
    results.innerHTML = current.map(function (e, i) {
      var badge = (e.type || '').toLowerCase();
      var label = e.type + (e.group ? ' · ' + e.group : '');
      return '<a class="sresult" href="' + e.url + '" data-i="' + i + '">' +
        '<span class="sbadge ' + badge + '">' + esc(e.type) + '</span>' +
        '<span class="sbody"><span class="stitle">' + esc(e.title) + '</span>' +
        '<span class="ssnip">' + snippet(e.text || '', tokens) + '</span></span></a>';
    }).join('');
  }

  function move(d) {
    var items = results.querySelectorAll('.sresult');
    if (!items.length) return;
    sel = (sel + d + items.length) % items.length;
    items.forEach(function (el, i) { el.classList.toggle('sel', i === sel); });
    items[sel].scrollIntoView({ block: 'nearest' });
  }
  function go() {
    var items = results.querySelectorAll('.sresult');
    if (!items.length) return;
    var el = sel >= 0 ? items[sel] : items[0];
    if (el) window.location.href = el.getAttribute('href');
  }

  if (btn) btn.addEventListener('click', open);
  input.addEventListener('input', function () { run(input.value); });
  overlay.addEventListener('click', function (e) { if (e.target === overlay) close(); });
  document.addEventListener('keydown', function (e) {
    if ((e.key === '/' || ((e.metaKey || e.ctrlKey) && (e.key === 'k' || e.key === 'K'))) &&
        overlay.hidden && !/^(INPUT|TEXTAREA)$/.test(document.activeElement.tagName)) {
      e.preventDefault(); open(); return;
    }
    if (overlay.hidden) return;
    if (e.key === 'Escape') { e.preventDefault(); close(); }
    else if (e.key === 'ArrowDown') { e.preventDefault(); move(1); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); move(-1); }
    else if (e.key === 'Enter') { e.preventDefault(); go(); }
  });
})();
