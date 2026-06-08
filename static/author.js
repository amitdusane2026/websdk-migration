/* Bottom-right author button -> About overlay (universal, all pages). */
(function () {
  var fab = document.getElementById('authorFab'), ov = document.getElementById('aboutOverlay'), x = document.getElementById('aboutClose');
  if (!fab || !ov) return;
  function open() { ov.hidden = false; } function close() { ov.hidden = true; }
  fab.addEventListener('click', open);
  if (x) x.addEventListener('click', close);
  ov.addEventListener('click', function (e) { if (e.target === ov) close(); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && !ov.hidden) close(); });
})();
