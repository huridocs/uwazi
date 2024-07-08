import { Application } from 'express';
import needsAuthorization from 'api/auth/authMiddleware';

// eslint-disable-next-line import/no-default-export
export default (app: Application) => {
  app.get('/api/_testing_errors', needsAuthorization(['admin']), async () => {
    throw new Error('This is a test error');
  });
};
