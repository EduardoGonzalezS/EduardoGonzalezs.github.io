// ============================================================
// RB Repostería — Google Apps Script (API REST)
// ============================================================
// INSTRUCCIONES DE USO:
// 1. Abre script.google.com y crea un proyecto nuevo
// 2. Borra el código de ejemplo y pega TODO este archivo
// 3. Reemplaza TU_SPREADSHEET_ID_AQUI con el ID de tu Google Sheets
// 4. Despliega como Web App (menú Implementar > Nueva implementación)
//    - Tipo: "Aplicación web"
//    - Ejecutar como: "Yo (tu cuenta)"
//    - Quién tiene acceso: "Cualquier persona"
// 5. Copia la URL /exec que te da y pégala en js/api.js
// ============================================================

const SHEET_ID = 'TU_SPREADSHEET_ID_AQUI';

// ── Entrada GET: leer datos ───────────────────────────────────────────────────

function doGet(e) {
  try {
    const entity = e.parameter.entity;
    if (!entity) return jsonResponse({ error: 'Falta parámetro entity' });

    const ss    = SpreadsheetApp.openById(SHEET_ID);
    const sheet = ss.getSheetByName(entity);
    if (!sheet) return jsonResponse({ error: 'Pestaña no encontrada: ' + entity });

    let data = sheetToJSON(sheet);

    // Filtros opcionales para entidades relacionadas
    if (entity === 'recetas_ingredientes' && e.parameter.receta_id) {
      data = data.filter(r => String(r.receta_id) === String(e.parameter.receta_id));
    }
    if (entity === 'compras_detalle' && e.parameter.compra_id) {
      data = data.filter(r => String(r.compra_id) === String(e.parameter.compra_id));
    }

    return jsonResponse(data);
  } catch (err) {
    return jsonResponse({ error: err.message });
  }
}

// ── Entrada POST: escribir datos ──────────────────────────────────────────────

function doPost(e) {
  try {
    const payload = JSON.parse(e.postData.contents);
    const { entity, data } = payload;
    const ss = SpreadsheetApp.openById(SHEET_ID);

    // Operaciones compuestas con lógica especial
    if (entity === 'compra') {
      if (data && data._action === 'delete' && data.id) return jsonResponse(handleCompraDelete(ss, data));
      if (data && data.id !== undefined && data.id !== null && String(data.id) !== '') {
        return jsonResponse(handleCompraUpdate(ss, data));
      }
      return jsonResponse(handleCompra(ss, data));
    }
    if (entity === 'receta') {
      if (data && data._action === 'delete' && data.id) return jsonResponse(handleRecetaDelete(ss, data));
      if (data && data.id !== undefined && data.id !== null && String(data.id) !== '') {
        return jsonResponse(handleRecetaUpdate(ss, data));
      }
      return jsonResponse(handleReceta(ss, data));
    }

    // Inserción / actualización directa (proveedores, ingredientes)
    const sheet = ss.getSheetByName(entity);
    if (!sheet) return jsonResponse({ error: 'Pestaña no encontrada: ' + entity });

    // Si viene un id, es una actualización
    if (data && data.id !== undefined && data.id !== null && String(data.id) !== '') {
      const ok = updateRow(sheet, data.id, data);
      if (!ok) return jsonResponse({ error: 'No se encontró el registro id=' + data.id });
      return jsonResponse({ ok: true, id: data.id, updated: true });
    }

    const id = appendRow(sheet, data);
    return jsonResponse({ ok: true, id });
  } catch (err) {
    return jsonResponse({ error: err.message });
  }
}

// ── Handler: registrar compra ────────────────────────────────────────────────
// Inserta en compras + compras_detalle y actualiza stock y precio de ingredientes

function handleCompra(ss, data) {
  const shCompras = ss.getSheetByName('compras');
  const shDetalle = ss.getSheetByName('compras_detalle');
  const shIng     = ss.getSheetByName('ingredientes');

  // 1. Insertar encabezado de compra
  const compraId = appendRow(shCompras, {
    fecha:         data.fecha,
    lugar:         data.lugar          || '',
    observaciones: data.obs            || '',
    total:         data.total          || 0
  });

  // 2. Leer ingredientes para actualizarlos
  const allValues = shIng.getDataRange().getValues();
  const headers   = allValues[0].map(h => String(h).trim());
  const ingRows   = allValues.slice(1);

  const iNombre  = headers.indexOf('nombre');
  const iUnidad  = headers.indexOf('unidad');
  const iStock   = headers.indexOf('stock_actual');
  const iPrecio  = headers.indexOf('precio_actual');
  const iPxBase  = headers.indexOf('precio_por_base');
  const iUpdated = headers.indexOf('updated_at');

  for (const d of (data.detalle || [])) {
    // 2a. Insertar línea de detalle de la compra
    appendRow(shDetalle, {
      compra_id:       compraId,
      ingrediente:     d.ingrediente,
      cantidad:        d.cantidad,
      unidad:          d.unidad,
      precio_unitario: d.precio_unitario,
      subtotal:        d.subtotal
    });

    // 2b. Buscar el ingrediente para actualizar su stock y precio
    const idx = ingRows.findIndex(
      r => String(r[iNombre]).toLowerCase().trim() === d.ingrediente.toLowerCase().trim()
    );
    if (idx < 0) continue;

    const rowNum   = idx + 2; // +1 saltar header, +1 porque Sheet es 1-based
    const unidBase = String(ingRows[idx][iUnidad] || '').toLowerCase().trim();

    if (iStock >= 0) {
      const stockActual = Number(shIng.getRange(rowNum, iStock + 1).getValue()) || 0;
      const añadido     = convertToBase(d.cantidad, d.unidad, unidBase);
      shIng.getRange(rowNum, iStock + 1).setValue(stockActual + añadido);
    }
    if (iPrecio >= 0) {
      shIng.getRange(rowNum, iPrecio + 1).setValue(d.precio_unitario);
    }
    if (iPxBase >= 0) {
      const pxBase = calcPrecioBase(d.precio_unitario, d.cantidad, d.unidad, unidBase);
      shIng.getRange(rowNum, iPxBase + 1).setValue(pxBase);
    }
    if (iUpdated >= 0) {
      shIng.getRange(rowNum, iUpdated + 1).setValue(new Date().toISOString().slice(0, 10));
    }
  }

  return { ok: true, compra_id: compraId };
}

// ── Handler: actualizar compra existente ─────────────────────────────────────
// Revierte stock de las líneas anteriores, reemplaza el detalle, aplica nuevo
// stock y recalcula precio_actual / precio_por_base de los ingredientes afectados.

function handleCompraUpdate(ss, data) {
  const compraId  = data.id;
  const shCompras = ss.getSheetByName('compras');
  const shDetalle = ss.getSheetByName('compras_detalle');
  const shIng     = ss.getSheetByName('ingredientes');

  // 1. Detalle viejo de esta compra
  const detalleOriginal = sheetToJSON(shDetalle).filter(d => String(d.compra_id) === String(compraId));

  // 2. Revertir stock de las líneas viejas
  ajustarStock(shIng, detalleOriginal, -1);

  // 3. Borrar líneas viejas
  deleteRowsByField(shDetalle, 'compra_id', compraId);

  // 4. Actualizar fila de compras
  updateRow(shCompras, compraId, {
    fecha:         data.fecha,
    lugar:         data.lugar          || '',
    observaciones: data.obs            || '',
    total:         data.total          || 0
  });

  // 5. Insertar líneas nuevas + 6. aplicar stock nuevo
  const detalleNuevo = (data.detalle || []).map(d => ({
    compra_id:       compraId,
    ingrediente:     d.ingrediente,
    cantidad:        d.cantidad,
    unidad:          d.unidad,
    precio_unitario: d.precio_unitario,
    subtotal:        d.subtotal
  }));
  detalleNuevo.forEach(d => appendRow(shDetalle, d));
  ajustarStock(shIng, detalleNuevo, +1);

  // 7. Recalcular precio_actual / precio_por_base de ingredientes afectados
  const afectados = detalleOriginal.map(d => d.ingrediente)
    .concat(detalleNuevo.map(d => d.ingrediente));
  recalcPreciosIngredientes(ss, afectados);

  return { ok: true, compra_id: compraId, updated: true };
}

// ── Handler: eliminar compra ─────────────────────────────────────────────────

function handleCompraDelete(ss, data) {
  const compraId  = data.id;
  const shCompras = ss.getSheetByName('compras');
  const shDetalle = ss.getSheetByName('compras_detalle');
  const shIng     = ss.getSheetByName('ingredientes');

  const detalleOriginal = sheetToJSON(shDetalle).filter(d => String(d.compra_id) === String(compraId));

  ajustarStock(shIng, detalleOriginal, -1);
  deleteRowsByField(shDetalle, 'compra_id', compraId);
  deleteRowsByField(shCompras, 'id', compraId);

  recalcPreciosIngredientes(ss, detalleOriginal.map(d => d.ingrediente));

  return { ok: true, compra_id: compraId, deleted: true };
}

// Aplica un delta de stock (+1 para sumar, -1 para restar) a partir de un array
// de líneas {ingrediente, cantidad, unidad}. Convierte a unidad base del ingrediente.
function ajustarStock(shIng, lineas, signo) {
  if (!lineas || !lineas.length) return;
  const all     = shIng.getDataRange().getValues();
  const headers = all[0].map(h => String(h).trim());
  const iNombre = headers.indexOf('nombre');
  const iUnidad = headers.indexOf('unidad');
  const iStock  = headers.indexOf('stock_actual');
  const iUpdated = headers.indexOf('updated_at');
  if (iNombre < 0 || iStock < 0) return;

  for (const d of lineas) {
    const idx = all.findIndex((r, i) =>
      i > 0 && String(r[iNombre]).toLowerCase().trim() === String(d.ingrediente).toLowerCase().trim()
    );
    if (idx < 0) continue;
    const rowNum   = idx + 1;
    const unidBase = String(all[idx][iUnidad] || '').toLowerCase().trim();
    const stockActual = Number(shIng.getRange(rowNum, iStock + 1).getValue()) || 0;
    const delta       = signo * convertToBase(d.cantidad, d.unidad, unidBase);
    shIng.getRange(rowNum, iStock + 1).setValue(stockActual + delta);
    if (iUpdated >= 0) {
      shIng.getRange(rowNum, iUpdated + 1).setValue(new Date().toISOString().slice(0, 10));
    }
  }
}

// Elimina todas las filas donde sheet[fieldName] === fieldValue. Recorre desde abajo.
function deleteRowsByField(sheet, fieldName, fieldValue) {
  const all = sheet.getDataRange().getValues();
  if (all.length < 2) return 0;
  const headers = all[0].map(h => String(h).trim());
  const idx = headers.indexOf(fieldName);
  if (idx < 0) return 0;
  let deleted = 0;
  for (let i = all.length - 1; i >= 1; i--) {
    if (String(all[i][idx]) === String(fieldValue)) {
      sheet.deleteRow(i + 1);
      deleted++;
    }
  }
  return deleted;
}

// Para cada nombre de ingrediente, busca su línea más reciente en compras_detalle
// (por fecha de la compra padre) y actualiza precio_actual y precio_por_base.
// Si no hay líneas, deja los valores en 0.
function recalcPreciosIngredientes(ss, nombres) {
  if (!nombres || !nombres.length) return;
  const shIng     = ss.getSheetByName('ingredientes');
  const shCompras = ss.getSheetByName('compras');
  const shDetalle = ss.getSheetByName('compras_detalle');

  const compras = sheetToJSON(shCompras);
  const fechaPorCompra = {};
  compras.forEach(c => { fechaPorCompra[c.id] = c.fecha; });

  const detalle = sheetToJSON(shDetalle).map(d => Object.assign({}, d, { fecha: fechaPorCompra[d.compra_id] || '' }));

  const ingValues = shIng.getDataRange().getValues();
  const headers = ingValues[0].map(h => String(h).trim());
  const iNombre  = headers.indexOf('nombre');
  const iUnidad  = headers.indexOf('unidad');
  const iPrecio  = headers.indexOf('precio_actual');
  const iPxBase  = headers.indexOf('precio_por_base');
  const iUpdated = headers.indexOf('updated_at');

  const setUnique = [];
  const seen = {};
  nombres.forEach(n => {
    const k = String(n || '').toLowerCase().trim();
    if (k && !seen[k]) { seen[k] = true; setUnique.push(k); }
  });

  for (const name of setUnique) {
    const idx = ingValues.findIndex((r, i) =>
      i > 0 && String(r[iNombre]).toLowerCase().trim() === name
    );
    if (idx < 0) continue;
    const rowNum = idx + 1;
    const unidBase = String(ingValues[idx][iUnidad] || '').toLowerCase().trim();
    const lineas = detalle.filter(d => String(d.ingrediente).toLowerCase().trim() === name);
    if (!lineas.length) {
      if (iPrecio  >= 0) shIng.getRange(rowNum, iPrecio  + 1).setValue(0);
      if (iPxBase  >= 0) shIng.getRange(rowNum, iPxBase  + 1).setValue(0);
    } else {
      lineas.sort(function(a, b) { return String(b.fecha).localeCompare(String(a.fecha)); });
      const ult = lineas[0];
      if (iPrecio >= 0) shIng.getRange(rowNum, iPrecio + 1).setValue(Number(ult.precio_unitario) || 0);
      if (iPxBase >= 0) shIng.getRange(rowNum, iPxBase + 1).setValue(calcPrecioBase(ult.precio_unitario, ult.cantidad, ult.unidad, unidBase));
    }
    if (iUpdated >= 0) shIng.getRange(rowNum, iUpdated + 1).setValue(new Date().toISOString().slice(0, 10));
  }
}

// ── Handler: registrar receta ────────────────────────────────────────────────
// Inserta en recetas + recetas_ingredientes y calcula costos automáticamente

function handleReceta(ss, data) {
  const shRecetas = ss.getSheetByName('recetas');
  const shRI      = ss.getSheetByName('recetas_ingredientes');
  const shIng     = ss.getSheetByName('ingredientes');

  const ingData = sheetToJSON(shIng);

  // Calcular costo de cada ingrediente usando precio_por_base almacenado
  let costoIngredientes = 0;
  const ingredientesConCosto = (data.ingredientes || []).map(ing => {
    const match = ingData.find(
      i => String(i.nombre).toLowerCase().trim() === String(ing.ingrediente_nombre).toLowerCase().trim()
    );
    const pxBase   = match ? Number(match.precio_por_base || 0) : 0;
    const unidBase = match
      ? String(match.unidad   || ing.unidad).toLowerCase().trim()
      : String(ing.unidad || '').toLowerCase().trim();
    const cantBase = convertToBase(ing.cantidad, ing.unidad, unidBase);
    const costo    = pxBase * cantBase;
    costoIngredientes += costo;
    return { ...ing, costo_linea: parseFloat(costo.toFixed(4)) };
  });

  const costoTotal = costoIngredientes + Number(data.costo_empaque || 0);
  const pasos      = Array.isArray(data.pasos) ? data.pasos.join('|') : (data.pasos || '');

  // 1. Insertar receta con costo_total calculado
  const recetaId = appendRow(shRecetas, {
    nombre:        data.nombre,
    emoji:         data.emoji         || '🍰',
    categoria:     data.categoria,
    temporada:     data.temporada     || 'todo',
    rendimiento:   data.rendimiento   || 0,
    peso_pieza:    data.peso_pieza    || '',
    temperatura:   data.temperatura   || '',
    tiempo:        data.tiempo        || '',
    dificultad:    data.dificultad    || 'media',
    precio_venta:  data.precio_venta  || 0,
    empaque:       data.empaque       || '',
    costo_empaque: data.costo_empaque || 0,
    costo_total:   parseFloat(costoTotal.toFixed(2)),
    pasos:         pasos,
    notas:         data.notas         || ''
  });

  // 2. Insertar ingredientes de la receta
  for (const ing of ingredientesConCosto) {
    appendRow(shRI, {
      receta_id:          recetaId,
      ingrediente_nombre: ing.ingrediente_nombre,
      cantidad:           ing.cantidad,
      unidad:             ing.unidad,
      costo_linea:        ing.costo_linea
    });
  }

  return { ok: true, receta_id: recetaId };
}

// ── Handler: actualizar receta existente ─────────────────────────────────────
// Reemplaza por completo la lista de recetas_ingredientes y recalcula costo_total.

function handleRecetaUpdate(ss, data) {
  const recetaId  = data.id;
  const shRecetas = ss.getSheetByName('recetas');
  const shRI      = ss.getSheetByName('recetas_ingredientes');
  const shIng     = ss.getSheetByName('ingredientes');

  const ingData = sheetToJSON(shIng);

  // Calcular costo de cada ingrediente con precio_por_base actual
  let costoIngredientes = 0;
  const ingredientesConCosto = (data.ingredientes || []).map(function (ing) {
    const match = ingData.find(function (i) {
      return String(i.nombre).toLowerCase().trim() === String(ing.ingrediente_nombre).toLowerCase().trim();
    });
    const pxBase   = match ? Number(match.precio_por_base || 0) : 0;
    const unidBase = match
      ? String(match.unidad || ing.unidad).toLowerCase().trim()
      : String(ing.unidad || '').toLowerCase().trim();
    const cantBase = convertToBase(ing.cantidad, ing.unidad, unidBase);
    const costo    = pxBase * cantBase;
    costoIngredientes += costo;
    return Object.assign({}, ing, { costo_linea: parseFloat(costo.toFixed(4)) });
  });

  const costoTotal = costoIngredientes + Number(data.costo_empaque || 0);
  const pasos      = Array.isArray(data.pasos) ? data.pasos.join('|') : (data.pasos || '');

  // 1. Actualizar fila de recetas
  const ok = updateRow(shRecetas, recetaId, {
    nombre:        data.nombre,
    categoria:     data.categoria,
    temporada:     data.temporada     || 'todo',
    rendimiento:   data.rendimiento   || 0,
    peso_pieza:    data.peso_pieza    || '',
    temperatura:   data.temperatura   || '',
    tiempo:        data.tiempo        || '',
    dificultad:    data.dificultad    || 'media',
    precio_venta:  data.precio_venta  || 0,
    empaque:       data.empaque       || '',
    costo_empaque: data.costo_empaque || 0,
    costo_total:   parseFloat(costoTotal.toFixed(2)),
    pasos:         pasos,
    notas:         data.notas         || ''
  });
  if (!ok) return { error: 'No se encontró la receta id=' + recetaId };

  // 2. Reemplazar líneas de recetas_ingredientes
  deleteRowsByField(shRI, 'receta_id', recetaId);
  for (var i = 0; i < ingredientesConCosto.length; i++) {
    var ing = ingredientesConCosto[i];
    appendRow(shRI, {
      receta_id:          recetaId,
      ingrediente_nombre: ing.ingrediente_nombre,
      cantidad:           ing.cantidad,
      unidad:             ing.unidad,
      costo_linea:        ing.costo_linea
    });
  }

  return { ok: true, receta_id: recetaId, updated: true };
}

// ── Handler: eliminar receta ─────────────────────────────────────────────────

function handleRecetaDelete(ss, data) {
  const recetaId  = data.id;
  const shRecetas = ss.getSheetByName('recetas');
  const shRI      = ss.getSheetByName('recetas_ingredientes');

  deleteRowsByField(shRI, 'receta_id', recetaId);
  deleteRowsByField(shRecetas, 'id', recetaId);

  return { ok: true, receta_id: recetaId, deleted: true };
}

// ── Helpers: Sheets ───────────────────────────────────────────────────────────

function sheetToJSON(sheet) {
  const values = sheet.getDataRange().getValues();
  if (values.length < 2) return [];
  const headers = values[0].map(h => String(h).trim());
  return values.slice(1)
    .filter(row => row.some(cell => cell !== '' && cell !== null && cell !== undefined))
    .map(row => {
      const obj = {};
      headers.forEach((h, i) => {
        const val = row[i];
        obj[h] = (val instanceof Date)
          ? val.toISOString().slice(0, 10)
          : (val === null || val === undefined ? '' : val);
      });
      return obj;
    });
}

function getNextId(sheet) {
  const lastRow = sheet.getLastRow();
  if (lastRow <= 1) return 1;
  const ids = sheet.getRange(2, 1, lastRow - 1, 1).getValues()
    .flat()
    .map(v => parseInt(v))
    .filter(n => !isNaN(n) && n > 0);
  return ids.length ? Math.max(...ids) + 1 : 1;
}

function appendRow(sheet, data) {
  const headerValues = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  const id  = getNextId(sheet);
  const hoy = new Date().toISOString().slice(0, 10);

  const row = headerValues.map(h => {
    h = String(h).trim();
    if (h === 'id')         return id;
    if (h === 'created_at') return hoy;
    if (h === 'updated_at') return hoy;
    const val = data[h];
    return (val === undefined || val === null) ? '' : val;
  });

  sheet.appendRow(row);
  return id;
}

// Actualiza la fila cuyo `id` coincide. Solo escribe los campos presentes en `data`,
// preserva `id` y `created_at`, y refresca `updated_at`.
function updateRow(sheet, id, data) {
  const allValues = sheet.getDataRange().getValues();
  if (allValues.length < 2) return false;
  const headers = allValues[0].map(h => String(h).trim());
  const iId = headers.indexOf('id');
  if (iId < 0) return false;

  for (let i = 1; i < allValues.length; i++) {
    if (String(allValues[i][iId]) === String(id)) {
      const rowNum = i + 1; // 1-based en Sheets
      const hoy = new Date().toISOString().slice(0, 10);
      headers.forEach((h, j) => {
        if (h === 'id' || h === 'created_at') return;
        if (h === 'updated_at') {
          sheet.getRange(rowNum, j + 1).setValue(hoy);
          return;
        }
        if (Object.prototype.hasOwnProperty.call(data, h)) {
          const val = data[h];
          sheet.getRange(rowNum, j + 1).setValue(val === undefined || val === null ? '' : val);
        }
      });
      return true;
    }
  }
  return false;
}

// ── Helpers: Conversión de unidades ──────────────────────────────────────────

// Convierte una cantidad de unidadCompra → unidadBase del ingrediente
function convertToBase(cantidad, unidadCompra, unidadBase) {
  const n  = Number(cantidad) || 0;
  const uc = String(unidadCompra || '').toLowerCase().trim();
  const ub = String(unidadBase   || '').toLowerCase().trim();
  if (!uc || !ub || uc === ub) return n;

  const pesoEnG = { g: 1, kg: 1000, lb: 453.592, oz: 28.3495 };
  const volEnMl = { ml: 1, l: 1000, lt: 1000, litro: 1000, litros: 1000 };

  if (pesoEnG[uc] !== undefined && pesoEnG[ub] !== undefined) {
    return n * pesoEnG[uc] / pesoEnG[ub];
  }
  if (volEnMl[uc] !== undefined && volEnMl[ub] !== undefined) {
    return n * volEnMl[uc] / volEnMl[ub];
  }
  return n; // unidades incompatibles: sin conversión
}

// Precio por 1 unidad base (ej. precio por gramo si el ingrediente se mide en g)
function calcPrecioBase(precioCompra, cantCompra, unidadCompra, unidadBase) {
  const cantBase = convertToBase(cantCompra, unidadCompra, unidadBase);
  if (!cantBase) return 0;
  return parseFloat((Number(precioCompra) / cantBase).toFixed(6));
}

// ── Helper: respuesta JSON con CORS ──────────────────────────────────────────

function jsonResponse(data) {
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}
