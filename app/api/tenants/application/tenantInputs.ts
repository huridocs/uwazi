import { z } from 'zod';
import { FeatureFlagsPatchSchema, FeatureFlagsSchema } from '../featureFlags.js';
import {
  TenantHealthCheckSchema,
  TenantMetadataSchema,
  TenantStatsSchema,
} from '../operationalData.js';

const name = z.string().min(1);
const globalMatomo = z.object({ id: z.string(), url: z.string() }).strict();

/** Folder layout is a uwazi convention; callers may still pass their own. */
const derivedPaths = (tenant: string) => ({
  uploadedDocuments: `${tenant}/documents`,
  attachments: `${tenant}/documents`,
  customUploads: `${tenant}/custom_uploads`,
  activityLogs: `${tenant}/log`,
});

const paths = {
  uploadedDocuments: z.string().optional(),
  attachments: z.string().optional(),
  customUploads: z.string().optional(),
  activityLogs: z.string().optional(),
};

const RegisterTenantInputSchema = z
  .object({
    name,
    dbName: z.string().optional(),
    indexName: z.string().optional(),
    domain: z.string().optional(),
    featureFlags: FeatureFlagsSchema.optional(),
    globalMatomo: globalMatomo.optional(),
    ciMatomoActive: z.boolean().optional(),
    ...paths,
  })
  .strict();

/** `null` removes a field, an omitted field is left as it is. */
const UpdateTenantInputSchema = z
  .object({
    name,
    dbName: z.string().nullish(),
    indexName: z.string().nullish(),
    domain: z.string().nullish(),
    globalMatomo: globalMatomo.nullish(),
    ciMatomoActive: z.boolean().nullish(),
    uploadedDocuments: z.string().nullish(),
    attachments: z.string().nullish(),
    customUploads: z.string().nullish(),
    activityLogs: z.string().nullish(),
    metadata: TenantMetadataSchema.nullish(),
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
