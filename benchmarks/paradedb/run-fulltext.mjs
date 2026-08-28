/**
 * Runs the full-text probe matrix.
 *
 * Usage:
 *   node benchmarks/paradedb/run-fulltext.mjs [--pagesPerFile=20] [--filesPerEntity=2]
 */
import { connectAdmin } from './lib/db.mjs';
import { probes } from './probes/fulltext.mjs';

const args = Object.fromEntries(
  process.argv.slice(2).map(a => {
    const [k, v] = a.replace(/^--/, '').split('=');
    return [k, v ?? true];
  })
);

const DIMS = {
  pagesPerFile: Number(args.pagesPerFile ?? 20),
  filesPerEntity: Number(args.filesPerEntity ?? 2),
};

const run = async (client, probe) => {
  const failures = [];
  const res = await client.query(probe.sql);

  if (probe.rows && JSON.stringify(res.rows) !== JSON.stringify(probe.rows)) {
    failures.push(`rows ${JSON.stringify(res.rows)} != ${JSON.stringify(probe.rows)}`);
  }
  if (probe.check) {
    const err = probe.check(res.rows);
    if (err) failures.push(err);
  }
  if (probe.planHas) {
    const plan = (await client.query(`EXPLAIN (ANALYZE, COSTS OFF) ${probe.sql}`)).rows
      .map(r => r['QUERY PLAN'])
      .join('\n');
    for (const needle of probe.planHas) {
      if (!plan.includes(needle)) failures.push(`plan missing "${needle}"`);
    }
  }
  return failures;
};

const main = async () => {
  const client = await connectAdmin();
  const list = probes(DIMS);
  console.log(`\nFull-text probe suite (${list.length} probes)\n`);

  let failed = 0;
  for (const probe of list) {
    let failures;
    try {
      failures = await run(client, probe);
    } catch (err) {
      failures = [`threw: ${err.message.split('\n')[0]}`];
    }
    if (failures.length) failed += 1;
    console.log(`  ${failures.length ? 'FAIL' : 'PASS'}  ${probe.id.padEnd(28)} ${probe.branch}`);
    failures.forEach(f => console.log(`         ↳ ${f}`));
  }

  await client.end();
  console.log(failed === 0 ? '\nall probes passed' : `\n${failed} probe failure(s)`);
  process.exit(failed === 0 ? 0 : 1);
};

main().catch(err => {
  console.error(err);
  process.exit(1);
});
