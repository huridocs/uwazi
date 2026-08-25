# Sync worker: isolate failures so one tenant cannot stall the cluster

Date: 2026-08-25
Last updated: 2026-08-25
Owner: Sync reliability (multi-tenant `sync_job`)

## Purpose

This document is the handoff for a production sync outage (2026-08-18) and the code work needed so it cannot happen again.

**Slice 1 (done):** if a tenant or one of its sync configs throws, `runAllTenants()` logs and continues. That is the defect that turned a missing source file on **tenant A** into a global stall of every later tenant.

The rest of the original plan (skip missing files, login/redirects) is **deferred**. If a particular error type keeps showing up after auto-disable, we deal with that type then — not by classifying errors up front.

**Slice 2 (done):** five consecutive failures on a config, no successful tick in between → set that config `active: false` and Mattermost-notify once with the reason.

## Status

| Item | State |
|---|---|
| Incident mitigated in production | Yes (paused two broken targets, corrected one stale URL) |
| Code: tenant/config isolation | **Done** (2026-08-25) — `app/api/sync/syncWorker.ts` |
| Code: 5 consecutive failures → disable config + `notify: true` | **Done** (2026-08-25) — `consecutiveFailures` on `syncs`, threshold 5 |
| Code: skip `FileNotFound` and advance `lastSyncs` | Deferred — only if that type keeps tripping disable |
| Code: POST login must not follow 301 as GET | Deferred — only if that type keeps tripping disable |
| Code: errors include tenant, config name, URL | **Done as part of slice 1** (`reportSyncFailure`; disable notify is slice 2) |
| Ops: restore or skip a missing object on tenant A | Not done — after deploy, re-enable **or** leave paused; if re-enabled still broken, slice 2 disables after 5 failures |
| Ops: reverse-proxy HTTP Basic on tenant B’s target | Not done — keep `featureFlags.sync: false` on that tenant |

Do **not** re-enable paused syncs until the matching ops (and any agreed code) item above is done.

## Production actions already taken (do not repeat blindly)

Generic shape of the mitigation. Re-enable **one at a time** after the real target fix. After slice 2, a still-broken target errors for five ticks then disables itself (`active: false`) with one Mattermost notify.

| Kind of tenant | Change | Revert after the target is actually fixed |
|---|---|---|
| **Tenant B** (whole tenant blocked at login by proxy Basic) | `featureFlags.sync: false` on that tenant | Set `featureFlags.sync: true` |
| **Tenant A**, one of several configs | `active: false` on that array element only | `active: true` on that element only |
| **Tenant C** (stale hostname that 301s) | `settings.sync.url` set to the final custom domain, `active: true` | **done** — leave on |

A second config on tenant A that was idle (`pending=0`) was left active.

---

## Incident summary (2026-08-18)

The multi-tenant `sync_job` walked every `featureFlags.sync: true` tenant **in sequence with no per-tenant error handling**. A throw on one tenant aborted the rest of that tick. `lastSyncs` is only advanced **after** a successful `syncData`, so a repeating error retried the same item forever and later tenants never ran.

This blocked a later tenant that had never received a `syncs` document yet, and stalled another tenant with a large pending queue. The pipeline started flowing again after pausing two broken targets and fixing a third URL.

**Still paused (need a real fix before re-enable):**

1. **Tenant A** → config `config_public` → `https://public.tenant-a.example`
2. **Tenant B** → config `config_site` → `https://public.tenant-b.example`

**Already fixed and re-enabled:** **Tenant C** → config `config_default`. URL had been an old host that **301**s to a custom domain. Now `https://custom.tenant-c.example`.

### How the worker behaves

- Process: jobs worker (`node app/worker.js`).
- Job: `DistributedLoop('sync_job')` every 10s → `syncWorker.runAllTenants()`.
- Tenants: shared tenants collection where `featureFlags.sync === true`.
- Per tenant: read `settings.sync`; skip entries with `active !== true`.
- Per change: `POST /api/login`, then `POST /api/sync`, then for files `storage.fileContents` + upload.
- Batch size: 50 updatelogs per config per tick (`UPDATE_LOG_TARGET_COUNT`).
- Idle configs (`pending=0`) do **not** log in.

`DistributedLoop.runTask()` already catches a throw from the **whole** `runAllTenants()` call, logs it (`handleError(..., { useContext: false })`), waits 10s, and ticks again. Before slice 1 that was a **same-tick cancellation** problem: the next tick started from the same broken tenant and failed the same way. Slice 1 isolates inside `runAllTenants`, so the remaining tenants/configs of that tick still run. Until slice 2, a broken config still retries every tick; after slice 2 it disables itself after five consecutive failures.

`JSONRequest.post` uses `fetch` with default redirect following. A **301 on POST** is retried as **GET**, which is how a custom-domain redirect turned login into `404 Not Found`.

Worker order is the `featureFlags.sync: true` tenant list. Only configs with pending updatelogs actually log in. At incident time that was, in walk order:

| # | Source | Config | Target | Notes |
|---|---|---|---|---|
| 1 | tenant A | `config_public` | `https://public.tenant-a.example` | pending; live throw (`FileNotFound`) |
| 2 | tenant B | `config_site` | `https://public.tenant-b.example` | pending; would throw next (proxy 401) |
| 3 | tenant C | `config_default` | old host that 301s | large pending |
| 4 | tenant D | `config_default` | `https://pub.tenant-d.example` | large pending, **no `syncs` document** |

Tenant D’s `settings.sync` was valid. Empty `syncs` meant the worker never entered `createSyncIfNotExists` for that tenant — an earlier tenant was aborting the tick.

### 1. Tenant A `config_public` — proven in worker logs

Login to the destination works (browser and `POST /api/login` → `200 {"success":true}`).

Worker looped every ~10s:

- Object-store 404 on a source key whose filename is a human document title (spaces, punctuation, non-ASCII), not a hashed storage name
- `FileNotFound` in `uploadFile` (`synchronizer.ts` → `storage.ts`)
- `lastSyncs` not updated → same file retried forever
- remaining tenants never ran

A second config on tenant A (different URL, idle `pending=0`) was left active.

### 2. Tenant B `config_site` — high confidence, not seen as the live throw

`GET https://public.tenant-b.example/` and `GET /api/login` return **401** with `WWW-Authenticate: Basic`. That is reverse-proxy HTTP Basic, not Uwazi login. The worker POSTs JSON to `/api/login` and does **not** send Basic auth.

Tenant B had pending changes, so it **would** log in once tenant A was skipped. `featureFlags.sync` was turned off before the worker reached it. Disabling tenant B alone did not unblock the pipeline (tenant A was already throwing).

### 3. Tenant C `config_default` — proven, already fixed

After tenant A was paused, every tick:

```
FetchResponseError: Request failed with status code 404: Not Found
https://old-host.tenant-c.example/api/login
```

Load balancer **301** `old-host.tenant-c.example` → `https://custom.tenant-c.example/`. Browser works (lands on the custom domain). Worker `POST /api/login` on the old host → 301 → followed as **GET /api/login** → 404.

Fix applied in production: `settings.sync` url set to `https://custom.tenant-c.example/`, `active: true`. After that, tenant C pending dropped and tenant D got a `syncs` row.

---

## Relevant code (current)

Slice 1 landed in `app/api/sync/syncWorker.ts`:

- `runAllTenants` — inner `try/catch` inside `runInJobContext` (tenant on the store); outer catch uses `handleError(..., { useContext: false })` if job-context setup itself throws.
- `syncronize` — `try/catch` per config. A throw on one destination does not skip later configs on the same master.
- `reportSyncFailure` — `LoggerFactory.default().error` with `tenant`, `syncConfig`, `url`, `errorName`, then `handleError`. Wrapped so a logging failure cannot abort the loop.

`lastSyncs` still only moves after a successful change (including file upload). Per-change loop is **not** isolated:

```127:145:app/api/sync/syncWorker.ts
      await lastChanges.reduce(async (previousChange, change) => {
        await previousChange;
        ...
        if (shouldSync.data) {
          await synchronizer.syncData(...);
        }
        await updateSyncs(config.name, change.namespace, change.timestamp);
```

```52:54:app/api/sync/synchronizer.ts
    if (change.namespace === 'files' && data.filename) {
      await uploadFile(url, data.filename, cookie, data.type);
    }
```

`JSONRequest.post` (`app/shared/JSONRequest.js`) calls `fetch` with no `redirect` option → default `follow`. Fetch converts redirected POST to GET.

### `lastSyncs` is per config, not per tenant (confirmed 2026-08-25)

Master tenant DB, collection `syncs`: one document per `settings.sync[].name` (`{ name, lastSyncs: { files: ts, entities: ts, ... } }`). Pending work is this tenant’s `updatelogs` newer than **that config’s** cursor.

Two configs on the same master (`config_public` vs `config_private`) are independent destinations with independent cursors over the same updatelog. If config A throws and config B continues:

- B’s target stays current; A’s target stays at A’s last successful timestamp.
- They do **not** share or rewrite each other’s `lastSyncs`.
- When A starts succeeding again, it does **not** jump to B’s cursor. It resumes from its own `lastSyncs` and drains missed updatelogs (50/tick). Each change loads **current** master data (`getById`), so catch-up is eventual consistency with the master for *A’s* whitelist, not “become identical to B.”

Per-config isolation is therefore correct. Stalling `config_private` because `config_public` hit a missing file would be the bug. The only shared-cursor hazard is two configs with the **same `name`**.

---

## Code fix plan (sequenced)

Keep slices small. Each slice should have tests that would have failed on 2026-08-18.

Isolation is **sequential continue**, not parallelism. Do not `Promise.all` tenants: one `sync_job` lock, one tick, bounded load on targets.

### Slice 1 — Isolate tenants and sync configs — **done**

Shipped in `syncWorker.ts` / `syncWorker.spec.ts` (`describe('when a tenant or config throws')`).

- Host1 `syncronize` throws → host2 still advances `lastSyncs`.
- Host1 login fails for one target URL → host1’s second config and host2 still run.
- Invalid collection (`pages`) logs and does not reject `runAllTenants`; later tenants still tick.
- `lastSyncs` behaviour unchanged in this slice. A repeating throw on tenant A still retried that config forever until slice 2; it no longer starves other tenants or other configs on the same master.

Two pre-existing failures on this branch (`translations v2`, `preference order`) also fail against the original worker; not caused by slice 1.

### Slice 2 — Five consecutive failures disable the config — **done**

Shipped in `syncWorker.ts` / `syncsModel.ts` / `syncWorker.spec.ts` (`describe('when a config fails repeatedly')`).

No error taxonomy. Login 401, missing blob, 5xx, redirect-404, invalid config: each is one failure. If a type keeps tripping disable in production, add a specific fix then.

**Counter:** sibling field `consecutiveFailures` on the `syncs` document (not inside `lastSyncs`). Atomic `$inc` on failure; `$set: 0` when that config’s tick finishes without throwing (including idle `pending=0`). At `>= 5`, `$set` that `settings.sync[]` element `active: false` only if it is currently `true`; **`notify: true` only when `modifiedCount === 1`**.

**Tests:**

- Five throws on one config → `active: false`, `consecutiveFailures === 5`, `notify: true` once; sibling config stays active; later tenants still run. A further tick does not notify again.
- Two throws, then a successful tick → counter back to 0; not disabled.

### Slice 3 — Missing files skip / login redirects — **deferred**

Not in the first follow-up. Revisit only if slice 2 shows a repeating type worth special-casing (skip one blob vs freeze the destination; POST login following 301 as GET).

### Slice 4 — Logging — **done as part of slice 1**

`reportSyncFailure` logs tenant, config `name`, and URL inside `runInJobContext` without `notify`. Slice 2 adds `notify: true` only on disable.

---

## What still needs to happen to re-enable the two paused syncs

These are **not** replaced by slices 1–2. Isolation keeps other tenants moving; auto-disable pages once. The destination still has to work before it will drain.

### A. Tenant A → `config_public` → `https://public.tenant-a.example`

**Ops / data**

- Restore the missing object-store object, **or** skip that files updatelog (advance that config’s `lastSyncs.files` past that change). Slice 2 does **not** skip the file; it will disable this config after five throws.
- Filename may be a document title (punctuation, spaces, non-ASCII), not a hashed storage name — check whether Mongo `files.filename` matches a real storage key.
- Destination login is fine; do not rotate credentials for this.

**Then** set `active: true` on `config_public` only and watch:

- Worker logs for that tenant / `FileNotFound` / object-store 404
- That config’s pending count draining

### B. Tenant B → `config_site` → `https://public.tenant-b.example`

**Ops / infra**

- Remove reverse-proxy HTTP Basic from the public site, **or** exclude `/api/login` and `/api/sync` (and upload routes) from Basic, **or** put the sync target on a URL the worker can reach without Basic.
- Confirm: `POST /api/login` with the sync user returns `200 {"success":true}` **without** an `Authorization: Basic` header (from a host like the jobs box, not only a browser).

**Then** set `featureFlags.sync: true` on tenant B (worker may need a tenant reload / process restart if flags are cached). Watch pending drain and that later tenants keep moving.

---

## Production confirmation (already done)

Read-only pending check (updatelogs newer than `syncs.lastSyncs`): after the tenant C URL fix, **tenant C and tenant D pending dropped and `lastSyncs` moved** within a minute. Tenant A `config_public` stayed paused. Tenant B disappeared from the `sync: true` list (flag off).

## Test plan (from the incident, mapped to slices)

- [x] **Slice 1 (unit):** tenant A throws, tenant B still ticks; one config throws, later configs on the same tenant still run (`syncWorker.spec.ts`).
- [ ] **Slice 1 (staging):** force a missing file or 401 login on a staging tenant with `sync: true` **ahead of** another tenant; the second tenant must still tick.
- [x] **Slice 2 (unit):** five consecutive throws disable that config, Mattermost once, sibling configs / later tenants still run; a success in between resets the counter.
- [ ] **Ops:** after deploy, re-enable paused targets **one at a time**. If still broken, expect five Graylog errors then one Mattermost disable.

## Open questions

None blocking. Optional later: skip-one-missing-file vs freeze-the-destination; POST login 301→GET. Only if production disable-notifies show a repeating type.

## Suggested next steps

1. Deploy slices 1–2.
2. Re-enable paused configs one at a time, or leave them paused until the destination is fixed; if re-enabled still broken, they disable themselves after five failures with one notify.
