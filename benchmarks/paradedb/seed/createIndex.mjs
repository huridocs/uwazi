/**
 * (Re)builds the ParadeDB index and reports how long it took and how big it is.
 *
 * Rebuild time is itself a result: adding one sortable property means paying
 * this cost over the whole corpus, which is what turns "an editor ticks a
 * checkbox" into "an engineer runs a migration".
 *
 * Usage:
 *   node benchmarks/paradedb/seed/createIndex.mjs [--sortable=N]
 */
import { connectAdmin } from '../lib/db.mjs';
import { buildIndexDDL, dropIndexDDL, DEFAULT_SORTABLE, INDEX_NAME } from '../lib/indexDef.mjs';

/**
 * @param {number} extraSortable how many filler properties to additionally
 *   declare as sortable, for measuring how build time and index size scale
 *   with the number of declared sort paths.
 */
const createIndex = async (extraSortable = 0) => {
  const client = await connectAdmin();

  const sortable = [
    ...DEFAULT_SORTABLE,
    ...Array.from({ length: extraSortable }, (_, i) => ({ name: `filler_${i}`, kind: 'text' })),
  ];

  await client.query(dropIndexDDL());
  const started = Date.now();
  await client.query(buildIndexDDL(sortable));
  const buildMs = Date.now() - started;

  const {
    rows: [{ size, bytes }],
  } = await client.query(
    `SELECT pg_size_pretty(pg_relation_size($1)) AS size, pg_relation_size($1) AS bytes`,
    [INDEX_NAME]
  );

  await client.end();
  return { sortPaths: sortable.length, buildMs, size, bytes: Number(bytes) };
};

const isEntryPoint = process.argv[1] && import.meta.url.endsWith(process.argv[1].split('/').pop());

if (isEntryPoint) {
  const args = Object.fromEntries(
    process.argv.slice(2).map(a => {
      const [k, v] = a.replace(/^--/, '').split('=');
      return [k, v ?? true];
    })
  );
  createIndex(Number(args.sortable ?? 0))
    .then(r => {
      console.log(`index built: ${r.sortPaths} declared sort paths, ${r.buildMs}ms, ${r.size}`);
    })
    .catch(err => {
      console.error(err.message);
      process.exit(1);
    });
}

export { createIndex };
