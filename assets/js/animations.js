/* ============================================================
   NEXUS shared runtime — injects nav/footer/transition, boots
   Lenis smooth scrolling, GSAP reveals, magnetic buttons,
   counters, toasts and modals. Light editorial edition.
   ============================================================ */
(function () {
  'use strict';

  const REDUCED = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const FINE_POINTER = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  if (REDUCED) document.documentElement.classList.add('no-motion');

  const PAGES = [
    { href: 'index.html', label: 'Home' },
    { href: 'explore.html', label: 'Explore' },
    { href: 'submit.html', label: 'Submit' },
  ];

  /* ---------- Tiny inline SVG icon set (no emoji) ---------- */
  const ICONS = {
    logo: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 1 23 12 12 23 1 12Z"/></svg>',
    check: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"><path d="M4 12.5 10 18 20 6"/></svg>',
    arrow: '<svg class="icon" viewBox="0 0 24 24"><path d="M5 12h14M13 6l6 6-6 6"/></svg>',
    arrowUpRight: '<svg class="icon" viewBox="0 0 24 24"><path d="M7 17 17 7M9 7h8v8"/></svg>',
    search: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>',
    globe: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c2.5 2.6 3.8 5.7 3.8 9S14.5 18.4 12 21c-2.5-2.6-3.8-5.7-3.8-9S9.5 5.6 12 3Z"/></svg>',
    x: '<svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M18.9 2H22l-6.8 7.8L23.3 22h-6.3l-4.9-6.4L6.5 22H3.4l7.3-8.3L1.6 2H8l4.4 5.9L18.9 2Zm-1.1 18h1.7L7.1 3.7H5.3L17.8 20Z"/></svg>',
    doc: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M6 2h9l5 5v15H6z"/><path d="M14 2v6h6M9 13h7M9 17h7"/></svg>',
    bolt: '<svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor"><path d="M13 2 4 14h6l-1 8 9-12h-6l1-8Z"/></svg>',
    close: '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M5 5l14 14M19 5 5 19"/></svg>',
    mail: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="2.5" y="5" width="19" height="14" rx="2.5"/><path d="m3.5 6.5 8.5 7 8.5-7"/></svg>',
    copy: '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="8.5" y="8.5" width="12" height="12" rx="2"/><path d="M15.5 5.5v-1a2 2 0 0 0-2-2h-9a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h1"/></svg>',
    rocket: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4.5 16.5c-1.5 1.3-2 5-2 5s3.7-.5 5-2c.7-.8.7-2 0-2.8-.8-.7-2.2-.7-3 .8Z"/><path d="m12 15-3-3c.6-1.5 1.4-2.9 2.5-4.2C14 5 17.6 3.4 21.5 2.5c-.9 3.9-2.5 7.5-5.3 10-1.3 1.1-2.7 1.9-4.2 2.5Z"/><path d="M9 12H4.5L7 7.9c.8-.4 1.7-.4 2.5 0M12 15v4.5l4.1-2.5c.4-.8.4-1.7 0-2.5"/></svg>',
  };
  function icon(name) { return ICONS[name] || ''; }

  const verifiedBadge = `<span class="verified" title="Verified">${ICONS.check}</span>`;

  function currentPage() {
    return location.pathname.split('/').pop() || 'index.html';
  }

  /* ---------- Shell ---------- */
  function injectShell() {
    const body = document.body;

    const overlay = document.createElement('div');
    overlay.className = 'page-transition';
    body.prepend(overlay);

    // Nav
    const page = currentPage();
    const nav = document.createElement('nav');
    nav.className = 'site-nav';
    nav.innerHTML = `
      <div class="container">
        <a class="nav-logo" href="index.html">
          <span class="logo-mark">${ICONS.logo}</span>NEXUS
        </a>
        <ul class="nav-links">
          ${PAGES.map((p) => `<li><a href="${p.href}" class="${p.href === page ? 'is-active' : ''}">${p.label}</a></li>`).join('')}
        </ul>
        <div class="nav-cta">
          <a href="submit.html" class="btn btn-primary btn-sm" data-magnetic>List your project</a>
          <button class="nav-burger" aria-label="Menu" aria-expanded="false">
            <span></span><span></span><span></span>
          </button>
        </div>
      </div>
      <div class="mobile-menu">
        ${PAGES.map((p) => `<a href="${p.href}" class="${p.href === page ? 'is-active' : ''}">${p.label}</a>`).join('')}
        <a href="submit.html" class="btn btn-primary" style="margin-top:10px;justify-content:center">List your project</a>
      </div>`;
    body.prepend(nav);

    const burger = nav.querySelector('.nav-burger');
    const menu = nav.querySelector('.mobile-menu');
    burger.addEventListener('click', () => {
      const open = menu.classList.toggle('is-open');
      burger.classList.toggle('is-open', open);
      burger.setAttribute('aria-expanded', String(open));
    });

    const onScroll = () => nav.classList.toggle('is-scrolled', window.scrollY > 16);
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();

    // Footer
    const footer = document.createElement('footer');
    footer.className = 'site-footer';
    footer.innerHTML = `
      <div class="container">
        <div class="footer-grid">
          <div>
            <a class="nav-logo" href="index.html"><span class="logo-mark">${ICONS.logo}</span>NEXUS</a>
            <p class="footer-tag">Where Web3 builders meet the capital that believes in them. Post your project. Get discovered. Get funded.</p>
          </div>
          <div class="footer-col">
            <h4>Platform</h4>
            <ul>
              <li><a href="explore.html">Explore projects</a></li>
              <li><a href="submit.html">Submit a project</a></li>
              <li><a href="index.html#how">How it works</a></li>
            </ul>
          </div>
          <div class="footer-col">
            <h4>About</h4>
            <ul>
              <li><a href="portfolio.html">Built by Silas</a></li>
              <li><a href="https://github.com/pieda6/silas-portfolio" target="_blank" rel="noopener">GitHub</a></li>
            </ul>
          </div>
        </div>
        <div class="footer-bottom">
          <span>© ${new Date().getFullYear()} NEXUS — demo platform. Projects shown are illustrative.</span>
          <span>Designed & built with care</span>
        </div>
      </div>`;
    body.append(footer);

    const toast = document.createElement('div');
    toast.className = 'toast';
    body.append(toast);

    return overlay;
  }

  /* ---------- Intro ---------- */
  function playIntro(overlay) {
    if (REDUCED || typeof gsap === 'undefined') {
      overlay.classList.add('is-done');
      return;
    }
    gsap.to(overlay, {
      opacity: 0, duration: 0.5, delay: 0.1, ease: 'power2.out',
      onComplete: () => overlay.classList.add('is-done'),
    });
  }

  /* ---------- Smooth scroll ---------- */
  function initLenis() {
    if (REDUCED || typeof Lenis === 'undefined') return null;
    const lenis = new Lenis({ lerp: 0.11 });
    function raf(t) { lenis.raf(t); requestAnimationFrame(raf); }
    requestAnimationFrame(raf);
    if (typeof ScrollTrigger !== 'undefined') lenis.on('scroll', ScrollTrigger.update);
    document.addEventListener('click', (e) => {
      const a = e.target.closest('a[href^="#"], a[href*="#"]');
      if (!a) return;
      const url = new URL(a.href, location.href);
      if (url.pathname === location.pathname && url.hash) {
        const target = document.querySelector(url.hash);
        if (target) { e.preventDefault(); lenis.scrollTo(target, { offset: -80 }); }
      }
    });
    return lenis;
  }

  /* ---------- Reveals ---------- */
  function initReveals(scope) {
    const els = (scope || document).querySelectorAll('.reveal');
    if (REDUCED || typeof gsap === 'undefined') {
      els.forEach((el) => (el.style.opacity = 1));
      return;
    }
    els.forEach((el) => {
      if (el.dataset.revealBound) return;
      el.dataset.revealBound = '1';
      gsap.fromTo(el,
        { opacity: 0, y: 24 },
        {
          opacity: 1, y: 0, duration: 0.8, ease: 'power3.out',
          delay: parseFloat(el.dataset.delay || 0),
          scrollTrigger: { trigger: el, start: 'top 90%', once: true },
        });
    });
  }

  /* ---------- Magnetic buttons (subtle) ---------- */
  function initMagnetic(scope) {
    if (REDUCED || !FINE_POINTER || typeof gsap === 'undefined') return;
    (scope || document).querySelectorAll('[data-magnetic]').forEach((el) => {
      if (el.dataset.magneticBound) return;
      el.dataset.magneticBound = '1';
      const strength = 0.18;
      el.addEventListener('mousemove', (e) => {
        const r = el.getBoundingClientRect();
        gsap.to(el, {
          x: (e.clientX - r.left - r.width / 2) * strength,
          y: (e.clientY - r.top - r.height / 2) * strength,
          duration: 0.35, ease: 'power2.out',
        });
      });
      el.addEventListener('mouseleave', () => {
        gsap.to(el, { x: 0, y: 0, duration: 0.55, ease: 'elastic.out(1, 0.5)' });
      });
    });
  }

  /* ---------- Counters ---------- */
  function initCounters(scope) {
    (scope || document).querySelectorAll('[data-count]').forEach((el) => {
      if (el.dataset.countBound) return;
      el.dataset.countBound = '1';
      const end = parseFloat(el.dataset.count);
      const prefix = el.dataset.prefix || '';
      const suffix = el.dataset.suffix || '';
      const decimals = parseInt(el.dataset.decimals || '0', 10);
      const render = (v) => {
        el.textContent = prefix + v.toLocaleString('en-US', {
          minimumFractionDigits: decimals, maximumFractionDigits: decimals,
        }) + suffix;
      };
      if (REDUCED || typeof gsap === 'undefined') { render(end); return; }
      const obj = { v: 0 };
      gsap.to(obj, {
        v: end, duration: 1.6, ease: 'power2.out',
        onUpdate: () => render(obj.v),
        scrollTrigger: { trigger: el, start: 'top 92%', once: true },
      });
    });
  }

  /* ---------- Toast / modal ---------- */
  let toastTimer;
  function toast(msg) {
    const el = document.querySelector('.toast');
    if (!el) return;
    el.textContent = msg;
    el.classList.add('is-shown');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => el.classList.remove('is-shown'), 3000);
  }

  function openModal(backdrop) {
    backdrop.classList.add('is-open');
    document.addEventListener('keydown', function escClose(e) {
      if (e.key === 'Escape') { closeModal(backdrop); document.removeEventListener('keydown', escClose); }
    });
  }
  function closeModal(backdrop) { backdrop.classList.remove('is-open'); }

  /* ---------- Card factory ---------- */
  function projectCardHTML(p) {
    const catColor = window.NexusArt.categoryColor(p.category);
    return `
      <a class="project-card" href="project.html?id=${encodeURIComponent(p.slug)}" data-slug="${p.slug}">
        <div class="card-cover">
          <canvas data-art="${p.slug}"></canvas>
          <span class="cover-badge">${escapeHTML(p.chain)}</span>
        </div>
        <div class="card-body">
          <div class="card-title-row">
            <span class="card-title">${escapeHTML(p.name)}</span>
            ${verifiedBadge}
            <span class="card-loc">${escapeHTML(p.location || '')}</span>
          </div>
          <p class="card-blurb">${escapeHTML(p.blurb)}</p>
          <div class="card-tags">
            <span class="chip chip-cat" style="--cat:${catColor}">${escapeHTML(p.category)}</span>
            ${p.isLocal ? '<span class="chip">Your submission</span>' : ''}
          </div>
          <div class="card-foot">
            <div class="card-raised">${window.NexusStore.formatRaised(p)}<span>raised</span></div>
            <div class="card-stage">${escapeHTML(p.stage)}</div>
          </div>
        </div>
      </a>`;
  }

  function escapeHTML(s) {
    return String(s ?? '').replace(/[&<>"']/g, (c) => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
    })[c]);
  }

  /* ---------- Boot ---------- */
  document.addEventListener('DOMContentLoaded', () => {
    if (typeof gsap !== 'undefined' && typeof ScrollTrigger !== 'undefined') {
      gsap.registerPlugin(ScrollTrigger);
    }
    const overlay = injectShell();
    initLenis();
    playIntro(overlay);
    initReveals();
    initMagnetic();
    initCounters();
    window.NexusArt.paintAll();
    document.dispatchEvent(new CustomEvent('nexus:ready'));
  });

  window.Nexus = {
    REDUCED,
    icon,
    verifiedBadge,
    toast,
    openModal,
    closeModal,
    projectCardHTML,
    escapeHTML,
    refresh(scope) {
      initReveals(scope);
      initMagnetic(scope);
      initCounters(scope);
      window.NexusArt.paintAll(scope);
    },
  };
})();
