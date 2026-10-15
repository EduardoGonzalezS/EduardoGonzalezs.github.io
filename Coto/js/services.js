/* Capa de servicios. Hoy opera sobre DemoData; en la fase 2 cada función
   se sustituirá por una llamada a Google Apps Script con la misma firma. */
const Servicios = (() => {
  const espera = (ms = 400) => new Promise((r) => setTimeout(r, ms));
  const copia = (x) => JSON.parse(JSON.stringify(x));
  const D = () => window.DemoData;
  const mesDe = (offset) => { const h = D().HOY; const d = new Date(h.getFullYear(), h.getMonth() - offset, 15); return d.toISOString().slice(0, 7); };
  const suma = (lista) => lista.reduce((a, x) => a + x.importe, 0);
  const variacion = (act, ant) => (ant > 0 ? ((act - ant) / ant) * 100 : null);

  async function getCasas() { await espera(150); return copia(D().casas); }
  async function getMovimientos() { await espera(150); return copia(D().movimientos); }
  const hoy12 = () => { const h = D().HOY; return new Date(h.getFullYear(), h.getMonth(), h.getDate(), 12); };
  const hoyIso = () => { const h = D().HOY; return `${h.getFullYear()}-${String(h.getMonth() + 1).padStart(2, "0")}-${String(h.getDate()).padStart(2, "0")}`; };
  const abierto = (c) => !["Pagado", "Cancelado"].includes(c.estado);
  /** El estado de un compromiso abierto se deriva de su fecha. */
  const conEstado = (c) => { if (!abierto(c)) return c; const dias = Math.round((new Date(c.fecha + "T12:00:00") - hoy12()) / 86400000); return { ...c, estado: dias < 0 ? "Vencido" : dias <= 7 ? "Próximo a vencer" : "Programado" }; };
  const siguienteNumeroMov = () => Math.max(0, ...D().movimientos.map((m) => Number(m.id.slice(1)))) + 1;
  const saldoActual = () => { const ok = D().movimientos.filter((m) => m.estado === "Completado"); return D().SALDO_INICIAL + suma(ok.filter((m) => m.tipo === "Ingreso")) - suma(ok.filter((m) => m.tipo === "Egreso")); };
  const CATEGORIAS = D().CATEGORIAS;

  async function getCompromisos() { await espera(150); return copia(D().compromisos.map(conEstado)); }
  async function getSaldo() { return saldoActual(); }

  /* ----- Gastos (movimientos de tipo Egreso) ----- */
  async function getGastos() { await espera(150); return copia(D().movimientos.filter((m) => m.tipo === "Egreso")); }
  function insertarGasto(g) {
    if (!String(g.concepto || "").trim() || !g.categoria || !String(g.proveedor || "").trim() || !g.fecha) throw new Error("Faltan campos obligatorios.");
    if (!(Number(g.importe) > 0)) throw new Error("El importe debe ser mayor a cero.");
    const num = siguienteNumeroMov();
    const m = { id: "M" + String(num).padStart(3, "0"), fecha: g.fecha, tipo: "Egreso", concepto: g.concepto.trim(), categoria: g.categoria, casaId: null, importe: Number(g.importe),
      referencia: "REF-" + (1000 + num), estado: g.estado || "Completado", descripcion: g.descripcion || "", proveedor: g.proveedor.trim(), metodoPago: g.metodo, comprobante: g.comprobante || "", observaciones: g.observaciones || "" };
    D().movimientos.push(m); return m;
  }
  async function registrarGasto(g) { await espera(600); return copia(insertarGasto(g)); }
  async function marcarGastoCompletado(id) { await espera(400); const m = D().movimientos.find((x) => x.id === id && x.tipo === "Egreso"); if (!m) throw new Error("El gasto no existe."); m.estado = "Completado"; return copia(m); }
  async function eliminarGasto(id) { await espera(400); const i = D().movimientos.findIndex((x) => x.id === id && x.tipo === "Egreso"); if (i < 0) throw new Error("El gasto no existe."); D().movimientos.splice(i, 1); }

  /* ----- Compromisos (próximos gastos) ----- */
  async function getResumenProximos() {
    await espera(200);
    const lim = new Date(hoy12().getTime() + 30 * 86400000), todos = D().compromisos.map(conEstado).filter(abierto);
    const en30 = todos.filter((c) => new Date(c.fecha + "T12:00:00") <= lim), venc = todos.filter((c) => c.estado === "Vencido"), saldo = saldoActual();
    return { saldo, requerido30: suma(en30), proyectado: saldo - suma(en30), vencidosN: venc.length, vencidosImporte: suma(venc), proximosN: todos.filter((c) => c.estado === "Próximo a vencer").length };
  }
  function validarCompromiso(c) {
    if (!String(c.nombre || "").trim() || !c.categoria || !c.fecha || !c.prioridad) throw new Error("Faltan campos obligatorios.");
    if (!(Number(c.importe) > 0)) throw new Error("El importe debe ser mayor a cero.");
  }
  async function registrarCompromiso(c) {
    await espera(500); validarCompromiso(c);
    const num = Math.max(0, ...D().compromisos.map((x) => Number(x.id.slice(1)))) + 1;
    const nuevo = { id: "P" + String(num).padStart(2, "0"), nombre: c.nombre.trim(), descripcion: c.descripcion || "", categoria: c.categoria, proveedor: c.proveedor || "", fecha: c.fecha, importe: Number(c.importe), prioridad: c.prioridad, estado: "Programado" };
    D().compromisos.push(nuevo); return copia(nuevo);
  }
  async function actualizarCompromiso(id, c) {
    await espera(500); validarCompromiso(c);
    const x = D().compromisos.find((k) => k.id === id); if (!x || !abierto(x)) throw new Error("El compromiso no se puede editar.");
    Object.assign(x, { nombre: c.nombre.trim(), descripcion: c.descripcion || "", categoria: c.categoria, proveedor: c.proveedor || "", fecha: c.fecha, importe: Number(c.importe), prioridad: c.prioridad }); return copia(x);
  }
  async function marcarCompromisoPagado(id) {
    await espera(500);
    const x = D().compromisos.find((k) => k.id === id); if (!x || !abierto(x)) throw new Error("El compromiso ya no está pendiente.");
    x.estado = "Pagado";
    insertarGasto({ fecha: hoyIso(), concepto: x.nombre, categoria: x.categoria, importe: x.importe, proveedor: x.proveedor || "Sin proveedor", metodo: "Transferencia", estado: "Completado", descripcion: x.descripcion });
  }
  async function cancelarCompromiso(id) {
    await espera(400);
    const x = D().compromisos.find((k) => k.id === id); if (!x || !abierto(x)) throw new Error("El compromiso ya no está pendiente.");
    x.estado = "Cancelado";
  }

  /** Calcula todos los indicadores del dashboard a partir de los datos. */
  async function getResumenDashboard() {
    await espera();
    const { movimientos, casas, SALDO_INICIAL } = D();
    const compromisos = D().compromisos.map(conEstado);
    const ok = movimientos.filter((m) => m.estado === "Completado");
    const total = (tipo, mes) => suma(ok.filter((m) => m.tipo === tipo && (!mes || m.fecha.slice(0, 7) === mes)));
    const meses = [5, 4, 3, 2, 1, 0].map(mesDe), actual = mesDe(0), previo = mesDe(1);
    const gastosCat = {};
    ok.filter((m) => m.tipo === "Egreso" && m.fecha.slice(0, 7) === actual).forEach((m) => (gastosCat[m.categoria] = (gastosCat[m.categoria] || 0) + m.importe));
    const abiertos = compromisos.filter((c) => !["Pagado", "Cancelado"].includes(c.estado));
    const alCorriente = casas.filter((c) => c.estado === "Al corriente").length;
    return copia({
      saldo: SALDO_INICIAL + total("Ingreso") - total("Egreso"),
      ingresosMes: total("Ingreso", actual), gastosMes: total("Egreso", actual),
      varIngresos: variacion(total("Ingreso", actual), total("Ingreso", previo)), varGastos: variacion(total("Egreso", actual), total("Egreso", previo)),
      pendientes: casas.reduce((a, c) => a + c.saldoPendiente, 0), proximos: suma(abiertos),
      serie: { meses, ingresos: meses.map((m) => total("Ingreso", m)), gastos: meses.map((m) => total("Egreso", m)) },
      gastosCat, totalCasas: casas.length, alCorriente, pctPagado: Math.round((alCorriente / casas.length) * 100),
      vencidas: casas.filter((c) => c.estado === "Vencido").length,
      compromisosVencidos: compromisos.filter((c) => c.estado === "Vencido"),
      compromisosProximos: abiertos.sort((a, b) => a.fecha.localeCompare(b.fecha)).slice(0, 5),
      recientes: [...movimientos].sort((a, b) => b.fecha.localeCompare(a.fecha) || b.id.localeCompare(a.id)).slice(0, 8)
    });
  }
  /** Pagos (ingresos) registrados para una casa, del más reciente al más antiguo. */
  async function getPagosCasa(casaId) {
    await espera(200);
    return copia(D().movimientos.filter((m) => m.casaId === casaId && m.tipo === "Ingreso").sort((a, b) => b.fecha.localeCompare(a.fecha)));
  }

  /** Registra un pago: actualiza la casa y crea el movimiento de ingreso. */
  async function registrarPago(p) {
    await espera(600);
    const casa = D().casas.find((c) => c.id === p.casaId);
    const imp = Number(p.importe);
    if (!casa) throw new Error("La casa seleccionada no existe.");
    if (!(imp > 0)) throw new Error("El importe debe ser mayor a cero.");
    if (imp > casa.saldoPendiente) throw new Error("El importe supera el adeudo de la casa.");
    casa.saldoPendiente -= imp;
    casa.ultimoPago = p.fecha;
    casa.periodoPagado = p.periodo;
    casa.estado = casa.saldoPendiente === 0 ? "Al corriente" : casa.saldoPendiente >= casa.cuota * 2 ? "Vencido" : "Pago parcial";
    const lista = D().movimientos, num = siguienteNumeroMov();
    lista.push({ id: "M" + String(num).padStart(3, "0"), fecha: p.fecha, tipo: "Ingreso", concepto: "Cuota de mantenimiento", categoria: "Cuotas",
      casaId: casa.id, importe: imp, referencia: "REF-" + (1000 + num), estado: "Completado", metodoPago: p.metodo, observaciones: p.observaciones || "" });
    return copia(casa);
  }
  return { CATEGORIAS, getCasas, getMovimientos, getCompromisos, getResumenDashboard, getPagosCasa, registrarPago, getSaldo, getGastos, registrarGasto, marcarGastoCompletado, eliminarGasto,
    getResumenProximos, registrarCompromiso, actualizarCompromiso, marcarCompromisoPagado, cancelarCompromiso };
})();
