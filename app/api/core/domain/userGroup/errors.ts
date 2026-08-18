/* eslint-disable max-classes-per-file */
import { DomainError } from '../error/DomainError.js';

class UserGroupNameExists extends DomainError {
  constructor(name: string) {
    super(`The group name "${name}" already exists`, 'usergroup.duplicated_name');
  }
}

class DuplicateMemberIds extends DomainError {
  constructor(memberIds: string[]) {
    super(`Duplicate member ids: ${memberIds.join(', ')}`, 'usergroup.duplicate_member_ids');
  }
}

class UserGroupNotFound extends DomainError {
  constructor(id: string) {
    super(`User group "${id}" not found`, 'usergroup.not_found');
  }
}

export { UserGroupNameExists, DuplicateMemberIds, UserGroupNotFound };
