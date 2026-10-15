/* Dashboard: renderiza indicadores, gráficas y listas desde Servicios. */
const Dashboard = (() => {
  let graficas = [];
  const pct = (v) => `${v >= 0 ? "▲" : "▼"} ${Math.abs(v).toFixed(1)}% vs mes anterior`;

  function kpi(ico, tono, valor, etq, extra = "") {
    return `<div class="col-12 col-sm-6 col-xl"><div class="tarjeta kpi"><div class="kpi-ico t-${tono}"><i class="bi bi-${ico}"></i></div>
      <div><div class="kpi-valor">${UI.mxn.format(valor)}</div><div class="kpi-etq">${etq}</div>${extra}</div></div></div>`;
  }

  async function render(vista) {
    vista.innerHTML = UI.skeleton();
    const r = await Servicios.getResumenDashboard();
    const varIng = r.varIngresos === null ? "" : `<div class="kpi-var c-${r.varIngresos >= 0 ? "verde" : "rojo"}">${pct(r.varIngresos)}</div>`;
    const varGas = r.varGastos === null ? "" : `<div class="kpi-var c-${r.varGastos <= 0 ? "verde" : "naranja"}">${pct(r.varGastos)}</div>`;
    const alertas = [];
    if (r.vencidas) alertas.push(["rojo", "exclamation-octagon-fill", `${r.vencidas} casas tienen adeudos vencidos.`]);
    r.compromisosVencidos.forEach((c) => alertas.push(["rojo", "calendar-x-fill", `Compromiso vencido: ${c.nombre} (${UI.mxn.format(c.importe)}).`]));
    const prox = r.compromisosProximos.find((c) => c.estado === "Próximo a vencer");
    if (prox) alertas.push(["naranja", "clock-fill", `Próximo a vencer: ${prox.nombre} el ${UI.fecha(prox.fecha)}.`]);

    vista.innerHTML = `
      <div class="d-flex flex-column gap-2 mb-3">${alertas.map(([t, i, m]) => `<div class="alerta-fila t-${t}"><i class="bi bi-${i}"></i>${UI.esc(m)}</div>`).join("")}</div>
      <div class="row g-3 mb-3">
        ${kpi("wallet2", "azul", r.saldo, "Saldo disponible")}
        ${kpi("arrow-down-circle", "verde", r.ingresosMes, "Ingresos del mes", varIng)}
        ${kpi("arrow-up-circle", "rojo", r.gastosMes, "Gastos del mes", varGas)}
        ${kpi("hourglass-split", "naranja", r.pendientes, "Pagos pendientes")}
        ${kpi("calendar2-event", "naranja", r.proximos, "Próximos gastos")}
      </div>
      <div class="d-flex flex-wrap gap-2 mb-3">
        <a class="btn btn-azul" href="${App.url('ingresos')}"><i class="bi bi-plus-circle me-1"></i>Registrar ingreso</a>
        <a class="btn btn-outline-primary" href="${App.url('gastos')}"><i class="bi bi-receipt me-1"></i>Registrar gasto</a>
        <a class="btn btn-outline-secondary" href="${App.url('casas')}"><i class="bi bi-house-exclamation me-1"></i>Ver pagos pendientes</a>
      </div>
      <div class="row g-3 mb-3">
        <div class="col-12 col-lg-8"><section class="tarjeta"><h2>Ingresos frente a gastos (6 meses)</h2><div class="grafica"><canvas id="gIngGas" role="img" aria-label="Gráfica de ingresos y gastos"></canvas></div></section></div>
        <div class="col-12 col-md-6 col-lg-4"><section class="tarjeta"><h2>Gastos del mes por categoría</h2><div class="grafica-dona"><canvas id="gCat" role="img" aria-label="Distribución de gastos"></canvas></div></section></div>
      </div>
      <div class="row g-3">
        <div class="col-12 col-xl-7"><section class="tarjeta"><h2>Actividad reciente</h2><div class="table-responsive">
          <table class="table tabla align-middle"><thead><tr><th>Fecha</th><th>Descripción</th><th>Tipo</th><th class="text-end">Importe</th><th>Estado</th></tr></thead><tbody>
          ${r.recientes.map((m) => `<tr><td>${UI.fecha(m.fecha)}</td><td>${UI.esc(m.concepto)}${m.casaId ? ` <small class="text-muted">· ${m.casaId}</small>` : ""}</td><td>${UI.etiqueta(m.tipo)}</td>
          <td class="text-end fw-semibold c-${m.tipo === "Ingreso" ? "verde" : "rojo"}">${m.tipo === "Ingreso" ? "+" : "−"}${UI.mxn.format(m.importe)}</td><td>${UI.etiqueta(m.estado)}</td></tr>`).join("")}
          </tbody></table></div></section></div>
        <div class="col-12 col-md-5 col-xl-2"><section class="tarjeta"><h2>Casas al corriente</h2><div class="grafica-dona"><canvas id="gPago" role="img" aria-label="${r.pctPagado}% de casas al corriente"></canvas>
          <div class="dona-centro"><strong>${r.pctPagado}%</strong><small class="text-muted">${r.alCorriente} de ${r.totalCasas}</small></div></div></section></div>
        <div class="col-12 col-md-7 col-xl-3"><section class="tarjeta"><h2>Próximos compromisos</h2><ul class="list-unstyled mb-0 d-grid gap-3">
          ${r.compromisosProximos.map((c) => `<li class="d-flex justify-content-between gap-2"><div><div class="fw-semibold">${UI.esc(c.nombre)}</div><small class="text-muted">${UI.fecha(c.fecha)}</small></div><div class="text-end"><div>${UI.mxn.format(c.importe)}</div>${UI.etiqueta(c.estado)}</div></li>`).join("")}
          </ul></section></div>
      </div>`;
    dibujar(r);
  }

  function dibujar(r) {
    graficas.forEach((g) => g.destroy());
    const mes = (k) => new Date(k + "-15T12:00:00").toLocaleDateString("es-MX", { month: "short" });
    const cats = Object.entries(r.gastosCat);
    const tonos = ["#12294d", "#1f5fbf", "#6c9be0", "#1b8a5a", "#c76a00", "#c62f3b"];
    graficas = [
      new Chart(document.getElementById("gIngGas"), { type: "bar", data: { labels: r.serie.meses.map(mes), datasets: [
        { label: "Ingresos", data: r.serie.ingresos, backgroundColor: "#1b8a5a", borderRadius: 4 },
        { label: "Gastos", data: r.serie.gastos, backgroundColor: "#c62f3b", borderRadius: 4 }] },
        options: { responsive: true, maintainAspectRatio: false, scales: { y: { ticks: { callback: (v) => "$" + v / 1000 + "k" } } }, plugins: { tooltip: { callbacks: { label: (c) => `${c.dataset.label}: ${UI.mxn.format(c.raw)}` } } } } }),
      new Chart(document.getElementById("gCat"), { type: "doughnut", data: { labels: cats.map((c) => c[0]), datasets: [{ data: cats.map((c) => c[1]), backgroundColor: tonos, borderWidth: 2 }] },
        options: { responsive: true, maintainAspectRatio: false, cutout: "62%", plugins: { legend: { position: "bottom", labels: { boxWidth: 10, font: { size: 11 } } }, tooltip: { callbacks: { label: (c) => `${c.label}: ${UI.mxn.format(c.raw)}` } } } } }),
      new Chart(document.getElementById("gPago"), { type: "doughnut", data: { labels: ["Al corriente", "Con pendiente"], datasets: [{ data: [r.alCorriente, r.totalCasas - r.alCorriente], backgroundColor: ["#1b8a5a", "#e2e6ee"], borderWidth: 0 }] },
        options: { responsive: true, maintainAspectRatio: false, cutout: "75%", plugins: { legend: { display: false } } } })
    ];
  }
  return { render };
})();
