import { SendAIAssistantMessage } from '../application/SendAIAssistantMessage.js';
import { AIAssistantJobScheduler } from './AIAssistantJobScheduler.js';
import { AIAssistantServiceFactory } from './AIAssistantServiceFactory.js';
import { AIAssistantPollRequestJob } from './jobs/AIAssistantPollRequestJob.js';
import { DefaultDispatcher } from '#api/core/libs/queue/configuration/factories.js';
import { ExecutionContext } from '#api/core/libs/ExecutionContext.js';

class AIAssistantFactory {
  static createSendMessage() {
    return new SendAIAssistantMessage({
      aiAssistantService: AIAssistantServiceFactory.createDefault(),
      pollScheduler: new AIAssistantJobScheduler({
        dispatcher: DefaultDispatcher(
          ExecutionContext.tenant.name,
          ExecutionContext.transactionManager,
          {
            lockWindow: 10_000,
            maxRetries: 60,
          }
        ),
      }),
    });
  }

  static createPollRequestJob() {
    return new AIAssistantPollRequestJob({
      aiAssistantService: AIAssistantServiceFactory.createDefault(),
      pollScheduler: new AIAssistantJobScheduler({
        dispatcher: DefaultDispatcher(
          ExecutionContext.tenant.name,
          ExecutionContext.transactionManager,
          {
            lockWindow: 10_000,
            maxRetries: 60,
          }
        ),
      }),
    });
  }
}

export { AIAssistantFactory };
