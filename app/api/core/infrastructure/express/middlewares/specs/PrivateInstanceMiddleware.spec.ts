import type { NextFunction, Request, Response } from 'express';
import { testingEnvironment } from '#api/utils/testingEnvironment.js';
import { SettingsDataSourceFactory } from '#api/core/infrastructure/factories/SettingsDataSourceFactory.js';
import { SettingsDataSource } from '#api/core/application/contracts/SettingsDataSource.js';
import { privateInstanceMiddleware } from '../PrivateInstanceMiddleware.js';

const setSettings = async (settings: { private: boolean }) => {
  await testingEnvironment.setUp({ settings: [settings] });
};

describe('privateInstanceMiddleware', () => {
  let req: Request;
  let res: Response;
  let next: NextFunction;

  beforeEach(() => {
    jest.restoreAllMocks();
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

  it('should call next with the error when the settings cannot be read', async () => {
    await setSettings({ private: true });
    jest.spyOn(SettingsDataSourceFactory, 'default').mockReturnValue({
      get: async () => {
        throw new Error('error');
      },
    } as unknown as SettingsDataSource);

    await run();

    expect(next).toHaveBeenCalledWith(new Error('error'));
  });

  describe('when private and unauthenticated', () => {
    beforeEach(async () => {
      await setSettings({ private: true });
    });

    it.each(['url/login', 'url/setpassword/somehash', 'url/unlockaccount/someAccount'])(
      'should call next for the allowed route %s',
      async url => {
        req.url = url;

        await run();

        expect(next).toHaveBeenCalled();
      }
    );

    it.each([
      'host:port/api/recoverpassword',
      'host:port/api/resetpassword',
      'host:port/api/unlockaccount',
    ])('should call next for the allowed api call %s', async url => {
      req.url = url;

      await run();

      expect(next).toHaveBeenCalled();
    });

    it.each(['host:port/api/someendpoint', 'host:port/uploaded_documents/somefile.png'])(
      'should return 401 for the forbidden route %s',
      async url => {
        req.url = url;

        await run();

        expect(res.status).toHaveBeenCalledWith(401);
        expect(res.json).toHaveBeenCalledWith({ error: 'Unauthorized' });
        expect(next).not.toHaveBeenCalled();
      }
    );

    it('should redirect to /login for any other route', async () => {
      req.url = 'host:port/some/page';

      await run();

      expect(res.redirect).toHaveBeenCalledWith('/login');
      expect(next).not.toHaveBeenCalled();
    });
  });
});
