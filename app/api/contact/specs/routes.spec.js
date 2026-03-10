import request from 'supertest';
import { setUpApp } from 'api/utils/testingRoutes';
import { testingEnvironment } from 'api/utils/testingEnvironment';
import contactRoutes from '../routes.js';
import contact from '../contact';

jest.mock('../../utils/languageMiddleware.ts', () => (_req, _res, next) => {
  next();
});

jest.mock('../../auth/captchaMiddleware.ts', () => () => (_req, _res, next) => {
  next();
});

describe('contact', () => {
  const app = setUpApp(contactRoutes);

  beforeAll(async () => {
    await testingEnvironment.setTenant();
    testingEnvironment.setRequestId();
  });

  afterAll(async () => {
    await testingEnvironment.tearDown();
  });

  describe('POST', () => {
    let body;
    beforeEach(() => {
      body = { name: 'Bruce Wayne', email: 'notbatman@wayne.com', message: 'I want to donate!' };
    });

    it('should send an email', async () => {
      jest.spyOn(contact, 'sendMessage').mockImplementation(async () => Promise.resolve());
      const response = await request(app).post('/api/contact').send(body);
      expect(response.text).toContain('ok');
      expect(contact.sendMessage).toHaveBeenCalledWith(body);
    });

    it('should next with error if sending email failed', async () => {
      jest.spyOn(contact, 'sendMessage').mockImplementation(() => Promise.reject());
      const response = await request(app).post('/api/contact').send(body);
      expect(response.status).not.toBe(200);
    });

    describe('validation', () => {
      it('should not validate with missing requried properties properties', async () => {
        body = {};
        const response = await request(app).post('/api/contact').send(body);
        expect(response.text).toContain('validation failed');
      });

      it('should be an e-mail', async () => {
        body.email = 'wrong format';
        const response = await request(app).post('/api/contact').send(body);
        expect(response.text).toContain('validation failed');
      });
    });
  });
});
