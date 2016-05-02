let executeRoute = (method, routePath, req = {}, app) => {
  let args = app[method].calls.allArgs().find((a) => a[0] === routePath);
  if (!args) {
    throw 'Route ' + method.toUpperCase() + ' ' + routePath + ' is not defined';
  }
  let result = new Promise((resolve, reject) => {
    let statusCode;
    let res = {
      json: () => {},
      status: (code) => {
        statusCode = code;
      }
    };

    spyOn(res, 'json').and.callFake((response) => {
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
    get: (routePath, req) => {
      return executeRoute('get', routePath, req, app);
    },

    delete: (routePath, req) => {
      return executeRoute('delete', routePath, req, app);
    },

    post: (routePath, req) => {
      return executeRoute('post', routePath, req, app);
    }
  };

  return instrumentedRoute;
};
