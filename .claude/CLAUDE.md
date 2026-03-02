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
├── login.html             # Pantalla de inicio de sesión
├── dashboard.html         # Panel principal / KPIs y gráficas
├── ventas.html            # Reporte de ventas por período y sucursal
├── inventario.html        # Gestión de stock, vencimientos, alertas
├── transferencias.html    # Movimientos de medicamentos entre sucursales
├── usuarios.html          # Gestión de usuarios, roles y permisos
└── pos.html               # Punto de Venta (POS)
```

---

## Stack Tecnológico (solo CDN, sin instalación)

| Librería | Versión | Uso |
|---|---|---|
| Bootstrap | 5.3.3 | Layout responsive, componentes UI |
| Font Awesome | 6.5.0 | Íconos en todo el sitio |
| Google Fonts (Inter) | 300–800 | Tipografía principal |
| Chart.js | 4.4.2 | Gráficas (solo `dashboard.html` y `ventas.html`) |

---

## Módulos del Sistema

### 1. Login (`login.html`)
- Fondo gradiente azul marino (`#0d2d5e → #2563eb`)
- Píldoras flotantes animadas de decoración
- Tarjeta centrada con logo, usuario, contraseña, recordar sesión
- Muestra las 8 sucursales activas al pie

### 2. Dashboard (`dashboard.html`)
- 4 KPI cards: Ventas Hoy, Semana, Mes, Medicamentos por Vencer
- Line chart: ventas últimos 30 días (Chart.js)
- Doughnut chart: % ventas por sucursal (Chart.js)
- Tabla de últimas ventas en tiempo real
- Lista de alertas (por vencer, stock bajo, agotados)
- Cards de desempeño por sucursal con progress bars
- Pills de filtro: Hoy / Semana / Mes / Año

### 3. Ventas (`ventas.html`)
- Filtros: sucursal, rango de fechas, período rápido
- 4 KPIs: total ventas, tickets, promedio/ticket, top sucursal
- Bar chart: ventas por sucursal
- Line chart: comparativa esta semana vs semana anterior
- Tabla paginada con folio, sucursal, cajero, total, estado
- Modal de detalle de venta con desglose de medicamentos

### 4. Inventario (`inventario.html`)
- 4 KPIs: total productos, stock crítico, por vencer (7 días), agotados
- Cards de stock por sucursal con progress bars
- 4 tabs: Todo el Inventario / Por Vencer / Stock Bajo / Agotados
- Filtros: búsqueda, sucursal, categoría
- Tabla con badges de estado (OK/Por Vencer/Stock Bajo/Agotado)
- Modal de ajuste de stock (entrada/salida/corrección)
- Modal de nuevo medicamento

### 5. Transferencias (`transferencias.html`)
- 4 KPIs: pendientes, en tránsito, recibidas hoy, este mes
- Formulario con indicador visual origen → destino
- Autocomplete para búsqueda de medicamentos
- Modal de confirmación con resumen de la transferencia
- Historial paginado con badges: Pendiente / En Tránsito / Recibido

### 6. Usuarios (`usuarios.html`)
- 4 KPIs: total usuarios, activos, inactivos, conectados ahora
- Cards de distribución por rol (Admin / Gerente / Cajero / Farmacéutico)
- Filtros por rol, sucursal y estado
- Tabla con avatar, nombre, email, sucursal, rol, último acceso
- Toggle switch para activar/desactivar usuario
- Modal de nuevo usuario con checklist de permisos por módulo
- Modal de edición, modal de permisos detallado, modal de confirmación de eliminación

### 7. POS — Punto de Venta (`pos.html`)
- Topbar propio (sin sidebar) con reloj en tiempo real
- Barra de búsqueda grande + botones escanear/QR
- Chips de categorías horizontales con scroll
- Grid de producto cards con foto, precio, stock y botón Agregar
- Carrito con controles de cantidad (+/-), botón quitar, descuento %
- Totales: subtotal, descuento, IVA, TOTAL
- 3 métodos de pago: Efectivo / Tarjeta / Mixto
- Modal de cobro con botones de montos rápidos y cálculo de cambio automático
- Modal de venta exitosa con folio y opción de imprimir

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
| `.table-card` | Contenedor de tabla con header/footer |
| `.btn-icon` | Botón icono pequeño para acciones de tabla |
| `.period-pill` / `.period-pill.active` | Pills de filtro de período |

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

## Roles de Usuario
| Rol | Badge | Permisos |
|---|---|---|
| Admin | Rojo | Acceso total |
| Gerente | Azul | Reportes, inventario, transferencias |
| Cajero | Verde | POS, ventas |
| Farmacéutico | Teal | Inventario, transferencias |

---

## Instrucciones para Modificar

- Todo dato simulado está en bloques `<script>` al final de cada HTML
- Para agregar una nueva sucursal: buscar el array `branches` en cada archivo
- Para cambiar colores: modificar variables en `:root` dentro de `style.css`
- Para agregar una nueva página: copiar la estructura sidebar+topbar de cualquier página existente y ajustar `.nav-link.active`
- Chart.js solo está cargado en `dashboard.html` y `ventas.html`; agregarlo en el `<script src>` si se necesita en otra página
