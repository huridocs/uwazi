import mailer from '#api/utils/mailer.js';
import { SettingsDataSourceFactory } from '#api/core/infrastructure/factories/SettingsDataSourceFactory.js';

export default {
  async sendMessage({ email, name, message }) {
    const siteSettings =
      (await SettingsDataSourceFactory.default().readFields([
        'contactEmail',
        'senderEmail',
        'site_name',
      ])) ?? {};
    const emailSender = mailer.createSenderDetails(siteSettings);
    const mailOptions = {
      from: emailSender,
      to: siteSettings.contactEmail,
      subject: `Contact mesage from ${name} ${email}`,
      text: message,
    };

    return mailer.send(mailOptions);
  },
};
