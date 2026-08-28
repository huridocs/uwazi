/**
 * Runs the metadata + full-text join probes, as a collaborator.
 *
 * Usage: node benchmarks/paradedb/run-join.mjs [--term=tribunal]
 */
import { connect, setActor } from './lib/db.mjs';
import { probes } from './probes/join.mjs';

const args = Object.fromEntries(
  process.argv.slice(2).map(a => {
    const [k, v] = a.replace(/^--/, '').split('=');
    return [k, v ?? true];
  })
);

const main = async () => {
  const client = await connect();
  // These probes are meaningless as an admin: the permission probe depends on
  // RLS actually filtering something.
  await setActor(client, 'collaborator');

  const list = probes({ term: String(args.term ?? 'tribunal') });
  console.log(`\nJoin probe suite (${list.length} probes, actor: collaborator)\n`);

  let failed = 0;
  for (const probe of list) {
    const failures = [];
    try {
      const res = await client.query(probe.sql);
      const err = probe.check?.(res.rows);
      if (err) failures.push(err);
      if (probe.planCheck) {
        const target = probe.planCheckSql ?? probe.sql;
        const plan = (await client.query(`EXPLAIN (ANALYZE, COSTS OFF) ${target}`)).rows
          .map(r => r['QUERY PLAN'])
          .join('\n');
        // Some plan checks depend on how big the table is, because the planner
        // legitimately changes strategy with size.
        const rowCount = probe.planCheckNeedsRowCount ? res.rows[0]?.n : undefined;
        const planErr = probe.planCheck(plan, rowCount);
        if (planErr) failures.push(planErr);
      }
    } catch (err) {
      failures.push(`threw: ${err.message.split('\n')[0]}`);
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
