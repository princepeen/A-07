/* ============================================================
   DATEIDEAS.JS — Modal logic, card rendering, fog particles
   Used on: dateideas.html
   ============================================================ */

(function() {
  'use strict';

  /* ══ Date data ══════════════════════════════════════════ */
  const DATES = [
    {
      id: 'cafe',
      icon: '☕',
      label: 'Café Date',
      title: 'Café Date',
      note: '"Just us,\nwarm drinks,\nquiet conversations,\nand nowhere else to be."',
      images: ['img/cafe1.jpg', 'img/cafe2.jpg', 'img/cafe3.jpg', 'img/cafe4.jpg'],
    },
    {
      id: 'bookstore',
      icon: '📚',
      label: 'Bookstore Date',
      title: 'Bookstore Date',
      note: '"You read your book.\nI pretend to read mine while secretly looking at you."',
      images: ['img/book1.jpg', 'img/book2.jpg', 'img/book3.jpg', 'img/book4.jpg'],
    },
    {
      id: 'paris',
      icon: '🗼',
      label: 'Paris Date',
      title: 'Paris Date',
      note: '"You always loved Paris.\nI\'d love to see it through your eyes one day."',
      images: ['img/paris1.jpg', 'img/paris2.jpg', 'img/paris3.jpg', 'img/paris4.jpg'],
    },
    {
      id: 'stargazing',
      icon: '✨',
      label: 'Stargazing Date',
      title: 'Stargazing Date',
      note: '"Maybe we\'d run out of stars before we run out of things to talk about."',
      images: ['img/stars1.jpg', 'img/stars2.jpg', 'img/stars3.jpg', 'img/stars4.jpg'],
    },
    {
      id: 'sunrise',
      icon: '🌅',
      label: 'Sunrise Date',
      title: 'Sunrise Date',
      note: '"One day I\'d like to watch the world wake up beside you."',
      images: ['img/sunrise1.jpg', 'img/sunrise2.jpg', 'img/sunrise3.jpg', 'img/sunrise4.jpg'],
    },
    {
      id: 'sunset',
      icon: '🌇',
      label: 'Sunset Date',
      title: 'Sunset Date',
      note: '"I think sunsets would look even better if I watched them with you."',
      images: ['img/sunset1.jpg', 'img/sunset2.jpg', 'img/sunset3.jpg', 'img/sunset4.jpg'],
    },
  ];

  /* ══ Build cards ════════════════════════════════════════ */
  function buildCards() {
    const grid = document.getElementById('cardGrid');
    if (!grid) return;

    DATES.forEach(d => {
      const card = document.createElement('div');
      card.className = 'idea-card';
      card.innerHTML = `
        <span class="card-icon">${d.icon}</span>
        <span class="card-label">${d.label}</span>
        <span class="card-hint">tap to open</span>
      `;
      card.addEventListener('click', () => openModal(d));
      grid.appendChild(card);
    });
  }

  /* ══ Modal logic ════════════════════════════════════════ */
  let overlay, modalIcon, modalTitle, modalNote, modalImgGrid, askBtn, confirmToast, modalBox;
  let toastTimer = null;

  function openModal(d) {
    modalIcon.textContent  = d.icon;
    modalTitle.textContent = d.title;
    modalNote.textContent  = d.note;

    modalImgGrid.innerHTML = '';
    d.images.forEach(src => {
      const cell = document.createElement('div');
      cell.className = 'img-cell';
      const ph = document.createElement('div');
      ph.className = 'ph';
      ph.textContent = '— —';
      const img = document.createElement('img');
      img.loading = 'lazy';
      img.alt = d.title;
      img.src = src;
      img.addEventListener('load', () => { img.classList.add('loaded'); ph.style.display = 'none'; });
      img.addEventListener('error', () => { ph.textContent = 'photo soon'; });
      cell.appendChild(ph);
      cell.appendChild(img);
      modalImgGrid.appendChild(cell);
    });

    confirmToast.classList.remove('show');
    clearTimeout(toastTimer);

    overlay.classList.add('open');
    document.body.style.overflow = 'hidden';
  }

  function closeModal() {
    overlay.classList.remove('open');
    document.body.style.overflow = '';
  }

  /* ══ Floating fog particles ═════════════════════════════ */
  function buildFog() {
    const container = document.getElementById('fogContainer');
    if (!container) return;
    const count = 7;
    for (let i = 0; i < count; i++) {
      const p = document.createElement('div');
      const size  = 80 + Math.random() * 140;
      const left  = Math.random() * 100;
      const top   = Math.random() * 100;
      const fx    = (Math.random() - 0.5) * 80;
      const fy    = -20 - Math.random() * 40;
      const dur   = 14 + Math.random() * 14;
      const delay = Math.random() * 10;
      const op    = 0.05 + Math.random() * 0.08;
      p.className = 'fog-particle';
      p.style.width  = size + 'px';
      p.style.height = (size * 0.6) + 'px';
      p.style.left = left + 'vw';
      p.style.top  = top + 'vh';
      p.style.setProperty('--fx', fx + 'px');
      p.style.setProperty('--fy', fy + 'px');
      p.style.setProperty('--op', op);
      p.style.animation = `fogDrift ${dur}s ease-in-out ${delay}s infinite`;
      container.appendChild(p);
    }
  }

  /* ══ Init ════════════════════════════════════════════════ */
  document.addEventListener('DOMContentLoaded', () => {
    overlay      = document.getElementById('modalOverlay');
    modalIcon    = document.getElementById('modalIcon');
    modalTitle   = document.getElementById('modalTitle');
    modalNote    = document.getElementById('modalNote');
    modalImgGrid = document.getElementById('modalImgGrid');
    askBtn       = document.getElementById('askBtn');
    confirmToast = document.getElementById('confirmToast');
    modalBox     = document.querySelector('.dateideas-modal-box');

    buildCards();
    buildFog();

    document.getElementById('modalClose').addEventListener('click', closeModal);
    overlay.addEventListener('click', e => { if (e.target === overlay) closeModal(); });

    askBtn.addEventListener('click', () => {
      confirmToast.classList.add('show');
      clearTimeout(toastTimer);
      toastTimer = setTimeout(() => confirmToast.classList.remove('show'), 2600);
    });

    // swipe down to close
    let touchStartY = 0;
    modalBox.addEventListener('touchstart', e => { touchStartY = e.touches[0].clientY; }, { passive: true });
    modalBox.addEventListener('touchend', e => {
      const dy = e.changedTouches[0].clientY - touchStartY;
      if (dy > 90 && modalBox.scrollTop === 0) closeModal();
    }, { passive: true });

    // ESC to close
    document.addEventListener('keydown', e => { if (e.key === 'Escape') closeModal(); });
  });

})();
        
