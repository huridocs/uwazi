import { Request, Response, NextFunction } from 'express';

export default (req: Request, res: Response, next: NextFunction) => {
  if (!['POST', 'DELETE', 'PUT'].includes(req.method)) {
    return next();
  }
  if (req.get('X-Requested-With') === 'XMLHttpRequest') {
    return next();
  }
  res.status(403);
  return res.json({
    error: 'Forbidden',
    message: 'X-Requested-With header was not sent!',
  });
};
