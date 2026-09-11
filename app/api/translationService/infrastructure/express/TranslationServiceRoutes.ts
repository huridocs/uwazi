import type { Application } from 'express';
import { needsAuthorization } from '#api/auth/index.js';
import { featureFlagEnabled } from '#api/utils/featureFlagEnabledMiddleware.js';
import { RequestTranslationController } from './RequestTranslationController.js';

const translationServiceRoutes = (app: Application) => {
  app.post(
    '/api/translationService',
    needsAuthorization(['admin', 'editor', 'collaborator']),
    featureFlagEnabled('translationService'),
    RequestTranslationController.createHandler()
  );
};

export { translationServiceRoutes };
