let executeRoute = (method, routePath, req = {}, app) => {
  let args = app[method].calls.allArgs().find((a) => a[0] === routePath);
  return new Promise((resolve, reject) => {
    if (!args) {
      reject('Route ' + method.toUpperCase() + ' ' + routePath + ' is not defined');
    }

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
};

let middlewares = (method, routePath, app) => {
  let args = app[method].calls.allArgs().find((a) => a[0] === routePath);
  return args.slice(1, -1);
};

export default (route) => {
  let app = jasmine.createSpyObj('app', ['get', 'post', 'delete']);
  route(app);

  let instrumentedRoute = {
    get: (routePath, req) => {
      return executeRoute('get', routePath, req, app);
    },

    delete: (routePath, req) => {
      return executeRoute('delete', routePath, req, app);
    },

    post: (routePath, req) => {
      return executeRoute('post', routePath, req, app);
    },

    middlewares: {
      get: (routePath) => {
        return middlewares('get', routePath, app);
      },
      post: (routePath) => {
        return middlewares('post', routePath, app);
      },
      delete: (routePath) => {
        return middlewares('delete', routePath, app);
      }
    }
  };

  return instrumentedRoute;
};
