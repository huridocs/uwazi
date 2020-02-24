import middleWare from '../privateInstanceMiddleware';
import settings from '../../settings';

describe('privateInstanceMiddleware', () => {
  let req;
  let res;
  let next;

  const expectUnauthorized = done => {
    middleWare(req, res, next).then(() => {
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ error: 'Unauthorized' });
      expect(next).not.toHaveBeenCalled();
      done();
    });
  };

  const expectNext = () => {
    middleWare(req, res, next);
    expect(res.redirect).not.toHaveBeenCalled();
    expect(next).toHaveBeenCalled();
  };

  const expectNextPromise = done => {
    middleWare(req, res, next).then(() => {
      expect(res.status).not.toHaveBeenCalled();
      expect(next).toHaveBeenCalled();
      done();
    });
  };

  beforeEach(() => {
    req = { url: '' };
    res = {
      status: jasmine.createSpy('status'),
      json: jasmine.createSpy('json'),
      redirect: jasmine.createSpy('redirect'),
    };
    next = jasmine.createSpy('next');
  });

  it('should redirect to "/login" when there is no user in the request and the instance is configured as private', done => {
    spyOn(settings, 'get').and.returnValue(Promise.resolve({ private: true }));
    middleWare(req, res, next).then(() => {
      expect(res.redirect).toHaveBeenCalledWith('/login');
      expect(next).not.toHaveBeenCalled();
      done();
    });
  });

  describe('Api calls', () => {
    beforeEach(() => {
      spyOn(settings, 'get').and.returnValue(Promise.resolve({ private: true }));
    });

    it('should return an unauthorized error when there is no user, the instance is configured as private and the call is to the api', done => {
      req.url = 'host:port/api/someendpoint';
      expectUnauthorized(done);
    });

    it('should allow the recoverpassword endpoint', done => {
      req.url = 'host:port/api/recoverpassword';
      expectNextPromise(done);
    });

    it('should allow the resetpassword endpoint', done => {
      req.url = 'host:port/api/resetpassword';
      expectNextPromise(done);
    });

    it('should allow the unlockaccount endpoint', done => {
      req.url = 'host:port/api/unlockaccount';
      expectNextPromise(done);
    });
  });

  describe('Other private-related calls', () => {
    beforeEach(() => {
      spyOn(settings, 'get').and.returnValue(Promise.resolve({ private: true }));
      req.url = 'host:port/uploaded_documents/somefile.png';
    });

    describe('uploaded_documents', () => {
      it('should return an unauthorized error when there is no user', done => {
        expectUnauthorized(done);
      });
    });
  });

  it('should call next if the instance is private and there is a user logged', () => {
    spyOn(settings, 'get').and.returnValue(Promise.resolve({ private: true }));
    req.user = { username: 'test' };

    middleWare(req, res, next);

    expect(res.redirect).not.toHaveBeenCalled();
    expect(next).toHaveBeenCalled();
  });

  it('should call next when instance is not private', done => {
    spyOn(settings, 'get').and.returnValue(Promise.resolve({ private: false }));
    middleWare(req, res, next).then(() => {
      expect(res.redirect).not.toHaveBeenCalled();
      expect(next).toHaveBeenCalled();
      done();
    });
  });

  describe('Routes', () => {
    beforeEach(() => {
      spyOn(settings, 'get').and.returnValue(Promise.resolve({ private: true }));
    });

    it('should call next when instance is private and the url matches login', () => {
      req.url = 'url/login';
      expectNext();
    });

    it('should call next when instance is private and the url matches setpassword', () => {
      req.url = 'url/setpassword/somehash';
      expectNext();
    });

    it('should call next when instance is private and the url matches unlockaccount', () => {
      req.url = 'url/unlockaccount/someAccount';
      expectNext();
    });
  });
});
