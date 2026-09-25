import type { FeatureFlags } from './featureFlags.js';

export type Tenant = {
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
