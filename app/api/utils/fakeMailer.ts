import Mail from 'nodemailer/lib/mailer';
import { SentMessageInfo } from 'nodemailer';

const sentMessage: SentMessageInfo = {
  envelope: { from: false, to: [] },
  messageId: '<fake@uwazi.test>',
};

export class FakeMailer {
  // eslint-disable-next-line class-methods-use-this
  async sendMail(_mailOptions: Mail.Options): Promise<SentMessageInfo> {
    console.log('Fake sent of mail with:', _mailOptions);
    return sentMessage;
  }
}

export default {
  createTransport: (_transporter: string, _defaults: {}) => new FakeMailer(),
};
