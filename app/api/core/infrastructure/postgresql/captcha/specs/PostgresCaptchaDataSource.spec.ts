import { testingEnvironment } from '#api/utils/testingEnvironment.js';
import { testingPG } from '#api/utils/testing_pg.js';
import { PostgresDB } from '#api/infrastructure/PostgresDB.js';
import { LoggerFactory } from '#api/core/infrastructure/factories/LoggerFactory.js';
import { IdGeneratorFactory } from '#api/core/infrastructure/factories/IdGeneratorFactory.js';
import { CaptchaNotFound } from '#api/core/domain/captcha/errors.js';
import { PostgresTransactionManager } from '../../common/PostgresTransactionManager.js';
import { PostgresCaptchaDataSource } from '../PostgresCaptchaDataSource.js';

const TENANT_ID = 'test-tenant';
const OTHER_TENANT_ID = 'other-tenant';

const managerFor = (tenantId: string) =>
  new PostgresTransactionManager(PostgresDB.knex, tenantId, LoggerFactory.forTests());

const makeDS = (tenantId = TENANT_ID) =>
  new PostgresCaptchaDataSource({
    tenantId,
    pgTransactionManager: managerFor(tenantId),
    idGenerator: IdGeneratorFactory.default(),
  });

const TEN_HOURS_IN_MS = 10 * 60 * 60 * 1000;

beforeAll(async () => {
  await testingEnvironment.setUp({}, { postgres: true });
});

beforeEach(async () => {
  await testingPG.clear(['captchas']);
});

afterAll(async () => {
  await testingEnvironment.tearDown();
});

describe('PostgresCaptchaDataSource', () => {
  describe('create', () => {
    it('should store the text and return a findable id', async () => {
      const ds = makeDS();
      const { id } = await ds.create('abcd12');

      const result = await ds.findById(id);
      expect(result.isOk()).toBe(true);
      expect(result.getData()).toEqual({ id, text: 'abcd12' });
    });

    it('should set expiresAt roughly 10h in the future and round-trip as a real Date', async () => {
      const ds = makeDS();
      const before = Date.now();
      await ds.create('abcd12');
      const after = Date.now();

      const [row] = await testingPG.getAllFrom<{ expiresAt: string }>('captchas');
      const expiresAtMs = new Date(row.expiresAt).getTime();

      expect(expiresAtMs).toBeGreaterThanOrEqual(before + TEN_HOURS_IN_MS);
      expect(expiresAtMs).toBeLessThanOrEqual(after + TEN_HOURS_IN_MS);
    });
  });

  describe('findById', () => {
    it('should return the stored record when it exists', async () => {
      const ds = makeDS();
      const { id } = await ds.create('k0n2170');

      const result = await ds.findById(id);
      expect(result.isOk()).toBe(true);
      expect(result.getData()).toEqual({ id, text: 'k0n2170' });
    });

    it('should fail with CaptchaNotFound when the id does not exist', async () => {
      const ds = makeDS();
      const result = await ds.findById('non-existent-id');

      expect(result.isError()).toBe(true);
      expect(result.getError()).toBeInstanceOf(CaptchaNotFound);
    });

    it('should fail with CaptchaNotFound for an expired-but-still-present row', async () => {
      const ds = makeDS();
      const { id } = await ds.create('expired-text');
      await testingPG.pool!.query(
        'UPDATE captchas SET "expiresAt" = now() - interval \'1 hour\' WHERE "_id" = $1',
        [id]
      );

      const result = await ds.findById(id);
      expect(result.isError()).toBe(true);
      expect(result.getError()).toBeInstanceOf(CaptchaNotFound);

      const rows = await testingPG.getAllFrom('captchas');
      expect(rows).toHaveLength(1);
    });

    it('should not find a record created under a different tenant', async () => {
      const dsA = makeDS(TENANT_ID);
      const dsB = makeDS(OTHER_TENANT_ID);
      const { id } = await dsA.create('tenant-scoped-text');

      const result = await dsB.findById(id);
      expect(result.isError()).toBe(true);
    });
  });

  describe('deleteById', () => {
    it('should remove the record', async () => {
      const ds = makeDS();
      const { id } = await ds.create('to-delete-text');

      await ds.deleteById(id);

      const result = await ds.findById(id);
      expect(result.isError()).toBe(true);
    });

    it('should not throw when deleting a non-existent record', async () => {
      const ds = makeDS();
      await expect(ds.deleteById('non-existent-id')).resolves.toBeUndefined();
    });
  });
});
