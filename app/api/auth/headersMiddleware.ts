import { Request, Response, NextFunction } from 'express';

export default (req: Request, res: Response, next: NextFunction) => {
  if (req.get('X-Requested-With') === 'XMLHttpRequest') {
    return next();
  }
  res.status(401);
  return res.json({ error: 'Unauthorized', message: 'An expected header was not found' });
};
