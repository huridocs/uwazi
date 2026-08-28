/**
 * Full-text scale sweep.
 *
 * Reseeds and rebuilds at each point, then measures the query shapes the
 * library actually issues. The headline questions:
 *   - what does a 21-partition UNION cost as the corpus grows?
 *   - does collapsing pages to one row per entity stay affordable?
 *   - does the index keep its plan shape?
 *
 * Usage:
 *   node benchmarks/paradedb/sweep-fulltext.mjs --values=20000,100000,400000
 */
import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import { connectAdmin } from './lib/db.mjs';
import { seedFullText } from './seed/generateFullText.mjs';
import { indexDDL, dropIndexDDL, partitions } from './lib/fulltextSchema.mjs';
import { fan, fanWithSnippet, rankedFanWithSnippet } from './probes/fulltext.mjs';
import { parsePlan } from './lib/planSignature.mjs';

const args = Object.fromEntries(
  process.argv.slice(2).map(a => {
    const [k, v] = a.replace(/^--/, '').split('=');
    return [k, v ?? true];
  })
);
const VALUES = String(args.values ?? '20000,100000,400000')
  .split(',')
  .map(Number);
const REPEATS = Number(args.repeats ?? 5);

const QUERIES = {
  'single partition': `SELECT count(*)::int AS n FROM ft_english WHERE contents @@@ 'massacre'`,
  'agnostic fan (21 parts)': `SELECT count(*)::int AS n FROM (${fan('massacre')}) u`,
  'snippets, LIMIT per branch': rankedFanWithSnippet('massacre', 30),
  'snippets, outer LIMIT only': `SELECT * FROM (${fanWithSnippet('massacre')}) u ORDER BY score DESC LIMIT 30`,
  'collapse to entities': `SELECT shared_id, max(score) AS best FROM (${fan('massacre')}) u
                           GROUP BY shared_id ORDER BY best DESC LIMIT 30`,
  'in-document search': `SELECT page, pdb.snippet(contents) FROM ft_english
                         WHERE contents @@@ 'massacre' AND file_id = 'file_4' ORDER BY page LIMIT 50`,
  'phrase search': `SELECT count(*)::int AS n FROM ft_english
                    WHERE contents @@@ pdb.phrase(ARRAY['massacre','witness'])`,
};

const median = xs => [...xs].sort((a, b) => a - b)[Math.floor(xs.length / 2)];

const measure = async (client, sql) => {
  const timings = [];
  let plan = null;
  try {
    for (let i = 0; i < REPEATS; i += 1) {
      // eslint-disable-next-line no-await-in-loop
      const res = await client.query(`EXPLAIN (ANALYZE, COSTS OFF) ${sql}`);
      plan = res.rows.map(r => r['QUERY PLAN']).join('\n');
      timings.push(parsePlan(plan).executionMs);
    }
  } catch (err) {
    return { ms: NaN, signature: 'ERROR', error: err.message.split('\n')[0] };
  }
  return { ms: median(timings), signature: parsePlan(plan).signature };
};

const main = async () => {
  const points = [];
  for (const pages of VALUES) {
    await seedFullText({ pages });
    const admin = await connectAdmin();
    await admin.query(dropIndexDDL());
    const t = Date.now();
    await admin.query(indexDDL());
    const buildMs = Date.now() - t;
    const {
      rows: [{ size }],
    } = await admin.query(
      `SELECT pg_size_pretty(sum(pg_relation_size(indexrelid))) AS size
       FROM pg_index WHERE indexrelid::regclass::text LIKE 'ft_%_idx'`
    );

    const results = {};
    for (const [name, sql] of Object.entries(QUERIES)) {
      // eslint-disable-next-line no-await-in-loop
      results[name] = await measure(admin, sql);
    }
    await admin.end();
    points.push({ pages, buildMs, size, results });
    console.log(`  ${pages} pages indexed in ${buildMs}ms (${size})`);
  }

  console.log(`\n── median ms by pages (${partitions().length} partitions) ${'─'.repeat(12)}`);
  const header = ['query'.padEnd(26), ...points.map(p => String(p.pages).padStart(12))].join('');
  console.log(header);
  for (const name of Object.keys(QUERIES)) {
    console.log(
      name.padEnd(26) +
        points
          .map(p => {
            const r = p.results[name];
            return (Number.isFinite(r.ms) ? r.ms.toFixed(1) : 'ERR').padStart(12);
          })
          .join('')
    );
  }

  console.log(`\n── index build ${'─'.repeat(40)}`);
  console.log('pages'.padEnd(26) + points.map(p => String(p.pages).padStart(12)).join(''));
  console.log('build ms'.padEnd(26) + points.map(p => String(p.buildMs).padStart(12)).join(''));
  console.log('total index size'.padEnd(26) + points.map(p => p.size.padStart(12)).join(''));

  const out = String(args.out ?? 'benchmarks/paradedb/results/sweep-fulltext.json');
  mkdirSync(dirname(out), { recursive: true });
  writeFileSync(out, JSON.stringify(points, null, 2));
  console.log(`\nraw results: ${out}`);
};

main().catch(err => {
  console.error(err);
  process.exit(1);
});
