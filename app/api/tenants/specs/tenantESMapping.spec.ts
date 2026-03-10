import { tenants } from '../tenantContext';
import { getTenantESMapping } from '../tenantESMapping';

describe('tenantESMapping', () => {
  describe('getTenantESMapping', () => {
    it('should use the base elastic mapping', async () => {
      tenants.add({
        name: 'test-tenant',
        dbName: 'test-tenant-db',
      });

      await tenants.run(async () => {
        expect(getTenantESMapping().settings['index.number_of_replicas']).toBe(0);
      }, 'test-tenant');
    });

    it('should use the append tenant specific configuration to base mapping', async () => {
      tenants.add({
        name: 'test-tenant',
        dbName: 'test-tenant-db',
        featureFlags: { esReplicas: 2 },
      });

      await tenants.run(async () => {
        expect(getTenantESMapping().settings['index.number_of_replicas']).toBe(2);
      }, 'test-tenant');
    });
  });
});
