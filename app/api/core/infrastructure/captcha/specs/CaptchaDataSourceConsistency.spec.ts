import { CaptchaDataSource } from '#api/core/application/contracts/CaptchaDataSource.js';
import { CaptchaNotFound } from '#api/core/domain/captcha/errors.js';
import { LoggerFactory } from '#api/core/infrastructure/factories/LoggerFactory.js';
import { IdGeneratorFactory } from '#api/core/infrastructure/factories/IdGeneratorFactory.js';
import { TransactionManagerFactory } from '#api/core/infrastructure/factories/TransactionManagerFactory.js';
import { getConnection } from '#api/core/infrastructure/mongodb/common/getConnectionForCurrentTenant.js';
import { MongoCaptchaDataSource } from '#api/core/infrastructure/mongodb/captcha/MongoCaptchaDataSource.js';
import { PostgresDB } from '#api/infrastructure/PostgresDB.js';
import { testingEnvironment } from '#api/utils/testingEnvironment.js';
import { PostgresTransactionManager } from '../../postgresql/common/PostgresTransactionManager.js';
import { PostgresCaptchaDataSource } from '../../postgresql/captcha/PostgresCaptchaDataSource.js';

const TENANT_ID = 'test-tenant';

type TestConfig = { name: string; usePostgres: boolean };

const testConfigs: TestConfig[] = [
  { name: 'Mongo', usePostgres: false },
  { name: 'Postgres', usePostgres: true },
];

describe('CaptchaDataSource consistency', () => {
  beforeAll(async () => {
    await testingEnvironment.setUp({}, { postgres: true });
  });

  afterAll(async () => {
    await testingEnvironment.tearDown();
  });

  describe.each(testConfigs)('$name', ({ usePostgres }) => {
    beforeEach(async () => {
      await testingEnvironment.setFixtures({ captchas: [] });
    });

    const makeDS = (): CaptchaDataSource =>
      usePostgres
        ? new PostgresCaptchaDataSource({
            tenantId: TENANT_ID,
            pgTransactionManager: new PostgresTransactionManager(
              PostgresDB.knex,
              TENANT_ID,
              LoggerFactory.forTests()
            ),
            idGenerator: IdGeneratorFactory.default(),
          })
        : new MongoCaptchaDataSource({
            db: getConnection(),
            transactionManager: TransactionManagerFactory.default(),
          });

    it('should store the text and return it via findById using the generated id', async () => {
      const ds = makeDS();
      const { id } = await ds.create('abcd12');

      const result = await ds.findById(id);
      expect(result.isOk()).toBe(true);
      expect(result.getData()).toEqual({ id, text: 'abcd12' });
    });

    it('should fail with CaptchaNotFound for an unknown id', async () => {
      const ds = makeDS();
      const result = await ds.findById('000000000000000000000000');

      expect(result.isError()).toBe(true);
      expect(result.getError()).toBeInstanceOf(CaptchaNotFound);
    });

    it('should make the record unfindable after deleteById', async () => {
      const ds = makeDS();
      const { id } = await ds.create('to-delete');

      await ds.deleteById(id);

      const result = await ds.findById(id);
      expect(result.isError()).toBe(true);
      expect(result.getError()).toBeInstanceOf(CaptchaNotFound);
    });

    it('should treat a second deleteById on an already-deleted record as a no-op', async () => {
      const ds = makeDS();
      const { id } = await ds.create('double-delete');

      await ds.deleteById(id);

      await expect(ds.deleteById(id)).resolves.toBeUndefined();
    });
  });
});
