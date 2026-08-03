import * as otplib from 'otplib';
import { AbstractUseCase } from '../libs/UseCase.js';
import { UsersDataSource } from './contracts/UsersDataSource.js';
import { SettingsDataSource } from './contracts/SettingsDataSource.js';
import { TwoFactorAlreadyEnabled } from '../domain/user/errors.js';

type Output = { secret: string; otpauth: string };

type Deps = { usersDS: UsersDataSource; settingsDS: SettingsDataSource };

const conformSiteName = (siteName: string): string =>
  siteName.length > 30 ? `${siteName.substring(0, 30)}...` : siteName;

class GenerateTwoFactorSecret extends AbstractUseCase<void, Output, Deps> {
  async execute(): Promise<Output> {
    const status = (await this.deps.usersDS.getTwoFactorStatus(this.actorId)).getDataOrThrow();

    if (status.using2fa) {
      throw new TwoFactorAlreadyEnabled();
    }

    const { site_name: siteName = '' } = await this.deps.settingsDS.get();
    const secret = otplib.authenticator.generateSecret();
    const otpauth = otplib.authenticator.keyuri(status.username, conformSiteName(siteName), secret);

    await this.deps.usersDS.setTwoFactorSecret(this.actorId, secret);

    return { secret, otpauth };
  }
}

export { GenerateTwoFactorSecret };
export type { Deps as GenerateTwoFactorSecretDependencies };
