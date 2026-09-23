import {
  InvalidCredentials,
  AccountLocked,
  UsernameExists,
  EmailInUse,
  UserNotFound,
  IsDeleteOfPublicUser,
  IsDeletingSelf,
  IsDeleteOfLastUser,
  UpdateUserError,
} from '../errors.js';
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

  it.each([
    [new UsernameExists('bob'), 'conflict'],
    [new EmailInUse('bob@test.com'), 'conflict'],
    [new UserNotFound('an-id'), 'not_found'],
    [new IsDeleteOfPublicUser(), 'rule_violation'],
    [new IsDeletingSelf(), 'rule_violation'],
    [new IsDeleteOfLastUser(), 'rule_violation'],
    [new UpdateUserError('reason'), 'rule_violation'],
  ])('should categorise %s', (error, category) => {
    expect(error).toBeInstanceOf(DomainError);
    expect(error.category).toBe(category);
  });
});
