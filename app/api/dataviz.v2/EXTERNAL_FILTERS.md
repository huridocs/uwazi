# DataViz external filters

Interactive filters for DataViz charts, driven by custom page HTML/JS. Separate from datasource `query.filters`.

## Page embed (`<Dataviz />`)

```html
<Dataviz id="<chartObjectId>" />
```

```js
document.dispatchEvent(
  new CustomEvent('uwazi:dataviz-filter', {
    detail: {
      // Optional. Omit or '*' = all charts on the page.
      targets: ['chartA', 'chartB'],
      property: 'edad',
      // Optional per-chart property override:
      // properties: { chartA: 'edad', chartB: 'altura' },
      value: { min: 20, max: 40 },
    },
  })
);
```

## Iframe embed (`/embed/dataviz/:id`)

The iframe listens for `window.postMessage` with the **same** detail shape.

```html
<iframe
  id="cars-chart"
  src="https://your-uwazi.example/embed/dataviz/<chartObjectId>?locale=en&parentOrigin=https://your-site.example"
></iframe>
```

`parentOrigin` is required for **cross-origin** parents (added to the iframe allowlist). Same-origin parents are always allowed.

```js
document.getElementById('cars-chart').contentWindow.postMessage(
  {
    type: 'uwazi:dataviz-filter',
    detail: {
      targets: ['<chartObjectId>'], // optional; omit or '*' = this chart if it matches
      property: 'colors',
      value: { values: ['…thesaurusValueId…'] }, // null/undefined clears
    },
  },
  'https://your-uwazi.example' // iframe origin
);
```

Security:
- Messages from origins other than the iframe’s own origin or `parentOrigin` are ignored.
- Only messages with `type: 'uwazi:dataviz-filter'` are handled.

### Value shapes

| Shape | Meaning |
|---|---|
| `{ min, max }` | numeric range |
| `{ from, to }` | date range (unix seconds or ISO date strings) |
| `{ values: string[] }` | thesaurus / select (`in`) |
| `{ value }` | equality |
| `null` or `undefined` | **clear** that property slot |

Filters accumulate per chart by property key. Clearing one property leaves the others intact.

## Backend behaviour

1. Page charts listen on `document` for `uwazi:dataviz-filter`; iframe charts listen on `message`.
2. Active filters are sent as `externalFilters` on `/api/public/dataviz/:id/data`.
3. When any external filters are present, render is **forced live** (snapshots ignored).
4. `resolveExternalFilters` maps each runtime filter onto template properties:
   - exact property name match when compatible with the value shape
   - otherwise auto-match only if the source has exactly one type-compatible property
5. Executor applies them as `scope: 'external'` matches without mutating `query.filters`.

## Separation of concerns

- **Datasource filters** (`query.filters`): authored with the chart; always applied.
- **External filters** (event / postMessage): page-interactive; layered at runtime.

## Files

| Area | Path |
|---|---|
| Schema / event types | `app/shared/types/datavizSchema.ts` |
| Shared accumulate/clear | `app/shared/dataviz/applyDatavizFilterEvent.ts` |
| Page listener | `app/react/V2/Dataviz/embed/useDatavizRuntimeFilters.ts` |
| Iframe bootstrap | `app/react/V2/Dataviz/embed/dataviz-embed.entry.ts` |
| Resolver | `app/api/dataviz.v2/application/services/resolveExternalFilters.ts` |
| Force live + embed | `app/api/dataviz.v2/application/services/resolveDatavizRenderSnapshot.ts` |
| Mongo match | `MongoDatavizQueryExecutor` (`scope === 'external'`) |
