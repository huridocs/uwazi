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
  send(mailOptions) {
    let transporter;
    return new Promise((resolve, reject) => {
      SettingsDataSourceFactory.default()
        .readFields(['mailerConfig'])
        .then(config => {
          try {
            transporter = getMailerTransport().createTransport(
              config?.mailerConfig ? JSON.parse(config.mailerConfig) : transporterOptions
            );
            transporter.sendMail(mailOptions, (error, info) => {
              if (error) {
                reject(error);
                return;
              }
              resolve(info);
            });
          } catch (err) {
            reject(err);
          }
        })
        .catch(reject);
    });
  },
  createSenderDetails(settingsDetails) {
    const senderEmail =
      settingsDetails.senderEmail !== undefined ? settingsDetails.senderEmail : 'no-reply@uwazi.io';
    const siteName = settingsDetails.site_name !== undefined ? settingsDetails.site_name : 'Uwazi';
    return `"${siteName}" <${senderEmail}>`;
  },
};
