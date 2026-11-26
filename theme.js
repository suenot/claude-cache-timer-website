// Light / dark theme for the site and the console. Loaded synchronously in <head> so the page
// never flashes the wrong theme. Choice: saved toggle (localStorage mw-theme), else the system
// setting, which is followed live until the user picks one. Sets html[data-theme], updates
// <meta name=theme-color> and fires a 'ct-theme' event so canvases can re-read their colors.
// The toggle button goes right before #langSlot (site nav and console bar).
window.CTTheme = (() => {
  const root = document.documentElement;
  const store = { get() { try { return localStorage.getItem('ct-theme'); } catch { return null; } },
    set(v) { try { localStorage.setItem('ct-theme', v); } catch { /* private mode: session only */ } } };
  const mq = window.matchMedia ? matchMedia('(prefers-color-scheme: light)') : null;
  const valid = v => v === 'light' || v === 'dark';
  const system = () => (mq && mq.matches ? 'light' : 'dark');
  let theme = valid(store.get()) ? store.get() : system();
  const SUN = '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="4.2"/><path d="M12 2.5v2.2M12 19.3v2.2M2.5 12h2.2M19.3 12h2.2M5.3 5.3l1.6 1.6M17.1 17.1l1.6 1.6M5.3 18.7l1.6-1.6M17.1 6.9l1.6-1.6"/></svg>';
  const MOON = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5z"/></svg>';

  function label() {
    const ru = root.lang === 'ru', toLight = theme === 'dark';
    return ru ? (toLight ? 'Включить светлую тему' : 'Включить темную тему') : (toLight ? 'Switch to light theme' : 'Switch to dark theme');
  }
  function paint() {
    const b = document.getElementById('themeBtn');
    if (!b) return;
    b.innerHTML = theme === 'dark' ? SUN : MOON;
    b.setAttribute('aria-label', label()); b.title = label();
  }
  function apply(t, fire) {
    theme = t; root.dataset.theme = t; root.style.colorScheme = t;
    const m = document.querySelector('meta[name="theme-color"]');
    if (m) m.content = t === 'light' ? '#f4f5f1' : '#07080a';
    paint();
    if (fire) window.dispatchEvent(new CustomEvent('ct-theme', { detail: t }));
  }
  function set(t) { if (!valid(t) || t === theme) return; store.set(t); apply(t, true); }
  function button() {
    const slot = document.getElementById('langSlot');
    if (!slot || document.getElementById('themeBtn')) return;
    const b = document.createElement('button');
    b.type = 'button'; b.id = 'themeBtn'; b.className = 'theme-btn';
    b.addEventListener('click', () => set(theme === 'dark' ? 'light' : 'dark'));
    slot.parentNode.insertBefore(b, slot);
    paint();
  }

  apply(theme, false);
  if (mq) {
    const follow = () => { if (!valid(store.get())) apply(system(), true); };
    mq.addEventListener ? mq.addEventListener('change', follow) : mq.addListener(follow);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', button); else button();
  return { get theme() { return theme; }, set };
})();
