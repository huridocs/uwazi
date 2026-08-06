import { ObjectId } from 'mongodb';
import db from '#api/utils/testing_db.js';
import { testingEnvironment } from '#api/utils/testingEnvironment.js';
import { getConnection } from '#api/core/infrastructure/mongodb/common/getConnectionForCurrentTenant.js';
import { TransactionManagerFactory } from '#api/core/infrastructure/factories/TransactionManagerFactory.js';
import { CaptchaInvalid } from '#api/core/domain/captcha/errors.js';
import { MongoCaptchaDataSource } from '#api/core/infrastructure/mongodb/captcha/MongoCaptchaDataSource.js';
import { VerifyCaptcha } from '../VerifyCaptcha.js';

describe('VerifyCaptcha', () => {
  const captchaId = new ObjectId();

  const createUseCase = () =>
    new VerifyCaptcha({
      captchaDS: new MongoCaptchaDataSource({
        db: getConnection(),
        transactionManager: TransactionManagerFactory.default(),
      }),
    });

  beforeEach(async () => {
    await testingEnvironment.setUp({
      captchas: [{ _id: captchaId, text: 'k0n2170', createdAt: new Date() }],
    });
  });

  afterAll(async () => testingEnvironment.tearDown());

  it('should resolve when the captcha matches', async () => {
    await expect(
      createUseCase().execute({ id: captchaId.toString(), text: 'k0n2170' })
    ).resolves.toBeUndefined();
  });

  it('should throw CaptchaInvalid when the text does not match', async () => {
    await expect(
      createUseCase().execute({ id: captchaId.toString(), text: 'wrong' })
    ).rejects.toThrow(CaptchaInvalid);
  });

  it('should throw CaptchaInvalid when the id does not exist', async () => {
    await expect(
      createUseCase().execute({ id: db.id().toString(), text: 'k0n2170' })
    ).rejects.toThrow(CaptchaInvalid);
  });
});
