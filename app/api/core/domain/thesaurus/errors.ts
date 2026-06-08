/* eslint-disable max-classes-per-file */
import { DomainError } from '../error/DomainError.js';
import { AJVObject, ValidationError } from '../error/ValidationError.js';

export class ThesaurusNotFoundError extends DomainError {
  constructor(thesaurusId: string) {
    super(
      `The Thesaurus with Id "${thesaurusId}" was not found`,
      'thesaurus.thesaurus_not_found_error'
    );
  }
}

export class ThesaurusNameAlreadyExistsError extends ValidationError {
  constructor(name: string) {
    super(
      `A thesaurus with name "${name}" already exists`,
      'thesaurus.thesaurus_with_name_duplicated_error'
    );
  }

  asAJV(): AJVObject {
    return {
      message: this.message,
      keyword: 'thesaurus.thesaurus_with_name_duplicated_error',
      instancePath: '',
    };
  }
}

export class ThesaurusInUseError extends DomainError {
  constructor(templateCount: number) {
    super(
      `Cannot delete thesaurus with ${templateCount} associated templates. Please remove the related templates first.`,
      'thesaurus.in_use'
    );
  }
}

export class InvalidThesaurusValueIdsError extends ValidationError {
  readonly invalidIds: string[];

  constructor(invalidIds: string[]) {
    const message =
      invalidIds.length === 1
        ? `Value ID "${invalidIds[0]}" does not exist in the current thesaurus. Cannot update thesaurus with IDs that don't exist.`
        : `Value IDs [${invalidIds.map(id => `"${id}"`).join(', ')}] do not exist in the current thesaurus. Cannot update thesaurus with IDs that don't exist.`;

    super(message, 'thesaurus.invalid_value_ids_error');

    this.invalidIds = invalidIds;
  }

  asAJV(): AJVObject {
    return {
      message: this.message,
      keyword: 'thesaurus.invalid_value_ids_error',
      instancePath: '',
    };
  }
}
