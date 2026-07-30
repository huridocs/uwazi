import { EmailSender } from '#api/core/application/contracts/EmailSender.js';
import { NodemailerEmailSender } from '../services/NodemailerEmailSender.js';
import { FakeEmailSender } from '../services/FakeEmailSender.js';
import { SettingsDataSourceFactory } from './SettingsDataSourceFactory.js';

class EmailSenderFactory {
  static default(): EmailSender {
    if (process.env.DATABASE_NAME === 'uwazi_e2e') {
      return FakeEmailSender;
    }

    return new NodemailerEmailSender(SettingsDataSourceFactory.default());
  }
}

export { EmailSenderFactory };
