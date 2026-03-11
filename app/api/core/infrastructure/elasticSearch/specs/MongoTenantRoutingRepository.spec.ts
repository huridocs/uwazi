import { getConnection } from '#api/core/infrastructure/mongodb/common/getConnectionForCurrentTenant.js';
import { TransactionManagerFactory } from '#api/core/infrastructure/factories/TransactionManagerFactory.js';
import { testingEnvironment } from '#api/utils/testingEnvironment.js';
import { MongoTenantRoutingRepository } from '../MongoTenantRoutingRepository.js';

const createSut = () =>
  new MongoTenantRoutingRepository(getConnection(), TransactionManagerFactory.default());

const fixtures = {
  tenantRoutings: [
    {
      tenantId: 'tenant-a',
      logicalName: 'products',
      resolvedAlias: 'products_group_enterprise',
      groupName: 'enterprise',
      assignedAt: new Date('2024-01-01'),
    },
    {
      tenantId: 'tenant-a',
      logicalName: 'orders',
      resolvedAlias: 'orders_group_enterprise',
      groupName: 'enterprise',
      assignedAt: new Date('2024-01-01'),
    },
    {
      tenantId: 'tenant-b',
      logicalName: 'products',
      resolvedAlias: 'products_group_enterprise',
      groupName: 'enterprise',
      assignedAt: new Date('2024-01-01'),
    },
    {
      tenantId: 'tenant-c',
      logicalName: 'products',
      resolvedAlias: 'products_shared',
      groupName: 'shared',
      assignedAt: new Date('2024-01-01'),
    },
  ],
};

describe('MongoTenantRoutingRepository', () => {
  beforeAll(async () => {
    await testingEnvironment.setUp({});
  });

  beforeEach(async () => testingEnvironment.setFixtures(fixtures));

  afterAll(async () => {
    await testingEnvironment.tearDown();
  });

  describe('findRoute()', () => {
    it('returns the resolvedAlias for an exact tenantId+logicalName match', async () => {
      const sut = createSut();
      const result = await sut.findRoute('tenant-a', 'products');
      expect(result).toBe('products_group_enterprise');
    });

    it('returns null when no route exists for the tenant', async () => {
      const sut = createSut();
      const result = await sut.findRoute('tenant-unknown', 'products');
      expect(result).toBeNull();
    });

    it('returns null when tenantId matches but logicalName does not', async () => {
      const sut = createSut();
      const result = await sut.findRoute('tenant-a', 'invoices');
      expect(result).toBeNull();
    });

    it('returns null when logicalName matches but tenantId does not', async () => {
      const sut = createSut();
      const result = await sut.findRoute('tenant-x', 'products');
      expect(result).toBeNull();
    });
  });

  describe('upsertRoute()', () => {
    it('creates a new route when none exists', async () => {
      const sut = createSut();
      await sut.upsertRoute({
        tenantId: 'tenant-new',
        logicalName: 'products',
        resolvedAlias: 'products_group_small',
        groupName: 'small',
      });
      const result = await sut.findRoute('tenant-new', 'products');
      expect(result).toBe('products_group_small');
    });

    it('sets assignedAt when inserting a new route', async () => {
      const sut = createSut();
      const before = new Date();
      await sut.upsertRoute({
        tenantId: 'tenant-new',
        logicalName: 'products',
        resolvedAlias: 'products_group_small',
        groupName: 'small',
      });
      const docs = await testingEnvironment.db.getAllFrom('tenantRoutings');
      const created = docs.find(
        (d: any) => d.tenantId === 'tenant-new' && d.logicalName === 'products'
      );
      expect(created?.assignedAt).toBeInstanceOf(Date);
      expect((created?.assignedAt as Date).getTime()).toBeGreaterThanOrEqual(before.getTime());
    });

    it('updates resolvedAlias and groupName for an existing route', async () => {
      const sut = createSut();
      await sut.upsertRoute({
        tenantId: 'tenant-a',
        logicalName: 'products',
        resolvedAlias: 'products_group_premium',
        groupName: 'premium',
      });
      const result = await sut.findRoute('tenant-a', 'products');
      expect(result).toBe('products_group_premium');
    });

    it('does not reset assignedAt when updating an existing route', async () => {
      const sut = createSut();
      await sut.upsertRoute({
        tenantId: 'tenant-a',
        logicalName: 'products',
        resolvedAlias: 'products_group_premium',
        groupName: 'premium',
      });
      const docs = await testingEnvironment.db.getAllFrom('tenantRoutings');
      const updated = docs.find(
        (d: any) => d.tenantId === 'tenant-a' && d.logicalName === 'products'
      );
      expect((updated?.assignedAt as Date).getTime()).toBe(new Date('2024-01-01').getTime());
    });
  });

  describe('findTenantsByGroup()', () => {
    it('returns all tenantIds for the matching group+logicalName', async () => {
      const sut = createSut();
      const result = await sut.findTenantsByGroup('enterprise', 'products');
      expect(result).toHaveLength(2);
      expect(result).toEqual(expect.arrayContaining(['tenant-a', 'tenant-b']));
    });

    it('returns empty array when no tenants match', async () => {
      const sut = createSut();
      const result = await sut.findTenantsByGroup('nonexistent', 'products');
      expect(result).toEqual([]);
    });

    it('does not include tenants from a different group', async () => {
      const sut = createSut();
      const result = await sut.findTenantsByGroup('shared', 'products');
      expect(result).not.toContain('tenant-a');
      expect(result).not.toContain('tenant-b');
    });

    it('does not include tenants with a different logicalName', async () => {
      const sut = createSut();
      const result = await sut.findTenantsByGroup('enterprise', 'orders');
      expect(result).toEqual(['tenant-a']);
    });
  });

  describe('deleteRoute()', () => {
    it('removes the route for the specified tenantId+logicalName', async () => {
      const sut = createSut();
      await sut.deleteRoute('tenant-a', 'products');
      const result = await sut.findRoute('tenant-a', 'products');
      expect(result).toBeNull();
    });

    it('does not remove routes for other tenants', async () => {
      const sut = createSut();
      await sut.deleteRoute('tenant-a', 'products');
      const result = await sut.findRoute('tenant-b', 'products');
      expect(result).toBe('products_group_enterprise');
    });

    it('does not remove routes for the same tenant with a different logicalName', async () => {
      const sut = createSut();
      await sut.deleteRoute('tenant-a', 'products');
      const result = await sut.findRoute('tenant-a', 'orders');
      expect(result).toBe('orders_group_enterprise');
    });

    it('does not throw when deleting a non-existent route', async () => {
      const sut = createSut();
      await expect(sut.deleteRoute('tenant-nonexistent', 'products')).resolves.not.toThrow();
    });
  });
});
