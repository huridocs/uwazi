/* eslint-disable max-classes-per-file */
import { DomainError } from '#api/core/domain/error/DomainError.js';
import { AJVObject, ValidationError } from '#api/core/domain/error/ValidationError.js';

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

export class InsufficientPermissionsToPublishError extends DomainError {
  constructor() {
    super(
      'Insufficient permissions to change the published status of this entity',
      'entity_access_policy.insufficient_permissions_to_publish'
    );
  }
}

export class UnknownTranslationLanguageError extends ValidationError {
  constructor(readonly language: string) {
    super(
      `Translation language "${language}" is not installed.`,
      'entity.translations.unknown_language_error'
    );
  }

  asAJV(): AJVObject {
    return { message: this.message, keyword: 'unknownTranslationLanguage' };
  }
}

export class TargetLanguageInTranslationsError extends ValidationError {
  constructor(readonly language: string) {
    super(
      `Translations cannot include "${language}": it is the target language of the request.`,
      'entity.translations.target_language_error'
    );
  }

  asAJV(): AJVObject {
    return { message: this.message, keyword: 'targetLanguageInTranslations' };
  }
}

export class MissingTranslationLanguageError extends ValidationError {
  constructor(readonly language: string) {
    super(
      `Translations are missing the installed language "${language}".`,
      'entity.translations.missing_language_error'
    );
  }

  asAJV(): AJVObject {
    return { message: this.message, keyword: 'missingTranslationLanguage' };
  }
}
