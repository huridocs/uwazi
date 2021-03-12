import request from 'supertest';
import { testingDB } from 'api/utils/testing_db';
import { setUpApp } from 'api/utils/testingRoutes';
import contactRoutes from '../routes.js';
import contact from '../contact';

jest.mock('../../utils/languageMiddleware.ts', () => (_req, _res, next) => {
  next();
});

describe('contact', () => {
  const app = setUpApp(contactRoutes);

  beforeAll(async () => {
    await testingDB.connect();
  });

  afterAll(async () => {
    await testingDB.disconnect();
  });

  describe('POST', () => {
    let body;
    beforeEach(() => {
      body = { name: 'Bruce Wayne', email: 'notbatman@wayne.com', message: 'I want to donate!' };
    });

    it('should send an email', async () => {
      spyOn(contact, 'sendMessage').and.returnValue(Promise.resolve());
      const response = await request(app)
        .post('/api/contact')
        .send(body);
      expect(response.text).toContain('ok');
      expect(contact.sendMessage).toHaveBeenCalledWith(body);
    });

    it('should next with error if sending email failed', async () => {
      spyOn(contact, 'sendMessage').and.callFake(() => Promise.reject());
      const response = await request(app)
        .post('/api/contact')
        .send(body);
      expect(response.status).not.toBe(200);
    });

    describe('validation', () => {
      it('should not validate with missing requried properties properties', async () => {
        body = {};
        const response = await request(app)
          .post('/api/contact')
          .send(body);
        expect(response.text).toContain('validation failed');
      });

      it('should be an e-mail', async () => {
        body.email = 'wrong format';
        const response = await request(app)
          .post('/api/contact')
          .send(body);
        expect(response.text).toContain('validation failed');
      });
    });
  });
});
