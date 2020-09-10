import { Tenant, tenants } from 'api/tenants/tenantContext';
import { config } from 'api/config';

const originalCurrentFN = tenants.current.bind(tenants);

let mockedTenant: Partial<Tenant>;

const testingTenants = {
  mockCurrentTenant(tenant: Partial<Tenant>) {
    mockedTenant = this.createTenant(tenant);
    tenants.current = () => <Tenant>mockedTenant;
  },

  changeCurrentTenant(changes: Partial<Tenant>) {
    mockedTenant = {
      ...mockedTenant,
      ...changes,
    };
  },

  restoreCurrentFn() {
    tenants.current = originalCurrentFN;
  },

  createTenant(partial: Partial<Tenant>) {
    return {
      name: '',
      dbName: '',
      indexName: '',
      uploadedDocuments: '',
      attachments: '',
      customUploads: '',
      temporalFiles: '',
      uwaziVersion: config.version,
      ...partial,
    };
  },
};

export { testingTenants };
