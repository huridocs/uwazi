/* eslint-disable no-param-reassign */
/* eslint-disable @typescript-eslint/no-misused-promises */
import { Application } from 'express';

const wrapHandler = (originalHandler: any) => async (req: any, res: any, next: any) => {
  try {
    await originalHandler(req, res, next);
  } catch (err) {
    next(err);
  }
};

const routesErrorHandler = (app: Application) => {
  const originalGet = app.get.bind(app);
  app.get = (path: any, ...args: any[]) => originalGet(path, ...args.map(wrapHandler));

  const originalPost = app.post.bind(app);
  app.post = (path: any, ...args: any[]) => originalPost(path, ...args.map(wrapHandler));

  const originalDelete = app.delete.bind(app);
  app.delete = (path: any, ...args: any[]) => originalDelete(path, ...args.map(wrapHandler));

  const originalPut = app.put.bind(app);
  app.put = (path: any, ...args: any[]) => originalPut(path, ...args.map(wrapHandler));
};

export { routesErrorHandler };
