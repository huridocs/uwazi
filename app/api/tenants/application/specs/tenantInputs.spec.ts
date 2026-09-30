import {
  derivedPaths,
  RegisterTenantInputSchema,
  TenantNameInputSchema,
  UpdateStatsInputSchema,
  UpdateTenantInputSchema,
} from '../tenantInputs.js';

describe('tenant input schemas', () => {
  describe('RegisterTenantInputSchema', () => {
    it('should require a non empty name', () => {
      expect(() => RegisterTenantInputSchema.parse({})).toThrow();
      expect(() => RegisterTenantInputSchema.parse({ name: '' })).toThrow();
    });

    it('should accept a name on its own', () => {
      expect(RegisterTenantInputSchema.parse({ name: 'acme' })).toEqual({ name: 'acme' });
    });

    it('should reject an unknown field', () => {
      expect(() => RegisterTenantInputSchema.parse({ name: 'acme', nope: true })).toThrow();
    });

    it('should reject an unknown feature flag', () => {
      expect(() =>
        RegisterTenantInputSchema.parse({ name: 'acme', featureFlags: { nope: true } })
      ).toThrow();
    });

    it('should not accept null: there is nothing to remove on a new tenant', () => {
      expect(() => RegisterTenantInputSchema.parse({ name: 'acme', domain: null })).toThrow();
    });
  });

  describe('UpdateTenantInputSchema', () => {
    it('should accept null to remove a field', () => {
      expect(UpdateTenantInputSchema.parse({ name: 'acme', domain: null })).toEqual({
        name: 'acme',
        domain: null,
      });
    });

    it.each([
      'dbName',
      'indexName',
      'uploadedDocuments',
      'attachments',
      'customUploads',
      'activityLogs',
    ])('should reject null for %s: a tenant cannot run without it', field => {
      expect(() => UpdateTenantInputSchema.parse({ name: 'acme', [field]: null })).toThrow();
    });

    it('should still accept a new value for a required field', () => {
      expect(UpdateTenantInputSchema.parse({ name: 'acme', dbName: 'acme_db' })).toEqual({
        name: 'acme',
        dbName: 'acme_db',
      });
    });

    it('should reject an unknown field', () => {
      expect(() => UpdateTenantInputSchema.parse({ name: 'acme', nope: true })).toThrow();
    });

    it('should not accept feature flags: they have their own command', () => {
      expect(() =>
        UpdateTenantInputSchema.parse({ name: 'acme', featureFlags: { postgresCore: true } })
      ).toThrow();
    });
  });

  describe('UpdateStatsInputSchema', () => {
    const stats = {
      lastUpdated: 1700000000,
      dbStorage: 1,
      elasticStorage: 2,
      filesStorage: 3,
      entitiesCount: 4,
      filesCount: 5,
      totalStorage: 6,
      userCount: { admin: 1, editor: 2, collaborator: 3, total: 6 },
      lastSession: 1700000000,
    };

    it('should accept files by bucket as the stats tool writes them', () => {
      const filesByBucket = { pdf: { count: 3, size: 1200 }, image: { count: 2, size: 800 } };

      expect(
        UpdateStatsInputSchema.parse({ name: 'acme', stats: { ...stats, filesByBucket } })
      ).toEqual({ name: 'acme', stats: { ...stats, filesByBucket } });
    });

    it('should reject a bucket without count and size', () => {
      expect(() =>
        UpdateStatsInputSchema.parse({
          name: 'acme',
          stats: { ...stats, filesByBucket: { pdf: 3 } },
        })
      ).toThrow();
    });
  });

  describe('TenantNameInputSchema', () => {
    it('should take a name and nothing else', () => {
      expect(TenantNameInputSchema.parse({ name: 'acme' })).toEqual({ name: 'acme' });
      expect(() => TenantNameInputSchema.parse({ name: 'acme', domain: 'x' })).toThrow();
    });
  });

  describe('derivedPaths', () => {
    it('should follow the folder convention', () => {
      expect(derivedPaths('acme')).toEqual({
        uploadedDocuments: 'acme/documents',
        attachments: 'acme/documents',
        customUploads: 'acme/custom_uploads',
        activityLogs: 'acme/log',
      });
    });
  });
});
