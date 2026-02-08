# Catalog of BI Tools

An interactive web app showcasing 54 Business Intelligence tools across 4 generations, featuring a filterable table and an interactive quadrant chart.

**Live:** [back1ply.github.io/Catalog-of-BI-tools](https://back1ply.github.io/Catalog-of-BI-tools/)

Based on the [Castor Catalog of BI Tools](https://notion.castordoc.com/catalog-of-bi-tools).

## Features

- **Interactive Quadrant Chart** - Scatter plot mapping tools by generation (x-axis) and user focus (y-axis), with zoom/pan and click-to-inspect
- **Filterable & Sortable Table** - Browse all tools with column sorting and colored badges for multi-value fields
- **Multi-dimension Filters** - Filter by Generation, User Focus, Deployment, Pricing, Query Language, and Optimized For (AND across dimensions, OR within)
- **Text Search** - Search across tool names, features, and integrations
- **Shareable Filters** - Filter state persisted in URL hash
- **Detail Modal** - Click any chart dot or table row to see full tool details

## Tech Stack

| Layer | Choice |
|-------|--------|
| Framework | React 19 + Vite 7 |
| Table | TanStack Table v8 |
| Chart | Chart.js + react-chartjs-2 + chartjs-plugin-zoom |
| Styling | Tailwind CSS v4 |
| Deploy | GitHub Actions + GitHub Pages |

## Getting Started

```bash
npm install
npm run dev
```

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start dev server |
| `npm run build` | Production build to `dist/` |
| `npm run preview` | Preview production build |
| `npm run transform` | Re-generate `src/data/tools.json` from CSV |

## Project Structure

```
src/
  App.jsx                    # Main app shell with view toggle
  components/
    Hero.jsx                 # Header with title, stats, source link
    FilterBar.jsx            # Sticky filter bar with dropdown checkboxes
    ToolTable.jsx            # Sortable table with TanStack Table
    QuadrantChart.jsx        # Chart.js scatter with quadrant zones
    ToolDetailModal.jsx      # Detail overlay on tool click
  hooks/
    useToolFilters.js        # Central filter state + URL hash persistence
  data/
    tools.json               # 54 tools (generated from CSV)
scripts/
  transform-csv.js           # CSV to JSON transformation
```
