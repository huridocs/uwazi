import type { Request, Response, NextFunction } from 'express';
import { SettingsQueryServiceFactory } from '#api/core/infrastructure/factories/SettingsQueryServiceFactory.js';

const serviceMiddleware = async (_req: Request, res: Response, next: NextFunction) => {
  const { features } = await SettingsQueryServiceFactory.default().get();
  if (features?.metadataExtraction?.url) {
    next();
    return;
  }

  res.status(404).send({});
};

export { serviceMiddleware };
