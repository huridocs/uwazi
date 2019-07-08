import * as utils from 'api/utils';

const createSpy = (key, resolve) => jasmine.createSpy(key).and.callFake((...args) => {
  resolve(`${key}:${args.join(',')}`);
});

const mockResponseAsWritableStream = (res, resolve) => {
  let response = '';
  res.on = () => {};
  res.once = () => {};
  res.emit = () => {};
  res.write = (data) => {
    response += data.toString('utf8');
  };
  res.end = () => {
    resolve(response);
  };
};

const executeRoute = (method, routePath, req = {}, res, next = () => {}, app, runRoute = true) => {
  const args = app[method].calls.allArgs().find(a => a[0] === routePath);
  if (!args) {
    throw new Error(`Route ${method.toUpperCase()} ${routePath} is not defined`);
  }
  const result = new Promise((resolve, reject) => {
    let statusCode;
    let resType;
    mockResponseAsWritableStream(res, resolve);

    res.status = (code) => {
      statusCode = code;
    };

    res.type = (type) => {
      resType = type;
    };

    res.download = createSpy('download', resolve);
    res.redirect = createSpy('redirect', resolve);
    res.sendFile = createSpy('sendFile', resolve);
    res.send = createSpy('send', resolve);

    res.json = jasmine.createSpy('json').and.callFake((response) => {
      if (statusCode) {
        response.status = statusCode;
      }
      if (resType) {
        response.type = resType;
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
      reject(error);
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
  const _get = (routePath, req, res = {}, next) => executeRoute('get', routePath, req, res, next, app, false);
  get.validation = (routePath, req, res = {}, next) => executeRoute('get', routePath, req, res, next, app, false).validation;

  const post = (routePath, req, res = {}, next) => executeRoute('post', routePath, req, res, next, app);
  const _post = (routePath, req, res = {}, next) => executeRoute('post', routePath, req, res, next, app, false);
  post.validation = (routePath, req, res = {}, next) => executeRoute('post', routePath, req, res, next, app, false).validation;

  const remove = (routePath, req, res = {}, next) => executeRoute('delete', routePath, req, res, next, app);
  const _remove = (routePath, req, res = {}, next) => executeRoute('delete', routePath, req, res, next, app, false);
  remove.validation = (routePath, req, res = {}, next) => executeRoute('delete', routePath, req, res, next, app, false).validation;

  const instrumentedRoute = {
    get,
    _get,
    delete: remove,
    _delete: _remove,
    post,
    _post,
  };

  return instrumentedRoute;
};
