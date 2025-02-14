import { Application, NextFunction, Request, Response } from 'express';

export type Dependencies = {
  next: NextFunction;
  res: Response;
  app: Application;
};

export abstract class AbstractController {
  protected next: NextFunction;

  protected res: Response;

  protected app: Application;

  constructor({ next, res, app }: Dependencies) {
    this.next = next;
    this.res = res;
    this.app = app;
  }

  abstract handle(request: Request): Promise<void>;

  serverError(error: Error) {
    // Logging ?

    return this.res.status(500).json({
      message: error.message,
    });
  }

  clientError(message: string) {
    // Should we log this ?
    // What about negative impacts spam on Notifications channel ?
    return this.res.status(400).json({ message });
  }

  jsonResponse(body: any) {
    this.res.status(200).json(body);
    this.next();
  }
}
