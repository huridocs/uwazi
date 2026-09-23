import { CliApplication } from './CliApplication.js';
import { RouteRegistry } from './routing/RouteRegistry.js';

/**
 * The exit code is set, not forced with process.exit(): the process ends on its own once every
 * connection is closed, which is how a leaked connection shows up (the command hangs).
 */
new CliApplication({ routes: RouteRegistry.all() }).run(process.argv.slice(2)).then(
  exitCode => {
    process.exitCode = exitCode;
  },
  () => {
    process.exitCode = 1;
  }
);
