import { ObjectId } from 'mongodb';
import { testingEnvironment } from '#api/utils/testingEnvironment.js';
import { getConnection } from '#api/core/infrastructure/mongodb/common/getConnectionForCurrentTenant.js';
import { TransactionManagerFactory } from '#api/core/infrastructure/factories/TransactionManagerFactory.js';
import { MongoCaptchaDataSource } from '#api/core/infrastructure/mongodb/captcha/MongoCaptchaDataSource.js';
import { GenerateCaptcha } from '../GenerateCaptcha.js';

describe('GenerateCaptcha', () => {
  beforeEach(async () => {
    await testingEnvironment.setUp({});
  });

  afterAll(async () => testingEnvironment.tearDown());

  it('should return a captcha svg and store its text under the returned id', async () => {
    const useCase = new GenerateCaptcha({
      captchaDS: new MongoCaptchaDataSource({
        db: getConnection(),
        transactionManager: TransactionManagerFactory.default(),
      }),
    });

    const { svg, id } = await useCase.execute();

    expect(svg).toContain('<svg');
    const stored = await getConnection()
      .collection('captchas')
      .findOne({ _id: new ObjectId(id) });
    expect(stored?.text).toHaveLength(4);
  });
});
