# DataViz external filters (CustomEvent)

Interactive page filters for DataViz charts, driven by custom page HTML/JS via a DOM `CustomEvent`. Separate from datasource `query.filters`.

## Embed

```html
<Dataviz id="<chartObjectId>" />
```

## Dispatch filters

```js
document.dispatchEvent(
  new CustomEvent('uwazi:dataviz-filter', {
    detail: {
      // Optional. Omit or '*' = all charts on the page.
      targets: ['chartA', 'chartB'],
      // Accumulation key / property hint (exact name preferred).
      property: 'edad',
      // Optional per-chart property override:
      // properties: { chartA: 'edad', chartB: 'altura' },
      value: { min: 20, max: 40 },
    },
  })
);
```

### Value shapes

| Shape | Meaning |
|---|---|
| `{ min, max }` | numeric range |
| `{ from, to }` | date range (unix seconds or ISO date strings) |
| `{ values: string[] }` | thesaurus / select (`in`) |
| `{ value }` | equality |
| `null` or `undefined` | **clear** that property slot for the targeted charts |

Filters accumulate per chart by property key. Clearing one property leaves the others intact.

### Targeting

- Charts whose id is not in `targets` ignore the event (silent).
- If no matching chart is mounted, nothing happens.

## Backend behaviour

1. Each mounted chart listens on `document` for `uwazi:dataviz-filter`.
2. Active filters are sent as `externalFilters` query param on `/api/public/dataviz/:id/data`.
3. When any external filters are present, render is **forced live** (snapshots ignored).
4. `resolveExternalFilters` maps each runtime filter onto template properties:
   - exact property name match when compatible with the value shape
   - otherwise auto-match only if the source has exactly one type-compatible property
5. Executor applies them as `scope: 'external'` matches without mutating `query.filters`. Date types use overlap / `elemMatch` matching.

## Separation of concerns

- **Datasource filters** (`query.filters`): authored with the chart; always applied.
- **External filters** (this event): page-interactive; layered at runtime.

## Files

| Area | Path |
|---|---|
| Schema / event types | `app/shared/types/datavizSchema.ts` |
| Client listener | `app/react/V2/Dataviz/embed/useDatavizRuntimeFilters.ts` |
| Resolver | `app/api/dataviz.v2/application/services/resolveExternalFilters.ts` |
| Force live + embed | `app/api/dataviz.v2/application/services/resolveDatavizRenderSnapshot.ts` |
| Mongo match | `MongoDatavizQueryExecutor` (`scope === 'external'`) |
