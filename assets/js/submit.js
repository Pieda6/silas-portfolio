/* ============================================================
   NEXUS submit — 3-step animated wizard with validation,
   localStorage persistence and a confetti finale.
   ============================================================ */
(function () {
  'use strict';

  const STEPS = 3;
  let current = 1;

  document.addEventListener('nexus:ready', () => {
    const wizard = document.getElementById('wizard');
    if (!wizard) return;

    bindNav(wizard);
    bindCharCount();
    showStep(1, true);
  });

  /* ---------- Step navigation ---------- */
  function bindNav(wizard) {
    wizard.addEventListener('click', (e) => {
      const next = e.target.closest('[data-next]');
      const back = e.target.closest('[data-back]');
      if (next) {
        if (!validateStep(current)) return;
        if (current === STEPS) { finish(); return; }
        showStep(current + 1);
      }
      if (back) showStep(current - 1);
    });
  }

  function showStep(n, instant) {
    const prevPanel = document.querySelector(`.wizard-panel[data-step="${current}"]`);
    const nextPanel = document.querySelector(`.wizard-panel[data-step="${n}"]`);
    current = n;

    // Progress UI
    document.querySelectorAll('.wp-step').forEach((el, i) => {
      el.classList.toggle('is-active', i + 1 === n);
      el.classList.toggle('is-done', i + 1 < n);
      el.querySelector('.wp-dot').textContent = i + 1 < n ? '✓' : String(i + 1);
    });
    document.querySelectorAll('.wp-line').forEach((el, i) => {
      el.classList.toggle('is-filled', i + 1 < n);
    });

    if (n === STEPS) buildReview();

    const swap = () => {
      document.querySelectorAll('.wizard-panel').forEach((p) => p.classList.remove('is-current'));
      nextPanel.classList.add('is-current');
      if (!window.Nexus.REDUCED && typeof gsap !== 'undefined') {
        gsap.fromTo(nextPanel, { opacity: 0, x: 34 }, { opacity: 1, x: 0, duration: 0.5, ease: 'power3.out' });
      }
    };

    if (instant || window.Nexus.REDUCED || typeof gsap === 'undefined' || !prevPanel || prevPanel === nextPanel) {
      swap();
    } else {
      gsap.to(prevPanel, { opacity: 0, x: -34, duration: 0.25, ease: 'power2.in', onComplete: swap });
    }
  }

  /* ---------- Validation ---------- */
  const RULES = {
    1: [
      { id: 'f-name', test: (v) => v.length >= 2, msg: 'Give your project a name (2+ characters).' },
      { id: 'f-category', test: (v) => !!v, msg: 'Pick a category.' },
      { id: 'f-chain', test: (v) => !!v, msg: 'Pick a chain.' },
      { id: 'f-stage', test: (v) => !!v, msg: 'Pick a funding stage.' },
    ],
    2: [
      { id: 'f-tagline', test: (v) => v.length >= 10, msg: 'A tagline of at least 10 characters.' },
      { id: 'f-blurb', test: (v) => v.length >= 40 && v.length <= 280, msg: 'The blurb is your pitch: 40–280 characters.' },
    ],
    3: [
      { id: 'f-contact', test: (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v), msg: 'A valid contact email so investors can reach you.' },
      { id: 'f-website', test: (v) => !v || /^https?:\/\/.+\..+/.test(v), msg: 'Website must be a full URL (https://…).' },
      { id: 'f-twitter', test: (v) => !v || /^https?:\/\/.+\..+/.test(v), msg: 'Twitter/X must be a full URL (https://…).' },
    ],
  };

  function validateStep(n) {
    let ok = true;
    (RULES[n] || []).forEach((rule) => {
      const input = document.getElementById(rule.id);
      const field = input.closest('.field');
      const valid = rule.test(input.value.trim());
      field.classList.toggle('has-error', !valid);
      field.querySelector('.error-msg').textContent = valid ? '' : rule.msg;
      if (!valid && ok) { ok = false; input.focus(); }
    });
    if (!ok && !window.Nexus.REDUCED && typeof gsap !== 'undefined') {
      const panel = document.querySelector(`.wizard-panel[data-step="${n}"]`);
      gsap.fromTo(panel, { x: 0 }, { x: 9, duration: 0.07, repeat: 5, yoyo: true, ease: 'none', clearProps: 'x' });
    }
    return ok;
  }

  /* ---------- Review ---------- */
  function val(id) { return document.getElementById(id).value.trim(); }

  function buildReview() {
    const esc = window.Nexus.escapeHTML;
    const rows = [
      ['Project', val('f-name')],
      ['Category', val('f-category')],
      ['Chain', val('f-chain')],
      ['Stage', val('f-stage')],
      ['Location', val('f-location') || '—'],
      ['Tagline', val('f-tagline')],
      ['Blurb', val('f-blurb')],
      ['Seeking', val('f-seeking') || '—'],
      ['Contact', val('f-contact')],
      ['Website', val('f-website') || '—'],
    ];
    document.getElementById('review-list').innerHTML = rows
      .filter(([, v]) => v)
      .map(([k, v]) => `<div class="review-item"><span class="k">${k}</span><span>${esc(v)}</span></div>`)
      .join('');
  }

  /* ---------- Finish: save + confetti ---------- */
  function finish() {
    const record = window.NexusStore.saveSubmission({
      name: val('f-name'),
      category: val('f-category'),
      chain: val('f-chain'),
      stage: val('f-stage'),
      location: val('f-location'),
      tagline: val('f-tagline'),
      blurb: val('f-blurb'),
      description: val('f-description'),
      seeking: val('f-seeking'),
      contact: val('f-contact'),
      website: val('f-website'),
      twitter: val('f-twitter'),
    });

    document.querySelector('.wizard-progress').style.display = 'none';
    document.querySelectorAll('.wizard-panel').forEach((p) => p.classList.remove('is-current'));
    const success = document.getElementById('wizard-success');
    success.classList.add('is-shown');
    document.getElementById('success-link').href = `project.html?id=${encodeURIComponent(record.slug)}`;

    if (!window.Nexus.REDUCED && typeof gsap !== 'undefined') {
      gsap.from(success, { opacity: 0, y: 30, duration: 0.7, ease: 'power3.out' });
      gsap.from(success.querySelector('.success-orb'), {
        scale: 0, rotation: -120, duration: 0.9, ease: 'back.out(1.7)', delay: 0.15,
      });
    }
    confetti();
  }

  /* ---------- Confetti burst (canvas, no library) ---------- */
  function confetti() {
    if (window.Nexus.REDUCED) return;
    const canvas = document.createElement('canvas');
    canvas.id = 'confetti-canvas';
    document.body.appendChild(canvas);
    const ctx = canvas.getContext('2d');
    canvas.width = innerWidth;
    canvas.height = innerHeight;

    const COLORS = ['#22d3ee', '#8b5cf6', '#e879f9', '#34d399', '#f59e0b', '#ffffff'];
    const parts = Array.from({ length: 180 }, () => ({
      x: canvas.width / 2 + (Math.random() - 0.5) * 140,
      y: canvas.height * 0.42,
      vx: (Math.random() - 0.5) * 15,
      vy: -6 - Math.random() * 11,
      size: 4 + Math.random() * 6,
      color: COLORS[(Math.random() * COLORS.length) | 0],
      rot: Math.random() * Math.PI,
      vr: (Math.random() - 0.5) * 0.3,
      life: 1,
    }));

    let frame = 0;
    (function tick() {
      frame++;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      let alive = false;
      parts.forEach((p) => {
        p.vy += 0.28;
        p.x += p.vx;
        p.y += p.vy;
        p.rot += p.vr;
        p.life -= 0.006;
        if (p.life <= 0 || p.y > canvas.height + 30) return;
        alive = true;
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot);
        ctx.globalAlpha = Math.max(0, p.life);
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.6);
        ctx.restore();
      });
      if (alive && frame < 500) requestAnimationFrame(tick);
      else canvas.remove();
    })();
  }

  /* ---------- Char counter ---------- */
  function bindCharCount() {
    const blurb = document.getElementById('f-blurb');
    const counter = document.getElementById('blurb-count');
    if (!blurb || !counter) return;
    const update = () => {
      counter.textContent = `${blurb.value.length} / 280`;
      counter.style.color = blurb.value.length > 280 ? '#f87171' : '';
    };
    blurb.addEventListener('input', update);
    update();
  }
})();
