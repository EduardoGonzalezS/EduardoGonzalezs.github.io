/* Módulo Gastos de mantenimiento: indicadores, tabla, formulario con advertencia de saldo y acciones. */
const Gastos = (() => {
  const POR_PAGINA = 10, CATS = Servicios.CATEGORIAS;
  const METODOS = ["Transferencia", "Efectivo", "Domiciliación", "Tarjeta", "Cheque"];
  let datos = [], saldo = 0, vista, pagina = 1, filtro, orden;

  const $ = (id) => document.getElementById(id);
  const opciones = (lista, sel) => lista.map((o) => `<option ${o === sel ? "selected" : ""}>${UI.esc(o)}</option>`).join("");
  const kpi = (ico, tono, valor, etq) => `<div class="col-6 col-xl-3"><div class="tarjeta kpi"><div class="kpi-ico t-${tono}"><i class="bi bi-${ico}"></i></div><div><div class="kpi-valor">${valor}</div><div class="kpi-etq">${etq}</div></div></div></div>`;
  const par = (k, v) => `<div class="dato-par"><span class="text-muted">${k}</span><strong class="text-end">${v}</strong></div>`;
  const cabecera = (t) => `<div class="modal-header"><h2 class="modal-title h5">${t}</h2><button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Cerrar"></button></div>`;
  const meses = () => Array.from({ length: 6 }, (_, i) => { const h = new Date(); const d = new Date(h.getFullYear(), h.getMonth() - i, 15, 12);
    return { v: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`, t: d.toLocaleDateString("es-MX", { month: "long", year: "numeric" }) }; });
  const aviso = (g) => `<i class="bi bi-exclamation-triangle-fill"></i><span>El importe (${UI.mxn.format(g)}) supera el saldo disponible (${UI.mxn.format(saldo)}). Puedes continuar; la regla definitiva se definirá con el backend.</span>`;

  async function cargar() { [datos, saldo] = await Promise.all([Servicios.getGastos(), Servicios.getSaldo()]); }

  async function render(el) {
    vista = el; pagina = 1; filtro = { q: "", cat: "", estado: "", mes: "" }; orden = { campo: "fecha", dir: -1 };
    vista.innerHTML = UI.skeleton(4); await cargar();
    vista.innerHTML = `<div class="row g-3 mb-3" id="gKpi"></div>
      <section class="tarjeta"><div class="d-flex flex-wrap gap-2 mb-3 align-items-end">
        <div class="flex-grow-1" style="min-width:200px"><label class="form-label small mb-1" for="gBuscar">Buscar</label><input id="gBuscar" class="form-control" type="search" placeholder="Concepto, proveedor o comprobante"></div>
        <div><label class="form-label small mb-1" for="gCat">Categoría</label><select id="gCat" class="form-select"><option value="">Todas</option>${opciones(CATS)}</select></div>
        <div><label class="form-label small mb-1" for="gEstado">Estado</label><select id="gEstado" class="form-select"><option value="">Todos</option>${opciones(["Completado", "Pendiente"])}</select></div>
        <div><label class="form-label small mb-1" for="gMes">Periodo</label><select id="gMes" class="form-select"><option value="">Todos</option>${meses().map((m) => `<option value="${m.v}">${m.t}</option>`).join("")}</select></div>
        <button class="btn btn-light" id="gLimpiar" type="button"><i class="bi bi-x-circle me-1"></i>Limpiar</button>
        <button class="btn btn-azul" id="gNuevo" type="button"><i class="bi bi-plus-circle me-1"></i>Registrar gasto</button></div>
        <div class="table-responsive"><table class="table tabla align-middle table-hover"><thead><tr id="gHead"></tr></thead><tbody id="gBody"></tbody></table></div>
        <div id="gVacio"></div><div class="d-flex flex-wrap justify-content-between align-items-center gap-2 mt-3"><small class="text-muted" id="gConteo"></small><nav aria-label="Paginación de gastos"><ul class="pagination pagination-sm mb-0" id="gPag"></ul></nav></div></section>`;
    $("gBuscar").addEventListener("input", (e) => { filtro.q = e.target.value; pagina = 1; pintar(); });
    [["gCat", "cat"], ["gEstado", "estado"], ["gMes", "mes"]].forEach(([id, k]) => $(id).addEventListener("change", (e) => { filtro[k] = e.target.value; pagina = 1; pintar(); }));
    $("gLimpiar").onclick = () => { filtro = { q: "", cat: "", estado: "", mes: "" }; ["gBuscar", "gCat", "gEstado", "gMes"].forEach((i) => ($(i).value = "")); pagina = 1; pintar(); UI.toast("Filtros restablecidos.", "info"); };
    $("gNuevo").onclick = () => abrirGasto();
    vista.addEventListener("click", (e) => {
      const o = e.target.closest("[data-orden]"), a = e.target.closest("[data-accion]"), p = e.target.closest("[data-pag]");
      if (o) { orden = { campo: o.dataset.orden, dir: orden.campo === o.dataset.orden ? -orden.dir : 1 }; pintar(); }
      if (p) { pagina = Number(p.dataset.pag); pintar(); }
      if (a) ({ pagar, eliminar })[a.dataset.accion](a.dataset.id);
    });
    pintar();
  }

  function pintar() {
    const t = filtro.q.trim().toLowerCase();
    const lista = UI.ordenar(datos.filter((g) => (!t || [g.concepto, g.proveedor, g.comprobante].some((x) => (x || "").toLowerCase().includes(t)))
      && (!filtro.cat || g.categoria === filtro.cat) && (!filtro.estado || g.estado === filtro.estado) && (!filtro.mes || g.fecha.slice(0, 7) === filtro.mes)), orden);
    const paginas = Math.max(1, Math.ceil(lista.length / POR_PAGINA)); pagina = Math.min(pagina, paginas);

    const mes = UI.hoyIso().slice(0, 7), delMes = datos.filter((g) => g.fecha.slice(0, 7) === mes), hechos = delMes.filter((g) => g.estado === "Completado");
    const porCat = {}; hechos.forEach((g) => (porCat[g.categoria] = (porCat[g.categoria] || 0) + g.importe));
    const top = Object.entries(porCat).sort((a, b) => b[1] - a[1])[0];
    $("gKpi").innerHTML = kpi("receipt", "rojo", UI.mxn.format(hechos.reduce((a, g) => a + g.importe, 0)), "Gasto total del mes") + kpi("list-check", "azul", delMes.length, "Gastos registrados este mes")
      + kpi("trophy", "naranja", top ? UI.esc(top[0]) : "—", top ? `Categoría con mayor gasto (${UI.mxn.format(top[1])})` : "Categoría con mayor gasto")
      + kpi("hourglass-split", "naranja", UI.mxn.format(datos.filter((g) => g.estado === "Pendiente").reduce((a, g) => a + g.importe, 0)), "Gastos pendientes de pago");

    $("gHead").innerHTML = UI.encabezados([["fecha", "Fecha"], ["concepto", "Concepto"], ["categoria", "Categoría"], ["proveedor", "Proveedor"], ["importe", "Importe"], ["metodoPago", "Método"], ["estado", "Estado"], ["comprobante", "Comprobante"]], orden);
    $("gBody").innerHTML = lista.slice((pagina - 1) * POR_PAGINA, pagina * POR_PAGINA).map((g) => `<tr><td>${UI.fecha(g.fecha)}</td><td>${UI.esc(g.concepto)}</td><td>${UI.esc(g.categoria)}</td><td>${UI.esc(g.proveedor || "—")}</td>
      <td class="fw-semibold">${UI.mxn.format(g.importe)}</td><td>${UI.esc(g.metodoPago || "—")}</td><td>${UI.etiqueta(g.estado)}</td><td>${UI.esc(g.comprobante || "—")}</td>
      <td><div class="acciones">${g.estado === "Pendiente" ? `<button class="btn btn-sm btn-light" data-accion="pagar" data-id="${g.id}" title="Marcar como completado" aria-label="Marcar como completado: ${UI.esc(g.concepto)}"><i class="bi bi-check-circle"></i></button>` : ""}
      <button class="btn btn-sm btn-light" data-accion="eliminar" data-id="${g.id}" title="Eliminar" aria-label="Eliminar: ${UI.esc(g.concepto)}"><i class="bi bi-trash"></i></button></div></td></tr>`).join("");
    $("gVacio").innerHTML = lista.length ? "" : '<div class="vacio"><i class="bi bi-search fs-2"></i><p class="mb-0 mt-2">No hay gastos con esos criterios. Cambia la búsqueda o limpia los filtros.</p></div>';
    $("gConteo").textContent = `${lista.length} de ${datos.length} gastos`;
    $("gPag").innerHTML = UI.paginacion(paginas, pagina);
  }

  async function recargar() { await cargar(); pintar(); pintarNotificaciones(); }

  async function pagar(id) {
    const g = datos.find((x) => x.id === id);
    const ok = await UI.confirmar({ titulo: "Marcar gasto como completado", textoOk: "Marcar completado",
      mensaje: `"${g.concepto}" por ${UI.mxn.format(g.importe)} se marcará como completado y se descontará del saldo disponible.${g.importe > saldo ? " Aviso: el importe supera el saldo disponible actual." : ""}` });
    if (!ok) return UI.toast("Acción cancelada.", "info");
    try { await Servicios.marcarGastoCompletado(id); await recargar(); UI.toast("Gasto marcado como completado."); } catch (e) { UI.toast(e.message, "danger"); }
  }
  async function eliminar(id) {
    const g = datos.find((x) => x.id === id);
    const ok = await UI.confirmar({ titulo: "Eliminar gasto", textoOk: "Eliminar", peligro: true, mensaje: `Se eliminará "${g.concepto}" (${UI.mxn.format(g.importe)}) del historial. Esta acción no se puede deshacer.` });
    if (!ok) return UI.toast("Acción cancelada.", "info");
    try { await Servicios.eliminarGasto(id); await recargar(); UI.toast("Gasto eliminado."); } catch (e) { UI.toast(e.message, "danger"); }
  }

  /* ----- Registro: formulario → confirmación → guardado ----- */
  function abrirGasto(prev = {}) {
    const v = { concepto: "", categoria: "", descripcion: "", proveedor: "", importe: "", fecha: UI.hoyIso(), metodo: "Transferencia", estado: "Completado", comprobante: "", observaciones: "", ...prev };
    const campo = (id, et, ctl, col = "col-sm-6") => `<div class="${col}"><label class="form-label" for="${id}">${et}</label>${ctl}<div class="invalid-feedback"></div></div>`;
    UI.modal(`${cabecera("Registrar gasto")}<form id="formGasto" novalidate><div class="modal-body"><div class="row g-3">
      ${campo("fConcepto", "Concepto *", `<input id="fConcepto" class="form-control form-control-lg" maxlength="80" value="${UI.esc(v.concepto)}" required>`, "col-12")}
      ${campo("fCategoria", "Categoría *", `<select id="fCategoria" class="form-select form-select-lg" required><option value="">Selecciona</option>${opciones(CATS, v.categoria)}</select>`)}
      ${campo("fProveedor", "Proveedor *", `<input id="fProveedor" class="form-control form-control-lg" maxlength="80" value="${UI.esc(v.proveedor)}" required>`)}
      ${campo("fImporte", "Importe (MXN) *", `<input id="fImporte" class="form-control form-control-lg" type="number" step="0.01" inputmode="decimal" value="${UI.esc(v.importe)}" required>`)}
      ${campo("fFecha", "Fecha del gasto *", `<input id="fFecha" class="form-control form-control-lg" type="date" max="${UI.hoyIso()}" value="${v.fecha}" required>`)}
      ${campo("fMetodo", "Método de pago *", `<select id="fMetodo" class="form-select form-select-lg" required>${opciones(METODOS, v.metodo)}</select>`)}
      ${campo("fEstado", "Estado *", `<select id="fEstado" class="form-select form-select-lg" required>${opciones(["Completado", "Pendiente"], v.estado)}</select>`)}
      ${campo("fComprobante", "Referencia del comprobante", `<input id="fComprobante" class="form-control" maxlength="40" value="${UI.esc(v.comprobante)}">`, "col-12")}
      <div class="col-12"><button type="button" class="area-comprobante" id="fAdjuntar"><i class="bi bi-paperclip fs-4"></i><span>Adjuntar comprobante</span><small>La carga de archivos se habilitará con el backend</small></button></div>
      ${campo("fDescripcion", "Descripción", `<textarea id="fDescripcion" class="form-control" rows="2" maxlength="200">${UI.esc(v.descripcion)}</textarea>`, "col-12")}
      ${campo("fObs", "Observaciones", `<textarea id="fObs" class="form-control" rows="2" maxlength="200">${UI.esc(v.observaciones)}</textarea>`, "col-12")}
      <div class="col-12"><div class="alerta-fila t-naranja d-none" id="fAviso" role="alert"></div></div></div></div>
      <div class="modal-footer"><button type="button" class="btn btn-light" id="fCancelar">Cancelar</button><button type="submit" class="btn btn-azul">Continuar</button></div></form>`);
    const form = $("formGasto");
    const revisar = () => {
      const n = Number($("fImporte").value);
      $("fImporte").setCustomValidity($("fImporte").value !== "" && n <= 0 ? "El importe debe ser mayor a cero." : "");
      $("fAviso").classList.toggle("d-none", !(n > saldo)); if (n > saldo) $("fAviso").innerHTML = aviso(n);
      UI.mostrarErrores(form);
    };
    $("fImporte").addEventListener("input", revisar); revisar();
    $("fAdjuntar").onclick = () => UI.toast("Operación no disponible: la carga de archivos llegará con el backend.", "info");
    $("fCancelar").onclick = () => { UI.cerrarModal(); UI.toast("Registro de gasto cancelado.", "info"); };
    form.addEventListener("submit", (e) => {
      e.preventDefault(); revisar(); form.classList.add("was-validated");
      if (!form.checkValidity()) return UI.toast("Revisa los campos obligatorios o inválidos.", "warning");
      confirmarGasto({ concepto: $("fConcepto").value, categoria: $("fCategoria").value, proveedor: $("fProveedor").value, importe: Number($("fImporte").value), fecha: $("fFecha").value,
        metodo: $("fMetodo").value, estado: $("fEstado").value, comprobante: $("fComprobante").value.trim(), descripcion: $("fDescripcion").value.trim(), observaciones: $("fObs").value.trim() });
    });
  }

  function confirmarGasto(g) {
    UI.modal(`${cabecera("Confirmar gasto")}<div class="modal-body"><p>Se registrará este gasto:</p>${par("Concepto", UI.esc(g.concepto))}${par("Categoría", UI.esc(g.categoria))}${par("Proveedor", UI.esc(g.proveedor))}
      ${par("Importe", UI.mxn.format(g.importe))}${par("Fecha", UI.fecha(g.fecha))}${par("Método", UI.esc(g.metodo))}${par("Estado", UI.etiqueta(g.estado))}
      ${g.importe > saldo ? `<div class="alerta-fila t-naranja mt-3" role="alert">${aviso(g.importe)}</div>` : ""}</div>
      <div class="modal-footer"><button class="btn btn-light" id="cVolver">Volver</button><button class="btn btn-azul" id="cOk">Confirmar gasto</button></div>`);
    $("cVolver").onclick = () => abrirGasto({ ...g, observaciones: g.observaciones });
    $("cOk").onclick = async (e) => {
      const b = e.currentTarget; b.disabled = true; b.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Guardando';
      try { await Servicios.registrarGasto(g); UI.cerrarModal(); await recargar(); UI.toast(`Gasto de ${UI.mxn.format(g.importe)} registrado.`); }
      catch (err) { UI.toast(err.message, "danger"); b.disabled = false; b.textContent = "Confirmar gasto"; }
    };
  }
  return { render };
})();
