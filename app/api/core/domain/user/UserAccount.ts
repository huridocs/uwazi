import { User, UserProps } from './User.js';
import { EncryptedPassword } from './EncryptedPassword.js';
import { Credentials } from './Credentials.js';

type UserAccountProps = UserProps & { credentials: Credentials };

/**
 * A User loaded together with its security state (password hash, lockout, 2FA). Repository
 * methods that hydrate credentials return this type instead of the plain User so that access to
 * `credentials` — and the mutations below — is only possible where it was explicitly requested.
 */
class UserAccount extends User {
  credentials: Credentials;

  constructor(props: UserAccountProps) {
    super(props);
    this.credentials = props.credentials;
  }

  setPassword(password: EncryptedPassword): void {
    this.credentials = this.credentials.withPassword(password);
  }

  incrementFailedLogins(): void {
    this.credentials = this.credentials.withIncrementedFailedLogins();
  }

  lock(unlockCode: string): void {
    this.credentials = this.credentials.withLock(unlockCode);
  }

  clearLockout(): void {
    this.credentials = this.credentials.withClearedLockout();
  }
}

export { UserAccount };
export type { UserAccountProps };
