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

class IsDeleteOfPublicUser extends DomainError {
  constructor() {
    super('Cannot delete system users', 'user.delete_system_user');
  }
}

class IsDeletingSelf extends DomainError {
  constructor() {
    super('Users cannot delete themselves', 'user.delete_self');
  }
}

class IsDeleteOfLastUser extends DomainError {
  constructor() {
    super('Cannot delete last remaining user', 'user.last_user');
  }
}

class UserNotFound extends DomainError {
  constructor(id: string) {
    super(`User ${id} not found`, 'user.not_found');
  }
}

class UsersGetError extends DomainError {
  constructor() {
    super('Could not get users', 'user.get');
  }
}

class UpdateUserError extends DomainError {
  constructor(message: string) {
    super(message, 'user.update');
  }
}

export {
  UsernameExists,
  EmailInUse,
  IsDeleteOfPublicUser,
  IsDeletingSelf,
  IsDeleteOfLastUser,
  UserNotFound,
  UsersGetError,
  UpdateUserError,
};
