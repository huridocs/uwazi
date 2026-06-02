import { getConnection } from '#api/core/infrastructure/mongodb/common/getConnectionForCurrentTenant.js';
import { TransactionManagerFactory } from '#api/core/infrastructure/factories/TransactionManagerFactory.js';
import { testingEnvironment } from '#api/utils/testingEnvironment.js';
import { MongoTenantRoutingDataSource } from '../MongoTenantRoutingDataSource.js';

const createSut = () =>
  new MongoTenantRoutingDataSource(getConnection(), TransactionManagerFactory.default());

const fixtures = {
  tenantRoutings: [
    {
      tenantId: 'tenant-a',
      aliasName: 'products',
      resolvedAlias: 'products_group_enterprise',
      groupName: 'enterprise',
      assignedAt: new Date('2024-01-01'),
    },
    {
      tenantId: 'tenant-a',
      aliasName: 'orders',
      resolvedAlias: 'orders_group_enterprise',
      groupName: 'enterprise',
      assignedAt: new Date('2024-01-01'),
    },
    {
      tenantId: 'tenant-b',
      aliasName: 'products',
      resolvedAlias: 'products_group_enterprise',
      groupName: 'enterprise',
      assignedAt: new Date('2024-01-01'),
    },
    {
      tenantId: 'tenant-c',
      aliasName: 'products',
      resolvedAlias: 'products_shared',
      groupName: 'shared',
      assignedAt: new Date('2024-01-01'),
    },
  ],
};

describe('MongoTenantRoutingDataSource', () => {
  beforeAll(async () => {
    await testingEnvironment.setUp({});
  });

  beforeEach(async () => testingEnvironment.setFixtures(fixtures));

  afterAll(async () => {
    await testingEnvironment.tearDown();
  });

  describe('findRoute()', () => {
    it('returns the resolvedAlias for an exact tenantId+aliasName match', async () => {
      const sut = createSut();
      const result = await sut.findRoute('tenant-a', 'products');
      expect(result).toBe('products_group_enterprise');
    });

    it('returns null when no route exists for the tenant', async () => {
      const sut = createSut();
      const result = await sut.findRoute('tenant-unknown', 'products');
      expect(result).toBeNull();
    });

    it('returns null when tenantId matches but aliasName does not', async () => {
      const sut = createSut();
      const result = await sut.findRoute('tenant-a', 'invoices');
      expect(result).toBeNull();
    });

    it('returns null when aliasName matches but tenantId does not', async () => {
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
        aliasName: 'products',
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
        aliasName: 'products',
        resolvedAlias: 'products_group_small',
        groupName: 'small',
      });
      const docs = await testingEnvironment.db.getAllFrom('tenantRoutings');
      const created = docs.find(
        (d: any) => d.tenantId === 'tenant-new' && d.aliasName === 'products'
      );
      expect(created?.assignedAt).toBeInstanceOf(Date);
      expect((created?.assignedAt as Date).getTime()).toBeGreaterThanOrEqual(before.getTime());
    });

    it('updates resolvedAlias and groupName for an existing route', async () => {
      const sut = createSut();
      await sut.upsertRoute({
        tenantId: 'tenant-a',
        aliasName: 'products',
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
        aliasName: 'products',
        resolvedAlias: 'products_group_premium',
        groupName: 'premium',
      });
      const docs = await testingEnvironment.db.getAllFrom('tenantRoutings');
      const updated = docs.find(
        (d: any) => d.tenantId === 'tenant-a' && d.aliasName === 'products'
      );
      expect((updated?.assignedAt as Date).getTime()).toBe(new Date('2024-01-01').getTime());
    });
  });

  describe('deleteRoute()', () => {
    it('removes the route for the specified tenantId+aliasName', async () => {
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

    it('does not remove routes for the same tenant with a different aliasName', async () => {
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
