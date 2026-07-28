import { EmailSender, EmailMessage } from '#api/core/application/contracts/EmailSender.js';

const FakeEmailSender: EmailSender = {
  async send(message: EmailMessage): Promise<void> {
    console.log('Fake sent of mail with:', message);
  },
};

export { FakeEmailSender };
