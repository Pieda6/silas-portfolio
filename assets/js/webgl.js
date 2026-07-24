/* ============================================================
   NEXUS WebGL hero — Three.js particle nebula.
   ~9k particles arranged in a slowly-breathing spiral galaxy,
   tinted with the brand gradient, reacting to pointer movement
   and scroll depth. Falls back to the static CSS glow when
   WebGL is unavailable or reduced motion is requested.
   ============================================================ */
(function () {
  'use strict';

  function supportsWebGL() {
    try {
      const c = document.createElement('canvas');
      return !!(window.WebGLRenderingContext && (c.getContext('webgl') || c.getContext('experimental-webgl')));
    } catch {
      return false;
    }
  }

  document.addEventListener('nexus:ready', () => {
    const mount = document.getElementById('hero-canvas');
    if (!mount) return;
    if (window.Nexus.REDUCED || typeof THREE === 'undefined' || !supportsWebGL()) return;

    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x04050c, 0.055);

    const camera = new THREE.PerspectiveCamera(60, 1, 0.1, 100);
    camera.position.set(0, 1.6, 7.5);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    mount.appendChild(renderer.domElement);

    /* ----- Galaxy particles ----- */
    const COUNT = 9000;
    const positions = new Float32Array(COUNT * 3);
    const colors = new Float32Array(COUNT * 3);
    const seeds = new Float32Array(COUNT);

    const cCyan = new THREE.Color(0x22d3ee);
    const cViolet = new THREE.Color(0x8b5cf6);
    const cMagenta = new THREE.Color(0xe879f9);

    const ARMS = 4;
    for (let i = 0; i < COUNT; i++) {
      const radius = Math.pow(Math.random(), 0.7) * 6;
      const armAngle = ((i % ARMS) / ARMS) * Math.PI * 2;
      const spin = radius * 0.85;
      const spread = (Math.random() - 0.5) * (0.5 + radius * 0.22);
      const angle = armAngle + spin + spread * 0.4;

      positions[i * 3] = Math.cos(angle) * radius + (Math.random() - 0.5) * 0.35;
      positions[i * 3 + 1] = (Math.random() - 0.5) * (0.45 + radius * 0.1);
      positions[i * 3 + 2] = Math.sin(angle) * radius + (Math.random() - 0.5) * 0.35;

      const t = radius / 6;
      const col = t < 0.5
        ? cCyan.clone().lerp(cViolet, t * 2)
        : cViolet.clone().lerp(cMagenta, (t - 0.5) * 2);
      colors[i * 3] = col.r;
      colors[i * 3 + 1] = col.g;
      colors[i * 3 + 2] = col.b;
      seeds[i] = Math.random() * Math.PI * 2;
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    geo.setAttribute('aSeed', new THREE.BufferAttribute(seeds, 1));

    const mat = new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      vertexColors: true,
      uniforms: {
        uTime: { value: 0 },
        uSize: { value: 26.0 },
      },
      vertexShader: `
        attribute float aSeed;
        uniform float uTime;
        uniform float uSize;
        varying vec3 vColor;
        void main() {
          vColor = color;
          vec3 p = position;
          p.y += sin(uTime * 0.6 + aSeed) * 0.09;
          vec4 mv = modelViewMatrix * vec4(p, 1.0);
          gl_Position = projectionMatrix * mv;
          float tw = 0.7 + 0.3 * sin(uTime * 1.8 + aSeed * 3.0);
          gl_PointSize = uSize * tw / max(0.001, -mv.z);
        }`,
      fragmentShader: `
        varying vec3 vColor;
        void main() {
          float d = distance(gl_PointCoord, vec2(0.5));
          float a = smoothstep(0.5, 0.05, d);
          gl_FragColor = vec4(vColor, a * 0.9);
        }`,
    });

    const galaxy = new THREE.Points(geo, mat);
    galaxy.rotation.x = 0.42;
    scene.add(galaxy);

    /* ----- Floating dust in the foreground ----- */
    const dustGeo = new THREE.BufferGeometry();
    const DUST = 260;
    const dustPos = new Float32Array(DUST * 3);
    for (let i = 0; i < DUST; i++) {
      dustPos[i * 3] = (Math.random() - 0.5) * 16;
      dustPos[i * 3 + 1] = (Math.random() - 0.5) * 9;
      dustPos[i * 3 + 2] = (Math.random() - 0.5) * 6 + 2;
    }
    dustGeo.setAttribute('position', new THREE.BufferAttribute(dustPos, 3));
    const dust = new THREE.Points(dustGeo, new THREE.PointsMaterial({
      color: 0x8b9cf6, size: 0.035, transparent: true, opacity: 0.55,
      blending: THREE.AdditiveBlending, depthWrite: false,
    }));
    scene.add(dust);

    /* ----- Interaction state ----- */
    let targetX = 0, targetY = 0, curX = 0, curY = 0, scrollN = 0;

    window.addEventListener('pointermove', (e) => {
      targetX = (e.clientX / window.innerWidth - 0.5) * 2;
      targetY = (e.clientY / window.innerHeight - 0.5) * 2;
    }, { passive: true });

    window.addEventListener('scroll', () => {
      scrollN = Math.min(1, window.scrollY / window.innerHeight);
    }, { passive: true });

    function resize() {
      const w = mount.clientWidth, h = mount.clientHeight;
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    }
    window.addEventListener('resize', resize);
    resize();

    const clock = new THREE.Clock();
    let visible = true;
    const io = new IntersectionObserver(([e]) => { visible = e.isIntersecting; }, { threshold: 0 });
    io.observe(mount);

    (function animate() {
      requestAnimationFrame(animate);
      if (!visible) return;
      const t = clock.getElapsedTime();
      mat.uniforms.uTime.value = t;

      curX += (targetX - curX) * 0.04;
      curY += (targetY - curY) * 0.04;

      galaxy.rotation.y = t * 0.05 + curX * 0.25;
      galaxy.rotation.x = 0.42 + curY * 0.12 + scrollN * 0.35;
      galaxy.position.y = -scrollN * 2.2;

      dust.rotation.y = t * 0.02;
      camera.position.x = curX * 0.6;
      camera.position.y = 1.6 - curY * 0.4 - scrollN * 0.8;
      camera.lookAt(0, 0, 0);

      renderer.render(scene, camera);
    })();
  });
})();
