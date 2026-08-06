import middleWare from '../privateInstanceMiddleware.js';
import settings from '../../settings.js';
import { testingEnvironment } from '../../utils/testingEnvironment.js';
import { testingTenants } from '../../utils/testingTenants.js';

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
      status: jest.fn(),
      json: jest.fn(),
      redirect: jest.fn(),
    };
    next = jest.fn();
    testingTenants.mockCurrentTenant({
      name: 'test',
      dbName: 'test',
      indexName: 'index',
      domain: '127.0.0.1',
      featureFlags: { v2PrivateInstance: false },
    });
  });

  afterAll(() => {
    testingTenants.restoreCurrentFn();
  });

  describe('when there is an error', () => {
    it('should call next with the error', async () => {
      jest.spyOn(settings, 'get').mockReturnValue(Promise.reject(new Error('error')));
      await middleWare(req, res, next);

      expect(next).toHaveBeenCalledWith(new Error('error'));
    });
  });

  it('should redirect to "/login" when there is no user in the request and the instance is configured as private', done => {
    jest.spyOn(settings, 'get').mockImplementation(async () => Promise.resolve({ private: true }));
    middleWare(req, res, next).then(() => {
      expect(res.redirect).toHaveBeenCalledWith('/login');
      expect(next).not.toHaveBeenCalled();
      done();
    });
  });

  describe('Api calls', () => {
    beforeEach(() => {
      jest
        .spyOn(settings, 'get')
        .mockImplementation(async () => Promise.resolve({ private: true }));
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
      jest
        .spyOn(settings, 'get')
        .mockImplementation(async () => Promise.resolve({ private: true }));
      req.url = 'host:port/uploaded_documents/somefile.png';
    });

    describe('uploaded_documents', () => {
      it('should return an unauthorized error when there is no user', done => {
        expectUnauthorized(done);
      });
    });
  });

  it('should call next if the instance is private and there is a user logged', () => {
    jest.spyOn(settings, 'get').mockImplementation(async () => Promise.resolve({ private: true }));
    req.user = { username: 'test' };

    middleWare(req, res, next);

    expect(res.redirect).not.toHaveBeenCalled();
    expect(next).toHaveBeenCalled();
  });

  it('should call next when instance is not private', done => {
    jest.spyOn(settings, 'get').mockImplementation(async () => Promise.resolve({ private: false }));
    middleWare(req, res, next).then(() => {
      expect(res.redirect).not.toHaveBeenCalled();
      expect(next).toHaveBeenCalled();
      done();
    });
  });

  describe('Routes', () => {
    beforeEach(() => {
      jest
        .spyOn(settings, 'get')
        .mockImplementation(async () => Promise.resolve({ private: true }));
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

  describe('when v2PrivateInstance flag is on', () => {
    beforeEach(async () => {
      await testingEnvironment.setUp({ settings: [{ private: true }] });
      testingTenants.changeCurrentTenant({ featureFlags: { v2PrivateInstance: true } });
    });

    afterAll(async () => testingEnvironment.tearDown());

    it('should delegate to the v2 middleware and redirect to /login when unauthenticated', async () => {
      req.url = 'host:port/some/page';
      await testingEnvironment.runWithContext(() => middleWare(req, res, next));

      expect(res.redirect).toHaveBeenCalledWith('/login');
      expect(next).not.toHaveBeenCalled();
    });

    it('should delegate to the v2 middleware and call next for an allowed route', async () => {
      req.url = 'url/login';
      await testingEnvironment.runWithContext(() => middleWare(req, res, next));

      expect(next).toHaveBeenCalled();
      expect(res.redirect).not.toHaveBeenCalled();
    });

    it('should delegate to the v2 middleware and return 401 for a forbidden route', async () => {
      req.url = 'host:port/api/someendpoint';
      await testingEnvironment.runWithContext(() => middleWare(req, res, next));

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ error: 'Unauthorized' });
      expect(next).not.toHaveBeenCalled();
    });
  });
});
