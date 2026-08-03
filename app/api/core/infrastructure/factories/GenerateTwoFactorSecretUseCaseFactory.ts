import {
  GenerateTwoFactorSecret,
  GenerateTwoFactorSecretDependencies,
} from '#api/core/application/GenerateTwoFactorSecret.js';
import { ExecutionContext } from '#api/core/libs/ExecutionContext.js';
import { UsersDataSourceFactory } from './UsersDataSourceFactory.js';
import { SettingsDataSourceFactory } from './SettingsDataSourceFactory.js';

export class GenerateTwoFactorSecretUseCaseFactory {
  static default(overrides?: Partial<GenerateTwoFactorSecretDependencies>) {
    const { actor, tenant } = ExecutionContext;
    return new GenerateTwoFactorSecret(
      {
        usersDS: UsersDataSourceFactory.default(),
        settingsDS: SettingsDataSourceFactory.default(),
        ...overrides,
      },
      { actor, tenant }
    );
  }
}
