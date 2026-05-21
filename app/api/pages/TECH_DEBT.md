# Pages module — follow-up

## Slug lookup performance

`MongoPagesDataSource.getBySlug` and `existsWithSlug` load all locale-based pages and scan in memory. Acceptable for typical tenant page counts. When scale matters, consider:

- Denormalized `slugs: string[]` on the page document with a Mongo index, or
- An indexed query on `locales.*.slug` (e.g. `$expr` / compound index).

## API projections

- **`pageToClient`** — flat single-language shape for public routes, list, and legacy clients (`Content-Language`).
- **`pageToEditorClient`** / **`applyEditorClientToPage`** — full `locales` map for settings editor (`GET /api/page?mode=editor`, save when `body.locales` is non-empty).
