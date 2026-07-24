/* ============================================================
   NEXUS landing page — hero text choreography, live ticker,
   featured projects, scroll-driven story section.
   ============================================================ */
(function () {
  'use strict';

  document.addEventListener('nexus:ready', async () => {
    animateHero();
    orbitNodes();

    try {
      const all = await window.NexusStore.getAll();
      renderTicker(all);
      renderFeatured(all);
    } catch (err) {
      console.error(err);
      const grid = document.getElementById('featured-grid');
      if (grid) grid.innerHTML = '<div class="empty-state"><div class="big">⚠️</div>Could not load projects. Serve this site over HTTP (e.g. <code>python3 -m http.server</code>).</div>';
    }
  });

  /* ----- Hero headline: staggered line + char reveal ----- */
  function animateHero() {
    if (window.Nexus.REDUCED || typeof gsap === 'undefined') return;
    const lines = document.querySelectorAll('.hero h1 .line > span');
    gsap.set(lines, { yPercent: 110 });
    gsap.to(lines, {
      yPercent: 0, duration: 1.1, ease: 'power4.out', stagger: 0.12, delay: 1.0,
    });
    gsap.from('.hero-badge, .hero-sub, .hero-ctas', {
      opacity: 0, y: 26, duration: 0.9, ease: 'power3.out', stagger: 0.12, delay: 1.35,
    });
    gsap.from('.hero-scroll-hint', { opacity: 0, duration: 1, delay: 2.1 });
  }

  /* ----- Orbiting nodes in story visuals ----- */
  function orbitNodes() {
    if (window.Nexus.REDUCED || typeof gsap === 'undefined') return;
    document.querySelectorAll('.story-visual').forEach((visual) => {
      const nodes = visual.querySelectorAll('.orbit-node');
      const n = nodes.length;
      nodes.forEach((node, i) => {
        const radiusPct = i % 2 === 0 ? 31 : 44; // matches .r1/.r2 rings
        const start = (i / n) * Math.PI * 2;
        const dir = i % 2 === 0 ? 1 : -1;
        const dur = 16 + i * 4;
        gsap.to({ a: 0 }, {
          a: Math.PI * 2 * dir, duration: dur, repeat: -1, ease: 'none',
          onUpdate() {
            const a = start + this.targets()[0].a;
            node.style.left = `calc(50% + ${Math.cos(a) * radiusPct}% - 26px)`;
            node.style.top = `calc(50% + ${Math.sin(a) * radiusPct}% - 26px)`;
          },
        });
      });
    });
  }

  /* ----- Ticker ----- */
  function renderTicker(projects) {
    const track = document.getElementById('ticker-track');
    if (!track) return;
    const items = projects.map((p) => `
      <div class="ticker-item">
        <span class="t-dot"></span>
        <b>${window.Nexus.escapeHTML(p.name)}</b>
        <span class="t-cat">${window.Nexus.escapeHTML(p.category)}</span>
        <span>${window.NexusStore.formatRaised(p)} raised</span>
      </div>`).join('');
    track.innerHTML = items + items; // duplicated for seamless loop
  }

  /* ----- Featured: top 3 by trending score ----- */
  function renderFeatured(projects) {
    const grid = document.getElementById('featured-grid');
    if (!grid) return;
    const top = [...projects].sort((a, b) => (b.trending || 0) - (a.trending || 0)).slice(0, 3);
    grid.innerHTML = top.map((p) => window.Nexus.projectCardHTML(p)).join('');
    grid.querySelectorAll('.project-card').forEach((c) => c.classList.add('reveal'));
    window.Nexus.refresh(grid);
  }
})();
