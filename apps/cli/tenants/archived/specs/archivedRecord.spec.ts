import type { TenantRecord } from '#api/tenants/application/contracts/TenantsDataSource.js';
import { toActiveRecord, toArchivedRecord } from '../archivedRecord.js';

const dumpLocation = {
  db: 'https://s3.example.org/acme_db.zip',
  files: 'https://store.example.org/acme',
};

// The cast keeps the fixture honest about what the registry really holds: rows other tools wrote
// may carry operational data in any shape. The function must drop it whatever it looks like.
const tenant = {
  name: 'acme',
  dbName: 'acme',
  indexName: 'acme',
  uploadedDocuments: 'acme/documents',
  attachments: 'acme/documents',
  customUploads: 'acme/custom_uploads',
  activityLogs: 'acme/log',
  domain: 'acme.uwazi.io',
  featureFlags: {
    postgresCore: true,
    s3Storage: true,
    telemetry: { enabled: true, sampleRate: 0.5 },
  },
  globalMatomo: { id: '1', url: 'https://matomo.example.org' },
  ciMatomoActive: true,
  maintenance: false,
  stats: { entitiesCount: 3 },
  healthChecks: [{ name: 'disk' }],
  metadata: { orgName: 'Acme' },
  stray: 'drop me',
} as unknown as TenantRecord;

describe('archivedRecord', () => {
  describe('toArchivedRecord', () => {
    it('should keep exactly the snapshot fields and add status, dumpLocation and archivedAt', () => {
      expect(toArchivedRecord(tenant, dumpLocation, 1759700000)).toEqual({
        name: 'acme',
        dbName: 'acme',
        indexName: 'acme',
        uploadedDocuments: 'acme/documents',
        attachments: 'acme/documents',
        customUploads: 'acme/custom_uploads',
        activityLogs: 'acme/log',
        featureFlags: {
          postgresCore: true,
          s3Storage: true,
          telemetry: { enabled: true, sampleRate: 0.5 },
        },
        status: 'archived',
        dumpLocation,
        archivedAt: 1759700000,
      });
    });

    it('should omit a snapshot field the tenant does not have', () => {
      const legacy = { name: 'legacy', featureFlags: { postgresCore: false } };

      expect(toArchivedRecord(legacy, dumpLocation, 1759700000)).toEqual({
        name: 'legacy',
        featureFlags: { postgresCore: false },
        status: 'archived',
        dumpLocation,
        archivedAt: 1759700000,
      });
    });
  });

  describe('toActiveRecord', () => {
    it('should rebuild the snapshot without name, _id or the archive-only fields', () => {
      expect(
        toActiveRecord({
          _id: '6ac6807566a491edb123448f',
          name: 'acme',
          dbName: 'acme',
          indexName: 'acme',
          uploadedDocuments: 'acme/documents',
          attachments: 'acme/documents',
          customUploads: 'acme/custom_uploads',
          activityLogs: 'acme/log',
          featureFlags: {
            postgresCore: true,
            s3Storage: true,
            telemetry: { enabled: true, sampleRate: 0.5 },
          },
          status: 'archived',
          dumpLocation,
          archivedAt: 1759700000,
          stray: 'drop me',
        })
      ).toEqual({
        dbName: 'acme',
        indexName: 'acme',
        uploadedDocuments: 'acme/documents',
        attachments: 'acme/documents',
        customUploads: 'acme/custom_uploads',
        activityLogs: 'acme/log',
        featureFlags: {
          postgresCore: true,
          s3Storage: true,
          telemetry: { enabled: true, sampleRate: 0.5 },
        },
      });
    });

    it('should preserve the full featureFlags through the round trip', () => {
      const flags = {
        postgresCore: true,
        telemetry: { enabled: true, sampleRate: 0.5 },
        prometheus: { enabled: false, sampleRate: 0.1 },
      };

      const archived = toArchivedRecord(
        { name: 'acme', featureFlags: flags },
        dumpLocation,
        1759700000
      );

      expect(toActiveRecord(archived)).toEqual({ featureFlags: flags });
    });
  });
});
