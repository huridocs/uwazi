/**
 * Full-text probe matrix.
 *
 * The spec here is the set of things a user does with PDF text in the library:
 * find a word inside documents regardless of language, see highlighted
 * snippets, jump to the page a snippet came from, and get one result row per
 * entity rather than one per matching page.
 *
 * Every search is LANGUAGE AGNOSTIC by construction: the query fans across all
 * partitions and never filters by language. Each partition stems the term with
 * its own rules and can only match documents actually written in that language.
 */
import { partitions } from '../lib/fulltextSchema.mjs';

const PARADEDB_SCAN = 'Custom Scan (ParadeDB';
const PARTS = partitions();

/** The agnostic fan: every partition, no language filter. */
const fan = (term, select = 'shared_id, file_id, page') =>
  PARTS.map(
    ({ table }) =>
      `SELECT ${select}, pdb.score(id) AS score FROM ${table} WHERE contents @@@ '${term}'`
  ).join(' UNION ALL ');

const fanWithSnippet = term =>
  PARTS.map(
    ({ table }) =>
      `SELECT shared_id, file_id, page, pdb.score(id) AS score, pdb.snippet(contents) AS snip
       FROM ${table} WHERE contents @@@ '${term}'`
  ).join(' UNION ALL ');

/**
 * The correct shape for a ranked page of snippets.
 *
 * The LIMIT must be pushed INTO every partition branch. With the LIMIT only on
 * the outer query, each partition generates snippets for every one of its
 * matches before the outer sort discards them -- measured at 400k pages that is
 * 2828ms versus 7.7ms, a 367x difference for identical results.
 */
const rankedFanWithSnippet = (term, limit = 30) =>
  `SELECT * FROM (${PARTS.map(
    ({ table }) =>
      `(SELECT shared_id, file_id, page, pdb.score(id) AS score, pdb.snippet(contents) AS snip
        FROM ${table} WHERE contents @@@ '${term}' ORDER BY pdb.score(id) DESC LIMIT ${limit})`
  ).join(' UNION ALL ')}) u ORDER BY score DESC LIMIT ${limit}`;

const probes = ({ pagesPerFile = 20, filesPerEntity = 2 } = {}) => [
  {
    id: 'ft-agnostic-search',
    branch: 'fulltext/agnostic',
    description:
      'A user types one word and gets hits from documents in any language, without ' +
      'choosing a language anywhere. The query fans across every partition.',
    sql: `SELECT count(*)::int AS n FROM (${fan('massacre')}) u`,
    check: rows => (rows[0].n > 0 ? null : 'agnostic search found nothing'),
  },
  {
    id: 'ft-stemming-english',
    branch: 'fulltext/stemming',
    description:
      'Searching a base form must find inflected forms. "investigation" has to match ' +
      'pages that only contain "investigations" or "investigated".',
    sql: `SELECT count(*)::int AS n FROM ft_english WHERE contents @@@ 'investigation'`,
    check: rows => (rows[0].n > 0 ? null : 'english stemming did not match inflected forms'),
    planHas: [PARADEDB_SCAN],
  },
  {
    id: 'ft-stemming-spanish',
    branch: 'fulltext/stemming',
    description: 'Same for Spanish: "investigacion" must find "investigaciones".',
    sql: `SELECT count(*)::int AS n FROM ft_spanish WHERE contents @@@ 'investigacion'`,
    check: rows => (rows[0].n > 0 ? null : 'spanish stemming did not match inflected forms'),
    planHas: [PARADEDB_SCAN],
  },
  {
    id: 'ft-stemming-russian',
    branch: 'fulltext/stemming',
    description: 'Non-latin script with a stemmer: "расследование" must find "расследования".',
    sql: `SELECT count(*)::int AS n FROM ft_russian WHERE contents @@@ 'расследование'`,
    check: rows => (rows[0].n > 0 ? null : 'russian stemming did not match inflected forms'),
    planHas: [PARADEDB_SCAN],
  },
  {
    id: 'ft-default-partition',
    branch: 'fulltext/default-partition',
    description:
      'A language with no ParadeDB stemmer (catalan here) lands in the DEFAULT partition ' +
      'and stays searchable by exact word -- degraded, not broken.',
    sql: `SELECT count(*)::int AS n FROM ft_other WHERE contents @@@ 'massacre'`,
    check: rows => (rows[0].n > 0 ? null : 'default partition returned nothing'),
    planHas: [PARADEDB_SCAN],
  },
  {
    id: 'ft-snippets',
    branch: 'fulltext/snippets',
    description:
      'Highlighted snippets, the thing that forced this index shape. Must come back with ' +
      '<b> markup, which is what the current API already emits.',
    // NOTE: a pdb.snippet() result cannot be used in a WHERE clause -- doing so
    // fails with "Unsupported query shape". Snippets have to be consumed by the
    // application, not filtered or sorted on in SQL.
    sql: `SELECT snip FROM (${fanWithSnippet('massacre')}) u LIMIT 5`,
    check: rows => {
      if (!rows.length) return 'no snippets returned';
      const bad = rows.filter(r => !r.snip?.includes('<b>'));
      return bad.length ? `${bad.length} snippet(s) without <b> markup` : null;
    },
  },
  {
    id: 'ft-snippets-not-null',
    branch: 'fulltext/snippets',
    description:
      'Guards the reason for this shape: snippets are NULL when a match comes from an ' +
      'aliased field. Every row here must have one.',
    sql: `SELECT snip FROM (${fanWithSnippet('massacre')}) u LIMIT 200`,
    check: rows => {
      const nulls = rows.filter(r => r.snip === null).length;
      return nulls === 0 ? null : `${nulls}/${rows.length} matches produced a NULL snippet`;
    },
  },
  {
    id: 'ft-page-number',
    branch: 'fulltext/page-jump',
    description:
      'Click a snippet, jump to that page. The page is a plain column, so no marker ' +
      'parsing is needed -- and it must be within the document.',
    sql: `SELECT min(page)::int AS lo, max(page)::int AS hi FROM (${fan('massacre')}) u`,
    check: rows =>
      rows[0].lo >= 1 && rows[0].hi <= pagesPerFile
        ? null
        : `page range ${rows[0].lo}..${rows[0].hi} outside 1..${pagesPerFile}`,
  },
  {
    id: 'ft-one-row-per-entity',
    branch: 'fulltext/result-collapse',
    description:
      'The library list shows one row per entity, not one per matching page. Collapsing ' +
      'by shared_id must reduce the row count and keep the best-scoring page.',
    sql: `WITH hits AS (${fan('massacre')})
          SELECT (SELECT count(*) FROM hits)::int AS pages,
                 (SELECT count(DISTINCT shared_id) FROM hits)::int AS entities`,
    check: rows =>
      rows[0].entities > 0 && rows[0].entities < rows[0].pages
        ? null
        : `collapse did nothing: ${rows[0].pages} pages -> ${rows[0].entities} entities`,
  },
  {
    id: 'ft-all-documents-indexed',
    branch: 'fulltext/all-documents',
    description:
      'Every attached PDF is searchable, not just a default one. An entity with several ' +
      'files must be able to match on more than one of them.',
    sql: `SELECT max(files)::int AS max_files FROM (
            SELECT shared_id, count(DISTINCT file_id) AS files
            FROM (${fan('massacre')}) u GROUP BY shared_id) t`,
    check: rows =>
      rows[0].max_files >= Math.min(2, filesPerEntity)
        ? null
        : `only ${rows[0].max_files} file(s) per entity matched; expected multiple`,
  },
  {
    id: 'ft-phrase-search',
    branch: 'fulltext/phrase',
    description: 'Quoted phrase search inside documents, with word order enforced.',
    sql: `SELECT count(*)::int AS n FROM ft_english
          WHERE contents @@@ pdb.phrase(ARRAY['massacre','witness'])`,
    check: rows => (rows[0].n >= 0 ? null : 'phrase search failed'),
    planHas: [PARADEDB_SCAN],
  },
  {
    id: 'ft-ranked-snippets',
    branch: 'fulltext/snippets',
    description:
      'A ranked page of results with snippets. The LIMIT must be pushed into every ' +
      'partition branch; leaving it only on the outer query makes each partition ' +
      'highlight all of its matches before they are discarded.',
    sql: rankedFanWithSnippet('massacre', 30),
    check: rows => {
      if (rows.length === 0) return 'no ranked results';
      const nulls = rows.filter(r => r.snip === null).length;
      if (nulls) return `${nulls} ranked rows had a NULL snippet`;
      const scores = rows.map(r => Number(r.score));
      const sorted = [...scores].sort((a, b) => b - a);
      return JSON.stringify(scores) === JSON.stringify(sorted) ? null : 'results not score-ordered';
    },
  },

  {
    id: 'ft-language-isolation',
    branch: 'fulltext/isolation',
    description:
      'A partition may only contain its own language. If Spanish documents leaked into ' +
      'the English partition they would be stemmed with the wrong rules.',
    sql: `SELECT count(DISTINCT language)::int AS n FROM ft_english`,
    rows: [{ n: 1 }],
  },
];

export { probes, fan, fanWithSnippet, rankedFanWithSnippet, PARTS };
