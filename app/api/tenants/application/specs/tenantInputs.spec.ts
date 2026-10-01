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

    it.each(['acme', 'tenant_a', 'acme-2', '0acme'])('should accept the name %j', tenant => {
      expect(RegisterTenantInputSchema.parse({ name: tenant })).toEqual({ name: tenant });
    });

    it.each(['Acme', ' ', 'acme corp', '../acme', 'acme.org', '-acme', '_acme', 'a'.repeat(64)])(
      'should reject the name %j: it becomes a database, an index and folder names',
      tenant => {
        expect(() => RegisterTenantInputSchema.parse({ name: tenant })).toThrow();
      }
    );

    it.each(['', 'a/b', 'a.b', 'a b', 'a$b', 'a"b', 'a\\b', 'a'.repeat(64)])(
      'should reject the database name %j',
      dbName => {
        expect(() => RegisterTenantInputSchema.parse({ name: 'acme', dbName })).toThrow();
      }
    );

    it.each(['', 'Acme', '-acme', '_acme', '+acme', 'a b', 'a,b', 'a#b', 'a*b', 'a:b', '.', '..'])(
      'should reject the index name %j',
      indexName => {
        expect(() => RegisterTenantInputSchema.parse({ name: 'acme', indexName })).toThrow();
      }
    );

    it.each(['', '../other/documents', 'acme/../../etc'])('should reject the folder %j', folder => {
      expect(() =>
        RegisterTenantInputSchema.parse({ name: 'acme', uploadedDocuments: folder })
      ).toThrow();
    });

    it('should accept absolute folders, as single instances configure them', () => {
      expect(
        RegisterTenantInputSchema.parse({ name: 'acme', uploadedDocuments: '/data/acme/docs/' })
      ).toEqual({ name: 'acme', uploadedDocuments: '/data/acme/docs/' });
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

    it('should reach an existing tenant whatever its name, as names predate the rules', () => {
      expect(UpdateTenantInputSchema.parse({ name: 'Legacy.Tenant' })).toEqual({
        name: 'Legacy.Tenant',
      });
      expect(TenantNameInputSchema.parse({ name: 'Legacy.Tenant' })).toEqual({
        name: 'Legacy.Tenant',
      });
    });

    it.each([
      ['dbName', ''],
      ['dbName', 'a.b'],
      ['indexName', ''],
      ['indexName', 'Upper'],
      ['activityLogs', ''],
      ['customUploads', '../x'],
    ])('should apply the same rules to %s, rejecting %j', (field, value) => {
      expect(() => UpdateTenantInputSchema.parse({ name: 'acme', [field]: value })).toThrow();
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

    it('should accept null for a single metadata key, to remove only that key', () => {
      expect(
        UpdateTenantInputSchema.parse({ name: 'acme', metadata: { notes: null, orgName: 'Acme' } })
      ).toEqual({ name: 'acme', metadata: { notes: null, orgName: 'Acme' } });
    });

    it('should reject an unknown metadata key', () => {
      expect(() =>
        UpdateTenantInputSchema.parse({ name: 'acme', metadata: { nope: 'x' } })
      ).toThrow();
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
