import type { Request, Response, NextFunction } from 'express';
import { SettingsDataSourceFactory } from '#api/core/infrastructure/factories/SettingsDataSourceFactory.js';

const serviceMiddleware = async (_req: Request, res: Response, next: NextFunction) => {
  const metadataExtraction =
    await SettingsDataSourceFactory.default().readFeature('metadataExtraction');
  if (metadataExtraction?.url) {
    next();
    return;
  }

  res.status(404).send({});
};

export { serviceMiddleware };
