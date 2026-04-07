# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**RB Repostería** — Static HTML/CSS site for internal bakery management. No build tools, no JavaScript frameworks, no backend. Open `index.html` directly in a browser.

## Architecture

### Technology
HTML5 + CSS3 + vanilla JavaScript (no frameworks, no bundler, no package manager, no server required). JS is used only where dynamic behavior is needed (dynamic form rows, real-time total calculations).

### File roles
- `index.html` — Dashboard: recipe card grid, stat counters, low-stock alert table
- `receta-detalle.html` — Single recipe: ingredient cost table, 1x/2x/3x scaling table, step-by-step instructions, cost/margin panel
- `receta-nueva.html` — Form to create a new recipe; dynamic ingredient rows (add/remove) + dynamic step rows; `<datalist>` for searchable ingredient input
- `ingredientes.html` — Ingredient catalog table with stock-level indicators
- `ingrediente-detalle.html` — Price history for one ingredient + CSS-only bar chart
- `ingrediente-nuevo.html` — Multi-product purchase capture: shared header (date + store + notes) and dynamic product table with real-time per-row and grand total calculation; collapsible section to register a new ingredient
- `historial-compras.html` — Purchase history grouped by shopping trip using `<details>/<summary>` (no JS); each trip header shows date, store, # products, total; expands to show product detail table; summary-by-ingredient table at bottom
- `lista-compras.html` — Auto-generated shopping list (print-ready via `@media print`)
- `planificacion.html` — Weekly production planner with cost/revenue summary
- `proveedores.html` — Supplier directory (card grid)
- `proveedor-nuevo.html` — Form to register a new supplier

### CSS layer separation (`css/`)
| File | Responsibility |
|---|---|
| `styles.css` | CSS custom properties (design tokens), reset, typography, utility classes |
| `layout.css` | App shell (sidebar + main area), header, page grids, all responsive breakpoints |
| `components.css` | Reusable UI components: cards, tables, badges, forms, buttons, charts |

All three CSS files are linked in every HTML page in this exact order: `styles.css` → `layout.css` → `components.css`.

## Design System

All colors, spacing, radii, and fonts are defined as CSS custom properties in `css/styles.css` under `:root`. **Never hardcode color values in HTML or components** — always reference a `var(--*)` token.

Key token groups:
- `--primario` / `--primario-hover` / `--primario-suave` — main terracotta brand color
- `--fondo-sidebar` / `--fondo-header` — dark brown navigation surfaces
- `--galletas`, `--pasteles`, `--pan`, `--roles`, `--brownies` — category badge colors
- `--exito` / `--alerta` / `--peligro` / `--info` — semantic state colors
- `--radio` / `--radio-sm` / `--radio-xs` — border radii
- `--sombra` / `--sombra-md` / `--sombra-hover` — box shadows
- `--f-titulo` (Playfair Display) / `--f-cuerpo` (Nunito) — font families

## Responsive Layout

Breakpoints in `css/layout.css`:
- `≤1200px` — stats grid: 4→2 columns
- `≤900px` — two-column layouts collapse to single column
- `≤768px` — sidebar hides off-screen; bottom mobile nav activates; header simplifies; hamburger label is hidden (`display: none`)
- `≤640px` — recipe grid goes 1-column, forms collapse to single column
- `≤480px` — further size reductions for very small phones

**Mobile navigation**: at ≤768px, the sidebar is hidden and the bottom `<nav class="nav-mobile">` is the sole navigation. It has 7 items and scrolls horizontally (`overflow-x: auto`, `scrollbar-width: none`). The HTML still includes the CSS checkbox hack elements (`<input type="checkbox" id="menu-toggle">`, `<label class="menu-btn">`) but the label is hidden on mobile — the sidebar can only be reached on desktop.

**Preventing horizontal scroll**: `html`, `body`, and `.contenido-principal` all have `overflow-x: hidden`. `.contenido-principal` also has `min-width: 0; max-width: 100%`.

## Key Patterns

### Sidebar navigation (repeated in every page)
Every HTML file has an identical `<aside class="sidebar">` block and `<nav class="nav-mobile">` block. Mark the active page with `class="sidebar__item activo"` on the correct `<a>` element.

The sidebar includes a link to `historial-compras.html` under the Ingredientes section.

### Mobile nav bar (repeated in every page)
7-item horizontal-scrolling bar at the bottom, active item varies per page:
```html
<nav class="nav-mobile no-print">
  <ul class="nav-mobile__lista">
    <li><a href="index.html" class="nav-mobile__item [activo]"><span class="nav-mobile__icono">🏠</span>Inicio</a></li>
    <li><a href="index.html#recetas" class="nav-mobile__item"><span class="nav-mobile__icono">📖</span>Recetas</a></li>
    <li><a href="ingredientes.html" class="nav-mobile__item"><span class="nav-mobile__icono">🧂</span>Insumos</a></li>
    <li><a href="ingrediente-nuevo.html" class="nav-mobile__item"><span class="nav-mobile__icono">🛒</span>Registrar</a></li>
    <li><a href="historial-compras.html" class="nav-mobile__item"><span class="nav-mobile__icono">📜</span>Historial</a></li>
    <li><a href="lista-compras.html" class="nav-mobile__item"><span class="nav-mobile__icono">📋</span>Compras</a></li>
    <li><a href="planificacion.html" class="nav-mobile__item"><span class="nav-mobile__icono">📅</span>Planif.</a></li>
  </ul>
</nav>
```

Active item mapping: `index.html`→Inicio, `receta-detalle.html`/`receta-nueva.html`→Recetas, `ingredientes.html`/`ingrediente-detalle.html`→Insumos, `ingrediente-nuevo.html`→Registrar, `historial-compras.html`→Historial, `lista-compras.html`→Compras, `planificacion.html`→Planif., `proveedores.html`/`proveedor-nuevo.html`→(none).

### Dynamic form rows (vanilla JS)
`ingrediente-nuevo.html` and `receta-nueva.html` use vanilla JS for add/remove rows. Pattern:
- `agregarFila()` — clones a template row and appends it, renumbering `name` attributes (`prod_N`, `cant_N`, etc.)
- `eliminarFila(btn)` — removes the closest `<tr>`, renumbers remaining rows
- `calcularFila(input)` — on `oninput`: reads qty × price from the same `<tr>`, updates `.celda-total`, then calls `actualizarTotalGeneral()`
- Inputs use `<datalist id="lista-ingredientes">` for searchable ingredient selection

### Collapsible sections (`<details>/<summary>`)
Used in `historial-compras.html` for shopping trips (class `.viaje-compra`) and in `ingrediente-nuevo.html` for the "registrar nuevo ingrediente" section. No JS required. The CSS for `.viaje-compra` is inlined in `historial-compras.html` via `<style>` block (not in the shared CSS files).

### Tables
Always wrap `<table class="tabla-rb">` inside both `.tabla-contenedor` (provides card styling + border-radius) and `.tabla-scroll` (provides `overflow-x: auto` for mobile):
```html
<div class="tabla-contenedor">
  <div class="tabla-scroll">
    <table class="tabla-rb">...</table>
  </div>
</div>
```

### CSS-only bar chart (`ingrediente-detalle.html`)
Bars are `<div class="grafica-barras__relleno">` with inline `style="width: X%"`. The percentage is relative to the maximum price in the series — calculate it manually when adding data.

### Print support
Pages with `class="no-print"` on elements hide them via `@media print`. `lista-compras.html` and `receta-detalle.html` have dedicated print layouts.

### Category badges
Use the correct badge class to match the recipe category:
`badge-galletas` / `badge-pasteles` / `badge-pan` / `badge-roles` / `badge-brownies`

### Stock indicators
```html
<div class="indicador-stock stock-bueno|stock-bajo|stock-agotado">
  <span class="indicador-stock__punto"></span> X g
</div>
```

## Data
All data is hardcoded in HTML. There is no database, API, or localStorage. Forms use `action="..."` pointing to another HTML page to simulate navigation — they do not persist data.
