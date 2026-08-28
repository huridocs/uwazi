/**
 * Builds the ParadeDB index DDL.
 *
 * The `sortable` argument is the point of this module. ParadeDB cannot sort by
 * a JSON sub-field through the index unless that specific path is named as an
 * indexed expression at CREATE INDEX time (tradeoffs §I.2, §II.3). So the
 * length of this list is the "limited number of sortable properties" side of
 * the trade, and changing it needs a full rebuild -- which is exactly the cost
 * we want to be able to demonstrate and measure.
 *
 * Two things here were established empirically against pg_search 0.25.4, not
 * from the docs:
 *
 *  - A non-text indexed expression must be cast to pdb.alias(...). Casting to
 *    ::numeric alone is rejected ("indexed expression requires a tokenizer cast
 *    with an alias").
 *  - Tokenizer options are separate quoted arguments. Passing them as one
 *    comma-joined string, pdb.unicode_words('alias=x,columnar=true'), silently
 *    creates a field literally named "x,columnar=true" -- no error, and the
 *    alias is then unqueryable.
 */

const INDEX_NAME = 'entities_search_idx';

/**
 * @param {Array<{name: string, kind: 'text'|'numeric'}>} sortable
 */
const buildIndexDDL = (sortable = []) => {
  const sortExpressions = sortable.map(({ name, kind }) => {
    const path = `("metadata"->'${name}'->0->>'value')`;
    return kind === 'numeric'
      ? `(${path}::numeric::pdb.alias('sort_${name}'))`
      : `(${path}::pdb.literal('alias=sort_${name}'))`;
  });

  const fields = [
    '"_id"',
    '"tenant_id"',
    '"sharedId"',
    // title indexed twice: literal as the primary field (required for Top K
    // ordering), unicode_words under an alias for actual text search.
    '("title"::pdb.literal)',
    `("title"::pdb.unicode_words('alias=title_search', 'columnar=true'))`,
    '("template"::pdb.literal)',
    '("language"::pdb.literal)',
    '"published"',
    '"creationDate"',
    '"editDate"',
    // columnar=true is what makes facet counts work off raw metadata at all.
    `("metadata"::pdb.unicode_words('columnar=true'))`,
    ...sortExpressions,
  ];

  return `CREATE INDEX ${INDEX_NAME} ON entities\nUSING paradedb (\n  ${fields.join(',\n  ')}\n) WITH (key_field='_id');`;
};

const dropIndexDDL = () => `DROP INDEX IF EXISTS ${INDEX_NAME};`;

/** The properties the probe suite expects to be declared sortable. */
const DEFAULT_SORTABLE = [
  { name: 'probe_number', kind: 'numeric' },
  { name: 'probe_text', kind: 'text' },
];

export { buildIndexDDL, dropIndexDDL, INDEX_NAME, DEFAULT_SORTABLE };
