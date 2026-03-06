# FarmaAdmin — Módulos del Sistema

## 1. Login (`index.html`)
- Fondo gradiente azul marino (`#0d2d5e → #2563eb`)
- Píldoras flotantes animadas de decoración
- Tarjeta centrada con logo, usuario, contraseña, recordar sesión
- Muestra las 8 sucursales activas al pie

## 2. Dashboard (`dashboard.html`)
- 4 KPI cards: Ventas Hoy, Semana, Mes, Medicamentos por Vencer
- Line chart: ventas últimos 30 días (Chart.js, `maintainAspectRatio: false`)
- Doughnut chart: % ventas por sucursal
- Bar chart "Compras vs Ventas — Últimos 6 meses" (col-lg-7) + Doughnut "Compras por Proveedor" (col-lg-5)
- Tabla "Últimas Ventas" col-lg-8; card de alertas compacto col-lg-4 → botón "Ver todas" → `alertas.html`
- Cards de desempeño por sucursal con progress bars
- Pills de filtro: Hoy / Semana / Mes / Año

## 3. Ventas (`ventas.html`)
- Filtros: sucursal, rango de fechas, período rápido
- 4 KPIs: total ventas, tickets, promedio/ticket, top sucursal
- Bar chart y line chart (Chart.js, `maintainAspectRatio: false`)
- Tabla ordenable con sub-filas expandibles; folio, sucursal, cajero, total, estado
- Modal de detalle de venta con desglose de productos

## 4. Inventario (`inventario.html`)
- 4 KPIs dinámicos: total productos, stock crítico, por vencer (7 días), agotados
- 4 tabs: Todo el Inventario / Por Vencer / Stock Bajo / Agotados
- Filtros: búsqueda, sucursal, categoría, tipo de producto
- Tabla ordenable con sub-filas expandibles; columnas priceBuy/priceSell/type
- Modal "Nuevo Producto": campo "Código / SKU" (`id="newProductCode"`) + botón `fa-barcode` → `#barcodeScannerModal`
  - Usa `html5-qrcode@2.3.8` (CDN), `facingMode: environment`, soporta EAN-13/Code-128/QR
  - Al escanear: rellena campo, cierra modal, muestra toast
  - `stopBarcodeScanner()` en `hidden.bs.modal` (requiere HTTPS o localhost)
- Modal de ajuste de stock (entrada/salida/corrección)
- Botón "Alta Masiva" → enlaza a `alta-masiva.html`

## 5. Transferencias (`transferencias.html`)
- 4 KPIs: pendientes, en tránsito, recibidas hoy, este mes
- Formulario col-12 col-xl-4 / historial col-12 col-xl-8
- Indicador visual origen → destino; autocomplete búsqueda de productos
- Modal de confirmación con resumen; historial ordenable; badges: Pendiente / En Tránsito / Recibido
- Modal detalle: footer solo con "Cerrar"

## 6. Usuarios (`usuarios.html`)
- 4 KPIs: total usuarios, activos, inactivos, conectados ahora
- Cards de distribución por rol; filtros por rol, sucursal y estado
- Tabla ordenable (sin columna checkbox ni botón Exportar); toggle switch activar/desactivar
- Modal nuevo usuario con checklist de permisos por módulo

## 7. POS — Punto de Venta (`pos.html`)
- Topbar propio (sin sidebar) con reloj en tiempo real
- Chips de categorías con filtro por tipo; grid de producto cards
- Carrito sin "Nombre del cliente"; totales: subtotal, descuento, IVA, TOTAL
- 3 métodos de pago: Efectivo / Tarjeta / Mixto; modal de cobro con cambio automático
- Botón "Escanear" → `openPosScanner()` → `#posBarcodeScannerModal`; `stopPosScanner()` en `hidden.bs.modal`

## 8. Sucursales (`sucursales.html`)
- 4 KPIs: total, activas, inactivas, top sucursal
- Tabla ordenable (sin columna `#` ni botón Actualizar); 3 modales: detalle, editar, nueva

## 9. Configuración (`configuracion.html`)
- Tiempo de inactividad: radio buttons 5/10/15/30 min + input personalizado
- `localStorage.setItem('inactivityTime', value)`; timer con modal de advertencia (30s)
- Secciones placeholder: Notificaciones, Apariencia

## 10. Alta Masiva (`alta-masiva.html`)
- Wizard 3 pasos: Captura → Validación → Confirmación
- Tabla editable con inputs/selects por fila
- Campo Código: botón `fa-barcode` → `openBulkBarcodeScanner(rowIndex)` → `#bulkBarcodeScannerModal`
  - Al escanear: actualiza `rows[i].code` y llama `renderBulkTable()`; `stopBulkBarcodeScanner()` en `hidden.bs.modal`
  - html5-qrcode cargado **antes** del CDN Bootstrap JS
- Validación: nombre requerido, código requerido, P.Venta > 0, stock ≥ 0
- Botón "Importar CSV" → `importCSV(event)` via FileReader
- Sub-página de Inventario (breadcrumb + sidebar activo en Inventario)

## 11. Reportes (`reportes.html`)
- Pantalla "Próximamente"; preview: PDF, Excel, por Sucursal, Rentabilidad

## 12. Proveedores (`proveedores.html`)
- 4 KPI cards: Total | Activos | Inactivos | Órdenes este mes
- Tabla ordenable; categorías: Farmacéutico | General | Equipo Médico
- 3 modales: Ver Detalle, Editar, Nuevo Proveedor; 10 proveedores simulados
- Funciones: `viewSupplier(id)`, `editSupplier(id)`, `deleteSupplier(id)`, `saveNewSupplier()`

## 13. Compras (`compras.html`)
- 4 KPI cards: Compras este mes | Pendientes | Borradores | Total invertido
- Panel inline colapsable "Nueva Compra"; estados: Borrador | Pendiente | Aprobado | Recibido | Rechazado
- Modal de detalle + modal de recepción; 15 compras simuladas
- Funciones: `toggleNewPurchasePanel()`, `saveDraft()`, `submitForApproval()`, `viewPurchase(id)`, `openReceive(id)`, `confirmReceive()`, `cancelPurchase(id)`

## 14. Alertas (`alertas.html`)
- 4 KPI cards: Total | Críticas | Por Vencer | Stock Bajo
- Tabs: Todas | Críticas | Stock Bajo | Por Vencer | Agotados | Transferencias | Compras | Sistema
- Cards de alerta: icono, título, descripción, sucursal, tiempo, badge; 15 alertas simuladas
- Acciones: `markRead(id)`, `ignoreAlert(id)`, `markAllRead()`, `renderAlerts()`, `renderTabs()`, `updateKPIs()`

## 15. Mi Perfil (`perfil.html`)
- Sin nav-link activo en el sidebar (perfil no es sección del sidebar)
- Card único: formulario de cambio de contraseña
  - Inputs con toggle eye (password ↔ text); contraseña mock: `admin123`
  - Validaciones: campo vacío, contraseña actual incorrecta, mínimo 8 chars, coincidencia
  - Alerta verde en éxito + reset form; alerta roja en error
- Accesible desde el dropdown del topbar en **todos** los archivos

## 16. Editar Compra (`editar-compra.html`)
- Página full de edición de borrador; pre-rellena desde `localStorage` key `editDraft`

## 17. Nueva Compra (`nueva-compra.html`)
- Formulario de nueva orden de compra como página independiente

## 18. Estimación (`estimacion.html`)
- Documento de estimación de costos 2026; diseño propio (sin sidebar estándar)
