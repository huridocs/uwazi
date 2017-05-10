import nodemailer from 'nodemailer';
import mailerConfig from 'api/config/mailer';

import settings from 'api/settings/settings';

let transporterOptions = {
  sendmail: true,
  newline: 'unix',
  path: '/usr/sbin/sendmail',
  secure: false,
  tls: {
    rejectUnauthorized: false
  }
};

if (Object.keys(mailerConfig).length) {
  transporterOptions = nodemailer.createTransport(mailerConfig);
}

let transporter = nodemailer.createTransport(transporterOptions);


export default {
  send(mailOptions) {
    return new Promise((resolve, reject) => {
      settings.get()
      .then(config => {
        if (config.mailerConfig) {
          try {
            transporterOptions = JSON.parse(config.mailerConfig);
            transporter = nodemailer.createTransport(transporterOptions);
          } catch (err) {
            reject(err);
          }
        }

        console.log('Options:', transporterOptions);

        transporter.sendMail(mailOptions, (error, info) => {
          if (error) {
            reject(error);
            return;
          }
          resolve(info);
        });
      })
      .catch(reject);
    });
  }
};
