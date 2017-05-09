import nodemailer from 'nodemailer';
import smtp from 'nodemailer-smtp-transport';

import settings from 'api/settings/settings';

let transporter = nodemailer.createTransport({
  sendmail: true,
  newline: 'unix',
  path: '/usr/sbin/sendmail',
  secure: false,
  tls: {
    rejectUnauthorized: false
  }
});

export default {
  send(mailOptions) {
    return new Promise((resolve, reject) => {
      settings.get()
      .then(config => {
        if (config.mailerConfig && config.mailerConfig.host) {
          transporter = nodemailer.createTransport(smtp({
            host: config.mailerConfig.host,
            port: Number(config.mailerConfig.port),
            secure: true,
            auth: {
              user: config.mailerConfig.user,
              pass: config.mailerConfig.password
            }
          }));
        }

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
