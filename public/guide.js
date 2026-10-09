// Use the editor's saved appearance without changing the reader's language.
(function () {
  var media = window.matchMedia('(prefers-color-scheme: dark)');
  function apply() {
    var theme = 'auto';
    try { theme = localStorage.getItem('invite-maker-theme') || 'auto'; } catch (_) {}
    document.documentElement.setAttribute('data-mantine-color-scheme', theme === 'light' || theme === 'dark' ? theme : media.matches ? 'dark' : 'light');
  }
  apply();
  media.addEventListener('change', apply);
  window.addEventListener('storage', function (event) { if (event.key === 'invite-maker-theme') apply(); });
})();
