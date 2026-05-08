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
    if (entity === 'compra')  return jsonResponse(handleCompra(ss, data));
    if (entity === 'receta')  return jsonResponse(handleReceta(ss, data));

    // Inserción directa (proveedores, ingredientes)
    const sheet = ss.getSheetByName(entity);
    if (!sheet) return jsonResponse({ error: 'Pestaña no encontrada: ' + entity });
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
