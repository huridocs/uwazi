import { ValidationError as AJVValidationError } from 'ajv';
import { ValidationError } from 'api/core/domain/error/ValidationError';

interface UseCase<Input, Output> {
  execute(input: Input, ...args: any): Promise<Output>;
}

abstract class AbstractUseCase<Input, Output> implements UseCase<Input, Output> {
  async execute(input: Input, ...args: any): Promise<Output> {
    try {
      const output = await this.executeAsync(input, ...args);

      return output;
    } catch (e) {
      if (e instanceof ValidationError) {
        throw new AJVValidationError([e.asAJV()]);
      }

      throw e;
    }
  }

  protected abstract executeAsync(input: Input, ...args: any): Promise<Output>;
}

export { AbstractUseCase };
export type { UseCase };
