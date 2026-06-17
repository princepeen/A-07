/* ============================================================
   APP.JS — Shared app logic
   Page transitions, veil, starburst, cloud buttons, fog,
   background music (persists across pages, off on music.html)
   ============================================================ */

(function() {
  'use strict';

  /* ══════════════════════════════════════════════
     0. BACKGROUND MUSIC
     Plays audio/background.mp3 on every page except
     music.html. Position + play/pause state persists
     across page navigations via sessionStorage.
  ══════════════════════════════════════════════ */
  (function initBackgroundMusic() {
    const isMusicPage = /music\.html$/i.test(window.location.pathname);
    if (isMusicPage) return; // music.html has its own player; no background track here

    const bg = new Audio('audio/background.mp3');
    bg.loop = true;
    bg.volume = 0.35;
    window.bgMusic = bg;

    const STORAGE_KEY = 'ashu_bg_music';

    function readState() {
      try { return JSON.parse(sessionStorage.getItem(STORAGE_KEY) || '{}'); }
      catch (e) { return {}; }
    }
    function writeState(state) {
      try { sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch (e) {}
    }

    const saved = readState();

    function tryResume() {
      if (saved.playing === false) return; // user explicitly paused before
      if (typeof saved.time === 'number' && isFinite(saved.time)) {
        bg.currentTime = saved.time;
      }
      bg.play().catch(() => {
        // Autoplay blocked — resume on first user interaction
        const resume = () => {
          bg.play().catch(() => {});
          document.removeEventListener('click', resume);
          document.removeEventListener('touchstart', resume);
        };
        document.addEventListener('click', resume, { once: true });
        document.addEventListener('touchstart', resume, { once: true });
      });
    }

    if (bg.readyState >= 2) tryResume();
    else bg.addEventListener('canplaythrough', tryResume, { once: true });

    // Persist position regularly and on navigation away
    setInterval(() => {
      writeState({ time: bg.currentTime, playing: !bg.paused });
    }, 1000);

    window.addEventListener('beforeunload', () => {
      writeState({ time: bg.currentTime, playing: !bg.paused });
    });

    // Expose simple controls for an optional mute button on any page
    window.toggleBgMusic = function() {
      if (bg.paused) { bg.play().catch(()=>{}); writeState({ time: bg.currentTime, playing: true }); }
      else           { bg.pause();              writeState({ time: bg.currentTime, playing: false }); }
      return !bg.paused;
    };
  })();

  /* ══════════════════════════════════════════════
     1. PAGE TRANSITION (veil fade)
  ══════════════════════════════════════════════ */
  function navigateTo(href, delay) {
    const veil = document.getElementById('veil');
    if (!veil) { window.location.href = href; return; }
    veil.classList.add('show');
    setTimeout(() => { window.location.href = href; }, delay || 1100);
  }

  // Fade in on page load
  window.addEventListener('DOMContentLoaded', () => {
    const veil = document.getElementById('veil');
    if (veil) {
      veil.style.opacity = '1';
      veil.style.pointerEvents = 'all';
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          veil.style.transition = 'opacity 0.9s ease';
          veil.style.opacity = '0';
          setTimeout(() => { veil.style.pointerEvents = 'none'; }, 950);
        });
      });
    }
  });

  window.navigateTo = navigateTo;


  /* ══════════════════════════════════════════════
     2. STARBURST — fullscreen on home Enter click
  ══════════════════════════════════════════════ */
  function triggerStarburst(onComplete) {
    const overlay = document.getElementById('starburst');
    if (!overlay) { if (onComplete) onComplete(); return; }

    // get or create canvas inside overlay
    let bc = overlay.querySelector('canvas');
    if (!bc) {
      bc = document.createElement('canvas');
      bc.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;';
      overlay.appendChild(bc);
    }
    const bctx = bc.getContext('2d');
    bc.width  = window.innerWidth;
    bc.height = window.innerHeight;
    const BW = bc.width, BH = bc.height;
    const cx = BW / 2, cy = BH / 2;

    overlay.style.opacity = '1';
    overlay.style.pointerEvents = 'all';

    // Build rays
    const RAY_COUNT = 72;
    const rays = [];
    for (let i = 0; i < RAY_COUNT; i++) {
      const angle  = (i / RAY_COUNT) * Math.PI * 2;
      const maxLen = Math.hypot(BW, BH) * 0.58;
      rays.push({
        angle,
        len:    0,
        maxLen: maxLen * (0.6 + Math.random() * 0.4),
        spd:    18 + Math.random() * 22,
        width:  0.4 + Math.random() * 1.4,
        // alternate pink, lavender, warm white
        color: i % 3 === 0 ? [240, 192, 208]
             : i % 3 === 1 ? [184, 176, 200]
             :                [232, 224, 214],
        alpha: 0.55 + Math.random() * 0.45,
      });
    }

    // Particles
    const PARTICLE_COUNT = 120;
    const particles = [];
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const angle = Math.random() * Math.PI * 2;
      const spd   = 2.5 + Math.random() * 5.5;
      particles.push({
        x: cx, y: cy,
        vx: Math.cos(angle) * spd,
        vy: Math.sin(angle) * spd,
        r:  1 + Math.random() * 2.5,
        alpha: 1,
        decay: 0.012 + Math.random() * 0.018,
        color: Math.random() < 0.55 ? [240,192,208] : [232,224,214],
      });
    }

    let phase = 'expand';  // expand → hold → fade
    let holdFrames = 0;
    let globalAlpha = 0;

    function burstFrame() {
      bctx.clearRect(0, 0, BW, BH);

      // background bloom
      if (phase === 'expand' || phase === 'hold') {
        const bloom = bctx.createRadialGradient(cx, cy, 0, cx, cy, BW * 0.55);
        bloom.addColorStop(0,   `rgba(240,192,208,${0.18 * globalAlpha})`);
        bloom.addColorStop(0.3, `rgba(220,200,215,${0.10 * globalAlpha})`);
        bloom.addColorStop(1,   `rgba(8,8,14,0)`);
        bctx.fillStyle = bloom;
        bctx.fillRect(0, 0, BW, BH);
      }

      // rays
      for (const r of rays) {
        if (phase === 'expand') r.len = Math.min(r.maxLen, r.len + r.spd);
        if (phase === 'fade')   r.len = Math.max(0, r.len - r.spd * 0.4);

        if (r.len <= 0) continue;
        const ex = cx + Math.cos(r.angle) * r.len;
        const ey = cy + Math.sin(r.angle) * r.len;

        const rg = bctx.createLinearGradient(cx, cy, ex, ey);
        const [rc, gc, bc] = r.color;
        rg.addColorStop(0,    `rgba(${rc},${gc},${bc},${r.alpha * globalAlpha})`);
        rg.addColorStop(0.5,  `rgba(${rc},${gc},${bc},${r.alpha * 0.5 * globalAlpha})`);
        rg.addColorStop(1,    `rgba(${rc},${gc},${bc},0)`);

        bctx.beginPath();
        bctx.moveTo(cx, cy);
        bctx.lineTo(ex, ey);
        bctx.strokeStyle = rg;
        bctx.lineWidth   = r.width;
        bctx.stroke();
      }

      // particles
      for (const p of particles) {
        if (p.alpha <= 0) continue;
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.04; // gravity
        p.alpha -= p.decay;

        const [rc, gc, bc] = p.color;
        const pg = bctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r * 2);
        pg.addColorStop(0, `rgba(${rc},${gc},${bc},${p.alpha * globalAlpha})`);
        pg.addColorStop(1, `rgba(${rc},${gc},${bc},0)`);
        bctx.beginPath();
        bctx.arc(p.x, p.y, p.r * 2, 0, Math.PI * 2);
        bctx.fillStyle = pg;
        bctx.fill();
      }

      // center burst core
      const core = bctx.createRadialGradient(cx, cy, 0, cx, cy, 60 * globalAlpha);
      core.addColorStop(0,   `rgba(255,235,242,${0.9 * globalAlpha})`);
      core.addColorStop(0.3, `rgba(240,192,208,${0.5 * globalAlpha})`);
      core.addColorStop(1,   `rgba(240,192,208,0)`);
      bctx.beginPath();
      bctx.arc(cx, cy, 60 * globalAlpha, 0, Math.PI * 2);
      bctx.fillStyle = core;
      bctx.fill();

      // phase transitions
      const allDone = rays.every(r => r.len >= r.maxLen);

      if (phase === 'expand') {
        globalAlpha = Math.min(1, globalAlpha + 0.055);
        if (allDone) { phase = 'hold'; holdFrames = 0; }
      }

      if (phase === 'hold') {
        holdFrames++;
        if (holdFrames > 28) phase = 'fade';
      }

      if (phase === 'fade') {
        globalAlpha = Math.max(0, globalAlpha - 0.032);
        if (globalAlpha <= 0) {
          overlay.style.opacity = '0';
          overlay.style.pointerEvents = 'none';
          if (onComplete) onComplete();
          return;
        }
      }

      requestAnimationFrame(burstFrame);
    }

    requestAnimationFrame(burstFrame);
  }

  window.triggerStarburst = triggerStarburst;


  /* ══════════════════════════════════════════════
     3. CLOUD BUTTONS — wavy SVG + fog particles
  ══════════════════════════════════════════════ */
  function initCloudButtons() {
    const btns = document.querySelectorAll('.cloud-btn');
    btns.forEach(btn => buildCloudButton(btn));
  }

  function buildCloudButton(btn) {
    // Create SVG cloud shape behind the button
    const rect  = btn.getBoundingClientRect();
    const W     = btn.offsetWidth  || 280;
    const H     = btn.offsetHeight || 58;

    // Build wavy cloud path
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('width',  W);
    svg.setAttribute('height', H);
    svg.style.cssText = `
      position:absolute; inset:0; width:100%; height:100%;
      z-index:0; pointer-events:none; overflow:visible;
    `;

    const path = buildCloudPath(W, H);

    // Gradient fill
    const defs  = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
    const gid   = 'cg_' + Math.random().toString(36).slice(2,7);
    const grad  = document.createElementNS('http://www.w3.org/2000/svg', 'linearGradient');
    grad.setAttribute('id', gid);
    grad.setAttribute('x1','0%'); grad.setAttribute('y1','0%');
    grad.setAttribute('x2','100%'); grad.setAttribute('y2','100%');

    const s1 = document.createElementNS('http://www.w3.org/2000/svg','stop');
    s1.setAttribute('offset','0%');
    s1.setAttribute('stop-color','rgba(200,196,218,0.045)');
    const s2 = document.createElementNS('http://www.w3.org/2000/svg','stop');
    s2.setAttribute('offset','100%');
    s2.setAttribute('stop-color','rgba(180,175,205,0.025)');
    grad.appendChild(s1); grad.appendChild(s2);

    // Filter for blur/glow
    const fid    = 'cf_' + Math.random().toString(36).slice(2,7);
    const filter = document.createElementNS('http://www.w3.org/2000/svg','filter');
    filter.setAttribute('id', fid);
    filter.setAttribute('x','-8%'); filter.setAttribute('y','-25%');
    filter.setAttribute('width','116%'); filter.setAttribute('height','150%');
    const feBlur = document.createElementNS('http://www.w3.org/2000/svg','feGaussianBlur');
    feBlur.setAttribute('in','SourceGraphic');
    feBlur.setAttribute('stdDeviation','2.5');
    filter.appendChild(feBlur);

    defs.appendChild(grad);
    defs.appendChild(filter);
    svg.appendChild(defs);

    // Glow edge path (blurred copy)
    const glowP = document.createElementNS('http://www.w3.org/2000/svg','path');
    glowP.setAttribute('d', path);
    glowP.setAttribute('fill', 'none');
    glowP.setAttribute('stroke', 'rgba(200,190,215,0.22)');
    glowP.setAttribute('stroke-width', '1.5');
    glowP.setAttribute('filter', `url(#${fid})`);
    svg.appendChild(glowP);

    // Fill path
    const fillP = document.createElementNS('http://www.w3.org/2000/svg','path');
    fillP.setAttribute('d', path);
    fillP.setAttribute('fill', `url(#${gid})`);
    svg.appendChild(fillP);

    // Stroke path
    const strokeP = document.createElementNS('http://www.w3.org/2000/svg','path');
    strokeP.setAttribute('d', path);
    strokeP.setAttribute('fill', 'none');
    strokeP.setAttribute('stroke', 'rgba(210,204,224,0.14)');
    strokeP.setAttribute('stroke-width', '1');
    svg.appendChild(strokeP);

    btn.style.position = 'relative';
    btn.insertBefore(svg, btn.firstChild);

    // Fog particles
    const fogContainer = document.createElement('div');
    fogContainer.className = 'cloud-btn-fog';
    btn.appendChild(fogContainer);
    spawnFogParticles(fogContainer, W, H);

    // Hover: intensify stroke & spawn more fog
    btn.addEventListener('mouseenter', () => {
      strokeP.setAttribute('stroke', 'rgba(220,215,235,0.3)');
      glowP.setAttribute('stroke',   'rgba(210,200,230,0.38)');
    });
    btn.addEventListener('mouseleave', () => {
      strokeP.setAttribute('stroke', 'rgba(210,204,224,0.14)');
      glowP.setAttribute('stroke',   'rgba(200,190,215,0.22)');
    });
  }

  function buildCloudPath(W, H) {
    // Wavy horizontal rectangle — bumps on top and bottom
    const pad   = 6;
    const bumps = Math.floor(W / 44);
    const bumpH = 7;
    let d = '';

    // top edge — left to right (bumpy)
    d += `M ${pad} ${H / 2} `;
    d += `Q ${pad} ${pad} ${pad + 12} ${pad} `;

    for (let i = 0; i < bumps; i++) {
      const x0 = pad + 12 + i * ((W - 2 * pad - 24) / bumps);
      const x1 = x0 + (W - 2 * pad - 24) / bumps;
      const mx = (x0 + x1) / 2;
      d += `Q ${mx} ${pad - bumpH} ${x1} ${pad} `;
    }

    d += `Q ${W - pad - 12} ${pad} ${W - pad} ${pad} `;
    d += `Q ${W - pad} ${pad} ${W - pad} ${H / 2} `;

    // bottom edge — right to left (bumpy, softer)
    d += `Q ${W - pad} ${H - pad} ${W - pad - 12} ${H - pad} `;

    for (let i = bumps - 1; i >= 0; i--) {
      const x1 = pad + 12 + i * ((W - 2 * pad - 24) / bumps);
      const x0 = x1 + (W - 2 * pad - 24) / bumps;
      const mx = (x0 + x1) / 2;
      d += `Q ${mx} ${H - pad + bumpH * 0.6} ${x1} ${H - pad} `;
    }

    d += `Q ${pad + 12} ${H - pad} ${pad} ${H - pad} `;
    d += `Q ${pad} ${H - pad} ${pad} ${H / 2} Z`;

    return d;
  }

  function spawnFogParticles(container, W, H) {
    const count = 6;
    for (let i = 0; i < count; i++) {
      const p = document.createElement('div');
      const size  = 30 + Math.random() * 55;
      const left  = Math.random() * (W - size);
      const top   = Math.random() * (H - size * 0.5) - size * 0.1;
      const fx    = (Math.random() - 0.5) * 50;
      const fy    = -8 - Math.random() * 18;
      const delay = Math.random() * 4;
      const dur   = 4 + Math.random() * 5;
      const op    = 0.08 + Math.random() * 0.14;

      p.style.cssText = `
        position: absolute;
        width: ${size}px;
        height: ${size * 0.55}px;
        left: ${left}px;
        top: ${top}px;
        border-radius: 50%;
        background: radial-gradient(ellipse, rgba(210,205,225,0.55) 0%, rgba(210,205,225,0) 70%);
        animation: fogDrift ${dur}s ease-in-out ${delay}s infinite;
        --fx: ${fx}px;
        --fy: ${fy}px;
        --fog-op: ${op};
        pointer-events: none;
      `;
      container.appendChild(p);
    }
  }

  /* ══════════════════════════════════════════════
     4. FOG LAYER (home page background)
  ══════════════════════════════════════════════ */
  function initFogLayer() {
    const fog = document.getElementById('fog-layer');
    if (!fog) return;

    // Multiple drifting fog bands
    const bands = [
      { top: '18%', opacity: 0.055, dur: 28, delay: 0 },
      { top: '42%', opacity: 0.040, dur: 35, delay: -12 },
      { top: '68%', opacity: 0.065, dur: 22, delay: -7  },
      { top: '82%', opacity: 0.035, dur: 40, delay: -20 },
    ];

    bands.forEach(b => {
      const band = document.createElement('div');
      band.style.cssText = `
        position: absolute;
        left: -20%; right: -20%;
        top: ${b.top};
        height: 80px;
        background: linear-gradient(90deg,
          rgba(180,175,205,0) 0%,
          rgba(195,190,215,${b.opacity}) 25%,
          rgba(200,195,218,${b.opacity * 1.3}) 50%,
          rgba(195,190,215,${b.opacity}) 75%,
          rgba(180,175,205,0) 100%
        );
        background-size: 200% 100%;
        animation: fogLayerShift ${b.dur}s ease-in-out ${b.delay}s infinite;
        filter: blur(8px);
        pointer-events: none;
        border-radius: 50%;
      `;
      fog.appendChild(band);
    });
  }

  /* ══════════════════════════════════════════════
     5. INIT
  ══════════════════════════════════════════════ */
  document.addEventListener('DOMContentLoaded', () => {
    initCloudButtons();
    initFogLayer();
  });

})();
         
