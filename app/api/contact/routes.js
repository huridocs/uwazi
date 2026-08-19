import contact from './contact.js';
import { captchaMiddleware } from '../core/infrastructure/express/captcha/CaptchaMiddleware.js';
import { validation } from '../utils/index.js';

export default app => {
  app.post(
    '/api/contact',
    captchaMiddleware(),
    validation.validateRequest({
      type: 'object',
      properties: {
        body: {
          type: 'object',
          properties: {
            email: { type: 'string', format: 'email' },
            name: { type: 'string', minLength: 3 },
            message: { type: 'string', minLength: 5 },
          },
          required: ['email', 'name', 'message'],
        },
      },
    }),
    async (req, res, next) => {
      try {
        await contact.sendMessage(req.body);
        res.json('ok');
      } catch (err) {
        next(err);
      }
    }
  );
};
