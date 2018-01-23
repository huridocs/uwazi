import middleWare from '../privateInstanceMiddleware';
import settings from '../../settings';

describe('privateInstanceMiddleware', () => {
  let req;
  let res;
  let next;

  beforeEach(() => {
    req = {url: ''};
    res = {
      status: jasmine.createSpy('status'),
      json: jasmine.createSpy('json'),
      redirect: jasmine.createSpy('redirect')
    };
    next = jasmine.createSpy('next');
  });

  it('should redirect to "/login" when there is no user in the request and the instance is configured as private', (done) => {
    spyOn(settings, 'get').and.returnValue(Promise.resolve({private: true}));
    middleWare(req, res, next)
    .then(() => {
      expect(res.redirect).toHaveBeenCalledWith('/login');
      expect(next).not.toHaveBeenCalled();
      done();
    });
  });

  it('should return an unauthorized error when there is no user, the instance is configured as private and the call is to the api', (done) => {
    spyOn(settings, 'get').and.returnValue(Promise.resolve({private: true}));
    req.url = 'host:port/api/someendpoint';
    middleWare(req, res, next)
    .then(() => {
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({error: 'Unauthorized'});
      expect(next).not.toHaveBeenCalled();
      done();
    });
  });

  it('should call next if the instance is private and there is an user logged', (done) => {
    spyOn(settings, 'get').and.returnValue(Promise.resolve({private: true}));
    req.user = {username: 'test'};
    middleWare(req, res, next)
    .then(() => {
      expect(res.redirect).not.toHaveBeenCalled();
      expect(next).toHaveBeenCalled();
      done();
    });
  });

  it('should call next when instance is not private', (done) => {
    spyOn(settings, 'get').and.returnValue(Promise.resolve({private: false}));
    middleWare(req, res, next)
    .then(() => {
      expect(res.redirect).not.toHaveBeenCalled();
      expect(next).toHaveBeenCalled();
      done();
    });
  });

  it('should call next when instance is private and the url matches login', (done) => {
    spyOn(settings, 'get').and.returnValue(Promise.resolve({private: true}));
    req.url = 'url/login';
    middleWare(req, res, next)
    .then(() => {
      expect(res.redirect).not.toHaveBeenCalled();
      expect(next).toHaveBeenCalled();
      done();
    });
  });
});
