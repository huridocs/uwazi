import { ObjectId } from 'mongodb';
import type { NextFunction } from 'express';
import db from '#api/utils/testing_db.js';
import { testingEnvironment } from '#api/utils/testingEnvironment.js';
import { testingTenants } from '#api/utils/testingTenants.js';
import { getConnection } from '#api/core/infrastructure/mongodb/common/getConnectionForCurrentTenant.js';
import captchaMiddleware from '../captchaMiddleware.js';
import { CaptchaModel } from '../CaptchaModel.js';
import { ObjectIdSchema } from '../../../shared/types/commonTypes.js';

const getMock = jest.fn().mockReturnValue(undefined);

describe('captchaMiddleware', () => {
  let req: any;
  let res: any;
  let next: NextFunction;
  let captchaId: ObjectIdSchema;

  beforeEach(async () => {
    getMock.mockReset().mockReturnValue(undefined);
    req = { body: {}, session: {}, cookies: {}, get: getMock };
    res = {
      status: jest.fn(),
      json: jest.fn(),
    };
    next = jest.fn();

    captchaId = db.id();

    const fixtures = {
      captchas: [{ _id: captchaId, text: 'k0n2170', createdAt: new Date() }],
    };

    await testingEnvironment.setUp(fixtures);
  });

  afterAll(async () => testingEnvironment.tearDown());

  describe('when v2Captcha is off', () => {
    beforeEach(() => {
      testingTenants.changeCurrentTenant({ domain: 'uwazi', featureFlags: { v2Captcha: false } });
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

  describe('when v2Captcha is on', () => {
    beforeEach(() => {
      testingTenants.changeCurrentTenant({ domain: 'uwazi', featureFlags: { v2Captcha: true } });
    });

    it('should return an error when there is no captcha in the request', async () => {
      const middleWare = captchaMiddleware();
      await testingEnvironment.runWithContext(async () => middleWare(req, res, next));

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({ error: 'Captcha error', message: 'Forbidden' });
      expect(next).not.toHaveBeenCalled();
    });

    it('should return an error when the captcha does not match', async () => {
      const middleWare = captchaMiddleware();
      req.body.captcha = JSON.stringify({ text: '123', id: captchaId.toString() });
      await testingEnvironment.runWithContext(async () => middleWare(req, res, next));

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({ error: 'Captcha error', message: 'Forbidden' });
      expect(next).not.toHaveBeenCalled();
    });

    describe('when the captcha matches', () => {
      it('should call next', async () => {
        const middleWare = captchaMiddleware();
        req.body.captcha = JSON.stringify({ text: 'k0n2170', id: captchaId.toString() });
        await testingEnvironment.runWithContext(async () => middleWare(req, res, next));

        expect(res.status).not.toHaveBeenCalled();
        expect(res.json).not.toHaveBeenCalled();
        expect(next).toHaveBeenCalled();
      });

      it('should delete the captcha from the body', async () => {
        const middleWare = captchaMiddleware();
        req.body.captcha = JSON.stringify({ text: 'k0n2170', id: captchaId.toString() });
        await testingEnvironment.runWithContext(async () => middleWare(req, res, next));

        expect(req.body.captcha).not.toBeDefined();
      });

      it('should delete the captcha from the data base', async () => {
        const middleWare = captchaMiddleware();
        req.body.captcha = JSON.stringify({ text: 'k0n2170', id: captchaId.toString() });
        await testingEnvironment.runWithContext(async () => middleWare(req, res, next));
        const captcha = await getConnection()
          .collection('captchas')
          .findOne({ _id: new ObjectId(captchaId) });
        expect(captcha).toBeNull();
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

        await testingEnvironment.runWithContext(async () => middleWare(req, res, next));

        expect(res.status).not.toHaveBeenCalled();
        expect(res.json).not.toHaveBeenCalled();
        expect(next).toHaveBeenCalled();
      });
    });
  });
});
