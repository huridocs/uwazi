/**
 * Runs the probe matrix against both actors and reports pass/fail per probe.
 *
 * Usage:
 *   node benchmarks/paradedb/run-probes.mjs [--actor=collaborator] [--E=2000] [--C=50]
 *
 * Exit code is non-zero if any probe fails, so this can gate a decision or run
 * in CI against a pinned ParadeDB version.
 */
import { connect, setActor } from './lib/db.mjs';
import { probes } from './probes/index.mjs';
import { checkCoverage } from './coverage.mjs';

const args = Object.fromEntries(
  process.argv.slice(2).map(a => {
    const [k, v] = a.replace(/^--/, '').split('=');
    return [k, v ?? true];
  })
);

const DIMS = { E: Number(args.E ?? 2000), P: Number(args.P ?? 20), C: Number(args.C ?? 50) };
const ACTORS = args.actor ? [args.actor] : ['admin', 'collaborator'];

const explain = async (client, sql) => {
  const res = await client.query(`EXPLAIN (ANALYZE, COSTS OFF) ${sql}`);
  return res.rows.map(r => r['QUERY PLAN']).join('\n');
};

const compareRows = (actual, expected) => {
  const a = JSON.stringify(actual.map(r => Object.fromEntries(Object.entries(r))));
  const e = JSON.stringify(expected);
  return a === e ? null : `rows ${a} != expected ${e}`;
};

const runProbe = async (client, probe) => {
  const failures = [];

  const res = await client.query(probe.sql);

  if (probe.rows) {
    const err = compareRows(res.rows, probe.rows);
    if (err) failures.push(err);
  }
  if (probe.check) {
    const err = probe.check(res.rows);
    if (err) failures.push(err);
  }

  let plan = null;
  if (probe.planHas || probe.planLacks) {
    plan = await explain(client, probe.sql);
    for (const needle of probe.planHas ?? []) {
      if (!plan.includes(needle)) failures.push(`plan missing "${needle}"`);
    }
    for (const needle of probe.planLacks ?? []) {
      if (plan.includes(needle)) failures.push(`plan unexpectedly contains "${needle}"`);
    }
  }

  return { failures, plan };
};

/**
 * Probe expectations are functions of E/P/C, so running them against a corpus
 * seeded at different dimensions produces a screenful of meaningless failures.
 * (Easy to hit: sweep.mjs leaves the corpus at whatever size it finished on.)
 * Fail loudly and specifically instead.
 */
const assertCorpusMatches = async () => {
  const client = await connect();
  await setActor(client, 'admin');
  const {
    rows: [{ n }],
  } = await client.query('SELECT count(*)::int AS n FROM entities');
  await client.end();

  if (n !== DIMS.E) {
    console.error(
      `corpus mismatch: table holds ${n} rows but probes expect E=${DIMS.E}.\n` +
        `Either reseed:  node benchmarks/paradedb/seed/generate.mjs --entities=${DIMS.E}\n` +
        `or match it:    node benchmarks/paradedb/run-probes.mjs --E=${n}`
    );
    process.exit(2);
  }
};

const main = async () => {
  await assertCorpusMatches();
  const list = probes(DIMS);
  const coverage = checkCoverage(list);

  console.log(`\nParadeDB probe suite  E=${DIMS.E} P=${DIMS.P} C=${DIMS.C}\n`);

  let failed = 0;
  for (const actor of ACTORS) {
    const client = await connect();
    await setActor(client, actor);
    console.log(`── actor: ${actor} ${'─'.repeat(52 - actor.length)}`);

    for (const probe of list) {
      let result;
      try {
        result = await runProbe(client, probe);
      } catch (err) {
        result = { failures: [`threw: ${err.message.split('\n')[0]}`] };
      }
      const ok = result.failures.length === 0;
      if (!ok) failed += 1;
      console.log(`  ${ok ? 'PASS' : 'FAIL'}  ${probe.id.padEnd(30)} ${probe.branch}`);
      for (const f of result.failures) console.log(`         ↳ ${f}`);
    }
    console.log('');
    await client.end();
  }

  console.log('── coverage ' + '─'.repeat(48));
  for (const line of coverage.report) console.log(`  ${line}`);
  console.log('');

  const bad = failed + coverage.missing.length;
  console.log(
    bad === 0
      ? 'all probes passed'
      : `${failed} probe failure(s), ${coverage.missing.length} uncovered branch(es)`
  );
  process.exit(bad === 0 ? 0 : 1);
};

main().catch(err => {
  console.error(err);
  process.exit(1);
});
