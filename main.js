(() => {
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const T = window.T || ((k, en) => en);
const G = window.gsap, ST = window.ScrollTrigger;
if (G && ST) G.registerPlugin(ST);

// Canvas palette comes from the CSS tokens, so canvases follow the light/dark theme.
const C = {};
function readPalette() {
  const cs = getComputedStyle(document.documentElement), v = n => cs.getPropertyValue('--' + n).trim();
  for (const k of ['acc', 'hot', 'cool', 'amb', 'dim', 'line', 'ink', 'ink2', 'bg', 'bg2']) C[k] = v(k);
  for (const k of ['acc', 'hot', 'cool', 'dim', 'ink']) C[k + 'R'] = v(k + '-rgb');
  C.ambR = C.amb.startsWith('#') ? hexRgb(C.amb) : '255,176,61';
}
function hexRgb(h) { const n = parseInt(h.slice(1), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255].join(','); }
readPalette();
window.addEventListener('ct-theme', readPalette);
const TAU = Math.PI * 2;
const MONO = '"JetBrains Mono", ui-monospace, monospace';

// the plugin's own formatting (hooks/register.tsx)
const fmt = ms => { const s = Math.max(0, Math.floor(ms / 1000)), m = Math.floor(s / 60); return m >= 60 ? Math.floor(m / 60) + 'h ' + (m % 60) + 'm' : m + 'm ' + (s % 60) + 's'; };
const MIN = 60000, TTL = 60 * MIN;
function bandText(age, extra = true) {
  const ago = T('b.ago', 'Last reply {a} ago').replace('{a}', fmt(age));
  if (age >= TTL) return ago + ' · ' + T('b.exp', 'cache expired');
  let s = ago + ' · ' + T('b.left', 'cache {l} left').replace('{l}', fmt(TTL - age));
  if (extra && age < 55 * MIN) s += ' · ' + T('b.cmp', 'auto-compact in {m}').replace('{m}', fmt(55 * MIN - age));
  return s;
}
const bandClass = age => age >= TTL ? 'cold' : TTL - age < 10 * MIN ? 'warn' : 'ok';
function paintBand(el, age, extra) { el.textContent = bandText(age, extra); el.className = el.className.replace(/\b(ok|warn|cold)\b/g, '').trim() + ' ' + bandClass(age); }

function setup(canvas) {
  const ctx = canvas.getContext('2d'), o = { canvas, ctx, w: 0, h: 0 };
  const fit = () => {
    const r = canvas.getBoundingClientRect(), d = Math.min(devicePixelRatio || 1, 2);
    o.w = r.width; o.h = r.height;
    canvas.width = Math.max(1, r.width * d); canvas.height = Math.max(1, r.height * d);
    ctx.setTransform(d, 0, 0, d, 0, 0);
  };
  fit(); new ResizeObserver(fit).observe(canvas);
  return o;
}
// draw(t) only while the element is on screen
function loop(el, draw) {
  let on = false, raf = 0;
  const tick = t => { draw(t / 1000); raf = requestAnimationFrame(tick); };
  new IntersectionObserver(([e]) => {
    if (e.isIntersecting && !on) { on = true; raf = requestAnimationFrame(tick); }
    else if (!e.isIntersecting && on) { on = false; cancelAnimationFrame(raf); }
  }).observe(el);
}
const lerp = (a, b, k) => a + (b - a) * k;
const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const ease = k => 1 - Math.pow(1 - clamp(k), 3);

// ---------- logo: inline SVG, stroke drawn on load ----------
fetch('assets/logo.svg').then(r => r.text()).then(svg => {
  ['navLogo', 'heroLogo', 'footLogo'].forEach(id => { const e = document.getElementById(id); if (e) e.innerHTML = svg; });
  if (reduce || !G) return;
  $$('#heroLogo path').forEach((p, i) => {
    const L = p.getTotalLength();
    G.fromTo(p, { strokeDasharray: L, strokeDashoffset: L }, { strokeDashoffset: 0, duration: 1.6, delay: .2 + i * .18, ease: 'power2.inOut' });
  });
}).catch(() => {});

// ---------- scroll progress ----------
const prog = $('#progress');
addEventListener('scroll', () => {
  const m = document.documentElement.scrollHeight - innerHeight;
  prog.style.transform = 'scaleX(' + (m > 0 ? scrollY / m : 0) + ')';
}, { passive: true });

// ---------- hero entrance ----------
if (G && !reduce) {
  G.from('.hero .kicker', { opacity: 0, y: 16, duration: .8, delay: .3 });
  G.from('#heroTitle .ln > span', { yPercent: 110, duration: 1.2, stagger: .12, delay: .35, ease: 'expo.out' });
  G.from('#heroLead', { opacity: 0, y: 24, duration: 1, delay: .8 });
  G.from('.hero-term', { opacity: 0, y: 40, scale: .97, duration: 1.1, delay: 1, ease: 'expo.out' });
  G.from('.hero-cta', { opacity: 0, y: 20, duration: .8, delay: 1.3 });
}

// ---------- hero canvas: a field of context cells that cool down unless a reply rewarms them ----------
(() => {
  const cv = setup($('#heroCanvas')), { ctx } = cv;
  const S = 16;
  let cols = 0, rows = 0, heat = new Float32Array(0);
  const mouse = { x: -1e4, y: -1e4 };
  addEventListener('pointermove', e => { mouse.x = e.clientX; mouse.y = e.clientY; }, { passive: true });
  let last = 0, nextWave = 0, waves = [];
  loop($('.hero'), t => {
    const { w, h } = cv, nc = Math.ceil(w / S), nr = Math.ceil(h / S);
    if (nc !== cols || nr !== rows) { cols = nc; rows = nr; heat = new Float32Array(cols * rows).map(() => Math.random() * .5); }
    const dt = Math.min(.05, t - last || .016); last = t;
    if (t > nextWave) { waves.push({ x: w * (.55 + Math.random() * .4), y: h * (.15 + Math.random() * .7), t0: t }); nextWave = t + 2.6 + Math.random() * 1.6; }
    waves = waves.filter(v => t - v.t0 < 3);
    ctx.clearRect(0, 0, w, h);
    for (let j = 0; j < rows; j++) for (let i = 0; i < cols; i++) {
      const k = j * cols + i, x = i * S + S / 2, y = j * S + S / 2;
      let v = heat[k] - dt * .09;
      for (const wv of waves) { const r = (t - wv.t0) * 420, d = Math.hypot(x - wv.x, y - wv.y); if (Math.abs(d - r) < 14) v = 1; }
      const md = Math.hypot(x - mouse.x, y - mouse.y); if (md < 90) v = Math.max(v, 1 - md / 90);
      heat[k] = v = clamp(v);
      const sz = 2 + v * 5;
      if (v < .12) continue; // cold cells stay invisible
      ctx.fillStyle = v > .35 ? 'rgba(' + C.accR + ',' + (v * .5) + ')' : 'rgba(' + C.ambR + ',' + (v * .6) + ')';
      ctx.fillRect(x - sz / 2, y - sz / 2, sz, sz);
    }
  });
})();

// ---------- hero band: an accelerated hour (one minute every 0.4 s) ----------
(() => {
  const el = $('#heroBand'); if (!el) return;
  if (reduce) { paintBand(el, 12 * MIN + 3000, true); return; }
  const t0 = performance.now();
  // 55 idle minutes, then the plugin compacts: the band restarts the hour from the summary request
  const at = new Date().toTimeString().slice(0, 5);
  setInterval(() => {
    const m = ((performance.now() - t0) / 400) % 63;
    if (m < 55) { paintBand(el, m * MIN, true); return; }
    paintBand(el, (m - 55) * MIN, false);
    el.textContent += ' · Auto-compacted at ' + at + ' (182k to 14k tokens)';
  }, 100);
})();

// ---------- ticker ----------
(() => {
  const items = [['TTL', '60m'], [T('tk.warn', 'amber under'), '10m'], [T('tk.ping', 'keep-warm ping at'), '50m'], [T('tk.cmp', 'auto-compact at'), '55m'],
    [T('tk.min', 'no compact under'), '30k tokens'], [T('tk.ref', 'refresh every'), '15s'], [T('tk.win', 'warm windows'), '3h · 6h · 12h'], [T('tk.fail', 'stop after'), T('tk.fails', '3 failed pings')], ['license', 'MIT']];
  const tr = $('#tickerTrack'), html = items.map(([a, b]) => '<span>' + a + ' <b>' + b + '</b></span>').join('');
  tr.innerHTML = html + html;
  if (G && !reduce) G.to(tr, { xPercent: -50, duration: 40, ease: 'none', repeat: -1 });
})();

// ---------- thesis: words light up with scroll ----------
$$('.reveal-words').forEach(p => {
  p.innerHTML = p.textContent.trim().split(/\s+/).map(w => '<span class="w">' + w + '</span>').join(' ');
  if (!G || !ST || reduce) return;
  G.to(p.querySelectorAll('.w'), { opacity: 1, stagger: .08, ease: 'none', scrollTrigger: { trigger: p, start: 'top 80%', end: 'bottom 45%', scrub: true } });
});

// ---------- 01 clock: scroll scrubs 0 to 72 minutes ----------
(() => {
  const cv = setup($('#clockCanvas')), { ctx } = cv, band = $('#clockBand'), txt = $('#clockText'), lis = $$('#clockLegend li');
  let p = reduce || !ST ? .7 : 0, shown = 0, phase = -1;
  if (ST && !reduce) ST.create({ trigger: '#clock', start: 'top top', end: 'bottom bottom', scrub: true, onUpdate: s => { p = s.progress; } });
  const PH = [
    [0, T('clk.p0', 'A reply lands: the context is written to the cache and the hour starts.')],
    [10, T('clk.p1', 'Every reply resets the clock. Idle time eats it: a meeting, lunch, a long build.')],
    [50, T('clk.p2', 'Under 10 minutes left: the band turns amber. Keep warm would ping now.')],
    [55, T('clk.p3', 'At 55 minutes an idle session is compacted while the cache can still be read cheaply. The band then starts a new hour from the summary.')],
    [60, T('clk.p4', 'Without the compact (skipped, or a context under 30k tokens): expired. The next prompt writes the whole context to the cache again: cache writes cost twice the base input price, cache reads a tenth of it.')],
  ];
  loop($('#clock'), t => {
    shown = lerp(shown, p, .15);
    const min = shown * 80, age = min * MIN, { w, h } = cv;
    paintBand(band, age, true);
    const ph = PH.reduce((a, x, i) => (min >= x[0] ? i : a), 0);
    if (ph !== phase) { phase = ph; txt.textContent = PH[ph][1]; }
    lis.forEach(li => li.classList.toggle('on', min >= +li.dataset.at));
    ctx.clearRect(0, 0, w, h);
    const cold = min >= 60, warn = !cold && min >= 50;
    const col = cold ? C.hot : warn ? C.amb : C.acc;
    // ring
    const narrow = w < 640, R = Math.min(narrow ? w * .36 : w * .22, h * .36), cx = narrow ? w / 2 : w * .3, cy = narrow ? h * .42 : h / 2;
    ctx.lineWidth = 1; ctx.strokeStyle = C.line;
    for (let m = 0; m < 60; m++) {
      const a = -Math.PI / 2 + m / 60 * TAU, long = m % 5 === 0;
      ctx.beginPath(); ctx.moveTo(cx + Math.cos(a) * (R + 10), cy + Math.sin(a) * (R + 10));
      ctx.lineTo(cx + Math.cos(a) * (R + (long ? 22 : 15)), cy + Math.sin(a) * (R + (long ? 22 : 15)));
      ctx.strokeStyle = m < min ? 'rgba(' + C.inkR + ',.5)' : C.line; ctx.stroke();
    }
    ctx.lineWidth = 14; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.arc(cx, cy, R, 0, TAU); ctx.strokeStyle = 'rgba(' + C.dimR + ',.14)'; ctx.stroke();
    const left = clamp(1 - min / 60);
    if (left > 0) { ctx.beginPath(); ctx.arc(cx, cy, R, -Math.PI / 2, -Math.PI / 2 + left * TAU); ctx.strokeStyle = col; ctx.shadowColor = col; ctx.shadowBlur = 24; ctx.stroke(); ctx.shadowBlur = 0; }
    // markers 50 / 55 / 60
    [[50, C.amb, 'ping'], [55, C.cool, '/compact'], [60, C.hot, 'TTL']].forEach(([m, c, l]) => {
      const a = -Math.PI / 2 + (60 - m) / 60 * TAU, x = cx + Math.cos(a) * (R + 40), y = cy + Math.sin(a) * (R + 40);
      ctx.fillStyle = c; ctx.beginPath(); ctx.arc(cx + Math.cos(a) * R, cy + Math.sin(a) * R, 4, 0, TAU); ctx.fill();
      ctx.font = '11px ' + MONO; ctx.textAlign = 'center'; ctx.fillText(m + 'm ' + l, x, y + 4);
    });
    ctx.textAlign = 'center'; ctx.fillStyle = C.ink;
    ctx.font = '700 ' + Math.round(R * .38) + 'px "Space Grotesk", sans-serif';
    ctx.fillText(cold ? T('clk.cold', 'cold') : fmt(TTL - age).replace(/ \d+s$/, '') , cx, cy + R * .1);
    ctx.font = '12px ' + MONO; ctx.fillStyle = C.dim;
    ctx.fillText(cold ? T('clk.coldS', 'next prompt: full rewrite') : T('clk.left', 'left on the cache'), cx, cy + R * .1 + 26);
    // context stack + next prompt cost
    const bx = narrow ? w * .08 : w * .58, bw = narrow ? w * .84 : w * .34, top = narrow ? h * .8 : h * .16, rowsN = narrow ? 3 : 14, rh = narrow ? 8 : (h * .42) / rowsN;
    const heat = cold ? 0 : 1 - min / 60;
    for (let r = 0; r < rowsN; r++) for (let c = 0; c < 24; c++) {
      const x = bx + c * bw / 24, y = top + r * rh, flick = Math.sin(t * 2 + r * .7 + c * .3) * .5 + .5;
      ctx.fillStyle = cold ? 'rgba(' + C.hotR + ',' + (.18 + flick * .25) + ')' : 'rgba(' + (warn ? C.ambR : C.accR) + ',' + (.3 + heat * .45) * (.7 + flick * .3) + ')';
      ctx.fillRect(x + 1, y + 1, bw / 24 - 3, rh - 3);
    }
    if (!narrow) {
      ctx.textAlign = 'left'; ctx.fillStyle = C.dim; ctx.font = '11px ' + MONO;
      ctx.fillText(T('clk.ctx', 'your context, in the cache'), bx, top - 10);
      const cy2 = top + rowsN * rh + 46;
      ctx.fillText(T('clk.cost', 'next prompt pays for the context as'), bx, cy2 - 12);
      const k = cold ? 1 : .05; // 0.1x read vs 2x write
      ctx.fillStyle = 'rgba(' + C.dimR + ',.15)'; ctx.fillRect(bx, cy2, bw, 18);
      ctx.fillStyle = cold ? C.hot : col; ctx.fillRect(bx, cy2, bw * k, 18);
      ctx.fillStyle = C.ink; ctx.font = '600 13px ' + MONO;
      ctx.fillText(cold ? T('clk.write', 'cache write · 2× base input') : T('clk.read', 'cache read · 0.1× base input'), bx, cy2 + 40);
    }
  });
})();

// ---------- reveals ----------
if (G && ST && !reduce) {
  $$('.h-big').forEach(h => G.from(h, { y: 60, opacity: 0, duration: 1, ease: 'expo.out', scrollTrigger: { trigger: h, start: 'top 85%' } }));
  $$('.narrow, .warm-ctl, .warm-chart, .stats, .note').forEach(e => G.from(e, { y: 30, opacity: 0, duration: .9, ease: 'power3.out', scrollTrigger: { trigger: e, start: 'top 88%' } }));
  G.from('.state', { x: -60, opacity: 0, duration: .9, stagger: .15, ease: 'expo.out', scrollTrigger: { trigger: '#states', start: 'top 75%' } });
  G.from('.card', { y: 50, opacity: 0, duration: .9, stagger: .12, ease: 'expo.out', scrollTrigger: { trigger: '.cards', start: 'top 85%' } });
}
// meters drain from full to their value
if (G && !reduce) $$('.state .meter i').forEach(i => {
  const v = +getComputedStyle(i).getPropertyValue('--v');
  G.fromTo(i, { scaleX: 1 }, { scaleX: v, duration: 2.4, ease: 'power2.inOut', scrollTrigger: ST ? { trigger: i, start: 'top 85%' } : undefined });
});

// ---------- steps ----------
(() => {
  const steps = $$('.step');
  const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) e.target.classList.add('in'); }), { rootMargin: '0px 0px -25% 0px' });
  steps.forEach(s => io.observe(s));
  const line = $('#stepsLine');
  if (G && ST && !reduce) G.fromTo(line, { attr: { y2: 0 } }, { attr: { y2: 100 }, ease: 'none', scrollTrigger: { trigger: '#steps', start: 'top 70%', end: 'bottom 60%', scrub: true } });
  if (line) line.style.stroke = 'var(--acc)';
})();

// ---------- 03 compact: a long context folds into a short summary ----------
(() => {
  const cv = setup($('#cmpCanvas')), { ctx } = cv, N = 60, SUM = 6;
  const draw = t => {
    const { w, h } = cv, s = reduce ? .78 : (t % 8) / 8; ctx.clearRect(0, 0, w, h);
    const pad = 28, bw = w - pad * 2, cell = bw / N;
    // timeline 0..60 at the top
    const age = Math.min(1, s / .4) * 55; // 0..55 min in the first 40%
    ctx.fillStyle = 'rgba(' + C.dimR + ',.2)'; ctx.fillRect(pad, 40, bw, 3);
    ctx.fillStyle = age >= 50 ? C.amb : C.acc; ctx.fillRect(pad, 40, bw * age / 60, 3);
    ctx.fillStyle = C.hot; ctx.fillRect(pad + bw - 2, 34, 2, 15);
    ctx.fillStyle = C.cool; ctx.fillRect(pad + bw * 55 / 60 - 1, 34, 2, 15);
    ctx.font = '11px ' + MONO; ctx.textAlign = 'left'; ctx.fillStyle = C.dim;
    ctx.fillText(T('cmp.idle', 'idle'), pad, 26);
    ctx.textAlign = 'right'; ctx.fillStyle = C.cool; ctx.fillText('55m /compact', pad + bw * 55 / 60 - 6, 26);
    ctx.fillStyle = C.hot; ctx.fillText('60m', pad + bw, 64);
    ctx.textAlign = 'left';
    // context cells: fold after 45%
    const f = ease((s - .45) / .3), y0 = h * .38, ch = h * .16;
    ctx.fillStyle = C.dim; ctx.fillText(f < .5 ? T('cmp.ctx', 'context in the cache') : T('cmp.sum', 'summary'), pad, y0 - 12);
    for (let i = 0; i < N; i++) {
      const j = Math.floor(i * SUM / N), tx = pad + j * cell * 1.6, x = lerp(pad + i * cell, tx, f), cw = lerp(cell - 2, cell * 1.6 - 3, f);
      const a = lerp(.6, i % (N / SUM) === 0 ? .9 : 0, f);
      if (a <= .01) continue;
      ctx.fillStyle = 'rgba(' + (age >= 50 && f === 0 ? C.ambR : C.accR) + ',' + a + ')';
      ctx.fillRect(x, y0, cw, ch);
    }
    // next prompt cost: what it reads afterwards
    const g = ease((s - .78) / .15);
    if (g > 0) {
      const y1 = h * .74;
      ctx.globalAlpha = g; ctx.fillStyle = C.ink; ctx.font = '600 13px ' + MONO;
      ctx.fillText(T('cmp.next', 'your next prompt pays for the summary, not the whole context'), pad, y1);
      ctx.fillStyle = C.acc; ctx.fillRect(pad, y1 + 14, SUM * cell * 1.6 * g, 10);
      ctx.fillStyle = 'rgba(' + C.hotR + ',.25)'; ctx.fillRect(pad, y1 + 32, bw, 10);
      ctx.fillStyle = C.dim; ctx.font = '11px ' + MONO; ctx.fillText(T('cmp.vs', 'vs. a full rewrite after the hour'), pad, y1 + 60);
      ctx.globalAlpha = 1;
    }
  };
  if (reduce) { draw(0); new ResizeObserver(() => draw(0)).observe(cv.canvas); } else loop($('#cmpCanvas'), draw);
})();

// ---------- 04 keep warm: cache age over the window ----------
(() => {
  const cv = setup($('#warmCanvas')), { ctx } = cv, chips = $$('.chip'), pingsEl = $('#wPings'), coldEl = $('#wCold');
  let H = 6, play = { k: reduce ? 1 : 0 };
  // ping when the cache is 50 minutes old while the window is open; after the window the next timer is the auto-compact at 55 minutes
  const plan = hrs => { const end = hrs * 60, pings = []; let last = 0; while (last + 50 < end) { last += 50; pings.push(last); } return { end, pings, cmp: last + 55 }; };
  const hm = m => Math.floor(m / 60) + 'h ' + (m % 60) + 'm';
  function pick(h) {
    H = h; chips.forEach(c => c.classList.toggle('on', +c.dataset.h === h));
    const pl = plan(h); pingsEl.textContent = pl.pings.length; coldEl.textContent = hm(pl.cmp);
    if (G && !reduce) { G.killTweensOf(play); play.k = 0; G.to(play, { k: 1, duration: 2.6, ease: 'power1.inOut' }); }
  }
  chips.forEach(c => c.addEventListener('click', () => pick(+c.dataset.h)));
  if (ST && G && !reduce) ST.create({ trigger: '#warmCanvas', start: 'top 80%', once: true, onEnter: () => pick(H) });
  pick(H);
  loop($('#warmCanvas'), t => {
    const { w, h } = cv, pl = plan(H), span = pl.cmp + 25, pad = 34, x = m => pad + (w - pad * 2) * m / span, top = 26, bot = h - 40, y = a => bot - (bot - top) * Math.min(a, 60) / 60;
    ctx.clearRect(0, 0, w, h);
    // window shade
    ctx.fillStyle = 'rgba(' + C.accR + ',.06)'; ctx.fillRect(x(0), top, x(pl.end) - x(0), bot - top);
    ctx.strokeStyle = C.line; ctx.lineWidth = 1; ctx.setLineDash([3, 5]);
    [[50, C.amb], [60, C.hot]].forEach(([a, c]) => { ctx.strokeStyle = c; ctx.globalAlpha = .5; ctx.beginPath(); ctx.moveTo(pad, y(a)); ctx.lineTo(w - pad, y(a)); ctx.stroke(); });
    ctx.globalAlpha = 1; ctx.setLineDash([]);
    ctx.font = '11px ' + MONO; ctx.fillStyle = C.dim; ctx.textAlign = 'left';
    ctx.fillText(T('warm.age', 'cache age'), pad, top - 10);
    ctx.textAlign = 'right'; ctx.fillStyle = C.hot; ctx.fillText('60m TTL', w - pad, y(60) - 6);
    ctx.textAlign = 'center'; ctx.fillStyle = C.dim;
    for (let hr = 0; hr * 60 <= span; hr++) ctx.fillText(hr + 'h', x(hr * 60), h - 14);
    ctx.fillStyle = C.acc; ctx.fillText(T('warm.end', 'window ends'), x(pl.end), top + 14);
    // sawtooth up to the playhead
    const head = span * play.k;
    ctx.lineWidth = 2.5; ctx.lineJoin = 'round';
    let prev = 0, age = 0;
    const seg = [0, ...pl.pings, pl.cmp];
    ctx.beginPath(); ctx.moveTo(x(0), y(0)); ctx.strokeStyle = C.acc;
    for (let i = 1; i < seg.length; i++) {
      const a = seg[i - 1], b = Math.min(seg[i], head);
      if (head <= a) break;
      ctx.lineTo(x(b), y(b - a));
      if (seg[i] <= head && i < seg.length - 1) ctx.lineTo(x(b), y(0));
    }
    ctx.stroke();
        // pings
    pl.pings.forEach(m => {
      if (m > head) return;
      const r = 4 + ((t * 1.2 + m / 50) % 1) * 14;
      ctx.strokeStyle = 'rgba(' + C.accR + ',' + (1 - (r - 4) / 14) + ')'; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.arc(x(m), y(0), r, 0, TAU); ctx.stroke();
      ctx.fillStyle = C.acc; ctx.beginPath(); ctx.arc(x(m), y(0), 3.5, 0, TAU); ctx.fill();
    });
    if (head > pl.cmp) { ctx.fillStyle = C.cool; ctx.beginPath(); ctx.arc(x(pl.cmp), y(55), 4, 0, TAU); ctx.fill(); ctx.textAlign = 'center'; ctx.fillText(T('warm.cmp', 'auto-compact'), x(pl.cmp), y(55) - 12); }
  });
})();

// ---------- install: copy buttons, card glow ----------
$$('.copy').forEach(b => b.addEventListener('click', async () => {
  try { await navigator.clipboard.writeText(b.dataset.copy); } catch { return; }
  const was = b.textContent; b.textContent = T('ins.copied', 'copied'); b.classList.add('done');
  setTimeout(() => { b.textContent = was; b.classList.remove('done'); }, 1400);
}));
$$('.card').forEach(c => c.addEventListener('pointermove', e => {
  const r = c.getBoundingClientRect(); c.style.setProperty('--mx', (e.clientX - r.left) + 'px'); c.style.setProperty('--my', (e.clientY - r.top) + 'px');
}));
})();
