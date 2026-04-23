# CSV V2 Context 07 — Entities Import Performance Creep

Date: 2026-04-23  
Scope: Diagnose progressive slowdown during long CSV entities imports.

## 1) Why this document exists

After fixing progress durability and reducing entities-import batch size to 10, imports now report
progress correctly, but a new runtime concern became clear: throughput degrades as processing advances.

This doc is a focused handoff for the next agent to diagnose where time is being spent.

## 2) Recent changes already applied

1. Entities import default batch size reduced:
   - `CsvImportEntitiesJob` default `batchSize`: `1000 -> 10`.
2. Progress durability aligned with row processing:
   - row success path persists progress in the same transaction boundary as entity/file insert,
   - row failure path persists progress + row error in the same transaction boundary.
3. Focused verification:
   - `app/api/csv.v2/application/jobs/specs/CsvImportEntitiesJob.spec.ts` passed (7/7).

## 3) Current symptom

- Early import batches are fast (user-reported: first ~250 entities noticeably faster).
- Later batches are slower (user-reported + timing sample around rows 700+).
- Representative sample around rows 710..810 (10-row batches) shows many intervals around ~8-11s.
- Re-run confirmation:
  - Same CSV file executed again after prior 1000 entities already existed in the collection.
  - Early batches are fast again, then slowdown appears again later within the same run.

Interpretation:

- This is a **time-creep pattern** (progressive degradation) instead of fixed per-row throughput.
- This is likely **run-local accumulation** (in-job pressure growth), not primarily a static
  “collection size at start” penalty.

## 4) Key runtime operations still happening during import

Even with preflight, row import still performs non-trivial work:

1. Per-row entity creation transaction (`EntitiesService.insert`).
2. Per-row dispatch of `RelationshipSyncJob` from `EntitiesService.insert`.
3. Per-row import progress write to `csv_imports`.
4. Property-assignment strategy execution per mapped property; for some property types this includes
   DS access (relationship/select validation paths).

## 5) Primary hypothesis

Most likely bottleneck is cumulative side-effect pressure from relationship sync:

- one `RelationshipSyncJob` per inserted entity,
- concurrent write/read contention with import writes,
- queue/jobs collection growth and scheduling overhead during the same run.

Secondary candidates:

- repeated DS calls in property-assignment strategies (`settings`, `entities`, `thesauri`, `translations`);
- increased relationship metadata update costs as data grows.

## 6) Files to inspect first

Import chain:

- `app/api/csv.v2/application/jobs/CsvImportEntitiesRowsProcessor.ts`
- `app/api/csv.v2/application/jobs/CsvImportEntitiesBatchProcessor.ts`
- `app/api/csv.v2/application/jobs/CsvImportEntitiesContextLoader.ts`

Core side-effects:

- `app/api/core/application/EntitiesService.ts`
- `app/api/core/infrastructure/jobs/RelationshipSyncJob.ts`
- `app/api/relationships/relationships.js` (`saveEntityBasedReferences`)

Property assignment services:

- `app/api/core/application/propertyAssignmentCreatorService/PropertyAssignmentCreatorServiceStrategy.ts`
- `app/api/core/application/propertyAssignmentCreatorService/RelationshipPropertyAssignmentCreatorService.ts`
- `app/api/core/application/propertyAssignmentCreatorService/SelectPropertyAssignmentCreatorService.ts`

## 7) Diagnosis checklist (for next agent)

Do this before proposing behavior changes:

1. Measure wall-time per 10-row import batch across run progression:
   - batch 1..10 vs 40..50 vs 80..90.
2. Measure queue backlog growth during import:
   - pending/running count for `RelationshipSyncJob`.
3. Attribute time inside a batch:
   - row import transaction duration,
   - progress update duration,
   - property-assignment creation duration.
4. Attribute relationship sync cost:
   - job pick latency,
   - per-job execution latency,
   - relationship write/update durations.
5. Confirm whether slowdown correlates with:
   - number of imported entities so far,
   - relationship-bearing templates,
   - number of relationship properties.
6. Keep the rerun signal explicit in all analyses:
   - if slowdown resets at new run start and reappears later, prioritize in-run accumulating
     pressures (queue backlog, side-jobs, lock/contention), not static dataset-size explanations.

## 8) Guardrails while diagnosing

- Keep code changes in `app/api/csv.v2/**` unless explicit approval for core edits.
- Do not alter queue core contracts while diagnosing.
- Do not mark this track as complete until measurements identify dominant contributor(s)
  and a mitigation plan is reviewed.

