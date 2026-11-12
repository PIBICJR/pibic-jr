/* Preferências compartilhadas entre a página inicial e a árvore de habilidades. */
(() => {
  'use strict';
  const THEME_KEY = 'pibic-site-theme-v1';
  const EFFECTS_KEY = 'pibic-site-effects-v1';
  const root = document.documentElement;
  const read = (key, fallback) => {
    try { return localStorage.getItem(key) ?? fallback; } catch { return fallback; }
  };
  const write = (key, value) => {
    try { localStorage.setItem(key, value); } catch { /* Armazenamento indisponível */ }
  };
  function currentTheme() { return read(THEME_KEY, 'dark') === 'light' ? 'light' : 'dark'; }
  function effectsEnabled() { return read(EFFECTS_KEY, 'true') !== 'false'; }
  function applyPreferences() {
    const theme = currentTheme();
    const effects = effectsEnabled();
    root.dataset.theme = theme;
    root.classList.toggle('effects-off', !effects);
    document.body?.classList.toggle('effects-paused', !effects);
    document.body?.classList.toggle('motion-paused', !effects);
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.content = theme === 'light' ? '#f1f7ed' : '#06130d';
    document.getElementById('themeLight')?.setAttribute('aria-pressed', String(theme === 'light'));
    document.getElementById('themeDark')?.setAttribute('aria-pressed', String(theme === 'dark'));
    document.getElementById('settingsEffects')?.setAttribute('aria-checked', String(effects));
    window.dispatchEvent(new CustomEvent('pibic:preferences', { detail: { theme, effects } }));
  }
  // Definido cedo para evitar alternância perceptível ao abrir outra página.
  root.dataset.theme = currentTheme();
  root.classList.toggle('effects-off', !effectsEnabled());
  document.addEventListener('DOMContentLoaded', () => {
    const trigger = document.getElementById('settingsTrigger');
    const panel = document.getElementById('settingsPanel');
    const close = document.getElementById('settingsClose');
    let previousFocus = null;
    function setOpen(open) {
      panel.hidden = !open;
      trigger.setAttribute('aria-expanded', String(open));
      if (open) { previousFocus = document.activeElement; close.focus(); }
      else if (previousFocus && panel.contains(document.activeElement)) trigger.focus();
    }
    trigger.addEventListener('click', () => setOpen(panel.hidden));
    close.addEventListener('click', () => setOpen(false));
    document.addEventListener('keydown', event => {
      if (event.key === 'Escape' && !panel.hidden) setOpen(false);
    });
    document.addEventListener('pointerdown', event => {
      if (!panel.hidden && !document.getElementById('siteSettings').contains(event.target)) setOpen(false);
    });
    document.getElementById('themeLight').addEventListener('click', () => { write(THEME_KEY, 'light'); applyPreferences(); });
    document.getElementById('themeDark').addEventListener('click', () => { write(THEME_KEY, 'dark'); applyPreferences(); });
    document.getElementById('settingsEffects').addEventListener('click', () => { write(EFFECTS_KEY, String(!effectsEnabled())); applyPreferences(); });
    window.addEventListener('storage', event => {
      if (!event.key || [THEME_KEY, EFFECTS_KEY].includes(event.key)) applyPreferences();
    });
    applyPreferences();
  });
})();
