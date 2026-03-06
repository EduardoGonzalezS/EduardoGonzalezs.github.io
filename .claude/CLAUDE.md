# FarmaAdmin — Contexto del Proyecto

## Descripción
Sistema de administración web para una cadena de **8 farmacias**. Diseño HTML/CSS/Bootstrap 5 estático (sin backend). Todos los datos son simulados con JavaScript inline.

## Objetivo
Sitio responsive (PC, tablet, móvil) para administración de ventas, inventario, transferencias entre sucursales y gestión de usuarios. Funciona como sistema de punto de venta (POS) enfocado a farmacia.

---

## Estructura de Archivos

```
C:\FM\
├── style.css              # CSS global compartido
├── index.html             # Pantalla de inicio de sesión (punto de entrada)
├── dashboard.html         # Panel principal / KPIs y gráficas
├── ventas.html            # Reporte de ventas por período y sucursal
├── inventario.html        # Gestión de stock, vencimientos, alertas
├── transferencias.html    # Movimientos de productos entre sucursales
├── usuarios.html          # Gestión de usuarios, roles y permisos
├── pos.html               # Punto de Venta (POS)
├── sucursales.html        # Gestión de sucursales (alta/edición/detalle)
├── configuracion.html     # Configuraciones del sistema (inactividad, etc.)
├── alta-masiva.html       # Wizard de alta masiva de productos (3 pasos) + importar CSV
├── reportes.html          # Módulo de Reportes — pantalla "Próximamente"
├── proveedores.html       # Gestión de proveedores (tabla CRUD + 3 modales)
├── compras.html           # Órdenes de compra a proveedores (borrador/pendiente/aprobado/recibido/rechazado)
├── alertas.html           # Centro de alertas del sistema (inventario, compras, transferencias, sistema)
└── editar-compra.html     # Edición de borrador de compra como página full (pre-rellena desde localStorage 'editDraft')
```

---

## Stack Tecnológico (solo CDN, sin instalación)

| Librería | Versión | Uso |
|---|---|---|
| Bootstrap | 5.3.3 | Layout responsive, componentes UI |
| Font Awesome | 6.5.0 | Íconos en todo el sitio |
| Google Fonts (Inter) | 300–800 | Tipografía principal |
| Chart.js | 4.4.2 | Gráficas (solo `dashboard.html` y `ventas.html`) |
| html5-qrcode | 2.3.8 | Lector de código de barras por cámara (`inventario.html`, `alta-masiva.html`, `pos.html`) |

---

## Módulos del Sistema

### 1. Login (`index.html`)
- Fondo gradiente azul marino (`#0d2d5e → #2563eb`)
- Píldoras flotantes animadas de decoración
- Tarjeta centrada con logo, usuario, contraseña, recordar sesión
- Muestra las 8 sucursales activas al pie

### 2. Dashboard (`dashboard.html`)
- 4 KPI cards: Ventas Hoy, Semana, Mes, Medicamentos por Vencer
- Line chart: ventas últimos 30 días (Chart.js, `maintainAspectRatio: false`)
- Doughnut chart: % ventas por sucursal (Chart.js, `maintainAspectRatio: false`)
- Tabla de últimas ventas en tiempo real
- Lista de alertas (por vencer, stock bajo, agotados)
- Cards de desempeño por sucursal con progress bars
- Pills de filtro: Hoy / Semana / Mes / Año

### 3. Ventas (`ventas.html`)
- Filtros: sucursal, rango de fechas, período rápido
- 4 KPIs: total ventas, tickets, promedio/ticket, top sucursal
- Bar chart y line chart (Chart.js, `maintainAspectRatio: false`)
- Tabla ordenable con sub-filas expandibles; folio, sucursal, cajero, total, estado
- Modal de detalle de venta con desglose de productos

### 4. Inventario (`inventario.html`)
- 4 KPIs dinámicos: total productos, stock crítico, por vencer (7 días), agotados
- 4 tabs: Todo el Inventario / Por Vencer / Stock Bajo / Agotados
- Filtros: búsqueda, sucursal, categoría, **tipo de producto**
- Tabla ordenable con sub-filas expandibles; columnas priceBuy/priceSell/type
- Tipos de producto: `medicamento`, `general`, `suplemento`, `equipo`
- Modal "Nuevo Producto" con campo Tipo, Precio Compra, Precio Venta
  - Campo "Código / SKU" (`id="newProductCode"`) tiene botón `fa-barcode` que abre `#barcodeScannerModal`
  - `#barcodeScannerModal`: usa `html5-qrcode@2.3.8` (CDN), `facingMode: environment`, soporta EAN-13/Code-128/QR
  - Al escanear: rellena el campo, cierra el modal y muestra toast de confirmación
  - `stopBarcodeScanner()` se llama en `hidden.bs.modal` para evitar memory leaks (requiere HTTPS o localhost)
- Modal de ajuste de stock (entrada/salida/corrección)
- Botón "Alta Masiva" → enlaza a `alta-masiva.html`

### 5. Transferencias (`transferencias.html`)
- 4 KPIs: pendientes, en tránsito, recibidas hoy, este mes
- Formulario con indicador visual origen → destino
- Autocomplete para búsqueda de productos
- Modal de confirmación con resumen de la transferencia
- Historial ordenable con sub-filas; badges: Pendiente / En Tránsito / Recibido
- Modal de detalle de transferencia: footer solo con "Cerrar" (botón "Imprimir" eliminado)

### 6. Usuarios (`usuarios.html`)
- 4 KPIs: total usuarios, activos, inactivos, conectados ahora
- Cards de distribución por rol (Admin / Gerente / Cajero / Farmacéutico)
- Filtros por rol, sucursal y estado
- Tabla ordenable con sub-filas expandibles; avatar, nombre, email, sucursal, rol (**sin** columna checkbox ni botón Exportar)
- Toggle switch para activar/desactivar usuario
- Modal de nuevo usuario con checklist de permisos por módulo

### 7. POS — Punto de Venta (`pos.html`)
- Topbar propio (sin sidebar) con reloj en tiempo real
- Chips de categorías con filtro por tipo (medicamento/general/suplemento/equipo)
- Grid de producto cards: medicamentos + productos generales + suplementos + equipo médico
- Carrito **sin** campo "Nombre del cliente" (eliminado); solo items, descuento y totales
- Totales: subtotal, descuento, IVA, TOTAL
- 3 métodos de pago: Efectivo / Tarjeta / Mixto
- Modal de cobro con montos rápidos y cálculo de cambio automático
- Botón "Escanear" (`fa-barcode`) conectado a `openPosScanner()` → `#posBarcodeScannerModal`
  - Al escanear: rellena `#posSearch` y llama `filterProducts()` automáticamente
  - `stopPosScanner()` en `hidden.bs.modal` para evitar memory leaks
  - Usa `html5-qrcode@2.3.8` (CDN); requiere HTTPS o localhost

### 8. Sucursales (`sucursales.html`)
- 4 KPIs: total, activas, inactivas, top sucursal
- Tabla ordenable con sub-filas expandibles (dirección, teléfono, horario, empleados, ventas) (**sin** columna `#` ni botón Actualizar)
- 3 modales: detalle (modal-lg), editar, nueva sucursal

### 9. Configuración (`configuracion.html`)
- Tiempo de inactividad: radio buttons 5/10/15/30 min + input personalizado
- Persistencia con `localStorage.setItem('inactivityTime', value)`
- Timer de inactividad con modal de advertencia (cuenta regresiva 30s)
- Secciones placeholder: Notificaciones, Apariencia (próximamente)

### 10. Alta Masiva (`alta-masiva.html`)
- Wizard de 3 pasos: Captura → Validación → Confirmación
- Tabla editable con inputs/selects por fila (nombre, tipo, código, categoría, precios, stock, vencimiento, sucursal)
- Campo Código: `input-group` con botón `fa-barcode` → `openBulkBarcodeScanner(rowIndex)` → `#bulkBarcodeScannerModal`
  - Al escanear: actualiza `rows[i].code` y llama `renderBulkTable()` (preserva todos los demás campos)
  - `stopBulkBarcodeScanner()` en `hidden.bs.modal` para evitar memory leaks
  - Usa `html5-qrcode@2.3.8` (CDN, cargado antes del CDN Bootstrap JS); requiere HTTPS o localhost
- Validación: nombre requerido, código requerido, P.Venta > 0, stock ≥ 0
- Descarga de plantilla CSV
- Botón "Importar CSV" → `importCSV(event)` via FileReader; parsea líneas, valida tipo/categoría/sucursal y llena `rows[]`
- Sub-página de Inventario (breadcrumb + sidebar activo en Inventario)

### 11. Reportes (`reportes.html`)
- Pantalla "Próximamente" — módulo en desarrollo
- Preview de features futuras: Exportación PDF, Exportación Excel, Reportes por Sucursal, Análisis de Rentabilidad
- Sidebar activo en Reportes; enlace desde todos los demás archivos apunta a `reportes.html`

### 12. Proveedores (`proveedores.html`)
- Sidebar activo en "Proveedores" (sección Administración), icon `fa-handshake`
- 4 KPI cards: Total | Activos | Inactivos | Órdenes este mes
- Tabla ordenable con sub-filas; columnas: # | Nombre | Categoría | Teléfono | Dirección | Estado | Acciones
- Categorías: Farmacéutico | General | Equipo Médico
- 3 modales: Ver Detalle, Editar, Nuevo Proveedor
- Datos simulados: 10 proveedores con datos realistas de México
- Funciones: `viewSupplier(id)`, `editSupplier(id)`, `deleteSupplier(id)`, `saveNewSupplier()`

### 13. Compras (`compras.html`)
- Sidebar activo en "Compras" (sección Principal), icon `fa-cart-flatbed`
- 4 KPI cards: Compras este mes | Pendientes aprobación | Borradores | Total invertido
- Panel inline colapsable "Nueva Compra": proveedor, sucursal, fecha, No. Orden, tabla de productos, totales, método de pago
- Botones: "Guardar Borrador" y "Enviar para Aprobación"
- Historial de Compras — tabla ordenable con sub-filas; estados: Borrador | Pendiente | Aprobado | Recibido | Rechazado
- Modal de detalle de compra + modal de recepción con confirmación
- Datos simulados: 15 compras con diferentes estados y proveedores
- Funciones: `toggleNewPurchasePanel()`, `saveDraft()`, `submitForApproval()`, `viewPurchase(id)`, `openReceive(id)`, `confirmReceive()`, `cancelPurchase(id)`

### 14. Alertas (`alertas.html`)
- Sidebar activo en "Alertas" (sección Principal), icon `fa-bell`
- 4 KPI cards: Total Alertas | Críticas | Por Vencer | Stock Bajo
- Tabs de filtro: Todas | Críticas | Stock Bajo | Por Vencer | Agotados | Transferencias | Compras | Sistema
- Cada tab muestra conteo de alertas activas; filtro por búsqueda en topbar
- Cards de alerta con: icono de tipo, título, descripción, sucursal, tiempo, badge de estado
- Acciones por alerta: Marcar leída (`fa-check`), Ver módulo (`fa-arrow-up-right-from-square`), Ignorar (`fa-eye-slash`)
- "Marcar todas como leídas" — botón en page-header
- Tipos de alerta: Agotado | Stock Bajo | Por Vencer | Compra Pendiente | Proveedor | Transferencia | Sistema
- 15 alertas simuladas; estados: unread | read | ignored
- Funciones: `markRead(id)`, `ignoreAlert(id)`, `markAllRead()`, `renderAlerts()`, `renderTabs()`, `updateKPIs()`

### Dashboard — Cambios en v2
- Nueva fila de charts: Bar chart "Compras vs Ventas — Últimos 6 meses" (col-lg-7) + Doughnut "Compras por Proveedor" (col-lg-5)
- Card de alertas simplificado (col-lg-4): muestra solo 3 alertas + botón "Ver todas las alertas" → `alertas.html`
- Tabla "Últimas Ventas" ampliada a col-lg-8
- Transferencias: formulario col-12 col-xl-4 / historial col-12 col-xl-8 (layout tablet fix)

---

## Diseño / UI

### Paleta de Colores
```css
--sidebar-bg:    #0d2d5e;   /* Azul marino profundo */
--sidebar-hover: #1a4a8a;
--sidebar-active:#2563eb;
--body-bg:       #f0f4f8;   /* Gris azulado claro */
--primary:       #2563eb;   /* Azul Bootstrap */
--green:         #16a34a;
--amber:         #d97706;
--red:           #dc2626;
--teal:          #0ea5e9;
```

### Layout Responsive
- **≥992px**: Sidebar fijo 260px + topbar con offset; main content con margen izquierdo
- **<992px**: Sidebar se convierte en offcanvas (`.show` class via JS) con overlay oscuro
- **<768px**: Sub-filas expandibles en tablas, columnas secundarias ocultas (`.col-secondary`)
- **<576px**: Padding reducido, search bar oculto, tipografía ajustada

### Componentes Clave (en `style.css`)
| Clase | Descripción |
|---|---|
| `.sidebar` / `.sidebar.show` | Sidebar fijo / visible en mobile |
| `.sidebar-overlay` | Overlay oscuro al abrir sidebar en mobile |
| `.topbar` | Navbar sticky con sombra |
| `.kpi-card` | Tarjeta de métrica con icono de color |
| `.kpi-icon.blue/green/amber/red/teal/purple` | Variantes del icono |
| `.badge-status.badge-success/warning/danger/info` | Badges con punto de color |
| `.role-badge.role-admin/gerente/cajero/farmaceutico` | Badges de rol |
| `.type-badge.type-medicamento/general/suplemento/equipo` | Badges de tipo de producto |
| `.table-card` | Contenedor de tabla con header/footer |
| `.btn-icon` | Botón icono pequeño para acciones de tabla |
| `.period-pill` / `.period-pill.active` | Pills de filtro de período |
| `.chart-container` / `.chart-container-sm` | Wrapper de canvas Chart.js (altura fija) |
| `.col-secondary` | Columna oculta en <768px (sub-filas) |
| `.expand-row-btn` | Botón chevron visible solo en mobile |
| `.row-detail` / `.row-detail.open` | Sub-fila expandible en mobile |
| `.row-detail-grid` / `.row-detail-item` | Grid 2 col para datos en sub-fila |
| `.wizard-steps` / `.wizard-step` / `.wizard-connector` | UI de pasos tipo wizard |
| `.settings-section` / `.settings-row` | Layout de página de configuración |
| `.coming-soon-badge` | Badge "Próximamente" para features deshabilitadas |

---

## Sucursales (8 total)
1. Central
2. Norte
3. Sur
4. Este
5. Oeste
6. Plaza Mayor
7. Universitaria
8. Industrial

## Tipos de Producto
| Tipo | Badge | Ejemplos |
|---|---|---|
| `medicamento` | Azul | Amoxicilina, Paracetamol, Insulina |
| `general` | Gris | Alcohol, Vendas, Jeringas |
| `suplemento` | Verde | Proteína, Omega-3, Vitamina C |
| `equipo` | Naranja | Glucómetro, Tensiómetro, Termómetro |

## Roles de Usuario
| Rol | Badge | Permisos |
|---|---|---|
| Admin | Rojo | Acceso total |
| Gerente | Azul | Reportes, inventario, transferencias |
| Cajero | Verde | POS, ventas |
| Farmacéutico | Teal | Inventario, transferencias |

---

## Patrones de Implementación

### Tablas ordenables
```javascript
let sortCol = null, sortDir = 1;
function sortTable(col) {
  if (sortCol === col) sortDir *= -1; else { sortCol = col; sortDir = 1; }
  updateSortIcons(); renderTable();
}
// En renderTable(): [...data].sort((a,b) => typeof a[sortCol]==='string'
//   ? a[sortCol].localeCompare(b[sortCol])*sortDir : (a[sortCol]-b[sortCol])*sortDir)
```

### Sub-filas expandibles
```javascript
function toggleRow(btn) {
  btn.closest('tr').nextElementSibling.classList.toggle('open');
  btn.querySelector('i').classList.toggle('fa-chevron-down');
  btn.querySelector('i').classList.toggle('fa-chevron-up');
}
```

### Charts responsivos
```javascript
// Siempre: maintainAspectRatio: false en options
// Siempre: envolver canvas en <div class="chart-container">
const myChart = new Chart(ctx, { options: { responsive: true, maintainAspectRatio: false } });
new ResizeObserver(() => myChart.resize()).observe(canvas.parentElement);
```

### Sesión / Cierre de sesión
- Todos los links "Cerrar sesión" apuntan a `index.html`
- El redirect de inactividad en `configuracion.html` también apunta a `index.html`

### Topbar — icono campana
- El icono `fa-bell` del topbar (`.topbar-icon-btn`) apunta a `alertas.html` en **todos** los archivos

---

## Instrucciones para Modificar

- Todo dato simulado está en bloques `<script>` al final de cada HTML
- Para agregar una nueva sucursal: buscar el array `branches` en cada archivo
- Para cambiar colores: modificar variables en `:root` dentro de `style.css`
- Para agregar una nueva página: copiar la estructura sidebar+topbar de cualquier página existente y ajustar `.nav-link.active`
- Chart.js solo está cargado en `dashboard.html` y `ventas.html`; agregarlo en el `<script src>` si se necesita en otra página
- `html5-qrcode@2.3.8` está cargado en `inventario.html`, `alta-masiva.html` y `pos.html`; el escáner requiere HTTPS o localhost para acceder a la cámara
- Para añadir un tipo de producto nuevo: agregar entrada en `TYPES` (alta-masiva.html), `typeBadge` map (inventario.html) y nueva clase `.type-xxx` en style.css
