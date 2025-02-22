import { Request, Response } from 'express';

export type Dependencies<RequestBody = any> = {
  response: Response;
  request: Request<unknown, any, RequestBody>;
};

export abstract class AbstractController<RequestBody = any> {
  constructor(private dependencies: Dependencies<RequestBody>) {}

  abstract handle(): Promise<void>;

  get request() {
    return this.dependencies.request;
  }

  get response() {
    return this.dependencies.response;
  }

  serverError(error: Error) {
    this.response.status(500).json({
      message: error.message,
    });
  }

  clientError(message: string) {
    this.response.status(400).json({ message });
  }

  jsonResponse(body: any) {
    this.response.status(200).json(body);
  }

  ok() {
    this.response.status(200).send();
  }
}
