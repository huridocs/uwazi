import contact from './contact';
import { captchaAuthorization } from '../auth';
import { validation } from '../utils';
import { parseBody } from 'api/utils/parseBodyMiddleware';

export default app => {
  app.post(
    '/api/contact',
    captchaAuthorization(),
    parseBody(),
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
