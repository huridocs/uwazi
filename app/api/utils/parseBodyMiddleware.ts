import { Request, Response, NextFunction } from 'express';
import bodyParser from 'body-parser';

export const parseBody = () => (req: Request, res: Response, next: NextFunction) => {
  bodyParser.json({ limit: '5mb' })(req, res, next);
};
