import nodemailer from 'nodemailer';
import smtp from 'nodemailer-smtp-transport';

// let transporter = nodemailer.createTransport(smtp({
//   host: 'mail.gandi.net',
//   port: 587,
//   auth: {
//     user: '',
//     pass: ''
//   }
// }));

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
      transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
          console.log('error:', error);
          reject(error);
          return;
        }
        resolve(info);
      });
    });
  }
};
