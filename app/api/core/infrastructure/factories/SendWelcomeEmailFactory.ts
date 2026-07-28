import { SendWelcomeEmail } from '#api/core/application/SendWelcomeEmail.js';
import { ExecutionContext } from '#api/core/libs/ExecutionContext.js';
import { EmailSenderFactory } from './EmailSenderFactory.js';
import { PasswordRecoveriesDataSourceFactory } from './PasswordRecoveriesDataSourceFactory.js';
import { UsersDataSourceFactory } from './UsersDataSourceFactory.js';
import { SettingsDataSourceFactory } from './SettingsDataSourceFactory.js';

class SendWelcomeEmailFactory {
  static default() {
    return new SendWelcomeEmail(
      {
        usersDS: UsersDataSourceFactory.default(),
        emailSender: EmailSenderFactory.default(),
        passwordRecoveriesDS: PasswordRecoveriesDataSourceFactory.default(),
        settingsDS: SettingsDataSourceFactory.default(),
        transactionManager: ExecutionContext.transactionManager,
      },
      { tenant: ExecutionContext.tenant }
    );
  }
}

export { SendWelcomeEmailFactory };
