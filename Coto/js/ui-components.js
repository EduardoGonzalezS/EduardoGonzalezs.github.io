/* Componentes visuales reutilizables: formato, etiquetas, toasts y modal de confirmación. */
const UI = (() => {
  const mxn = new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN", maximumFractionDigits: 0 });
  const esc = (t) => String(t ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const fecha = (iso) => new Date(iso + "T12:00:00").toLocaleDateString("es-MX", { day: "2-digit", month: "short", year: "numeric" });

  const TONOS = { "Al corriente": "verde", Completado: "verde", Ingreso: "verde", Pagado: "verde", Programado: "azul",
    Pendiente: "naranja", "Pago parcial": "naranja", "Próximo a vencer": "naranja", Vencido: "rojo", Egreso: "rojo", Cancelado: "rojo", Baja: "gris", Media: "azul", Alta: "naranja", Urgente: "rojo" };
  const tono = (t) => TONOS[t] || "azul";
  const etiqueta = (txt) => `<span class="etiqueta t-${TONOS[txt] || "azul"}">${esc(txt)}</span>`;

  function toast(mensaje, tipo = "success") {
    const ico = { success: "check-circle-fill", warning: "exclamation-triangle-fill", danger: "x-octagon-fill", info: "info-circle-fill" }[tipo];
    const el = document.createElement("div");
    el.className = `toast align-items-center text-bg-${tipo} border-0`;
    el.setAttribute("role", "status");
    el.innerHTML = `<div class="d-flex"><div class="toast-body"><i class="bi bi-${ico} me-2"></i>${esc(mensaje)}</div><button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast" aria-label="Cerrar"></button></div>`;
    document.getElementById("toasts").appendChild(el);
    el.addEventListener("hidden.bs.toast", () => el.remove());
    new bootstrap.Toast(el, { delay: 4000 }).show();
  }

  /** Modal de confirmación propio (sin confirm()). Devuelve Promise<boolean>. */
  function confirmar({ titulo, mensaje, textoOk = "Confirmar", peligro = false }) {
    return new Promise((resolve) => {
      const modalEl = document.getElementById("modalGlobal");
      document.getElementById("modalContenido").innerHTML = `
        <div class="modal-header"><h2 class="modal-title h5">${esc(titulo)}</h2><button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Cerrar"></button></div>
        <div class="modal-body">${esc(mensaje)}</div>
        <div class="modal-footer"><button class="btn btn-light" data-bs-dismiss="modal">Cancelar</button>
        <button class="btn ${peligro ? "btn-danger" : "btn-azul"}" id="btnOk">${esc(textoOk)}</button></div>`;
      const modal = bootstrap.Modal.getOrCreateInstance(modalEl);
      let aceptado = false;
      document.getElementById("btnOk").onclick = () => { aceptado = true; modal.hide(); };
      modalEl.addEventListener("hidden.bs.modal", () => resolve(aceptado), { once: true });
      modal.show();
    });
  }
  const skeleton = (n = 5) => `<div class="row g-3">${Array.from({ length: n }, () => '<div class="col-12 col-sm-6 col-xl"><div class="skeleton"></div></div>').join("")}</div>`;
  /** Abre (o reemplaza el contenido de) el modal global con el HTML indicado. */
  function modal(html) {
    document.getElementById("modalContenido").innerHTML = html;
    const m = bootstrap.Modal.getOrCreateInstance(document.getElementById("modalGlobal"));
    m.show();
    return m;
  }
  function cerrarModal() { const m = bootstrap.Modal.getInstance(document.getElementById("modalGlobal")); if (m) m.hide(); }
  const hoyIso = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`; };
  const ordenar = (lista, o) => [...lista].sort((a, b) => (a[o.campo] > b[o.campo] ? 1 : a[o.campo] < b[o.campo] ? -1 : 0) * o.dir);
  const encabezados = (cols, o, acciones = true) => cols.map(([c, t]) => `<th scope="col" aria-sort="${o.campo === c ? (o.dir > 0 ? "ascending" : "descending") : "none"}"><button class="btn-orden" data-orden="${c}">${t}<i class="bi bi-${o.campo === c ? (o.dir > 0 ? "caret-up-fill" : "caret-down-fill") : "chevron-expand"}"></i></button></th>`).join("") + (acciones ? '<th scope="col">Acciones</th>' : "");
  const paginacion = (paginas, pag) => paginas < 2 ? "" : Array.from({ length: paginas }, (_, i) => i + 1).map((n) => `<li class="page-item ${n === pag ? "active" : ""}"><button class="page-link" data-pag="${n}" ${n === pag ? 'aria-current="page"' : ""}>${n}</button></li>`).join("");
  const mostrarErrores = (form) => form.querySelectorAll(".invalid-feedback").forEach((fb) => { fb.textContent = fb.previousElementSibling.validationMessage; });
  return { mxn, esc, fecha, etiqueta, tono, toast, confirmar, skeleton, modal, cerrarModal, hoyIso, ordenar, encabezados, paginacion, mostrarErrores };
})();
