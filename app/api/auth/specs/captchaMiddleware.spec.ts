import db from 'api/utils/testing_db';
import { NextFunction } from 'express';
import captchaMiddleware from '../captchaMiddleware';
import { CaptchaModel } from '../CaptchaModel';
import { ObjectIdSchema } from '../../../shared/types/commonTypes';

const getMock = jest.fn().mockReturnValue(undefined);

describe('captchaMiddleware', () => {
  let req: any;
  let res: any;
  let next: NextFunction;
  let captchaId: ObjectIdSchema;

  beforeEach(async () => {
    req = { body: {}, session: {}, cookies: {}, get: getMock };
    res = {
      status: jest.fn(),
      json: jest.fn(),
    };
    next = jest.fn();

    captchaId = db.id();

    const fixtures = {
      captchas: [{ _id: captchaId, text: 'k0n2170' }],
    };

    await db.setupFixturesAndContext(fixtures);
  });

  afterAll(async () => db.disconnect());

  it('should return an error when there is no captcha in the request', async () => {
    const middleWare = captchaMiddleware();
    await middleWare(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({ error: 'Captcha error', message: 'Forbidden' });
    expect(next).not.toHaveBeenCalled();
  });

  it('should return an error when the captcha does not match', async () => {
    const middleWare = captchaMiddleware();
    req.body.captcha = JSON.stringify({ text: '123', id: captchaId.toString() });
    await middleWare(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({ error: 'Captcha error', message: 'Forbidden' });
    expect(next).not.toHaveBeenCalled();
  });

  describe('when the captcha matches', () => {
    it('should call next', async () => {
      const middleWare = captchaMiddleware();
      req.body.captcha = JSON.stringify({ text: 'k0n2170', id: captchaId.toString() });
      await middleWare(req, res, next);

      expect(res.status).not.toHaveBeenCalled();
      expect(res.json).not.toHaveBeenCalled();
      expect(next).toHaveBeenCalled();
    });

    it('should delete the captcha from the body', async () => {
      const middleWare = captchaMiddleware();
      req.body.captcha = JSON.stringify({ text: 'k0n2170', id: captchaId.toString() });
      await middleWare(req, res, next);

      expect(req.body.captcha).not.toBeDefined();
    });

    it('should delete the captcha from the data base', async () => {
      const middleWare = captchaMiddleware();
      req.body.captcha = JSON.stringify({ text: 'k0n2170', id: captchaId.toString() });
      await middleWare(req, res, next);
      const captchas = await CaptchaModel.get();
      expect(captchas.length).toBe(0);
    });

    it('should look for the captcha in the headers', async () => {
      const middleWare = captchaMiddleware();
      getMock.mockImplementation(
        (key: string) =>
          (<{ [key: string]: string }>{
            'Captcha-text': 'k0n2170',
            'Captcha-id': captchaId.toString(),
          })[key]
      );

      await middleWare(req, res, next);

      expect(res.status).not.toHaveBeenCalled();
      expect(res.json).not.toHaveBeenCalled();
      expect(next).toHaveBeenCalled();
    });
  });
});
