if (!matchMedia('(prefers-reduced-motion: reduce)').matches) {
  const root = document.documentElement;
  root.classList.add('typing');
  // A restored scroll position would leave ./hei.sh off-screen, and nothing would start
  history.scrollRestoration = 'manual';
  // If the sequence script fails to load or throws during setup, show the page anyway, and tell
  // Window.astro the sequence is over
  setTimeout(() => {
    if (root.classList.contains('typing-started')) return;
    root.classList.remove('typing');
    dispatchEvent(new Event('typed'));
  }, 3000);
}
