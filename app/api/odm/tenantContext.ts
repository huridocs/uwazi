import { AsyncLocalStorage } from 'async_hooks';
import { EventEmitter } from 'events';
import { config } from 'api/config';

export type Tenant = {
  name: string;
  dbName: string;
  indexName: string;
};

class Tenants extends EventEmitter {
  storage = new AsyncLocalStorage<string>();

  defaultTenantName = 'default';

  tenants: { [k: string]: Tenant };

  constructor() {
    super();
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
    return this.tenants[tenantName];
  }

  addDefaultTenant() {
    this.add({ name: this.defaultTenantName, ...config.defaultTenant });
  }

  add(tenant: Tenant) {
    this.tenants[tenant.name] = tenant;
    this.emit('newTenant', tenant);
  }
}

const tenants = new Tenants();
tenants.setMaxListeners(18);
export { tenants };
