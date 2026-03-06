# FarmaAdmin — Design System

## Paleta de Colores
```css
--sidebar-bg:    #0d2d5e;   /* Azul marino profundo */
--sidebar-hover: #1a4a8a;
--sidebar-active:#2563eb;
--body-bg:       #f0f4f8;   /* Gris azulado claro */
--primary:       #2563eb;
--green:         #16a34a;
--amber:         #d97706;
--red:           #dc2626;
--teal:          #0ea5e9;
```

## Layout Responsive
- **≥992px**: Sidebar fijo 260px + topbar con offset; main content con margen izquierdo
- **<992px**: Sidebar → offcanvas (`.show` class via JS) + overlay oscuro
- **<768px**: Sub-filas expandibles; columnas secundarias ocultas (`.col-secondary`)
- **<576px**: Padding reducido, search bar oculto, tipografía ajustada

## Componentes CSS (style.css)
| Clase | Descripción |
|---|---|
| `.sidebar` / `.sidebar.show` | Sidebar fijo / visible en mobile |
| `.sidebar-overlay` | Overlay oscuro al abrir sidebar en mobile |
| `.topbar` | Navbar sticky con sombra |
| `.kpi-card` | Tarjeta de métrica con icono de color |
| `.kpi-icon.blue/green/amber/red/teal/purple` | Variantes del icono KPI |
| `.badge-status.badge-success/warning/danger/info` | Badges con punto de color |
| `.role-badge.role-admin/gerente/cajero/farmaceutico` | Badges de rol |
| `.type-badge.type-medicamento/general/suplemento/equipo` | Badges de tipo de producto |
| `.table-card` | Contenedor de tabla con header/footer |
| `.btn-icon` | Botón icono pequeño para acciones de tabla |
| `.period-pill` / `.period-pill.active` | Pills de filtro de período |
| `.chart-container` / `.chart-container-sm` | Wrapper de canvas Chart.js (altura fija) |
| `.col-secondary` | Columna oculta en <768px |
| `.expand-row-btn` | Botón chevron visible solo en mobile |
| `.row-detail` / `.row-detail.open` | Sub-fila expandible en mobile |
| `.row-detail-grid` / `.row-detail-item` | Grid 2 col para datos en sub-fila |
| `.wizard-steps` / `.wizard-step` / `.wizard-connector` | UI de pasos tipo wizard |
| `.settings-section` / `.settings-row` | Layout de configuración |
| `.coming-soon-badge` | Badge "Próximamente" |

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

## Patrones de Implementación

### Tablas ordenables
```javascript
let sortCol = null, sortDir = 1;
function sortTable(col) {
  if (sortCol === col) sortDir *= -1; else { sortCol = col; sortDir = 1; }
  updateSortIcons(); renderTable();
}
// renderTable(): [...data].sort((a,b) => typeof a[sortCol]==='string'
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
// Siempre maintainAspectRatio: false; envolver canvas en <div class="chart-container">
const myChart = new Chart(ctx, { options: { responsive: true, maintainAspectRatio: false } });
new ResizeObserver(() => myChart.resize()).observe(canvas.parentElement);
```

### Sesión y navegación
- Todos los links "Cerrar sesión" → `index.html`
- Link "Mi perfil" en dropdown del topbar → `perfil.html` en todos los archivos
- Icono `fa-bell` del topbar (`.topbar-icon-btn`) → `alertas.html` en todos los archivos
- Redirect de inactividad en `configuracion.html` → `index.html`
