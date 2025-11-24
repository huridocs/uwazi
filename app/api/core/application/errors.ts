/* eslint-disable max-classes-per-file */
import { DomainError } from 'api/core/domain/error/DomainError';
import { AJVObject, ValidationError } from '../domain/error/ValidationError';

export class ThesaurusValueNotFoundError extends DomainError {
  constructor(value: string, thesaurusName: string) {
    super(
      `The value "${value}" does not exist in the referenced Thesaurus "${thesaurusName}"`,
      'application.property_assignment_creator.thesaurus_value_not_found_error'
    );
  }
}

export class IncorrectPropertyTypeError extends DomainError {
  constructor(actualType: string, serviceName: string) {
    super(
      `The following type is incorrect for ${serviceName}. Type = ${actualType}`,
      'application.property_creator.incorrect_property_type_error'
    );
  }
}

export class EntityNotFoundError extends ValidationError {
  constructor(sharedId: string) {
    super(`Entity not found: [sharedId=${sharedId}]`, 'entity.entity_not_found');
  }

  asAJV(): AJVObject {
    return {
      message: this.message,
      keyword: 'notFound',
    };
  }
}
