import mailerConfig from '#api/config/mailer.js';
import { SettingsDataSourceFactory } from '#api/core/infrastructure/factories/SettingsDataSourceFactory.js';
import { getMailerTransport } from '#api/utils/mailerTransport.js';

let transporterOptions = {
  sendmail: true,
  newline: 'unix',
  path: '/usr/sbin/sendmail',
  secure: false,
  tls: {
    rejectUnauthorized: false,
  },
};

if (Object.keys(mailerConfig).length) {
  transporterOptions = mailerConfig;
}

// eslint-disable-next-line import/no-default-export
export default {
  async send(mailOptions) {
    const mailerConfigValue = await SettingsDataSourceFactory.default().readMailerConfig();
    const transporter = getMailerTransport().createTransport(
      mailerConfigValue ? JSON.parse(mailerConfigValue) : transporterOptions
    );
    await transporter.sendMail(mailOptions);
  },
  createSenderDetails(settingsDetails) {
    const senderEmail =
      settingsDetails.senderEmail !== undefined ? settingsDetails.senderEmail : 'no-reply@uwazi.io';
    const siteName = settingsDetails.site_name !== undefined ? settingsDetails.site_name : 'Uwazi';
    return `"${siteName}" <${senderEmail}>`;
  },
};
