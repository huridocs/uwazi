import { testingEnvironment } from 'api/utils/testingEnvironment';
import * as auth from '../index';
import { publicAPIMiddleware } from '../publicAPIMiddleware';

jest.mock('../index', () => ({
  captchaAuthorization: jest.fn(),
}));

describe('publicAPIMiddleware', () => {
  let captchaMock: jest.Mock<any, any>;

  const setUpSettings = async (open: boolean) =>
    testingEnvironment.setUp({
      settings: [
        {
          openPublicEndpoint: open,
        },
      ],
    });

  beforeEach(() => {
    captchaMock = jest.fn();
    (<jest.Mock>auth.captchaAuthorization).mockImplementation(() => captchaMock);
    captchaMock.mockReset();
  });

  afterAll(async () => testingEnvironment.tearDown());

  it('should bypass captcha if enabled on settings and request has corresponding header', async () => {
    await setUpSettings(true);

    const req = {
      body: {},
      get: jest
        .fn()
        .mockImplementation((value: string) => (value === 'Bypass-Captcha' ? 'true' : undefined)),
    };
    const res = {};
    const next = jest.fn();

    await publicAPIMiddleware(req as any, res as any, next);

    expect(next).toHaveBeenCalled();
    expect(captchaMock).not.toHaveBeenCalled();
  });

  it('should requiere captcha validation if bypass is not enabled', async () => {
    await setUpSettings(false);

    const req = {
      body: {},
      get: jest
        .fn()
        .mockImplementation((value: string) => (value === 'Bypass-Captcha' ? 'true' : undefined)),
    };
    const res = {};
    const next = jest.fn();

    await publicAPIMiddleware(req as any, res as any, next);

    expect(next).not.toHaveBeenCalled();
    expect(captchaMock).toHaveBeenCalledWith(req, res, next);
  });

  it('should requiere captcha validation if header is not present', async () => {
    await setUpSettings(true);

    const req = {
      body: {},
      get: jest.fn().mockImplementation((value: string) => value),
    };
    const res = {};
    const next = jest.fn();

    await publicAPIMiddleware(req as any, res as any, next);

    expect(next).not.toHaveBeenCalled();
    expect(captchaMock).toHaveBeenCalledWith(req, res, next);
  });
});
