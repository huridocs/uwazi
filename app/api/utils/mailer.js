import nodemailer from 'nodemailer';
import smtp from 'nodemailer-smtp-transport';

let transporter = nodemailer.createTransport(smtp({
  host: 'mail.gandi.net',
  port: 587,
  auth: {
    user: '',
    pass: ''
  }
}));

export default {
  send(mailOptions) {
    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        return console.log(error);
      }
      console.log('Email sent', info);
    });
  }
};
