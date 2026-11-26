// EN/RU switch for the site and the console. English lives in the HTML and JS (source of truth);
// Russian comes from dictionaries registered with CTI18n.add({key: html}). Elements opt in with
// data-i18n="key" (innerHTML), data-i18n-aria / -alt / -title / -content / -placeholder (attributes).
// Language: ?lang= first, then the saved choice (localStorage mw-lang), then the browser language.
// Switching saves the choice and reloads, so canvases and scroll animations rebuild in the new language.
window.CTI18n = (() => {
  const LANGS = ['en', 'ru'];
  const store = { get() { try { return localStorage.getItem('ct-lang'); } catch { return null; } },
    set(v) { try { localStorage.setItem('ct-lang', v); return true; } catch { return false; } } };
  const q = new URLSearchParams(location.search).get('lang');
  const nav = (navigator.languages || [navigator.language || '']).join(' ').toLowerCase();
  let lang = LANGS.includes(q) ? q : LANGS.includes(store.get()) ? store.get() : /(^|\s)ru/.test(nav) ? 'ru' : 'en';
  if (LANGS.includes(q)) store.set(q);
  document.documentElement.lang = lang;
  const RU = {};
  const ATTRS = [['i18nAria', 'aria-label'], ['i18nAlt', 'alt'], ['i18nTitle', 'title'], ['i18nContent', 'content'], ['i18nPlaceholder', 'placeholder']];

  const t = (key, en) => lang === 'ru' && RU[key] != null ? RU[key] : en;

  function apply(root = document) {
    if (lang !== 'ru') return;
    root.querySelectorAll('[data-i18n]').forEach(e => { const v = RU[e.dataset.i18n]; if (v != null) e.innerHTML = v; });
    ATTRS.forEach(([d, a]) => root.querySelectorAll(`[data-${d.replace(/[A-Z]/g, c => '-' + c.toLowerCase())}]`)
      .forEach(e => { const v = RU[e.dataset[d]]; if (v != null) e.setAttribute(a, v); }));
  }

  function set(l) {
    if (!LANGS.includes(l) || l === lang) return;
    const saved = store.set(l), u = new URL(location.href);
    if (u.searchParams.has('lang') || !saved) { u.searchParams.set('lang', l); history.replaceState(history.state, '', u); }
    location.reload();
  }

  function toggle() {
    const slot = document.getElementById('langSlot');
    if (!slot || slot.firstChild) return;
    const other = lang === 'ru' ? 'en' : 'ru', b = document.createElement('button');
    b.type = 'button'; b.className = 'lang-btn'; b.textContent = other.toUpperCase();
    b.setAttribute('aria-label', lang === 'ru' ? 'Switch to English' : 'Переключить на русский');
    b.title = b.getAttribute('aria-label');
    b.addEventListener('click', () => set(other));
    slot.appendChild(b);
  }

  function add(dict) { Object.assign(RU, dict); apply(); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', toggle); else toggle();
  return { get lang() { return lang; }, t, add, apply, set };
})();
// Short alias for renderers: T('key', 'English text').
window.T = (k, en) => window.CTI18n.t(k, en);
// Counted noun: TN('key', n, 'English') -> RU dictionary holds [one, few, many] (1 монета, 2 монеты, 5 монет).
window.TN = (k, n, en) => {
  const f = window.CTI18n.t(k, null);
  if (!Array.isArray(f)) return en;
  const a = Math.abs(Math.trunc(Number(n) || 0)), d = a % 10, h = a % 100;
  return f[d === 1 && h !== 11 ? 0 : d >= 2 && d <= 4 && (h < 12 || h > 14) ? 1 : 2];
};
