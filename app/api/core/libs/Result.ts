type ResultType<Success, Fail> = Result<Success, undefined> | Result<undefined, Fail>;

class Result<Data, ErrorType> {
  private data: Data;

  private error: ErrorType;

  private constructor(data: Data, error: ErrorType) {
    this.data = data;
    this.error = error;
  }

  static ok<Data>(data: Data) {
    return new Result(data, undefined);
  }

  static fail<ErrorType extends Error>(error: ErrorType) {
    return new Result(undefined, error);
  }

  isOk(): this is Result<Data, undefined> {
    return this.error === undefined;
  }

  isError(): this is Result<undefined, ErrorType> {
    return this.error !== undefined;
  }

  getDataOrThrow() {
    if (this.isOk()) {
      return this.data!;
    }

    throw this.error;
  }

  getData<Fallback = undefined>(fallback?: Fallback) {
    return fallback || this.data;
  }

  getError<Fallback = undefined>(fallback?: Fallback) {
    return fallback || this.error;
  }
}

export { Result };
export type { ResultType };
