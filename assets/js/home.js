/* ============================================================
   NEXUS landing — hero headline choreography, fanned project
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

  /* ----- Fanned card stack ----- */
  const SLOTS = [
    { x: 0, y: 0, r: 0, s: 1, z: 50 },
    { x: -13, y: -4, r: -8, s: 0.94, z: 40 },
    { x: 13, y: -4, r: 8, s: 0.94, z: 40 },
    { x: -24, y: -9, r: -16, s: 0.88, z: 30 },
    { x: 24, y: -9, r: 16, s: 0.88, z: 30 },
  ];

  function slotTransform(slot, px, py) {
    // px/py: pointer parallax offsets in %
    return {
      xPercent: -50 + slot.x + (px || 0),
      yPercent: -50 + slot.y + (py || 0),
      rotation: slot.r,
      scale: slot.s,
    };
  }

  function buildStack(projects) {
    const stackEl = document.getElementById('hero-stack');
    if (!stackEl) return;
    const esc = window.Nexus.escapeHTML;
    const top = [...projects].sort((a, b) => (b.trending || 0) - (a.trending || 0)).slice(0, 5);

    let order = top.map((_, i) => i); // order[k] = card index occupying slot k
    const cards = top.map((p, i) => {
      const el = document.createElement('div');
      el.className = 'stack-card';
      el.innerHTML = `
        <canvas data-art="${p.slug}" data-art-noframe></canvas>
        <div class="sc-meta">
          <span class="sc-name">${esc(p.name)} ${window.Nexus.verifiedBadge}</span>
          <span class="sc-price">${window.NexusStore.formatRaised(p)} raised</span>
        </div>`;
      stackEl.appendChild(el);
      return el;
    });
    window.NexusArt.paintAll(stackEl);

    const reduced = window.Nexus.REDUCED || typeof gsap === 'undefined';

    function apply(el, slot, opts) {
      const t = slotTransform(slot, px, py);
      el.style.zIndex = slot.z;
      if (reduced) {
        el.style.transform = `translate(${t.xPercent}%, ${t.yPercent}%) rotate(${t.rotation}deg) scale(${t.s || t.scale})`;
      } else {
        gsap.to(el, { ...t, duration: (opts && opts.duration) || 0.8, ease: 'power3.out', delay: (opts && opts.delay) || 0 });
      }
    }

    // Pointer parallax
    let px = 0, py = 0;
    if (!reduced) {
      stackEl.closest('.hero').addEventListener('pointermove', (e) => {
        const r = stackEl.getBoundingClientRect();
        px = ((e.clientX - r.left) / r.width - 0.5) * 4;
        py = ((e.clientY - r.top) / r.height - 0.5) * 3;
        order.forEach((cardIdx, slotIdx) => {
          const depth = 1 - slotIdx * 0.18;
          gsap.to(cards[cardIdx], {
            ...slotTransform(SLOTS[slotIdx], px * depth, py * depth),
            duration: 0.6, ease: 'power2.out', overwrite: 'auto',
          });
        });
      }, { passive: true });
    }

    // Entrance: deal cards out from center
    if (!reduced) {
      cards.forEach((el) => gsap.set(el, { xPercent: -50, yPercent: -30, rotation: 0, scale: 0.7, opacity: 0 }));
      order.forEach((cardIdx, slotIdx) => {
        gsap.to(cards[cardIdx], { opacity: 1, duration: 0.4, delay: 0.5 + slotIdx * 0.08 });
        apply(cards[cardIdx], SLOTS[slotIdx], { delay: 0.5 + slotIdx * 0.08 });
      });
    } else {
      order.forEach((cardIdx, slotIdx) => apply(cards[cardIdx], SLOTS[slotIdx]));
    }

    // Auto-cycle: front card retreats to the deepest slot
    if (!reduced) {
      setInterval(() => {
        order.push(order.shift());
        order.forEach((cardIdx, slotIdx) => apply(cards[cardIdx], SLOTS[slotIdx], { duration: 0.9 }));
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
