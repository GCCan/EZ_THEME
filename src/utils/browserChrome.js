// Safari samples the document background; older browsers also use theme-color.
export function syncBrowserChrome(isDefaultLanding) {
  const root = document.documentElement;
  const isDark = document.body.classList.contains('dark-theme');
  const background = isDefaultLanding
    ? (isDark ? '#090e13' : '#f5f8f6')
    : getComputedStyle(root).getPropertyValue('--background-color').trim();

  if (!background) return;
  root.dataset.browserChrome = isDefaultLanding ? 'landing' : 'page';
  if (root.style.getPropertyValue('--browser-background-color') !== background) {
    root.style.setProperty('--browser-background-color', background);
  }
  const colorScheme = isDark ? 'dark' : 'light';
  if (root.style.colorScheme !== colorScheme) root.style.colorScheme = colorScheme;
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.setAttribute('content', background);
}
