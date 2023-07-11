import { config } from 'api/config';
import { Tenant, tenants } from 'api/tenants/tenantContext';

const originalCurrentFN = tenants.current.bind(tenants);

let mockedTenant: Partial<Tenant>;

const testingTenants = {
  mockCurrentTenant(tenant: Partial<Tenant>) {
    mockedTenant = tenant;
    mockedTenant.featureFlags = mockedTenant.featureFlags || config.defaultTenant.featureFlags;
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
      activityLogs: '',
      ...partial,
    };
  },
};

export { testingTenants };
