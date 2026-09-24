type ErrorCategory = 'validation' | 'not_found' | 'conflict' | 'rule_violation';

abstract class DomainError extends Error {
  public readonly name: string;

  public readonly code: string;

  constructor(message: string, code: string, cause?: Error) {
    super(message, { cause });
    this.name = this.constructor.name;
    this.code = code;
    Object.setPrototypeOf(this, new.target.prototype);
  }

  /**
   * What kind of failure this is, so each driving adapter (HTTP, CLI) can map it to its own
   * status without listing every error class. Declared per class (static) and read through the
   * instance, so it does not change how existing errors serialise.
   */
  static readonly category: ErrorCategory = 'rule_violation';

  get category(): ErrorCategory {
    return (this.constructor as typeof DomainError).category;
  }

  asObject() {
    return {
      name: this.name,
      code: this.code,
      category: this.category,
      message: this.message,
      stack: this.stack,
      cause: this.cause,
    };
  }
}

export { DomainError };
export type { ErrorCategory };
