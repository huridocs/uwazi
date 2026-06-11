import type { Application } from 'express';
import { needsAuthorization } from '#api/auth/index.js';
import { featureFlagEnabled } from '#api/utils/featureFlagEnabledMiddleware.js';
import { SendAIAssistantMessageController } from './SendAIAssistantMessageController.js';
import { CancelAIAssistantConversationController } from './CancelAIAssistantConversationController.js';

const aiAssistantRoutes = (app: Application) => {
  app.post(
    '/api/aiAssistant/messages',
    needsAuthorization(['admin', 'editor', 'collaborator']),
    featureFlagEnabled('aiAssistant'),
    SendAIAssistantMessageController.createHandler()
  );

  app.post(
    '/api/aiAssistant/conversation/cancel',
    needsAuthorization(['admin', 'editor', 'collaborator']),
    featureFlagEnabled('aiAssistant'),
    CancelAIAssistantConversationController.createHandler()
  );
};

export { aiAssistantRoutes };
