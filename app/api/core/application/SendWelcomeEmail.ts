import crypto from 'crypto';
import { AbstractUseCase } from '../libs/UseCase.js';
import { EmailSender } from './contracts/EmailSender.js';
import { PasswordRecoveriesDataSource } from './contracts/PasswordRecoveriesDataSource.js';
import { UsersDataSource } from './contracts/UsersDataSource.js';
import { SettingsDataSource } from './contracts/SettingsDataSource.js';
import { welcomeEmail } from '../domain/email/templates/welcomeEmail.js';

type SendWelcomeEmailInput = {
  userId: string;
  domain: string;
};

type Deps = {
  usersDS: UsersDataSource;
  emailSender: EmailSender;
  passwordRecoveriesDS: PasswordRecoveriesDataSource;
  settingsDS: SettingsDataSource;
};

class SendWelcomeEmail extends AbstractUseCase<SendWelcomeEmailInput, void, Deps> {
  async execute(input: SendWelcomeEmailInput): Promise<void> {
    const user = (await this.deps.usersDS.getById(input.userId)).getDataOrThrow();
    const settings = await this.deps.settingsDS.get();

    const key = crypto.randomBytes(32).toString('hex');

    await this.transactionManager.run(async () => {
      await this.deps.passwordRecoveriesDS.create({ userId: input.userId, key });

      const message = welcomeEmail({
        to: user.email,
        username: user.username,
        domain: input.domain,
        key,
        siteName: settings.site_name,
      });

      await this.deps.emailSender.send(message);
    });
  }
}

export { SendWelcomeEmail };
export type { SendWelcomeEmailInput };
