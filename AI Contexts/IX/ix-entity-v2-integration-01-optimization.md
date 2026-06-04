# IX Entity V2 Integration - Optimization Notes (to be reviewed)

This document captures current findings and potential solutions discussed for IX performance optimization.

Everything below is **to be reviewed**. Nothing here is finalized or approved.

## Scope

- Context file for optimization ideas around IX flows:
  - property-source training
  - PDF-source training/suggestions
  - suggestion lookup/save paths
  - suggestion acceptance/update entity path

## Findings (to be reviewed)

### 1) Dynamic metadata query in property training path

- **Area:** `entityForTrainingQuery` in `app/api/services/informationextraction/ixMaterials.ts`.
- **Observed:** query filters by dynamic keys such as `metadata.<toProperty>` and `metadata.<fromProperty>`.
- **Risk:** these dynamic paths are generally not indexed in MongoDB, so large datasets may require broad scans.
- **Note on `limit`:**
  - `limit` reduces returned documents, but does not avoid scan work needed to find qualifying documents when predicates are not index-supported.
  - MongoDB can stop early once enough matches are found, but on low-selectivity/unindexed predicates this can still read a large part of the collection.
- **Status:** to be reviewed.

### 2) PDF suggestion/training lookups rely on non-dynamic fields

- **Area:** segmentation/file joins and lookups in IX flows.
- **Observed:** key predicates use stable fields (`fileID`, `filename`, `xmlname`, `status`) rather than dynamic metadata.
- **Risk:** current segmentation model does not declare explicit indexes for these IX-heavy access patterns.
- **Status:** to be reviewed.

### 3) Suggestion save/lookup paths likely missing hot compound indexes

- **Area:** repeated lookup/update patterns in IX suggestion lifecycle.
- **Observed:** frequent filters combine extractor scope with entity/language/file dimensions.
- **Risk:** without suitable compound indexes, query execution can degrade under high suggestion volume.
- **Status:** to be reviewed.

### 4) Suggestion acceptance/update path is still V1-based and per-entity heavy

- **Area:** `updateEntitiesWithSuggestion` flow in legacy entities service path.
- **Observed:** accepted suggestions are processed entity-by-entity with sequential fetch/compute/save behavior.
- **Risk:** high write amplification and side effects per entity (denormalization/indexing/relationship updates), especially on bulk acceptance.
- **Status:** to be reviewed.

### 5) Suggestions-only prefilter does not fully represent "usable for training"

- **Area:** candidate discovery strategy for training data.
- **Observed:** suggestion documents do not always encode all required eligibility constraints (for example: complete entity/file/language/value readiness conditions).
- **Risk:** suggestions can help prefilter, but cannot always be authoritative alone for training eligibility.
- **Status:** to be reviewed.

### 6) Elasticsearch as alternative execution engine has consistency trade-offs

- **Area:** moving candidate query logic from MongoDB to Elasticsearch.
- **Observed:** ES already contains indexed entity data useful for filtering.
- **Risk:** eventual consistency can create temporal drift relative to MongoDB; correctness-sensitive training selection may require MongoDB validation anyway.
- **Status:** to be reviewed.

## Potential solutions (to be reviewed)

### A) Add deterministic indexes in hot IX paths

- **Proposal (to be reviewed):** add/confirm indexes for segmentation-heavy queries:
  - `segmentations: { fileID: 1, status: 1 }`
  - `segmentations: { filename: 1, status: 1 }`
  - `segmentations: { xmlname: 1 }`
- **Proposal (to be reviewed):** add/confirm IX suggestion compound indexes:
  - `ixsuggestions: { extractorId: 1, entityId: 1, language: 1 }`
  - `ixsuggestions: { extractorId: 1, entityId: 1, fileId: 1 }`
  - `ixsuggestions: { extractorId: 1, fileId: 1 }`
- **Proposal (to be reviewed):** verify entities index for frequent point lookup:
  - `entities: { sharedId: 1, language: 1 }`

### B) Clarify compound vs single-field index strategy

- **Proposal (to be reviewed):** prefer compound indexes for stable multi-field query patterns used by IX (extractor-scoped reads/writes), rather than relying only on independent single-field indexes.
- **Rationale (to be reviewed):** compound indexes are typically more predictable for tuple-style lookups and sort patterns in these flows.

### C) Reduce entity-scan cost for property training discovery

- **Proposal (to be reviewed):** use suggestions as prefilter input (extractor-scoped candidates), then validate eligibility against MongoDB entities/files/segmentations.
- **Important constraint (to be reviewed):** suggestions are not a full source of truth for "usable for training", so post-filter validation remains required.

### D) Evaluate wildcard or materialized strategy for dynamic metadata predicates

- **Proposal (to be reviewed):** assess wildcard indexing over metadata (`metadata.$**`) and/or a targeted materialized candidate dataset for IX.
- **Trade-off (to be reviewed):** faster reads vs index size/write cost/maintenance complexity.

### E) Evaluate Elasticsearch-assisted prefiltering

- **Proposal (to be reviewed):** use ES for broad candidate narrowing, then perform authoritative MongoDB validation before training material emission.
- **Trade-off (to be reviewed):** improved filter speed vs eventual consistency and dual-system complexity.

### F) Evaluate V1 -> V2 migration for acceptance/update path with performance goals

- **Proposal (to be reviewed):** migrate acceptance/update flow to V2 only if accompanied by batching and side-effect optimization strategy.
- **Clarification (to be reviewed):** migration to V2 alone is not guaranteed to improve throughput unless behavior is redesigned for fewer round-trips and reduced per-entity side effects.

## Suggested prioritization for next review (to be reviewed)

1. Deterministic index additions in segmentation/suggestions/entity point lookups.
2. Measure impact and identify remaining hotspot(s) via explain/profiling.
3. Decide candidate-discovery strategy:
   - direct Mongo dynamic query,
   - suggestions-prefilter + Mongo validation,
   - ES-prefilter + Mongo validation,
   - or materialized IX candidate model.
4. Define acceptance/update batching strategy before any V2 migration work.

## CTO cross-check: overlap, gaps, and additional ideas (to be reviewed)

### Overlap with prior findings (to be reviewed)

- **Segmentation indexing gap confirmed:** CTO findings reinforce missing/insufficient index support on `segmentations` query paths.
- **Dynamic metadata access is a core bottleneck:** aligns with our concern that metadata-driven predicates in `entities` can trigger broad scans.
- **Need for extractor-scoped suggestion indexes:** aligns with our identified IX suggestion lookup/save bottlenecks.
- **Potential architectural sidecar/materialized lookup:** aligns with our previously listed materialization direction for dynamic metadata predicates.

### Potentially missing from current doc (to be reviewed)

- **Low-cardinality index trap on `entities.language`:**
  - Standalone `{ language: 1 }` can be selected by planner and cause large key/doc scans when combined with dynamic metadata predicates not covered by better compound indexes.
- **`sort({ _id: 1 })` causing full `_id` index walk:**
  - When predicate and sort are not jointly supported by an index, planner may walk clustered/default `_id` index at large scale.
- **Cross-property `$or` search shape as a distinct anti-pattern:**
  - Global `$or` across multiple dynamic metadata paths (especially without `template` anchor) can defeat targeted property indexes and force expensive plans.
- **Explicit ESR-oriented index design reminder:**
  - Equality -> Sort -> Range ordering should guide compound index design for known query families.

### New ideas to include for review (to be reviewed)

1. **Segmentations cursor read-path hardening**
   - Add/verify dedicated index support for paging workers scanning by `fileID` existence and retrieval.
   - Validate execution plans for `find({ fileID: { $exists: true } }, { fileID: 1 })`-like scans and replace with index-friendly query shape where possible.

2. **Entities index hygiene against language index overuse**
   - Review whether standalone `{ language: 1 }` is helping or harming IX-critical query families.
   - Add narrowly targeted compound indexes for frequent IX metadata predicates, including sort needs when applicable.

3. **Sort-aware compound indexes for metadata queries**
   - For query families that include `_id` ordering, evaluate compound indexes that can satisfy both filter and sort (for example: `template + language + metadata.<property>.value + _id`).
   - Validate with `explain` that in-memory sort and `_id` full-walk plans are avoided.

4. **Query-shape refactor for cross-property lookup**
   - Replace single global cross-property `$or` query with split per-property queries (parallelized), merge IDs in application layer.
   - Keep `template` as anchor when semantically valid to improve selectivity.

5. **Sidecar lookup pattern feasibility study**
   - Evaluate a dedicated lookup collection (for example, `entity_metadata_lookup`) with normalized rows such as `{ entityId, template, language, propertyName, propertyValue }`.
   - Use sidecar for high-selectivity lookup, then fetch source entities by ID from `entities`.

6. **Elasticsearch-assisted retrieval boundary**
   - If ES is used for candidate narrowing, define explicit consistency guardrails and required Mongo validation steps before training actions.

7. **Operational rollout + verification checklist**
   - For each proposed index/query-shape change, define:
     - expected winning query patterns,
     - explain-plan acceptance criteria,
     - rollback path if write amplification/regression appears.

### Open questions to resolve before implementation (to be reviewed)

- Which exact IX queries currently include explicit `_id` sorts in production paths?
- Which metadata property names dominate query volume (for targeted index selection)?
- Is there a single cross-property lookup endpoint/path causing most `$or`-shape scans?
- What is acceptable staleness window if ES prefiltering is adopted?
- For sidecar approach, what write-time maintenance strategy is acceptable (sync/async/event-driven)?

### Slow delete query follow-up flow (to check)

- **Case:** very slow `deleteMany` on `ixsuggestions` with filter `extractorId: { $in: [...] }`.
- **Hypothesis to check:** at execution time, no effective index was available for `extractorId`-scoped delete lookup.
- **Checks to run (to check):**
  - Confirm historical index state around incident window (whether `{ extractorId: 1 }` or suitable compound prefix existed and was ready).
  - Run `explain("executionStats")` for equivalent filter and verify:
    - winning plan,
    - `totalKeysExamined`,
    - `totalDocsExamined`.
  - Estimate deletion cardinality for those extractor IDs (documents matched/deleted).
  - Compare performance with:
    - single `deleteMany`,
    - batched delete loop by `_id` chunks.
  - Validate whether index maintenance cost dominates runtime when many suggestion indexes are present.
- **Potential mitigations to evaluate (to check):**
  - add/retain a narrow index `{ extractorId: 1 }` for mass extractor cleanup paths;
  - route extractor cleanup to async background job;
  - prefer chunked deletes to avoid very long-running single write operations.

### Slow entities query with `_id` index walk (to check)

- **Case:** slow `find` on `entities` with filter on dynamic metadata path + `language` + `template`, using `sort: { _id: 1 }` and projection `{ _id: 1 }`.
- **Observed in log (to check):**
  - `planSummary: IXSCAN { _id: 1 }`
  - very high `keysExamined/docsExamined` with `nreturned: 0`
  - high execution time despite low bytes read.
- **Working interpretation (to check):**
  - planner is prioritizing `_id` sort satisfaction by scanning `_id` index instead of using a selective predicate index;
  - current index set likely does not support filter + sort jointly for this query family.
- **Checks to run (to check):**
  - Validate whether this query path truly requires `sort: { _id: 1 }`.
  - Compare explain plans for:
    - current shape with sort,
    - same filter without sort,
    - same filter with `limit` where semantically allowed.
  - Inspect query frequency and caller path to assess blast radius.
  - Verify whether plan cache is reinforcing a weak plan for this shape and whether index/query changes alter the winning plan.
- **Potential mitigations to evaluate (to check):**
  - remove `_id` sort where not required by business logic;
  - use a sort-aware compound index pattern for frequent property families (for example: `template + language + metadata.<property>.value + _id`);
  - avoid broad cross-property reuse of one generic query shape when property-specific indexes are expected.

