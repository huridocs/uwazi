import nodemailer from 'nodemailer';
import mailerConfig from 'api/config/mailer';
import settings from 'api/settings/settings';

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

export default {
  send(mailOptions) {
    let transporter;
    return new Promise((resolve, reject) => {
      settings
        .get()
        .then(config => {
          try {
            transporter = nodemailer.createTransport(
              config.mailerConfig ? JSON.parse(config.mailerConfig) : transporterOptions
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
    return {
      senderEmail:
        settingsDetails.senderEmail !== undefined
          ? settingsDetails.senderEmail
          : 'no-reply@uwazi.io',
      siteName: settingsDetails.site_name !== undefined ? settingsDetails.site_name : 'Uwazi',
    };
  },
};
