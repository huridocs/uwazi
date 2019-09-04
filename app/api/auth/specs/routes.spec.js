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
    routes = instrumentRoutes(authRoutes);
    await db.clearAllAndLoad(fixtures);
  });

  afterAll((done) => {
    db.disconnect().then(done);
  });

  describe('/login', () => {
    beforeEach(() => {
      app = express();
      app.use(bodyParser.json());
      authRoutes(app);
    });

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
      await request(app)
      .post('/api/login')
      .send({ username: 'oldUser', password: 'badPassword' })
      .expect(401);
    });

    it('should login succesfully with bcrypt', async () => {
      await request(app)
      .post('/api/login')
      .send({ username: 'newUser', password: 'newPassword' })
      .expect(200);
    });

    it('should fail properly with bcrypt', async () => {
      await request(app)
      .post('/api/login')
      .send({ username: 'newUser', password: 'badPassword' })
      .expect(401);
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
      spyOn(svgCaptcha, 'createMathExpr').and.returnValue({ data: 'captchaImage', text: 42 });
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
      backend
      .get('http://secret.place.io/captcha', { body: stream, headers: { 'set-cookie': ['connect.ssid: 12n32ndi23j4hsj;'] } }, { sendAsJson: false });
    });

    it('should return the captcha and store its value in session', async () => {
      const req = { session: {} };
      const response = await routes.get('/remotecaptcha', req);
      expect(req.session.remotecookie).toBe('connect.ssid: 12n32ndi23j4hsj;');
      expect(response).toBe('captchaImage');
    });
  });
});
