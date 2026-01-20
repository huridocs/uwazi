import contact from '#api/contact/contact.js';
import { captchaAuthorization } from '#api/auth/index.js';
import { validation } from '#api/utils/index.js';

export default app => {
  app.post(
    '/api/contact',
    captchaAuthorization(),
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
