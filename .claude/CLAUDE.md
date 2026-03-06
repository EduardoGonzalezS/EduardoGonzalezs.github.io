# FarmaAdmin — Contexto del Proyecto

> **Regla de extensión:** Cuando este archivo supere 150 líneas, mover contenido detallado a archivos `.md` temáticos en `C:\FM\.claude\` y referenciarlos aquí.

## Descripción
Sistema de administración web para una cadena de **8 farmacias**. HTML/CSS/Bootstrap 5 estático (sin backend). Datos simulados con JavaScript inline.

## Objetivo
Sitio responsive (PC, tablet, móvil): ventas, inventario, transferencias, POS, compras, usuarios. Punto de entrada: `index.html`.

---

## Estructura de Archivos

```
C:\FM\
├── style.css              # CSS global compartido
├── index.html             # Login (punto de entrada)
├── dashboard.html         # Panel principal / KPIs y gráficas
├── ventas.html            # Reporte de ventas
├── inventario.html        # Gestión de stock
├── transferencias.html    # Movimientos entre sucursales
├── usuarios.html          # Gestión de usuarios y roles
├── pos.html               # Punto de Venta (sin sidebar)
├── sucursales.html        # Gestión de sucursales
├── configuracion.html     # Configuraciones del sistema
├── alta-masiva.html       # Wizard alta masiva + importar CSV
├── reportes.html          # Módulo "Próximamente"
├── proveedores.html       # CRUD proveedores
├── compras.html           # Órdenes de compra
├── alertas.html           # Centro de alertas
├── perfil.html            # Mi perfil / cambio de contraseña
├── editar-compra.html     # Edición de borrador (desde localStorage 'editDraft')
├── nueva-compra.html      # Nueva orden de compra (página independiente)
└── estimacion.html        # Estimación de costos 2026 (diseño propio, sin sidebar)
```

<!-- ver: modules.md — descripciones detalladas de cada módulo -->

---

## Stack Tecnológico (solo CDN)

| Librería | Versión | Uso |
|---|---|---|
| Bootstrap | 5.3.3 | Layout responsive, componentes UI |
| Font Awesome | 6.5.0 | Íconos |
| Google Fonts (Inter) | 300–800 | Tipografía |
| Chart.js | 4.4.2 | Gráficas (`dashboard.html`, `ventas.html`) |
| html5-qrcode | 2.3.8 | Escáner de código de barras (`inventario.html`, `alta-masiva.html`, `pos.html`) |

<!-- ver: design-system.md — paleta, clases CSS, patrones de implementación -->

---

## Sucursales (8 total)
Central · Norte · Sur · Este · Oeste · Plaza Mayor · Universitaria · Industrial

---

## Instrucciones para Modificar

- Todo dato simulado está en bloques `<script>` al final de cada HTML
- Para agregar una sucursal: buscar array `branches` en cada archivo
- Para cambiar colores: modificar variables en `:root` dentro de `style.css`
- Para agregar una nueva página: copiar sidebar+topbar de cualquier página existente; ajustar `.nav-link.active`; agregar `<script src="sidebar-compact.js"></script>` al final; agregar "Mi perfil" en el dropdown del topbar
- Chart.js: cargado solo en `dashboard.html` y `ventas.html`; agregar CDN si se necesita en otra página
- `html5-qrcode@2.3.8`: requiere HTTPS o localhost para acceder a la cámara
- Para añadir un tipo de producto: agregar en `TYPES` (alta-masiva.html), `typeBadge` map (inventario.html), clase `.type-xxx` en style.css
- `estimacion.html` y `pos.html` no tienen el sidebar estándar; no agregar dropdown de perfil ahí
