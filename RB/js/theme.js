/* ============================================================
   RB Repostería — theme.js
   - Aplica el tema persistido (localStorage) al <html> ASAP
     para evitar flash de color.
   - Cuando el DOM está listo, inyecta el switch de 4 swatches
     en .header-pagina__der (o .header-pagina como fallback).
   - Persiste la elección en localStorage["rb-theme"].
   ============================================================ */
(function () {
  'use strict';

  const STORAGE_KEY = 'rb-theme';
  const TEMAS = ['terracotta', 'rosa', 'lila', 'amarillo'];
  const DEFAULT = 'terracotta';
  const LABELS = {
    terracotta: 'Terracotta',
    rosa:       'Rosa',
    lila:       'Lila',
    amarillo:   'Amarillo'
  };

  function temaActual() {
    let t;
    try { t = localStorage.getItem(STORAGE_KEY); } catch (e) { t = null; }
    return TEMAS.indexOf(t) >= 0 ? t : DEFAULT;
  }

  function aplicarTema(t) {
    document.documentElement.setAttribute('data-theme', t);
  }

  // Aplica inmediatamente al parsear el script (antes de pintar)
  aplicarTema(temaActual());

  function inyectarSwitch() {
    if (document.querySelector('.theme-switch')) return;

    const host = document.querySelector('.header-pagina__der')
              || document.querySelector('.header-pagina');
    if (!host) return;

    const wrap = document.createElement('div');
    wrap.className = 'theme-switch no-print';
    wrap.setAttribute('role', 'group');
    wrap.setAttribute('aria-label', 'Tema visual');

    const activo = temaActual();
    TEMAS.forEach(function (t) {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'theme-swatch theme-swatch--' + t + (t === activo ? ' activo' : '');
      btn.title = LABELS[t];
      btn.setAttribute('aria-label', 'Tema ' + LABELS[t]);
      btn.addEventListener('click', function (ev) {
        ev.stopPropagation();
        if (btn.classList.contains('activo')) {
          // Click sobre el swatch activo → abre/cierra el selector
          wrap.classList.toggle('open');
          return;
        }
        // Click sobre un swatch distinto → seleccionar y cerrar
        try { localStorage.setItem(STORAGE_KEY, t); } catch (e) { /* noop */ }
        aplicarTema(t);
        wrap.querySelectorAll('.theme-swatch').forEach(function (b) { b.classList.remove('activo'); });
        btn.classList.add('activo');
        wrap.classList.remove('open');
      });
      wrap.appendChild(btn);
    });

    host.insertBefore(wrap, host.firstChild);

    // Click fuera del switch → cerrar
    document.addEventListener('click', function (ev) {
      if (wrap.classList.contains('open') && !wrap.contains(ev.target)) {
        wrap.classList.remove('open');
      }
    });

    // Tecla Esc → cerrar
    document.addEventListener('keydown', function (ev) {
      if (ev.key === 'Escape' && wrap.classList.contains('open')) {
        wrap.classList.remove('open');
      }
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', inyectarSwitch);
  } else {
    inyectarSwitch();
  }
})();
