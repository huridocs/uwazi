import { config } from 'api/config';
import { tenants } from '../tenantContext';

describe('tenantsContext', () => {
  describe('add', () => {
    it('should add defaults to tenant added', async () => {
      tenants.add({ name: 'test-tenant', dbName: 'test-tenant-db' });
      await tenants.run(async () => {
        expect(tenants.current()).toMatchObject({
          ...config.defaultTenant,
          name: 'test-tenant',
          dbName: 'test-tenant-db',
        });
      }, 'test-tenant');
    });
  });
});
