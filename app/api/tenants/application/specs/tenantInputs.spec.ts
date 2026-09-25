import {
  derivedPaths,
  RegisterTenantInputSchema,
  TenantNameInputSchema,
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

    it('should reject an unknown field', () => {
      expect(() => UpdateTenantInputSchema.parse({ name: 'acme', nope: true })).toThrow();
    });

    it('should not accept feature flags: they have their own command', () => {
      expect(() =>
        UpdateTenantInputSchema.parse({ name: 'acme', featureFlags: { postgresCore: true } })
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
