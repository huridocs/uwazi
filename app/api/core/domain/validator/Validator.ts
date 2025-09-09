interface ValidationStep<T> {
  validate(object: T): void;
}

class Validator<T> {
  private readonly validationSteps: ValidationStep<T>[] = [];

  constructor(validationSteps: ValidationStep<T>[]) {
    this.validationSteps = validationSteps;
  }

  public validate(object: T): void {
    this.validationSteps.forEach(v => v.validate(object));
  }
}

export { Validator };
export type { ValidationStep };
