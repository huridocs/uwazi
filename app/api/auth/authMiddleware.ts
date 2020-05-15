import { Request, Response, NextFunction } from 'express';

declare global {
  namespace Express {
    export interface Request {
      user: import('../users/usersModel').User;
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
