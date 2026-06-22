import type { Application } from 'express';

import needsAuthorization from '#api/auth/authMiddleware.js';
import { PublishPageReleaseController } from './PublishPageReleaseController.js';
import { RestorePageDraftController } from './RestorePageDraftController.js';
import { PublicGetPageController } from './PublicGetPageController.js';

const pagesV2Routes = (app: Application) => {
  app.get('/api/public/page', PublicGetPageController.createHandler());

  app.post(
    '/api/pages/release',
    needsAuthorization(['admin']),
    PublishPageReleaseController.createHandler()
  );

  app.post(
    '/api/pages/restore',
    needsAuthorization(['admin']),
    RestorePageDraftController.createHandler()
  );
};

export { pagesV2Routes };
