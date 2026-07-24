/* ============================================================
   Ethos Labs landing — hero headline choreography, fanned project
   card stack, ticker, featured grid.
   ============================================================ */
(function () {
  'use strict';

  document.addEventListener('nexus:ready', async () => {
    animateHero();
    try {
      const all = await window.NexusStore.getAll();
      buildStack(all);
      renderTicker(all);
      renderFeatured(all);
    } catch (err) {
      console.error(err);
      const grid = document.getElementById('featured-grid');
      if (grid) grid.innerHTML = '<div class="empty-state"><div class="big">Couldn’t load projects</div>Serve this site over HTTP (e.g. <code>python3 -m http.server</code>).</div>';
    }
  });

  /* ----- Headline ----- */
  function animateHero() {
    if (window.Nexus.REDUCED || typeof gsap === 'undefined') return;
    const lines = document.querySelectorAll('.hero h1 .line > span');
    gsap.set(lines, { yPercent: 108 });
    gsap.to(lines, { yPercent: 0, duration: 0.9, ease: 'power4.out', stagger: 0.1, delay: 0.35 });
    gsap.from('.hero-badge, .hero-sub, .hero-ctas', {
      opacity: 0, y: 18, duration: 0.7, ease: 'power3.out', stagger: 0.1, delay: 0.7,
    });
  }

  /* ----- Fanned card stack (all geometry in px — no percent transforms,
     which collapse on iOS Safari when layout timing is unlucky) ----- */
  const SLOT_DEFS = [
    { fx: 0, fy: 0, r: 0, s: 1, z: 50 },
    { fx: -0.28, fy: -0.05, r: -8, s: 0.94, z: 40 },
    { fx: 0.28, fy: -0.05, r: 8, s: 0.94, z: 40 },
    { fx: -0.52, fy: -0.11, r: -16, s: 0.88, z: 30 },
    { fx: 0.52, fy: -0.11, r: 16, s: 0.88, z: 30 },
  ];

  function buildStack(projects) {
    const stackEl = document.getElementById('hero-stack');
    if (!stackEl) return;
    const esc = window.Nexus.escapeHTML;
    const top = [...projects].sort((a, b) => (b.trending || 0) - (a.trending || 0)).slice(0, 5);

    let order = top.map((_, i) => i); // order[k] = card index occupying slot k
    const cards = top.map((p) => {
      const el = document.createElement('div');
      el.className = 'stack-card';
      el.innerHTML = `
        <canvas data-art="${p.slug}" data-art-noframe data-art-w="640" data-art-h="640"></canvas>
        <div class="sc-meta">
          <span class="sc-name">${esc(p.name)} ${window.Nexus.verifiedBadge}</span>
          <span class="sc-price">${window.NexusStore.formatRaised(p)} raised</span>
        </div>`;
      stackEl.appendChild(el);
      return el;
    });
    window.NexusArt.paintAll(stackEl);

    const reduced = window.Nexus.REDUCED || typeof gsap === 'undefined';

    // Card size + slot offsets in px, recomputed on resize
    let cardW = 280;
    let slots = [];
    function layout() {
      const stackW = stackEl.clientWidth || 320;
      cardW = Math.round(Math.min(300, stackW * 0.72));
      const cardH = cardW + 56; // canvas square + meta row
      cards.forEach((el) => {
        el.style.width = cardW + 'px';
        el.style.left = '50%';
        el.style.top = '50%';
        el.style.marginLeft = -(cardW / 2) + 'px';
        el.style.marginTop = -(cardH / 2) + 'px';
      });
      slots = SLOT_DEFS.map((d) => ({
        x: Math.round(d.fx * cardW),
        y: Math.round(d.fy * cardW),
        r: d.r, s: d.s, z: d.z,
      }));
    }
    layout();
    let resizeTimer;
    window.addEventListener('resize', () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        layout();
        order.forEach((cardIdx, slotIdx) => apply(cards[cardIdx], slots[slotIdx], { duration: 0.3 }));
      }, 150);
    });

    function apply(el, slot, opts) {
      el.style.zIndex = slot.z;
      const dx = slot.x + px * (opts && opts.depth != null ? opts.depth : 1);
      const dy = slot.y + py * (opts && opts.depth != null ? opts.depth : 1);
      if (reduced) {
        el.style.transform = `translate(${dx}px, ${dy}px) rotate(${slot.r}deg) scale(${slot.s})`;
      } else {
        gsap.to(el, {
          x: dx, y: dy, rotation: slot.r, scale: slot.s,
          duration: (opts && opts.duration) || 0.8, ease: 'power3.out',
          delay: (opts && opts.delay) || 0, overwrite: 'auto',
        });
      }
    }

    // Pointer parallax (px offsets)
    let px = 0, py = 0;
    if (!reduced) {
      stackEl.closest('.hero').addEventListener('pointermove', (e) => {
        const r = stackEl.getBoundingClientRect();
        if (!r.width) return;
        px = ((e.clientX - r.left) / r.width - 0.5) * 14;
        py = ((e.clientY - r.top) / r.height - 0.5) * 10;
        order.forEach((cardIdx, slotIdx) => {
          apply(cards[cardIdx], slots[slotIdx], { duration: 0.6, depth: 1 - slotIdx * 0.18 });
        });
      }, { passive: true });
    }

    // Entrance: deal cards out from center
    if (!reduced) {
      cards.forEach((el) => gsap.set(el, { x: 0, y: 40, rotation: 0, scale: 0.7, opacity: 0 }));
      order.forEach((cardIdx, slotIdx) => {
        gsap.to(cards[cardIdx], { opacity: 1, duration: 0.4, delay: 0.5 + slotIdx * 0.08 });
        apply(cards[cardIdx], slots[slotIdx], { delay: 0.5 + slotIdx * 0.08 });
      });
    } else {
      order.forEach((cardIdx, slotIdx) => apply(cards[cardIdx], slots[slotIdx]));
    }

    // Auto-cycle: front card retreats to the deepest slot
    if (!reduced) {
      setInterval(() => {
        order.push(order.shift());
        order.forEach((cardIdx, slotIdx) => apply(cards[cardIdx], slots[slotIdx], { duration: 0.9 }));
      }, 3800);
    }
  }

  /* ----- Ticker ----- */
  function renderTicker(projects) {
    const track = document.getElementById('ticker-track');
    if (!track) return;
    const esc = window.Nexus.escapeHTML;
    const items = projects.map((p) => `
      <div class="ticker-item">
        <span class="t-dot"></span>
        <b>${esc(p.name)}</b>
        <span class="t-cat">${esc(p.category)}</span>
        <span>${window.NexusStore.formatRaised(p)} raised</span>
      </div>`).join('');
    track.innerHTML = items + items;
  }

  /* ----- Featured ----- */
  function renderFeatured(projects) {
    const grid = document.getElementById('featured-grid');
    if (!grid) return;
    const top = [...projects].sort((a, b) => (b.trending || 0) - (a.trending || 0)).slice(0, 3);
    grid.innerHTML = top.map((p) => window.Nexus.projectCardHTML(p)).join('');
    grid.querySelectorAll('.project-card').forEach((c, i) => {
      c.classList.add('reveal');
      c.dataset.delay = (i * 0.08).toFixed(2);
    });
    window.Nexus.refresh(grid);
  }
})();
