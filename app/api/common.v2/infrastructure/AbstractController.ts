import { ValidationError as AJVValidationError } from 'ajv';
import { ZodError } from 'zod';
import { Request, Response } from 'express';

import { LanguageISO6391 } from 'shared/types/commonTypes';
import { tenants } from 'api/tenants';
import { User } from 'api/users/usersModel';
import { ValidationError } from 'api/core/domain/error/ValidationError';
import { TransactionManagerFactory } from 'api/core/infrastructure/factories/TransactionManagerFactory';
import { DependenciesContext } from 'api/core/libs/DependenciesContext';
import { EventEmitterFactory } from 'api/core/libs/eventEmitter/EventEmitterFactory';
import { IdGeneratorFactory } from 'api/core/infrastructure/factories/IdGeneratorFactory';
import { DefaultDispatcher } from 'api/core/libs/queue/configuration/factories';

export type Dependencies<RequestBody = any> = {
  response: Response;
  request: Request<unknown, any, RequestBody>;
};

export abstract class AbstractController<RequestBody = any> {
  constructor(private dependencies: Dependencies<RequestBody>) {}

  protected abstract handle(): Promise<void>;

  async handleAsync() {
    try {
      await this.handle();
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

  /**
   * Adapts the controller class to an Express route handler.
   * In this static context, `this` refers to the constructor of the
   * class that is calling this method (e.g., TemplateMutationController).
   */
  static createHandler() {
    return async (request: Request, response: Response) => {
      /* @ts-ignore - 'this' is a constructor, so 'new' is valid*/
      const instance = new this({ request, response });

      const tenant = tenants.current();
      const transactionManager = TransactionManagerFactory.default();
      const eventEmitter = EventEmitterFactory.default();
      const idGenerator = IdGeneratorFactory.default();
      const jobsDispatcher = DefaultDispatcher(tenant.name, transactionManager);

      return DependenciesContext.run(
        { transactionManager, eventEmitter, idGenerator, jobsDispatcher },
        () => instance.handleAsync()
      );
    };
  }

  protected get request() {
    return this.dependencies.request;
  }

  protected get user(): User {
    return this.dependencies.request?.user;
  }

  protected get response() {
    return this.dependencies.response;
  }

  protected get language() {
    return this.request.language as LanguageISO6391;
  }

  // eslint-disable-next-line class-methods-use-this
  protected get tenantName() {
    return tenants.current().name;
  }

  protected ensureUser() {
    if (!this.user) {
      throw new Error('User not found');
    }
  }

  protected serverError(error: Error) {
    this.response.status(500).json({
      message: error.message,
    });
  }

  protected clientError(message: string) {
    this.response.status(400).json({ message });
  }

  protected jsonResponse(body: any) {
    this.response.status(200).json(body);
  }

  protected ok() {
    this.response.status(200).send();
  }
}
