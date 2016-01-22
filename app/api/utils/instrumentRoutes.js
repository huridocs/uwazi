let executeRoute = (method, routePath, req = {}, app, middlewares) => {
let args = app[method].calls.allArgs().find((a) => {return a[0] == routePath});

  return new Promise((resolve, reject) => {

    if(!args){
      reject('Route '+method.toUpperCase()+' '+routePath+' is not defined');
    }

    let statusCode;
    let res = {
      json: function(){},
      status: function(code){
        statusCode = code;
      }
    };

    spyOn(res, 'json').and.callFake((response) => {
      if(statusCode) response.status = statusCode;
      resolve(response);
    });


    if(!args[1+middlewares]){
      return reject('route function has not been defined !');
    }

    args[1+middlewares](req, res);
  });
}
export default (route, middlewares = 0) => {

  let app = jasmine.createSpyObj('app', ['get', 'post', 'delete']);
  route(app);

  let instrumentedRoute = {

    get: (routePath, req) => {
      return executeRoute('get', routePath, req, app, middlewares);
    },

    delete: (routePath, req) => {
      return executeRoute('delete', routePath, req, app, middlewares);
    },

    post: (routePath, req) => {
      return executeRoute('post', routePath, req, app, middlewares);
    }

  };

  return instrumentedRoute;
}
