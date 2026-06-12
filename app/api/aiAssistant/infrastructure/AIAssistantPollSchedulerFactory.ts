import type { AIAssistantPollScheduler } from '../application/contracts/AIAssistantPollScheduler.js';
import { defaultAIAssistantPollScheduler } from './AIAssistantJobScheduler.js';

class AIAssistantPollSchedulerFactory {
  static createDefault(): AIAssistantPollScheduler {
    return defaultAIAssistantPollScheduler;
  }
}

export { AIAssistantPollSchedulerFactory };
