/* ============================================================
   COUNTER.JS — Live relationship counter
   Used on: home.html
   ============================================================ */

(function() {
  'use strict';

  // ── SET YOUR START DATE HERE ──
  // Format: YYYY, MM-1 (month is 0-indexed), DD, HH, MM, SS
  const START = new Date(2026, 0, 1, 0, 0, 0); // Jan 1, 2024 — replace with real date

  function pad(n) { return String(n).padStart(2, '0'); }

  function update() {
    const now   = new Date();
    let   diff  = now - START;
    if (diff < 0) diff = 0;

    const totalSec  = Math.floor(diff / 1000);
    const totalMin  = Math.floor(totalSec  / 60);
    const totalHr   = Math.floor(totalMin  / 60);
    const totalDays = Math.floor(totalHr   / 24);

    const secs = totalSec  % 60;
    const mins = totalMin  % 60;
    const hrs  = totalHr   % 24;
    const days = totalDays;

    const elDays = document.getElementById('c-days');
    const elHrs  = document.getElementById('c-hours');
    const elMins = document.getElementById('c-minutes');
    const elSecs = document.getElementById('c-seconds');

    if (elDays)  setDigit(elDays,  days);
    if (elHrs)   setDigit(elHrs,   hrs);
    if (elMins)  setDigit(elMins,  mins);
    if (elSecs)  setDigit(elSecs,  secs, true); // animate seconds
  }

  let prevSec = -1;
  function setDigit(el, val, animate) {
    const display = animate ? pad(val) : String(val);
    if (el.textContent === display) return;
    if (animate && val !== prevSec) {
      el.style.animation = 'none';
      el.offsetHeight; // reflow
      el.style.animation = 'digitFlip 0.35s var(--ease-out) forwards';
      prevSec = val;
    }
    el.textContent = display;
  }

  document.addEventListener('DOMContentLoaded', () => {
    update();
    setInterval(update, 1000);
  });

})();

