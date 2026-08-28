/**
 * Reduces an EXPLAIN ANALYZE plan to a comparable signature.
 *
 * The sweep's output is not a wall of latencies -- it is the corpus size at
 * which a probe's plan *changes shape*. A signature has to be stable across
 * reruns at the same size and differ when the executor picks a different
 * strategy, so it captures structure only: which custom scan ran, which exec
 * method, and whether Postgres had to add a Sort of its own.
 */

/** `Sort (actual...` or `-> Sort (actual...`, but never `Sort Key:` / `Sort Method:`. */
const SORT_NODE = /(?:^|->)\s*Sort\s+\(/m;
const CUSTOM_SCAN = /Custom Scan \((ParadeDB [^)]+)\)/;
const EXEC_METHOD = /Exec Method: (\w+)/;
const EXEC_TIME = /Execution Time: ([\d.]+) ms/;

/** rows= reported on the ParadeDB scan node itself, not on the Limit above it. */
const scanRowsFrom = plan => {
  const line = plan.split('\n').find(l => CUSTOM_SCAN.test(l));
  const match = line?.match(/rows=(\d+)/);
  return match ? Number(match[1]) : null;
};

const returnedRowsFrom = plan => {
  const match = plan.split('\n')[0].match(/rows=(\d+)/);
  return match ? Number(match[1]) : null;
};

const parsePlan = plan => {
  const customScan = plan.match(CUSTOM_SCAN)?.[1] ?? 'no ParadeDB scan';
  const execMethod = plan.match(EXEC_METHOD)?.[1] ?? null;
  const hasSort = SORT_NODE.test(plan);
  const scanRows = scanRowsFrom(plan);
  const returnedRows = returnedRowsFrom(plan);

  const parts = [customScan];
  if (execMethod) parts.push(execMethod);
  if (hasSort) parts.unshift('Sort+');

  return {
    signature: parts.join('/').replace('Sort+/', 'Sort+'),
    customScan,
    execMethod,
    hasSort,
    scanRows,
    returnedRows,
    // How many rows the scan had to produce per row actually returned. For a
    // LIMIT query this is the over-fetch factor -- the number that says whether
    // the RLS heap filter is forcing Top K to look past K. 1.0 is ideal.
    overfetch: scanRows && returnedRows ? Number((scanRows / returnedRows).toFixed(1)) : null,
    executionMs: Number(plan.match(EXEC_TIME)?.[1] ?? NaN),
  };
};

export { parsePlan };
