import { CancelAIAssistantConversation } from '../../application/CancelAIAssistantConversation.js';
import { AIAssistantPollSchedulerFactory } from '../AIAssistantPollSchedulerFactory.js';
import { AIAssistantServiceFactory } from '../AIAssistantServiceFactory.js';

class CancelAIAssistantConversationFactory {
  static createDefault() {
    return new CancelAIAssistantConversation({
      aiAssistantService: AIAssistantServiceFactory.createDefault(),
      pollScheduler: AIAssistantPollSchedulerFactory.createDefault(),
    });
  }
}

export { CancelAIAssistantConversationFactory };
