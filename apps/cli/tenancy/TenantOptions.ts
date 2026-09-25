import type { Argv } from 'yargs';
import { z } from 'zod';

/** How a command relates to tenants: not at all, exactly one, or one or every tenant. */
type Tenancy = 'none' | 'single' | 'single-or-all';

type TenantSelection = { tenant?: string; allTenants: boolean };

const SINGLE = z.object({ tenant: z.string().min(1) });

const SINGLE_OR_ALL = z
  .object({ tenant: z.string().min(1).optional(), allTenants: z.boolean().default(false) })
  .superRefine((input, ctx) => {
    if (Boolean(input.tenant) === input.allTenants) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['tenant'],
        message: 'Provide exactly one of --tenant or --all-tenants',
      });
    }
  });

/** The tenant flags, added to every command according to its tenancy. */
class TenantOptions {
  static readonly fieldMap = { tenant: '--tenant', allTenants: '--all-tenants' };

  static options(tenancy: Tenancy, yargs: Argv): Argv {
    if (tenancy === 'none') {
      return yargs;
    }

    const withTenant = yargs.option('tenant', { type: 'string', describe: 'Tenant name' });

    return tenancy === 'single'
      ? withTenant
      : withTenant.option('all-tenants', {
          type: 'boolean',
          default: false,
          describe: 'Run for every tenant',
        });
  }

  static parse(tenancy: Tenancy, argv: Record<string, unknown>): TenantSelection | undefined {
    switch (tenancy) {
      case 'single':
        return { ...SINGLE.parse(argv), allTenants: false };
      case 'single-or-all':
        return SINGLE_OR_ALL.parse(argv);
      default:
        return undefined;
    }
  }
}

export { TenantOptions };
export type { Tenancy, TenantSelection };
