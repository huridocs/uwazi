const executeRoute = (method, routePath, req = {}, res, app) => {
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

    res.error = (error) => {
      res.json({ error });
    };

    if (!args[1]) {
      return reject(new Error('route function has not been defined !'));
    }

    args[args.length - 1](req, res);
  });

  if (args) {
    result.middlewares = args.slice(1, -1);
  }

  return result;
};

export default (route, io) => {
  const app = jasmine.createSpyObj('app', ['get', 'post', 'delete']);
  route(app, io);

  const instrumentedRoute = {
    get: (routePath, req, res = {}) => executeRoute('get', routePath, req, res, app),

    delete: (routePath, req, res = {}) => executeRoute('delete', routePath, req, res, app),

    post: (routePath, req, res = {}) => executeRoute('post', routePath, req, res, app)
  };

  return instrumentedRoute;
};
