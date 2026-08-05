import type { Application } from 'express';
import { needsAuthorization } from '#api/auth/index.js';
import { featureFlagEnabled } from '#api/utils/featureFlagEnabledMiddleware.js';
import { SendAIAssistantMessageController } from './SendAIAssistantMessageController.js';

const aiAssistantRoutes = (app: Application) => {
  app.post(
    '/api/aiAssistant/messages',
    needsAuthorization(['admin', 'editor', 'collaborator']),
    featureFlagEnabled('aiAssistant'),
    SendAIAssistantMessageController.createHandler()
  );
};

export { aiAssistantRoutes };
