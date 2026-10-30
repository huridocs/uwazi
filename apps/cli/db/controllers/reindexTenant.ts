import { spawn } from 'child_process';
import path from 'path';
import { config } from '#api/config.js';

/**
 * The same reindex the ops script used to run over SSH (`yarn reindex`): the standalone runner
 * reindexes `tenants.current()`, selected through UWAZI_TENANT. Spawned as a child process
 * because reindex_elastic.js is a top-level script, not a library.
 */
function reindexTenant(tenantId: string): Promise<void> {
  const runner = path.join(config.rootPath, 'scripts', 'runner.js');
  const script = path.join(config.rootPath, 'database', 'reindex_elastic.js');

  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [runner, script], {
      env: { ...process.env, UWAZI_TENANT: tenantId },
      // stdout carries the import result only, so the child's progress goes to stderr.
      stdio: ['ignore', process.stderr, 'inherit'],
    });
    child.once('error', reject);
    child.once('close', code => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`Reindex exited with code ${code}`));
      }
    });
  });
}

export { reindexTenant };
