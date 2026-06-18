import type { Application } from 'express';
import needsAuthorization from '#api/auth/authMiddleware.js';

export const userRoutes = (app: Application) => {
  // app.get('/api/users', needsAuthorization(), GetUserByIdController.createHandler());
};
