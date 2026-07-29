import { testingEnvironment } from '#api/utils/testingEnvironment.js';
import { testingPG } from '#api/utils/testing_pg.js';
import { PostgresDB } from '#api/infrastructure/PostgresDB.js';
import { LoggerFactory } from '#api/core/infrastructure/factories/LoggerFactory.js';
import { IdGeneratorFactory } from '#api/core/infrastructure/factories/IdGeneratorFactory.js';
import { PostgresTransactionManager } from '../../common/PostgresTransactionManager.js';
import { PostgresPasswordRecoveriesDataSource } from '../PostgresPasswordRecoveriesDataSource.js';

const TENANT_ID = 'test-tenant';
const OTHER_TENANT_ID = 'other-tenant';

const managerFor = (tenantId: string) =>
  new PostgresTransactionManager(PostgresDB.knex, tenantId, LoggerFactory.forTests());

const makeDS = (tenantId = TENANT_ID) =>
  new PostgresPasswordRecoveriesDataSource({
    tenantId,
    pgTransactionManager: managerFor(tenantId),
    idGenerator: IdGeneratorFactory.default(),
  });

const ONE_DAY_IN_MS = 24 * 60 * 60 * 1000;

beforeAll(async () => {
  await testingEnvironment.setUp({}, { postgres: true });
});

beforeEach(async () => {
  await testingPG.clear(['password_recoveries']);
});

afterAll(async () => {
  await testingEnvironment.tearDown();
});

describe('PostgresPasswordRecoveriesDataSource', () => {
  describe('create', () => {
    it('should create a record findable afterwards via findByKey', async () => {
      const ds = makeDS();
      await ds.create({ userId: 'user-1', key: 'brand-new-key-789' });

      const result = await ds.findByKey('brand-new-key-789');
      expect(result.isOk()).toBe(true);
      expect(result.getData()!.userId).toBe('user-1');
    });

    it('should set expiresAt roughly 24h in the future and round-trip as a real Date', async () => {
      const ds = makeDS();
      const before = Date.now();
      await ds.create({ userId: 'user-1', key: 'expiring-key-abc' });
      const after = Date.now();

      const [row] = await testingPG.getAllFrom<{ expiresAt: string }>('password_recoveries');
      const expiresAtMs = new Date(row.expiresAt).getTime();

      expect(expiresAtMs).toBeGreaterThanOrEqual(before + ONE_DAY_IN_MS);
      expect(expiresAtMs).toBeLessThanOrEqual(after + ONE_DAY_IN_MS);
    });

    it('should allow creating two independent records for the same user', async () => {
      const ds = makeDS();
      await ds.create({ userId: 'user-1', key: 'first-key' });
      await ds.create({ userId: 'user-1', key: 'second-key' });

      expect((await ds.findByKey('first-key')).isOk()).toBe(true);
      expect((await ds.findByKey('second-key')).isOk()).toBe(true);
    });
  });

  describe('findByKey', () => {
    it('should return the recordId and userId when the key exists', async () => {
      const ds = makeDS();
      await ds.create({ userId: 'user-1', key: 'valid-recovery-key-123' });

      const result = await ds.findByKey('valid-recovery-key-123');
      expect(result.isOk()).toBe(true);
      expect(result.getData()!.userId).toBe('user-1');
      expect(typeof result.getData()!.recordId).toBe('string');
    });

    it('should return fail with RecoveryKeyNotFound when the key does not exist', async () => {
      const ds = makeDS();
      const result = await ds.findByKey('non-existent-key');
      expect(result.isError()).toBe(true);
      expect(result.getError()!.name).toBe('RecoveryKeyNotFound');
    });

    it('should return fail with RecoveryKeyNotFound for an expired-but-still-present row', async () => {
      const ds = makeDS();
      await ds.create({ userId: 'user-1', key: 'expired-key' });
      await testingPG.pool!.query(
        'UPDATE password_recoveries SET "expiresAt" = now() - interval \'1 hour\' WHERE "key" = \'expired-key\''
      );

      const result = await ds.findByKey('expired-key');
      expect(result.isError()).toBe(true);
      expect(result.getError()!.name).toBe('RecoveryKeyNotFound');

      const rows = await testingPG.getAllFrom('password_recoveries');
      expect(rows).toHaveLength(1);
    });

    it('should not find a record created under a different tenant', async () => {
      const dsA = makeDS(TENANT_ID);
      const dsB = makeDS(OTHER_TENANT_ID);
      await dsA.create({ userId: 'user-1', key: 'tenant-scoped-key' });

      const result = await dsB.findByKey('tenant-scoped-key');
      expect(result.isError()).toBe(true);
    });
  });

  describe('deleteById', () => {
    it('should delete the recovery record by id', async () => {
      const ds = makeDS();
      await ds.create({ userId: 'user-1', key: 'to-delete-key' });
      const created = await ds.findByKey('to-delete-key');
      const id = created.getData()!.recordId;

      await ds.deleteById(id);

      const result = await ds.findByKey('to-delete-key');
      expect(result.isError()).toBe(true);
    });

    it('should not throw when deleting a non-existent record', async () => {
      const ds = makeDS();
      await expect(ds.deleteById('non-existent-id')).resolves.toBeUndefined();
    });
  });
});
