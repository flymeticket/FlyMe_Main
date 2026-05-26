// Inline script injected before <body> renders. Reads the saved preference
// and applies the `.dark` class to <html> synchronously, so the user never
// sees a flash of the wrong theme. Runs once per page load.
//
// DEFAULT: light mode. We *don't* follow `prefers-color-scheme` for first-time
// visitors — the marketing brand reads better against bright surfaces. Users
// can still switch via the toggle in the navbar; their choice is persisted in
// localStorage.

export function ThemeInitScript() {
  const code = `
(function() {
  try {
    var stored = localStorage.getItem('theme');
    // Explicit dark preference only — system "dark" no longer flips us.
    var dark = stored === 'dark';
    if (dark) document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
  } catch (e) {}
})();
  `.trim();
  return <script dangerouslySetInnerHTML={{ __html: code }} />;
}
