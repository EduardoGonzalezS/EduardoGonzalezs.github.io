# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Repostería Belén** — Static HTML/CSS site for internal bakery management. Frontend is plain HTML/CSS/vanilla JS (no build tools, no frameworks), but it connects to a **Google Apps Script** Web App backed by Google Sheets via `fetch` calls. The brand was previously "RB Repostería"; the visible icon is `🧁` and the sidebar reads "Repostería / Belén".

Open any `.html` directly in a browser (or via a static server). The Apps Script URL is hardcoded in `js/api.js` (`API_URL`).

## Architecture

### Technology
HTML5 + CSS3 + vanilla JavaScript (no frameworks, no bundler, no package manager). The "backend" is a single Apps Script project (`apps-script-code.js`) deployed as a Web App, hitting a Google Sheets spreadsheet (one tab per entity).

### Pages (`*.html`)
- `index.html` — Dashboard: recipe card grid, stat counters, low-stock alert table.
- `receta-detalle.html` — Single recipe view; **buttons "✏️ Editar" (links to `receta-nueva.html?id=X`) and "🗑️ Eliminar"**.
- `receta-nueva.html` — Form to create OR edit a recipe (modo edición vía `?id=X`); dynamic ingredient rows + dynamic step rows.
- `ingredientes.html` — Ingredient catalog table with stock-level indicators; "+ Nuevo ingrediente" links to `producto-nuevo.html`.
- `ingrediente-detalle.html` — Price history for one ingredient + CSS-only bar chart.
- `producto-nuevo.html` — Dedicated page to register a new ingredient (split out from `ingrediente-nuevo.html`).
- `ingrediente-nuevo.html` — **Multi-product purchase capture, also EDIT mode via `?id=X`**. Dynamic product table with combobox for ingredient + combobox for "Lugar de compra" (proveedores). Inline link `→ Regístralo primero` to `producto-nuevo.html` if the ingredient doesn't exist.
- `historial-compras.html` — Purchase history. Shows latest 5; "Mostrar más (5)" button paginates progressively. Each viaje has **✏️ Editar** and **🗑️ Eliminar** buttons.
- `lista-compras.html` — Auto-generated shopping list (print-ready via `@media print`).
- `planificacion.html` — Weekly production planner.
- `proveedores.html` — Supplier directory (card grid). Each card has **✏️ Editar** linking to `proveedor-nuevo.html?id=X`.
- `proveedor-nuevo.html` — Form to create OR edit a supplier (`?id=X`).
- `setup.html` — Setup guide (instructional; not part of the app data flow).

### JS files (`js/`)
| File | Responsibility |
|---|---|
| `api.js` | `getData(entity, params)` (GET), `postData(entity, data)` (POST), `urlParam(key)`, `fmtMoneda`, `formatFecha`, `mostrarCargando`, `mostrarError`, `getStockBajo` |
| `render.js` | All HTML-string render functions: `renderTarjetasRecetas`, `renderTablaIngredientes`, `renderHistorialCompras(compras, detalle, limit)`, `renderProveedores`, `renderListaCompras`, `renderInfoIngrediente`, `renderHistorialPrecios`, `renderGraficaPrecios`, `renderResumenPorIngrediente`, `renderHeroReceta`, `renderColIzqReceta`, `renderColDerReceta`, `renderIngredientesReceta`, `renderPlanificacionFilas`, `renderTablaStockBajo`, `renderAlertaBanner` |
| `combobox.js` | Reusable `Combobox` component (search-select). API: `Combobox.init(rootEl, fuente)` where `fuente` is a function returning an array of strings or `{nombre}` objects |
| `theme.js` | Theme switcher (4 themes). Applies `data-theme` to `<html>` ASAP from `localStorage["rb-theme"]`, then injects the swatch UI into `.header-pagina__der` on `DOMContentLoaded` |

Every page links these scripts in `<head>` in this order: `api.js` → `render.js` → `combobox.js` (if used) → `theme.js`.

### CSS files (`css/`)
| File | Responsibility |
|---|---|
| `styles.css` | CSS custom properties (design tokens), reset, typography, utility classes |
| `layout.css` | App shell (sidebar + main area), header, page grids, all responsive breakpoints |
| `components.css` | Reusable UI components: cards, tables, badges, forms, buttons, charts, combobox, aviso-info |
| `themes.css` | 4 themes (`[data-theme="terracotta|rosa|lila|amarillo"]`) + `.theme-switch` and `.theme-swatch` styles |

All four CSS files are linked in every HTML in this exact order: `styles.css` → `layout.css` → `components.css` → `themes.css`.

### Backend (`apps-script-code.js`)
Single Apps Script file, deployed as Web App. URL goes in `js/api.js:API_URL`.

- `doGet(e)` — reads from a sheet tab named after `entity`, with optional filters (`receta_id`, `compra_id`).
- `doPost(e)` — discriminates by `entity` and `data`:
  - **`entity === 'compra'`**:
    - `_action === 'delete' && id` → `handleCompraDelete` (removes from `compras` + `compras_detalle`, reverts stock, recalculates ingredient prices).
    - `id` present → `handleCompraUpdate` (reverts old stock, replaces detail lines, applies new stock, recalcs prices).
    - else → `handleCompra` (insert + applies stock + sets precio_actual/precio_por_base).
  - **`entity === 'receta'`**:
    - `_action === 'delete' && id` → `handleRecetaDelete`.
    - `id` present → `handleRecetaUpdate` (deletes old recetas_ingredientes, recalcs costo_total, updates recetas row, reinserts).
    - else → `handleReceta` (insert + calculates cost from `precio_por_base`).
  - **`entity === 'proveedores' | 'ingredientes'`**: simple insert via `appendRow`, OR update via `updateRow` if `data.id` is present.
- Helpers: `sheetToJSON`, `appendRow` (auto-assigns `id`, `created_at`, `updated_at`), `updateRow`, `deleteRowsByField`, `recalcPreciosIngredientes`, `ajustarStock`, `convertToBase`, `calcPrecioBase`.

> **Any change to `apps-script-code.js` requires a redeploy** in script.google.com → Implementar → Administrar implementaciones → ✏️ → Versión: "Nueva versión". The `/exec` URL stays the same.

## Design System & Themes

Tokens live in `css/styles.css :root`. **Never hardcode colors in HTML or components — always use `var(--*)` tokens.**

### Token groups
- `--primario` / `--primario-hover` / `--primario-suave` — main brand color (changes per theme)
- `--acento` / `--acento-suave` — secondary accent (changes per theme; used on table-row hover via `--acento-suave`)
- `--fondo-sidebar` — desktop sidebar AND mobile nav background (changes per theme)
- `--fondo-header` — table thead, panel-costos, hero-receta dark surface (changes per theme)
- `--info` / `--info-suave` / `--info-texto` — info banners (changes per theme)
- `--exito` / `--alerta` / `--peligro` — semantic state colors (NOT themed; semantic by design)
- `--galletas`, `--pasteles`, `--pan`, `--roles`, `--brownies` — recipe category badges (NOT themed)
- `--radio` / `--radio-sm` / `--radio-xs` — border radii
- `--sombra` / `--sombra-md` / `--sombra-hover` — box shadows
- `--f-titulo` (Playfair Display) / `--f-cuerpo` (Nunito) — font families

### Theme switcher
Persists in `localStorage["rb-theme"]`. `js/theme.js` applies `data-theme` to `<html>` synchronously on parse (no FOUC), then on `DOMContentLoaded` injects `.theme-switch` (4 swatches) into `.header-pagina__der`.

Behavior:
- Closed by default — only the active swatch is visible (with a dashed pulsing ring as discoverability hint).
- Click on the active swatch → toggles `.open` class, the other 3 swatches animate in with staggered delay.
- Click on a non-active swatch → applies theme + closes.
- Click outside `.theme-switch` or press `Esc` → closes.

## Responsive Layout

Breakpoints in `css/layout.css`:
- `≤1200px` — stats grid: 4→2 columns
- `≤900px` — two-column layouts collapse to single column
- `≤768px` — sidebar hides off-screen; bottom mobile nav activates; hamburger label is `display: none`
- `≤640px` — recipe grid → 1 column, forms collapse to single column, **`.tabla-compra` collapses to vertical cards** (each `<td>` becomes a labeled row using `data-label` + CSS pseudo-element)
- `≤480px` — further reductions

**Preventing horizontal scroll**: `html`, `body`, `.contenido-principal` all have `overflow-x: hidden`. `.contenido-principal` also has `min-width: 0; max-width: 100%`.

## Key Patterns

### Sidebar navigation (repeated in every page)
Every HTML has the same `<aside class="sidebar">` block. The logo is `<div class="sidebar__logo-icono">🧁</div>` with title "Repostería" / "Belén". The footer is `Repostería Belén © 2026`.

Sections: Principal · Recetas · Ingredientes (`Catálogo` / `Nuevo ingrediente` / `Registrar compra` / `Historial de compras`) · Proveedores · Herramientas. Mark the active page with `class="sidebar__item activo"`.

### Mobile nav bar (8 items, repeated in every page)
```html
<nav class="nav-mobile no-print">
  <ul class="nav-mobile__lista">
    <li><a href="index.html" class="nav-mobile__item [activo]"><span class="nav-mobile__icono">🏠</span>Inicio</a></li>
    <li><a href="index.html#recetas" ...><span>📖</span>Recetas</a></li>
    <li><a href="ingredientes.html" ...><span>🧂</span>Insumos</a></li>
    <li><a href="ingrediente-nuevo.html" ...><span>🛒</span>Registrar</a></li>
    <li><a href="historial-compras.html" ...><span>📜</span>Historial</a></li>
    <li><a href="lista-compras.html" ...><span>📋</span>Compras</a></li>
    <li><a href="planificacion.html" ...><span>📅</span>Planif.</a></li>
    <li><a href="proveedores.html" ...><span>🏪</span>Provs.</a></li>
  </ul>
</nav>
```

Active item mapping: `index.html`→Inicio · `receta-detalle.html`/`receta-nueva.html`→Recetas · `ingredientes.html`/`ingrediente-detalle.html`/`producto-nuevo.html`→Insumos · `ingrediente-nuevo.html`→Registrar · `historial-compras.html`→Historial · `lista-compras.html`→Compras · `planificacion.html`→Planif. · `proveedores.html`/`proveedor-nuevo.html`→Provs.

### Combobox component (`js/combobox.js`)
Replaces native `<datalist>` for searchable selectors. Used in `ingrediente-nuevo.html` (column "Ingrediente" + "Lugar de compra") and `receta-nueva.html` (column "Ingrediente").

Markup:
```html
<div class="combobox">
  <input type="text" class="combobox__input" name="..." placeholder="Buscar..." autocomplete="off">
  <ul class="combobox__lista" role="listbox" hidden></ul>
</div>
```

Init pattern (after fetching the catalog):
```js
let CATALOGO = [];
const fuente = () => CATALOGO;
Combobox.init(document.getElementById('container'), fuente);
getData('ingredientes').then(ings => {
  CATALOGO = ings.map(i => i.nombre).filter(Boolean);
});
```

For dynamic rows (cloning), call `Combobox.init(filaNueva, fuente)` after appending the new row.

### Tables containing combobox dropdowns
The combobox absolute-positioned dropdown gets clipped by `.tabla-contenedor` (`overflow:hidden`) and `.tabla-scroll` (`overflow-x:auto`). To allow it to escape, add the modifier class `.tabla-contenedor--overflow`:
```html
<div class="tabla-contenedor tabla-contenedor--overflow">
  <div class="tabla-scroll">
    <table class="tabla-rb tabla-compra">...</table>
  </div>
</div>
```

### Dynamic form rows (vanilla JS)
`ingrediente-nuevo.html` and `receta-nueva.html` clone template rows. Pattern:
- `agregarFila()` — appends a row, renumbers `name` attributes (`prod_N`, `cant_N`, `und_N`, `precio_N`), inits combobox, focuses the new input.
- `eliminarFila(btn)` — removes the closest `<tr>`, calls `renumerarFilas()`.
- `calcularFila(input)` — on `oninput` in `ingrediente-nuevo.html`: reads qty × price, updates `.celda-total`, calls `actualizarTotalGeneral()`. Note: `tr.cells[1].querySelector('input')` works through the combobox wrapper.

### Edit / delete patterns (entity?id=X)
The same form pages double as edit pages by checking `urlParam('id')`:
- `ingrediente-nuevo.html?id=X` — edit a compra
- `receta-nueva.html?id=X` — edit a recipe
- `proveedor-nuevo.html?id=X` — edit a supplier

In edit mode the form: changes `<title>`, header text, breadcrumb, submit button (`💾 Guardar cambios`), reveals a `🗑️ Eliminar` button, loads existing data and fills fields, and on submit includes `id` in the payload (the backend distinguishes update vs insert by `id` presence).

For deletes, `postData(entity, { id, _action: 'delete' })` triggers the corresponding `handle*Delete`.

### Pagination (`historial-compras.html`)
Shows the latest `LIMITE_MOSTRAR` (5) sorted by date desc. State variables: `COMPRAS_TODAS`, `DETALLE_TODAS`, `LIMITE_MOSTRAR`, `PASO_MOSTRAR = 5`. `refrescarHistorial()` re-renders and toggles the "Mostrar más (N)" button visibility. Stats above the list always reflect the total, never the limit. `renderHistorialCompras(compras, detalle, limit)` accepts `limit` as third arg and slices the sorted array.

### Auto-create proveedor on compra capture
When saving a compra in `ingrediente-nuevo.html`, if `lugar` is non-empty and not in `CATALOGO_PROVEEDORES`, the form first POSTs a minimal proveedor record (categoria `varios`, tipo `tienda`, with a note explaining auto-creation) before posting the compra. If the proveedor creation fails, the compra still saves.

### Collapsible sections (`<details>/<summary>`)
Used in `historial-compras.html` for shopping trips (class `.viaje-compra` — its CSS is inlined in the page's `<style>` block). The `<details class="seccion-colapsable">` with "registrar nuevo ingrediente" was REMOVED from `ingrediente-nuevo.html`; ingredient registration now lives in its own page (`producto-nuevo.html`).

### Tables (standard wrapper)
```html
<div class="tabla-contenedor">
  <div class="tabla-scroll">
    <table class="tabla-rb">...</table>
  </div>
</div>
```
Add `tabla-contenedor--overflow` if any cell hosts a combobox. Add `tabla-compra` to the `<table>` and `data-label` on each `<td>` to enable mobile cards.

### CSS-only bar chart (`ingrediente-detalle.html`)
Bars are `<div class="grafica-barras__relleno">` with inline `style="width: X%"`. Percentage is relative to the maximum price in the series — calculated by `renderGraficaPrecios` in `render.js`.

### Print support
Elements with `class="no-print"` are hidden via `@media print { display: none !important }` (rule in `layout.css`). `lista-compras.html` and `receta-detalle.html` have dedicated print layouts. The theme switch is hidden in print.

### Category badges
`badge-galletas` / `badge-pasteles` / `badge-pan` / `badge-roles` / `badge-brownies`.

### Stock indicators
```html
<div class="indicador-stock stock-bueno|stock-bajo|stock-agotado">
  <span class="indicador-stock__punto"></span> X g
</div>
```

## Data persistence

All data lives in a Google Sheets spreadsheet, one tab per entity: `recetas`, `recetas_ingredientes`, `ingredientes`, `compras`, `compras_detalle`, `proveedores`. `apps-script-code.js` is the API layer; `js/api.js` is the frontend client. `appendRow` auto-assigns `id`, `created_at`, `updated_at`.

`localStorage` is only used for `"rb-theme"` (the user's selected color theme). No other client-side persistence.

## Common gotchas

- **Apps Script redeploy**: any change to `apps-script-code.js` requires Manage deployments → New version. Skipping this leaves the frontend calling old code.
- **Stock side-effects**: editing or deleting a compra reverts and reapplies stock changes via `ajustarStock(sh, lineas, signo)`. Recipes don't touch stock.
- **Price recalc**: after compra update/delete, `recalcPreciosIngredientes(ss, nombres)` rewrites `precio_actual` and `precio_por_base` to the most-recent `compras_detalle` line per affected ingredient (sorted by parent compra date). If no lines remain, both go to `0`.
- **Theme tokens that are NOT themed**: `--exito`, `--alerta`, `--peligro` and category badges are intentionally fixed (semantic colors). Don't theme them.
- **Combobox blur timing**: there's a 120ms delay on input blur to let `mousedown` on a list item fire before the list closes. If you observe selection issues, that's the safety window.
