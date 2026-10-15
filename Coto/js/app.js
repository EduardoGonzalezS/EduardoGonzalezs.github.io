/* Estructura común (menú, encabezado, avisos) y arranque de cada página. */
const App = (() => {
  const SECCIONES = [
    { id: "dashboard", titulo: "Dashboard", ico: "speedometer2" },
    { id: "casas", titulo: "Casas y pagos", ico: "houses" },
    { id: "ingresos", titulo: "Ingresos", ico: "cash-coin" },
    { id: "gastos", titulo: "Gastos de mantenimiento", ico: "tools" },
    { id: "proximos-gastos", titulo: "Próximos gastos", ico: "calendar2-check" },
    { id: "movimientos", titulo: "Movimientos financieros", ico: "arrow-left-right" },
    { id: "reportes", titulo: "Reportes", ico: "bar-chart-line" },
    { id: "configuracion", titulo: "Configuración", ico: "gear" }
  ];
  const enPaginas = () => document.body.dataset.base === "../";
  /** Ruta relativa a una sección desde la página actual. */
  const url = (id) => (id === "dashboard" ? (enPaginas() ? "../index.html" : "index.html") : (enPaginas() ? "" : "pages/") + id + ".html");

  function pintarShell(sec) {
    const nav = SECCIONES.map((s) => `<li><a class="nav-link ${s.id === sec.id ? "active" : ""}" href="${url(s.id)}" ${s.id === sec.id ? 'aria-current="page"' : ""}><i class="bi bi-${s.ico}"></i>${s.titulo}</a></li>`).join("");
    document.body.insertAdjacentHTML("afterbegin", `
<a class="visually-hidden-focusable" href="#vista">Saltar al contenido</a>
<aside class="offcanvas-lg offcanvas-start sidebar" tabindex="-1" id="menu" aria-label="Menú principal">
  <div class="sidebar-brand"><i class="bi bi-buildings-fill fs-3" aria-hidden="true"></i><div><strong>Paseo de las Calandrias</strong><small class="d-block">Control financiero</small></div>
    <button type="button" class="btn-close btn-close-white ms-auto d-lg-none" data-bs-dismiss="offcanvas" data-bs-target="#menu" aria-label="Cerrar menú"></button></div>
  <nav><ul class="nav flex-column">${nav}</ul></nav><div class="sidebar-foot">Fase 1 · datos de demostración</div>
</aside>
<div class="contenido">
  <header class="topbar">
    <button class="btn btn-light d-lg-none" type="button" data-bs-toggle="offcanvas" data-bs-target="#menu" aria-controls="menu" aria-label="Abrir menú"><i class="bi bi-list fs-5"></i></button>
    <div class="me-auto"><div class="text-muted small">Paseo de las Calandrias</div><h1 class="h4 mb-0">${sec.titulo}</h1></div>
    <span class="text-muted small d-none d-md-inline">${new Date().toLocaleDateString("es-MX", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}</span>
    <div class="dropdown"><button class="btn btn-light position-relative" data-bs-toggle="dropdown" aria-expanded="false" aria-label="Notificaciones"><i class="bi bi-bell"></i><span class="punto-alerta d-none" id="puntoAlerta"></span></button>
      <div class="dropdown-menu dropdown-menu-end p-0 notif-menu" id="listaNotif"></div></div>
    <div class="dropdown"><button class="btn btn-light d-flex align-items-center gap-2" data-bs-toggle="dropdown" aria-expanded="false"><i class="bi bi-person-circle fs-5"></i><span class="d-none d-md-inline">Administración</span></button>
      <div class="dropdown-menu dropdown-menu-end p-3 small"><strong>Administrador del coto</strong><br><span class="text-muted">Sin autenticación en esta fase</span></div></div>
  </header>
  <main id="vista" class="vista entrando" tabindex="-1" aria-live="polite"></main>
</div>
<div class="toast-container position-fixed bottom-0 end-0 p-3" id="toasts"></div>
<div class="modal fade" id="modalGlobal" tabindex="-1" aria-hidden="true"><div class="modal-dialog modal-dialog-centered modal-dialog-scrollable"><div class="modal-content" id="modalContenido"></div></div></div>`);
  }

  /** Arranca la página actual; `modulo` es el objeto con render(vista) (o null si aún no existe). */
  async function iniciar(modulo) {
    const sec = SECCIONES.find((s) => s.id === document.body.dataset.pagina) || SECCIONES[0];
    pintarShell(sec);
    document.title = `${sec.titulo} · Paseo de las Calandrias`;
    pintarNotificaciones();
    const vista = document.getElementById("vista");
    if (modulo) await modulo.render(vista);
    else vista.innerHTML = `<div class="tarjeta vacio"><i class="bi bi-hammer fs-1"></i><h2 class="mt-2">${sec.titulo}</h2><p class="mb-0">Este módulo se entrega en el siguiente bloque.</p></div>`;
  }
  return { SECCIONES, url, iniciar };
})();

async function pintarNotificaciones() {
  const r = await Servicios.getResumenDashboard();
  const items = [];
  r.compromisosVencidos.forEach((c) => items.push(["rojo", "calendar-x-fill", `Compromiso vencido: ${c.nombre}`]));
  if (r.vencidas) items.push(["rojo", "house-exclamation-fill", `${r.vencidas} casas con adeudos vencidos`]);
  r.compromisosProximos.filter((c) => c.estado === "Próximo a vencer").forEach((c) => items.push(["naranja", "clock-fill", `Próximo: ${c.nombre} (${UI.fecha(c.fecha)})`]));
  document.getElementById("puntoAlerta").classList.toggle("d-none", !items.length);
  document.getElementById("listaNotif").innerHTML = items.length
    ? items.map(([t, i, m]) => `<div class="notif-item"><i class="bi bi-${i} c-${t}"></i><span>${UI.esc(m)}</span></div>`).join("")
    : '<div class="vacio py-3">Sin pendientes</div>';
}
