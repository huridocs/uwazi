import { z } from 'zod';

/** What `uwazi db clear …` prints. Tables are every tenant-scoped table touched, sorted. */
const ClearTenantOutputSchema = z.object({
  tables: z.array(z.string()),
  deletedRows: z.number().int().nonnegative(),
});

/** What `uwazi db import …` prints. `rows` is the total COPY row count loaded. */
const ImportTenantOutputSchema = z.object({
  sourceTenant: z.string(),
  tables: z.array(z.string()),
  rows: z.number().int().nonnegative(),
});

/** What `uwazi db upgrade …` prints: the backup's tenant, the versions it moved between, its tables. */
const UpgradeBackupOutputSchema = z.object({
  sourceTenant: z.string(),
  fromVersion: z.number().int().nonnegative(),
  toVersion: z.number().int().nonnegative(),
  tables: z.array(z.string()),
});

type ClearTenantOutput = z.infer<typeof ClearTenantOutputSchema>;
type ImportTenantOutput = z.infer<typeof ImportTenantOutputSchema>;
type UpgradeBackupOutput = z.infer<typeof UpgradeBackupOutputSchema>;

export { ClearTenantOutputSchema, ImportTenantOutputSchema, UpgradeBackupOutputSchema };
export type { ClearTenantOutput, ImportTenantOutput, UpgradeBackupOutput };
