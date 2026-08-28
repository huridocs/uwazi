# ParadeDB probe suite

Five suites for the Elasticsearch → ParadeDB feasibility work:

- **Suite 1 (`run-probes.mjs`)** — does a ParadeDB index over the existing `metadata` JSONB column
  actually cover the query patterns Uwazi emits?
- **Suite 2 (`sweep.mjs`)** — how does each of those patterns behave as the corpus grows?
- **Suite 3 (`run-fulltext.mjs` / `sweep-fulltext.mjs`)** — PDF full text: per-page rows,
  partitioned by document language.
- **Suite 4 (`run-join.mjs`)** — metadata and document text combined into one ranked list.
- **Suite 5 (`concurrency.mjs`)** — throughput and tail latency under concurrent load.

It is not a benchmark. Every probe asserts correctness _and the query plan_, because correctness
passes almost everywhere — it is the plan that separates "works" from "works via the index".

Tested against **pg_search 0.25.4 / PostgreSQL 17.11**.

## Running it

```bash
docker compose -f benchmarks/paradedb/compose.yml up -d
docker exec -i uwazi-paradedb-probe psql -U admin -d paradedb_probe -v ON_ERROR_STOP=1 \
  < benchmarks/paradedb/sql/000-schema.sql

node benchmarks/paradedb/seed/generate.mjs --entities=2000 --properties=20 --cardinality=50
node benchmarks/paradedb/seed/createIndex.mjs
node benchmarks/paradedb/run-probes.mjs

# Suite 2: reseeds and rebuilds at each point, then reports plan flips
node benchmarks/paradedb/sweep.mjs --axis=E --values=2000,20000,100000
```

Exit code is non-zero on any failure, so either can gate a decision or pin a ParadeDB version in CI.

### The three axes

| Flag              | Stresses                                                                                    |
| ----------------- | ------------------------------------------------------------------------------------------- |
| `--entities=E`    | corpus size                                                                                 |
| `--properties=P`  | filler properties per entity — the length of the OR-fan a bare text search must emit        |
| `--cardinality=C` | distinct values per faceted property — bucket count against `preloadOptionsSearch()` = 2000 |

Expectations are written as functions of E/P/C, so the same assertions hold across a sweep. Re-run
`run-probes.mjs` with matching `--E/--P/--C` after reseeding.

## What the probes are derived from

The spec is the switch in `app/api/search/metadataMatchers.js` (`filterToMatch`) plus the
aggregation families in `app/api/search/metadataAggregations.js`. That switch is a closed list, so
`coverage.mjs` fails if a branch has no probe. Branches deliberately not covered are named there
with the reason, rather than silently absent.

## Findings

Everything below was observed against a running instance, not inferred from documentation.

### The good news holds up

- **Search, filtering and facet counts all work directly off the raw `metadata` column.** No
  projection table. This confirms what `docs/paradedb-tradeoffs.md` §I.3 reported.
- **Multi-valued properties count correctly.** An entity tagged with two values contributes to both
  buckets; bucket totals come to exactly `E × values-per-entity`.
- **Thesaurus _group_ counts work too** — `metadata.X.parent.value` aggregates correctly. Worth
  noting because `selectAggregation()` computes a second bucket set per select property that the
  assessment's feature table does not mention, so it was outside the earlier experiment.

### RLS does not disqualify the index — open question #1

This was ranked as the thing that could undo everything. It does not, at least structurally.

Run as a collaborator (`uwazi.bypass_rls=false`, `uwazi.ref_ids=collab1`, as a non-superuser
non-owner role), the permission predicate appears as a `heap_filter` _inside_ the ParadeDB scan:

```
"heap_filter": "(_perm_read_refs && string_to_array(current_setting('uwazi.ref_ids'), ','))"
```

Both `TopKScanExecState` and `ParadeDB Aggregate Scan` survive it. Admin and collaborator plans are
structurally identical.

**Caveat, and it matters:** this says the optimisation is not _disqualified_. It does not say what
the heap filter costs when it is selective — Top-K may have to over-fetch to fill K. That is a
scale question (Suite 2), not a plan question.

> **Answered below.** Suite 2 measured both halves: over-fetch stays at exactly 1.0 up to 100k rows
> (Top K is not forced past K), and the filter costs ~1.15–1.45× against an admin running the same
> query — but note that comparison understates the cost of the permission system, because the admin
> is also subject to RLS. See [Suite 5](#the-permission-rules-dominate-every-measurement).

### Text sorting is worse than the assessment assumes — new

`docs/paradedb-tradeoffs.md` treats these as two separate topics: §II.3 says sorting needs a
declared index expression, and separately says ICU collation ports fine, so alphabetical ordering is
✅. **They are in direct conflict, and the conflict is load-bearing.**

Measured:

| `ORDER BY … LIMIT 30`                   | Plan                              |
| --------------------------------------- | --------------------------------- |
| `"creationDate"` (bigint)               | `TopKScanExecState` ✅            |
| declared numeric JSON path              | `TopKScanExecState` ✅            |
| `title` (literal tokenizer, fast field) | `Sort` + full materialisation ❌  |
| `title COLLATE "C"`                     | `TopKScanExecState` ✅            |
| `lower(title)`                          | `Sort` + `NormalScanExecState` ❌ |

Text Top-K engages **only under `COLLATE "C"`** — raw byte order. The database collation here is
`en_US.utf8`, and under any non-C collation ParadeDB will not push the sort down, even when the
field uses the literal tokenizer and is stored as a fast field.

So the trade is not "declare the property and it sorts fast". For text it is: **indexed Top-K
sorting, or locale-correct alphabetical ordering — not both.** `COLLATE "C"` puts uppercase before
lowercase and sorts "ñ" after "z", which is exactly the per-locale visible ordering §II.3 flags as a
support-ticket risk.

Title is the library's default sort, so this is not an edge case. It applies to every text property
in the sort dropdown.

### Strict nested cannot be expressed against the index — open question #3

Answered, and the answer is no. Tantivy flattens array position:

- Grouped-path query (`probe_nested.value:(person:person_1 AND role:role_2)`) — matches **0 rows**.
- Plain conjunction — returns the **non-strict** result set (533 of 2000), silently. A filter that
  means "this person, in this role" would start meaning "this person somewhere, and this role
  somewhere", with no error.

There is a working implementation: index prefilter (non-strict) narrowed by a SQL
`jsonb_array_elements` re-check, which returns the correct 266. The re-check only runs over
candidates, not the whole table — so this is likely affordable, and it does **not** force the
projection table §II.4 feared. It is not index-accelerated, though, so its cost is a scale question.

### Smaller findings

- **`pdb.exists()` does not exist in 0.25.4.** The "No label" / missing bucket has no index-side
  form found so far; it falls back to a SQL `NOT (metadata ? 'prop')` containment check. The `Any`
  option does work in-index, via `metadata.X.value:*`.
- **Non-text indexed expressions must be cast to `pdb.alias(...)`.** Casting to `::numeric` alone is
  rejected outright.
- **Tokenizer options are separate quoted arguments.** `pdb.unicode_words('alias=x,columnar=true')`
  does not error — it creates a field literally named `x,columnar=true`, and the alias is then
  unqueryable. A silent misconfiguration worth knowing about before anyone writes index DDL by hand.
- **`key_field` is a single column,** but the real `entities` primary key is composite
  (`tenant_id, _id`). The probe schema adds a unique index on `_id` alone. Whether `_id` is in fact
  globally unique across tenants in production should be confirmed before reading anything into
  multi-tenant results.
- **Numeric sorting is lexicographic unless cast** — `100, 1000, 25, 9`. Confirmed, silent, no error.

## Suite 2 — the scale sweep

`sweep.mjs` reseeds and rebuilds at each point on a swept axis, re-asserts correctness, and records
each probe's **plan signature** and median execution time. The headline output is the _flip report_:
the size at which a probe's plan changes shape. Latency then only needs measuring around those knees.

Measured on this machine, collaborator actor, E = 2,000 → 20,000 → 100,000 (P=20, C=50):

### The sidebar keeps its single round trip — the big one

§II.2 assumed the self-excluding facet sidebar becomes N separate aggregate queries, and called that
"roughly half the migration" and "the one thing to measure before committing". It is measured now,
and the assumption was wrong.

Multiple `pdb.agg()` columns in one `SELECT`, each with its own `FILTER (WHERE ...)` for
self-exclusion, all resolve in a **single `ParadeDB Aggregate Scan`**:

| At E=100,000                       | median  |
| ---------------------------------- | ------- |
| 1 facet                            | 33.6 ms |
| 9 self-excluding facets, one query | 43.8 ms |

Nine facets cost **1.3× one facet, not 9×**. The single-pass property Elasticsearch gives us for
free is recoverable. (`pdb.agg()` itself takes one aggregation per call — sibling aggregations in a
single call are rejected — so the sidebar is built as one column per facet.)

### No plan flips up to 100k

Every probe kept its plan shape across the sweep. Nothing degraded from an index scan to a
sequential scan, and no aggregate fell back to ordinary Postgres execution.

### Over-fetch: Top K really does stop at K, RLS included

The over-fetch column reports scan rows produced per row returned, for `LIMIT` queries:

| Probe                                   | E=2,000 | E=20,000 | E=100,000 |
| --------------------------------------- | ------- | -------- | --------- |
| `sort-declared-numeric` (Top K)         | 1.0     | 1.0      | 1.0       |
| `sort-title-collate-c` (Top K)          | 1.0     | 1.0      | 1.0       |
| `sort-undeclared`                       | 66.7    | 666.7    | 3333.3    |
| `sort-title-locale` (default collation) | 66.7    | 666.7    | 3333.3    |

Top K holds at exactly 1.0 with the RLS heap filter present — the permission predicate does **not**
force it to look past K. The undeclared and locale-collated sorts grow linearly with the corpus and
are unbounded: at 100k they read 3,333 rows for every row displayed.

### What RLS actually costs

> **Superseded — see [Suite 5](#the-permission-rules-dominate-every-measurement).** The comparison
> below is collaborator versus _an admin who is still subject to RLS_, so both sides pay the
> permission cost. Measured against a connection where RLS does not apply at all, the real figure is
> **7.5× on latency and up to 34× on throughput**, not 1.15–1.45×.

Running the same sweep as `admin` isolates the collaborator-versus-admin difference only. At
E=100,000 the collaborator is roughly **1.15–1.45× slower** — e.g. `facet-self` 31.0 → 33.6 ms, `text-term` 28.0 → 31.0 ms, `sort-declared-numeric`
99.2 → 111.8 ms. Real, but a constant factor, not a plan collapse.

> **Caveat worth stating.** The generated corpus is two-thirds published, so most rows satisfy the
> `published = true` branch of the RLS disjunction and short-circuit before the GIN array overlap. A
> tenant whose entities are mostly unpublished would push far more rows through the overlap branch.
> Sweeping the published ratio is the obvious next probe, and it could change this number.

### Reading the numbers with care

These are single-machine, warm-cache, sequential measurements on a synthetic corpus. They are useful
for **shape** — linear vs constant, one scan vs N — and not for capacity planning. Nothing here
speaks to concurrency; that needs the HTTP harness and a load generator, pointed at the knees these
sweeps identify.

## What these suites do not answer

- Concurrency and buffer-cache contention (§I.2). That is the third suite: a two-implementation HTTP
  harness (`/es/library` vs `/pdb/library`) driven by autocannon, worth building only once the
  sweeps say which patterns and sizes to point it at.
- Anything about PDF full text. It lives in `files.fullText`, a different table, and needs the
  per-page re-modelling described in tradeoffs §I.6.
- The `relationships` filter — the Postgres `entities` table has no `relationships` column yet
  (migration 005), so there is nothing to index.

---

# Suite 3 — PDF full text

## The shape

One row per `(file, page)`, linked to the entity by `shared_id` (i.e. `files.entity`), so the text is
stored **once per file** no matter how many entity translations exist, and **every** attached
document is indexed rather than one default per entity.

The table is **partitioned by the PDF's own detected language** — one partition per Snowball stemmer
ParadeDB supports (20), plus a `DEFAULT` partition for unknown, undetectable, and unstemmable
languages, which uses ICU tokenization. See `lib/fulltextSchema.mjs`.

Searches are **language agnostic**: the query fans across all partitions and never filters by
language. Each partition stems the term with its own rules and can only match documents actually
written in that language.

```bash
node -e "import('./benchmarks/paradedb/lib/fulltextSchema.mjs').then(async m => {
  const { connectAdmin } = await import('./benchmarks/paradedb/lib/db.mjs');
  const c = await connectAdmin(); await c.query(m.schemaDDL()); await c.query(m.indexDDL()); await c.end();
})"
node benchmarks/paradedb/seed/generateFullText.mjs --pages=20000
node benchmarks/paradedb/run-fulltext.mjs
node benchmarks/paradedb/sweep-fulltext.mjs --values=20000,100000,400000
```

## Why partitioned, and not something simpler

Three shapes were tried. The constraint that decided it is that **a relation may only have one
ParadeDB index**, so "one partial index per language" is impossible.

| Shape                            | Stemming | Snippets    | Index size |
| -------------------------------- | -------- | ----------- | ---------- |
| One table, one unstemmed field   | ❌       | ✅          | 1.00×      |
| One table, per-language aliases  | ✅       | ❌ **NULL** | 3.37×      |
| One table, `CASE`-scoped aliases | ✅       | ❌ **NULL** | 1.03×      |
| **Partitioned by language**      | ✅       | ✅          | 1×         |

`pdb.snippet()` returns **NULL for any match that came from an aliased field** — it only highlights
matches on the primary, plainly-named field. That eliminates both alias designs, including the
`CASE`-scoped one that was otherwise the best on size. Each partition is its own relation, so each
gets `contents` as its primary field with its own stemmer: stemming _and_ snippets, no duplication.

Dropping stemming is not a free simplification: searching the Spanish base form `investigacion`
returns **0 hits** unstemmed versus 2 stemmed, and `massacre` returns 1 versus 2.

## The `LIMIT` placement finding

**The `LIMIT` must be pushed into every partition branch of the UNION.** With it only on the outer
query, all 21 partitions generate snippets for every one of their matches before the outer sort
discards them:

| Ranked page of 30 snippets | 20k pages | 100k    | 400k       |
| -------------------------- | --------- | ------- | ---------- |
| `LIMIT` per branch         | 5.8 ms    | 6.0 ms  | **7.6 ms** |
| Outer `LIMIT` only         | 776 ms    | 1709 ms | 2842 ms    |

367× for identical results, and essentially **flat** with corpus size, since each partition does a
top-30 index walk regardless. `rankedFanWithSnippet()` in `probes/fulltext.mjs` builds the correct
shape; the `ft-ranked-snippets` probe guards it.

## Scale

| Query                               | 20k pages | 100k    | 400k    |
| ----------------------------------- | --------- | ------- | ------- |
| Single partition                    | 0.4 ms    | 0.9 ms  | 6.2 ms  |
| Agnostic fan (21 partitions)        | 4.4 ms    | 13.0 ms | 21.1 ms |
| Ranked snippets, `LIMIT` per branch | 5.8 ms    | 6.0 ms  | 7.6 ms  |
| In-document search                  | 0.5 ms    | 2.2 ms  | 8.8 ms  |
| Phrase search                       | 0.7 ms    | 3.2 ms  | 8.6 ms  |
| Collapse to one row per entity      | 8.6 ms    | 19.9 ms | 35.7 ms |

**Collapse cost tracks how common the search term is, not corpus size.** Pages must be grouped to
entities before paginating, and an entity's rank comes from its best-scoring page, so every matching
page has to be scored — no early exit. At 400k pages:

| Term            | Matching pages          | Rank pages | Collapse |
| --------------- | ----------------------- | ---------- | -------- |
| `massacre`      | 171,440 (43% of corpus) | 11 ms      | 44 ms    |
| `investigation` | 114,300 (29%)           | 10 ms      | 34 ms    |
| `zzzrare`       | 0                       | 8 ms       | 8 ms     |

8 ms is the floor — the 21-partition fan itself.

## Other constraints found

- **A `pdb.snippet()` result cannot be used in `WHERE`** — `WHERE snip IS NOT NULL` fails with
  "Unsupported query shape". Producing snippets in subqueries and selecting them through an outer
  query is fine; only filtering and sorting on the value is blocked. Snippets are output, not query
  logic — which is already how the application treats highlights.
- **Each partition costs ~2.8 MB even when empty**, so 21 partitions carry roughly 40 MB of floor.
  Irrelevant at scale, but it is why a 20k-page index reports 63 MB — that figure is mostly
  overhead, not data.
- Index build times measured non-monotonically (11.9 s at 100k, 8.6 s at 400k), almost certainly
  parallel workers or contention rather than a real inversion. Not worth quoting without a cleaner
  run.

---

# Suite 4 — the join: metadata + document text in one ranked list

```bash
node benchmarks/paradedb/run-join.mjs
```

## The join is a security requirement, not an optimisation

`entity_fulltext` and its partitions have **no row-level security of their own** — the permission
rules live on `entities`. Measured as a collaborator, with 200 entities restricted to another user:

| Query                                          | Entities returned |
| ---------------------------------------------- | ----------------- |
| Full-text partitions queried directly          | 7,143             |
| Same, joined to `entities`                     | 6,999             |
| **Difference (restricted, would have leaked)** | **144**           |

Any code path that reads these partitions without joining to `entities` leaks document text from
entities the actor cannot see. The `join-permissions-leak` probe guards this.

Note also that new partitions need explicit `GRANT`s — the application role could not read them at
all until granted, which is a blunt safeguard rather than the intended one.

## Scores from the two indexes cannot be added

BM25 scores depend on each index's own corpus statistics, so the two branches are not on a common
scale. For the same search term:

| Source          | Matches | Min score | Max score |
| --------------- | ------- | --------- | --------- |
| Entity metadata | 2,828   | 3.234     | 3.650     |
| Document text   | 1,696   | 0.000019  | 0.000019  |

Roughly **185,000×** apart. Adding them produced a results page that was **100% metadata matches** —
document-text hits can never surface. (The synthetic corpus exaggerates the magnitude: a 10-word
vocabulary makes the term near-universal in the page text, collapsing its IDF. The _direction_ of the
problem is structural, the size of it is not.)

**Reciprocal Rank Fusion fixes it**, combining branches by position rather than score:
`weight / (k + rank)`, with `k = 60`. Same term, same data:

| Ranking method    | Top 30 composition                | Cost   |
| ----------------- | --------------------------------- | ------ |
| Adding raw scores | 30 metadata, **0 document text**  | 238 ms |
| **RRF (k=60)**    | **15 metadata, 15 document text** | 288 ms |

Fusion costs about 20% more and is the only one that produces a usable ordering.

## Cost breakdown

At 200,000 entities and 400,000 pages, as a collaborator:

| Branch                                    | Cost        |
| ----------------------------------------- | ----------- |
| Document text (fan + RLS join + collapse) | **18.6 ms** |
| Entity metadata                           | 212 ms      |
| Combined, RRF                             | 288 ms      |

**The full-text side is cheap and barely moved** when entities went from 20k to 200k (22.5 → 18.6 ms).
The metadata branch dominates — and that cost is the text search itself, not ranking or the join:

| Same `WHERE`, 28,542 matches of 200k entities | Cost     |
| --------------------------------------------- | -------- |
| `count(*)` only                               | 73 ms    |
| `ORDER BY "creationDate" LIMIT 30`            | 172.9 ms |
| `ORDER BY pdb.score(_id) LIMIT 30`            | 173.1 ms |

Ordering by relevance costs the same as ordering by a date, so scoring is not the expensive part.

## Plan

The combined query uses **22 ParadeDB custom scans** — one on `entities`, one per partition — with a
hash join, and no sequential scan at 200k entities. At 20k entities the planner did choose a
`Seq Scan` on `entities` to build the join hash; that disappeared as the table grew. Worth
re-checking on a small tenant.

## Still open

- Whether BM25 scores are comparable **across partitions**, since each is its own corpus. RRF makes
  this less pressing, because the text branch is ranked internally before fusion, but it has not been
  verified.
- RRF weights: both branches are currently weighted 1.0. Today's behaviour boosts metadata over
  document text, so a weight below 1.0 on the text branch may be closer to current expectations.
- Concurrency — now covered by Suite 5 below.

---

# Suite 5 — concurrency

```bash
node benchmarks/paradedb/concurrency.mjs --levels=1,4,8,16,32 --seconds=4
```

Runs the real library workloads through a connection pool at rising concurrency. No HTTP layer: the
question is how the database behaves, and an Express hop in front would add its own queueing.
Every workload randomises its parameters (otherwise this measures a warm plan cache), and every
connection is a **collaborator**, so the permission rules are enforced.

Session settings are passed in the startup packet (`options: '-c app.current_tenant=…'`) rather than
a pool `connect` handler — that handler is not awaited, so the pool can hand a connection to a
waiting query before the `SET`s have run, silently executing the first query of every connection
without a permission context.

Measured on 12 cores / 15 GB, 200,000 entities and 400,000 pages.

## Peak throughput and where it saturates

| Workload                   | qps @1 | qps @8 | **peak qps**  | p50 @8 | p99 @32 |
| -------------------------- | ------ | ------ | ------------- | ------ | ------- |
| Full text + snippets       | 96     | 591    | **646** (@16) | 13 ms  | 138 ms  |
| Metadata text search       | 6.5    | 43.8   | **51** (@16)  | 177 ms | 1209 ms |
| Sort by declared property  | 4.5    | 29.5   | **35** (@32)  | 256 ms | 1341 ms |
| Filter by property (count) | 17.3   | 26.0   | **30** (@32)  | 317 ms | 3023 ms |
| Combined library query     | 4.5    | 27.0   | **30** (@32)  | 297 ms | 1823 ms |
| Sidebar facets (20)        | 14.0   | 21.3   | **25** (@32)  | 392 ms | 3648 ms |

No errors at any concurrency level.

**The library screen tops out around 25–30 requests/second** on this hardware, limited by the sidebar
facets and the combined query. The per-page full-text design is an order of magnitude faster than
everything else.

## Two distinct scaling behaviours

| Shape                             | Scaling efficiency @8 |
| --------------------------------- | --------------------- |
| Retrieval (`ORDER BY … LIMIT 30`) | 75–84%                |
| Aggregates (`count`, `pdb.agg`)   | 17–19%                |

**Retrieval scales nearly linearly; aggregates barely scale at all.** A Top-K query stops after 30
rows, so it is CPU-light and spreads across cores. An aggregate has to traverse every matching row,
so it is bandwidth-bound and contends.

This is inherent to aggregates, not caused by the permission rules — measured as the table owner
with RLS entirely out of the picture, `count` still only reaches 47% efficiency at concurrency 4 and
24% at 8, while Top-K holds 77–98%.

Practically: **the filter sidebar is the part of the library screen that will saturate first.**

## The permission rules dominate every measurement

This corrects an earlier claim in this README that RLS costs "a constant ~1.15–1.45×". That figure
compared a collaborator against an _admin who was still subject to RLS_ — both were paying the cost.
Against a connection where RLS does not apply at all, the real figures are much larger:

| Same count query, 200k entities                              | Latency     | vs no check |
| ------------------------------------------------------------ | ----------- | ----------- |
| No permission check at all                                   | 6.9 ms      | 1.0×        |
| Permission folded into the ParadeDB query (`published:true`) | 22.5 ms     | 3.2×        |
| Permission as an ordinary SQL predicate                      | 35.7 ms     | 5.1×        |
| **Permission via row-level security**                        | **52.2 ms** | **7.5×**    |

Under concurrency the gap is larger still:

|                          | qps @1 | qps @8 |
| ------------------------ | ------ | ------ |
| Top-K, RLS not applied   | 945    | 5,841  |
| Top-K, as a collaborator | 28     | 184    |
| Count, RLS not applied   | 140    | 271    |
| Count, as a collaborator | 18     | 25     |

**Why it cannot be indexed away.** The plan keeps its ParadeDB scan in every case — nothing collapses
— but the policy predicate appears inside the Tantivy query as a `heap_filter`:

```
"heap_filter": "(_perm_read_refs && string_to_array(current_setting('uwazi.ref_ids'), ','))"
```

Evaluating it requires fetching the actual heap tuple for each candidate row. Two parts of the policy
resist pushdown: `current_setting()` / `current_tenant()` are function calls, and `&&` array overlap
is not a ParadeDB operator. Adding `_perm_read_refs` to the index recovered only ~18% (68 → 56 ms)
and the `heap_filter` entries remained.

Note also that the `bypass_rls = 'true'` branch does **not** short-circuit: an admin pays essentially
the same cost (58.8 ms) as a collaborator (68.7 ms), even though the predicate is trivially true.

**The trade this exposes.** Row-level security is the safest way to enforce permissions — the database
refuses to return rows regardless of what the query says — and it is also the most expensive of the
three options above, roughly 2.3× the cost of folding the check into the search query. That is a real
decision, not a tuning detail, and it applies to every search the product runs.

## Caveats

- Single machine, local connections, warm cache. Useful for **shape** — which workloads scale, where
  saturation begins, how big the permission cost is — not for capacity planning.
- The "no permission check" baseline uses the table-owner connection, which is not how the
  application connects. It is a reference point for what the index can do, not an option on the table.
- The "permission folded into the query" figure checks `published:true` only, not the full
  disjunction, so it is a lower bound rather than an equivalent implementation.
