// ── Mapas de categorías ──────────────────────────────────────────────────────

const BADGE_RECETA = {
  galletas: 'badge-galletas', pasteles: 'badge-pasteles', pan: 'badge-pan',
  roles: 'badge-roles', brownies: 'badge-brownies', panques: 'badge-pasteles',
  otros: 'badge-neutral'
};

const BADGE_ING = {
  harinas: 'badge-neutral', lacteos: 'badge-info', endulzantes: 'badge-exito',
  huevos: 'badge-alerta', esencias: 'badge-peligro', extras: 'badge-neutral',
  chocolates: 'badge-brownies', varios: 'badge-neutral'
};

const LABEL_ING = {
  harinas: 'Harinas', lacteos: 'Lácteos', endulzantes: 'Endulzantes',
  huevos: 'Huevos', esencias: 'Esencias', extras: 'Extras',
  chocolates: 'Chocolates', varios: 'Varios'
};

const LABEL_RECETA = {
  galletas: 'Galletas', pasteles: 'Pasteles', pan: 'Pan', roles: 'Roles',
  brownies: 'Brownies', panques: 'Panqués', otros: 'Otros'
};

const LABEL_TEMPORADA = {
  todo: 'Todo el año', navidad: 'Navidad', 'san-valentin': 'San Valentín',
  'dia-madres': 'Día de Madres', halloween: 'Halloween', primavera: 'Primavera'
};

function stockClass(actual, minimo) {
  actual = Number(actual) || 0;
  minimo = Number(minimo) || 0;
  if (!minimo || actual >= minimo) return 'stock-bueno';
  if (actual >= minimo * 0.5) return 'stock-bajo';
  return 'stock-agotado';
}

// ── Recetas ──────────────────────────────────────────────────────────────────

function renderTarjetasRecetas(recetas) {
  if (!recetas.length) {
    return '<p style="color:var(--texto-muted);padding:var(--sp-4);">No hay recetas registradas. <a href="receta-nueva.html">Crear primera receta →</a></p>';
  }
  return recetas.map(r => {
    const costo = Number(r.costo_total || 0);
    const venta = Number(r.precio_venta || 0);
    const margen = venta > 0 ? Math.round((venta - costo) / venta * 100) : 0;
    const badge = BADGE_RECETA[r.categoria] || 'badge-neutral';
    const catLabel = LABEL_RECETA[r.categoria] || r.categoria || 'Otro';
    const tempLabel = LABEL_TEMPORADA[r.temporada] || '';
    const tempBadge = r.temporada && r.temporada !== 'todo'
      ? `<span class="badge badge-info">${tempLabel}</span>` : '';
    return `
      <a href="receta-detalle.html?id=${encodeURIComponent(r.id)}" class="tarjeta-receta">
        <div class="tarjeta-receta__imagen-placeholder">${r.emoji || '🍰'}</div>
        <div class="tarjeta-receta__cuerpo">
          <div class="tarjeta-receta__meta">
            <span class="badge ${badge}">${catLabel}</span>
            <span class="badge badge-neutral">${r.rendimiento} piezas</span>
            ${tempBadge}
          </div>
          <h3 class="tarjeta-receta__nombre">${r.nombre}</h3>
          <div class="tarjeta-receta__costos">
            <div class="tarjeta-receta__costo-item">
              <span class="tarjeta-receta__costo-label">Costo lote</span>
              <span class="tarjeta-receta__costo-valor">${fmtMoneda(costo)}</span>
            </div>
            <div class="tarjeta-receta__costo-item">
              <span class="tarjeta-receta__costo-label">Precio venta</span>
              <span class="tarjeta-receta__costo-valor precio-venta">${fmtMoneda(venta)}</span>
            </div>
          </div>
        </div>
        <div class="tarjeta-receta__footer">
          <span class="tarjeta-receta__margen">✅ ${margen}% margen</span>
          <span class="tarjeta-receta__link">Ver receta →</span>
        </div>
      </a>`;
  }).join('');
}

// ── Ingredientes ─────────────────────────────────────────────────────────────

function renderTablaIngredientes(ingredientes) {
  if (!ingredientes.length) {
    return '<tr><td colspan="8" style="text-align:center;color:var(--texto-muted);padding:var(--sp-6);">Sin ingredientes registrados.</td></tr>';
  }
  return ingredientes.map(ing => {
    const sc = stockClass(ing.stock_actual, ing.stock_minimo);
    const badge = BADGE_ING[ing.categoria] || 'badge-neutral';
    const catLabel = LABEL_ING[ing.categoria] || ing.categoria || '—';
    const btnComprar = sc !== 'stock-bueno'
      ? `<a href="ingrediente-nuevo.html" class="btn btn-sm btn-secundario" title="Registrar compra">🛒</a>` : '';
    const accion = `
      <div style="display:flex;gap:4px;flex-wrap:wrap;">
        <a href="ingrediente-detalle.html?nombre=${encodeURIComponent(ing.nombre)}" class="btn btn-sm btn-ghost" title="Ver historial">📊</a>
        <a href="producto-nuevo.html?id=${encodeURIComponent(ing.id)}" class="btn btn-sm btn-secundario" title="Editar">✏️</a>
        <button class="btn btn-sm btn-peligro" onclick="eliminarIngrediente('${ing.id}','${ing.nombre.replace(/'/g, "\\'")}')">🗑️</button>
        ${btnComprar}
      </div>`;
    return `
      <tr>
        <td><a href="ingrediente-detalle.html?nombre=${encodeURIComponent(ing.nombre)}"><strong>${ing.nombre}</strong></a></td>
        <td><span class="badge ${badge}">${catLabel}</span></td>
        <td class="col-muted">${ing.unidad}</td>
        <td class="col-num">${fmtMoneda(ing.precio_actual)} / ${ing.unidad}</td>
        <td class="col-num col-muted">${fmtMoneda(ing.precio_por_base)} / g</td>
        <td>${ing.proveedor || '—'}</td>
        <td>
          <div class="indicador-stock ${sc}">
            <span class="indicador-stock__punto"></span> ${ing.stock_actual} ${ing.unidad}
          </div>
        </td>
        <td class="no-print">${accion}</td>
      </tr>`;
  }).join('');
}

// ── Stock bajo ───────────────────────────────────────────────────────────────

function getStockBajo(ingredientes) {
  return ingredientes.filter(i => stockClass(i.stock_actual, i.stock_minimo) !== 'stock-bueno');
}

function renderAlertaBanner(bajos) {
  if (!bajos.length) return '';
  const nombres = bajos.map(i => `${i.nombre} (${i.stock_actual} restantes)`).join(', ');
  return `
    <div class="alerta alerta-alerta no-print">
      <span class="alerta__icono">⚠️</span>
      <div class="alerta__cuerpo">
        <div class="alerta__titulo">${bajos.length} ingrediente${bajos.length > 1 ? 's' : ''} con stock bajo</div>
        <div class="alerta__texto">${nombres}.
          <a href="lista-compras.html" style="font-weight:700;margin-left:6px;">Ver lista de compras →</a>
        </div>
      </div>
    </div>`;
}

function renderTablaStockBajo(bajos) {
  if (!bajos.length) {
    return '<tr><td colspan="5" style="text-align:center;color:var(--texto-muted);padding:var(--sp-4);">✅ Todos los ingredientes tienen stock suficiente.</td></tr>';
  }
  return bajos.map(ing => {
    const sc = stockClass(ing.stock_actual, ing.stock_minimo);
    const badgeClass = sc === 'stock-agotado' ? 'badge-peligro' : 'badge-alerta';
    const estado = sc === 'stock-agotado' ? 'Muy bajo' : 'Bajo';
    return `
      <tr>
        <td><strong>${ing.nombre}</strong></td>
        <td>${ing.stock_actual} ${ing.unidad}</td>
        <td>${ing.stock_minimo ? ing.stock_minimo + ' ' + ing.unidad : '—'}</td>
        <td><span class="badge ${badgeClass}">${estado}</span></td>
        <td class="no-print">
          <a href="ingrediente-nuevo.html" class="btn btn-sm btn-secundario">Registrar compra</a>
        </td>
      </tr>`;
  }).join('');
}

// ── Lista de compras ─────────────────────────────────────────────────────────

function renderListaCompras(ingredientes) {
  const urgentes = ingredientes.filter(i => {
    const sc = stockClass(i.stock_actual, i.stock_minimo);
    return sc === 'stock-agotado';
  });
  const observacion = ingredientes.filter(i => {
    const sc = stockClass(i.stock_actual, i.stock_minimo);
    return sc === 'stock-bajo';
  });

  let totalEst = 0;
  const rowsUrgentes = urgentes.map(ing => {
    const falta = Math.max(0, Number(ing.stock_minimo || 0) - Number(ing.stock_actual || 0));
    const cantSugerida = falta > 0 ? falta : Number(ing.stock_minimo || 0);
    const totalFila = (cantSugerida / (ing.unidad === 'g' ? 1000 : ing.unidad === 'ml' ? 1000 : 1)) * Number(ing.precio_actual || 0);
    totalEst += totalFila;
    const sc = stockClass(ing.stock_actual, ing.stock_minimo);
    const badgeClass = sc === 'stock-agotado' ? 'badge-peligro' : 'badge-alerta';
    const estado = sc === 'stock-agotado' ? 'Muy bajo' : 'Bajo';
    const cantLabel = ing.unidad === 'g' ? (cantSugerida >= 1000 ? (cantSugerida / 1000) + ' kg' : cantSugerida + ' g')
      : ing.unidad === 'ml' ? (cantSugerida >= 1000 ? (cantSugerida / 1000) + ' L' : cantSugerida + ' ml')
      : cantSugerida + ' ' + ing.unidad;
    return `
      <tr>
        <td class="no-print" style="text-align:center;"><input type="checkbox" class="tarjeta-compra__check"></td>
        <td><strong>${ing.nombre}</strong><br><small style="color:var(--texto-muted);">${LABEL_ING[ing.categoria] || ing.categoria} — ${ing.unidad}</small></td>
        <td class="col-num" style="color:var(--peligro);">${ing.stock_actual} ${ing.unidad}</td>
        <td class="col-num col-muted">${ing.stock_minimo || '—'}</td>
        <td class="col-num"><strong>${cantLabel}</strong></td>
        <td>${ing.proveedor || '—'}</td>
        <td class="col-num">${fmtMoneda(ing.precio_actual)} / ${ing.unidad}</td>
        <td class="col-num"><strong>${fmtMoneda(totalFila)}</strong></td>
        <td><span class="badge ${badgeClass}">${estado}</span></td>
      </tr>`;
  }).join('');

  const rowsFila = urgentes.length
    ? `${rowsUrgentes}
      <tr class="fila-total">
        <td class="no-print"></td>
        <td colspan="6"><strong>TOTAL ESTIMADO DE COMPRA</strong></td>
        <td class="col-num" style="font-size:var(--tx-lg);"><strong>${fmtMoneda(totalEst)}</strong></td>
        <td></td>
      </tr>`
    : '<tr><td colspan="9" style="text-align:center;color:var(--texto-muted);padding:var(--sp-6);">✅ Ningún ingrediente agotado.</td></tr>';

  const rowsObs = observacion.length
    ? observacion.map(ing => `
        <tr>
          <td><strong>${ing.nombre}</strong></td>
          <td class="col-num">${ing.stock_actual} ${ing.unidad}</td>
          <td class="col-num col-muted">${ing.stock_minimo || '—'}</td>
          <td>${ing.proveedor || '—'}</td>
          <td><span class="badge badge-alerta">Bajo</span></td>
        </tr>`).join('')
    : '<tr><td colspan="5" style="text-align:center;color:var(--texto-muted);">Ningún ingrediente en observación.</td></tr>';

  return { urgentes, observacion, rowsUrgentes: rowsFila, rowsObs, totalEst };
}

// ── Historial de compras ──────────────────────────────────────────────────────

function renderHistorialCompras(compras, detalle, limit) {
  if (!compras.length) {
    return '<p style="color:var(--texto-muted);padding:var(--sp-4);">No hay compras registradas aún.</p>';
  }
  const sorted = [...compras].sort((a, b) => Number(b.id) - Number(a.id));
  const visibles = (typeof limit === 'number' && limit > 0) ? sorted.slice(0, limit) : sorted;
  const detalleMap = {};
  detalle.forEach(d => {
    if (!detalleMap[d.compra_id]) detalleMap[d.compra_id] = [];
    detalleMap[d.compra_id].push(d);
  });

  return visibles.map((c, idx) => {
    const items = detalleMap[c.id] || [];
    const nProd = items.length;
    const total = items.reduce((s, i) => s + Number(i.subtotal || 0), 0);
    const recienteBadge = idx === 0
      ? `<span class="badge badge-exito" style="font-size:0.65rem;">Reciente</span>` : '';
    const filas = items.map(i => `
      <tr>
        <td><a href="ingrediente-detalle.html?nombre=${encodeURIComponent(i.ingrediente)}">${i.ingrediente}</a></td>
        <td class="col-num">${i.cantidad} ${i.unidad}</td>
        <td class="col-num">${fmtMoneda(i.precio_unitario)} / ${i.unidad}</td>
        <td class="col-num">${fmtMoneda(i.subtotal)}</td>
      </tr>`).join('');
    return `
      <details class="viaje-compra"${idx === 0 ? ' open' : ''}>
        <summary>
          <span class="viaje-compra__flecha">▶</span>
          <span class="viaje-compra__cabecera-info">
            <span class="viaje-compra__fecha">${formatFecha(c.fecha)}</span>
            <span class="viaje-compra__lugar">📍 ${c.lugar}</span>
            ${recienteBadge}
          </span>
          <span class="viaje-compra__meta">
            <span class="viaje-compra__nprod">${nProd} producto${nProd !== 1 ? 's' : ''}</span>
            <span class="viaje-compra__total">${fmtMoneda(total)}</span>
          </span>
        </summary>
        <div class="viaje-compra__detalle">
          <table class="tabla-viaje">
            <thead>
              <tr>
                <th>Ingrediente</th>
                <th class="col-num">Cantidad</th>
                <th class="col-num">Precio / u</th>
                <th class="col-num">Total</th>
              </tr>
            </thead>
            <tbody>
              ${filas}
              <tr class="fila-subtotal">
                <td colspan="3">Subtotal</td>
                <td class="col-num">${fmtMoneda(total)}</td>
              </tr>
            </tbody>
          </table>
          <div class="viaje-compra__acciones no-print">
            <a href="ingrediente-nuevo.html?id=${encodeURIComponent(c.id)}" class="btn btn-sm btn-ghost">✏️ Editar</a>
            <button type="button" class="btn btn-sm btn-peligro" onclick="eliminarCompra('${c.id}')">🗑️ Eliminar</button>
          </div>
        </div>
      </details>`;
  }).join('');
}

function renderResumenPorIngrediente(detalle) {
  const grouped = {};
  detalle.forEach(d => {
    if (!grouped[d.ingrediente]) grouped[d.ingrediente] = { compras: 0, total: 0, ultima: '', ultimoPrecio: 0, ultimaUnidad: '' };
    grouped[d.ingrediente].compras++;
    grouped[d.ingrediente].total += Number(d.subtotal || 0);
    if (!grouped[d.ingrediente].ultima || new Date(d.fecha) > new Date(grouped[d.ingrediente].ultima)) {
      grouped[d.ingrediente].ultima = d.fecha;
      grouped[d.ingrediente].ultimoPrecio = Number(d.precio_unitario || 0);
      grouped[d.ingrediente].ultimaUnidad = d.unidad;
    }
  });
  const sorted = Object.entries(grouped).sort((a, b) => b[1].compras - a[1].compras);
  if (!sorted.length) return '<tr><td colspan="6" style="text-align:center;color:var(--texto-muted);">Sin datos.</td></tr>';
  return sorted.map(([nombre, d]) => `
    <tr>
      <td><a href="ingrediente-detalle.html?nombre=${encodeURIComponent(nombre)}"><strong>${nombre}</strong></a></td>
      <td class="col-num">${d.compras}</td>
      <td class="col-num">—</td>
      <td class="col-num"><strong>${fmtMoneda(d.total)}</strong></td>
      <td class="col-num">${fmtMoneda(d.ultimoPrecio)} / ${d.ultimaUnidad}</td>
      <td class="col-num" style="color:var(--texto-muted);font-size:var(--tx-xs);">${formatFecha(d.ultima)}</td>
    </tr>`).join('');
}

// ── Proveedores ───────────────────────────────────────────────────────────────

function renderProveedores(proveedores) {
  if (!proveedores.length) {
    return '<p style="color:var(--texto-muted);">No hay proveedores registrados. <a href="proveedor-nuevo.html">Agregar uno →</a></p>';
  }
  return proveedores.map(p => {
    const badge = BADGE_ING[p.categoria] || 'badge-neutral';
    const catLabel = LABEL_ING[p.categoria] || p.categoria || '—';
    const tel    = p.telefono  ? _campo('Teléfono', p.telefono) : '';
    const web    = p.web       ? _campo('Sitio web', p.web) : '';
    const dir    = p.direccion ? _campo('Dirección', p.direccion) : '';
    const hor    = p.horario   ? _campo('Horario', p.horario) : '';
    const notas  = p.notas     ? _campo('Notas', p.notas) : '';
    return `
      <div class="tarjeta-proveedor">
        <div style="display:flex;align-items:center;gap:var(--sp-3);margin-bottom:var(--sp-3);">
          <span style="font-size:2rem;">${p.emoji || '🏪'}</span>
          <div>
            <h3 class="tarjeta-proveedor__nombre">${p.nombre}</h3>
            <span class="badge ${badge}">${catLabel}</span>
          </div>
        </div>
        <div class="tarjeta-proveedor__info">
          ${tel}${web}${dir}${hor}${notas}
        </div>
        <div style="margin-top:var(--sp-3);display:flex;gap:var(--sp-2);flex-wrap:wrap;">
          <a href="proveedor-nuevo.html?id=${encodeURIComponent(p.id)}" class="btn btn-sm btn-ghost">✏️ Editar</a>
          <a href="ingrediente-nuevo.html" class="btn btn-sm btn-secundario">Registrar compra</a>
        </div>
      </div>`;
  }).join('');
}

function _campo(label, valor) {
  return `<div class="tarjeta-proveedor__campo">
    <span class="tarjeta-proveedor__label">${label}</span>
    <span class="tarjeta-proveedor__valor">${valor}</span>
  </div>`;
}

// ── Planificación ─────────────────────────────────────────────────────────────

function renderPlanificacionFilas(recetas) {
  return recetas.map(r => {
    const costo = Number(r.costo_total || 0);
    const ingreso = Number(r.precio_venta || 0);
    const rend = Number(r.rendimiento || 0);
    return `
      <tr>
        <td>
          <strong>${r.emoji || '🍰'} ${r.nombre}</strong>
          <br><small style="color:var(--texto-muted);">${rend} pzas / lote — ${fmtMoneda(costo)} c/u</small>
        </td>
        <td class="col-num">
          <input type="number" name="lotes_${r.id}" value="0" min="0" max="10"
            data-costo="${costo}" data-ingreso="${ingreso}" data-rend="${rend}"
            style="width:60px;text-align:center;border:1.5px solid var(--borde);border-radius:var(--radio-xs);padding:0.3rem;font-size:var(--tx-sm);background:var(--fondo-input);"
            oninput="actualizarPlan(this)">
        </td>
        <td class="col-num plan-piezas">0</td>
        <td class="col-num plan-costo col-muted">—</td>
        <td class="col-num plan-ingreso col-muted">—</td>
      </tr>`;
  }).join('');
}

// ── Detalle de ingrediente ────────────────────────────────────────────────────

function renderInfoIngrediente(ing) {
  const sc = stockClass(ing.stock_actual, ing.stock_minimo);
  const badge = BADGE_ING[ing.categoria] || 'badge-neutral';
  const catLabel = LABEL_ING[ing.categoria] || ing.categoria || '—';
  return `
    <div class="info-receta__fila">
      <span class="info-receta__label">Categoría</span>
      <span class="info-receta__valor"><span class="badge ${badge}">${catLabel}</span></span>
    </div>
    <div class="info-receta__fila">
      <span class="info-receta__label">Unidad de medida</span>
      <span class="info-receta__valor">${ing.unidad}</span>
    </div>
    <div class="info-receta__fila">
      <span class="info-receta__label">Proveedor principal</span>
      <span class="info-receta__valor"><a href="proveedores.html">${ing.proveedor || '—'}</a></span>
    </div>
    <div class="info-receta__fila">
      <span class="info-receta__label">Precio actual</span>
      <span class="info-receta__valor" style="color:var(--primario);font-size:var(--tx-lg);">${fmtMoneda(ing.precio_actual)} / ${ing.unidad}</span>
    </div>
    <div class="info-receta__fila">
      <span class="info-receta__label">Precio por gramo</span>
      <span class="info-receta__valor">${fmtMoneda(ing.precio_por_base)} / g</span>
    </div>
    <div class="info-receta__fila">
      <span class="info-receta__label">Stock actual</span>
      <span class="info-receta__valor">
        <div class="indicador-stock ${sc}">
          <span class="indicador-stock__punto"></span> ${ing.stock_actual} ${ing.unidad}
        </div>
      </span>
    </div>
    <div class="info-receta__fila">
      <span class="info-receta__label">Stock mínimo</span>
      <span class="info-receta__valor">${ing.stock_minimo ? ing.stock_minimo + ' ' + ing.unidad : '—'}</span>
    </div>`;
}

function renderHistorialPrecios(historial) {
  const sorted = [...historial].sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
  if (!sorted.length) return '<tr><td colspan="5" style="text-align:center;color:var(--texto-muted);">Sin compras registradas.</td></tr>';
  return sorted.map((h, i) => {
    const actual = i === 0 ? `<span class="badge badge-exito" style="font-size:0.6rem;">Actual</span>` : '';
    return `
      <tr${i === 0 ? ' class="fila-destacada"' : ''}>
        <td>${i === 0 ? '<strong>' : ''}${formatFecha(h.fecha)}${i === 0 ? '</strong>' : ''} ${actual}</td>
        <td class="col-num">${i === 0 ? '<strong>' : ''}${fmtMoneda(h.precio_unitario)}${i === 0 ? '</strong>' : ''}</td>
        <td class="col-num">${h.cantidad} ${h.unidad}</td>
        <td class="col-num">${fmtMoneda(h.subtotal)}</td>
        <td>${h.lugar || '—'}</td>
      </tr>`;
  }).join('');
}

function renderGraficaPrecios(historial) {
  const sorted = [...historial].sort((a, b) => new Date(a.fecha) - new Date(b.fecha));
  if (!sorted.length) return '<p style="color:var(--texto-muted);font-size:var(--tx-sm);">Sin datos para graficar.</p>';
  const maxP = Math.max(...sorted.map(h => Number(h.precio_unitario)));
  return sorted.map(h => {
    const pct = Math.round(Number(h.precio_unitario) / maxP * 95);
    return `
      <div class="grafica-barras__fila">
        <span class="grafica-barras__etiqueta">${formatMes(h.fecha)}</span>
        <div class="grafica-barras__pista">
          <div class="grafica-barras__relleno" style="width:${pct}%;">
            <span class="grafica-barras__valor-barra">${fmtMoneda(h.precio_unitario)}</span>
          </div>
        </div>
        <span class="grafica-barras__valor">${fmtMoneda(h.precio_unitario)}</span>
      </div>`;
  }).join('');
}

// ── Detalle de receta ─────────────────────────────────────────────────────────

function renderIngredientesReceta(ingredientes) {
  let subtotal = 0;
  const filas = ingredientes.map(i => {
    const costo = Number(i.costo_linea || 0);
    subtotal += costo;
    return `
      <tr>
        <td><a href="ingrediente-detalle.html?nombre=${encodeURIComponent(i.ingrediente_nombre)}">${i.ingrediente_nombre}</a></td>
        <td class="col-num">${i.cantidad}</td>
        <td class="col-muted">${i.unidad}</td>
        <td class="col-num col-muted">${fmtMoneda(i.precio_unitario)}/${i.unidad}</td>
        <td class="col-num"><strong>${fmtMoneda(costo)}</strong></td>
      </tr>`;
  }).join('');
  return { filas, subtotal };
}

function renderEscaladoReceta(ingredientes, costo, venta) {
  const filas = ingredientes.map(i => `
    <tr>
      <td>${i.ingrediente_nombre}</td>
      <td>${i.cantidad} ${i.unidad}</td>
      <td>${Number(i.cantidad) * 2} ${i.unidad}</td>
      <td>${Number(i.cantidad) * 3} ${i.unidad}</td>
    </tr>`).join('');
  return `${filas}
    <tr class="fila-total">
      <td><strong>Costo total</strong></td>
      <td><strong>${fmtMoneda(costo)}</strong></td>
      <td><strong>${fmtMoneda(costo * 2)}</strong></td>
      <td><strong>${fmtMoneda(costo * 3)}</strong></td>
    </tr>
    <tr class="fila-destacada">
      <td>Ingreso estimado</td>
      <td>${fmtMoneda(venta)}</td>
      <td>${fmtMoneda(venta * 2)}</td>
      <td>${fmtMoneda(venta * 3)}</td>
    </tr>`;
}

// ── Datalist de ingredientes (para formularios) ───────────────────────────────

function renderDatalistIngredientes(ingredientes) {
  return ingredientes.map(i => `<option value="${i.nombre}">`).join('');
}

// ── Detalle de receta (secciones de página) ───────────────────────────────────

function renderHeroReceta(r) {
  const badge = BADGE_RECETA[r.categoria] || 'badge-neutral';
  const catLabel = LABEL_RECETA[r.categoria] || r.categoria || 'Otro';
  const tempLabel = LABEL_TEMPORADA[r.temporada] || 'Todo el año';
  const pesoTotal = (Number(r.peso_pieza) && Number(r.rendimiento))
    ? (Number(r.peso_pieza) * Number(r.rendimiento)) + ' g' : '';
  return `
    <div class="hero-receta">
      <div class="hero-receta__emoji">${r.emoji || '🍰'}</div>
      <div class="hero-receta__info">
        <h2 class="hero-receta__nombre">${r.nombre}</h2>
        <div class="hero-receta__badges">
          <span class="badge ${badge}">${catLabel}</span>
          <span class="badge badge-neutral">${tempLabel}</span>
        </div>
        <div class="hero-receta__rendimiento">
          <div class="hero-receta__dato">
            <span class="hero-receta__dato-num">${r.rendimiento}</span>
            <span class="hero-receta__dato-label">Piezas</span>
          </div>
          ${r.peso_pieza ? `<div class="hero-receta__dato">
            <span class="hero-receta__dato-num">${r.peso_pieza} g</span>
            <span class="hero-receta__dato-label">Peso / pieza</span>
          </div>` : ''}
          ${pesoTotal ? `<div class="hero-receta__dato">
            <span class="hero-receta__dato-num">${pesoTotal}</span>
            <span class="hero-receta__dato-label">Peso total</span>
          </div>` : ''}
          ${r.tiempo ? `<div class="hero-receta__dato">
            <span class="hero-receta__dato-num">${r.tiempo} min</span>
            <span class="hero-receta__dato-label">Horno${r.temperatura ? ' a ' + r.temperatura + '°C' : ''}</span>
          </div>` : ''}
        </div>
      </div>
    </div>`;
}

function _parsePasos(pasos) {
  if (!pasos) return [];
  if (Array.isArray(pasos)) return pasos;
  try { const p = JSON.parse(pasos); if (Array.isArray(p)) return p; } catch {}
  return String(pasos).split('|').map(s => s.trim()).filter(Boolean);
}

function renderColIzqReceta(r, ingredientesReceta, filas, subtotal, costoTotal) {
  const costoEmpaque = Number(r.costo_empaque || 0);
  const filaEmpaque = costoEmpaque ? `
    <tr>
      <td>Empaque (${r.empaque || 'general'})</td>
      <td class="col-num">1</td><td class="col-muted">pza</td>
      <td class="col-num col-muted">—</td>
      <td class="col-num"><strong>${fmtMoneda(costoEmpaque)}</strong></td>
    </tr>` : '';
  const pasos = _parsePasos(r.pasos);
  const instruccionesHtml = pasos.length
    ? pasos.map((p, i) => `
      <li class="lista-pasos__item">
        <span class="lista-pasos__numero">${i + 1}</span>
        <p class="lista-pasos__texto">${p}</p>
      </li>`).join('')
    : '<li class="lista-pasos__item"><p class="lista-pasos__texto" style="color:var(--texto-muted);">Sin instrucciones registradas.</p></li>';
  const notasHtml = r.notas ? `
    <div class="nota-chef mt-6">
      <p class="nota-chef__titulo">📝 Notas del chef</p>
      <p>${r.notas}</p>
    </div>` : '';
  return `
    <section class="seccion">
      <div class="seccion__cabecera"><h3 class="seccion__titulo">Ingredientes y costos</h3></div>
      <div class="tabla-contenedor"><div class="tabla-scroll">
        <table class="tabla-rb">
          <thead><tr>
            <th>Ingrediente</th><th class="col-num">Cantidad</th><th>Unidad</th>
            <th class="col-num">Precio unitario</th><th class="col-num">Costo</th>
          </tr></thead>
          <tbody>
            ${filas || '<tr><td colspan="5" style="text-align:center;color:var(--texto-muted);">Sin ingredientes registrados.</td></tr>'}
            <tr class="fila-subtotal">
              <td colspan="4"><strong>Subtotal ingredientes</strong></td>
              <td class="col-num"><strong>${fmtMoneda(subtotal)}</strong></td>
            </tr>
            ${filaEmpaque}
            <tr class="fila-total">
              <td colspan="4"><strong>COSTO TOTAL DEL LOTE</strong></td>
              <td class="col-num" style="font-size:var(--tx-lg);"><strong>${fmtMoneda(costoTotal)}</strong></td>
            </tr>
          </tbody>
        </table>
      </div></div>
    </section>
    <section class="seccion">
      <div class="seccion__cabecera"><h3 class="seccion__titulo">Escalado de receta</h3></div>
      <div class="tabla-contenedor"><div class="tabla-scroll">
        <table class="tabla-rb tabla-escalado">
          <thead><tr><th>Ingrediente</th><th>1 lote</th><th>2 lotes</th><th>3 lotes</th></tr></thead>
          <tbody>
            <tr class="fila-destacada">
              <td><strong>Piezas</strong></td>
              <td><strong>${r.rendimiento}</strong></td>
              <td><strong>${Number(r.rendimiento) * 2}</strong></td>
              <td><strong>${Number(r.rendimiento) * 3}</strong></td>
            </tr>
            ${renderEscaladoReceta(ingredientesReceta, costoTotal, Number(r.precio_venta || 0))}
          </tbody>
        </table>
      </div></div>
    </section>
    <section class="seccion">
      <div class="seccion__cabecera"><h3 class="seccion__titulo">Instrucciones</h3></div>
      <ol class="lista-pasos">${instruccionesHtml}</ol>
      ${notasHtml}
    </section>`;
}

function renderColDerReceta(r, costoTotal) {
  const venta = Number(r.precio_venta || 0);
  const rendimiento = Number(r.rendimiento || 1);
  const costoPieza = rendimiento > 0 ? costoTotal / rendimiento : 0;
  const ventaPieza = rendimiento > 0 ? venta / rendimiento : 0;
  const ganancia = venta - costoTotal;
  const margen = venta > 0 ? Math.round(ganancia / venta * 100) : 0;
  const difLabel = { facil: '⭐ Fácil', media: '⭐⭐ Media', dificil: '⭐⭐⭐ Difícil' }[r.dificultad] || r.dificultad || '—';
  const badge = BADGE_RECETA[r.categoria] || 'badge-neutral';
  const catLabel = LABEL_RECETA[r.categoria] || r.categoria || '—';
  return `
    <div class="tarjeta mb-6">
      <h4 class="tarjeta__titulo">📋 Información general</h4>
      <div class="info-receta">
        <div class="info-receta__fila"><span class="info-receta__label">Categoría</span>
          <span class="info-receta__valor"><span class="badge ${badge}">${catLabel}</span></span></div>
        <div class="info-receta__fila"><span class="info-receta__label">Rendimiento</span>
          <span class="info-receta__valor">${r.rendimiento} piezas</span></div>
        ${r.peso_pieza ? `<div class="info-receta__fila"><span class="info-receta__label">Peso por pieza</span>
          <span class="info-receta__valor">${r.peso_pieza} g</span></div>` : ''}
        ${r.temperatura ? `<div class="info-receta__fila"><span class="info-receta__label">Temperatura</span>
          <span class="info-receta__valor">${r.temperatura}°C</span></div>` : ''}
        ${r.tiempo ? `<div class="info-receta__fila"><span class="info-receta__label">Tiempo de horneado</span>
          <span class="info-receta__valor">${r.tiempo} minutos</span></div>` : ''}
        <div class="info-receta__fila"><span class="info-receta__label">Dificultad</span>
          <span class="info-receta__valor">${difLabel}</span></div>
        <div class="info-receta__fila"><span class="info-receta__label">Temporada</span>
          <span class="info-receta__valor">${LABEL_TEMPORADA[r.temporada] || 'Todo el año'}</span></div>
      </div>
    </div>
    <div class="panel-costos mb-6">
      <h4 class="panel-costos__titulo">💰 Costos y precios</h4>
      <div class="panel-costos__fila"><span class="panel-costos__label">Costo total lote</span>
        <span class="panel-costos__valor">${fmtMoneda(costoTotal)}</span></div>
      <div class="panel-costos__fila"><span class="panel-costos__label">Costo por pieza</span>
        <span class="panel-costos__valor">${fmtMoneda(costoPieza)}</span></div>
      <div class="panel-costos__fila"><span class="panel-costos__label">Precio de venta / pieza</span>
        <span class="panel-costos__valor" style="color:var(--secundario);font-size:var(--tx-lg);">${fmtMoneda(ventaPieza)}</span></div>
      <div class="panel-costos__fila panel-costos__fila--total"><span class="panel-costos__label">Precio venta lote</span>
        <span class="panel-costos__valor" style="color:var(--secundario);font-size:var(--tx-xl);">${fmtMoneda(venta)}</span></div>
      <div class="panel-costos__fila"><span class="panel-costos__label">Ganancia neta</span>
        <span class="panel-costos__valor" style="color:var(--exito-suave);">${fmtMoneda(ganancia)}</span></div>
      <div class="panel-costos__margen">
        <div class="panel-costos__margen-num">${margen}%</div>
        <div class="panel-costos__margen-label">Margen de ganancia</div>
        <div class="barra-margen" style="margin-top:var(--sp-3);">
          <div class="barra-margen__pista">
            <div class="barra-margen__relleno" style="width:${Math.max(0, Math.min(100, margen))}%;"></div>
          </div>
          <div class="barra-margen__etiquetas">
            <span>Costo: ${fmtMoneda(costoTotal)}</span>
            <span>Venta: ${fmtMoneda(venta)}</span>
          </div>
        </div>
      </div>
    </div>
    <div class="tarjeta no-print" style="display:flex;flex-direction:column;gap:var(--sp-3);">
      <h4 class="tarjeta__titulo">⚡ Acciones</h4>
      <a href="planificacion.html" class="btn btn-primario w-full" style="justify-content:center;">📅 Agregar a planeación</a>
      <a href="receta-nueva.html" class="btn btn-secundario w-full" style="justify-content:center;">✏️ Editar receta</a>
      <button onclick="window.print()" class="btn btn-ghost w-full" style="justify-content:center;">🖨️ Imprimir receta</button>
    </div>`;
}
