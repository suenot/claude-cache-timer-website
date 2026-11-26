# cache-timer website

Landing page for [claude-cache-timer](https://github.com/suenot/claude-cache-timer), the Claude Code plugin that shows the time left on the 1-hour prompt cache, auto-compacts an idle session before it expires and keeps the cache warm.

Static site: HTML, CSS and JS, with GSAP and ScrollTrigger from a CDN. No build step. The visual system follows the Manipulator Warehouse site (Space Grotesk and JetBrains Mono, lime accent, light and dark themes, EN and RU).

Run locally:

```
python3 -m http.server 8000
```

Files: `index.html` (English text, source of truth), `i18n.ru.js` (Russian dictionary), `main.js` (canvases and scroll animations), `styles.css`, `theme.js` (light and dark), `i18n.js` (language switch). Copy decisions are recorded in `docs/copy-notes.md`.

Deploy: Vercel, team `kupi`, project `claude-cache-timer`, domain https://claude-cache-timer.suenot.com (Cloudflare CNAME to `cname.vercel-dns.com`, DNS-only); a push to `main` deploys.
