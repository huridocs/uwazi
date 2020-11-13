import db from 'api/utils/testing_db';
import { catchErrors } from 'api/utils/jasmineHelpers';
import captchaMiddleware from '../captchaMiddleware';
import { CaptchaModel } from '../CaptchaModel';

describe('captchaMiddleware', () => {
  let req;
  let res;
  let next;
  let captchaId;
  beforeEach(done => {
    req = { body: {}, session: {}, cookies: {} };
    res = {
      status: jasmine.createSpy('status'),
      json: jasmine.createSpy('json'),
    };
    next = jasmine.createSpy('next');

    captchaId = db.id();
    const fixtures = {
      captchas: [{ _id: captchaId, captcha: 'k0n2170' }],
    };

    db.clearAllAndLoad(fixtures)
      .then(done)
      .catch(catchErrors(done));
  });

  it('should return an error when there is no captcha in the request', async () => {
    const middleWare = captchaMiddleware();
    await middleWare(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({ error: 'Captcha error', message: 'Forbidden' });
    expect(next).not.toHaveBeenCalled();
  });

  it('should return an error when the captcha does not match', async () => {
    const middleWare = captchaMiddleware();
    req.body.captcha = '123';
    req.cookies.captcha = 'wrongId';
    await middleWare(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({ error: 'Captcha error', message: 'Forbidden' });
    expect(next).not.toHaveBeenCalled();
  });

  describe('when the captcha matches', () => {
    it('should call next', async () => {
      const middleWare = captchaMiddleware();
      req.body.captcha = 'k0n2170';
      req.cookies.captcha = captchaId.toString();
      await middleWare(req, res, next);

      expect(res.status).not.toHaveBeenCalled();
      expect(res.json).not.toHaveBeenCalled();
      expect(next).toHaveBeenCalled();
    });

    it('should delete the captcha from the body', async () => {
      const middleWare = captchaMiddleware();
      req.body.captcha = 'k0n2170';
      req.cookies.captcha = captchaId.toString();
      await middleWare(req, res, next);

      expect(req.body.captcha).not.toBeDefined();
    });

    it('should delete the captcha from the data base', async () => {
      const middleWare = captchaMiddleware();
      req.body.captcha = 'k0n2170';
      req.cookies.captcha = captchaId.toString();
      await middleWare(req, res, next);
      const captchas = await CaptchaModel.get();
      expect(captchas.length).toBe(0);
    });
  });
});
