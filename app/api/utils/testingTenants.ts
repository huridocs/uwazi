import { Tenant, tenants } from 'api/odm/tenantContext';

const originalCurrentFN = tenants.current.bind(tenants);

let mockedTenant: Partial<Tenant>;

const testingTenants = {
  mockCurrentTenant(tenant: Partial<Tenant>) {
    mockedTenant = tenant;
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
      ...partial,
    };
  },
};

export { testingTenants };
