/* ============================================================
   Ethos Labs store — data layer.
   Seed projects come from data/projects.json; user-submitted
   projects are overlaid from localStorage. Swap the internals
   of fetchSeed()/saveSubmission() for a real API later without
   touching any UI code.
   ============================================================ */
(function () {
  'use strict';

  const LS_KEY = 'nexus.projects.v1';
  const PALETTES = [
    ['#22d3ee', '#8b5cf6'],
    ['#8b5cf6', '#e879f9'],
    ['#e879f9', '#f59e0b'],
    ['#34d399', '#22d3ee'],
    ['#f472b6', '#8b5cf6'],
    ['#60a5fa', '#34d399'],
  ];

  let cache = null;

  function seedUrl() {
    return 'data/projects.json';
  }

  async function fetchSeed() {
    const res = await fetch(seedUrl(), { cache: 'no-cache' });
    if (!res.ok) throw new Error('Failed to load projects: ' + res.status);
    return res.json();
  }

  function loadLocal() {
    try {
      return JSON.parse(localStorage.getItem(LS_KEY) || '[]');
    } catch {
      return [];
    }
  }

  function saveLocal(list) {
    localStorage.setItem(LS_KEY, JSON.stringify(list));
  }

  function slugify(name) {
    return String(name).toLowerCase().trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '') || 'project';
  }

  function gradientFor(slug) {
    let h = 0;
    for (let i = 0; i < slug.length; i++) h = (h * 31 + slug.charCodeAt(i)) >>> 0;
    const [a, b] = PALETTES[h % PALETTES.length];
    return `linear-gradient(135deg, ${a}, ${b})`;
  }

  function monogram(name) {
    return String(name).trim().charAt(0).toUpperCase() || 'N';
  }

  const Store = {
    /** All projects (seed + locally submitted), newest submissions first. */
    async getAll() {
      if (cache) return cache;
      const seed = await fetchSeed();
      const local = loadLocal();
      cache = [...local, ...seed];
      return cache;
    },

    async getBySlug(slug) {
      const all = await this.getAll();
      return all.find((p) => p.slug === slug) || null;
    },

    /** Persist a submitted project locally; returns the stored record. */
    saveSubmission(input) {
      const local = loadLocal();
      let slug = slugify(input.name);
      const taken = new Set([...local.map((p) => p.slug)]);
      let i = 2;
      while (taken.has(slug)) slug = slugify(input.name) + '-' + i++;

      const record = {
        slug,
        name: input.name,
        tagline: input.tagline,
        blurb: input.blurb,
        description: input.description || input.blurb,
        category: input.category,
        chain: input.chain,
        stage: input.stage,
        raised: 0,
        raisedLabel: input.raisedLabel || '—',
        seeking: input.seeking || '—',
        valuation: '—',
        users: '—',
        tvl: '—',
        founded: new Date().getFullYear(),
        location: input.location || '—',
        trending: 50,
        createdAt: new Date().toISOString().slice(0, 10),
        team: input.team || [],
        links: {
          website: input.website || '',
          twitter: input.twitter || '',
          whitepaper: input.whitepaper || '',
        },
        contact: input.contact || '',
        isLocal: true,
      };
      local.unshift(record);
      saveLocal(local);
      cache = null;
      return record;
    },

    gradientFor,
    monogram,

    formatRaised(p) {
      return p.raisedLabel && p.raisedLabel !== '' ? p.raisedLabel : '—';
    },
  };

  window.NexusStore = Store;
})();
