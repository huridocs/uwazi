/**
 * Join probes: combining entity metadata and PDF text into one ranked list.
 *
 * Two things are being asserted here, and the first is a security property.
 *
 * 1. The full-text partitions have NO row-level security of their own -- the
 *    permission rules live on `entities`. A query that reads the partitions
 *    without joining to `entities` returns pages from documents the actor is
 *    not allowed to see. The join is mandatory for correctness, not just for
 *    ranking.
 *
 * 2. BM25 scores from two different indexes are not on a common scale, so they
 *    cannot be added. Reciprocal Rank Fusion combines the two branches by
 *    position rather than by score.
 */
import { partitions } from '../lib/fulltextSchema.mjs';

const PARTS = partitions();
const RANK_K = 60;

/** Pages matching `term`, without any permission filtering. */
const rawFan = term =>
  PARTS.map(({ table }) => `SELECT shared_id FROM ${table} WHERE contents @@@ '${term}'`).join(
    ' UNION ALL '
  );

/** The same, but joined to `entities` so RLS applies. */
const safeFan = term => `
  SELECT u.shared_id FROM (${rawFan(term)}) u
  JOIN entities e ON e."sharedId" = u.shared_id`;

/** Top-K pages per partition, collapsed to one row per entity, RLS enforced. */
const textBranch = (term, limit) => `
  SELECT shared_id, RANK() OVER (ORDER BY s DESC, shared_id) AS rank FROM (
    SELECT u.shared_id, max(u.score) AS s
    FROM (${PARTS.map(
      ({ table }) =>
        `(SELECT shared_id, pdb.score(id) AS score FROM ${table}
          WHERE contents @@@ '${term}' ORDER BY pdb.score(id) DESC LIMIT 500)`
    ).join(' UNION ALL ')}) u
    JOIN entities e ON e."sharedId" = u.shared_id
    GROUP BY u.shared_id
  ) t ORDER BY s DESC LIMIT ${limit}`;

const metaBranch = (term, limit) => `
  SELECT "sharedId" AS shared_id, RANK() OVER (ORDER BY s DESC, "sharedId") AS rank FROM (
    SELECT "sharedId", max(pdb.score(_id)) AS s FROM entities
    WHERE _id @@@ 'title:${term} OR metadata.probe_text.value:${term}'
    GROUP BY "sharedId"
  ) m ORDER BY s DESC LIMIT ${limit}`;

/** The combined library query, ranked by Reciprocal Rank Fusion. */
const rrfQuery = (term, limit = 30, pool = 200) => `
WITH text_branch AS (${textBranch(term, pool)}), meta_branch AS (${metaBranch(term, pool)})
SELECT COALESCE(m.shared_id, t.shared_id) AS shared_id,
       m.rank AS meta_rank, t.rank AS text_rank,
       (COALESCE(1.0/(${RANK_K} + m.rank), 0) + COALESCE(1.0/(${RANK_K} + t.rank), 0)) AS rrf
FROM meta_branch m FULL OUTER JOIN text_branch t ON t.shared_id = m.shared_id
ORDER BY rrf DESC LIMIT ${limit}`;

const probes = ({ term = 'tribunal' } = {}) => [
  {
    id: 'join-permissions-leak',
    branch: 'join/permissions',
    description:
      'SECURITY: querying the full-text partitions directly returns entities the actor ' +
      'cannot see. The joined form must return strictly fewer. If these ever match, ' +
      'either the fixture lost its restricted entities or RLS stopped being applied.',
    sql: `SELECT
            (SELECT count(DISTINCT shared_id) FROM (${rawFan(term)}) a)::int  AS unjoined,
            (SELECT count(DISTINCT shared_id) FROM (${safeFan(term)}) b)::int AS joined`,
    check: rows => {
      const { unjoined, joined } = rows[0];
      if (joined >= unjoined) return `join did not filter anything (${unjoined} -> ${joined})`;
      return null;
    },
  },
  {
    id: 'join-uses-indexes',
    branch: 'join/pushdown',
    description:
      'The combined query must use the ParadeDB index on entities AND on every full-text ' +
      'partition -- one custom scan per relation.',
    sql: rrfQuery(term),
    check: () => null,
    planCheck: plan => {
      const scans = (plan.match(/Custom Scan \(ParadeDB[^)]*\)/g) ?? []).length;
      const expected = PARTS.length + 1;
      return scans < expected ? `${scans} ParadeDB scans, expected ${expected}` : null;
    },
  },
  {
    id: 'join-entities-not-scanned',
    branch: 'join/pushdown',
    description:
      'The RLS join to `entities` should not fall back to reading the whole table. On a SMALL ' +
      'entities table a Seq Scan is a legitimate planner choice for building the join hash, ' +
      'so this only fails once the table is large enough for that to matter.',
    sql: `SELECT count(*)::int AS n FROM entities`,
    check: () => null,
    planCheckSql: rrfQuery(term),
    planCheckNeedsRowCount: true,
    planCheck: (plan, entityCount) => {
      if (!/Seq Scan on entities/.test(plan)) return null;
      return entityCount > 50000
        ? `Seq Scan on entities at ${entityCount} rows -- the join stopped using the index`
        : null;
    },
  },
  {
    id: 'join-scores-not-comparable',
    branch: 'join/ranking',
    description:
      'Documents WHY ranking uses rank fusion rather than score addition: BM25 scores from ' +
      'the two indexes differ by orders of magnitude, so adding them lets metadata matches ' +
      'bury every document-text match.',
    sql: `
      WITH t AS (${textBranch(term, 500)}), m AS (${metaBranch(term, 500)}),
      ts AS (SELECT max(s) AS hi FROM (
        SELECT u.shared_id, max(u.score) AS s FROM (${PARTS.map(
          ({ table }) =>
            `(SELECT shared_id, pdb.score(id) AS score FROM ${table}
            WHERE contents @@@ '${term}' ORDER BY pdb.score(id) DESC LIMIT 500)`
        ).join(' UNION ALL ')}) u
        JOIN entities e ON e."sharedId" = u.shared_id GROUP BY u.shared_id) x),
      ms AS (SELECT max(s) AS hi FROM (
        SELECT "sharedId", max(pdb.score(_id)) AS s FROM entities
        WHERE _id @@@ 'title:${term} OR metadata.probe_text.value:${term}'
        GROUP BY "sharedId") y)
      SELECT (SELECT hi FROM ms)::float AS meta_hi, (SELECT hi FROM ts)::float AS text_hi`,
    check: rows => {
      const { meta_hi, text_hi } = rows[0];
      if (!meta_hi || !text_hi) return 'one branch produced no scores';
      const ratio = meta_hi / text_hi;
      return ratio > 10
        ? null
        : `scores are within ${ratio.toFixed(1)}x -- the imbalance this documents has gone`;
    },
  },
  {
    id: 'join-rrf-interleaves',
    branch: 'join/ranking',
    description:
      'Rank fusion must let BOTH sources into the results. Adding raw scores gives a page ' +
      'made entirely of metadata matches; RRF should surface document-text matches too.',
    sql: rrfQuery(term),
    check: rows => {
      if (!rows.length) return 'no results';
      const text = rows.filter(r => r.text_rank !== null).length;
      const meta = rows.filter(r => r.meta_rank !== null).length;
      if (text === 0) return 'no document-text matches reached the results';
      if (meta === 0) return 'no metadata matches reached the results';
      return null;
    },
  },
  {
    id: 'join-rrf-ordered',
    branch: 'join/ranking',
    description: 'The fused list must actually be ordered by its fusion score.',
    sql: rrfQuery(term),
    check: rows => {
      const s = rows.map(r => Number(r.rrf));
      const sorted = [...s].sort((a, b) => b - a);
      return JSON.stringify(s) === JSON.stringify(sorted) ? null : 'results not in RRF order';
    },
  },
];

export { probes, rrfQuery, textBranch, metaBranch, rawFan, safeFan };
