import express from 'express';
import bodyParser from 'body-parser';
import request from 'supertest';

import db from 'api/utils/testing_db';

import users from 'api/users/users';
import svgCaptcha from 'svg-captcha';
import backend from 'fetch-mock';
import { Readable } from 'stream';
import authRoutes from '../routes';
import fixtures from './fixtures.js';
import instrumentRoutes from '../../utils/instrumentRoutes';
import { comparePasswords } from '../encryptPassword';

describe('Auth Routes', () => {
  let routes;
  let app;

  beforeEach(async () => {
    await db.clearAllAndLoad(fixtures);
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
      const next = jasmine.createSpy('next');
      try {
        await routes.post('/api/login', req, {}, next);
      } catch (err) {
        expect(next.calls.mostRecent().args[0].code).toBe(401);
        expect(next.calls.mostRecent().args[0].message).toMatch(/invalid username or password/i);
      }
    };

    it('should have a validation schema', () => {
      expect(routes.post.validation('/api/login')).toMatchSnapshot();
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
    it('should return the captcha and store its value in session', async () => {
      spyOn(svgCaptcha, 'create').and.returnValue({ data: 'captchaImage', text: 42 });
      const req = { session: {} };
      const response = await routes.get('/captcha', req);
      expect(req.session.captcha).toBe(42);
      expect(response).toBe('send:captchaImage');
    });
  });

  describe('/remotecaptcha', () => {
    beforeEach(() => {
      const stream = new Readable();
      stream.push('captchaImage');
      stream.push(null);
      backend.restore();
      backend.get(
        'http://secret.place.io/captcha',
        { body: stream, headers: { 'set-cookie': ['connect.ssid: 12n32ndi23j4hsj;'] } },
        { sendAsJson: false }
      );
    });

    it('should return the captcha and store its value in session', async () => {
      const req = { session: {} };
      const response = await routes.get('/remotecaptcha', req);
      expect(req.session.remotecookie).toBe('connect.ssid: 12n32ndi23j4hsj;');
      expect(response).toBe('captchaImage');
    });
  });
});
