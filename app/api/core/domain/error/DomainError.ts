abstract class DomainError extends Error {
  public readonly name: string;

  public readonly code: string;

  constructor(message: string, code: string) {
    super(message);
    this.name = this.constructor.name;
    this.code = code;
    Object.setPrototypeOf(this, new.target.prototype);
  }

  asObject() {
    return {
      name: this.name,
      code: this.code,
      message: this.message,
      stack: this.stack,
      cause: this.cause,
    };
  }
}

export { DomainError };
