import util from 'util';
import { ValidationError } from 'ajv';
import { ZodError } from 'zod';
import { Request, Response } from 'express';

import { config } from 'api/config';
import { LanguageISO6391 } from 'shared/types/commonTypes';

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
        const error = new ValidationError(
          e.errors.map(issue => ({
            instancePath: issue.path.join('.'),
            message: issue.message,
          }))
        );

        error.message = util.inspect(error, false, null);

        throw error;
      }

      throw e;
    }
  }

  /**
   * Adapts a controller class to an Express route handler.
   *
   * This method takes a controller class (not an instance), instantiates it with
   * the request and response objects, and calls its `handleAsync` method.
   *
   */
  static adapt<Controller extends AbstractController>(
    ControllerClass: new (dependencies: Dependencies) => Controller
  ) {
    return async (request: Request, response: Response) =>
      new ControllerClass({ request, response }).handleAsync();
  }

  protected get request() {
    return this.dependencies.request;
  }

  protected get response() {
    return this.dependencies.response;
  }

  protected get language() {
    return this.request.language as LanguageISO6391;
  }

  protected get tenantName() {
    return this.request.get('tenant') ?? config.defaultTenant.name;
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
