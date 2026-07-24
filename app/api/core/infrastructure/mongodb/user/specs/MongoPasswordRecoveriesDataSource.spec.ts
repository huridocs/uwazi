import { ObjectId } from 'mongodb';
import { TransactionManagerFactory } from '#api/core/infrastructure/factories/TransactionManagerFactory.js';
import { getConnection } from '#api/core/infrastructure/mongodb/common/getConnectionForCurrentTenant.js';
import { testingEnvironment } from '#api/utils/testingEnvironment.js';
import { getFixturesFactory } from '#api/utils/fixturesFactory.js';
import { MongoPasswordRecoveriesDataSource } from '../MongoPasswordRecoveriesDataSource.js';

const f = getFixturesFactory();

const passwordRecoveryId1 = new ObjectId();
const passwordRecoveryId2 = new ObjectId();

const fixtures = {
  users: [
    f.user({ username: 'user1', role: 'admin' as any }),
    f.user({ username: 'user2', role: 'editor' as any }),
  ],
  passwordrecoveries: [
    {
      _id: passwordRecoveryId1,
      key: 'valid-recovery-key-123',
      user: f.id('user1'),
    },
    {
      _id: passwordRecoveryId2,
      key: 'another-recovery-key-456',
      user: f.id('user2'),
    },
  ],
};

const createDs = () => {
  const transactionManager = TransactionManagerFactory.default();
  return new MongoPasswordRecoveriesDataSource({
    db: getConnection(),
    transactionManager,
  });
};

describe('MongoPasswordRecoveriesDataSource', () => {
  beforeEach(async () => {
    await testingEnvironment.setUp(fixtures);
  });

  afterAll(async () => {
    await testingEnvironment.tearDown();
  });

  describe('findByKey', () => {
    it('should return the recordId and userId when the key exists', async () => {
      const ds = createDs();
      const result = await ds.findByKey('valid-recovery-key-123');
      expect(result.isOk()).toBe(true);
      const data = result.getData()!;
      expect(data.recordId).toBe(passwordRecoveryId1.toString());
      expect(data.userId).toBe(f.idString('user1'));
    });

    it('should return fail with RecoveryKeyNotFound when the key does not exist', async () => {
      const ds = createDs();
      const result = await ds.findByKey('non-existent-key');
      expect(result.isError()).toBe(true);
      expect(result.getError()!.name).toBe('RecoveryKeyNotFound');
    });
  });

  describe('deleteById', () => {
    it('should delete the recovery record by id', async () => {
      const ds = createDs();
      await ds.deleteById(passwordRecoveryId1.toString());
      const result = await ds.findByKey('valid-recovery-key-123');
      expect(result.isError()).toBe(true);
    });

    it('should not throw when deleting a non-existent record', async () => {
      const ds = createDs();
      await expect(ds.deleteById(new ObjectId().toHexString())).resolves.toBeUndefined();
    });
  });
});
