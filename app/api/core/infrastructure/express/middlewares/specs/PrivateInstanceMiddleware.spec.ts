import type { NextFunction, Request, Response } from 'express';
import { testingEnvironment } from '#api/utils/testingEnvironment.js';
import { privateInstanceMiddleware } from '../PrivateInstanceMiddleware.js';

const setSettings = async (settings: { private: boolean }) => {
  await testingEnvironment.setUp({ settings: [settings] });
};

describe('privateInstanceMiddleware (v2)', () => {
  let req: Request;
  let res: Response;
  let next: NextFunction;

  beforeEach(() => {
    req = { url: '' } as Request;
    res = {
      status: jest.fn(),
      json: jest.fn(),
      redirect: jest.fn(),
    } as unknown as Response;
    next = jest.fn();
  });

  afterAll(async () => testingEnvironment.tearDown());

  const run = async () =>
    testingEnvironment.runWithContext(async () => privateInstanceMiddleware(req, res, next));

  it('should call next when there is a user in the request, regardless of privacy', async () => {
    await setSettings({ private: true });
    req.user = { username: 'test' } as Request['user'];

    await run();

    expect(next).toHaveBeenCalled();
    expect(res.redirect).not.toHaveBeenCalled();
  });

  it('should call next when the instance is not private', async () => {
    await setSettings({ private: false });

    await run();

    expect(next).toHaveBeenCalled();
    expect(res.redirect).not.toHaveBeenCalled();
  });

  describe('when private and unauthenticated', () => {
    beforeEach(async () => {
      await setSettings({ private: true });
    });

    it('should call next for an allowed route', async () => {
      req.url = 'url/login';

      await run();

      expect(next).toHaveBeenCalled();
    });

    it('should call next for an allowed api call', async () => {
      req.url = 'host:port/api/recoverpassword';

      await run();

      expect(next).toHaveBeenCalled();
    });

    it('should return 401 for a forbidden route', async () => {
      req.url = 'host:port/api/someendpoint';

      await run();

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ error: 'Unauthorized' });
      expect(next).not.toHaveBeenCalled();
    });

    it('should redirect to /login for any other route', async () => {
      req.url = 'host:port/some/page';

      await run();

      expect(res.redirect).toHaveBeenCalledWith('/login');
      expect(next).not.toHaveBeenCalled();
    });
  });
});
