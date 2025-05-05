export enum IXErrorCode {
  EXTRACTOR_NOT_FOUND = 'extractor_not_found',
  ENTITY_NOT_FOUND = 'entity_not_found',
  FILE_NOT_FOUND = 'file_not_found',
  FILE_IS_NOT_DOCUMENT = 'file_is_not_document',
  INVALID_PROPERTY = 'invalid_property',
  INVALID_SOURCE = 'invalid_source',
  INVALID_NAME = 'invalid_name',
  PROPERTY_NOT_CONFIGURED = 'property_not_configured',
  NO_TEMPLATES_CONFIGURED = 'no_templates_configured',
}

export class IXValidationError extends Error {
  constructor(
    public code: IXErrorCode,
    message: string
  ) {
    super(message);
    this.name = 'IXValidationError';
  }

  static codes = IXErrorCode;
}
