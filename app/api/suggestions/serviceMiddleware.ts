import { Request, Response, NextFunction } from 'express';
import settings from 'api/settings/settings';

const serviceMiddleware = async (_req: Request, res: Response, next: NextFunction) => {
  const { features } = await settings.get();
  if (features?.metadataExtraction?.url) {
    next();
    return;
  }

  res.status(404).send({});
};

export { serviceMiddleware };
