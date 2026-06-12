import { SendAIAssistantMessage } from '../../application/SendAIAssistantMessage.js';
import { AIAssistantPollSchedulerFactory } from '../AIAssistantPollSchedulerFactory.js';
import { AIAssistantServiceFactory } from '../AIAssistantServiceFactory.js';

class SendAIAssistantMessageFactory {
  static createDefault() {
    return new SendAIAssistantMessage({
      aiAssistantService: AIAssistantServiceFactory.createDefault(),
      pollScheduler: AIAssistantPollSchedulerFactory.createDefault(),
    });
  }
}

export { SendAIAssistantMessageFactory };
