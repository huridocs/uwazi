import { DomainError } from '#api/core/domain/error/DomainError.js';

export class PageNotFoundError extends DomainError {
  constructor(sharedId: string) {
    super(`Page with sharedId "${sharedId}" was not found`, 'page.page_not_found');
  }
}

export class PageReleaseNotFoundError extends DomainError {
  constructor(pageId: string, version: number) {
    super(
      `Release version ${version} for page "${pageId}" was not found`,
      'page.release_not_found'
    );
  }
}

export class InvalidPageReleaseError extends DomainError {
  constructor(message: string) {
    super(message, 'page.invalid_release');
  }
}

export class PageLocaleNotFoundError extends DomainError {
  constructor(language: string) {
    super(`Locale "${language}" was not found on this page`, 'page.locale_not_found');
  }
}

export class CannotRemoveLastLocaleError extends DomainError {
  constructor() {
    super('Cannot remove the last locale from a page', 'page.cannot_remove_last_locale');
  }
}

export class UnknownPageLanguageKeysError extends DomainError {
  constructor(keys: string[]) {
    super(`Unknown language keys: ${keys.join(', ')}`, 'page.unknown_language_keys');
  }
}

export class PageUnauthorizedError extends DomainError {
  constructor() {
    super('Unauthorized', 'page.unauthorized');
  }
}
