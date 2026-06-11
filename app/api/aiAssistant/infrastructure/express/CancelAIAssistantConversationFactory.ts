import { CancelAIAssistantConversation } from '../../application/CancelAIAssistantConversation.js';
import { AIAssistantServiceFactory } from '../AIAssistantServiceFactory.js';

class CancelAIAssistantConversationFactory {
  static createDefault() {
    return new CancelAIAssistantConversation({
      aiAssistantService: AIAssistantServiceFactory.createDefault(),
    });
  }
}

export { CancelAIAssistantConversationFactory };
