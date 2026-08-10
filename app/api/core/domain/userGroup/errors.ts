import { DomainError } from '../error/DomainError.js';

class UserGroupNameExists extends DomainError {
  constructor(name: string) {
    super(`The group name "${name}" already exists`, 'usergroup.duplicated_name');
  }
}

export { UserGroupNameExists };
