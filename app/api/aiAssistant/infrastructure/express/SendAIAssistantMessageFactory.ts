import { SendAIAssistantMessage } from '../../application/SendAIAssistantMessage.js';
import { AIAssistantServiceFactory } from '../AIAssistantServiceFactory.js';

class SendAIAssistantMessageFactory {
  static createDefault() {
    return new SendAIAssistantMessage({
      aiAssistantService: AIAssistantServiceFactory.createDefault(),
    });
  }
}

export { SendAIAssistantMessageFactory };
