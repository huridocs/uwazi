import { Request, Response, NextFunction } from 'express';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { User } from '../users/usersModel';

declare global {
  namespace Express {
    export interface Request {
      user: User;
    }
  }
}

export default function(roles = ['admin']) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (
      req.user &&
      roles.includes(req.user.role || '') &&
      req.get('X-Requested-With') === 'XMLHttpRequest'
    ) {
      return next();
    }
    res.status(401);
    return res.json({ error: 'Unauthorized', message: 'Unauthorized' });
  };
}
