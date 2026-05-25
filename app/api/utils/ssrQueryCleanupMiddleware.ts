import type { NextFunction, Request, Response } from 'express';

export const ssrQueryCleanupMiddleware = (
  req: Request,
  _res: Response,
  next: NextFunction
) => {
  if (Object.prototype.hasOwnProperty.call(req.query, 'ssr')) {
    const { ssr: _ssr, ...query } = req.query as Record<string, unknown>;
    req.query = query;
  }

  next();
};
