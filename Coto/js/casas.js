/* Módulo Casas y pagos: indicadores, tabla con búsqueda/filtros/orden/paginación y modales. */
const Casas = (() => {
  const POR_PAGINA = 10;
  const METODOS = ["Transferencia", "Efectivo", "Depósito bancario", "Tarjeta"];
  const PERIODOS = ["Mes actual", "Mes anterior"];
  let datos = [], vista, pagina = 1;
  let filtro = { q: "", estado: "", periodo: "" }, orden = { campo: "numero", dir: 1 };

  const hoyIso = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`; };
  const opciones = (lista, sel) => lista.map((o) => `<option ${o === sel ? "selected" : ""}>${UI.esc(o)}</option>`).join("");
  const porId = (id) => datos.find((c) => c.id === id);
  const kpi = (ico, tono, valor, etq) => `<div class="col-6 col-xl-3"><div class="tarjeta kpi"><div class="kpi-ico t-${tono}"><i class="bi bi-${ico}"></i></div><div><div class="kpi-valor">${valor}</div><div class="kpi-etq">${etq}</div></div></div></div>`;
  const par = (k, v) => `<div class="dato-par"><span class="text-muted">${k}</span><strong class="text-end">${v}</strong></div>`;
  const cabecera = (t) => `<div class="modal-header"><h2 class="modal-title h5">${t}</h2><button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Cerrar"></button></div>`;

  async function render(el) {
    vista = el; pagina = 1; filtro = { q: "", estado: "", periodo: "" }; orden = { campo: "numero", dir: 1 };
    vista.innerHTML = UI.skeleton(4);
    datos = await Servicios.getCasas();
    vista.innerHTML = `
      <div class="row g-3 mb-3" id="casasKpi"></div>
      <section class="tarjeta">
        <div class="d-flex flex-wrap gap-2 mb-3 align-items-end">
          <div class="flex-grow-1" style="min-width:200px"><label class="form-label small mb-1" for="fBuscar">Buscar</label>
            <input id="fBuscar" class="form-control" type="search" placeholder="Número de casa o propietario"></div>
          <div><label class="form-label small mb-1" for="fEstado">Estado</label>
            <select id="fEstado" class="form-select"><option value="">Todos</option>${opciones(["Al corriente", "Pendiente", "Vencido", "Pago parcial"])}</select></div>
          <div><label class="form-label small mb-1" for="fPeriodo">Periodo pagado</label>
            <select id="fPeriodo" class="form-select"><option value="">Todos</option>${opciones(PERIODOS)}</select></div>
          <button class="btn btn-light" id="btnLimpiar" type="button"><i class="bi bi-x-circle me-1"></i>Limpiar</button>
          <button class="btn btn-azul" id="btnNuevoPago" type="button"><i class="bi bi-cash-coin me-1"></i>Registrar pago</button>
        </div>
        <div class="table-responsive"><table class="table tabla align-middle table-hover"><thead><tr id="casasHead"></tr></thead><tbody id="casasBody"></tbody></table></div>
        <div id="casasVacio"></div>
        <div class="d-flex flex-wrap justify-content-between align-items-center gap-2 mt-3"><small class="text-muted" id="casasConteo"></small><nav aria-label="Paginación de casas"><ul class="pagination pagination-sm mb-0" id="casasPag"></ul></nav></div>
      </section>`;
    enlazar(); pintar();
  }

  function enlazar() {
    const q = (id) => document.getElementById(id);
    q("fBuscar").addEventListener("input", (e) => { filtro.q = e.target.value; pagina = 1; pintar(); });
    q("fEstado").addEventListener("change", (e) => { filtro.estado = e.target.value; pagina = 1; pintar(); });
    q("fPeriodo").addEventListener("change", (e) => { filtro.periodo = e.target.value; pagina = 1; pintar(); });
    q("btnLimpiar").addEventListener("click", () => { filtro = { q: "", estado: "", periodo: "" }; ["fBuscar", "fEstado", "fPeriodo"].forEach((i) => (q(i).value = "")); pagina = 1; pintar(); UI.toast("Filtros restablecidos.", "info"); });
    q("btnNuevoPago").addEventListener("click", () => abrirPago());
    vista.addEventListener("click", (e) => {
      const ord = e.target.closest("[data-orden]"), acc = e.target.closest("[data-accion]"), pg = e.target.closest("[data-pag]");
      if (ord) { const c = ord.dataset.orden; orden = { campo: c, dir: orden.campo === c ? -orden.dir : 1 }; pintar(); }
      if (pg) { pagina = Number(pg.dataset.pag); pintar(); }
      if (acc) ({ detalle, pago: abrirPago, historial, adeudo })[acc.dataset.accion](acc.dataset.id);
    });
  }

  function pintar() {
    const q = filtro.q.trim().toLowerCase();
    let lista = datos.filter((c) => (!q || String(c.numero).includes(q) || c.id.toLowerCase().includes(q) || c.propietario.toLowerCase().includes(q))
      && (!filtro.estado || c.estado === filtro.estado) && (!filtro.periodo || c.periodoPagado === filtro.periodo));
    lista.sort((a, b) => (a[orden.campo] > b[orden.campo] ? 1 : a[orden.campo] < b[orden.campo] ? -1 : 0) * orden.dir);
    const paginas = Math.max(1, Math.ceil(lista.length / POR_PAGINA));
    pagina = Math.min(pagina, paginas);
    const visibles = lista.slice((pagina - 1) * POR_PAGINA, pagina * POR_PAGINA);
    const cuenta = (...e) => datos.filter((c) => e.includes(c.estado)).length;

    document.getElementById("casasKpi").innerHTML = kpi("houses", "azul", datos.length, "Casas registradas") + kpi("check-circle", "verde", cuenta("Al corriente"), "Al corriente")
      + kpi("hourglass-split", "naranja", cuenta("Pendiente", "Pago parcial"), "Con pagos pendientes") + kpi("exclamation-octagon", "rojo", cuenta("Vencido"), "Con adeudos vencidos");

    const cols = [["numero", "Casa"], ["propietario", "Propietario"], ["cuota", "Cuota mensual"], ["ultimoPago", "Último pago"], ["periodoPagado", "Periodo pagado"], ["saldoPendiente", "Saldo pendiente"], ["estado", "Estado"]];
    document.getElementById("casasHead").innerHTML = cols.map(([c, t]) => `<th scope="col" aria-sort="${orden.campo === c ? (orden.dir > 0 ? "ascending" : "descending") : "none"}">
      <button class="btn-orden" data-orden="${c}">${t}<i class="bi bi-${orden.campo === c ? (orden.dir > 0 ? "caret-up-fill" : "caret-down-fill") : "chevron-expand"}"></i></button></th>`).join("") + '<th scope="col">Acciones</th>';

    document.getElementById("casasBody").innerHTML = visibles.map((c) => `<tr>
      <td class="fw-semibold">Casa ${c.numero}</td><td>${UI.esc(c.propietario)}</td><td>${UI.mxn.format(c.cuota)}</td><td>${UI.fecha(c.ultimoPago)}</td><td>${UI.esc(c.periodoPagado)}</td>
      <td class="${c.saldoPendiente ? "fw-semibold c-rojo" : "text-muted"}">${UI.mxn.format(c.saldoPendiente)}</td><td>${UI.etiqueta(c.estado)}</td>
      <td><div class="acciones">
        <button class="btn btn-sm btn-light" data-accion="detalle" data-id="${c.id}" title="Ver detalle" aria-label="Ver detalle de la casa ${c.numero}"><i class="bi bi-eye"></i></button>
        <button class="btn btn-sm btn-light" data-accion="pago" data-id="${c.id}" title="${c.saldoPendiente ? "Registrar pago" : "Sin adeudo"}" aria-label="Registrar pago de la casa ${c.numero}" ${c.saldoPendiente ? "" : "disabled"}><i class="bi bi-cash-coin"></i></button>
        <button class="btn btn-sm btn-light" data-accion="historial" data-id="${c.id}" title="Historial de pagos" aria-label="Historial de pagos de la casa ${c.numero}"><i class="bi bi-clock-history"></i></button>
        <button class="btn btn-sm btn-light" data-accion="adeudo" data-id="${c.id}" title="Adeudo acumulado" aria-label="Adeudo acumulado de la casa ${c.numero}"><i class="bi bi-receipt-cutoff"></i></button></div></td></tr>`).join("");

    document.getElementById("casasVacio").innerHTML = lista.length ? "" : '<div class="vacio"><i class="bi bi-search fs-2"></i><p class="mb-0 mt-2">No hay casas con esos criterios. Cambia la búsqueda o limpia los filtros.</p></div>';
    document.getElementById("casasConteo").textContent = `${lista.length} de ${datos.length} casas`;
    document.getElementById("casasPag").innerHTML = paginas < 2 ? "" : Array.from({ length: paginas }, (_, i) => i + 1).map((n) =>
      `<li class="page-item ${n === pagina ? "active" : ""}"><button class="page-link" data-pag="${n}" ${n === pagina ? 'aria-current="page"' : ""}>${n}</button></li>`).join("");
  }

  /* ---------- Modales de consulta ---------- */
  function detalle(id) {
    const c = porId(id);
    UI.modal(`${cabecera(`Casa ${c.numero}`)}<div class="modal-body">${par("Propietario", UI.esc(c.propietario))}${par("Cuota mensual", UI.mxn.format(c.cuota))}
      ${par("Último pago", UI.fecha(c.ultimoPago))}${par("Periodo pagado", UI.esc(c.periodoPagado))}${par("Saldo pendiente", UI.mxn.format(c.saldoPendiente))}${par("Estado", UI.etiqueta(c.estado))}</div>
      <div class="modal-footer"><button class="btn btn-light" data-bs-dismiss="modal">Cerrar</button><button class="btn btn-outline-primary" id="mHist"><i class="bi bi-clock-history me-1"></i>Historial</button>
      <button class="btn btn-azul" id="mPago" ${c.saldoPendiente ? "" : "disabled"}><i class="bi bi-cash-coin me-1"></i>Registrar pago</button></div>`);
    document.getElementById("mHist").onclick = () => historial(id);
    document.getElementById("mPago").onclick = () => abrirPago(id);
  }

  async function historial(id) {
    const c = porId(id);
    UI.modal(`${cabecera(`Historial · Casa ${c.numero}`)}<div class="modal-body text-center"><div class="spinner-border text-primary" role="status"><span class="visually-hidden">Cargando</span></div></div>`);
    const pagos = await Servicios.getPagosCasa(id);
    document.querySelector("#modalContenido .modal-body").innerHTML = pagos.length
      ? `<div class="table-responsive"><table class="table tabla"><thead><tr><th>Fecha</th><th>Método</th><th>Referencia</th><th class="text-end">Importe</th></tr></thead><tbody>${pagos.map((p) =>
        `<tr><td>${UI.fecha(p.fecha)}</td><td>${UI.esc(p.metodoPago || "—")}</td><td>${UI.esc(p.referencia)}</td><td class="text-end c-verde fw-semibold">${UI.mxn.format(p.importe)}</td></tr>`).join("")}</tbody></table></div>`
      : '<div class="vacio"><i class="bi bi-inbox fs-2"></i><p class="mb-0 mt-2">Esta casa no tiene pagos registrados en los datos de demostración.</p></div>';
    document.querySelector("#modalContenido .modal-body").classList.remove("text-center");
    document.getElementById("modalContenido").insertAdjacentHTML("beforeend", '<div class="modal-footer"><button class="btn btn-light" data-bs-dismiss="modal">Cerrar</button></div>');
  }

  function adeudo(id) {
    const c = porId(id), cuotas = Math.ceil(c.saldoPendiente / c.cuota);
    UI.modal(`${cabecera(`Adeudo acumulado · Casa ${c.numero}`)}<div class="modal-body text-center">
      <div class="kpi-valor ${c.saldoPendiente ? "c-rojo" : "c-verde"}" style="font-size:2rem">${UI.mxn.format(c.saldoPendiente)}</div>
      <p class="text-muted">${c.saldoPendiente ? `Equivale a ${cuotas} cuota${cuotas > 1 ? "s" : ""} de ${UI.mxn.format(c.cuota)}.` : "Esta casa está al corriente."}</p>${UI.etiqueta(c.estado)}</div>
      <div class="modal-footer"><button class="btn btn-light" data-bs-dismiss="modal">Cerrar</button>${c.saldoPendiente ? '<button class="btn btn-azul" id="mPago"><i class="bi bi-cash-coin me-1"></i>Registrar pago</button>' : ""}</div>`);
    const b = document.getElementById("mPago"); if (b) b.onclick = () => abrirPago(id);
  }

  /* ---------- Registro de pago: formulario → confirmación → guardado ---------- */
  function abrirPago(casaId = "", prev = {}) {
    const v = { importe: "", fecha: hoyIso(), periodo: "Mes actual", metodo: "Transferencia", obs: "", ...prev };
    UI.modal(`${cabecera("Registrar pago")}<form id="formPago" novalidate><div class="modal-body d-grid gap-3">
      <div><label class="form-label" for="pCasa">Casa *</label><select id="pCasa" class="form-select form-select-lg" required>
        <option value="">Selecciona una casa</option>${datos.map((c) => `<option value="${c.id}" ${c.id === casaId ? "selected" : ""}>Casa ${c.numero} · ${UI.esc(c.propietario)}</option>`).join("")}</select><div class="invalid-feedback"></div></div>
      <div class="info-casa" id="pInfo" aria-live="polite">Selecciona una casa para ver su cuota y adeudo.</div>
      <div class="row g-3"><div class="col-sm-6"><label class="form-label" for="pImporte">Importe (MXN) *</label><input id="pImporte" class="form-control form-control-lg" type="number" step="0.01" inputmode="decimal" value="${UI.esc(v.importe)}" required><div class="invalid-feedback"></div></div>
        <div class="col-sm-6"><label class="form-label" for="pFecha">Fecha de pago *</label><input id="pFecha" class="form-control form-control-lg" type="date" max="${hoyIso()}" value="${v.fecha}" required><div class="invalid-feedback"></div></div>
        <div class="col-sm-6"><label class="form-label" for="pPeriodo">Periodo que se paga *</label><select id="pPeriodo" class="form-select form-select-lg" required>${opciones(PERIODOS, v.periodo)}</select></div>
        <div class="col-sm-6"><label class="form-label" for="pMetodo">Método de pago *</label><select id="pMetodo" class="form-select form-select-lg" required>${opciones(METODOS, v.metodo)}</select></div></div>
      <div><label class="form-label" for="pObs">Observaciones</label><textarea id="pObs" class="form-control" rows="2" maxlength="200">${UI.esc(v.obs)}</textarea></div></div>
      <div class="modal-footer"><button type="button" class="btn btn-light" id="pCancelar">Cancelar</button><button type="submit" class="btn btn-azul">Continuar</button></div></form>`);
    const f = (id) => document.getElementById(id), form = f("formPago");

    const validarImporte = () => {
      const c = porId(f("pCasa").value), n = Number(f("pImporte").value); let msg = "";
      if (f("pImporte").value !== "" && n <= 0) msg = "El importe debe ser mayor a cero.";
      else if (c && f("pImporte").value !== "" && c.saldoPendiente === 0) msg = "Esta casa no tiene adeudo.";
      else if (c && n > c.saldoPendiente) msg = `No puede superar el adeudo (${UI.mxn.format(c.saldoPendiente)}).`;
      f("pImporte").setCustomValidity(msg);
    };
    const mostrarErrores = () => form.querySelectorAll(".invalid-feedback").forEach((fb) => { fb.textContent = fb.previousElementSibling.validationMessage; });
    const info = () => { const c = porId(f("pCasa").value);
      f("pInfo").innerHTML = c ? `<strong>Casa ${c.numero}</strong> · Cuota ${UI.mxn.format(c.cuota)} · Adeudo <strong class="${c.saldoPendiente ? "c-rojo" : "c-verde"}">${UI.mxn.format(c.saldoPendiente)}</strong>${c.saldoPendiente ? "" : " (sin adeudo)"}` : "Selecciona una casa para ver su cuota y adeudo."; };

    f("pCasa").addEventListener("change", () => { const c = porId(f("pCasa").value); info(); f("pImporte").value = c && c.saldoPendiente ? c.saldoPendiente : ""; validarImporte(); mostrarErrores(); });
    f("pImporte").addEventListener("input", () => { validarImporte(); mostrarErrores(); });
    f("pCancelar").onclick = () => { UI.cerrarModal(); UI.toast("Registro de pago cancelado.", "info"); };
    info(); validarImporte();

    form.addEventListener("submit", (e) => {
      e.preventDefault(); validarImporte(); mostrarErrores(); form.classList.add("was-validated");
      if (!form.checkValidity()) { UI.toast("Revisa los campos obligatorios o inválidos.", "warning"); return; }
      confirmarPago({ casaId: f("pCasa").value, importe: Number(f("pImporte").value), fecha: f("pFecha").value, periodo: f("pPeriodo").value, metodo: f("pMetodo").value, observaciones: f("pObs").value.trim() });
    });
  }

  function confirmarPago(p) {
    const c = porId(p.casaId), restante = c.saldoPendiente - p.importe;
    UI.modal(`${cabecera("Confirmar pago")}<div class="modal-body"><p>Se registrará este pago:</p>${par("Casa", `${c.numero} · ${UI.esc(c.propietario)}`)}${par("Importe", UI.mxn.format(p.importe))}
      ${par("Fecha", UI.fecha(p.fecha))}${par("Periodo", UI.esc(p.periodo))}${par("Método", UI.esc(p.metodo))}${par("Adeudo restante", UI.mxn.format(restante))}</div>
      <div class="modal-footer"><button class="btn btn-light" id="cVolver">Volver</button><button class="btn btn-azul" id="cOk">Confirmar pago</button></div>`);
    document.getElementById("cVolver").onclick = () => abrirPago(p.casaId, { importe: p.importe, fecha: p.fecha, periodo: p.periodo, metodo: p.metodo, obs: p.observaciones });
    document.getElementById("cOk").onclick = async (e) => {
      const b = e.currentTarget; b.disabled = true; b.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Guardando';
      try {
        await Servicios.registrarPago(p);
        UI.cerrarModal(); datos = await Servicios.getCasas(); pintar(); pintarNotificaciones();
        UI.toast(`Pago de ${UI.mxn.format(p.importe)} registrado para la casa ${c.numero}.`);
      } catch (err) { UI.toast(err.message, "danger"); b.disabled = false; b.textContent = "Confirmar pago"; }
    };
  }
  return { render };
})();
