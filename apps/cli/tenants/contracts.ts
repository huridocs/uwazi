import { z } from 'zod';

/**
 * What `uwazi tenants …` prints: the whole stored row, the operational data other tools keep next
 * to the registry included. Not a valid `update` request: the fields with their own command
 * (`featureFlags`, `maintenance`, `stats`, `healthChecks`) are rejected there. Owned by the CLI,
 * not shared with the HTTP API.
 */
const TenantOutputSchema = z.record(z.unknown());

const TenantsOutputSchema = z.array(TenantOutputSchema);

/** What `uwazi tenants clean …` prints. Tables are every tenant-scoped table touched, sorted. */
const CleanTenantOutputSchema = z.object({
  tables: z.array(z.string()),
  deletedRows: z.number().int().nonnegative(),
});

/** What `uwazi tenants import …` prints. `rows` is the total COPY row count loaded. */
const ImportTenantOutputSchema = z.object({
  sourceTenant: z.string(),
  tables: z.array(z.string()),
  rows: z.number().int().nonnegative(),
});

type TenantOutput = z.infer<typeof TenantOutputSchema>;
type TenantsOutput = z.infer<typeof TenantsOutputSchema>;
type CleanTenantOutput = z.infer<typeof CleanTenantOutputSchema>;
type ImportTenantOutput = z.infer<typeof ImportTenantOutputSchema>;

export {
  CleanTenantOutputSchema,
  ImportTenantOutputSchema,
  TenantOutputSchema,
  TenantsOutputSchema,
};
export type { CleanTenantOutput, ImportTenantOutput, TenantOutput, TenantsOutput };
