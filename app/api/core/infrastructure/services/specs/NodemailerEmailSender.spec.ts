import Mail from 'nodemailer/lib/mailer';
import nodemailer, { SentMessageInfo } from 'nodemailer';
import { SettingsDataSource } from '#api/core/application/contracts/SettingsDataSource.js';
import { EmailMessage } from '#api/core/application/contracts/EmailSender.js';
import { NodemailerEmailSender } from '../NodemailerEmailSender.js';

const message: EmailMessage = {
  to: 'target@domain.test',
  subject: 'test mail',
  text: 'this is a test email',
};

const fakeSettingsDS = (settings: Partial<Awaited<ReturnType<SettingsDataSource['get']>>> = {}) =>
  ({
    get: jest.fn().mockResolvedValue(settings),
  }) as unknown as SettingsDataSource;

const mockedSendMail = (
  _mailOptions: Mail.Options,
  callback: (err: Error | null, info: SentMessageInfo) => void
) => {
  callback(null, '');
};

describe('NodemailerEmailSender', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should send via the default sendmail transport when no tenant override is configured', async () => {
    jest.spyOn(Mail.prototype, 'sendMail').mockImplementation(mockedSendMail as any);
    const sender = new NodemailerEmailSender(fakeSettingsDS());
    const createTransportSpy = jest.spyOn(nodemailer, 'createTransport');

    await sender.send(message);

    expect(createTransportSpy).toHaveBeenCalledWith({
      newline: 'unix',
      path: '/usr/sbin/sendmail',
      secure: false,
      sendmail: true,
      tls: { rejectUnauthorized: false },
    });

    expect(Mail.prototype.sendMail).toHaveBeenCalledWith(
      expect.objectContaining({ to: message.to, subject: message.subject }),
      expect.any(Function)
    );
  });

  it('should use the tenant mailerConfig connection string when present', async () => {
    jest.spyOn(Mail.prototype, 'sendMail').mockImplementation(mockedSendMail as any);
    const sender = new NodemailerEmailSender(
      fakeSettingsDS({ mailerConfig: 'smtp://user:password@smtp.example.com' })
    );

    await sender.send(message);

    expect(Mail.prototype.sendMail).toHaveBeenCalled();
  });

  it('should compose from using senderEmail/site_name when set', async () => {
    let sentOptions: Mail.Options | undefined;
    jest.spyOn(Mail.prototype, 'sendMail').mockImplementation(((
      mailOptions: Mail.Options,
      callback: (err: Error | null, info: SentMessageInfo) => void
    ) => {
      sentOptions = mailOptions;
      callback(null, '');
    }) as any);
    const sender = new NodemailerEmailSender(
      fakeSettingsDS({ senderEmail: 'hello@test.com', site_name: 'TestSite' })
    );

    await sender.send(message);

    expect(sentOptions?.from).toBe('"TestSite" <hello@test.com>');
  });

  it('should fall back to default from when senderEmail/site_name are not set', async () => {
    let sentOptions: Mail.Options | undefined;
    jest.spyOn(Mail.prototype, 'sendMail').mockImplementation(((
      mailOptions: Mail.Options,
      callback: (err: Error | null, info: SentMessageInfo) => void
    ) => {
      sentOptions = mailOptions;
      callback(null, '');
    }) as any);
    const sender = new NodemailerEmailSender(fakeSettingsDS());

    await sender.send(message);

    expect(sentOptions?.from).toBe('"Uwazi" <no-reply@uwazi.io>');
  });

  it('should reuse the transporter across instances when config is unchanged', async () => {
    jest.spyOn(Mail.prototype, 'sendMail').mockImplementation(mockedSendMail as any);
    const createTransportSpy = jest.spyOn(nodemailer, 'createTransport');
    const uniqueConfig = 'smtp://unique:test@caching-test.example.com';

    const sender1 = new NodemailerEmailSender(fakeSettingsDS({ mailerConfig: uniqueConfig }));
    const sender2 = new NodemailerEmailSender(fakeSettingsDS({ mailerConfig: uniqueConfig }));

    await sender1.send(message);
    await sender2.send(message);

    expect(createTransportSpy).toHaveBeenCalledTimes(1);
  });

  it('should reject when the transporter callback receives an error', async () => {
    jest.spyOn(Mail.prototype, 'sendMail').mockImplementation(((
      _mailOptions: Mail.Options,
      callback: (err: Error | null, info: SentMessageInfo) => void
    ) => {
      callback(new Error('smtp exploded'), null);
    }) as any);
    const sender = new NodemailerEmailSender(fakeSettingsDS());

    await expect(sender.send(message)).rejects.toThrow('smtp exploded');
  });
});
