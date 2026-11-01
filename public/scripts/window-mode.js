if (document.documentElement.classList.contains('typing')) {
  const mode = document.querySelector('.window .mode');
  mode.textContent = 'TERMINAL';
  mode.dataset.mode = 'terminal';
}
