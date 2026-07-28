import nodemailer from 'nodemailer';
import { EmailSender, EmailMessage } from '#api/core/application/contracts/EmailSender.js';
import { SettingsDataSource } from '#api/core/application/contracts/SettingsDataSource.js';

const DEFAULT_TRANSPORTER_OPTIONS = {
  sendmail: true,
  newline: 'unix',
  path: '/usr/sbin/sendmail',
  secure: false,
  tls: {
    rejectUnauthorized: false,
  },
};

class NodemailerEmailSender implements EmailSender {
  constructor(private settingsDS: SettingsDataSource) {}

  async send(message: EmailMessage): Promise<void> {
    const settings = await this.settingsDS.get();

    const transporterOptions = settings.mailerConfig ?? DEFAULT_TRANSPORTER_OPTIONS;
    const transporter = nodemailer.createTransport(transporterOptions as any);

    const senderEmail =
      settings.senderEmail !== undefined ? settings.senderEmail : 'no-reply@uwazi.io';
    const siteName = settings.site_name !== undefined ? settings.site_name : 'Uwazi';
    const from = `"${siteName}" <${senderEmail}>`;

    await new Promise<void>((resolve, reject) => {
      transporter.sendMail({ ...message, from }, (error: Error | null) => {
        if (error) {
          reject(error);
          return;
        }
        resolve();
      });
    });
  }
}

export { NodemailerEmailSender };
