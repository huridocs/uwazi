import instrumentRoutes from '../instrumentRoutes.js';

describe('routesMock', () => {
  function middleware1() {}
  function middleware2() {}

  let testingRoute = app => {
    app.get('/routeWith/middleware', middleware1, middleware2, (req, res) => {
      res.json({response: 'middleware route'});
    });

    app.post('/routeWith/middleware', middleware1, middleware2, (req, res) => {
      res.json({response: 'middleware route'});
    });

    app.delete('/routeWith/middleware', middleware1, middleware2, (req, res) => {
      res.json({response: 'middleware route'});
    });

    app.get('/test/route', (req, res) => {
      res.json({response: 'get'});
    });

    app.delete('/test/route', (req, res) => {
      res.json({response: 'delete'});
    });

    app.post('/test/route', (req, res) => {
      res.json({response: 'post'});
    });
  };

  let route;

  beforeEach(() => {
    route = instrumentRoutes(testingRoute);
  });

  it('should execute get routes in a promise way', (done) => {
    route.get('/test/route')
    .then((response) => {
      expect(response).toEqual({response: 'get'});
      done();
    })
    .catch(done.fail);
  });

  it('should execute delete routes in a promise way', (done) => {
    route.delete('/test/route')
    .then((response) => {
      expect(response).toEqual({response: 'delete'});
      done();
    })
    .catch(done.fail);
  });

  it('should execute post routes in a promise way', (done) => {
    route.post('/test/route')
    .then((response) => {
      expect(response).toEqual({response: 'post'});
      done();
    })
    .catch(done.fail);
  });

  describe('when using middlewares on a route', () => {
    it('should execute the route function correctly', (done) => {
      route.get('/routeWith/middleware')
      .then((response) => {
        expect(response).toEqual({response: 'middleware route'});
        done();
      })
      .catch(done.fail);
    });

    it('should have a method to get the middlewares', () => {
      expect(route.middlewares.get('/routeWith/middleware')).toEqual([middleware1, middleware2]);
      expect(route.middlewares.post('/routeWith/middleware')).toEqual([middleware1, middleware2]);
      expect(route.middlewares.delete('/routeWith/middleware')).toEqual([middleware1, middleware2]);
    });
  });

  it('should pass req to the route function', (done) => {
    testingRoute = app => {
      app.get('/test/route', (req, res) => {
        res.json(req);
      });
    };
    route = instrumentRoutes(testingRoute);

    route.get('/test/route', {request: 'request'})
    .then((response) => {
      expect(response).toEqual({request: 'request'});
      done();
    })
    .catch(done.fail);
  });

  it('should put the status in the response', (done) => {
    testingRoute = app => {
      app.get('/test/route', (req, res) => {
        res.status(404);
        res.json({response: 'get'});
      });
    };

    route = instrumentRoutes(testingRoute);

    route.get('/test/route', {request: 'request'})
    .then((response) => {
      expect(response.status).toBe(404);
      done();
    })
    .catch(done.fail);
  });


  describe('when routepath do not match', () => {
    it('should throw an error', (done) => {
      route.get('/unexistent/route')
      .catch((error) => {
        expect(error).toBe('Route GET /unexistent/route is not defined');
        done();
      });
    });
  });

  describe('when route function is not defined', () => {
    beforeEach(() => {
      testingRoute = app => {
        app.get('/test/route');
      };
      route = instrumentRoutes(testingRoute);
    });

    it('should throw an error', (done) => {
      route.get('/test/route')
      .catch((error) => {
        expect(error).toBe('route function has not been defined !');
        done();
      });
    });
  });
});
