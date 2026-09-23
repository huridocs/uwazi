export type Tenant = {
  name: string;
  dbName: string;
  indexName: string;
  uploadedDocuments: string;
  attachments: string;
  customUploads: string;
  activityLogs: string;
  domain: string;
  featureFlags?: {
    s3Storage?: boolean;
    esReplicas?: number;
    sync?: boolean;
    deactivateTestJob?: boolean;
    paragraphExtraction?: boolean;
    fileCacheHeaders?: boolean;
    themeCustomization?: boolean;
    newHeader?: boolean;
    featureFlagEntityViewerv2?: boolean;
    featureFlagLibraryV2?: boolean;
    postgresCore?: boolean;
    postgresPages?: boolean;
    postgresCsv?: boolean;
    aiAssistant?: boolean;
    aiAssistantServiceUrl?: string;
    translationService?: boolean;
    translationServiceUrl?: string;
    telemetry?: {
      enabled?: boolean;
      sampleRate?: number;
    };
    prometheus?: {
      enabled?: boolean;
      sampleRate?: number;
    };
  };
  globalMatomo?: { id: string; url: string };
  ciMatomoActive?: boolean;
  maintenance?: boolean;
};
