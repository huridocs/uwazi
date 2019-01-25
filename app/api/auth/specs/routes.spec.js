import express from 'express';
import bodyParser from 'body-parser';
import request from 'supertest';

import db from 'api/utils/testing_db';

import authRoutes from '../routes';
import users from 'api/users/users';
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
});
