/**
 * Coverage check.
 *
 * The list below is transcribed from the switch in
 * app/api/search/metadataMatchers.js (filterToMatch) plus the aggregation
 * families in metadataAggregations.js. If someone adds a filter type to Uwazi
 * without adding a probe, this fails -- which is the only way the suite stays
 * honest about what "covered" means.
 */
const REQUIRED_BRANCHES = [
  'textFilter',
  'textFilter/fan',
  'rangeFilter',
  'multiselectFilter/any',
  'multiselectFilter/missing',
  'multiselectFilter/or',
  'multiselectFilter/and',
  'daterange',
  'strictNestedFilter',
  'nestedFilter',
  'aggregation/terms',
  'aggregation/selectAggregation.parent',
  'aggregation/self-exclusion',
  'aggregation/multi-facet-single-pass',
  'aggregation/sidebar-scaling',
  'sort/declared',
  'sort/undeclared',
  'sort/correctness',
  'sort/text',
];

// Known gaps, stated rather than silently absent.
const NOT_YET_COVERED = {
  relationshipfilter:
    'queries relationships.metadata.*, but the Postgres entities table has no ' +
    'relationships column (migration 005) -- nothing to index yet',
  'aggregation/permissions':
    'the "Shared with" facet: nested + reverse_nested over permissions; needs a ' +
    'COUNT(DISTINCT) over a join, not yet probed',
  'aggregation/nested':
    'nested-property facets use reverse_nested to count entities rather than ' +
    'nested rows; not yet probed',
  fulltext: 'PDF text lives in files.fullText, a different table (tradeoffs §I.6)',
};

const checkCoverage = probeList => {
  const covered = new Set(probeList.map(p => p.branch));
  const missing = REQUIRED_BRANCHES.filter(b => !covered.has(b));

  const report = [
    `${REQUIRED_BRANCHES.length - missing.length}/${REQUIRED_BRANCHES.length} required branches covered`,
    ...missing.map(b => `MISSING PROBE: ${b}`),
    ...Object.entries(NOT_YET_COVERED).map(([b, why]) => `not covered: ${b} — ${why}`),
  ];

  return { missing, report };
};

export { checkCoverage, REQUIRED_BRANCHES, NOT_YET_COVERED };
