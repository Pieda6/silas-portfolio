/* ============================================================
   Ethos Labs artwork — deterministic generative cover art.
   Each slug seeds a flat-color geometric composition (arcs,
   checkers, halftones, stripes, blobs, stars) so every project
   gets distinctive, designed-looking imagery without stock or
   copyrighted art. Same slug → same art, everywhere, forever.
   ============================================================ */
(function () {
  'use strict';

  const PALETTE = ['#b7f04b', '#ffe14d', '#ff7ab2', '#8a5cf7', '#5cc8ff', '#ff9950'];
  const INK = '#111114';
  const PAPER = '#f6f5f1';

  /* ----- Deterministic PRNG (mulberry32 seeded from slug) ----- */
  function hash(str) {
    let h = 1779033703 ^ str.length;
    for (let i = 0; i < str.length; i++) {
      h = Math.imul(h ^ str.charCodeAt(i), 3432918353);
      h = (h << 13) | (h >>> 19);
    }
    return h >>> 0;
  }
  function mulberry32(seed) {
    return function () {
      seed |= 0; seed = (seed + 0x6D2B79F5) | 0;
      let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  function pickColors(rnd) {
    const idx = Math.floor(rnd() * PALETTE.length);
    const bg = PALETTE[idx];
    const rest = PALETTE.filter((_, i) => i !== idx);
    // Fisher–Yates on the remainder for the accent order
    for (let i = rest.length - 1; i > 0; i--) {
      const j = Math.floor(rnd() * (i + 1));
      [rest[i], rest[j]] = [rest[j], rest[i]];
    }
    return { bg, a: rest[0], b: rest[1], c: rest[2] };
  }

  /* ----- Element painters (draw into w×h space) ----- */
  const painters = {
    quarterCircle(ctx, w, h, rnd, col) {
      const r = (0.35 + rnd() * 0.4) * Math.min(w, h);
      const corners = [[0, 0, 0], [w, 0, Math.PI / 2], [w, h, Math.PI], [0, h, -Math.PI / 2]];
      const [x, y, rot] = corners[Math.floor(rnd() * 4)];
      ctx.fillStyle = col;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.arc(x, y, r, rot, rot + Math.PI / 2);
      ctx.closePath();
      ctx.fill();
    },
    rings(ctx, w, h, rnd, col) {
      const cx = rnd() * w, cy = rnd() * h;
      const n = 3 + Math.floor(rnd() * 3);
      const step = (0.08 + rnd() * 0.05) * Math.min(w, h);
      ctx.strokeStyle = col;
      ctx.lineWidth = step * 0.42;
      for (let i = 1; i <= n; i++) {
        ctx.beginPath();
        ctx.arc(cx, cy, i * step, 0, Math.PI * 2);
        ctx.stroke();
      }
    },
    checker(ctx, w, h, rnd, col) {
      const cell = (0.06 + rnd() * 0.05) * Math.min(w, h);
      const cols = 3 + Math.floor(rnd() * 3), rows = 3 + Math.floor(rnd() * 3);
      const ox = rnd() * (w - cols * cell), oy = rnd() * (h - rows * cell);
      ctx.fillStyle = col;
      for (let i = 0; i < cols; i++)
        for (let j = 0; j < rows; j++)
          if ((i + j) % 2 === 0) ctx.fillRect(ox + i * cell, oy + j * cell, cell, cell);
    },
    halftone(ctx, w, h, rnd, col) {
      const cell = (0.05 + rnd() * 0.03) * Math.min(w, h);
      const cols = 4 + Math.floor(rnd() * 4), rows = 3 + Math.floor(rnd() * 3);
      const ox = rnd() * (w - cols * cell), oy = rnd() * (h - rows * cell);
      ctx.fillStyle = col;
      for (let i = 0; i < cols; i++)
        for (let j = 0; j < rows; j++) {
          ctx.beginPath();
          ctx.arc(ox + i * cell + cell / 2, oy + j * cell + cell / 2, cell * 0.3, 0, Math.PI * 2);
          ctx.fill();
        }
    },
    stripes(ctx, w, h, rnd, col) {
      const n = 3 + Math.floor(rnd() * 3);
      const sw = (0.04 + rnd() * 0.03) * Math.min(w, h);
      const angle = [-0.5, 0.5, 0][Math.floor(rnd() * 3)];
      const ox = rnd() * w, oy = rnd() * h;
      ctx.save();
      ctx.translate(ox, oy);
      ctx.rotate(angle);
      ctx.fillStyle = col;
      for (let i = 0; i < n; i++) ctx.fillRect(-w, i * sw * 2.2, w * 2, sw);
      ctx.restore();
    },
    blob(ctx, w, h, rnd, col) {
      const cx = rnd() * w, cy = rnd() * h;
      const r = (0.16 + rnd() * 0.22) * Math.min(w, h);
      ctx.fillStyle = col;
      ctx.beginPath();
      const pts = 8;
      for (let i = 0; i <= pts; i++) {
        const a = (i / pts) * Math.PI * 2;
        const rr = r * (0.8 + rnd() * 0.4);
        const x = cx + Math.cos(a) * rr, y = cy + Math.sin(a) * rr;
        i === 0 ? ctx.moveTo(x, y) : ctx.quadraticCurveTo(
          cx + Math.cos(a - Math.PI / pts) * rr * 1.2,
          cy + Math.sin(a - Math.PI / pts) * rr * 1.2, x, y);
      }
      ctx.closePath();
      ctx.fill();
    },
    star(ctx, w, h, rnd, col) {
      const cx = rnd() * w, cy = rnd() * h;
      const r = (0.1 + rnd() * 0.14) * Math.min(w, h);
      const spikes = 4 + Math.floor(rnd() * 4);
      ctx.fillStyle = col;
      ctx.beginPath();
      for (let i = 0; i < spikes * 2; i++) {
        const a = (i / (spikes * 2)) * Math.PI * 2 - Math.PI / 2;
        const rr = i % 2 === 0 ? r : r * 0.42;
        const x = cx + Math.cos(a) * rr, y = cy + Math.sin(a) * rr;
        i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
      }
      ctx.closePath();
      ctx.fill();
    },
    arch(ctx, w, h, rnd, col) {
      const bw = (0.22 + rnd() * 0.2) * w;
      const bh = (0.3 + rnd() * 0.35) * h;
      const x = rnd() * (w - bw);
      ctx.fillStyle = col;
      ctx.beginPath();
      ctx.moveTo(x, h);
      ctx.lineTo(x, h - bh + bw / 2);
      ctx.arc(x + bw / 2, h - bh + bw / 2, bw / 2, Math.PI, 0);
      ctx.lineTo(x + bw, h);
      ctx.closePath();
      ctx.fill();
    },
    zigzag(ctx, w, h, rnd, col) {
      const n = 5 + Math.floor(rnd() * 4);
      const amp = (0.05 + rnd() * 0.04) * h;
      const y = rnd() * h;
      ctx.strokeStyle = col;
      ctx.lineWidth = amp * 0.5;
      ctx.beginPath();
      const step = w / n;
      for (let i = 0; i <= n; i++) {
        const px = i * step, py = y + (i % 2 === 0 ? -amp : amp);
        i === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
      }
      ctx.stroke();
    },
  };
  const PAINTER_KEYS = Object.keys(painters);

  function compose(ctx, w, h, slug, opts) {
    const rnd = mulberry32(hash(slug));
    const colors = pickColors(rnd);

    ctx.fillStyle = rnd() < 0.28 ? PAPER : colors.bg;
    ctx.fillRect(0, 0, w, h);

    const accents = [colors.a, colors.b, colors.c, INK, '#ffffff'];
    const n = opts && opts.simple ? 3 : 4 + Math.floor(rnd() * 3);
    const used = new Set();
    for (let i = 0; i < n; i++) {
      let key;
      do { key = PAINTER_KEYS[Math.floor(rnd() * PAINTER_KEYS.length)]; }
      while (used.has(key) && used.size < PAINTER_KEYS.length);
      used.add(key);
      const col = accents[Math.floor(rnd() * accents.length)];
      ctx.save();
      painters[key](ctx, w, h, rnd, col);
      ctx.restore();
    }

    // Grain-free finishing: thin ink frame keeps it looking printed
    if (!(opts && opts.noFrame)) {
      ctx.strokeStyle = 'rgba(17,17,20,0.1)';
      ctx.lineWidth = 1;
      ctx.strokeRect(0.5, 0.5, w - 1, h - 1);
    }
  }

  function paintCanvas(canvas, slug, opts) {
    // Fixed logical resolution — never measure the DOM. Layout timing and
    // transforms (notably on iOS Safari) can report zero/tiny rects, which
    // would bake a blank bitmap. CSS + object-fit handle display sizing.
    const w = Math.max(2, (opts && opts.w) || 800);
    const h = Math.max(2, (opts && opts.h) || 600);
    canvas.width = w;
    canvas.height = h;
    compose(canvas.getContext('2d'), w, h, slug, opts);
  }

  const Artwork = {
    /** Paint every canvas[data-art] inside scope that hasn't been painted. */
    paintAll(scope) {
      (scope || document).querySelectorAll('canvas[data-art]').forEach((c) => {
        if (c.dataset.painted) return;
        c.dataset.painted = '1';
        paintCanvas(c, c.dataset.art, {
          simple: 'artSimple' in c.dataset,
          noFrame: 'artNoframe' in c.dataset,
          w: parseInt(c.dataset.artW || '', 10) || undefined,
          h: parseInt(c.dataset.artH || '', 10) || undefined,
        });
      });
    },
    paint: paintCanvas,
    /** Dominant background color for a slug (used for chips etc.). */
    colorFor(slug) {
      const rnd = mulberry32(hash(slug));
      return pickColors(rnd).bg;
    },
    categoryColor(cat) {
      return ({
        'DeFi': 'var(--lime)',
        'NFT': 'var(--pink)',
        'Gaming': 'var(--orange)',
        'Infra': 'var(--sky)',
        'DAO': 'var(--yellow)',
        'AI x Web3': 'var(--purple)',
      })[cat] || 'var(--lime)';
    },
  };

  window.NexusArt = Artwork;
})();
