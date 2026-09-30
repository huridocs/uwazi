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

const TenantMetadataSchema = z
  .object({
    orgName: z.string().optional(),
    adminEmail: z.string().optional(),
    notes: z.string().optional(),
    status: z.enum(['active', 'maintenance', 'unknown']).optional(),
    createdAt: z.number().optional(),
    updatedAt: z.number().optional(),
    domain: z.string().optional(),
    utcOffset: z.number().optional(),
    type: z.string().optional(),
  })
  .strict();

type TenantStats = z.infer<typeof TenantStatsSchema>;
type TenantHealthCheck = z.infer<typeof TenantHealthCheckSchema>;
type TenantMetadata = z.infer<typeof TenantMetadataSchema>;

/** Everything stored on a tenant row that the running process has no use for. */
type TenantOperationalData = {
  stats?: TenantStats;
  healthChecks?: TenantHealthCheck[];
  metadata?: TenantMetadata;
};

export { TenantHealthCheckSchema, TenantMetadataSchema, TenantStatsSchema };
export type { TenantHealthCheck, TenantMetadata, TenantOperationalData, TenantStats };
