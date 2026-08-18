---
description: Re-verify docs/migration-status.html against the tree and update it
---

Refresh the V1→V2 / Mongo→Postgres migration dashboard at `docs/migration-status.html`.

The split of responsibility is fixed: **`scripts/migrationStatus.mjs` owns the `data-db`
status attributes; you own the prose.** Never hand-edit a count or a meter — they are
computed from the row attributes at render time.

## Steps

1. Run `yarn migration-status`. It prints the derived Postgres signals per area (schema
   migration, data source, wired flag, backfill config, advisory consistency suite), plus
   any drift between the tree and the dashboard.

2. Resolve every line under `Drift`:
   - **Status mismatch** — the tree is right and the page is stale. Update that row's
     `data-db` attribute, its pill (class *and* text must match the attribute), and its
     note.
   - **Untracked data source / flag / backfill config** — someone started a new area.
     Add it to the `AREAS` registry in `scripts/migrationStatus.mjs` *and* add a row.
   - **Missing row** — a registry entry has no `data-area` row in the page.

3. The `data-v2` column is not machine-derivable. Re-check it by hand only for areas
   that changed: an area is `done` when its domain, use cases and delivery adapters live
   under `app/api/core` with no `v1_layer` bridge and no legacy module still serving its
   routes; `partial` when some of it moved or it sits in the older `*.v2` generation;
   `todo` when untouched.

4. Re-read the prose sections against reality — do not carry stale claims forward:
   - **Next up** — reorder if the front changed; drop items that shipped.
   - **Watch-outs** — verify each card still holds.
   - Notes in rows you touched.

5. Update the stamp under the title: commit (`git rev-parse --short HEAD`), branch, and
   today's date. Only stamp what you actually verified by reading code.

6. Run `yarn migration-status` again — it must exit clean, and
   `npx prettier --check docs/migration-status.html` must pass.

7. Republish the shared page, passing the existing URL so the team's link keeps working:

   ```
   Artifact(file_path: "docs/migration-status.html",
            url: "https://claude.ai/code/artifact/996940a9-4b1c-4513-9e3e-0f0029700473",
            favicon: "🗂️", label: "<week or short change note>")
   ```

   Publishing without `url` creates a *separate* artifact and orphans the link people
   have bookmarked. Keep the favicon and title stable.

8. Report what changed since the previous stamp — moved rows, new drift, shipped items —
   so the weekly diff is readable without opening the page.

## Rules

- Claim only what you read in the tree. If a signal is ambiguous, say so in the note
  rather than rounding a row up to `done`.
- An area is `done` on the Postgres track when it has: schema migration, DAO + mapper +
  data source, factory wiring behind a tenant flag, and a backfill config unless the data
  is ephemeral. A cross-backend consistency suite is expected for new work but several
  earlier areas shipped without one — the script reports it as advisory.
- Deeper detail belongs in `plans/` and `issues/`. Keep each row's note to a couple of
  sentences.
- Do not restyle the page. Content changes only.
