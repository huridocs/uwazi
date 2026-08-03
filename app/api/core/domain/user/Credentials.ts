import { EncryptedPassword } from './EncryptedPassword.js';

const MAX_FAILED_LOGIN_ATTEMPTS = 6;

type CredentialsProps = {
  password: EncryptedPassword;
  failedLogins?: number;
  accountLocked?: boolean;
  accountUnlockCode?: string;
  using2fa?: boolean;
  secret?: string | null;
};

class Credentials {
  readonly password: EncryptedPassword;

  readonly failedLogins: number;

  readonly accountLocked: boolean;

  readonly accountUnlockCode?: string;

  readonly using2fa: boolean;

  readonly secret?: string | null;

  constructor(props: CredentialsProps) {
    this.password = props.password;
    this.failedLogins = props.failedLogins ?? 0;
    this.accountLocked = props.accountLocked ?? false;
    this.accountUnlockCode = props.accountUnlockCode;
    this.using2fa = props.using2fa ?? false;
    this.secret = props.secret;
  }

  private clone(overrides: Partial<CredentialsProps>): Credentials {
    return new Credentials({
      password: this.password,
      failedLogins: this.failedLogins,
      accountLocked: this.accountLocked,
      accountUnlockCode: this.accountUnlockCode,
      using2fa: this.using2fa,
      secret: this.secret,
      ...overrides,
    });
  }

  withIncrementedFailedLogins(): Credentials {
    const failedLogins = this.failedLogins + 1;
    return this.clone({ failedLogins });
  }

  withLock(unlockCode: string): Credentials {
    return this.clone({ accountLocked: true, accountUnlockCode: unlockCode });
  }

  withClearedLockout(): Credentials {
    return this.clone({ failedLogins: 0, accountLocked: false, accountUnlockCode: undefined });
  }

  isLocked(): boolean {
    return this.accountLocked;
  }

  shouldLock(): boolean {
    return this.failedLogins >= MAX_FAILED_LOGIN_ATTEMPTS;
  }

  requiresTwoFactor(): boolean {
    return this.using2fa;
  }
}

export { Credentials, MAX_FAILED_LOGIN_ATTEMPTS };
