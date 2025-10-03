import { ValidationError as AJVValidationError } from 'ajv';
import { ValidationError } from 'api/core/domain/error/ValidationError';
import { EventsBus } from 'api/eventsbus';
import { JobsDispatcher } from 'api/core/libs/queue/application/contracts/JobsDispatcher';
import { TransactionManager } from './TransactionManager';

interface UseCase<Input, Output> {
  execute(input: Input, ...args: any): Promise<Output>;
}

type Deps<ExtendedDeps> = {
  transactionManger?: TransactionManager;
  eventBus?: EventsBus;
  jobsDispatcher?: JobsDispatcher;
} & ExtendedDeps;

abstract class AbstractUseCase<Input, Output, ExtendedDeps = {}> implements UseCase<Input, Output> {
  constructor(protected deps: Deps<ExtendedDeps>) {}

  get transactionManger(): TransactionManager {
    if (!this.deps.transactionManger) {
      throw new Error('TransactionManager dependency not provided');
    }

    return this.deps.transactionManger;
  }

  get eventBus(): EventsBus {
    if (!this.deps.eventBus) {
      throw new Error('EventsBus dependency not provided');
    }

    return this.deps.eventBus;
  }

  get jobsDispatcher(): JobsDispatcher {
    if (!this.deps.jobsDispatcher) {
      throw new Error('JobsDispatcher dependency not provided');
    }

    return this.deps.jobsDispatcher;
  }

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
