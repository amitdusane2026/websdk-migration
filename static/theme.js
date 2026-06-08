/* Site-wide theme toggle. Pre-paint script in <head> sets the initial theme to avoid
   flash; this only handles the click + persistence. Re-wired from the app to work
   across every page (state lives in localStorage, not in one file's memory). */
(function () {
  var btn = document.getElementById('themeBtn');
  if (!btn) return;
  function current() { return document.documentElement.getAttribute('data-theme') === 'dark' ? 'dark' : 'light'; }
  function set(t) {
    document.documentElement.setAttribute('data-theme', t);
    try { localStorage.setItem('site-theme', t); } catch (e) {}
    btn.setAttribute('aria-pressed', t === 'dark' ? 'true' : 'false');
  }
  btn.addEventListener('click', function () { set(current() === 'dark' ? 'light' : 'dark'); });
})();
