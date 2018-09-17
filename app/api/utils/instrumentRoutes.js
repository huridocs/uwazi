import * as utils from 'api/utils';

const executeRoute = (method, routePath, req = {}, res, next = () => {}, app, runRoute = true) => {
  const args = app[method].calls.allArgs().find(a => a[0] === routePath);
  if (!args) {
    throw new Error(`Route ${method.toUpperCase()} ${routePath} is not defined`);
  }
  const result = new Promise((resolve, reject) => {
    let statusCode;

    res.status = (code) => {
      statusCode = code;
    };

    res.download = jasmine.createSpy('download').and.callFake((response) => {
      resolve(response);
    });

    res.json = jasmine.createSpy('json').and.callFake((response) => {
      if (statusCode) {
        response.status = statusCode;
      }
      resolve(response);
    });

    if (!args[1]) {
      return reject(new Error('route function has not been defined !'));
    }

    if (!runRoute) {
      return resolve();
    }

    const mockedNext = (error) => {
      next(error);
      resolve();
    };

    return args[args.length - 1](req, res, mockedNext);
  });

  if (args) {
    result.middlewares = args.slice(1, -1).filter(arg => !arg.isJoi);
    const validation = args.slice(1, -1).find(arg => arg.isJoi);
    if (validation) {
      result.validation = validation.describe();
    }
  }

  return result;
};

export default (route, io) => {
  const app = jasmine.createSpyObj('app', ['get', 'post', 'delete', 'use']);
  const originalValidateRequest = utils.validateRequest;
  spyOn(utils, 'validateRequest').and.callFake(schema => schema);
  route(app, io);
  utils.validateRequest = originalValidateRequest;

  const get = (routePath, req, res = {}, next) => executeRoute('get', routePath, req, res, next, app);
  get.validation = (routePath, req, res = {}, next) => executeRoute('get', routePath, req, res, next, app, false).validation;

  const post = (routePath, req, res = {}, next) => executeRoute('post', routePath, req, res, next, app);
  post.validation = (routePath, req, res = {}, next) => executeRoute('post', routePath, req, res, next, app, false).validation;

  const remove = (routePath, req, res = {}, next) => executeRoute('delete', routePath, req, res, next, app);
  remove.validation = (routePath, req, res = {}, next) => executeRoute('delete', routePath, req, res, next, app, false).validation;

  const instrumentedRoute = {
    get,
    delete: remove,
    post,
  };

  return instrumentedRoute;
};
