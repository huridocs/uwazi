export enum IXErrorCode {
  TEMPLATE_MISSING = 'TEMPLATE_MISSING',
  PROPERTY_MISSING = 'PROPERTY_MISSING',
  PROPERTY_TYPE_NOT_ALLOWED = 'PROPERTY_TYPE_NOT_ALLOWED',
}

export class IXValidationError extends Error {
  static codes = IXErrorCode;

  // @ts-expect-error TS(2699): Static property 'name' conflicts with built-in pro... Remove this comment to see the full error message
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
