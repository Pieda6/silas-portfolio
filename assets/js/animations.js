/* ============================================================
   NEXUS animations — shared runtime for every page.
   Injects nav/footer/cursor/transition overlay, boots Lenis
   smooth scrolling, GSAP scroll reveals, magnetic buttons,
   3D card tilt, counters, toasts and modals.
   ============================================================ */
(function () {
  'use strict';

  const REDUCED = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const FINE_POINTER = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  if (REDUCED) document.documentElement.classList.add('no-motion');

  const PAGES = [
    { href: 'index.html', label: 'Home' },
    { href: 'explore.html', label: 'Explore' },
    { href: 'submit.html', label: 'Submit project' },
  ];

  function currentPage() {
    const path = location.pathname.split('/').pop() || 'index.html';
    return path;
  }

  /* ---------- Shell: overlay, cursor, nav, footer ---------- */
  function injectShell() {
    const body = document.body;

    // Page transition overlay
    const overlay = document.createElement('div');
    overlay.className = 'page-transition';
    overlay.innerHTML = '<div class="pt-logo"><span class="text-gradient">NEXUS</span></div>';
    body.prepend(overlay);

    // Ambient background layers
    const glow = document.createElement('div');
    glow.className = 'page-glow';
    const grid = document.createElement('div');
    grid.className = 'bg-grid';
    body.prepend(grid);
    body.prepend(glow);

    // Custom cursor
    if (FINE_POINTER && !REDUCED) {
      const dot = document.createElement('div');
      dot.className = 'cursor-dot';
      const ring = document.createElement('div');
      ring.className = 'cursor-ring';
      body.append(dot, ring);
      initCursor(dot, ring);
    }

    // Nav
    const page = currentPage();
    const nav = document.createElement('nav');
    nav.className = 'site-nav';
    nav.innerHTML = `
      <div class="container">
        <a class="nav-logo" href="index.html" data-magnetic>
          <span class="logo-mark">◈</span>NEXUS
        </a>
        <ul class="nav-links">
          ${PAGES.map((p) => `<li><a href="${p.href}" class="${p.href === page ? 'is-active' : ''}">${p.label}</a></li>`).join('')}
        </ul>
        <div class="nav-cta">
          <a href="submit.html" class="btn btn-primary btn-sm" data-magnetic>Launch your project</a>
          <button class="nav-burger" aria-label="Menu" aria-expanded="false">
            <span></span><span></span><span></span>
          </button>
        </div>
      </div>
      <div class="mobile-menu">
        ${PAGES.map((p) => `<a href="${p.href}" class="${p.href === page ? 'is-active' : ''}">${p.label}</a>`).join('')}
      </div>`;
    body.prepend(nav);

    const burger = nav.querySelector('.nav-burger');
    const menu = nav.querySelector('.mobile-menu');
    burger.addEventListener('click', () => {
      const open = menu.classList.toggle('is-open');
      burger.classList.toggle('is-open', open);
      burger.setAttribute('aria-expanded', String(open));
    });

    const onScroll = () => nav.classList.toggle('is-scrolled', window.scrollY > 24);
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();

    // Footer
    const footer = document.createElement('footer');
    footer.className = 'site-footer';
    footer.innerHTML = `
      <div class="container">
        <div class="footer-grid">
          <div>
            <a class="nav-logo" href="index.html"><span class="logo-mark">◈</span>NEXUS</a>
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
          <span>Built with ♥ and WebGL</span>
        </div>
      </div>`;
    body.append(footer);

    // Toast host
    const toast = document.createElement('div');
    toast.className = 'toast';
    body.append(toast);

    return overlay;
  }

  /* ---------- Custom cursor ---------- */
  function initCursor(dot, ring) {
    let mx = -100, my = -100, rx = -100, ry = -100;
    window.addEventListener('mousemove', (e) => { mx = e.clientX; my = e.clientY; }, { passive: true });

    (function loop() {
      rx += (mx - rx) * 0.16;
      ry += (my - ry) * 0.16;
      dot.style.transform = `translate(${mx - 4}px, ${my - 4}px)`;
      const size = ring.offsetWidth;
      ring.style.transform = `translate(${rx - size / 2}px, ${ry - size / 2}px)`;
      requestAnimationFrame(loop);
    })();

    document.addEventListener('mouseover', (e) => {
      if (e.target.closest('a, button, .project-card, input, select, textarea, .pill')) {
        ring.classList.add('is-hovering');
      }
    });
    document.addEventListener('mouseout', (e) => {
      if (e.target.closest('a, button, .project-card, input, select, textarea, .pill')) {
        ring.classList.remove('is-hovering');
      }
    });
  }

  /* ---------- Intro transition ---------- */
  function playIntro(overlay) {
    if (REDUCED || typeof gsap === 'undefined') {
      overlay.classList.add('is-done');
      return;
    }
    const tl = gsap.timeline({
      onComplete: () => overlay.classList.add('is-done'),
    });
    tl.to(overlay.querySelector('.pt-logo'), { opacity: 0, y: -18, duration: 0.4, delay: 0.35, ease: 'power2.in' })
      .to(overlay, { clipPath: 'inset(0 0 100% 0)', duration: 0.75, ease: 'power4.inOut' });
  }

  /* ---------- Smooth scroll (Lenis) ---------- */
  function initLenis() {
    if (REDUCED || typeof Lenis === 'undefined') return null;
    const lenis = new Lenis({ lerp: 0.1, wheelMultiplier: 1 });
    function raf(t) { lenis.raf(t); requestAnimationFrame(raf); }
    requestAnimationFrame(raf);
    if (typeof ScrollTrigger !== 'undefined') {
      lenis.on('scroll', ScrollTrigger.update);
    }
    // Anchor links
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

  /* ---------- Scroll reveals ---------- */
  function initReveals(scope) {
    const els = (scope || document).querySelectorAll('.reveal');
    if (REDUCED || typeof gsap === 'undefined') {
      els.forEach((el) => (el.style.opacity = 1));
      return;
    }
    els.forEach((el) => {
      gsap.fromTo(el,
        { opacity: 0, y: 42 },
        {
          opacity: 1, y: 0, duration: 1, ease: 'power3.out',
          delay: parseFloat(el.dataset.delay || 0),
          scrollTrigger: { trigger: el, start: 'top 88%', once: true },
        });
    });
  }

  /* ---------- Magnetic buttons ---------- */
  function initMagnetic(scope) {
    if (REDUCED || !FINE_POINTER || typeof gsap === 'undefined') return;
    (scope || document).querySelectorAll('[data-magnetic]').forEach((el) => {
      if (el.dataset.magneticBound) return;
      el.dataset.magneticBound = '1';
      const strength = 0.35;
      el.addEventListener('mousemove', (e) => {
        const r = el.getBoundingClientRect();
        const x = e.clientX - r.left - r.width / 2;
        const y = e.clientY - r.top - r.height / 2;
        gsap.to(el, { x: x * strength, y: y * strength, duration: 0.4, ease: 'power2.out' });
      });
      el.addEventListener('mouseleave', () => {
        gsap.to(el, { x: 0, y: 0, duration: 0.7, ease: 'elastic.out(1, 0.4)' });
      });
    });
  }

  /* ---------- 3D tilt + glare on cards ---------- */
  function initTilt(scope) {
    if (REDUCED || !FINE_POINTER) return;
    (scope || document).querySelectorAll('.project-card').forEach((card) => {
      if (card.dataset.tiltBound) return;
      card.dataset.tiltBound = '1';
      card.addEventListener('mousemove', (e) => {
        const r = card.getBoundingClientRect();
        const px = (e.clientX - r.left) / r.width;
        const py = (e.clientY - r.top) / r.height;
        card.style.setProperty('--gx', `${px * 100}%`);
        card.style.setProperty('--gy', `${py * 100}%`);
        if (typeof gsap !== 'undefined') {
          gsap.to(card, {
            rotateY: (px - 0.5) * 10,
            rotateX: (0.5 - py) * 10,
            transformPerspective: 900,
            duration: 0.5, ease: 'power2.out',
          });
        }
      });
      card.addEventListener('mouseleave', () => {
        if (typeof gsap !== 'undefined') {
          gsap.to(card, { rotateY: 0, rotateX: 0, duration: 0.8, ease: 'elastic.out(1, 0.5)' });
        }
      });
    });
  }

  /* ---------- Animated counters ---------- */
  function initCounters(scope) {
    (scope || document).querySelectorAll('[data-count]').forEach((el) => {
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
        v: end, duration: 2, ease: 'power2.out',
        onUpdate: () => render(obj.v),
        scrollTrigger: { trigger: el, start: 'top 90%', once: true },
      });
    });
  }

  /* ---------- Toast ---------- */
  let toastTimer;
  function toast(msg) {
    const el = document.querySelector('.toast');
    if (!el) return;
    el.textContent = msg;
    el.classList.add('is-shown');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => el.classList.remove('is-shown'), 3200);
  }

  /* ---------- Modal helper ---------- */
  function openModal(backdrop) {
    backdrop.classList.add('is-open');
    document.addEventListener('keydown', escClose);
    function escClose(e) {
      if (e.key === 'Escape') { closeModal(backdrop); document.removeEventListener('keydown', escClose); }
    }
  }
  function closeModal(backdrop) {
    backdrop.classList.remove('is-open');
  }

  /* ---------- Card factory (shared by pages) ---------- */
  function projectCardHTML(p) {
    const grad = window.NexusStore.gradientFor(p.slug);
    return `
      <a class="project-card" href="project.html?id=${encodeURIComponent(p.slug)}" data-slug="${p.slug}">
        <div class="card-glare"></div>
        <div class="card-top">
          <div class="card-logo" style="background:${grad}">${window.NexusStore.monogram(p.name)}</div>
          <div>
            <div class="card-title">${escapeHTML(p.name)}</div>
            <div class="card-sub">${escapeHTML(p.location || '')}</div>
          </div>
        </div>
        <p class="card-blurb">${escapeHTML(p.blurb)}</p>
        <div class="card-tags">
          <span class="chip chip-cat">${escapeHTML(p.category)}</span>
          <span class="chip chip-chain">${escapeHTML(p.chain)}</span>
          ${p.isLocal ? '<span class="chip" style="color:var(--green);border-color:rgba(52,211,153,.4)">Your submission</span>' : ''}
        </div>
        <div class="card-stats">
          <div class="card-raised">${window.NexusStore.formatRaised(p)}<span>raised</span></div>
          <div class="card-stage">${escapeHTML(p.stage)}</div>
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
    initTilt();
    initCounters();
    document.dispatchEvent(new CustomEvent('nexus:ready'));
  });

  window.Nexus = {
    REDUCED,
    toast,
    openModal,
    closeModal,
    projectCardHTML,
    escapeHTML,
    refresh(scope) { initReveals(scope); initMagnetic(scope); initTilt(scope); initCounters(scope); },
  };
})();
