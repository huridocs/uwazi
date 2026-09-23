import type { TenantResults } from '../contracts/TenantResults.js';
import { ErrorMapper } from '../errors/ErrorMapper.js';
import { ExitCode } from '../errors/ExitCode.js';
import { CliTenancy } from './CliTenancy.js';

/** Runs a query in every tenant, one after the other, without letting one failure stop it. */
class AllTenants {
  static async collect<T>(fn: () => Promise<T>): Promise<TenantResults<T>> {
    const tenants = await CliTenancy.all();

    // Chained, not Promise.all: one tenant at a time, so a sweep over every tenant never
    // holds all their connections at once.
    return tenants.reduce<Promise<TenantResults<T>>>(
      async (previous, tenant) => {
        const collected = await previous;
        try {
          collected.results.push({ tenant: tenant.name, data: await CliTenancy.run(tenant, fn) });
        } catch (error) {
          collected.errors.push({
            tenant: tenant.name,
            error: ErrorMapper.toPayload(error, {}).error,
          });
        }
        return collected;
      },
      Promise.resolve({ results: [], errors: [] })
    );
  }

  /** Any failed tenant makes the command fail, with the exit code of the first failure. */
  static exitCode({ errors }: TenantResults<unknown>): ExitCode {
    const [first] = errors;
    return first ? ErrorMapper.exitCodeFor(first.error.category) : ExitCode.Ok;
  }

  static isTenantResults(output: unknown): output is TenantResults<unknown> {
    return (
      typeof output === 'object' && output !== null && 'results' in output && 'errors' in output
    );
  }
}

export { AllTenants };
