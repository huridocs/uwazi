import instrumentRoutes from '../instrumentRoutes.js'

describe("routesMock", () => {

  let testingRoute = app => {
    app.get('/test/route', (req, res) => {
      res.json({response:'get'})
    });

    app.delete('/test/route', (req, res) => {
      res.json({response:'delete'})
    });

    app.post('/test/route', (req, res) => {
      res.json({response:'post'})
    });
  }

  let route;

  beforeEach(() => {
    route = instrumentRoutes(testingRoute)
  });

  it('should execute get routes in a promise way', (done) => {
    route.get('/test/route')
    .then((response) => {
      expect(response).toEqual({response:'get'});
      done();
    })
    .catch(done.fail);
  });

  it('should execute delete routes in a promise way', (done) => {
    route.delete('/test/route')
    .then((response) => {
      expect(response).toEqual({response:'delete'});
      done();
    })
    .catch(done.fail);
  });

  it('should execute post routes in a promise way', (done) => {
    route.post('/test/route')
    .then((response) => {
      expect(response).toEqual({response:'post'});
      done();
    })
    .catch(done.fail);
  });

  it('should pass req to the route function', (done) => {
    let testingRoute = app => {
      app.get('/test/route', (req, res) => {
        res.json(req)
      });
    }
    route = instrumentRoutes(testingRoute)

    route.get('/test/route', {request:'request'})
    .then((response) => {
      expect(response).toEqual({request:'request'});
      done();
    })
    .catch(done.fail);
  });

  it('should put the status in the response', (done) => {
    let testingRoute = app => {
      app.get('/test/route', (req, res) => {
        res.status(404);
        res.json({response:'get'})
      });
    }

    route = instrumentRoutes(testingRoute)

    route.get('/test/route', {request:'request'})
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

  describe("when route function is not defined", () => {

    beforeEach(() => {
      let testingRoute = app => {
        app.get('/test/route');
      }
      route = instrumentRoutes(testingRoute)
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
