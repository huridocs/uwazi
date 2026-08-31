# ParadeDB for entity search — findings

**Status:** living document. Entity metadata, PDF full text, combining the two into one ranked result
list, and behavior under concurrent load are all covered.

**Version tested:** ParadeDB `pg_search` 0.25.4 on PostgreSQL 17.

---

## 1. What ParadeDB is, in one minute

ParadeDB is a **PostgreSQL extension**. It adds a new kind of index — you point it at a table you
already have, and you get full-text search, filtering and aggregations over that table, inside the
same database.

Three properties matter for everything below:

1. **The index lives inside Postgres.** No separate service, no separate copy of the data to keep in
   sync. The index is updated in the same transaction as the write, so anything you save is
   immediately searchable.
2. **The index is declared once, up front.** You list the columns (and expressions) you want
   indexed, at `CREATE INDEX` time. Adding something to that list means rebuilding the index.
3. **It stores two representations of your data.** One answers _"which rows contain this word?"_
   (search and filtering). Another stores values laid out column by column — that one is what makes
   _counting_ and _sorting_ fast. Numbers get the second one automatically; text and JSON only get
   it if you ask.

That third point drives several findings, so it is worth re-reading.

---

## 2. The setup these findings are based on

This is the most important section. **Everything measured below assumes one specific, deliberately
minimal setup**, and the numbers do not transfer to a different one.

### The cheapest possible migration

We tested **pointing ParadeDB at the `entities` table exactly as it exists today**:

- No new tables.
- No change to how metadata is stored.
- No projection, flattening or denormalization of any kind.
- One index, one shape.

This is the lowest-effort version of the migration. We wanted to know what it buys before
considering anything more elaborate, because every alternative costs significantly more work.

### The index

```sql
CREATE INDEX entities_search_idx ON entities
USING paradedb (
  "_id",
  ("tenant_id"::pdb.literal),
  ("title"::pdb.literal),                                       -- for sorting
  ("title"::pdb.unicode_words('alias=title_search')),           -- for searching
  ("template"::pdb.literal),
  ("language"::pdb.literal),
  "published",
  "creationDate",
  "editDate",
  ("metadata"::pdb.unicode_words('columnar=true')),             -- the whole metadata column
  -- one line per property we want to sort by, see §6
  (("metadata"->'some_prop'->0->>'value')::numeric::pdb.alias('sort_some_prop'))
) WITH (key_field='_id');
```

### The `metadata` column is indexed whole

This is the key line:

```sql
("metadata"::pdb.unicode_words('columnar=true'))
```

We hand ParadeDB the **entire `metadata` JSONB column**, as-is. It walks the JSON itself, discovers
every path inside it (`metadata.country.value`, `metadata.author.label`, and so on), and infers each
one's type automatically.

**There is no schema listing the properties.** We never enumerate them, and nothing needs updating
when a template gains a property. A tenant can define as many properties as it likes.

`columnar=true` is what enables counting and sorting over that JSON. It applies to the whole
`metadata` column at once — it is not per property. Without it, facet counts do not merely get slow,
they error.

### It is one index shared by all tenants

`entities` is a single table with a `tenant_id` column, and a ParadeDB index is an index _on a
table_. So this setup produces **one index containing every tenant's data**.

Queries are still correctly isolated — the tenant filter and the permission rules are applied and
were verified — but the _storage_ is shared. Section 8 covers what that does and does not cost.

### How the numbers were produced

- A generated corpus, deterministic and reproducible, with the same metadata shapes we store in
  production (properties as arrays of `{value, label}`, thesaurus entries carrying a `parent`,
  nested properties as arrays of sub-objects).
- Three dials: **number of entities**, **number of properties per entity**, **number of distinct
  values per property**.
- Every query run **as a collaborator**, not an admin — so the permission rules are actually being
  enforced, rather than short-circuited.
- Each measurement is the median of 5 runs.

> **How much to trust the numbers.** Single machine, warm cache, one query at a time, synthetic
> data. They are reliable for **shape** — does this grow with the corpus or stay flat, is this one
> operation or many — and not for capacity planning. Nothing here says anything about behaviour
> under concurrent load.

---

## 3. Summary

| Area                                        | Verdict                                                                         |
| ------------------------------------------- | ------------------------------------------------------------------------------- |
| Searching titles and metadata               | Works                                                                           |
| Every filter type in the library            | Works                                                                           |
| Sidebar counts, including thesaurus groups  | Works, and the whole sidebar is one query                                       |
| Permissions                                 | Enforced by the database — correct, but the biggest single cost; see §4 and §12 |
| Property name/type collisions               | Not a problem — better than we expected                                         |
| Sorting by numbers and dates                | Works, if the property is declared in the index                                 |
| Sorting by text                             | Works via a stored sort key — see §6                                            |
| **Nested "strict" filters**                 | **Needs a workaround — see §5**                                                 |
| **Sidebar with very many properties**       | **Hard ceiling — see §7**                                                       |
| **Scaling search reads across replicas**    | **Blocked on Community license — see §9**                                       |
| PDF full-text search, language-agnostic     | Works — see §10                                                                  |
| Snippets, page numbers, jump-to-page        | Works — see §10                                                                  |
| Searching every attached PDF, not just one  | Works — new behaviour, see §10                                                   |
| Metadata + document text in one ranked list | Works, with rank fusion — see §11                                               |
| Permissions over document text              | Enforced by joining to entities — see §11                                       |
| Behavior under concurrent load              | ~25–30 req/s for the library screen; see §12                                    |

---

## 4. Search patterns that work

Each row is a real thing a user does in the library. "Pattern" is the underlying query shape.

### Filtering

| What the user does                                                  | Result              |
| ------------------------------------------------------------------- | ------------------- |
| Picks a value in a text filter                                      | Works               |
| Picks a number or date range                                        | Works               |
| Ticks one or more options in a multi-select                         | Works               |
| Switches a multi-select to "match all" (AND) instead of "match any" | Works               |
| Uses the **Any** option — "has this property at all"                | Works               |
| Uses the **No label** option — "this property is empty"             | Works, but see note |
| Filters a date-range property by an overlapping window              | Works               |

**Note on "No label".** There is no index-side way to ask "this path is absent" in this version — the
function you would expect (`pdb.exists`) does not exist. It falls back to an ordinary SQL check on
the JSON column. It is correct and it is fast in our tests, but it is worth knowing it is not going
through the search index.

**Multi-valued properties behave correctly.** An entity tagged with both _Guatemala_ and _Honduras_
is found by either, and counted under both. This was the thing we were least sure about going in,
since Uwazi stores every property as a list.

### Counting — the sidebar

The counts next to each checkbox (`Guatemala (35)`) are **facets**. Uwazi's sidebar has a subtle
rule: when you tick _Guatemala_, the other countries must **keep their counts** so you can add
_Honduras_, while the other filters' counts do drop. Each filter's counts are computed with every
other active filter applied, but not its own.

|                                                                            | Result                                              |
| -------------------------------------------------------------------------- | --------------------------------------------------- |
| Counts per option                                                          | Works, computed directly from the `metadata` column |
| Correct counts for multi-valued properties                                 | Works                                               |
| **Thesaurus group counts** (counting by parent group, not just leaf value) | Works                                               |
| The "keep other options' counts" rule                                      | Works, via a per-facet filter                       |
| **The whole sidebar in a single query**                                    | **Works**                                           |

That last row is the most useful finding in this document. Each facet is one column in a single
`SELECT`, and they all resolve in **one pass over the index**:

| Entities | 1 facet | 20-facet sidebar, one query | Ratio     |
| -------- | ------- | --------------------------- | --------- |
| 2,000    | 2.2 ms  | 12.4 ms                     | 5.6×      |
| 20,000   | 13 ms   | 27 ms                       | 2.1×      |
| 100,000  | 34 ms   | 52 ms                       | 1.5×      |
| 300,000  | 93 ms   | 99 ms                       | **1.06×** |

The sidebar does not become twenty round trips. Better still, **the ratio improves as the collection
grows**: the cost is dominated by scanning the data once, and each additional facet adds very little
on top. On a large collection twenty facets are close to free once you have paid for the first.

### The sidebar's UI contract — easy to break, very visible

Worth stating because it is not obvious from the code and a rebuild has to reproduce it exactly. From
`app/react/Forms/components/MultiSelect.tsx`:

- Each option shows its result count, and options are **sorted by count**, descending.
- **Options with zero results are hidden entirely** — unless already ticked, in which case they stay
  so the user can untick them.
- Below the list there is an "N more options" expander, and past a threshold "N+ more options —
  Narrow your search". That threshold is tied to `PRELOAD_OPTIONS_SEARCH = 2000` fetched against
  `PRELOAD_OPTIONS_LIMIT = 200` displayed (`app/shared/config.ts`).
- The **Any** option and the **No label** bucket are assembled in post-processing, not by the search
  engine.

The consequence is worth being blunt about: **wrong counts do not show wrong numbers, they make
options disappear.** If the self-exclusion rule is implemented incorrectly, ticking one option makes
every other option in that same filter vanish, because they all count zero. That is a very visible
bug and an easy one to ship.

The 65,000-bucket ceiling in §7 interacts with this too — anything that changes how many buckets we
can afford to compute changes the "N more options" text.

### Searching text

| What the user does                    | Result |
| ------------------------------------- | ------ |
| Types a word, matches entity titles   | Works  |
| Types a word, matches metadata values | Works  |
| Phrase search with quotes             | Works  |
| `AND` / `OR` / `NOT`                  | Works  |

**One important detail about the search box.** There is no "search everywhere" operator. A query
must name the paths it searches:

```
title:guatemala OR metadata.summary.value:guatemala OR metadata.author.label:guatemala OR ...
```

Asking for a bare word with no path returns **zero results** — silently, not as an error. So the
application has to build that list of paths for every search. It is still executed as a single index
scan, but the _text of the query_ grows with the number of properties in the tenant. Section 7 has
the cost.

### Permissions

The permission rules are enforced by PostgreSQL itself (row-level security), not by the query
builder. A query cannot accidentally return rows the user may not see, regardless of how it is
written.

We were concerned this would prevent ParadeDB from using its optimizations, since the rule is a
three-way condition including an array-overlap check. **It does not.** All the fast paths survive it.

It does not change the shape of any query plan. But it is **not cheap**, and an earlier version of
this document understated it badly by comparing a collaborator against an admin — both of whom are
subject to the same rules. Measured against a connection where the rules do not apply at all:

| The same query, 200,000 entities                     | Time        | vs no check |
| ---------------------------------------------------- | ----------- | ----------- |
| No permission check at all                           | 6.9 ms      | 1.0×        |
| Permission written into the search query             | 22.5 ms     | 3.2×        |
| Permission as an ordinary SQL condition              | 35.7 ms     | 5.1×        |
| **Permission enforced by the database (what we do)** | **52.2 ms** | **7.5×**    |

Under concurrent load the difference is larger — see §12.

The reason it cannot be optimized away: the rule contains a check of "is this user's id in the
document's permission list", expressed as an array comparison. The search index cannot answer that,
so for every candidate row the database has to go and read the actual row to check. Adding the
permission list to the index recovered only about 18%.

Note also that being an admin does not help: the "skip all checks" branch is evaluated at almost the
same cost (58.8 ms) as the full check (68.7 ms).

**This is a genuine trade, not a tuning detail.** Database-enforced permissions are the safest option
— a query cannot forget them — and they are also the most expensive of the three, roughly 2.3× the
cost of writing the check into the search query. It applies to every search the product runs.

> **Caveat.** Our generated corpus is two-thirds published. The permission rule is
> `published = true OR <expensive check>`, and PostgreSQL stops at the first condition that is true —
> so for most rows the expensive half never ran. A collection that is mostly _unpublished_ would
> exercise it far more. That is a scenario we have not measured, and it could make this number worse.

### Property name and type collisions

**Not a problem, and this genuinely surprised us.**

Because there is no schema, two properties with the same name and different types coexist without
conflict. ParadeDB records the _type_ as part of each indexed value, so a `date` called `conflict_date`
and a text field called `conflict_date` are simply different entries.

We tested both the cross-tenant case (tenant A stores numbers, tenant B stores strings, same name,
same shared index) and the harder same-tenant case (two templates in one collection disagreeing about
a property's type):

|                                            | Result    |
| ------------------------------------------ | --------- |
| Index builds with the conflict present     | No error  |
| Numeric queries against the numeric values | Correct   |
| Range queries against the numeric values   | Correct   |
| Text queries against the text values       | Correct   |
| One type leaking into the other's results  | **Never** |
| Facet counts for both                      | Correct   |

One thing for whoever writes the API response layer: when a property genuinely holds mixed types,
the facet buckets come back with **mixed JSON types** — `{"key": 42}` and `{"key": "forty two"}` in
the same array. Front-end code assuming `key` is always a string could break on that. It is a
pre-existing data inconsistency becoming visible, not a new problem.

---

## 5. Nested properties need a workaround

A nested property is a small table inside a single entity:

| Person | Role  |
| ------ | ----- |
| Maria  | Judge |
| Pedro  | Clerk |

The filter has a **strict** mode, and that mode is the entire point of the feature:

- **Strict:** "entities where **Maria is a Judge**" — must match in the same row.
- **Non-strict:** "entities where Maria appears somewhere **and** a Judge appears somewhere."

An entity listing _Maria — Clerk_ and _Pedro — Judge_ should match the second but **not** the first.

**ParadeDB's index cannot express strict mode.** When it indexes the JSON it flattens the rows,
recording that the entity contains Maria, Pedro, Judge and Clerk, and losing which went with which.

The dangerous part is _how_ it fails. The strict query does not error — it **silently returns the
non-strict answer**. In our test the correct answer was 266 entities and the index alone returned 533. A filter meaning "Maria as a Judge" quietly starts meaning "Maria somewhere, a Judge somewhere".

**There is a working fix.** Use the index to narrow to candidates (the non-strict result), then
re-check the row pairing in SQL over just those candidates. This returns the correct answer, and
because the re-check only runs over candidates rather than the whole table it stays affordable — but
it is not index-accelerated, so it is the slowest pattern we measured as the corpus grows (§7).

Importantly, this does **not** force us to build a separate table, which was the outcome we feared.

---

## 6. Sorting — the main problem

Sorting is the one area where this setup is clearly weaker than we would like. There are two
separate issues and it helps to keep them apart.

### Issue 1: properties must be named in the index to sort quickly

To sort _quickly_ by a metadata property, that exact property must be written into the
`CREATE INDEX` statement as its own line. Adding one means rebuilding the index.

**The feature still works without that.** An editor ticks "Use as filter", the property appears in
the sort dropdown, and sorting by it returns the correct order. Nothing breaks and no reindex is
required for it to _function_.

But when the property is not declared, PostgreSQL loads **every matching entity** and sorts all of
them to show you thirty:

| Collection size | Rows read per row displayed |
| --------------- | --------------------------- |
| 2,000           | 67                          |
| 20,000          | 667                         |
| 100,000         | 3,333                       |
| 300,000         | 10,000                      |

That grows without limit. So the honest description is: _works fine on small collections, degrades
badly on large ones, and a reindex is what buys the speed back._

When the property **is** declared, the index stops at exactly the thirty rows requested — confirmed
at every size, with permission rules active.

### Issue 2: for text properties, declaring it does not help

This is the finding we would flag hardest.

**Collation** is the rule for alphabetical order. Your database uses `en_US.utf8` — what people
expect: `apple, Banana, café, Zebra`. There is also `C` collation, which is raw byte order: **all**
uppercase before **any** lowercase, and accented characters after `z`.

ParadeDB will only use its fast sorting path on text if the query asks for `COLLATE "C"`. Under the
normal database collation it refuses — the index stores text in byte order, and it cannot guarantee
that matches what `en_US` ordering would produce.

This applies to **every text property**, including `title` and `template`, which are ordinary
columns rather than JSON paths — so it is not a consequence of how metadata is stored.

### There is a way to get both, and it is what we already do

The fix is not a setting — it is to change _what is stored_. Precompute a normalised sort key
(lowercase, accents folded) and byte-order that instead. Measured on 100,000 entities:

| `ORDER BY`                       | Order the user sees               | Speed                   |
| -------------------------------- | --------------------------------- | ----------------------- |
| `title`                          | `ähnlich, Ápice, apple, …`        | 268 ms, reads all rows  |
| `title COLLATE "C"`              | `Banana, Zebra, apple, …` ❌      | 109 ms, stops at 30     |
| **`sortkey(title) COLLATE "C"`** | **`ähnlich, Ápice, apple, …`** ✅ | **108 ms, stops at 30** |

The normalised key reproduces the database's own ordering **exactly** — verified against Swedish,
Spanish, German and mixed-case sets, where it matched `en_US.utf8` in every case.

This is the same technique Elasticsearch uses today: `string_sorter_normalized` is lowercase +
asciifolding, applied to a keyword sort field. So the default path ports at full parity.

Two caveats. `unaccent()` is `STABLE`, so it needs a thin `IMMUTABLE` wrapper before it can go in an
index expression. And the sort key still has to be **declared** per property, exactly like numbers —
so this solves the ordering problem, not the "one line per sortable property" problem.

**What is genuinely lost** is the ICU mode (`USE_ELASTIC_ICU=true`), which gives true per-locale
collation: Swedish å/ä/ö after `z`, Spanish `ñ` after `n`. Neither the normalised key nor the current
non-ICU default handles those, so this is a gap that **already exists** rather than one the migration
introduces.

**Numbers and dates are fine** — declare them and you get correct ordering on the fast path.

### A smaller trap: numbers sort as text

A number stored inside JSON sorts lexicographically unless explicitly cast to a numeric type:

```
100, 1000, 25, 9        instead of        9, 25, 100, 1000
```

Silent, no error. It has to be handled deliberately for each numeric and date property.

---

## 7. How it scales

Two dials, measured separately. Both as a collaborator, median of 5 runs.

### Growing the number of entities

Properties fixed at 20 per entity.

| Pattern                                  | 2,000  | 20,000 | 100,000 | 300,000   |
| ---------------------------------------- | ------ | ------ | ------- | --------- |
| Filter by a property                     | 2.0 ms | 10 ms  | 32 ms   | 80 ms     |
| Text search across all properties        | 2.6 ms | 12 ms  | 35 ms   | 81 ms     |
| One facet                                | 2.2 ms | 13 ms  | 34 ms   | 93 ms     |
| **Whole sidebar (20 facets, one query)** | 12 ms  | 28 ms  | 52 ms   | **99 ms** |
| Sort by a **declared** property          | 2.1 ms | 18 ms  | 113 ms  | 350 ms    |
| Sort by an **undeclared** property       | 4.5 ms | 49 ms  | 232 ms  | 851 ms    |
| Sort by title (normal collation)         | 3.9 ms | 41 ms  | 272 ms  | 788 ms    |
| Nested strict (index + SQL re-check)     | 2.3 ms | 24 ms  | 136 ms  | 401 ms    |

**Reading this:**

- Filtering, searching and faceting grow **sub-linearly** — 150× the data costs about 40× the time.
- The **whole sidebar costs barely more than a single facet** at every size. This is the strongest
  result in the document.
- **Sorting is the expensive family**, and the undeclared/text cases are 2.5–8× worse than the
  declared ones.
- **No query plan changed shape** anywhere in this range. Nothing quietly fell back to a slower
  strategy as the corpus grew.

### Growing the number of properties

Entities fixed at 20,000. This is the dial that decides whether a tenant with a very large schema is
viable.

| Pattern                                 | 10 props | 50 props | 200 props | 600 props  |
| --------------------------------------- | -------- | -------- | --------- | ---------- |
| Filter by one property                  | 11 ms    | 11 ms    | 16 ms     | 16 ms      |
| One facet                               | 12 ms    | 14 ms    | 17 ms     | 18 ms      |
| Fixed 9-facet sidebar                   | 19 ms    | 19 ms    | 21 ms     | 22 ms      |
| **Search box across all properties**    | 11 ms    | 15 ms    | 22 ms     | **30 ms**  |
| **Sidebar with one facet per property** | 18 ms    | 47 ms    | **fails** | **fails**  |
| **Sort by an undeclared property**      | 35 ms    | 101 ms   | 319 ms    | **692 ms** |
| Sort by title                           | 38 ms    | 41 ms    | 42 ms     | 41 ms      |
| Nested strict re-check                  | 23 ms    | 42 ms    | 66 ms     | 118 ms     |

**Reading this — three things stand out.**

**Most operations are flat.** Filtering and faceting barely notice going from 10 to 600 properties,
because a query names the one path it needs regardless of how many exist. **The property count is
not, in general, a scaling problem.**

**The search box grows, but gently.** 60× more properties costs about 3× more time. This is the
cost of naming every path in the query. Manageable, and it can be capped by only searching
filterable properties rather than all of them.

**Sorting by an undeclared property gets worse with more properties, not just more entities.**
692 ms at 600 properties, and this is at only 20,000 entities. The reason is that the whole
`metadata` document has to be read and sorted, and that document is larger when there are more
properties. Both dials multiply here — this is the worst-scaling pattern we found.

### The one hard ceiling we found

A single aggregation query may return at most **65,000 buckets** in total. A bucket is one option in
one facet, so:

```
(number of facets in the query) × (options per facet)  <  65,000
```

**This is a fixed maximum, not a default.** The setting exists but refuses any value above 65,000.

In our corpus each property had 350 distinct values, which allows about **185 facets in one query**.
Past that the query fails outright with an error — it does not degrade, it stops.

**This is workable, and the workaround is straightforward:** split the sidebar into batches. Computing
all 600 facets over 20,000 entities:

| Batch size | Queries | Total time |
| ---------- | ------- | ---------- |
| 150 facets | 4       | 498 ms     |
| 100 facets | 6       | 527 ms     |
| 50 facets  | 12      | 581 ms     |
| 25 facets  | 24      | 784 ms     |

So a very large schema costs a handful of queries rather than one. Note this is an extreme case —
600 filterable properties each with 350 distinct values. **Whether any real tenant approaches this is
an open question, and it is worth answering with a query against production data**, because it
determines whether the ceiling is a real constraint or a theoretical one.

---

## 8. What "one shared index" costs

Since all tenants share one index, we measured whether one tenant's data affects another's queries.
We took a tenant with 20,000 entities, measured it, then added a **200,000-entity neighbour** and
re-ran the identical queries.

| The small tenant's query | Alone       | With a 10× larger neighbour |
| ------------------------ | ----------- | --------------------------- |
| Filter by a property     | 11.6 ms     | 11.1 ms                     |
| Text search              | 11.1 ms     | 11.3 ms                     |
| Facet counts             | 11.2 ms     | 11.9 ms                     |
| **Sort by date**         | **10.9 ms** | **21.4 ms**                 |

**Filtering, searching and faceting are essentially unaffected** — a neighbour ten times your size
costs you nothing measurable. That was better than expected.

**Sorting is the exception**, and it doubled. Sorting walks the index in sorted order, and that order
spans all tenants, so it has to step over other tenants' rows to find yours. More neighbours, more
stepping.

Two further consequences that are not about speed:

- **The index is as large as all tenants combined** (3.6 MB → 37 MB when we added the neighbour).
- **You cannot rebuild one tenant's index.** A rebuild rebuilds everything.

### If we wanted per-tenant isolation back

PostgreSQL can split the table by tenant (partitioning), which produces one index per tenant. We
tested it, and it does deliver: the sorting penalty disappears, and a single tenant can be reindexed
on its own. But it comes with two catches that would need solving first:

1. **The sidebar aggregation function does not work on a partitioned table at all.** It refuses with
   `unsupported relation type`. Queries would have to be routed to a tenant's specific partition by
   name, or the sidebar rebuilt using ordinary SQL grouping.
2. **Permission rules do not inherit into partitions.** We set the rule on the parent table, then
   queried a partition directly as a restricted user and **all restricted documents were returned**,
   with no error. Each partition needs its own policy, created when the tenant is created. Miss one
   and that tenant's private documents are readable.

Partitioning is also a decision about the `entities` table as a whole, not a search decision — so it
is not ours alone to make.

---

## 9. Scaling reads: replicas and the license wall

Everything measured in this document ran against **one Postgres instance**. This section is about
what happens when we try to spread read load across more than one — because that is our actual infra,
and it turns out not to be a purely technical question.

### Our infra today

One primary (read/write) and **two standby nodes**. Those two standbys exist for **failover**, not for
load distribution — no search (or any other read) traffic is routed to them today. The question is
whether they could be, to take search load off the primary.

### How Elasticsearch scales reads

Elasticsearch's read scaling is built in and free: an index is split into **shards**, each shard can
have any number of **replicas**, and any node holding a replica can serve a query. Add nodes, add
replicas, reads spread across them — no license tier gates this.

### How ParadeDB scales reads

ParadeDB has no shards or replicas of its own — it is a Postgres index, so it scales the way Postgres
scales: by adding standby nodes and pointing read traffic at them. That is where it stops being purely
technical:

| Replication method                                            | Can a standby answer `pg_search` (BM25) queries?               |
| --------------------------------------------------------------- | ---------------------------------------------------------------- |
| **Physical streaming replication** (what our 2 standbys use)    | **No, on Community.** Requires WAL integration — Enterprise-only |
| Logical replication                                              | Yes, on Community — but a different, heavier-to-operate mechanism |
| ParadeDB Enterprise (commercial license)                         | Yes — physical standbys become search-capable read replicas       |

The restriction is explicit, not a bug: ParadeDB's own error message on Community, when you try, says
serving reads from a standby "requires write-ahead log (WAL) integration, which is supported on
ParadeDB Enterprise, not ParadeDB Community."

**Concretely, for us:** our two existing standbys cannot take search read load under the Community
(AGPL) license, no matter how we tune anything above. Getting there means either an Enterprise license,
or replacing physical streaming replication with logical replication as the mechanism feeding
search-serving replicas — a real architecture change (separate replication slots, replication lag to
manage, DDL doesn't replicate automatically), not a config flag.

### The comparison, in one line

**Elasticsearch:** read scaling is a capacity decision — add nodes. **ParadeDB Community:** read
scaling off physical replicas isn't available at all; you're on one instance for search reads
regardless of how many standbys you run. **ParadeDB Enterprise:** closes that gap, at a commercial
license cost.

---

## 10. PDF full text

Tested separately from entity metadata, because it lives in its own table and behaves differently.

### Why one row per page

Today the page number is not stored anywhere — it is glued onto **every single word** of the text, so
page 12 is stored as `tribunal[[12]] massacre[[12]] witness[[12]] …`. Elasticsearch strips those
markers before indexing and we read the page number back out of the highlighted snippet. It is how
"click a snippet, jump to page 12" works.

**ParadeDB cannot strip them.** Fed that text as-is, it would treat every marker as a word, sitting
between every pair of real words — which breaks phrase search inside documents and inflates the
index.

So the page number has to stop living inside the text and become a column instead. A column means a
row per page. That also deletes the marker scheme entirely, which shrinks the stored text.

There is a cost, and it is the main one in this section: a search matching 171,000 **pages** is
really 7,100 **documents**, so pages have to be grouped into entities before results can be shown
(see [Performance](#performance)). Storing one row per document would avoid that grouping — but then
the page number has nowhere to live except back inside the text, which is the thing ParadeDB cannot
handle. The trade is forced.

### The shape

PDF text is stored **one row per page**, linked to the entity by its shared id:

```sql
CREATE TABLE entity_fulltext (
  id, tenant_id, shared_id, file_id,
  page      INTEGER,   -- a real column
  language  TEXT,      -- the PDF's own language
  contents  TEXT
) PARTITION BY LIST (language);
```

Two deliberate changes from how this works today:

- **Every attached PDF is indexed**, not one chosen document per entity.
- **The text is stored once per file**, not once per entity translation — so an entity with five
  translations no longer means five copies of the same document text.

Clicking a snippet to jump to a page needs no text parsing at all — the page is simply selected
alongside the snippet.

### Language handling

The table is **partitioned by the PDF's own detected language**, one partition per language ParadeDB
can actually stem (20 of them), plus a `DEFAULT` partition for everything else.

Each partition indexes the text with its own language's stemmer and stopword list. Verified working
in English, Spanish, Russian and Arabic, including non-Latin scripts.

**Searching is language agnostic.** A user types one word; the query asks every partition at once and
never filters by language. Each partition applies its own stemming rules and can only match documents
actually written in that language. Nobody picks a language anywhere in the UI or the query.

**Languages with no stemmer** (Armenian, Basque, Bulgarian, Catalan, Galician, Hindi, Indonesian,
Irish, Latvian, Lithuanian, Sorani) land in the `DEFAULT` partition. They stay fully searchable by
exact word, but searching a base form will not find inflected forms. This is a deliberate, declared
trade — those languages get correct word segmentation for their script, just no stemming.

Stemming is not a nicety. Measured: searching the Spanish base form `investigacion` returns
**0 results** without stemming and 2 with it. For an archive where researchers search concepts rather
than exact word forms, dropping it would roughly halve recall in inflected languages.

### What works

| What the user does                              | Result                                             |
| ----------------------------------------------- | -------------------------------------------------- |
| Search a word inside documents, in any language | Works                                              |
| Get highlighted snippets                        | Works — same `<b>` markup the API already produces |
| See which page a snippet came from              | Works — it is a column                             |
| Click a snippet, jump to that page              | Works, with no marker parsing                      |
| Phrase search inside a document                 | Works                                              |
| Search within one open document                 | Works                                              |
| Get one result row per entity, not one per page | Works                                              |
| Find text in a second or third attached PDF     | **Works — new behavior**                           |

### Performance

| Query                                     | 20k pages | 100k   | 400k       |
| ----------------------------------------- | --------- | ------ | ---------- |
| Search one language                       | 0.4 ms    | 0.9 ms | 6.2 ms     |
| Search all languages at once              | 4.4 ms    | 13 ms  | 21 ms      |
| A page of 30 results with snippets        | 5.8 ms    | 6.0 ms | **7.6 ms** |
| Searching inside one open document        | 0.5 ms    | 2.2 ms | 8.8 ms     |
| Phrase search                             | 0.7 ms    | 3.2 ms | 8.6 ms     |
| Grouping page matches into entity results | 8.6 ms    | 20 ms  | 36 ms      |

Two things worth understanding in that table.

**Snippets are effectively flat.** A page of results costs the same at 400,000 pages as at 20,000,
because each partition stops as soon as it has its 30 best matches.

This only holds if the query is written correctly. Asking for the results first and trimming to 30
afterwards makes every partition highlight _all_ of its matches before throwing them away —
**2,842 ms instead of 7.6 ms** for exactly the same output. A 367× difference that depends purely on
where one `LIMIT` goes. It is now guarded by an automated check.

**Grouping pages into entities is the query to watch.** Full text is stored per page, but the library
lists entities — a search matching 171,000 pages is really 7,100 documents, and showing the same
document 24 times in a row with a result count of 171,000 would be wrong. So pages are grouped into
entities, keeping each entity's best-scoring page (which also supplies the snippet and the page
number).

That step cannot stop early: an entity's rank depends on its best page, which might be page 400 of a
long document, so every matching page must be scored. Its cost therefore tracks **how common the
search word is**, not how big the collection is:

| Search term                 | Matching pages | Grouping cost |
| --------------------------- | -------------- | ------------- |
| A word in 43% of all pages  | 171,440        | 44 ms         |
| A word in 29% of all pages  | 114,300        | 34 ms         |
| A word that matches nothing | 0              | 8 ms          |

44 ms is close to the worst case — a term matching nearly half the corpus. Real searches are far more
selective. This is a bounded, measurable cost rather than a design problem, but it is the shape that
would degrade first on a much larger collection.

### Known constraints

- **Snippets are output-only.** A snippet cannot be used in a `WHERE` clause. This matches how the
  application already works — highlights come back from the search engine and are assembled in
  application code — but it means "only show results whose match was in the document text" has to be
  expressed as a search condition, not as a test on the snippet.
- **Each partition has a fixed cost of roughly 3 MB even when empty**, so the partitioned table
  carries about 40 MB of floor regardless of content.
- **Adding support for a new language is a schema change**, not a configuration change. Nothing
  breaks in the meantime — documents in that language sit in the `DEFAULT` partition and remain
  searchable without stemming.
- **Language detection remains a guess** made from the document's own text. A misdetected document
  gets the wrong stemmer, and now also sits in the wrong partition. Correcting the language moves it
  automatically.

## 11. Combining metadata and document text

The library shows one ranked list containing entities that matched on their metadata **and** entities
that matched inside their PDFs. That means joining the two tables, which raised two questions — both
now answered.

### Permissions: the join is mandatory

The full-text table has **no access rules of its own**. They live on the entities table.

Measured as a collaborator, with 200 entities deliberately restricted to another user:

| Query                                | Entities returned |
| ------------------------------------ | ----------------- |
| Document text queried on its own     | 7,143             |
| The same, joined to entities         | 6,999             |
| **Documents that would have leaked** | **144**           |

So any code path that searches document text **must** join to the entities table. Without it, a user
can read text from documents they have no access to. There is no partial version of this — it is a
correctness requirement, and it is now covered by an automated check.

### Ranking: the two scores cannot simply be added

Each index calculates relevance using its own statistics, so the two sets of scores are not on a
comparable scale. For the same search term:

| Source          | Matches | Score range |
| --------------- | ------- | ----------- |
| Entity metadata | 2,828   | 3.23 – 3.65 |
| Document text   | 1,696   | 0.000019    |

Adding them produced a first page of results that was **entirely metadata matches** — no document
text hit could ever surface, no matter how good.

The fix is a standard technique: rank each source separately, then merge by **position** rather than
by score (reciprocal rank fusion). Same term, same data:

| Ranking method      | First 30 results                  | Cost   |
| ------------------- | --------------------------------- | ------ |
| Adding raw scores   | 30 metadata, **0 document text**  | 238 ms |
| **Merging by rank** | **15 metadata, 15 document text** | 288 ms |

About 20% more expensive, and the only option that produces a usable ordering.

> **A decision for product here.** Merging by rank currently treats both sources as equally
> important. Today's behavior favours metadata over document text, so if we want to preserve that
> feel, the document-text side should be weighted lower. That is a dial, not a rewrite — but someone
> has to choose the setting.

### What it costs

At 200,000 entities and 400,000 pages:

| Part of the query                                    | Cost      |
| ---------------------------------------------------- | --------- |
| Document text (all languages, permissions, grouping) | **19 ms** |
| Entity metadata                                      | 212 ms    |
| Combined and ranked                                  | 288 ms    |

The document-text side is the cheap half, and it barely moved when the collection grew tenfold. The
metadata side dominates — and that cost is the **text search itself**, not the ranking or the join:
ordering those results by relevance costs the same as ordering them by date (173 ms either way).

The query uses the search index on every table involved — one per language partition plus entities —
with no fallback to scanning.

---

## 12. Under concurrent load

Everything above measures one query at a time. This section runs the real library workloads through a
connection pool at rising concurrency, on 12 cores with 200,000 entities and 400,000 pages, always as
a collaborator so the permission rules apply.

### How much traffic it handles

| Workload                          | 1 at a time | 8 at a time | Peak      | Slowest 1% at 32 |
| --------------------------------- | ----------- | ----------- | --------- | ---------------- |
| Searching PDF text, with snippets | 96/s        | 591/s       | **646/s** | 138 ms           |
| Metadata text search              | 6.5/s       | 44/s        | **51/s**  | 1.2 s            |
| Sorting by a property             | 4.5/s       | 30/s        | **35/s**  | 1.3 s            |
| Filtering by a property           | 17/s        | 26/s        | **30/s**  | 3.0 s            |
| The combined library query        | 4.5/s       | 27/s        | **30/s**  | 1.8 s            |
| The filter sidebar (20 facets)    | 14/s        | 21/s        | **25/s**  | 3.6 s            |

Nothing errored at any level — no timeouts, no exhausted connections.

**The library screen tops out at roughly 25–30 requests per second** on this hardware, and the limit
is the filter sidebar. Searching PDF text is an order of magnitude faster than everything else, which
is a good outcome for the part of the product that matters most.

### One clear pattern: counting does not scale, fetching does

| Kind of query               | Efficiency at 8 concurrent |
| --------------------------- | -------------------------- |
| Fetching a page of results  | 75–84%                     |
| Counting / computing facets | 17–19%                     |

Fetching the top 30 results stops after 30 rows, so it spreads across cores almost perfectly.
Counting has to walk **every** matching row, so it saturates memory bandwidth and the extra cores
buy little. This holds even with permissions switched off entirely, so it is inherent to counting
rather than something we introduced.

**In practice: the filter sidebar is the part of the library screen that will run out of headroom
first.** That is worth knowing before anyone tunes anything else.

### The permission rules are the single biggest cost

Under load the effect measured in §4 gets larger:

|                                               | 1 at a time | 8 at a time |
| --------------------------------------------- | ----------- | ----------- |
| Fetching results, permissions **not** applied | 945/s       | 5,841/s     |
| Fetching results, as a collaborator           | 28/s        | 184/s       |
| Counting, permissions **not** applied         | 140/s       | 271/s       |
| Counting, as a collaborator                   | 18/s        | 25/s        |

Roughly **30× less throughput** on result-fetching once permissions are enforced. The query plan is
unchanged — nothing degrades or falls back — but each candidate row has to be read from the table to
check who is allowed to see it.

This is the clearest optimization target in the whole evaluation, and it is a design question rather
than a tuning one: how much of the permission check can move into the search index, and how much
safety are we prepared to trade for it.

### How much to trust these numbers

Single machine, local connections, warm cache, synthetic data. They are reliable for **shape** —
which workloads scale, where saturation starts, how large the permission cost is — and not for
capacity planning on real hardware.

---

## 13. Things to discuss as a group

These are decisions, not more testing. Each one has been measured; what is left is a choice about
what we are willing to trade. Roughly in order of how much they shape the work.

---

### 13.1 Sorting — the one that needs the most discussion

This is the least resolved area and it has three separate parts that get confused with each other.

**Part 1: text sorting needs a stored sort key — solved, but it is work.** ParadeDB will only sort
text through the index in the byte order it stores. Under the database's normal collation it refuses,
so `ORDER BY title` reads every matching row.

The answer is to store a normalised sort key — lowercase, accents folded — and byte-order that. It
reproduces the database's own ordering exactly and keeps the fast path:

| `ORDER BY`                       | Order the user sees               | Speed                  |
| -------------------------------- | --------------------------------- | ---------------------- |
| `title`                          | `ähnlich, Ápice, apple, …`        | 268 ms, reads all rows |
| `title COLLATE "C"`              | `Banana, Zebra, apple, …` ❌      | 109 ms                 |
| **`sortkey(title) COLLATE "C"`** | **`ähnlich, Ápice, apple, …`** ✅ | **108 ms**             |

This is the same trick Elasticsearch uses today (`string_sorter_normalized` = lowercase +
asciifolding), so the default behaviour ports at parity. It applies to `title` and `template` too,
which are plain columns — the problem was never specific to metadata.

> **To decide:** nothing blocking, but two things to note. We would lose the `USE_ELASTIC_ICU=true`
> mode, which gives true per-locale ordering (Swedish å after `z`, Spanish `ñ` after `n`) — a gap
> that already exists whenever that flag is off. And the sort key still has to be declared per
> property, which is Part 2's problem, not this one.

**Part 2: numbers and dates work, but only if declared — and the declaration is per property.**
A sortable property must be written by name into the `CREATE INDEX` statement, with a cast:

```sql
(("metadata"->'date_of_ruling'->0->>'value')::numeric::pdb.alias('sort_date_of_ruling'))
```

That one line buys two things. Without it the property still sorts, but the database reads **every**
matching row to return thirty (10,000 rows read per row displayed at 300k entities), and dates and
numbers come back in text order — `100, 1000, 25, 9` — silently, with no error.

**Part 3: this collides with how the sort dropdown is populated.** The dropdown lists every property
with "Use as filter" ticked, which editors control. So an editor ticking a checkbox creates a
property that sorts _correctly but slowly_, and it stays that way until an engineer edits SQL and
rebuilds the index.

And it degrades on **both** axes — more entities _and_ more properties, because the whole `metadata`
document has to be read to sort by it:

| Undeclared sort                 | Cost   |
| ------------------------------- | ------ |
| 20,000 entities, 20 properties  | 49 ms  |
| 20,000 entities, 600 properties | 692 ms |
| 300,000 entities, 20 properties | 851 ms |

> **To decide:** do we accept a bounded, curated set of fast-sortable properties — and if so, who
> curates it and how does an editor find out their property is not in it? Or do we accept that
> sorting by an arbitrary property is slow on large collections?

---

### 13.2 Ranking — how metadata and document text combine

Two indexes produce two relevance scores on completely different scales (metadata 3.23–3.65,
document text 0.000019). Adding them gives a first page that is **100% metadata matches**.

Merging by rank instead of score fixes it, and costs about 20% more:

| Method            | First 30 results              |
| ----------------- | ----------------------------- |
| Adding raw scores | 30 metadata, 0 document text  |
| Merging by rank   | 15 metadata, 15 document text |

Rank fusion currently treats both sources as equally important. Today's behaviour deliberately
favours metadata over document text.

> **To decide:** what weighting do we want? Equal, or metadata-favoured as today? This is a dial —
> one number — but nobody can pick it from a benchmark. It needs someone who knows how researchers
> actually use the library.

---

### 13.3 Permissions — the largest single cost in the whole evaluation

| Same query, 200k entities              | Time        | vs no check |
| -------------------------------------- | ----------- | ----------- |
| No permission check at all             | 6.9 ms      | 1.0×        |
| Check written into the search query    | 22.5 ms     | 3.2×        |
| Check as an ordinary SQL condition     | 35.7 ms     | 5.1×        |
| **Enforced by the database, as today** | **52.2 ms** | **7.5×**    |

Under concurrent load the gap is roughly **30×** on throughput. The database-enforced version is the
safest — a query cannot forget it — and the most expensive.

> **To decide:** how much of the permission check moves into the search index, and how much of the
> "the database refuses to return rows you may not see" guarantee are we prepared to trade for it?
> For a product used by human-rights organisations that is not a purely technical call.

Two things worth knowing before that conversation: being an admin does **not** avoid the cost, and
our measurements assume a mostly-published collection — a mostly-unpublished one would be worse, and
we have not measured it.

---

### 13.4 The filter sidebar — the first thing that runs out of headroom

Two independent limits meet here.

- **A hard ceiling:** one aggregation query may return at most **65,000 buckets** (facets × options).
  It is a fixed maximum, not a setting. Past it the query fails outright. Batching works — 600 facets
  in 4 queries, 498 ms — so it is survivable, not fatal.
- **Under load it saturates first.** The sidebar tops out around 25 requests/second, below every
  other workload, because counting has to walk every matching row and does not scale with cores.

> **To decide:** nothing yet — this one needs a fact first. **How many filterable properties, with
> how many distinct options, do our largest real tenants actually have?** That single query decides
> whether the ceiling is a real constraint or a theoretical one, and it also settles §13.1's "bounded
> set of sortable properties" question. Worth running before the meeting.

---

### 13.5 Tenant isolation

All tenants share one index. Measured, that is cheaper than feared — a neighbour ten times your size
costs essentially nothing for filtering, searching and faceting; only sorting doubles. But two
non-performance consequences remain: the index is the size of all tenants combined, and **a rebuild
rebuilds everything**, so per-tenant reindexing is lost.

Partitioning restores it, and we tested that it works — but the sidebar aggregation function does not
run on a partitioned table at all, and permission rules do not inherit into partitions (we confirmed
a restricted user reading everything through a partition).

> **To discuss:** this is a decision about the `entities` table, not about search. It needs whoever
> owns the Postgres migration in the room.

---

### 13.6 Languages without stemmers

Eleven languages we stem today have no ParadeDB stemmer (Armenian, Basque, Bulgarian, Catalan,
Galician, Hindi, Indonesian, Irish, Latvian, Lithuanian, Sorani). They stay fully searchable by exact
word, but a base form will not find inflected forms.

> **To confirm:** this was accepted as a declared trade when the index shape was chosen. Worth
> restating to the group rather than leaving it buried, since it is a real quality regression for any
> collection in those languages.

---

### 13.7 Read scaling requires a license, or a different replication mechanism

Our infra is one primary plus two standbys, currently used only for failover. On ParadeDB Community,
those standbys **cannot** serve `pg_search` reads at all — physical streaming replication is
Enterprise-only (it needs WAL integration Community doesn't have). Elasticsearch has no equivalent
gate: replicas serve reads for free, on any tier.

See §9 for the detail. The two ways out are a commercial license, or rebuilding read distribution on
logical replication instead of the physical streaming replication we use today.

> **To decide:** is an Enterprise license in scope for this migration, or does "search reads only ever
> hit one instance" become an accepted constraint (at least until logical-replication-based read
> distribution is built and proven)? This changes the cost comparison against Elasticsearch materially
> — it is not just a feature checkbox.

---

### Facts worth gathering before the meeting

Three lookups, none of which need this harness:

| Question                                                                            | Feeds        |
| ----------------------------------------------------------------------------------- | ------------ |
| How many filterable properties, with how many options, do our largest tenants have? | §13.1, §13.4 |
| What proportion of a real collection is unpublished?                                | §13.3        |
| Which languages do our actual PDF collections use?                                  | §13.6        |

---

## 14. Where this leaves us

Indexing the `metadata` column exactly as it is stored today covers **more than we expected**:
searching, every filter type, facet counts including thesaurus groups, permissions, and property type
collisions all work with no change to the data model. The sidebar keeps its single round trip, and
the number of properties is not, in general, a scaling problem.

PDF full text works too, with a different shape — one row per page, partitioned by the document's own
language — and it turned out to be the **fastest** part of the system, an order of magnitude quicker
than anything else under load. It also gains two things we do not have today: every attached document
is searchable rather than one per entity, and searching is language-agnostic without anyone choosing
a language.

What is left is not really a feasibility question any more. It is five trades, and none of them is
ours alone to make:

- **Sorting** — a bounded set of fast-sortable properties, or slow sorting on arbitrary ones. Text
  ordering itself is solved by a stored sort key, at parity with today.
- **Permissions** — the strongest safety guarantee we could have, at 7.5× the cost.
- **Ranking** — how much document text should count against metadata.
- **Tenant isolation** — one shared index, or partitioning and the two problems it brings.
- **Read scaling** — our standbys can't serve search reads without an Enterprise license or a switch
  to logical replication; Elasticsearch has no equivalent restriction.
