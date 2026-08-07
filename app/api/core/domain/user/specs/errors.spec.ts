import { InvalidCredentials, AccountLocked } from '../errors.js';
import { DomainError } from '../../error/DomainError.js';

describe('user errors', () => {
  it('should create InvalidCredentials', () => {
    const error = new InvalidCredentials();

    expect(error).toBeInstanceOf(DomainError);
    expect(error).toBeInstanceOf(InvalidCredentials);
    expect(error.message).toBe('Invalid username or password');
    expect(error.code).toBe('user.invalid_credentials');
  });

  it('should create AccountLocked', () => {
    const error = new AccountLocked();

    expect(error).toBeInstanceOf(DomainError);
    expect(error).toBeInstanceOf(AccountLocked);
    expect(error.message).toBe('Invalid username or password');
    expect(error.code).toBe('user.account_locked');
  });
});
