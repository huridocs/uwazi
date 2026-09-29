/* eslint-disable max-classes-per-file */
import { DomainError } from '../error/DomainError.js';

export class LanguageNotFoundError extends DomainError {
  constructor(key: string) {
    super(`Language not found: ${key}`, 'settings.language_not_found');
  }
}

export class CannotDeleteDefaultLanguageError extends DomainError {
  constructor() {
    super('Cannot delete the default language.', 'settings.cannot_delete_default_language');
  }
}

export class DefaultLanguageMissingError extends DomainError {
  constructor() {
    super('Default language needs to be defined.', 'settings.default_language_missing');
  }
}
