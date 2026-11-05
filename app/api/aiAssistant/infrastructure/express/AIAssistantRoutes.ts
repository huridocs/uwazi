import type { Application } from 'express';
import { needsAuthorization } from '#api/auth/index.js';
import { featureFlagEnabled } from '#api/utils/featureFlagEnabledMiddleware.js';
import { ClearAIAssistantConversationController } from './ClearAIAssistantConversationController.js';
import { ConfirmAIAssistantToolController } from './ConfirmAIAssistantToolController.js';
import { GetAIAssistantSettingsController } from './GetAIAssistantSettingsController.js';
import { SaveAIAssistantSettingsController } from './SaveAIAssistantSettingsController.js';
import { SendAIAssistantMessageController } from './SendAIAssistantMessageController.js';

const loggedIn = needsAuthorization(['admin', 'editor', 'collaborator']);
const adminOnly = needsAuthorization();

const aiAssistantRoutes = (app: Application) => {
  app.get(
    '/api/aiAssistant/settings',
    loggedIn,
    featureFlagEnabled('aiAssistant'),
    GetAIAssistantSettingsController.createHandler()
  );

  app.post(
    '/api/aiAssistant/settings',
    adminOnly,
    featureFlagEnabled('aiAssistant'),
    SaveAIAssistantSettingsController.createHandler()
  );

  app.post(
    '/api/aiAssistant/messages',
    loggedIn,
    featureFlagEnabled('aiAssistant'),
    SendAIAssistantMessageController.createHandler()
  );

  app.post(
    '/api/aiAssistant/confirm',
    loggedIn,
    featureFlagEnabled('aiAssistant'),
    ConfirmAIAssistantToolController.createHandler()
  );

  app.post(
    '/api/aiAssistant/conversations/clear',
    loggedIn,
    featureFlagEnabled('aiAssistant'),
    ClearAIAssistantConversationController.createHandler()
  );
};

export { aiAssistantRoutes };
