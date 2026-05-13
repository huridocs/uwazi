/* eslint-disable max-classes-per-file */
import { DomainError } from '../error/DomainError.js';

export class DuplicateGrantError extends DomainError {
  constructor() {
    super('Access grants must be unique per refId', 'entity_access_policy.duplicate_grant_error');
  }
}

export class EntityAccessPolicyNotFoundError extends DomainError {
  constructor(sharedId: string) {
    super(
      `EntityAccessPolicy for sharedId '${sharedId}' does not exist.`,
      'entity_access_policy.not_found_error'
    );
  }
}
