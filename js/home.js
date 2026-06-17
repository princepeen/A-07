/* ============================================================
   HOME.JS — 2x2 nav grid logic + surprise unlock tracking
   Used on: home.html
   ============================================================ */

(function() {
  'use strict';

  const REQUIRED_KEYS = ['dateideas', 'music', 'letters', 'timeline'];
  const STORAGE_KEY    = 'ashu_opened_sections';

  function getOpened() {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'); }
    catch (e) { return []; }
  }

  function markOpened(key) {
    const opened = getOpened();
    if (!opened.includes(key)) {
      opened.push(key);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(opened));
    }
    return opened;
  }

  function allUnlocked(opened) {
    return REQUIRED_KEYS.every(k => opened.includes(k));
  }

  function applyOpenedState(opened) {
    document.querySelectorAll('.nav-cell').forEach(cell => {
      const key = cell.dataset.key;
      if (opened.includes(key)) cell.classList.add('opened');
    });

    const surpriseWrap = document.getElementById('surpriseWrap');
    if (surpriseWrap && allUnlocked(opened)) {
      surpriseWrap.classList.add('unlocked');
    }
  }

  function goTo(target) {
    if (window.triggerStarburst && window.navigateTo) {
      window.triggerStarburst(() => window.navigateTo(target, 250));
    } else if (window.navigateTo) {
      window.navigateTo(target);
    } else {
      window.location.href = target;
    }
  }

  document.addEventListener('DOMContentLoaded', () => {
    const opened = getOpened();
    applyOpenedState(opened);

    // Main 4 nav cells
    document.querySelectorAll('.nav-cell').forEach(cell => {
      const target = cell.dataset.target;
      const key    = cell.dataset.key;
      cell.addEventListener('click', () => {
        const updated = markOpened(key);
        cell.classList.add('opened');
        const surpriseWrap = document.getElementById('surpriseWrap');
        if (surpriseWrap && allUnlocked(updated)) {
          surpriseWrap.classList.add('unlocked');
        }
        goTo(target);
      });
    });

    // Surprise cell
    const surpriseCell = document.querySelector('.surprise-cell');
    if (surpriseCell) {
      surpriseCell.addEventListener('click', () => {
        goTo(surpriseCell.dataset.target);
      });
    }
  });

})();

