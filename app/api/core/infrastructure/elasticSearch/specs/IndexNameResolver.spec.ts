import { TenantIndexResolver } from '../TenantIndexResolver.js';
import type { TenantRoutingRepository } from '../TenantRoutingRepository.js';

const makeRepository = (
  override: Partial<TenantRoutingRepository> = {}
): TenantRoutingRepository => ({
  findRoute: jest.fn().mockResolvedValue(null),
  upsertRoute: jest.fn().mockResolvedValue(undefined),
  findTenantsByGroup: jest.fn().mockResolvedValue([]),
  deleteRoute: jest.fn().mockResolvedValue(undefined),
  ...override,
});

describe('TenantIndexResolver', () => {
  afterEach(() => {
    jest.useRealTimers();
  });

  it('returns logical name unchanged when no DB route exists (default shared path)', async () => {
    const repo = makeRepository();
    const router = new TenantIndexResolver(repo);
    const result = await router.resolve('products', 'tenant-a');
    expect(result).toBe('products');
  });

  it('returns DB override when route exists', async () => {
    const repo = makeRepository({
      findRoute: jest.fn().mockResolvedValue('products_tenant_a'),
    });
    const router = new TenantIndexResolver(repo);
    const result = await router.resolve('products', 'tenant-a');
    expect(result).toBe('products_tenant_a');
  });

  it('repository error propagates as thrown exception (no silent fallback)', async () => {
    const findRoute = jest.fn().mockRejectedValue(new Error('DB connection failed'));
    const repo = makeRepository({ findRoute });
    const router = new TenantIndexResolver(repo);

    await expect(router.resolve('products', 'tenant-a')).rejects.toThrow('DB connection failed');
  });
});
