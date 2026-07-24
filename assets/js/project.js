/* ============================================================
   Ethos Labs project detail — profile layout: art banner, round
   avatar, stat strip, pitch body, Connect modal.
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
        <div class="notfound-wrap" style="min-height:80svh;border-radius:0 0 26px 26px">
          <div>
            <div class="notfound-code">L<em>o</em>st</div>
            <p>That project isn't listed here — it may only exist in another browser's local data.</p>
            <a class="btn btn-lime" href="explore.html" data-magnetic>Back to Explore</a>
          </div>
        </div>`;
      window.Nexus.refresh(root);
      document.title = 'Project not found — Ethos Labs';
      return;
    }

    document.title = `${project.name} — Ethos Labs`;
    render(root, project);
  });

  function render(root, p) {
    const esc = window.Nexus.escapeHTML;
    const icon = window.Nexus.icon;
    const catColor = window.NexusArt.categoryColor(p.category);
    const paragraphs = String(p.description || p.blurb).split(/\n\n+/)
      .map((par) => `<p>${esc(par)}</p>`).join('');

    const team = (p.team && p.team.length) ? `
      <h2 class="reveal">Team</h2>
      <div class="team-grid">
        ${p.team.map((m) => `
          <div class="team-card reveal">
            <div class="team-avatar"><canvas data-art="${p.slug}-${esc(m.name)}" data-art-simple data-art-noframe data-art-w="240" data-art-h="240"></canvas></div>
            <div>
              <div class="t-name">${esc(m.name)}</div>
              <div class="t-role">${esc(m.role)}</div>
            </div>
          </div>`).join('')}
      </div>` : '';

    const links = [
      p.links?.website && `<a href="${esc(p.links.website)}" target="_blank" rel="noopener"><span class="li-ico">${icon('globe')}</span>Website</a>`,
      p.links?.twitter && `<a href="${esc(p.links.twitter)}" target="_blank" rel="noopener"><span class="li-ico">${icon('x')}</span>Twitter / X</a>`,
      p.links?.whitepaper && `<a href="${esc(p.links.whitepaper)}" target="_blank" rel="noopener"><span class="li-ico">${icon('doc')}</span>Whitepaper</a>`,
    ].filter(Boolean).join('');

    root.innerHTML = `
      <header class="detail-hero">
        <div class="container">
          <div class="detail-banner-wrap">
            <div class="detail-banner"><canvas data-art="${p.slug}" data-art-noframe data-art-w="1600" data-art-h="480"></canvas></div>
            <div class="detail-avatar"><canvas data-art="${p.slug}-avatar" data-art-simple data-art-noframe data-art-w="240" data-art-h="240"></canvas></div>
          </div>
          <div class="detail-head">
            <div class="detail-title-row">
              <h1>${esc(p.name)}</h1>
              ${window.Nexus.verifiedBadge}
            </div>
            <p class="detail-tagline">${esc(p.tagline)}</p>
            <div class="detail-meta">
              <span class="chip chip-cat" style="--cat:${catColor}">${esc(p.category)}</span>
              <span class="chip">${esc(p.chain)}</span>
              <span class="chip">${esc(p.stage)}</span>
              <span class="chip">Founded ${esc(p.founded)}</span>
              <span class="chip">${esc(p.location)}</span>
            </div>
            <div class="stat-strip reveal">
              <div class="ss-item"><div class="ss-v">${esc(window.NexusStore.formatRaised(p))}</div><div class="ss-k">Raised</div></div>
              <div class="ss-item"><div class="ss-v">${esc(p.seeking || '—')}</div><div class="ss-k">Seeking</div></div>
              <div class="ss-item"><div class="ss-v">${esc(p.valuation || '—')}</div><div class="ss-k">Valuation</div></div>
              <div class="ss-item"><div class="ss-v">${esc(p.users || '—')}</div><div class="ss-k">Users</div></div>
              <div class="ss-item"><div class="ss-v">${esc(p.tvl || '—')}</div><div class="ss-k">TVL</div></div>
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
            <div class="side-card reveal">
              <h3>Get in touch</h3>
              <p style="color:var(--muted);font-size:0.92rem;margin-bottom:18px">Interested in ${esc(p.name)}'s ${esc(p.stage)} round? Introduce yourself directly to the founding team.</p>
              <button class="btn btn-primary" id="connect-btn" data-magnetic style="width:100%">Connect with ${esc(p.name)}</button>
            </div>
            ${links ? `<div class="side-card reveal"><h3>Links</h3><div class="side-links">${links}</div></div>` : ''}
          </aside>
        </div>
      </div>

      <div class="modal-backdrop" id="connect-modal">
        <div class="modal" style="position:relative">
          <button class="modal-close" data-close aria-label="Close">${icon('close')}</button>
          <h3>Connect with ${esc(p.name)}</h3>
          <p class="modal-sub">Introduce yourself — your intro goes straight to the founding team.</p>
          <div class="field">
            <label for="ci-name">Your name / fund</label>
            <input id="ci-name" type="text" placeholder="e.g. Meridian Ventures">
          </div>
          <div class="field">
            <label for="ci-msg">Message</label>
            <textarea id="ci-msg" placeholder="We lead ${esc(p.stage)} rounds in ${esc(p.category)} and would love to learn more…"></textarea>
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
      const subject = encodeURIComponent(`[Ethos Labs] Intro from ${name} → ${p.name}`);
      const body = encodeURIComponent(`${msg}\n\n— ${name}\nvia Ethos Labs`);
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
