/**
 * Suite 2 -- the scale sweep.
 *
 * Loops the Suite 1 probes over a swept axis and records, per probe per size,
 * the plan signature and the median execution time. The headline output is not
 * a latency table: it is the **flip report** -- the size at which a probe's
 * plan changes shape (Top K degrading to a full sort, an aggregate scan falling
 * back to ordinary Postgres execution). Latency then only needs measuring
 * around those knees.
 *
 * Correctness is re-asserted at every size, so a probe that starts returning
 * wrong answers at scale is caught rather than quietly timed.
 *
 * Usage:
 *   node benchmarks/paradedb/sweep.mjs --axis=E --values=2000,10000,50000
 *   node benchmarks/paradedb/sweep.mjs --axis=P --values=10,50,200,800
 *   node benchmarks/paradedb/sweep.mjs --axis=C --values=20,200,2000,5000
 *
 * Options:
 *   --actor=collaborator|admin   default collaborator -- the actor that matters
 *   --repeats=5                  runs per probe; the median is reported
 *   --out=results/sweep-E.json   raw results, for later comparison
 */
import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import { connect, setActor } from './lib/db.mjs';
import { probes } from './probes/index.mjs';
import { parsePlan } from './lib/planSignature.mjs';
import { seedCorpus } from './seed/generate.mjs';
import { createIndex } from './seed/createIndex.mjs';

const args = Object.fromEntries(
  process.argv.slice(2).map(a => {
    const [k, v] = a.replace(/^--/, '').split('=');
    return [k, v ?? true];
  })
);

const AXIS = String(args.axis ?? 'E');
const VALUES = String(args.values ?? '2000,10000,50000')
  .split(',')
  .map(Number);
const ACTOR = String(args.actor ?? 'collaborator');
const REPEATS = Number(args.repeats ?? 5);
const BASE = { E: 20000, P: 20, C: 50 };

const median = xs => [...xs].sort((a, b) => a - b)[Math.floor(xs.length / 2)];

const measure = async (client, probe) => {
  const timings = [];
  let plan = null;

  // A probe can stop working entirely at a larger size -- ParadeDB enforces a
  // hard ceiling on aggregation buckets, for instance. That is a finding, not a
  // reason to abandon the sweep, so record it and carry on.
  try {
    for (let i = 0; i < REPEATS; i += 1) {
      // eslint-disable-next-line no-await-in-loop
      const res = await client.query(`EXPLAIN (ANALYZE, COSTS OFF) ${probe.sql}`);
      plan = res.rows.map(r => r['QUERY PLAN']).join('\n');
      timings.push(parsePlan(plan).executionMs);
    }
  } catch (err) {
    return {
      signature: 'ERROR',
      medianMs: NaN,
      overfetch: null,
      correct: false,
      error: err.message.split('\n')[0],
    };
  }

  const parsed = parsePlan(plan);

  // Over-fetch only means anything for a LIMIT query, where it says how many
  // rows the scan produced per row the user actually gets. On a count(*) probe
  // the denominator is always 1, which would make every aggregate look like a
  // catastrophic over-fetch.
  const hasLimit = /\bLIMIT\b/i.test(probe.sql);
  if (!hasLimit) parsed.overfetch = null;

  // Re-assert correctness at this size. A probe that silently starts returning
  // the wrong answer at scale is worse than one that gets slow.
  let correct = true;
  let error = null;
  try {
    const res = await client.query(probe.sql);
    if (probe.rows) {
      correct = JSON.stringify(res.rows) === JSON.stringify(probe.rows);
      if (!correct) error = `rows ${JSON.stringify(res.rows)} != ${JSON.stringify(probe.rows)}`;
    }
    if (probe.check) {
      const err = probe.check(res.rows);
      if (err) {
        correct = false;
        error = err;
      }
    }
  } catch (err) {
    correct = false;
    error = err.message.split('\n')[0];
  }

  return { ...parsed, medianMs: median(timings), correct, error };
};

const runPoint = async dims => {
  await seedCorpus(dims);
  const index = await createIndex();

  const client = await connect();
  await setActor(client, ACTOR);

  const results = {};
  for (const probe of probes(dims)) {
    // eslint-disable-next-line no-await-in-loop
    results[probe.id] = await measure(client, probe);
  }

  await client.end();
  return { dims, index, results };
};

/** For each probe, the first swept value at which its signature changed. */
const flipReport = points => {
  const flips = [];
  const ids = Object.keys(points[0].results);

  for (const id of ids) {
    for (let i = 1; i < points.length; i += 1) {
      const before = points[i - 1].results[id];
      const after = points[i].results[id];
      if (before.signature !== after.signature) {
        flips.push({
          id,
          at: points[i].dims[AXIS],
          from: before.signature,
          to: after.signature,
        });
        break;
      }
    }
  }
  return flips;
};

const correctnessReport = points => {
  const broken = [];
  for (const point of points) {
    for (const [id, r] of Object.entries(point.results)) {
      if (!r.correct) broken.push({ id, at: point.dims[AXIS], error: r.error });
    }
  }
  return broken;
};

const printTable = points => {
  const ids = Object.keys(points[0].results);
  const header = ['probe'.padEnd(30), ...points.map(p => String(p.dims[AXIS]).padStart(14))].join(
    ''
  );
  console.log(`\n── median ms by ${AXIS} (actor: ${ACTOR}) ${'─'.repeat(20)}`);
  console.log(header);
  for (const id of ids) {
    const cells = points.map(p => {
      const r = p.results[id];
      const flag = r.correct ? '' : '!';
      const ms = Number.isFinite(r.medianMs) ? r.medianMs.toFixed(1) : 'ERR';
      return `${flag}${ms}`.padStart(14);
    });
    console.log(id.padEnd(30) + cells.join(''));
  }

  console.log(`\n── over-fetch factor, LIMIT queries only ${'─'.repeat(16)}`);
  console.log('   rows the scan produced per row returned; 1.0 = the index stopped at K');
  console.log(header);
  for (const id of ids) {
    const cells = points.map(p => {
      const { overfetch } = p.results[id];
      return String(overfetch ?? '-').padStart(14);
    });
    console.log(id.padEnd(30) + cells.join(''));
  }
};

const main = async () => {
  console.log(`sweeping ${AXIS} over ${VALUES.join(', ')} (base ${JSON.stringify(BASE)})`);

  const points = [];
  for (const value of VALUES) {
    // eslint-disable-next-line no-await-in-loop
    points.push(await runPoint({ ...BASE, [AXIS]: value }));
  }

  printTable(points);

  const flips = flipReport(points);
  console.log(`\n── plan flips ${'─'.repeat(46)}`);
  if (flips.length === 0) {
    console.log('  none — every probe kept its plan shape across the sweep');
  } else {
    for (const f of flips) {
      console.log(`  ${f.id} @ ${AXIS}=${f.at}`);
      console.log(`      ${f.from}`);
      console.log(`   -> ${f.to}`);
    }
  }

  const broken = correctnessReport(points);
  console.log(`\n── correctness ${'─'.repeat(45)}`);
  if (broken.length === 0) {
    console.log('  all probes returned correct results at every size');
  } else {
    for (const b of broken) console.log(`  ${b.id} @ ${AXIS}=${b.at}: ${b.error}`);
  }

  const out = String(args.out ?? `benchmarks/paradedb/results/sweep-${AXIS}.json`);
  mkdirSync(dirname(out), { recursive: true });
  writeFileSync(out, JSON.stringify({ axis: AXIS, actor: ACTOR, points, flips }, null, 2));
  console.log(`\nraw results: ${out}`);

  process.exit(broken.length === 0 ? 0 : 1);
};

main().catch(err => {
  console.error(err);
  process.exit(1);
});
