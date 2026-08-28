/**
 * Suite 5 -- concurrency.
 *
 * Everything measured in the other suites runs one query at a time, which says
 * nothing about the concern that matters most for putting search inside the
 * application database: the ParadeDB index shares Postgres' buffer cache and
 * CPU with ordinary application queries. This driver runs the real library
 * workloads at rising concurrency and reports throughput and tail latency.
 *
 * No HTTP layer on purpose. The question is how the database behaves; an
 * Express hop in front of it would add its own queueing and event-loop effects
 * and make the result harder, not easier, to read.
 *
 * Two things this deliberately avoids:
 *   - Hammering one identical query. Every workload randomises its parameters,
 *     otherwise this measures a warm plan cache and the OS page cache rather
 *     than the system.
 *   - Running as an admin. Every connection is a collaborator, so the row-level
 *     permission rules are actually enforced.
 *
 * Usage:
 *   node benchmarks/paradedb/concurrency.mjs [--levels=1,2,4,8,16,32] [--seconds=5]
 *   node benchmarks/paradedb/concurrency.mjs --workload=combined
 */
import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import pg from 'pg';
import { APP, TENANT } from './lib/db.mjs';
import { partitions } from './lib/fulltextSchema.mjs';

const { Pool } = pg;

const args = Object.fromEntries(
  process.argv.slice(2).map(a => {
    const [k, v] = a.replace(/^--/, '').split('=');
    return [k, v ?? true];
  })
);

const LEVELS = String(args.levels ?? '1,2,4,8,16,32')
  .split(',')
  .map(Number);
const SECONDS = Number(args.seconds ?? 5);
const PARTS = partitions();

const TERMS = ['tribunal', 'massacre', 'testimony', 'ruling', 'archive', 'guatemala', 'honduras'];
const pick = arr => arr[Math.floor(Math.random() * arr.length)];

/**
 * Workloads. Each returns a fresh SQL string per call, with randomised
 * parameters, so repeated execution is not just a cache hit.
 */
const WORKLOADS = {
  'filter by property': () =>
    `SELECT count(*)::int FROM entities
     WHERE _id @@@ 'metadata.probe_select.value:country_${Math.floor(Math.random() * 50)}'`,

  'sidebar facets (20)': () =>
    `SELECT ${Array.from(
      { length: 20 },
      (_, i) => `pdb.agg('{"terms":{"field":"metadata.filler_${i}.value","size":2000}}') AS f${i}`
    ).join(', ')} FROM entities WHERE _id @@@ pdb.all()`,

  'metadata text search': () => {
    const t = pick(TERMS);
    return `SELECT "sharedId" FROM entities
            WHERE _id @@@ 'title:${t} OR metadata.probe_text.value:${t}'
            ORDER BY pdb.score(_id) DESC LIMIT 30`;
  },

  'sort by declared property': () =>
    `SELECT _id FROM entities WHERE _id @@@ pdb.all()
     ORDER BY (metadata->'probe_number'->0->>'value')::numeric
     ${Math.random() < 0.5 ? 'ASC' : 'DESC'} LIMIT 30`,

  'fulltext + snippets': () => {
    const t = pick(TERMS);
    return `SELECT * FROM (${PARTS.map(
      ({ table }) =>
        `(SELECT shared_id, page, pdb.score(id) AS score, pdb.snippet(contents) AS snip
          FROM ${table} WHERE contents @@@ '${t}' ORDER BY pdb.score(id) DESC LIMIT 30)`
    ).join(' UNION ALL ')}) u ORDER BY score DESC LIMIT 30`;
  },

  'combined library query': () => {
    const t = pick(TERMS);
    return `
      WITH text_branch AS (
        SELECT shared_id, RANK() OVER (ORDER BY s DESC, shared_id) AS rank FROM (
          SELECT u.shared_id, max(u.score) AS s FROM (${PARTS.map(
            ({ table }) =>
              `(SELECT shared_id, pdb.score(id) AS score FROM ${table}
                WHERE contents @@@ '${t}' ORDER BY pdb.score(id) DESC LIMIT 500)`
          ).join(' UNION ALL ')}) u
          JOIN entities e ON e."sharedId" = u.shared_id GROUP BY u.shared_id
        ) x ORDER BY s DESC LIMIT 200
      ),
      meta_branch AS (
        SELECT "sharedId" AS shared_id, RANK() OVER (ORDER BY s DESC, "sharedId") AS rank FROM (
          SELECT "sharedId", max(pdb.score(_id)) AS s FROM entities
          WHERE _id @@@ 'title:${t} OR metadata.probe_text.value:${t}' GROUP BY "sharedId"
        ) y ORDER BY s DESC LIMIT 200
      )
      SELECT COALESCE(m.shared_id, t2.shared_id) AS shared_id
      FROM meta_branch m FULL OUTER JOIN text_branch t2 ON t2.shared_id = m.shared_id
      ORDER BY (COALESCE(1.0/(60 + m.rank), 0) + COALESCE(1.0/(60 + t2.rank), 0)) DESC LIMIT 30`;
  },
};

const percentile = (sorted, p) =>
  sorted[Math.min(sorted.length - 1, Math.floor(sorted.length * p))];

const runLevel = async (build, concurrency) => {
  // Session settings go in the startup packet rather than a `connect` handler:
  // the handler is not awaited, so the pool can hand the connection to a waiting
  // query before the SETs have run -- which would silently execute the first
  // query of every connection without the permission context.
  const pool = new Pool({
    ...APP,
    max: concurrency,
    options: `-c app.current_tenant=${TENANT} -c uwazi.bypass_rls=false -c uwazi.ref_ids=collab1`,
  });

  const latencies = [];
  let errors = 0;
  const deadline = Date.now() + SECONDS * 1000;

  const worker = async () => {
    while (Date.now() < deadline) {
      const started = process.hrtime.bigint();
      try {
        // eslint-disable-next-line no-await-in-loop
        await pool.query(build());
        latencies.push(Number(process.hrtime.bigint() - started) / 1e6);
      } catch {
        errors += 1;
      }
    }
  };

  await Promise.all(Array.from({ length: concurrency }, worker));
  await pool.end();

  latencies.sort((a, b) => a - b);
  return {
    concurrency,
    completed: latencies.length,
    errors,
    qps: latencies.length / SECONDS,
    p50: percentile(latencies, 0.5),
    p95: percentile(latencies, 0.95),
    p99: percentile(latencies, 0.99),
  };
};

const main = async () => {
  const names = args.workload ? [String(args.workload)] : Object.keys(WORKLOADS);
  const report = {};

  for (const name of names) {
    const build = WORKLOADS[name];
    if (!build) {
      console.error(`unknown workload: ${name}`);
      process.exit(1);
    }
    console.log(`\n── ${name} ${'─'.repeat(Math.max(0, 46 - name.length))}`);
    console.log('  conc     qps      p50 ms     p95 ms     p99 ms   errors   scaling');

    const results = [];
    let base = null;
    for (const level of LEVELS) {
      // eslint-disable-next-line no-await-in-loop
      const r = await runLevel(build, level);
      base = base ?? r.qps;
      // Ideal scaling would be qps growing linearly with concurrency.
      r.scaling = r.qps / (base * level);
      results.push(r);
      console.log(
        `  ${String(r.concurrency).padStart(4)}  ${r.qps.toFixed(1).padStart(6)}  ` +
          `${r.p50.toFixed(1).padStart(9)}  ${r.p95.toFixed(1).padStart(9)}  ` +
          `${r.p99.toFixed(1).padStart(9)}  ${String(r.errors).padStart(6)}   ` +
          `${(r.scaling * 100).toFixed(0)}%`
      );
    }
    report[name] = results;
  }

  const out = String(args.out ?? 'benchmarks/paradedb/results/concurrency.json');
  mkdirSync(dirname(out), { recursive: true });
  writeFileSync(out, JSON.stringify(report, null, 2));
  console.log(`\nraw results: ${out}`);
};

main().catch(err => {
  console.error(err);
  process.exit(1);
});
