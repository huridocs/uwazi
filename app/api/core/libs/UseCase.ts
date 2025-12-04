import { ValidationError as AJVValidationError } from 'ajv';
import { ValidationError } from 'api/core/domain/error/ValidationError';
import { EventsBus } from 'api/core/libs/eventsbus';
import { JobsDispatcher } from 'api/core/libs/queue/application/contracts/JobsDispatcher';
import { UserSchema } from 'shared/types/userType';
import { Tenant } from 'api/tenants/tenantContext';
import { User } from 'api/users.v2/model/User';
import { ZodError } from 'zod';
import { TransactionManager } from '../application/contracts/TransactionManager';
import { IdGenerator } from '../application/contracts/IdGenerator';
import { Logger } from './logger/contracts/Logger';

interface UseCase<Input, Output> {
  execute(input: Input, ...args: any): Promise<Output>;
}

type Deps<ExtendedDeps> = {
  transactionManager?: TransactionManager;
  eventBus?: EventsBus;
  jobsDispatcher?: JobsDispatcher;
  idGenerator?: IdGenerator;
  logger?: Logger;
} & ExtendedDeps;

type Context = {
  actor: UserSchema; // Using legacy User for now.
  tenant: Tenant; // Using legacy Tenant for now
};

abstract class AbstractUseCase<Input, Output, ExtendedDeps = {}> implements UseCase<Input, Output> {
  constructor(
    protected deps: Deps<ExtendedDeps>,
    private context?: Context
  ) {}

  protected get logger(): Logger {
    if (!this.deps.logger) {
      throw new Error('Logger dependency not provided');
    }

    return this.deps.logger;
  }

  protected get actor() {
    const id = this.context?.actor?._id?.toString();
    return id ? { id } : undefined;
  }

  protected getActor(): User {
    return User.createFrom({
      id: this.context?.actor?._id?.toString(),
      role: this.context?.actor?.role,
      groups: this.context?.actor?.groups?.map(g => g._id.toString()),
    });
  }

  protected get actorId() {
    if (!this.context?.actor?._id) {
      throw new Error(`Actor was not found. ${JSON.stringify(this.context)}`);
    }

    return this.context.actor._id.toString();
  }

  protected get tenant() {
    if (!this.context?.tenant) {
      throw new Error(`Tenant was not found. ${JSON.stringify(this.context)}`);
    }

    return this.context.tenant;
  }

  protected get idGenerator(): IdGenerator {
    if (!this.deps.idGenerator) {
      throw new Error('Id Generator dependency not provided');
    }

    return this.deps.idGenerator;
  }

  protected get transactionManager(): TransactionManager {
    if (!this.deps.transactionManager) {
      throw new Error('TransactionManager dependency not provided');
    }

    return this.deps.transactionManager;
  }

  protected get eventBus(): EventsBus {
    if (!this.deps.eventBus) {
      throw new Error('EventsBus dependency not provided');
    }

    return this.deps.eventBus;
  }

  protected get jobsDispatcher(): JobsDispatcher {
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
      if (e instanceof ZodError) {
        const error = new AJVValidationError(
          e.errors.map(issue => ({
            instancePath: issue.path.join('.'),
            message: issue.message,
          }))
        );

        error.message = e.message;

        throw error;
      }

      if (e instanceof ValidationError) {
        throw new AJVValidationError([e.asAJV()]);
      }

      throw e;
    }
  }

  protected abstract executeAsync(input: Input, ...args: any): Promise<Output>;
}

export { AbstractUseCase };
export type { UseCase, Deps as BaseDeps, Context as UseCaseContext };
