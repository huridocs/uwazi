import type { FeatureFlags } from './featureFlags.js';

type Tenant = {
  name: string;
  dbName: string;
  indexName: string;
  uploadedDocuments: string;
  attachments: string;
  customUploads: string;
  activityLogs: string;
  domain: string;
  featureFlags?: FeatureFlags;
  globalMatomo?: { id: string; url: string };
  ciMatomoActive?: boolean;
  maintenance?: boolean;
};

/**
 * The fields the running process needs. The stored record carries more — operational data written
 * by other tools — which is kept out of every process's memory.
 */
const TENANT_FIELDS = [
  'name',
  'dbName',
  'indexName',
  'uploadedDocuments',
  'attachments',
  'customUploads',
  'activityLogs',
  'domain',
  'featureFlags',
  'globalMatomo',
  'ciMatomoActive',
  'maintenance',
] as const satisfies readonly (keyof Tenant)[];

export { TENANT_FIELDS };
export type { Tenant };
