/* eslint-disable max-classes-per-file */
import { DomainError } from '../error/DomainError.js';

class UsernameExists extends DomainError {
  constructor(username: string) {
    super(`The username "${username}" already exists`, 'user.duplicated_user');
  }
}

class EmailInUse extends DomainError {
  constructor(email: string) {
    super(`The email "${email}" already exists`, 'user.duplicated_email');
  }
}

export { UsernameExists, EmailInUse };
