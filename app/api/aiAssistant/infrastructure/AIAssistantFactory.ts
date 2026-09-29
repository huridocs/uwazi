import { SendAIAssistantMessage } from '../application/SendAIAssistantMessage.js';
import { AIAssistantJobScheduler } from './AIAssistantJobScheduler.js';
import { AIAssistantServiceFactory } from './AIAssistantServiceFactory.js';
import { AIAssistantPollRequestJob } from './jobs/AIAssistantPollRequestJob.js';
import { ExecutionContext } from '#api/core/libs/ExecutionContext.js';

class AIAssistantFactory {
  static createSendMessage() {
    return new SendAIAssistantMessage({
      aiAssistantService: AIAssistantServiceFactory.createDefault(),
      pollScheduler: new AIAssistantJobScheduler({
        dispatcher: ExecutionContext.jobsDispatcher,
      }),
    });
  }

  static createPollRequestJob() {
    return new AIAssistantPollRequestJob({
      aiAssistantService: AIAssistantServiceFactory.createDefault(),
      pollScheduler: new AIAssistantJobScheduler({
        dispatcher: ExecutionContext.jobsDispatcher,
      }),
    });
  }
}

export { AIAssistantFactory };
