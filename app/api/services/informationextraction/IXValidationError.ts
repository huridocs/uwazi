export enum IXErrorCode {
  TEMPLATE_MISSING = 'TEMPLATE_MISSING',
  TEMPLATES_REQUIRED = 'TEMPLATES_REQUIRED',
  PROPERTY_MISSING = 'PROPERTY_MISSING',
  PROPERTY_TYPE_NOT_ALLOWED = 'PROPERTY_TYPE_NOT_ALLOWED',
  SOURCE_REQUIRED = 'SOURCE_REQUIRED',
}

export class IXValidationError extends Error {
  static codes = IXErrorCode;

  static name = 'IXValidationError';

  constructor(
    public code: IXErrorCode,
    message: string,
    options?: ErrorOptions
  ) {
    super(message, options);
    this.name = IXValidationError.name;
  }
}
