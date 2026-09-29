import { DomainError } from '#api/core/domain/error/DomainError.js';

export class InvalidTranslationResponseError extends DomainError {
  constructor() {
    super(
      'Translation service did not return translated_text',
      'translationService.invalid_response'
    );
  }
}

export class TranslationServiceRequestError extends DomainError {
  constructor(cause?: Error) {
    const detail = cause?.message ? `: ${cause.message}` : '';
    super(
      `Translation service request failed${detail}`,
      'translationService.request_failed',
      cause
    );
  }
}
