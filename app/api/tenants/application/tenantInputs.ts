import { z } from 'zod';
import { FeatureFlagsPatchSchema, FeatureFlagsSchema } from '../featureFlags.js';
import {
  TenantHealthCheckSchema,
  TenantMetadataPatchSchema,
  TenantStatsSchema,
} from '../operationalData.js';

/** Looks up a tenant that already exists: names registered before the rules below still resolve. */
const name = z.string().min(1);

/**
 * A new tenant's name. It becomes the default database, index and folder names, and usually a
 * subdomain, so it keeps to what all of them accept.
 */
const newName = z
  .string()
  .regex(
    /^[a-z0-9][a-z0-9_-]{0,62}$/,
    'Use up to 63 lowercase letters, digits, "-" or "_", starting with a letter or digit'
  );

/** What MongoDB accepts as a database name. */
const dbName = z
  .string()
  .regex(/^[^/\\. "$*<>:|?\0]{1,63}$/, 'Use up to 63 characters, none of /\\. "$*<>:|?');

/** What Elasticsearch accepts as an index name. */
const indexName = z
  .string()
  .regex(
    /^(?![-_+])(?!\.{1,2}$)[^A-Z\\/*?"<>| ,#:]{1,255}$/,
    'Use lowercase, without \\/*?"<>| ,#: and not starting with -, _ or +'
  );

/** A storage folder: absolute or relative, but never climbing out through "..". */
const folder = z
  .string()
  .min(1)
  .refine(path => !path.split(/[\\/]/).includes('..'), 'Must not contain ".."');

const globalMatomo = z.object({ id: z.string(), url: z.string() }).strict();

/** Folder layout is a uwazi convention; callers may still pass their own. */
const derivedPaths = (tenant: string) => ({
  uploadedDocuments: `${tenant}/documents`,
  attachments: `${tenant}/documents`,
  customUploads: `${tenant}/custom_uploads`,
  activityLogs: `${tenant}/log`,
});

const paths = {
  uploadedDocuments: folder.optional(),
  attachments: folder.optional(),
  customUploads: folder.optional(),
  activityLogs: folder.optional(),
};

const RegisterTenantInputSchema = z
  .object({
    name: newName,
    dbName: dbName.optional(),
    indexName: indexName.optional(),
    domain: z.string().optional(),
    featureFlags: FeatureFlagsSchema.optional(),
    globalMatomo: globalMatomo.optional(),
    ciMatomoActive: z.boolean().optional(),
    ...paths,
  })
  .strict();

/**
 * `null` removes a field, an omitted field is left as it is. Only the optional fields can be
 * removed: a tenant cannot run without its database, index and storage paths, so those can be
 * replaced but never cleared. `metadata` merges key by key, with the same rules one level down.
 */
const UpdateTenantInputSchema = z
  .object({
    name,
    dbName: dbName.optional(),
    indexName: indexName.optional(),
    domain: z.string().nullish(),
    globalMatomo: globalMatomo.nullish(),
    ciMatomoActive: z.boolean().nullish(),
    ...paths,
    metadata: TenantMetadataPatchSchema.nullish(),
  })
  .strict();

const SetFeatureFlagsInputSchema = z
  .object({ name, featureFlags: FeatureFlagsPatchSchema })
  .strict();

const SetMaintenanceInputSchema = z.object({ name, maintenance: z.boolean() }).strict();

const UpdateStatsInputSchema = z.object({ name, stats: TenantStatsSchema }).strict();

const RecordHealthCheckInputSchema = z
  .object({ name, healthCheck: TenantHealthCheckSchema })
  .strict();

const TenantNameInputSchema = z.object({ name }).strict();

type RegisterTenantInput = z.infer<typeof RegisterTenantInputSchema>;
type UpdateTenantInput = z.infer<typeof UpdateTenantInputSchema>;
type TenantNameInput = z.infer<typeof TenantNameInputSchema>;
type SetFeatureFlagsInput = z.infer<typeof SetFeatureFlagsInputSchema>;
type SetMaintenanceInput = z.infer<typeof SetMaintenanceInputSchema>;
type UpdateStatsInput = z.infer<typeof UpdateStatsInputSchema>;
type RecordHealthCheckInput = z.infer<typeof RecordHealthCheckInputSchema>;

export {
  derivedPaths,
  RecordHealthCheckInputSchema,
  RegisterTenantInputSchema,
  SetFeatureFlagsInputSchema,
  SetMaintenanceInputSchema,
  TenantNameInputSchema,
  UpdateStatsInputSchema,
  UpdateTenantInputSchema,
};
export type {
  RecordHealthCheckInput,
  RegisterTenantInput,
  SetFeatureFlagsInput,
  SetMaintenanceInput,
  TenantNameInput,
  UpdateStatsInput,
  UpdateTenantInput,
};
