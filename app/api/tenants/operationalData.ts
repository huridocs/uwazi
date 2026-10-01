import { z } from 'zod';

/**
 * Data other tools keep next to the registry row. Uwazi owns the registry, so it stores these and
 * declares their shape — it never reads them, and `TenantsModel.get()` keeps them out of the
 * running process.
 */
const FilesBucketSchema = z.object({ count: z.number(), size: z.number() }).strict();

const TenantStatsSchema = z
  .object({
    lastUpdated: z.number(),
    dbStorage: z.number(),
    elasticStorage: z.number(),
    filesStorage: z.number(),
    entitiesCount: z.number(),
    filesCount: z.number(),
    totalStorage: z.number(),
    filesByBucket: z.record(FilesBucketSchema).optional(),
    userCount: z
      .object({
        admin: z.number(),
        editor: z.number(),
        collaborator: z.number(),
        total: z.number(),
      })
      .strict(),
    lastSession: z.number(),
  })
  .strict();

const TenantHealthCheckSchema = z
  .object({
    name: z.string(),
    lastUpdated: z.number(),
    warnings: z.array(z.string()),
    problems: z.array(z.string()),
    summary: z.unknown(),
  })
  .strict();

const metadataFields = {
  orgName: z.string(),
  adminEmail: z.string(),
  notes: z.string(),
  status: z.enum(['active', 'maintenance', 'unknown']),
  createdAt: z.number(),
  updatedAt: z.number(),
  domain: z.string(),
  utcOffset: z.number(),
  type: z.string(),
};

const TenantMetadataSchema = z.object(metadataFields).partial().strict();

/** A change to the stored metadata: a value sets a key, `null` removes it, omitted leaves it. */
const TenantMetadataPatchSchema = z
  .object(
    Object.fromEntries(
      Object.entries(metadataFields).map(([key, schema]) => [key, schema.nullish()])
    ) as {
      [K in keyof typeof metadataFields]: z.ZodOptional<z.ZodNullable<(typeof metadataFields)[K]>>;
    }
  )
  .strict();

type TenantStats = z.infer<typeof TenantStatsSchema>;
type TenantHealthCheck = z.infer<typeof TenantHealthCheckSchema>;
type TenantMetadata = z.infer<typeof TenantMetadataSchema>;
type TenantMetadataPatch = z.infer<typeof TenantMetadataPatchSchema>;

/** Everything stored on a tenant row that the running process has no use for. */
type TenantOperationalData = {
  stats?: TenantStats;
  healthChecks?: TenantHealthCheck[];
  metadata?: TenantMetadata;
};

export {
  TenantHealthCheckSchema,
  TenantMetadataPatchSchema,
  TenantMetadataSchema,
  TenantStatsSchema,
};
export type {
  TenantHealthCheck,
  TenantMetadata,
  TenantMetadataPatch,
  TenantOperationalData,
  TenantStats,
};
