import { EventsBus } from '#api/core/libs/eventsbus/index.js';
import { JobsDispatcher } from '#api/core/libs/queue/application/contracts/JobsDispatcher.js';
import { Tenant } from '#api/tenants/tenantContext.js';
import { User } from '#api/users.v2/model/User.js';
import { LanguageISO6391 } from '#shared/types/commonTypes.js';
import { UserSchema } from '#shared/types/userType.js';
import { TransactionManager } from '../application/contracts/TransactionManager.js';
import { IdGenerator } from '../application/contracts/IdGenerator.js';
import { Logger } from './logger/contracts/Logger.js';
import { EventEmitter } from './eventEmitter/EventEmitter.js';

interface UseCase<Input, Output, Args extends any[] = []> {
  execute(input: Input, ...args: Args): Promise<Output>;
}

type Deps<ExtendedDeps> = {
  transactionManager?: TransactionManager;
  eventBus?: EventsBus;
  jobsDispatcher?: JobsDispatcher;
  idGenerator?: IdGenerator;
  logger?: Logger;
  eventEmitter?: EventEmitter;
} & ExtendedDeps;

type Context = {
  actor?: UserSchema; // Using legacy User for now. Optional to support unauthenticated requests
  tenant: Tenant; // Using legacy Tenant for now
  targetLanguage?: LanguageISO6391;
};

abstract class AbstractUseCase<
  Input,
  Output,
  ExtendedDeps = {},
  Args extends any[] = [],
> implements UseCase<Input, Output, Args> {
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
    return User.createFrom(this.context?.actor || null);
  }

  protected get targetLanguage() {
    if (!this.context?.targetLanguage) {
      throw new Error(`Target language was not found. ${JSON.stringify(this.context)}`);
    }

    return this.context.targetLanguage;
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

  protected get eventEmitter(): EventEmitter {
    if (!this.deps.eventEmitter) {
      throw new Error('EventEmitter dependency not provided');
    }

    return this.deps.eventEmitter;
  }

  protected get jobsDispatcher(): JobsDispatcher {
    if (!this.deps.jobsDispatcher) {
      throw new Error('JobsDispatcher dependency not provided');
    }

    return this.deps.jobsDispatcher;
  }

  abstract execute(input: Input, ...args: Args): Promise<Output>;
}

export { AbstractUseCase };
export type { UseCase, Deps as BaseDeps, Context as UseCaseContext };
