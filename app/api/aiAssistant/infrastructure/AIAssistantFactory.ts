import { CancelAIAssistantConversation } from '../application/CancelAIAssistantConversation.js';
import { SendAIAssistantMessage } from '../application/SendAIAssistantMessage.js';
import { defaultAIAssistantPollScheduler } from './AIAssistantJobScheduler.js';
import { AIAssistantServiceFactory } from './AIAssistantServiceFactory.js';
import { AIAssistantPollRequestJob } from './jobs/AIAssistantPollRequestJob.js';

class AIAssistantFactory {
  static createSendMessage() {
    return new SendAIAssistantMessage({
      aiAssistantService: AIAssistantServiceFactory.createDefault(),
      pollScheduler: defaultAIAssistantPollScheduler,
    });
  }

  static createCancelConversation() {
    return new CancelAIAssistantConversation({
      aiAssistantService: AIAssistantServiceFactory.createDefault(),
      pollScheduler: defaultAIAssistantPollScheduler,
    });
  }

  static createPollRequestJob() {
    return new AIAssistantPollRequestJob({
      aiAssistantService: AIAssistantServiceFactory.createDefault(),
      pollScheduler: defaultAIAssistantPollScheduler,
    });
  }
}

export { AIAssistantFactory };
