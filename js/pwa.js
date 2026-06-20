/* ============================================================
   PWA.JS — Service worker registration
   Add <script src="js/pwa.js" defer></script> to every page
   ============================================================ */

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/service-worker.js', { scope: '/' })
      .then(reg => {
        console.log('[PWA] Service worker registered:', reg.scope);

        /* Auto-update: if a new SW is waiting, activate it on next navigation */
        reg.addEventListener('updatefound', () => {
          const newWorker = reg.installing;
          if (!newWorker) return;
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              newWorker.postMessage({ type: 'SKIP_WAITING' });
            }
          });
        });
      })
      .catch(err => console.warn('[PWA] SW registration failed:', err));
  });
}
