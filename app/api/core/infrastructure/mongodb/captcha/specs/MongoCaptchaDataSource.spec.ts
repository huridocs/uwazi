import { ObjectId } from 'mongodb';
import db from '#api/utils/testing_db.js';
import { testingEnvironment } from '#api/utils/testingEnvironment.js';
import { TransactionManagerFactory } from '#api/core/infrastructure/factories/TransactionManagerFactory.js';
import { getConnection } from '#api/core/infrastructure/mongodb/common/getConnectionForCurrentTenant.js';
import { CaptchaNotFound } from '#api/core/domain/captcha/errors.js';
import { MongoCaptchaDataSource } from '../MongoCaptchaDataSource.js';

const captchaId = new ObjectId();

const createDs = () =>
  new MongoCaptchaDataSource({
    db: getConnection(),
    transactionManager: TransactionManagerFactory.default(),
  });

describe('MongoCaptchaDataSource', () => {
  beforeEach(async () => {
    await testingEnvironment.setUp({
      captchas: [{ _id: captchaId, text: 'k0n2170', createdAt: new Date() }],
    });
  });

  afterAll(async () => testingEnvironment.tearDown());

  describe('create', () => {
    it('should store the text and return the generated id', async () => {
      const ds = createDs();
      const { id } = await ds.create('abcd12');

      const stored = await getConnection()
        .collection('captchas')
        .findOne({ _id: new ObjectId(id) });
      expect(stored?.text).toBe('abcd12');
    });
  });

  describe('findById', () => {
    it('should return the stored record when it exists', async () => {
      const ds = createDs();
      const result = await ds.findById(captchaId.toString());

      expect(result.isOk()).toBe(true);
      expect(result.getData()).toEqual({ id: captchaId.toString(), text: 'k0n2170' });
    });

    it('should fail with CaptchaNotFound when the id does not exist', async () => {
      const ds = createDs();
      const result = await ds.findById(db.id().toString());

      expect(result.isError()).toBe(true);
      expect(result.getError()).toBeInstanceOf(CaptchaNotFound);
    });
  });

  describe('deleteById', () => {
    it('should remove the record', async () => {
      const ds = createDs();
      await ds.deleteById(captchaId.toString());

      const remaining = await getConnection().collection('captchas').findOne({ _id: captchaId });
      expect(remaining).toBeNull();
    });
  });
});
