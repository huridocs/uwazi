import { config } from 'api/config';
import { handleError } from 'api/utils';
import { appContext } from 'api/utils/AppContext';
import { TenantDocument, TenantsModel, DBTenant, tenantsModel } from './tenantsModel';

type Tenant = {
  name: string;
  dbName: string;
  indexName: string;
  uploadedDocuments: string;
  attachments: string;
  customUploads: string;
  activityLogs: string;
  featureFlags?: {
    s3Storage?: boolean;
  };
  globalMatomo?: { id: string; url: string };
  ciMatomoActive?: boolean;
};

class Tenants {
  tenants: { [k: string]: Tenant };

  defaultTenant: Tenant;

  model?: TenantsModel;

  constructor(defaultTenant: Tenant) {
    this.defaultTenant = defaultTenant;
    this.tenants = {
      [config.defaultTenant.name]: defaultTenant,
    };
  }

  async setupTenants() {
    const model = await tenantsModel();
    this.model = model;
    model.on('change', () => {
      this.updateTenants(model).catch(handleError);
    });
    await this.updateTenants(model);
  }

  async tearDownTenants() {
    await this.model?.closeChangeStream();
  }

  async updateTenants(model: TenantsModel) {
    const tenants = await model.get();

    tenants.forEach((tenant: TenantDocument) => {
      this.add(tenant);
    });
  }

  /**
   * This is a proxy to the context run method using only the tenant information.
   * It is here for backwards compatibility after refactoring.
   * @param cb The callback to run in the context
   * @param tenantName Tenant name
   */
  // eslint-disable-next-line class-methods-use-this
  async run(
    cb: () => Promise<void>,
    tenantName: string = config.defaultTenant.name
  ): Promise<void> {
    return appContext.run(cb, {
      tenant: tenantName,
    });
  }

  current() {
    const tenantName = <string>appContext.get('tenant');

    if (!tenantName) {
      throw new Error('There is no tenant on the current async context');
    }
    if (!this.tenants[tenantName]) {
      throw new Error(
        `the tenant set to run the current async context -> [${tenantName}] its not available in the current process`
      );
    }
    return this.tenants[tenantName];
  }

  add(tenant: DBTenant) {
    this.tenants[tenant.name] = { ...this.defaultTenant, ...tenant };
  }
}

const tenants = new Tenants(config.defaultTenant);
export { tenants };
export type { Tenant };
