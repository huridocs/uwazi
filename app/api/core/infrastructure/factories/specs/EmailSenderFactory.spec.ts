import { testingEnvironment } from '#api/utils/testingEnvironment.js';
import { DBFixture } from '#api/utils/testing_db.js';
import { NodemailerEmailSender } from '../../services/NodemailerEmailSender.js';
import { FakeEmailSender } from '../../services/FakeEmailSender.js';
import { EmailSenderFactory } from '../EmailSenderFactory.js';

const fixtures: DBFixture = {
  settings: [{}],
};

const createSut = () => testingEnvironment.runWithContext(() => EmailSenderFactory.default());

describe('EmailSenderFactory', () => {
  const ORIGINAL_ENV = process.env;

  beforeEach(async () => {
    await testingEnvironment.setUp(fixtures);
    process.env = { ...ORIGINAL_ENV };
  });

  afterAll(async () => {
    await testingEnvironment.tearDown();
  });

  afterEach(() => {
    process.env = ORIGINAL_ENV;
  });

  it('should return the FakeEmailSender in the e2e test environment', () => {
    process.env.DATABASE_NAME = 'uwazi_e2e';

    const sender = createSut();

    expect(sender).toBe(FakeEmailSender);
  });

  it('should return a NodemailerEmailSender otherwise', () => {
    process.env.DATABASE_NAME = 'uwazi_prod';

    const sender = createSut();

    expect(sender).toBeInstanceOf(NodemailerEmailSender);
  });
});
