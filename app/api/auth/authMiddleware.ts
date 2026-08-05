import type { Request, Response, NextFunction } from 'express';
import { User } from '#api/users/usersModel.js';
import { UserSchema } from '#shared/types/userType.js';

declare global {
  namespace Express {
    export interface Request {
      user: User & { groups?: UserSchema['groups'] };
    }
  }
}

export default (roles = ['admin']) =>
  (req: Request, res: Response, next: NextFunction) => {
    if (req.user && roles.includes(req.user.role || '')) {
      return next();
    }
    res.status(401);
    return res.json({ error: 'Unauthorized', message: 'Unauthorized' });
  };
