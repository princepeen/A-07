/* ============================================================
   STARS.JS — Sky canvas: stars, pink shooting stars, clouds
   Used on: index.html, home.html, surprise.html
   ============================================================ */

(function() {
  'use strict';

  // Config per page — set window.SKY_CONFIG before this script loads
  const CFG = window.SKY_CONFIG || {
    starCount:       'auto',   // 'auto' or number
    starColor:       [230, 218, 210],
    shootingStars:   true,
    shootColor:      [240, 192, 208],  // light pink
    shootGlow:       true,
    cloudLayer:      false,    // true on home page
    cloudOpacity:    0.07,
    starBrightness:  0.65,
  };

  const canvas = document.getElementById('sky-canvas');
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  let W, H;
  let stars    = [];
  let comets   = [];
  let clouds   = [];
  let lastComet = 0;
  let animId;

  /* ── resize ── */
  function resize() {
    W = canvas.width  = window.innerWidth;
    H = canvas.height = window.innerHeight;
    buildStars();
    if (CFG.cloudLayer) buildClouds();
  }

  /* ── stars ── */
  function buildStars() {
    stars = [];
    const n = CFG.starCount === 'auto'
      ? Math.round((W * H) / 3400)
      : CFG.starCount;
    for (let i = 0; i < n; i++) {
      const size = Math.random();
      stars.push({
        x:    Math.random() * W,
        y:    Math.random() * H,
        r:    size < 0.7 ? Math.random() * 0.7 + 0.12
            : size < 0.9 ? Math.random() * 1.0 + 0.5
            :               Math.random() * 1.5 + 0.9,
        base: Math.random() * CFG.starBrightness * 0.75 + 0.05,
        spd:  Math.random() * 0.003 + 0.0006,
        phi:  Math.random() * Math.PI * 2,
        // pink-tinted stars scattered sparsely
        pink: Math.random() < 0.07,
      });
    }
  }

  /* ── shooting stars ── */
  function spawnComet() {
    const angle = (Math.PI / 5.5) + (Math.random() - 0.5) * 0.28;
    return {
      x:    Math.random() * W * 0.7 + W * 0.05,
      y:    Math.random() * H * 0.38,
      len:  55 + Math.random() * 95,
      spd:  4.8 + Math.random() * 4.5,
      angle,
      a:    0,
      fade: 'in',
      // vary between warm white and pink
      pink: Math.random() < 0.65,
    };
  }

  /* ── cloud shapes (canvas-drawn for home page) ── */
  function buildClouds() {
    clouds = [];
    const count = 5 + Math.floor(Math.random() * 3);
    for (let i = 0; i < count; i++) {
      clouds.push({
        x:    Math.random() * W * 1.4 - W * 0.2,
        y:    Math.random() * H * 0.8,
        w:    120 + Math.random() * 260,
        h:    35  + Math.random() * 55,
        spd:  0.08 + Math.random() * 0.14,
        op:   CFG.cloudOpacity * (0.5 + Math.random() * 0.7),
        seed: Math.random() * 999,
      });
    }
  }

  function drawCloud(c, t) {
    ctx.save();
    ctx.globalAlpha = c.op;

    const x = c.x, y = c.y, w = c.w, h = c.h;
    const grad = ctx.createRadialGradient(x, y, 0, x, y, w * 0.7);
    grad.addColorStop(0,   'rgba(190,185,210,0.55)');
    grad.addColorStop(0.4, 'rgba(170,165,195,0.3)');
    grad.addColorStop(1,   'rgba(150,145,175,0)');
    ctx.fillStyle = grad;

    // bumpy cloud outline via bezier
    ctx.beginPath();
    const bumps = 5 + Math.floor(w / 60);
    const bumpW = w / bumps;
    ctx.moveTo(x - w * 0.5, y + h * 0.5);
    for (let b = 0; b < bumps; b++) {
      const bx  = x - w * 0.5 + bumpW * b;
      const bh  = h * (0.5 + 0.5 * Math.sin(c.seed + b * 1.3));
      ctx.quadraticCurveTo(bx + bumpW * 0.25, y - bh, bx + bumpW * 0.5, y);
      ctx.quadraticCurveTo(bx + bumpW * 0.75, y + h * 0.3, bx + bumpW, y + h * 0.5);
    }
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  /* ── main render loop ── */
  function frame(t) {
    ctx.clearRect(0, 0, W, H);

    /* --- stars --- */
    for (const s of stars) {
      s.phi += s.spd;
      const tw = 0.78 + 0.22 * Math.sin(s.phi);
      const a  = s.base * tw;

      if (s.pink) {
        // soft pink micro-star (uses configured shoot color)
        const [pr, pg, pb] = CFG.shootColor;
        const rg = ctx.createRadialGradient(s.x, s.y, 0, s.x, s.y, s.r * 2.5);
        rg.addColorStop(0, `rgba(${pr},${pg},${pb},${a * 1.4})`);
        rg.addColorStop(1, `rgba(${pr},${pg},${pb},0)`);
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r * 2.5, 0, Math.PI * 2);
        ctx.fillStyle = rg;
        ctx.fill();
      }

      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      const [r, g, b] = s.pink ? CFG.shootColor : CFG.starColor;
      ctx.fillStyle = `rgba(${r},${g},${b},${a})`;
      ctx.fill();
    }

    /* --- clouds (home page) --- */
    if (CFG.cloudLayer) {
      for (const c of clouds) {
        c.x += c.spd;
        if (c.x - c.w > W * 1.1) c.x = -c.w * 0.5;
        drawCloud(c, t);
      }
    }

    /* --- shooting stars --- */
    if (CFG.shootingStars) {
      const interval = 3800 + Math.random() * 4200;
      if (t - lastComet > interval) {
        comets.push(spawnComet());
        // occasionally spawn a second one shortly after
        if (Math.random() < 0.22) {
          setTimeout(() => comets.push(spawnComet()), 280 + Math.random() * 400);
        }
        lastComet = t;
      }

      for (let i = comets.length - 1; i >= 0; i--) {
        const cm = comets[i];

        if (cm.fade === 'in')  cm.a = Math.min(1, cm.a + 0.06);
        else                   cm.a = Math.max(0, cm.a - 0.028);
        if (cm.a >= 1)  cm.fade = 'out';
        if (cm.a <= 0)  { comets.splice(i, 1); continue; }

        cm.x += Math.cos(cm.angle) * cm.spd;
        cm.y += Math.sin(cm.angle) * cm.spd;

        const tx = cm.x - Math.cos(cm.angle) * cm.len;
        const ty = cm.y - Math.sin(cm.angle) * cm.len;

        // trail gradient
        const [pr, pg, pb] = CFG.shootColor;
        const g = ctx.createLinearGradient(tx, ty, cm.x, cm.y);
        if (cm.pink) {
          g.addColorStop(0,    `rgba(${pr},${pg},${pb},0)`);
          g.addColorStop(0.45, `rgba(${pr},${pg},${pb},${cm.a * 0.35})`);
          g.addColorStop(0.8,  `rgba(${Math.min(255,pr+8)},${Math.min(255,pg+18)},${Math.min(255,pb+12)},${cm.a * 0.7})`);
          g.addColorStop(1,    `rgba(${Math.min(255,pr+15)},${Math.min(255,pg+38)},${Math.min(255,pb+30)},${cm.a})`);
        } else {
          g.addColorStop(0,    `rgba(230,220,210,0)`);
          g.addColorStop(0.5,  `rgba(230,220,210,${cm.a * 0.4})`);
          g.addColorStop(1,    `rgba(248,242,236,${cm.a})`);
        }

        ctx.beginPath();
        ctx.moveTo(tx, ty);
        ctx.lineTo(cm.x, cm.y);
        ctx.strokeStyle = g;
        ctx.lineWidth   = cm.pink ? 1.6 : 1.2;
        ctx.stroke();

        // tip glow
        if (CFG.shootGlow) {
          const tipColor = cm.pink ? CFG.shootColor.map((v,i)=>Math.min(255, v + [15,38,30][i])) : [255, 248, 240];
          const rg = ctx.createRadialGradient(cm.x, cm.y, 0, cm.x, cm.y, cm.pink ? 5 : 3.5);
          rg.addColorStop(0, `rgba(${tipColor},${cm.a * 0.95})`);
          rg.addColorStop(1, `rgba(${tipColor},0)`);
          ctx.beginPath();
          ctx.arc(cm.x, cm.y, cm.pink ? 5 : 3.5, 0, Math.PI * 2);
          ctx.fillStyle = rg;
          ctx.fill();

          // extra outer halo for pink
          if (cm.pink) {
            const [hr, hg, hb] = CFG.shootColor;
            const halo = ctx.createRadialGradient(cm.x, cm.y, 0, cm.x, cm.y, 12);
            halo.addColorStop(0, `rgba(${hr},${hg},${hb},${cm.a * 0.35})`);
            halo.addColorStop(1, `rgba(${hr},${hg},${hb},0)`);
            ctx.beginPath();
            ctx.arc(cm.x, cm.y, 12, 0, Math.PI * 2);
            ctx.fillStyle = halo;
            ctx.fill();
          }
        }
      }
    }

    animId = requestAnimationFrame(frame);
  }

  /* ── init ── */
  function init() {
    resize();
    if (animId) cancelAnimationFrame(animId);
    animId = requestAnimationFrame(frame);
  }

  window.addEventListener('resize', () => {
    clearTimeout(window._skyResizeT);
    window._skyResizeT = setTimeout(resize, 120);
  });

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // expose for starburst trigger
  window.SkyCanvas = { getCtx: () => ctx, getSize: () => ({ W, H }) };

})();
