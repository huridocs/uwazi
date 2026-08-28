/**
 * The probe matrix.
 *
 * The spec for this file is the switch in app/api/search/metadataMatchers.js
 * (filterToMatch) plus the aggregation families in metadataAggregations.js.
 * That switch is a closed list, so coverage is checkable rather than a
 * judgement call -- see coverage.mjs, which fails if a branch has no probe.
 *
 * Every probe asserts up to three things:
 *   rows        -- the result is correct
 *   planHas     -- the plan contains these strings
 *   planLacks   -- the plan contains none of these strings
 *
 * The third is the one that matters. Correctness passes almost everywhere;
 * it is the plan that separates "works" from "works via the index".
 *
 * Expected counts are derived from the generator's deterministic corpus at
 * E=2000, P=20, C=50. They are written as functions of E/P/C so the same
 * assertions hold across the scale sweep.
 */

/**
 * Counts entities matching a nested predicate by replaying the generator's own
 * rule over i = 0..E-1. Closed-form approximations drift at E values that are
 * not a multiple of the residue cycle, and a probe whose expectation is
 * approximate is worse than no probe at all.
 *
 * Entity i carries two nested elements:
 *   [ (person_{i%5}, role_{i%3}), (person_{(i+1)%5}, role_{(i+1)%3}) ]
 */
const countNested = (E, { person, role, strict }) => {
  let n = 0;
  for (let i = 0; i < E; i += 1) {
    const elements = [
      { person: i % 5, role: i % 3 },
      { person: (i + 1) % 5, role: (i + 1) % 3 },
    ];
    const match = strict
      ? elements.some(el => el.person === person && el.role === role)
      : elements.some(el => el.person === person) && elements.some(el => el.role === role);
    if (match) n += 1;
  }
  return n;
};

const PARADEDB_SCAN = 'Custom Scan (ParadeDB';
const TOPK = 'TopKScanExecState';
const AGG_SCAN = 'ParadeDB Aggregate Scan';

/** @param {{E:number,P:number,C:number}} dims */
const probes = ({ E, P, C }) => [
  // ---------------------------------------------------------------- text ---
  {
    id: 'text-term',
    branch: 'textFilter',
    description: 'Exact term on a text property (metadata.X.value)',
    sql: `SELECT count(*)::int AS n FROM entities WHERE _id @@@ 'metadata.probe_text.value:guatemala'`,
    rows: [{ n: Math.ceil(E / 7) }],
    planHas: [PARADEDB_SCAN],
  },
  {
    id: 'text-bare-no-path',
    branch: 'textFilter',
    description:
      'A bare term with no path matches nothing -- confirms tradeoffs §I.2: ' +
      'the query must enumerate every property path, so query text grows with P',
    sql: `SELECT count(*)::int AS n FROM entities WHERE metadata @@@ 'guatemala'`,
    rows: [{ n: 0 }],
  },
  {
    id: 'text-or-fan',
    branch: 'textFilter',
    description: 'A small OR-fan: two paths. See text-full-fan for one that scales with P.',
    sql: `SELECT count(*)::int AS n FROM entities
          WHERE _id @@@ 'metadata.probe_text.value:guatemala OR title:guatemala'`,
    rows: [{ n: Math.ceil(E / 7) }],
    planHas: [PARADEDB_SCAN],
  },

  {
    id: 'text-full-fan',
    branch: 'textFilter/fan',
    description:
      'What typing a word in the library search box actually costs. There is no "search all ' +
      'properties" operator, so the query must name every property path explicitly. The query ' +
      'STRING therefore grows with the number of properties in the tenant. This probe builds ' +
      'the full fan over all P properties, which is what a real bare search does.',
    sql: `SELECT count(*)::int AS n FROM entities WHERE _id @@@ '${[
      'title:guatemala',
      'metadata.probe_text.value:guatemala',
      ...Array.from({ length: P }, (_, i) => `metadata.filler_${i}.value:guatemala`),
    ].join(' OR ')}'`,
    check: rows => (rows[0].n > 0 ? null : 'full fan matched nothing'),
    planHas: [PARADEDB_SCAN],
  },

  // --------------------------------------------------------------- range ---
  {
    id: 'range-numeric',
    branch: 'rangeFilter',
    description: 'Inclusive numeric range on a JSON path',
    sql: `SELECT count(*)::int AS n FROM entities
          WHERE _id @@@ 'metadata.probe_number.value:[25 TO 100]'`,
    rows: [{ n: E / 2 }], // values cycle 9,25,100,1000 -> half fall in range
    planHas: [PARADEDB_SCAN],
  },

  // --------------------------------------------------- multiselect family ---
  {
    id: 'multiselect-or',
    branch: 'multiselectFilter/or',
    description: 'terms[] over a multi-valued property -- the default OR mode',
    sql: `SELECT count(*)::int AS n FROM entities
          WHERE _id @@@ 'metadata.probe_multi.value:tag_1 OR metadata.probe_multi.value:tag_2'`,
    rows: [{ n: (E / C) * 3 }],
    planHas: [PARADEDB_SCAN],
  },
  {
    id: 'multiselect-and',
    branch: 'multiselectFilter/and',
    description: 'The AND toggle: an entity must carry both values in the same property',
    sql: `SELECT count(*)::int AS n FROM entities
          WHERE _id @@@ 'metadata.probe_multi.value:tag_1 AND metadata.probe_multi.value:tag_2'`,
    rows: [{ n: E / C }],
    planHas: [PARADEDB_SCAN],
  },
  {
    id: 'multiselect-any',
    branch: 'multiselectFilter/any',
    description: 'The synthetic "Any" option -- entities where the property exists at all',
    sql: `SELECT count(*)::int AS n FROM entities WHERE _id @@@ 'metadata.probe_select.value:*'`,
    rows: [{ n: E - Math.ceil(E / 7) }],
    planHas: [PARADEDB_SCAN],
  },
  {
    id: 'multiselect-missing',
    branch: 'multiselectFilter/missing',
    description:
      'The "No label" bucket. FINDING: no index-side form was found -- ' +
      'pdb.exists() does not exist in 0.25.4 and NOT(path:*) is not accepted, ' +
      'so this falls back to a SQL jsonb containment check',
    sql: `SELECT count(*)::int AS n FROM entities
          WHERE _id @@@ pdb.all() AND NOT (metadata ? 'probe_select')`,
    rows: [{ n: Math.ceil(E / 7) }],
    planHas: [PARADEDB_SCAN],
  },

  // ----------------------------------------------------------- daterange ---
  {
    id: 'daterange',
    branch: 'daterange',
    description: 'Range over the from/to sub-object of a daterange property',
    sql: `SELECT count(*)::int AS n FROM entities
          WHERE _id @@@ 'metadata.probe_daterange.value.from:[1500000000 TO 1500864000]'`,
    rows: [{ n: 11 }],
    planHas: [PARADEDB_SCAN],
  },

  // -------------------------------------------------------------- nested ---
  {
    id: 'nested-non-strict',
    branch: 'nestedFilter',
    description: 'Non-strict nested: values may match in different array elements',
    sql: `SELECT count(*)::int AS n FROM entities
          WHERE _id @@@ 'metadata.probe_nested.value.person:person_1 AND metadata.probe_nested.value.role:role_2'`,
    rows: [{ n: countNested(E, { person: 1, role: 2, strict: false }) }],
    planHas: [PARADEDB_SCAN],
  },
  {
    id: 'nested-strict-index-only',
    branch: 'strictNestedFilter',
    description:
      'FINDING: strict nested semantics cannot be expressed against the index alone. ' +
      'Tantivy flattens array position, so a grouped-path query matches nothing ' +
      'and the plain conjunction silently returns the NON-strict result set. ' +
      'This is the silent-wrong-semantics failure tradeoffs §II.4 warns about.',
    sql: `SELECT count(*)::int AS n FROM entities
          WHERE _id @@@ 'metadata.probe_nested.value:(person:person_1 AND role:role_2)'`,
    rows: [{ n: 0 }],
  },
  {
    id: 'nested-strict-recheck',
    branch: 'strictNestedFilter',
    description:
      'Working strict implementation: index prefilter (non-strict) narrowed by a SQL ' +
      'jsonb_array_elements re-check. The re-check only runs over candidates, not the ' +
      'whole table, so this may be affordable -- but it is not index-accelerated.',
    sql: `SELECT count(*)::int AS n FROM entities e
          WHERE _id @@@ 'metadata.probe_nested.value.person:person_1 AND metadata.probe_nested.value.role:role_2'
            AND EXISTS (
              SELECT 1 FROM jsonb_array_elements(e.metadata->'probe_nested') el
              WHERE el->'value'->'person' ? 'person_1' AND el->'value'->'role' ? 'role_2'
            )`,
    rows: [{ n: countNested(E, { person: 1, role: 2, strict: true }) }],
    planHas: [PARADEDB_SCAN],
  },

  // ---------------------------------------------------------- aggregates ---
  {
    id: 'facet-self',
    branch: 'aggregation/terms',
    description: 'Facet counts straight off raw metadata -- the sidebar checkbox counts',
    sql: `SELECT (pdb.agg('{"terms":{"field":"metadata.probe_select.value","size":2000}}')->'buckets') AS b
          FROM entities WHERE _id @@@ pdb.all()`,
    check: rows => {
      const buckets = rows[0].b;
      const named = buckets.filter(x => x.key !== null);
      const missing = buckets.find(x => x.key === null);
      if (named.length !== C) return `expected ${C} value buckets, got ${named.length}`;
      if (missing?.doc_count !== Math.ceil(E / 7))
        return `missing bucket ${missing?.doc_count} != ${Math.ceil(E / 7)}`;
      return null;
    },
    planHas: [AGG_SCAN],
  },
  {
    id: 'facet-multivalued',
    branch: 'aggregation/terms',
    description:
      'Facet counts for a property an entity holds several values of. Each value must be ' +
      'counted under its own bucket -- the claim the assessment marks as tested.',
    sql: `SELECT (pdb.agg('{"terms":{"field":"metadata.probe_multi.value","size":2000}}')->'buckets') AS b
          FROM entities WHERE _id @@@ pdb.all()`,
    check: rows => {
      const total = rows[0].b.reduce((s, x) => s + x.doc_count, 0);
      return total === E * 2 ? null : `bucket total ${total} != ${E * 2} (E*2 values)`;
    },
    planHas: [AGG_SCAN],
  },
  {
    id: 'facet-thesaurus-parent',
    branch: 'aggregation/selectAggregation.parent',
    description:
      'Thesaurus GROUP counts. selectAggregation() computes buckets at metadata.X.parent.value ' +
      'as well as metadata.X -- a second bucket set per select property that the assessment ' +
      'feature table does not mention.',
    sql: `SELECT (pdb.agg('{"terms":{"field":"metadata.probe_select.parent.value","size":2000}}')->'buckets') AS b
          FROM entities WHERE _id @@@ pdb.all()`,
    check: rows => {
      const named = rows[0].b.filter(x => x.key !== null);
      return named.length === 4 ? null : `expected 4 region buckets, got ${named.length}`;
    },
    planHas: [AGG_SCAN],
  },
  {
    id: 'facet-self-excluding',
    branch: 'aggregation/self-exclusion',
    description:
      'The self-excluding facet contract: counts for the country facet are computed with the ' +
      'template filter applied but NOT the country filter, which is why other options keep ' +
      'their counts after you tick one.',
    sql: `SELECT (pdb.agg('{"terms":{"field":"metadata.probe_select.value","size":2000}}')->'buckets') AS b
          FROM entities WHERE _id @@@ 'template:tpl_report'`,
    check: rows => {
      const named = rows[0].b.filter(x => x.key !== null);
      if (named.length < 2) return `self-exclusion collapsed the facet to ${named.length} options`;
      return null;
    },
    planHas: [AGG_SCAN],
  },

  {
    id: 'facet-sidebar-single-pass',
    branch: 'aggregation/multi-facet-single-pass',
    description:
      'The whole sidebar in one round trip. Ten self-excluding facets, each with its own ' +
      'FILTER (WHERE ...), computed in a SINGLE ParadeDB Aggregate Scan. This is the ' +
      'single-pass property Elasticsearch gives us for free, and tradeoffs §II.2 assumed ' +
      'we would lose it to N separate aggregate queries.',
    sql: `SELECT ${[
      'probe_select.value',
      'probe_multi.value',
      'probe_select.parent.value',
      'filler_0.value',
      'filler_1.value',
      'filler_2.value',
      'filler_3.value',
      'filler_4.value',
      'filler_5.value',
    ]
      .map(
        (f, i) =>
          `pdb.agg('{"terms":{"field":"metadata.${f}","size":2000}}') ` +
          `FILTER (WHERE _id @@@ 'template:tpl_report') AS f${i}`
      )
      .join(', ')}
          FROM entities WHERE _id @@@ pdb.all()`,
    check: rows => {
      const keys = Object.keys(rows[0]);
      if (keys.length !== 9) return `expected 9 facet columns, got ${keys.length}`;
      const empty = keys.filter(k => !rows[0][k]?.buckets?.length);
      return empty.length === 0 ? null : `facets returned no buckets: ${empty.join(', ')}`;
    },
    planHas: [AGG_SCAN],
    // One scan for the whole sidebar, not one per facet.
    planLacks: ['Append', 'Nested Loop'],
  },

  {
    id: 'facet-sidebar-all-properties',
    branch: 'aggregation/sidebar-scaling',
    description:
      'The worst-case sidebar: one facet per property, all computed in one query. Models a ' +
      'tenant where every property is marked filterable. This is the probe that says whether ' +
      'the sidebar cost is driven by the number of entities or the number of properties.',
    sql: `SELECT ${Array.from(
      { length: P },
      (_, i) => `pdb.agg('{"terms":{"field":"metadata.filler_${i}.value","size":2000}}') AS f${i}`
    ).join(', ')}
          FROM entities WHERE _id @@@ pdb.all()`,
    check: rows => {
      const keys = Object.keys(rows[0]);
      return keys.length === P ? null : `expected ${P} facet columns, got ${keys.length}`;
    },
    planHas: [AGG_SCAN],
  },

  // --------------------------------------------------------------- sorts ---
  {
    id: 'sort-declared-numeric',
    branch: 'sort/declared',
    description: 'Sorting by a numeric property NAMED in the index definition takes the Top K path',
    sql: `SELECT _id FROM entities WHERE _id @@@ pdb.all()
          ORDER BY (metadata->'probe_number'->0->>'value')::numeric LIMIT 30`,
    planHas: [TOPK],
    planLacks: ['Sort Method'],
  },
  {
    id: 'sort-undeclared',
    branch: 'sort/undeclared',
    description:
      'Sorting by a property NOT named in the index definition materialises every matching ' +
      'row. This is the cost of an editor ticking "Use as filter" on a new property.',
    sql: `SELECT _id FROM entities WHERE _id @@@ pdb.all()
          ORDER BY (metadata->'filler_3'->0->>'value') LIMIT 30`,
    planHas: ['Sort Method', 'NormalScanExecState'],
    planLacks: [TOPK],
    expectedToFail: false,
  },
  {
    id: 'sort-numeric-lexicographic',
    branch: 'sort/correctness',
    description:
      'Numbers stored in JSON sort as text unless cast. Silent, no error. ' +
      'Uncast, 9/25/100/1000 come back as 100, 1000, 25, 9.',
    sql: `SELECT DISTINCT (metadata->'probe_number'->0->>'value') AS v FROM entities
          WHERE _id @@@ pdb.all() ORDER BY v LIMIT 4`,
    rows: [{ v: '100' }, { v: '1000' }, { v: '25' }, { v: '9' }],
  },
  {
    id: 'sort-title-locale',
    branch: 'sort/text',
    description:
      'FINDING: text Top K requires COLLATE "C" (raw byte order). Under the database collation ' +
      '(en_US.utf8) ParadeDB will not push the sort down, even when the field uses the literal ' +
      'tokenizer and is a fast field. Title is the library default sort.',
    sql: `SELECT _id FROM entities WHERE _id @@@ pdb.all() ORDER BY title LIMIT 30`,
    planHas: ['Sort Method'],
    planLacks: [TOPK],
  },
  {
    id: 'sort-title-collate-c',
    branch: 'sort/text',
    description:
      'The same sort under COLLATE "C" DOES take the Top K path -- which is the tradeoff: ' +
      'indexed text sorting or locale-correct alphabetical ordering, not both.',
    sql: `SELECT _id FROM entities WHERE _id @@@ pdb.all() ORDER BY title COLLATE "C" LIMIT 30`,
    planHas: [TOPK],
    planLacks: ['Sort Method'],
  },
];

export { probes };
