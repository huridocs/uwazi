export class ValidationError extends Error {
  code: string;

  constructor(message: string, code: string, name?: string, options?: ErrorOptions) {
    super(message, options);
    this.name = name || 'ValidationError';
    this.code = code;
  }
}
