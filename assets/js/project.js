/* ============================================================
   NEXUS project detail — renders one project from ?id=<slug>,
   with animated stats and the "Connect" modal.
   ============================================================ */
(function () {
  'use strict';

  document.addEventListener('nexus:ready', async () => {
    const root = document.getElementById('detail-root');
    if (!root) return;

    const slug = new URLSearchParams(location.search).get('id');
    let project = null;
    try {
      project = slug ? await window.NexusStore.getBySlug(slug) : null;
    } catch (err) {
      console.error(err);
    }

    if (!project) {
      root.innerHTML = `
        <div class="glitch-wrap" style="min-height:70svh">
          <div>
            <div class="glitch" data-text="LOST">LOST</div>
            <p style="color:var(--muted);margin:18px 0 28px">That project drifted out of orbit — it may only exist in another browser's local data.</p>
            <a class="btn btn-primary" href="explore.html" data-magnetic>Back to Explore</a>
          </div>
        </div>`;
      window.Nexus.refresh(root);
      document.title = 'Project not found — NEXUS';
      return;
    }

    document.title = `${project.name} — NEXUS`;
    render(root, project);
  });

  function render(root, p) {
    const esc = window.Nexus.escapeHTML;
    const grad = window.NexusStore.gradientFor(p.slug);
    const paragraphs = String(p.description || p.blurb).split(/\n\n+/)
      .map((par) => `<p>${esc(par)}</p>`).join('');

    const team = (p.team && p.team.length) ? `
      <h2 class="reveal">Team</h2>
      <div class="team-grid">
        ${p.team.map((m) => `
          <div class="team-card glass reveal">
            <div class="team-avatar" style="background:${grad}">${esc(m.name.charAt(0))}</div>
            <div>
              <div class="t-name">${esc(m.name)}</div>
              <div class="t-role">${esc(m.role)}</div>
            </div>
          </div>`).join('')}
      </div>` : '';

    const links = [
      p.links?.website && `<a href="${esc(p.links.website)}" target="_blank" rel="noopener">🌐 Website</a>`,
      p.links?.twitter && `<a href="${esc(p.links.twitter)}" target="_blank" rel="noopener">𝕏 Twitter / X</a>`,
      p.links?.whitepaper && `<a href="${esc(p.links.whitepaper)}" target="_blank" rel="noopener">📄 Whitepaper</a>`,
    ].filter(Boolean).join('');

    root.innerHTML = `
      <header class="detail-hero">
        <div class="detail-banner" style="background:${grad}"></div>
        <div class="container">
          <div class="detail-head reveal">
            <div class="detail-logo" style="background:${grad}">${window.NexusStore.monogram(p.name)}</div>
            <div class="detail-title">
              <h1>${esc(p.name)}</h1>
              <p class="tagline">${esc(p.tagline)}</p>
              <div class="detail-meta">
                <span class="chip chip-cat">${esc(p.category)}</span>
                <span class="chip chip-chain">${esc(p.chain)}</span>
                <span class="chip">${esc(p.stage)}</span>
                <span class="chip">Founded ${esc(p.founded)}</span>
                <span class="chip">${esc(p.location)}</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div class="container">
        <div class="detail-layout">
          <article class="detail-body">
            <h2 class="reveal">The pitch</h2>
            <div class="reveal">${paragraphs}</div>
            ${team}
          </article>

          <aside class="detail-side">
            <div class="side-card glass reveal">
              <h3>Raise snapshot</h3>
              <div class="side-stat"><span class="k">Raised to date</span><span class="v">${esc(window.NexusStore.formatRaised(p))}</span></div>
              <div class="side-stat"><span class="k">Now seeking</span><span class="v">${esc(p.seeking || '—')}</span></div>
              <div class="side-stat"><span class="k">Valuation</span><span class="v">${esc(p.valuation || '—')}</span></div>
              <div class="side-stat"><span class="k">Users</span><span class="v">${esc(p.users || '—')}</span></div>
              <div class="side-stat"><span class="k">TVL</span><span class="v">${esc(p.tvl || '—')}</span></div>
              <button class="btn btn-primary" id="connect-btn" data-magnetic style="width:100%;margin-top:20px">⚡ Connect with ${esc(p.name)}</button>
            </div>
            ${links ? `<div class="side-card glass reveal"><h3>Links</h3><div class="side-links">${links}</div></div>` : ''}
          </aside>
        </div>
      </div>

      <div class="modal-backdrop" id="connect-modal">
        <div class="modal" style="position:relative">
          <button class="modal-close" data-close>✕</button>
          <h3>Connect with <span class="text-gradient">${esc(p.name)}</span></h3>
          <p class="modal-sub">Introduce yourself — your intro goes straight to the founding team.</p>
          <div class="field">
            <label for="ci-name">Your name / fund</label>
            <input id="ci-name" type="text" placeholder="e.g. Meridian Ventures">
          </div>
          <div class="field">
            <label for="ci-msg">Message</label>
            <textarea id="ci-msg" placeholder="We lead seed rounds in ${esc(p.category)} and would love to learn more…"></textarea>
          </div>
          <div style="display:flex;gap:12px;flex-wrap:wrap">
            <button class="btn btn-primary" id="ci-send" data-magnetic>Send intro</button>
            <button class="btn btn-ghost" id="ci-copy" data-magnetic>Copy contact</button>
          </div>
        </div>
      </div>`;

    window.Nexus.refresh(root);

    const modal = root.querySelector('#connect-modal');
    root.querySelector('#connect-btn').addEventListener('click', () => window.Nexus.openModal(modal));
    modal.addEventListener('click', (e) => {
      if (e.target === modal || e.target.closest('[data-close]')) window.Nexus.closeModal(modal);
    });

    root.querySelector('#ci-send').addEventListener('click', () => {
      const name = root.querySelector('#ci-name').value.trim();
      const msg = root.querySelector('#ci-msg').value.trim();
      if (!name || !msg) { window.Nexus.toast('Add your name and a short message first.'); return; }
      const subject = encodeURIComponent(`[NEXUS] Intro from ${name} → ${p.name}`);
      const body = encodeURIComponent(`${msg}\n\n— ${name}\nvia NEXUS`);
      location.href = `mailto:${p.contact || ''}?subject=${subject}&body=${body}`;
      window.Nexus.closeModal(modal);
      window.Nexus.toast('Opening your mail client…');
    });

    root.querySelector('#ci-copy').addEventListener('click', async () => {
      try {
        await navigator.clipboard.writeText(p.contact || '');
        window.Nexus.toast(`Copied ${p.contact}`);
      } catch {
        window.Nexus.toast(p.contact || 'No contact listed');
      }
    });
  }
})();
