# Entity V2 — Phased relationship read APIs (summary, anchors, resolved)

## Title

`Entity V2 — add phased relationship read endpoints (summary, anchors, resolved)`

## Description

### Problem

Entity V2 loads the full `entity.relations` graph in the route loader (`omitRelationships: false`). That payload can be multi‑megabyte (gzip) on large entities and is reused for document markers and the relationships list.

Related: [#9489](https://github.com/huridocs/uwazi/issues/9489) — the Relationships tab uses `RenderIfVisible`, so crawlers need a plain SSR list (same idea as document plaintext SSR).

**Expand all** opens every group/tree card, so every relationship must be **navigable** without N+1 fetches. A first approach should load missing connection text/display fields in **one** request, then merge with already-fetched lean data in a **local (entity-scoped) provider store**.

V2 does **not** use `/api/references/by_document` today (V1 Viewer path).

### Goal

Add **domain-oriented read projections** (names describe the data, not a specific UI surface):

1. **`summary`** — entity-scoped lean connection index for SSR (#9489) and grouping/filtering the full set on first load.
2. **`anchors`** — document-scoped selection geometry (**first rectangle only**); clustering stays client-side.
3. **`resolved`** — **one** entity-scoped payload with remaining fields (reference text, titles, nav anchors) so the full set is navigable after expand-all; client merges with `/summary` (+ `/anchors` when present) into a scoped provider atom.

Defer per-id multi-rectangle selection geometry to a later phase.

### Why this split

| Path | Scope | Role |
|------|--------|------|
| `/summary` | Entity-total | Lean index; SSR + group/filter; reused in the local atom |
| `/anchors` | One file | First-rect selection points (~23 KB gzip on Banjul doc0 sample) |
| `/resolved` | Entity-total | Delta / remaining display fields so expand-all is navigable in one fetch |

Keep file-scoped anchors separate from entity-scoped summary/resolved. Do **not** combine into one mega-endpoint. Do **not** use per-row fetches for expand-all in v1.

Patterns: progressive critical path ([BFF progressive loading](https://paulserban.eu/blog/post/backend-for-frontend-enhancing-user-experience-with-bff/)); combine data that expand-all always needs together; keep optional document geometry and later multi-rect highlight separate.

### Proposed endpoints

#### 1) `GET /api/relationships/v2/summary?sharedId=&lang=`

Lean entity-scoped connection index.

```json
{
  "selfSharedId": "...",
  "total": 2065,
  "entities": { "<sharedId>": { "title": "...", "templateId": "..." } },
  "rows": [
    {
      "id": "...",
      "hub": "...",
      "type": "...",
      "targetSharedId": "...",
      "direction": "outgoing|incoming|both",
      "page": 3,
      "hasAnchor": true
    }
  ]
}
```

No nested `entityData.documents` / `metadata`. SSR renders a semantic list (no `RenderIfVisible`).

#### 2) `GET /api/relationships/v2/anchors?sharedId=&file=&lang=`

Document-scoped selection anchors (first rect only: `page` / `top` / `height`). No precomputed screen-space clusters.

#### 3) `GET /api/relationships/v2/resolved?sharedId=&lang=`

One-shot entity-total projection with reference text and remaining display fields. Called once when consumers need full navigability.

```json
{
  "selfSharedId": "...",
  "items": [
    {
      "id": "...",
      "text": "...",
      "page": 3,
      "top": 247,
      "height": 14,
      "targetSharedId": "...",
      "targetTitle": "...",
      "targetTemplateId": "...",
      "hub": "...",
      "type": "...",
      "direction": "outgoing|incoming|both"
    }
  ]
}
```

Prefer a **delta** vs `/summary` / `/anchors` (always include `id` + missing fields). Client merges by connection id into an entity-scoped `RelationshipsDataProvider` under `EntityScopedProvider`. Expand-all must not trigger per-relationship network calls.

### Loader / client (same or child issues)

- Entity loader: `omitRelationships: true`; SSR fetch `/summary` (like `getDocumentPlaintext`).
- Document open: fetch `/anchors`.
- Interactive list: fetch `/resolved` once; merge summary + resolved (+ anchors) into the scoped store; UI reads merged markers only.
- Permissions must match current hub / unpublished rules.

### Acceptance criteria

- [ ] Three GET contracts documented and tested (`summary`, `anchors`, `resolved`).
- [ ] SSR Relationships main tab HTML lists targets/types without JS (#9489).
- [ ] Document markers first paint does not require full `entity.relations`; uses first rectangle only via `/anchors`.
- [ ] Clients can group the full set from `/summary`; after one `/resolved` merge, expand-all is navigable with no N+1 fetches.
- [ ] Merged data lives in an entity-scoped provider store (not a global singleton).
- [ ] No server-computed screen-space clusters.
- [ ] Connected entity projection excludes documents/metadata bloat.
- [ ] Path names stay domain-oriented (no UI-surface coupling in the public API).

### Out of scope (v1)

- GraphQL
- Per-id endpoint for full multi-rect selection geometry (phase 2)
- Replacing V1 Viewer `by_document` in the first PR
- Committing large production dumps to the repo
