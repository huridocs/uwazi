import { testingEnvironment } from '#api/utils/testingEnvironment.js';
import backend from 'fetch-mock';
import svgCaptcha from 'svg-captcha';
import instrumentRoutes from '../../utils/instrumentRoutes.js';
import { CaptchaModel } from '../CaptchaModel.js';
import authRoutes from '../routes.js';
import fixtures from './fixtures.js';

describe('Auth Routes', () => {
  let routes;

  beforeEach(async () => {
    await testingEnvironment.setUp(fixtures);
    routes = instrumentRoutes(authRoutes);
  });

  afterAll(async () => {
    await testingEnvironment.tearDown();
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
