import { AsyncLocalStorage } from 'async_hooks';
import { config } from 'api/config';

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
  storage = new AsyncLocalStorage<string>();

  defaultTenantName = 'default';

  tenants: { [k: string]: Tenant };

  constructor() {
    this.tenants = {};
  }

  async run(cb: () => Promise<void>, tenantName?: string): Promise<void> {
    return new Promise((resolve, reject) => {
      this.storage.run(tenantName || this.defaultTenantName, () => {
        cb()
          .then(resolve)
          .catch(reject);
      });
    });
  }

  current() {
    const tenantName = this.storage.getStore();
    if (!tenantName) {
      throw new Error('There is no tenant on the current async context');
    }
    if (!this.tenants[tenantName]) {
      throw new Error('tenant does not exists');
    }
    return this.tenants[tenantName];
  }

  addDefaultTenant() {
    this.add({ name: this.defaultTenantName, ...config.defaultTenant });
  }

  add(tenant: Tenant) {
    this.tenants[tenant.name] = tenant;
  }
}

const tenants = new Tenants();

export { tenants };
