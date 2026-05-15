// URL del Google Apps Script desplegado como Web App.
// Al terminar el setup, reemplaza este valor con la URL real.
const API_URL = 'https://script.google.com/macros/s/AKfycbzp4H9bahRy3niif2qfBt4Z-rGuaE1CygMLrjC8Sg8rioTAT73dcMxxNcWJJDrTQIPQ_g/exec';

// ── Lectura de datos ─────────────────────────────────────────────────────────

async function getData(entity, params = {}) {
  const url = new URL(API_URL);
  url.searchParams.set('entity', entity);
  for (const [k, v] of Object.entries(params)) {
    url.searchParams.set(k, v);
  }
  const res = await fetch(url.toString());
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const json = await res.json();
  if (json.error) throw new Error(json.error);
  return json;
}

// ── Escritura de datos ───────────────────────────────────────────────────────

async function postData(entity, data) {
  const res = await fetch(API_URL, {
    method: 'POST',
    body: JSON.stringify({ entity, data }),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const json = await res.json();
  if (json.error) throw new Error(json.error);
  return json;
}

// ── Helpers de UI ────────────────────────────────────────────────────────────

function mostrarCargando(id, msg = 'Cargando datos...') {
  const el = document.getElementById(id);
  if (!el) return;
  const spinnerHtml = `
    <div class="spinner-rb">
      <div class="spinner-rb__circulo"></div>
      <div class="spinner-rb__icono">🧁</div>
      <div class="spinner-rb__texto">${msg}</div>
    </div>`;
  el.innerHTML = el.tagName === 'TBODY'
    ? `<tr><td colspan="99" style="padding:0;border:none;">${spinnerHtml}</td></tr>`
    : spinnerHtml;
}

function mostrarError(id, msg, reintentar) {
  const el = document.getElementById(id);
  if (!el) return;
  const btnId = 'reintentar-' + id;
  el.innerHTML = `
    <div class="alerta alerta-peligro">
      <span class="alerta__icono">❌</span>
      <div class="alerta__cuerpo">
        <div class="alerta__titulo">Error de conexión</div>
        <div class="alerta__texto">${msg}${reintentar ? ` &nbsp;<button id="${btnId}" class="btn btn-sm btn-ghost">Reintentar</button>` : ''}</div>
      </div>
    </div>`;
  if (reintentar) document.getElementById(btnId)?.addEventListener('click', reintentar);
}

// ── Modales de confirmación / alerta ─────────────────────────────────────────

function _getModal() {
  let dlg = document.getElementById('rb-modal');
  if (!dlg) {
    dlg = document.createElement('dialog');
    dlg.id = 'rb-modal';
    dlg.className = 'modal-rb';
    dlg.innerHTML = `
      <div class="modal-rb__cuerpo">
        <div class="modal-rb__icono" id="rb-modal-icono"></div>
        <h3 class="modal-rb__titulo" id="rb-modal-titulo"></h3>
        <p class="modal-rb__mensaje" id="rb-modal-mensaje"></p>
        <div class="modal-rb__acciones">
          <button type="button" class="btn btn-ghost" id="rb-modal-cancelar">Cancelar</button>
          <button type="button" class="btn" id="rb-modal-aceptar">Aceptar</button>
        </div>
      </div>`;
    document.body.appendChild(dlg);
  }
  return dlg;
}

function modalConfirmar(titulo, mensaje) {
  return new Promise(resolve => {
    const dlg = _getModal();
    document.getElementById('rb-modal-icono').textContent = '⚠️';
    document.getElementById('rb-modal-titulo').textContent = titulo;
    document.getElementById('rb-modal-mensaje').textContent = mensaje;
    const btnCancelar = document.getElementById('rb-modal-cancelar');
    const btnAceptar  = document.getElementById('rb-modal-aceptar');
    btnCancelar.style.display = '';
    btnAceptar.className = 'btn btn-peligro';
    btnAceptar.textContent = 'Eliminar';
    const cleanup = result => { dlg.close(); resolve(result); };
    btnCancelar.onclick = () => cleanup(false);
    btnAceptar.onclick  = () => cleanup(true);
    dlg.oncancel = () => resolve(false);
    dlg.showModal();
  });
}

function modalAlerta(titulo, mensaje, tipo = 'info') {
  return new Promise(resolve => {
    const dlg = _getModal();
    const iconos = { info: 'ℹ️', exito: '✅', error: '❌', alerta: '⚠️' };
    document.getElementById('rb-modal-icono').textContent = iconos[tipo] || 'ℹ️';
    document.getElementById('rb-modal-titulo').textContent = titulo;
    document.getElementById('rb-modal-mensaje').textContent = mensaje;
    const btnCancelar = document.getElementById('rb-modal-cancelar');
    const btnAceptar  = document.getElementById('rb-modal-aceptar');
    btnCancelar.style.display = 'none';
    btnAceptar.className = tipo === 'error' ? 'btn btn-peligro' : 'btn btn-primario';
    btnAceptar.textContent = 'Aceptar';
    btnAceptar.onclick = () => { dlg.close(); resolve(); };
    dlg.oncancel = () => resolve();
    dlg.showModal();
  });
}

// ── Utilidades generales ─────────────────────────────────────────────────────

function fmtMoneda(n) {
  return '$' + Number(n || 0).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

function urlParam(key) {
  return new URLSearchParams(location.search).get(key);
}

function formatFecha(isoDate) {
  if (!isoDate) return '—';
  const d = new Date(isoDate.includes('T') ? isoDate : isoDate + 'T12:00:00');
  return d.toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' });
}

function formatMes(isoDate) {
  if (!isoDate) return '—';
  const d = new Date(isoDate.includes('T') ? isoDate : isoDate + 'T12:00:00');
  return d.toLocaleDateString('es-MX', { month: 'short', year: 'numeric' });
}
