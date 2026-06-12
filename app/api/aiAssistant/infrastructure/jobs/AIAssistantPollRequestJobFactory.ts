import { PollAIAssistantRequest } from '../../application/PollAIAssistantRequest.js';
import { AIAssistantPollSchedulerFactory } from '../AIAssistantPollSchedulerFactory.js';
import { AIAssistantServiceFactory } from '../AIAssistantServiceFactory.js';
import { AIAssistantPollRequestJob } from './AIAssistantPollRequestJob.js';

class AIAssistantPollRequestJobFactory {
  static createDefault() {
    return new AIAssistantPollRequestJob({
      pollUseCase: new PollAIAssistantRequest({
        aiAssistantService: AIAssistantServiceFactory.createDefault(),
      }),
      pollScheduler: AIAssistantPollSchedulerFactory.createDefault(),
    });
  }
}

export { AIAssistantPollRequestJobFactory };
