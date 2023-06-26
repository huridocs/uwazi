import { parseQuery, validation } from 'api/utils';
import { userSchema } from 'shared/types/userSchema';
import needsAuthorization from '../auth/authMiddleware';
import users from './users';

const getDomain = req => `${req.protocol}://${req.get('host')}`;
export default app => {
  app.post(
    '/api/users',
    needsAuthorization(['admin', 'editor', 'collaborator']),
    validation.validateRequest({
      type: 'object',
      properties: {
        body: userSchema,
      },
      required: ['body'],
    }),

    (req, res, next) => {
      users
        .save(req.body, req.user, getDomain(req))
        .then(response => res.json(response))
        .catch(next);
    }
  );

  app.post(
    '/api/users/new',
    needsAuthorization(),
    validation.validateRequest({
      type: 'object',
      properties: {
        body: userSchema,
      },
      required: ['body'],
    }),
    (req, res, next) => {
      users
        .newUser(req.body, getDomain(req))
        .then(response => res.json(response))
        .catch(next);
    }
  );

  app.post(
    '/api/users/unlock',
    needsAuthorization(),
    validation.validateRequest({
      type: 'object',
      properties: {
        body: {
          type: 'object',
          additionalProperties: false,
          properties: {
            _id: { type: 'string' },
          },
          required: ['_id'],
        },
      },
      required: ['body'],
    }),
    (req, res, next) => {
      users
        .simpleUnlock(req.body._id)
        .then(() => res.json('OK'))
        .catch(next);
    }
  );

  app.post(
    '/api/unlockaccount',
    validation.validateRequest({
      type: 'object',
      properties: {
        body: {
          type: 'object',
          properties: {
            username: { type: 'string' },
            code: { type: 'string' },
          },
          required: ['username', 'code'],
        },
      },
      required: ['body'],
    }),
    (req, res, next) => {
      users
        .unlockAccount(req.body)
        .then(() => res.json('OK'))
        .catch(next);
    }
  );

  app.post(
    '/api/recoverpassword',
    validation.validateRequest({
      type: 'object',
      properties: {
        body: {
          type: 'object',
          properties: {
            email: { type: 'string', minLength: 3 },
          },
          required: ['email'],
        },
      },
      required: ['body'],
    }),
    (req, res, next) => {
      users
        .recoverPassword(req.body.email, getDomain(req))
        .then(() => res.json('OK'))
        .catch(next);
    }
  );

  app.post(
    '/api/resetpassword',
    validation.validateRequest({
      type: 'object',
      properties: {
        body: {
          type: 'object',
          properties: {
            key: { type: 'string' },
            password: { type: 'string' },
          },
          required: ['key', 'password'],
        },
      },
      required: ['body'],
    }),
    (req, res, next) => {
      users
        .resetPassword(req.body)
        .then(response => res.json(response))
        .catch(next);
    }
  );

  app.get('/api/users', needsAuthorization(), (_req, res, next) => {
    users
      .get({}, '+groups +failedLogins +accountLocked')
      .then(response => res.json(response))
      .catch(next);
  });

  app.delete(
    '/api/users',
    needsAuthorization(),
    parseQuery,
    validation.validateRequest({
      type: 'object',
      properties: {
        query: {
          type: 'object',
          additionalProperties: false,
          required: ['ids'],
          properties: {
            ids: { oneOf: [{ type: 'string' }, { type: 'array', items: { type: 'string' } }] },
          },
        },
      },
      required: ['query'],
    }),
    (req, res, next) => {
      const { ids } = req.query;
      const idsArray = Array.isArray(ids) ? ids : [ids];
      users
        .delete(idsArray, req.user)
        .then(response => res.json(response))
        .catch(next);
    }
  );
};
