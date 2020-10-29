import { Request, Response, NextFunction } from 'express';

export default () => (_req: Request, res: Response, next: NextFunction) => {
  console.log('here');

  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  next();
};
