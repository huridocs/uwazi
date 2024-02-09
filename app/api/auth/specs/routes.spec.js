import express from 'express';
import bodyParser from 'body-parser';
import request from 'supertest';

import db from 'api/utils/testing_db';

import users from 'api/users/users';
import svgCaptcha from 'svg-captcha';
import backend from 'fetch-mock';
import { CaptchaModel } from '../CaptchaModel';
import authRoutes from '../routes';
import fixtures from './fixtures.js';
import instrumentRoutes from '../../utils/instrumentRoutes';
import { comparePasswords } from '../encryptPassword';

describe('Auth Routes', () => {
  let routes;
  let app;

  beforeEach(async () => {
    await db.setupFixturesAndContext(fixtures);
    routes = instrumentRoutes(authRoutes);
  });

  afterAll(async () => {
    await db.disconnect();
  });

  describe('/login', () => {
    beforeEach(() => {
      app = express();
      app.use(bodyParser.json());
      authRoutes(app);
    });

    const expectNextOnError = async username => {
      const req = { body: { username, password: 'badPassword' }, get: () => {} };
      const next = jest.fn();
      try {
        await routes.post('/api/login', req, {}, next);
      } catch (err) {
        expect(next.mock.calls[0][0].code).toBe(401);
        expect(next.mock.calls[0][0].message).toMatch(/invalid username or password/i);
      }
    };

    it('should have a validation schema', async () => {
      const req = { body: { username: 'oldUser', password: 'badPassword' }, get: () => {} };
      await request(app).post('/api/login').send(req.body).expect(500);
    });

    it('should login succesfully with sha256', async () => {
      await request(app)
        .post('/api/login')
        .send({ username: 'oldUser', password: 'oldPassword' })
        .expect(200);
    });

    it('should fail properly with sha256', async () => {
      await expectNextOnError('oldUser');
    });

    it('should login succesfully with bcrypt', async () => {
      const res = await request(app)
        .post('/api/login')
        .send({ username: 'newUser', password: 'newPassword' });

      expect(res.statusCode).toBe(200);
    });

    it('should fail properly with bcrypt', async () => {
      await expectNextOnError('newUser');
    });

    describe('when loging in with old encryption', () => {
      it('should reencrypt the password using bcrypt', async () => {
        await request(app)
          .post('/api/login')
          .send({ username: 'oldUser', password: 'oldPassword' })
          .expect(200);

        const [oldUser] = await users.get({ username: 'oldUser' }, '+password');
        const passwordHasBeenChanged = await comparePasswords('oldPassword', oldUser.password);
        expect(passwordHasBeenChanged).toBe(true);
      });
    });
  });

  describe('/captcha', () => {
    it('should return the captcha and store its value', async () => {
      jest.spyOn(svgCaptcha, 'create').mockReturnValue({ data: 'captchaSvg', text: '42' });
      const req = { session: {} };
      const response = await routes.get('/api/captcha', req);

      expect(response.svg).toBe('captchaSvg');
      expect(response.id).toBeDefined();

      const captchas = await CaptchaModel.get();
      expect(captchas[0].text).toBe('42');
    });
  });

  describe('/remotecaptcha', () => {
    beforeEach(() => {
      backend.restore();
      backend.get('http://secret.place.io/api/captcha', { text: 'captchaSvg', id: '123' });
    });

    it('should return the captcha', async () => {
      const req = { session: {} };
      const response = await routes.get('/api/remotecaptcha', req);
      expect(response).toEqual({ text: 'captchaSvg', id: '123' });
    });
  });
});
