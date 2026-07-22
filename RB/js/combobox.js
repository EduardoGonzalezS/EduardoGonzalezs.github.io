/* ============================================================
   RB Repostería — combobox.js
   Componente combobox con búsqueda filtrable.
   Reemplaza el <input list="…"> + <datalist> nativo por una
   experiencia consistente entre desktop y móvil.

   Uso:
     <div class="combobox" data-combobox>
       <input type="text" class="combobox__input" name="…">
       <ul class="combobox__lista" role="listbox" hidden></ul>
     </div>

     Combobox.init(document, () => arrayDeOpciones);
     // arrayDeOpciones: ['Harina', 'Azúcar', …]  ó  [{nombre:'…'}, …]

   Para filas dinámicas (clonadas en JS), llamar:
     Combobox.init(filaNueva, miFuenteCompartida);
   ============================================================ */
(function (global) {
  'use strict';

  function normalizar(txt) {
    return String(txt || '')
      .toLowerCase()
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '');
  }

  function nombreDe(opcion) {
    return typeof opcion === 'string' ? opcion : (opcion && opcion.nombre) || '';
  }

  function filtrar(opciones, query) {
    const q = normalizar(query);
    if (!q) return opciones.slice(0, 100);
    return opciones
      .filter(o => normalizar(nombreDe(o)).includes(q))
      .slice(0, 100);
  }

  function cerrar(cb) {
    cb.lista.hidden = true;
    cb.input.setAttribute('aria-expanded', 'false');
    cb.indiceActivo = -1;
  }

  function abrir(cb) {
    if (!cb.opciones || !cb.opciones.length) return;
    cb.lista.hidden = false;
    cb.input.setAttribute('aria-expanded', 'true');
    render(cb);
  }

  function render(cb) {
    const filtradas = filtrar(cb.opciones, cb.input.value);
    cb.filtradas = filtradas;
    if (cb.indiceActivo >= filtradas.length) cb.indiceActivo = -1;
    if (!filtradas.length) {
      cb.lista.innerHTML = '<li class="combobox__item combobox__item--vacio" role="option" aria-disabled="true">Sin coincidencias</li>';
      return;
    }
    cb.lista.innerHTML = filtradas.map((op, i) => {
      const nom = nombreDe(op);
      const cls = i === cb.indiceActivo ? 'combobox__item activo' : 'combobox__item';
      return '<li class="' + cls + '" role="option" data-i="' + i + '">' + escapar(nom) + '</li>';
    }).join('');
  }

  function escapar(s) {
    return String(s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  function seleccionar(cb, op) {
    cb.input.value = nombreDe(op);
    cerrar(cb);
    // disparar input para que validaciones / cálculos del consumidor corran
    cb.input.dispatchEvent(new Event('input', { bubbles: true }));
    cb.input.dispatchEvent(new Event('change', { bubbles: true }));
  }

  function moverActivo(cb, delta) {
    if (cb.lista.hidden) { abrir(cb); return; }
    const max = (cb.filtradas || []).length;
    if (!max) return;
    cb.indiceActivo = (cb.indiceActivo + delta + max) % max;
    render(cb);
    const activo = cb.lista.querySelector('.combobox__item.activo');
    if (activo) activo.scrollIntoView({ block: 'nearest' });
  }

  function bind(root, fuente) {
    const input = root.querySelector('.combobox__input');
    const lista = root.querySelector('.combobox__lista');
    if (!input || !lista || root.dataset.cbInit === '1') return;
    root.dataset.cbInit = '1';

    const cb = { root, input, lista, fuente, opciones: [], filtradas: [], indiceActivo: -1 };

    input.setAttribute('role', 'combobox');
    input.setAttribute('aria-autocomplete', 'list');
    input.setAttribute('aria-expanded', 'false');

    function cargarOpciones() {
      const f = typeof fuente === 'function' ? fuente() : fuente;
      cb.opciones = Array.isArray(f) ? f : [];
    }

    input.addEventListener('focus', () => {
      cargarOpciones();
      abrir(cb);
    });

    input.addEventListener('input', () => {
      cargarOpciones();
      abrir(cb);
    });

    input.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowDown') { e.preventDefault(); moverActivo(cb, 1); }
      else if (e.key === 'ArrowUp') { e.preventDefault(); moverActivo(cb, -1); }
      else if (e.key === 'Enter') {
        if (!lista.hidden && cb.indiceActivo >= 0) {
          e.preventDefault();
          seleccionar(cb, cb.filtradas[cb.indiceActivo]);
        }
      }
      else if (e.key === 'Escape') { cerrar(cb); }
    });

    // click en un item
    lista.addEventListener('mousedown', (e) => {
      const item = e.target.closest('.combobox__item');
      if (!item || item.classList.contains('combobox__item--vacio')) return;
      e.preventDefault(); // evitar que el input pierda focus antes de leer
      const i = parseInt(item.dataset.i, 10);
      const op = cb.filtradas[i];
      if (op != null) seleccionar(cb, op);
    });

    input.addEventListener('blur', () => {
      // delay para permitir que el mousedown del item dispare seleccionar
      setTimeout(() => cerrar(cb), 120);
    });
  }

  const Combobox = {
    init(rootEl, fuente) {
      const root = rootEl || document;
      if (root.matches && root.matches('.combobox')) {
        bind(root, fuente);
        return;
      }
      const nodos = root.querySelectorAll ? root.querySelectorAll('.combobox') : [];
      nodos.forEach(n => bind(n, fuente));
    }
  };

  global.Combobox = Combobox;
})(window);
