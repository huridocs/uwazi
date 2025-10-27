/* eslint-disable no-param-reassign */
import bodyParser from 'body-parser';
import { Application } from 'express';

const wrapHandler = (originalHandler: any) => async (req: any, res: any, next: any) => {
  try {
    await originalHandler(req, res, next);
  } catch (err) {
    next(err);
  }
};

const routesErrorHandler = (app: Application) => {
  const jsonParser = bodyParser.json({ limit: '5mb' });
  const shouldSkipJson = (path: any) =>
    typeof path === 'string' && path.includes('/api/remotepublic');

  const originalGet = app.get.bind(app);
  app.get = (path: any, ...handlers: any[]) => originalGet(path, ...handlers.map(wrapHandler));

  const originalPost = app.post.bind(app);
  app.post = (path: any, ...handlers: any[]) =>
    originalPost(path, ...(shouldSkipJson(path) ? [] : [jsonParser]), ...handlers.map(wrapHandler));

  const originalDelete = app.delete.bind(app);
  app.delete = (path: any, ...handlers: any[]) =>
    originalDelete(
      path,
      ...(shouldSkipJson(path) ? [] : [jsonParser]),
      ...handlers.map(wrapHandler)
    );

  const originalPut = app.put.bind(app);
  app.put = (path: any, ...handlers: any[]) =>
    originalPut(path, ...(shouldSkipJson(path) ? [] : [jsonParser]), ...handlers.map(wrapHandler));
};

export { routesErrorHandler };
