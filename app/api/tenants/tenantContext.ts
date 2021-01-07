import { config } from 'api/config';
import handleError from 'api/utils/handleError.js';
import { appContext } from 'api/utils/AppContext';
import { TenantsModel } from './tenantsModel';

export type Tenant = {
  name: string;
  dbName: string;
  indexName: string;
  uploadedDocuments: string;
  attachments: string;
  customUploads: string;
  temporalFiles: string;
};

class Tenants {
  tenants: { [k: string]: Tenant };

  constructor() {
    this.tenants = {
      [config.defaultTenant.name]: config.defaultTenant,
    };
  }

  async setupTenants() {
    const model = new TenantsModel();
    model.on('change', () => {
      this.updateTenants(model).catch(handleError);
    });
    await this.updateTenants(model);
  }

  async updateTenants(model: TenantsModel) {
    const tenants = await model.get();

    tenants.forEach((tenant: Tenant) => {
      this.add(tenant);
    });
  }

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

  add(tenant: Tenant) {
    this.tenants[tenant.name] = tenant;
  }
}

const tenants = new Tenants();

export { tenants };
