// @ts-expect-error TS(2307): Cannot find module '../utils/mailer.js' or its cor... Remove this comment to see the full error message
import mailer from '../utils/mailer.js';
// @ts-expect-error TS(2307): Cannot find module '../settings/settings.js' or it... Remove this comment to see the full error message
import settings from 'api/settings/settings.js';
import Mail from 'nodemailer/lib/mailer';
// @ts-expect-error TS(2307): Cannot find module '../utils/testingTenants.js' or... Remove this comment to see the full error message
import { testingTenants } from '../utils/testingTenants.js';
import { SentMessageInfo } from 'nodemailer';
// @ts-expect-error TS(2307): Cannot find module '../utils/fakeMailer.js' or its... Remove this comment to see the full error message
import { FakeMailer } from '../utils/fakeMailer.js';

describe('mailer', () => {
  const ORIGINAL_ENV = process.env;
  beforeEach(() => {
    testingTenants.mockCurrentTenant({ name: 'default' });
    jest
      .spyOn(settings, 'get')
      .mockImplementation(async () => Promise.resolve({ mailerConfig: '{}' }));
    process.env = { ...ORIGINAL_ENV };
  });

  afterAll(() => {
    process.env = ORIGINAL_ENV;
  });

  const mailData = {
    from: 'source@domain.test',
    to: 'target@domain.test',
    subject: 'test mail',
    text: 'this is a test email',
  };
  const mockedSendMail = (
    _mailOptions: Mail.Options,
    callback: (err: Error | null, info: SentMessageInfo) => void
  ) => {
    callback(null, '');
  };

  describe('non test environment', () => {
    it('should use the transport from nodemailer', async () => {
      process.env.DATABASE_NAME = 'uwazi_prod';
      // @ts-ignore
      jest.spyOn(Mail.prototype, 'sendMail').mockImplementation(mockedSendMail);
      await mailer.send(mailData);
      expect(Mail.prototype.sendMail).toHaveBeenCalled();
    });
  });

  describe('non prod environment', () => {
    it('should use a fake transport and mailer', async () => {
      process.env.DATABASE_NAME = 'uwazi_e2e';
      // @ts-expect-error TS(2345): Argument of type '(_mailOptions: Mail.Options, cal... Remove this comment to see the full error message
      jest.spyOn(FakeMailer.prototype, 'sendMail').mockImplementation(mockedSendMail);
      await mailer.send(mailData);
      expect(FakeMailer.prototype.sendMail).toHaveBeenCalled();
    });
  });
});
