/* eslint-disable max-classes-per-file */
import { DomainError } from '../error/DomainError';
import { AJVObject, ValidationError } from '../error/ValidationError';

export class ThesaurusNotFoundError extends DomainError {
  constructor(thesaurusId: string) {
    super(
      `The Thesaurus with Id "${thesaurusId}" was not found`,
      'thesaurus.thesaurus_not_found_error'
    );
  }
}

export class ThesaurusWithNameDuplicated extends ValidationError {
  constructor(name: string) {
    super(
      `The Thesaurus with name "${name}" is duplicated`,
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
