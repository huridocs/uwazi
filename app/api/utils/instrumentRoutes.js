let executeRoute = (method, routePath, req = {}, app) => {
  let args = app[method].calls.mostRecent().args;

  return new Promise((resolve, reject) => {

    if(routePath != args[0]){
      reject('Route '+method.toUpperCase()+' '+routePath+' its not defined');
    }

    // let spyCheck = setTimeout(() => {
    //   if(!res.json.calls.count()){
    //     reject('res.json() never been called');
    //   }
    // }, jasmine.DEFAULT_TIMEOUT_INTERVAL - 20)

    let res = {json: function(){}};
    spyOn(res, 'json').and.callFake((response) => {
      // clearTimeout(spyCheck);
      resolve(response);
    });


    if(!args[1]){
      return reject('route function has not been defined !');
    }

    args[1](req, res);
  });
}
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
    }

  };

  return instrumentedRoute;
}
