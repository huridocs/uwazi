import nodemailer from 'nodemailer';
import sendmailTransport from 'nodemailer-sendmail-transport';

let transporter = nodemailer.createTransport(sendmailTransport());

export default {
  send(mailOptions) {
    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        return console.log(error);
      }
      console.log('Email sent', info);
    });
  }
}
