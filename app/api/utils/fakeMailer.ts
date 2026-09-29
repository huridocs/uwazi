import Mail from 'nodemailer/lib/mailer';
import { SentMessageInfo } from 'nodemailer';

const sentMessage: SentMessageInfo = {
  envelope: { from: false, to: [] },
  messageId: '<fake@uwazi.test>',
};

export class FakeMailer {
  // eslint-disable-next-line class-methods-use-this
  sendMail(
    _mailOptions: Mail.Options,
    callback: (err: Error | null, info: SentMessageInfo) => void
  ) {
    console.log('Fake sent of mail with:', _mailOptions);
    callback(null, sentMessage);
  }
}

export default {
  createTransport: (_transporter: string, _defaults: {}) => new FakeMailer(),
};
