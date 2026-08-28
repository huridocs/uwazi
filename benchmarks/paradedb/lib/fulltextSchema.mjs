/**
 * Full-text index shape: one row per (file, page), partitioned by the PDF's own
 * detected language.
 *
 * Why partitioned rather than one table with per-language aliases: a ParadeDB
 * index sets its tokenizer per indexed field, and a relation may only have one
 * ParadeDB index. Aliases can give several tokenizers on one column, but
 * pdb.snippet() returns NULL for any match that came from an aliased field --
 * so snippets and per-language stemming are mutually exclusive in that shape.
 * Each partition is its own relation, so each gets `contents` as its PRIMARY
 * field with its own stemmer: stemming AND snippets, with no duplication.
 *
 * One partition per stemmer ParadeDB actually supports, plus a DEFAULT
 * partition for everything else (unknown, undetectable, and the languages with
 * no Snowball stemmer). DEFAULT uses ICU tokenization -- no stemming, but
 * correct word segmentation for any script.
 */

/** Snowball stemmers available in pg_search 0.25.4. */
const STEMMERS = [
  'arabic',
  'czech',
  'danish',
  'dutch',
  'english',
  'finnish',
  'french',
  'german',
  'greek',
  'hungarian',
  'italian',
  'norwegian',
  'polish',
  'portuguese',
  'romanian',
  'russian',
  'spanish',
  'swedish',
  'tamil',
  'turkish',
];

/** Stopword lists are available for fewer languages than stemmers. */
const STOPWORDS = new Set([
  'czech',
  'danish',
  'dutch',
  'english',
  'finnish',
  'french',
  'german',
  'hungarian',
  'italian',
  'norwegian',
  'polish',
  'portuguese',
  'russian',
  'spanish',
  'swedish',
]);

const DEFAULT_PARTITION = 'other';

/** Every partition name, in query order. DEFAULT last. */
const partitions = () => [
  ...STEMMERS.map(l => ({ language: l, table: `ft_${l}` })),
  { language: DEFAULT_PARTITION, table: `ft_${DEFAULT_PARTITION}`, isDefault: true },
];

const tokenizerFor = language => {
  if (language === DEFAULT_PARTITION) return `"contents"::pdb.icu`;
  const args = [`'stemmer=${language}'`];
  if (STOPWORDS.has(language)) args.push(`'stopwords_language=${language}'`);
  return `"contents"::pdb.unicode_words(${args.join(', ')})`;
};

const schemaDDL = () => {
  const parts = partitions();
  const lines = [
    'DROP TABLE IF EXISTS entity_fulltext CASCADE;',
    '',
    `CREATE TABLE entity_fulltext (
  "id"        BIGINT  NOT NULL,
  "tenant_id" TEXT    NOT NULL,
  "shared_id" TEXT    NOT NULL,
  "file_id"   TEXT    NOT NULL,
  "page"      INTEGER NOT NULL,
  "language"  TEXT    NOT NULL,
  "contents"  TEXT    NOT NULL,
  PRIMARY KEY ("language", "id")
) PARTITION BY LIST ("language");`,
    '',
  ];

  for (const { language, table, isDefault } of parts) {
    lines.push(
      isDefault
        ? `CREATE TABLE ${table} PARTITION OF entity_fulltext DEFAULT;`
        : `CREATE TABLE ${table} PARTITION OF entity_fulltext FOR VALUES IN ('${language}');`
    );
  }
  lines.push('');
  return lines.join('\n');
};

const indexDDL = () =>
  partitions()
    .map(
      ({ language, table }) =>
        `CREATE INDEX ${table}_idx ON ${table} USING paradedb (
  "id", "tenant_id", "shared_id", "file_id", "page",
  (${tokenizerFor(language)})
) WITH (key_field='id');`
    )
    .join('\n');

const dropIndexDDL = () =>
  partitions()
    .map(({ table }) => `DROP INDEX IF EXISTS ${table}_idx;`)
    .join('\n');

export {
  STEMMERS,
  STOPWORDS,
  DEFAULT_PARTITION,
  partitions,
  schemaDDL,
  indexDDL,
  dropIndexDDL,
  tokenizerFor,
};
