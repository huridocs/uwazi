let executeRoute = (method, routePath, req = {}, res, app) => {
  let args = app[method].calls.allArgs().find((a) => a[0] === routePath);
  if (!args) {
    throw 'Route ' + method.toUpperCase() + ' ' + routePath + ' is not defined';
  }
  let result = new Promise((resolve, reject) => {
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
      return reject('route function has not been defined !');
    }

    args[args.length - 1](req, res);
  });

  if (args) {
    result.middlewares = args.slice(1, -1);
  }

  return result;
};

export default (route, io) => {
  let app = jasmine.createSpyObj('app', ['get', 'post', 'delete']);
  route(app, io);

  let instrumentedRoute = {
    get: (routePath, req, res = {}) => {
      return executeRoute('get', routePath, req, res, app);
    },

    delete: (routePath, req, res = {}) => {
      return executeRoute('delete', routePath, req, res, app);
    },

    post: (routePath, req, res = {}) => {
      return executeRoute('post', routePath, req, res, app);
    }
  };

  return instrumentedRoute;
};
