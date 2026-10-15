/* Módulo Próximos gastos: saldo proyectado, vista en tarjetas y calendario, registro/edición/pago/cancelación. */
const ProximosGastos = (() => {
  const CATS = Servicios.CATEGORIAS, PRIORIDADES = ["Baja", "Media", "Alta", "Urgente"], ESTADOS = ["Programado", "Próximo a vencer", "Vencido", "Pagado", "Cancelado"];
  let datos = [], resumen = {}, vista, modo = "tarjetas", filtro, mesCal;

  const $ = (id) => document.getElementById(id);
  const abierto = (c) => !["Pagado", "Cancelado"].includes(c.estado);
  const opciones = (lista, sel) => lista.map((o) => `<option ${o === sel ? "selected" : ""}>${UI.esc(o)}</option>`).join("");
  const kpi = (ico, tono, valor, etq) => `<div class="col-6 col-xl-3"><div class="tarjeta kpi"><div class="kpi-ico t-${tono}"><i class="bi bi-${ico}"></i></div><div><div class="kpi-valor">${valor}</div><div class="kpi-etq">${etq}</div></div></div></div>`;
  const par = (k, v) => `<div class="dato-par"><span class="text-muted">${k}</span><strong class="text-end">${v}</strong></div>`;
  const cabecera = (t) => `<div class="modal-header"><h2 class="modal-title h5">${t}</h2><button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Cerrar"></button></div>`;
  const alerta = (t, i, m) => `<div class="alerta-fila t-${t}" role="alert"><i class="bi bi-${i}"></i><span>${UI.esc(m)}</span></div>`;

  async function cargar() { [datos, resumen] = await Promise.all([Servicios.getCompromisos(), Servicios.getResumenProximos()]); }

  async function render(el) {
    vista = el; modo = "tarjetas"; filtro = { q: "", estado: "", prioridad: "" }; const h = new Date(); mesCal = new Date(h.getFullYear(), h.getMonth(), 1);
    vista.innerHTML = UI.skeleton(4); await cargar();
    vista.innerHTML = `<div class="d-flex flex-column gap-2 mb-3" id="pAlertas"></div><div class="row g-3 mb-3" id="pKpi"></div>
      <section class="tarjeta mb-3"><div class="d-flex flex-wrap gap-2 align-items-end">
        <div class="flex-grow-1" style="min-width:200px"><label class="form-label small mb-1" for="pBuscar">Buscar</label><input id="pBuscar" class="form-control" type="search" placeholder="Compromiso, proveedor o categoría"></div>
        <div><label class="form-label small mb-1" for="pEstado">Estado</label><select id="pEstado" class="form-select"><option value="">Todos</option>${opciones(ESTADOS)}</select></div>
        <div><label class="form-label small mb-1" for="pPrioridad">Prioridad</label><select id="pPrioridad" class="form-select"><option value="">Todas</option>${opciones(PRIORIDADES)}</select></div>
        <div class="btn-group" role="group" aria-label="Tipo de vista"><button class="btn btn-outline-primary active" data-vista="tarjetas" aria-pressed="true"><i class="bi bi-grid me-1"></i>Tarjetas</button>
          <button class="btn btn-outline-primary" data-vista="calendario" aria-pressed="false"><i class="bi bi-calendar3 me-1"></i>Calendario</button></div>
        <button class="btn btn-azul" id="pNuevo" type="button"><i class="bi bi-plus-circle me-1"></i>Registrar compromiso</button></div></section>
      <div id="pContenido"></div>`;
    $("pBuscar").addEventListener("input", (e) => { filtro.q = e.target.value; pintar(); });
    $("pEstado").addEventListener("change", (e) => { filtro.estado = e.target.value; pintar(); });
    $("pPrioridad").addEventListener("change", (e) => { filtro.prioridad = e.target.value; pintar(); });
    $("pNuevo").onclick = () => abrirForm();
    vista.addEventListener("click", (e) => {
      const vb = e.target.closest("[data-vista]"), a = e.target.closest("[data-accion]");
      if (vb) { modo = vb.dataset.vista; vista.querySelectorAll("[data-vista]").forEach((b) => { const on = b === vb; b.classList.toggle("active", on); b.setAttribute("aria-pressed", on); }); pintar(); }
      if (a) ({ detalle, editar: abrirForm, pagar, cancelar, mes })[a.dataset.accion](a.dataset.id || Number(a.dataset.dir));
    });
    pintar();
  }

  function listaFiltrada() {
    const t = filtro.q.trim().toLowerCase();
    return datos.filter((c) => (!t || [c.nombre, c.proveedor, c.categoria].some((x) => (x || "").toLowerCase().includes(t))) && (!filtro.estado || c.estado === filtro.estado) && (!filtro.prioridad || c.prioridad === filtro.prioridad));
  }

  function pintar() {
    const r = resumen, alertas = [];
    if (r.vencidosN) alertas.push(alerta("rojo", "calendar-x-fill", `${r.vencidosN} compromiso(s) vencido(s) por ${UI.mxn.format(r.vencidosImporte)}.`));
    if (r.proximosN) alertas.push(alerta("naranja", "clock-fill", `${r.proximosN} compromiso(s) vencen en los próximos 7 días.`));
    if (r.proyectado < 0) alertas.push(alerta("rojo", "exclamation-octagon-fill", "El saldo proyectado a 30 días es negativo: los compromisos superan el saldo disponible."));
    $("pAlertas").innerHTML = alertas.join("");
    $("pKpi").innerHTML = kpi("wallet2", "azul", UI.mxn.format(r.saldo), "Saldo disponible actual") + kpi("calendar2-event", "naranja", UI.mxn.format(r.requerido30), "Requerido en los próximos 30 días")
      + kpi("graph-down-arrow", r.proyectado >= 0 ? "verde" : "rojo", UI.mxn.format(r.proyectado), "Saldo proyectado tras pagar esos 30 días") + kpi("exclamation-circle", "rojo", UI.mxn.format(r.vencidosImporte), `Vencido (${r.vencidosN} compromiso${r.vencidosN === 1 ? "" : "s"})`);
    const lista = listaFiltrada();
    $("pContenido").innerHTML = !lista.length ? '<div class="tarjeta vacio"><i class="bi bi-search fs-2"></i><p class="mb-0 mt-2">No hay compromisos con esos criterios. Cambia los filtros o registra uno nuevo.</p></div>'
      : modo === "tarjetas" ? tarjetas(lista) : calendario(lista);
  }

  function acciones(c) {
    if (!abierto(c)) return `<button class="btn btn-sm btn-light" data-accion="detalle" data-id="${c.id}"><i class="bi bi-eye me-1"></i>Ver</button>`;
    return `<button class="btn btn-sm btn-light" data-accion="editar" data-id="${c.id}"><i class="bi bi-pencil me-1"></i>Editar</button>
      <button class="btn btn-sm btn-outline-success" data-accion="pagar" data-id="${c.id}"><i class="bi bi-check2-circle me-1"></i>Marcar pagado</button>
      <button class="btn btn-sm btn-outline-danger" data-accion="cancelar" data-id="${c.id}"><i class="bi bi-x-circle me-1"></i>Cancelar</button>`;
  }

  function tarjetas(lista) {
    const ab = lista.filter(abierto).sort((a, b) => a.fecha.localeCompare(b.fecha)), resto = lista.filter((c) => !abierto(c)).sort((a, b) => b.fecha.localeCompare(a.fecha));
    const destacadas = new Set(ab.slice(0, 2).map((c) => c.id));
    return `<div class="row g-3">${[...ab, ...resto].map((c) => `<div class="col-12 col-md-6 col-xl-4"><article class="tarjeta compromiso ${destacadas.has(c.id) ? "destacada" : ""} ${abierto(c) ? "" : "inactiva"}">
      <div class="d-flex justify-content-between gap-2"><h2 class="h6 mb-0">${UI.esc(c.nombre)}</h2>${UI.etiqueta(c.prioridad)}</div>
      <p class="small text-muted mb-0">${UI.esc(c.descripcion || "Sin descripción")}</p>
      <div class="small"><i class="bi bi-tag me-1"></i>${UI.esc(c.categoria)} · <i class="bi bi-truck me-1"></i>${UI.esc(c.proveedor || "Sin proveedor")}</div>
      <div class="d-flex justify-content-between align-items-end"><div><div class="small text-muted">Fecha programada</div><strong>${UI.fecha(c.fecha)}</strong></div><div class="text-end"><div class="kpi-valor">${UI.mxn.format(c.importe)}</div>${UI.etiqueta(c.estado)}</div></div>
      <div class="d-flex flex-wrap gap-1 mt-auto">${acciones(c)}</div></article></div>`).join("")}</div>`;
  }

  function calendario(lista) {
    const y = mesCal.getFullYear(), m = mesCal.getMonth(), offset = (new Date(y, m, 1).getDay() + 6) % 7, dias = new Date(y, m + 1, 0).getDate(), hoy = UI.hoyIso(), p = (n) => String(n).padStart(2, "0");
    const celdas = Array.from({ length: offset }, () => '<div class="cal-dia fuera" aria-hidden="true"></div>').concat(Array.from({ length: dias }, (_, i) => {
      const iso = `${y}-${p(m + 1)}-${p(i + 1)}`;
      return `<div class="cal-dia ${iso === hoy ? "hoy" : ""}"><strong>${i + 1}</strong>${lista.filter((c) => c.fecha === iso).map((c) => `<button class="chip t-${UI.tono(c.estado)}" data-accion="detalle" data-id="${c.id}" title="${UI.esc(c.nombre)} · ${UI.mxn.format(c.importe)}">${UI.esc(c.nombre)}</button>`).join("")}</div>`;
    }));
    return `<section class="tarjeta"><div class="d-flex justify-content-between align-items-center mb-3">
      <button class="btn btn-light" data-accion="mes" data-dir="-1" aria-label="Mes anterior"><i class="bi bi-chevron-left"></i></button>
      <h2 class="h6 mb-0 text-capitalize">${mesCal.toLocaleDateString("es-MX", { month: "long", year: "numeric" })}</h2>
      <button class="btn btn-light" data-accion="mes" data-dir="1" aria-label="Mes siguiente"><i class="bi bi-chevron-right"></i></button></div>
      <div class="cal-scroll"><div class="cal">${["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"].map((d) => `<div class="cal-cab">${d}</div>`).join("")}${celdas.join("")}</div></div></section>`;
  }
  function mes(dir) { mesCal = new Date(mesCal.getFullYear(), mesCal.getMonth() + dir, 1); pintar(); }

  async function recargar() { await cargar(); pintar(); pintarNotificaciones(); }
  const porId = (id) => datos.find((c) => c.id === id);

  function detalle(id) {
    const c = porId(id);
    UI.modal(`${cabecera(UI.esc(c.nombre))}<div class="modal-body">${par("Descripción", UI.esc(c.descripcion || "—"))}${par("Categoría", UI.esc(c.categoria))}${par("Proveedor", UI.esc(c.proveedor || "—"))}
      ${par("Fecha programada", UI.fecha(c.fecha))}${par("Importe estimado", UI.mxn.format(c.importe))}${par("Prioridad", UI.etiqueta(c.prioridad))}${par("Estado", UI.etiqueta(c.estado))}</div>
      <div class="modal-footer"><button class="btn btn-light" data-bs-dismiss="modal">Cerrar</button>${abierto(c) ? `<button class="btn btn-outline-primary" id="dEd">Editar</button><button class="btn btn-azul" id="dPg">Marcar pagado</button>` : ""}</div>`);
    if (abierto(c)) { $("dEd").onclick = () => abrirForm(id); $("dPg").onclick = () => { UI.cerrarModal(); setTimeout(() => pagar(id), 350); }; }
  }

  async function pagar(id) {
    const c = porId(id);
    const ok = await UI.confirmar({ titulo: "Marcar compromiso como pagado", textoOk: "Marcar pagado",
      mensaje: `Se registrará un gasto de ${UI.mxn.format(c.importe)} por "${c.nombre}" y se descontará del saldo disponible.${c.importe > resumen.saldo ? " Aviso: el importe supera el saldo disponible actual." : ""}` });
    if (!ok) return UI.toast("Acción cancelada.", "info");
    try { await Servicios.marcarCompromisoPagado(id); await recargar(); UI.toast("Compromiso pagado y gasto registrado."); } catch (e) { UI.toast(e.message, "danger"); }
  }
  async function cancelar(id) {
    const c = porId(id);
    const ok = await UI.confirmar({ titulo: "Cancelar compromiso", textoOk: "Sí, cancelar compromiso", peligro: true, mensaje: `"${c.nombre}" (${UI.mxn.format(c.importe)}) dejará de contar en los próximos gastos.` });
    if (!ok) return UI.toast("Acción cancelada.", "info");
    try { await Servicios.cancelarCompromiso(id); await recargar(); UI.toast("Compromiso cancelado."); } catch (e) { UI.toast(e.message, "danger"); }
  }

  /* ----- Registro / edición: formulario → confirmación → guardado ----- */
  function abrirForm(id = "", prev) {
    const c = id ? porId(id) : null;
    const v = prev || { nombre: c?.nombre || "", descripcion: c?.descripcion || "", categoria: c?.categoria || "", proveedor: c?.proveedor || "", importe: c?.importe ?? "", fecha: c?.fecha || UI.hoyIso(), prioridad: c?.prioridad || "Media" };
    const campo = (i, et, ctl, col = "col-sm-6") => `<div class="${col}"><label class="form-label" for="${i}">${et}</label>${ctl}<div class="invalid-feedback"></div></div>`;
    UI.modal(`${cabecera(id ? "Editar compromiso" : "Registrar compromiso")}<form id="formComp" novalidate><div class="modal-body"><div class="row g-3">
      ${campo("kNombre", "Nombre del compromiso *", `<input id="kNombre" class="form-control form-control-lg" maxlength="80" value="${UI.esc(v.nombre)}" required>`, "col-12")}
      ${campo("kCategoria", "Categoría *", `<select id="kCategoria" class="form-select form-select-lg" required><option value="">Selecciona</option>${opciones(CATS, v.categoria)}</select>`)}
      ${campo("kPrioridad", "Prioridad *", `<select id="kPrioridad" class="form-select form-select-lg" required>${opciones(PRIORIDADES, v.prioridad)}</select>`)}
      ${campo("kFecha", "Fecha programada *", `<input id="kFecha" class="form-control form-control-lg" type="date" value="${v.fecha}" required>`)}
      ${campo("kImporte", "Importe estimado (MXN) *", `<input id="kImporte" class="form-control form-control-lg" type="number" step="0.01" inputmode="decimal" value="${UI.esc(v.importe)}" required>`)}
      ${campo("kProveedor", "Proveedor", `<input id="kProveedor" class="form-control form-control-lg" maxlength="80" value="${UI.esc(v.proveedor)}">`, "col-12")}
      ${campo("kDescripcion", "Descripción", `<textarea id="kDescripcion" class="form-control" rows="2" maxlength="200">${UI.esc(v.descripcion)}</textarea>`, "col-12")}</div></div>
      <div class="modal-footer"><button type="button" class="btn btn-light" id="kCancelar">Cancelar</button><button type="submit" class="btn btn-azul">Continuar</button></div></form>`);
    const form = $("formComp"), revisar = () => { const n = Number($("kImporte").value); $("kImporte").setCustomValidity($("kImporte").value !== "" && n <= 0 ? "El importe debe ser mayor a cero." : ""); UI.mostrarErrores(form); };
    $("kImporte").addEventListener("input", revisar); revisar();
    $("kCancelar").onclick = () => { UI.cerrarModal(); UI.toast(id ? "Edición cancelada." : "Registro cancelado.", "info"); };
    form.addEventListener("submit", (e) => {
      e.preventDefault(); revisar(); form.classList.add("was-validated");
      if (!form.checkValidity()) return UI.toast("Revisa los campos obligatorios o inválidos.", "warning");
      confirmarForm(id, { nombre: $("kNombre").value, categoria: $("kCategoria").value, prioridad: $("kPrioridad").value, fecha: $("kFecha").value, importe: Number($("kImporte").value), proveedor: $("kProveedor").value.trim(), descripcion: $("kDescripcion").value.trim() });
    });
  }

  function confirmarForm(id, d) {
    UI.modal(`${cabecera(id ? "Confirmar cambios" : "Confirmar compromiso")}<div class="modal-body"><p>${id ? "Se guardarán estos cambios:" : "Se registrará este compromiso:"}</p>${par("Nombre", UI.esc(d.nombre))}${par("Categoría", UI.esc(d.categoria))}
      ${par("Fecha", UI.fecha(d.fecha))}${par("Importe", UI.mxn.format(d.importe))}${par("Prioridad", UI.etiqueta(d.prioridad))}${par("Proveedor", UI.esc(d.proveedor || "—"))}</div>
      <div class="modal-footer"><button class="btn btn-light" id="cVolver">Volver</button><button class="btn btn-azul" id="cOk">${id ? "Guardar cambios" : "Registrar"}</button></div>`);
    $("cVolver").onclick = () => abrirForm(id, d);
    $("cOk").onclick = async (e) => {
      const b = e.currentTarget, txt = b.textContent; b.disabled = true; b.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Guardando';
      try { id ? await Servicios.actualizarCompromiso(id, d) : await Servicios.registrarCompromiso(d); UI.cerrarModal(); await recargar(); UI.toast(id ? "Compromiso actualizado." : "Compromiso registrado."); }
      catch (err) { UI.toast(err.message, "danger"); b.disabled = false; b.textContent = txt; }
    };
  }
  return { render };
})();
