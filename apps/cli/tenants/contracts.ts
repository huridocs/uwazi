import { z } from 'zod';

/**
 * What `uwazi tenants …` prints: the whole stored row, the operational data other tools keep next
 * to the registry included. Not a valid `update` request: the fields with their own command
 * (`featureFlags`, `maintenance`, `stats`, `healthChecks`) are rejected there. Owned by the CLI,
 * not shared with the HTTP API.
 */
const TenantOutputSchema = z.record(z.unknown());

const TenantsOutputSchema = z.array(TenantOutputSchema);

type TenantOutput = z.infer<typeof TenantOutputSchema>;
type TenantsOutput = z.infer<typeof TenantsOutputSchema>;

export { TenantOutputSchema, TenantsOutputSchema };
export type { TenantOutput, TenantsOutput };
