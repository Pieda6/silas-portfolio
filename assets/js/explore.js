/* ============================================================
   NEXUS explore — filterable, searchable, sortable directory
   with FLIP-style re-layout animation.
   ============================================================ */
(function () {
  'use strict';

  const state = { category: 'All', chain: 'All', query: '', sort: 'trending' };
  let all = [];

  document.addEventListener('nexus:ready', async () => {
    const grid = document.getElementById('explore-grid');
    if (!grid) return;

    try {
      // Brief skeleton shimmer so the "loading" state is part of the choreography
      grid.innerHTML = Array.from({ length: 6 }, () => '<div class="skeleton-card"></div>').join('');
      const [projects] = await Promise.all([
        window.NexusStore.getAll(),
        new Promise((r) => setTimeout(r, window.Nexus.REDUCED ? 0 : 450)),
      ]);
      all = projects;
      buildFilters();
      bindControls();
      render(true);
    } catch (err) {
      console.error(err);
      grid.innerHTML = '<div class="empty-state"><div class="big">⚠️</div>Could not load projects. Serve this site over HTTP (e.g. <code>python3 -m http.server</code>).</div>';
    }
  });

  function buildFilters() {
    const cats = ['All', ...new Set(all.map((p) => p.category))];
    const chains = ['All', ...new Set(all.map((p) => p.chain))];

    const catRow = document.getElementById('filter-categories');
    catRow.innerHTML = cats.map((c) =>
      `<button class="pill ${c === 'All' ? 'is-active' : ''}" data-cat="${window.Nexus.escapeHTML(c)}">${window.Nexus.escapeHTML(c)}</button>`).join('');

    const chainSel = document.getElementById('filter-chain');
    chainSel.innerHTML = chains.map((c) =>
      `<option value="${window.Nexus.escapeHTML(c)}">${c === 'All' ? 'All chains' : window.Nexus.escapeHTML(c)}</option>`).join('');
  }

  function bindControls() {
    document.getElementById('filter-categories').addEventListener('click', (e) => {
      const btn = e.target.closest('.pill');
      if (!btn) return;
      document.querySelectorAll('#filter-categories .pill').forEach((p) => p.classList.remove('is-active'));
      btn.classList.add('is-active');
      state.category = btn.dataset.cat;
      render();
    });

    document.getElementById('filter-chain').addEventListener('change', (e) => {
      state.chain = e.target.value;
      render();
    });

    document.getElementById('filter-sort').addEventListener('change', (e) => {
      state.sort = e.target.value;
      render();
    });

    let debounce;
    document.getElementById('filter-search').addEventListener('input', (e) => {
      clearTimeout(debounce);
      debounce = setTimeout(() => {
        state.query = e.target.value.trim().toLowerCase();
        render();
      }, 160);
    });
  }

  function filtered() {
    let list = all.filter((p) =>
      (state.category === 'All' || p.category === state.category) &&
      (state.chain === 'All' || p.chain === state.chain) &&
      (!state.query ||
        p.name.toLowerCase().includes(state.query) ||
        p.blurb.toLowerCase().includes(state.query) ||
        (p.tagline || '').toLowerCase().includes(state.query)));

    switch (state.sort) {
      case 'newest':
        list = [...list].sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)));
        break;
      case 'raising':
        list = [...list].sort((a, b) => (b.raised || 0) - (a.raised || 0));
        break;
      default:
        list = [...list].sort((a, b) => (b.trending || 0) - (a.trending || 0));
    }
    return list;
  }

  function render(first) {
    const grid = document.getElementById('explore-grid');
    const count = document.getElementById('results-count');
    const list = filtered();

    count.textContent = `${list.length} project${list.length === 1 ? '' : 's'}`;

    const draw = () => {
      if (!list.length) {
        grid.innerHTML = '<div class="empty-state" style="grid-column:1/-1"><div class="big">🛰️</div><p>No projects match that filter — adjust your search or be the first to <a class="text-gradient" href="submit.html" style="font-weight:600">submit one</a>.</p></div>';
        return;
      }
      grid.innerHTML = list.map((p) => window.Nexus.projectCardHTML(p)).join('');
      window.Nexus.refresh(grid);
      if (!window.Nexus.REDUCED && typeof gsap !== 'undefined') {
        gsap.fromTo(grid.children,
          { opacity: 0, y: 28, scale: 0.97 },
          { opacity: 1, y: 0, scale: 1, duration: 0.55, ease: 'power3.out', stagger: 0.05 });
      }
    };

    if (first || window.Nexus.REDUCED || typeof gsap === 'undefined') {
      draw();
    } else {
      gsap.to(grid.children, {
        opacity: 0, y: -14, scale: 0.98, duration: 0.22, ease: 'power2.in', stagger: 0.02,
        onComplete: draw,
      });
    }
  }
})();
