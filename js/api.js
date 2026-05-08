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
  if (el) el.innerHTML = `<div style="padding:var(--sp-8);text-align:center;color:var(--texto-muted);">⏳ ${msg}</div>`;
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
