interface ErrorObject {
  path: string;
  message: string;
}

export class ValidationError extends Error {
  errors: ErrorObject[];

  constructor(errors: ErrorObject[]) {
    super('Validation error');
    this.errors = errors;
  }

  static merge(instances: ValidationError[]) {
    return new ValidationError(
      instances.reduce<ErrorObject[]>((errors, instance) => errors.concat(instance.errors), [])
    );
  }
}

export function mapAjvToAppValidation<T>(validator: (data: T) => Promise<any>) {
  return async (data: T) =>
    validator(data).catch(
      error =>
        new ValidationError(
          error.errors.map((errorObject: { instancePath: string; message: string }) => ({
            path: errorObject.instancePath,
            message: errorObject.message,
          }))
        )
    );
}
