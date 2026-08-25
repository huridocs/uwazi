# Sync worker: isolate failures so one tenant cannot stall the cluster

Date: 2026-08-25
Last updated: 2026-08-25
Owner: Sync reliability (multi-tenant `sync_job`)

## Purpose

This document is the handoff for a production sync outage (2026-08-18) and the code work needed so it cannot happen again.

**Slice 1 (done):** if a tenant or one of its sync configs throws, `runAllTenants()` logs and continues. That is the defect that turned a missing source file on **tenant A** into a global stall of every later tenant.

The rest of the plan (skip missing files, login/redirects) is **not** committed yet. Slice 2/3 may be general worker hardening or one-off ops; decide before implementing. Isolation unblocks *other* tenants; it does not drain a broken queue by itself.

## Status

| Item | State |
|---|---|
| Incident mitigated in production | Yes (paused two broken targets, corrected one stale URL) |
| Code: tenant/config isolation | **Done** (2026-08-25) — `app/api/sync/syncWorker.ts` |
| Code: skip `FileNotFound` and advance `lastSyncs` | Not done — **undecided** whether this is a general skip or a specific ops/data fix for one stuck config |
| Code: POST login must not follow 301 as GET | Not done — **undecided** whether this is general worker policy or “put the final URL in `settings.sync.url`” |
| Code: errors include tenant, config name, URL | **Done as part of slice 1** (`reportSyncFailure` + `LoggerFactory.default()` inside `runInJobContext`) |
| Ops: restore or skip a missing object on tenant A | Not done — keep that config paused |
| Ops: reverse-proxy HTTP Basic on tenant B’s target | Not done — keep `featureFlags.sync: false` on that tenant |

Do **not** re-enable paused syncs until the matching ops (and any agreed code) item above is done.

## Production actions already taken (do not repeat blindly)

Generic shape of the mitigation. Re-enable **one at a time** after the real target fix. Even after isolation ships, a still-broken target will burn a full batch of that tenant’s tick every 10s.

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

`DistributedLoop.runTask()` already catches a throw from the **whole** `runAllTenants()` call, logs it (`handleError(..., { useContext: false })`), waits 10s, and ticks again. Before slice 1 that was a **same-tick cancellation** problem: the next tick started from the same broken tenant and failed the same way. Slice 1 isolates inside `runAllTenants`, so the remaining tenants/configs of that tick still run. A broken config still retries its own stuck item every 10s until that error is gone.

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
- `lastSyncs` behaviour unchanged in this slice. A `FileNotFound` on tenant A still retries that config forever; it no longer starves other tenants or other configs on the same master.

Two pre-existing failures on this branch (`translations v2`, `preference order`) also fail against the original worker; not caused by slice 1.

### Slice 2 — Missing files must not infinite-loop — **undecided (general vs specific)**

Not started. Product question: is a missing blob a skippable queue item for every tenant, or a real error that should keep retrying until ops restores the object? Do not implement until that is decided.

**If treated as general:** `FileNotFound` during `uploadFile` logs, skips that change, and still `updateSyncs`.

**Where:** `synchronizer.syncData` / `uploadFile`, or the per-change loop in `syncronizeConfig`. Catch `FileNotFound` from `#api/files/FileNotFound.js` (the storage one, not the V2 domain error).

**If implementing skip-and-advance:** do **not** mark the file unsyncable in Mongo unless there is also a UI/ops story for it. A structured error log with tenant + filename + storage key is enough for ops to restore the object later.

**Careful:** `syncData` POSTs the files document **before** `uploadFile`. If we skip only the upload and still `updateSyncs`, the target has a files row pointing at a blob that never arrived. That is acceptable vs stalling the cluster; call it out in the log (`namespace=files`, filename, “metadata synced, blob skipped”).

**Tests:**

- Files updatelog whose blob is missing: `lastSyncs.files` advances past that timestamp; later files in the same batch still sync; other tenants still tick.
- Non-file errors (login 401, network) still do **not** advance `lastSyncs` (retry next tick). Isolation from slice 1 keeps other tenants moving.

**Ops after this ships (if skip is agreed):** restore the missing object *or* rely on skip-and-advance, then set `active: true` on tenant A’s `config_public` only. Watch that config’s pending drain and that later tenants’ `lastSyncs` still move.

### Slice 3 — Login / redirects — **undecided (general vs specific)**

Not started. Tenant C was fixed in production by setting `settings.sync.url` to the final custom domain. Open: safety-net in the worker vs ops-only “always use the final URL.”

**If treated as general:** `POST /api/login` must not become `GET /api/login` via a 301/302. Prefer a clear “redirected to X” failure over a 404 loop.

**Where:** `syncWorker.login` and/or `JSONRequest` `_fetch`. Changing global `fetch` redirect policy affects the whole app (frontend + API clients). Prefer a **login-specific** option (`redirect: 'manual'` or `redirect: 'error'`) rather than changing default `JSONRequest.post`.

On a 3xx: log the `Location`, do not follow, do not update `lastSyncs`, next config/tenant continues (slice 1).

**Tests:** staging/target that 301s POST `/api/login` to another host. Worker does not 404-loop on GET. Error mentions the redirect target.

**Ops note:** the correct long-term config is still “put the final custom domain in `settings.sync.url`”. The code change is the safety net.

### Slice 4 — Logging — **done as part of slice 1**

`reportSyncFailure` logs tenant, config `name`, and URL inside `runInJobContext`. Further `FetchResponseError` shape changes are optional.

---

## What still needs to happen to re-enable the two paused syncs

These are **not** replaced by slice 1. Isolation makes it *safe* to re-enable one at a time; the target still has to work.

### A. Tenant A → `config_public` → `https://public.tenant-a.example`

**Ops / data**

- Restore the missing object-store object, **or** skip that files updatelog (advance that config’s `lastSyncs.files` past that change). Slice 2 would make the skip automatic.
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
- [ ] **Slice 2 + ops (if agreed):** re-enable **only** tenant A `config_public` after object-store/skip fix; pending drains; no `FileNotFound` loop; later tenants’ `lastSyncs` still move.
- [ ] **Ops:** re-enable **only** tenant B after proxy fix; `POST /api/login` 200 from jobs host; tenant B pending drains; later tenants still move.
- [ ] **Slice 3 (if agreed):** staging `settings.sync.url` that 301s to another host; worker should not 404-loop on GET `/api/login`.

## Open questions

1. **Slice 2 skip vs restore:** is a missing blob a general skippable queue item, or a real error that should keep retrying until ops restores the object? Automatic skip-and-advance vs restore-first so the public target gets that file.
2. **Metadata without blob:** if we POST the files document then skip the upload, is that worse than skipping the whole change (no POST, still `updateSyncs`)? Skipping the whole change leaves the target without the file row; posting without the blob leaves a dangling files document.
3. **Login 401 vs FileNotFound:** 401/404 login should **not** advance `lastSyncs` (retry until infra is fixed). Only treat missing blobs as skippable *if* slice 2 is agreed as general.
4. **JSONRequest / slice 3 scope:** keep redirect policy local to `syncWorker.login`, or treat 301-to-custom-domain as an ops URL mistake only?

## Suggested implementation order for the next session

Do **not** start slice 2 or 3 until the open questions above are decided. Next useful work is either:

- staging verification of slice 1 (broken tenant ahead of a healthy one still ticks), or
- ops path for tenant A’s missing object / tenant B’s proxy Basic, still one-at-a-time after isolation is deployed.
