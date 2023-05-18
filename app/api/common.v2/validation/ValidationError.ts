interface ErrorObject {
  path: string;
  message: string;
}

export class ValidationError extends Error {
  errors: ErrorObject[];

  constructor(errors: ErrorObject[]) {
    super('Validation error');
    this.errors = errors;
    this.message += `${this.errors.map(error => `\n${JSON.stringify(error)}`)}`;
  }
}
