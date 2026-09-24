import type { TenantResults } from '../contracts/TenantResults.js';
import { ErrorMapper } from '../errors/ErrorMapper.js';
import { ExitCode } from '../errors/ExitCode.js';

/**
 * How an --all-tenants result ends the command. Kept apart from AllTenants, which loads the
 * tenancy backend, so reading a result never does.
 */
class TenantResultsOutcome {
  static is(output: unknown): output is TenantResults<unknown> {
    return (
      typeof output === 'object' && output !== null && 'results' in output && 'errors' in output
    );
  }

  /** Any failed tenant makes the command fail, with the exit code of the first failure. */
  static exitCode({ errors }: TenantResults<unknown>): ExitCode {
    const [first] = errors;
    return first ? ErrorMapper.exitCodeFor(first.error.category) : ExitCode.Ok;
  }
}

export { TenantResultsOutcome };
