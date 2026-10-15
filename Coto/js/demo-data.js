/* Datos ficticios en memoria. Campos consistentes con la futura hoja de cálculo:
   Casa, Movimiento (ingresos y egresos), Compromiso. Sin persistencia. */
(function () {
  const HOY = new Date();
  const iso = (d) => d.toISOString().slice(0, 10);
  const mesOffset = (m, dia) => new Date(HOY.getFullYear(), HOY.getMonth() - m, Math.min(dia, m === 0 ? HOY.getDate() : 28), 12);
  const enDias = (n) => iso(new Date(HOY.getFullYear(), HOY.getMonth(), HOY.getDate() + n, 12));

  const CUOTA = 1200, TOTAL_CASAS = 30, SALDO_INICIAL = 120000;
  const apellidos = ["García","Hernández","López","Martínez","González","Ramírez","Torres","Flores","Rivera","Morales","Cruz","Ortiz","Reyes","Mendoza","Vargas"];
  const nombres = ["Ana","Luis","María","Jorge","Laura","Carlos","Elena","Raúl","Patricia","Miguel"];
  const estados = ["Al corriente","Al corriente","Al corriente","Al corriente","Al corriente","Al corriente","Pendiente","Pago parcial","Vencido","Vencido"];

  const casas = Array.from({ length: TOTAL_CASAS }, (_, i) => {
    const estado = estados[i % 10];
    const saldo = { "Al corriente": 0, "Pendiente": CUOTA, "Pago parcial": CUOTA / 2, "Vencido": CUOTA * (2 + (i % 3)) }[estado];
    return { id: "C" + String(i + 1).padStart(2, "0"), numero: i + 1, propietario: `${nombres[i % 10]} ${apellidos[i % 15]}`,
      cuota: CUOTA, ultimoPago: iso(mesOffset(estado === "Vencido" ? 2 : estado === "Al corriente" ? 0 : 1, 5)),
      periodoPagado: estado === "Al corriente" ? "Mes actual" : "Mes anterior", saldoPendiente: saldo, estado };
  });

  const movimientos = [];
  let n = 1;
  const mov = (fecha, tipo, concepto, categoria, casaId, importe, estado = "Completado") =>
    movimientos.push({ id: "M" + String(n).padStart(3, "0"), fecha: iso(fecha), tipo, concepto, categoria, casaId, importe, referencia: "REF-" + (1000 + n++), estado });

  casas.forEach((c, i) => {
    if (c.estado === "Al corriente") mov(mesOffset(0, 1 + (i % 7)), "Ingreso", "Cuota de mantenimiento", "Cuotas", c.id, CUOTA);
    if (c.estado === "Pago parcial") mov(mesOffset(0, 4), "Ingreso", "Abono de cuota", "Cuotas", c.id, CUOTA / 2);
  });
  [26, 27, 25, 28, 26].forEach((pagadas, k) => mov(mesOffset(k + 1, 10), "Ingreso", `Cuotas de mantenimiento (${pagadas} casas)`, "Cuotas", null, pagadas * CUOTA));
  mov(mesOffset(2, 15), "Ingreso", "Cuota extraordinaria portón", "Extraordinarias", null, 9000);

  const CATEGORIAS = ["Jardinería", "Limpieza", "Seguridad", "Electricidad", "Agua", "Reparaciones", "Pintura", "Mantenimiento de áreas comunes", "Administración", "Otros gastos"];
  const egreso = (fecha, concepto, cat, imp, prov, estado = "Completado") => {
    mov(fecha, "Egreso", concepto, cat, null, imp, estado);
    Object.assign(movimientos[movimientos.length - 1], { descripcion: concepto, proveedor: prov,
      metodoPago: cat === "Agua" || cat === "Electricidad" ? "Domiciliación" : "Transferencia", comprobante: "FAC-" + (2000 + n), observaciones: "" });
  };
  const base = [["Seguridad", "Vigilancia mensual", 14000, "Vigilancia Escudo"], ["Jardinería", "Mantenimiento de jardines", 3800, "Verde Vivo"], ["Limpieza", "Limpieza de áreas comunes", 4600, "Limpio Total"],
    ["Electricidad", "Consumo de áreas comunes", 2900, "CFE"], ["Agua", "Servicio de agua", 1800, "Organismo operador de agua"], ["Reparaciones", "Reparaciones menores", 1500, "Mantenimiento Rápido"], ["Administración", "Honorarios de administración", 2500, "Administración Integral"]];
  for (let m = 0; m < 6; m++) base.forEach(([cat, con, imp, prov], j) =>
    egreso(mesOffset(m, 2 + j), con, cat, Math.round(imp * (1 + ((m + j) % 4) * 0.05)), prov, m === 0 && j === 5 ? "Pendiente" : "Completado"));
  egreso(mesOffset(1, 18), "Pintura de bardas perimetrales", "Pintura", 9800, "Pinturas del Norte");
  egreso(mesOffset(2, 12), "Poda de áreas comunes", "Mantenimiento de áreas comunes", 3200, "Verde Vivo");
  egreso(mesOffset(3, 20), "Compra de extintores", "Otros gastos", 2100, "Seguridad Industrial");

  const compromisos = [
    { id: "P01", descripcion: "Pago mensual del servicio de vigilancia", nombre: "Pago de seguridad", categoria: "Seguridad", proveedor: "Vigilancia Escudo", fecha: enDias(-3), importe: 14000, prioridad: "Urgente", estado: "Vencido" },
    { id: "P02", descripcion: "Cambio de luminarias en calle principal y andadores", nombre: "Reparación de luminarias", categoria: "Electricidad", proveedor: "Electro Servicios MX", fecha: enDias(4), importe: 6500, prioridad: "Alta", estado: "Próximo a vencer" },
    { id: "P03", descripcion: "Servicio de limpieza de áreas comunes", nombre: "Servicio de limpieza", categoria: "Limpieza", proveedor: "Limpio Total", fecha: enDias(9), importe: 4600, prioridad: "Media", estado: "Programado" },
    { id: "P04", descripcion: "Poda y riego de jardines y camellones", nombre: "Mantenimiento de jardines", categoria: "Jardinería", proveedor: "Verde Vivo", fecha: enDias(15), importe: 3800, prioridad: "Media", estado: "Programado" },
    { id: "P05", descripcion: "Pintura de caseta, bardas y andadores", nombre: "Pintura de áreas comunes", categoria: "Pintura", proveedor: "Pinturas del Norte", fecha: enDias(22), importe: 18000, prioridad: "Baja", estado: "Programado" },
    { id: "P06", descripcion: "Cambio de bomba de la cisterna", nombre: "Reparación de bomba de agua", categoria: "Reparaciones", proveedor: "Hidro Técnica", fecha: enDias(45), importe: 7200, prioridad: "Alta", estado: "Programado" },
    { id: "P07", descripcion: "Fumigación general del coto", nombre: "Fumigación", categoria: "Otros gastos", proveedor: "Plagas Cero", fecha: enDias(-10), importe: 2500, prioridad: "Baja", estado: "Pagado" }
  ];

  window.DemoData = { CATEGORIAS, HOY, CUOTA, TOTAL_CASAS, SALDO_INICIAL, casas, movimientos, compromisos };
})();
