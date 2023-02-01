import mailer from 'api/utils/mailer';
import settings from 'api/settings/settings';
import Mail from 'nodemailer/lib/mailer';
import { testingTenants } from 'api/utils/testingTenants';
import { SentMessageInfo } from 'nodemailer';
import { FakeMailer } from 'api/utils/fakeMailer';

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
      jest.spyOn(FakeMailer.prototype, 'sendMail').mockImplementation(mockedSendMail);
      await mailer.send(mailData);
      expect(FakeMailer.prototype.sendMail).toHaveBeenCalled();
    });
  });
});
