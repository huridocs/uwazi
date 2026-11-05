import { ExecutionContext } from '#api/core/libs/ExecutionContext.js';
import { SettingsDataSourceFactory } from '#api/core/infrastructure/factories/SettingsDataSourceFactory.js';
import type { AIAssistantService } from '../application/contracts/AIAssistantService.js';
import { ConfirmAIAssistantTool } from '../application/ConfirmAIAssistantTool.js';
import { GetAIAssistantSettings } from '../application/GetAIAssistantSettings.js';
import { SaveAIAssistantSettings } from '../application/SaveAIAssistantSettings.js';
import { SendAIAssistantMessage } from '../application/SendAIAssistantMessage.js';
import type { AgentLoopInput } from '../application/runtime/AgentLoop.js';
import { AgentLoop } from '../application/runtime/AgentLoop.js';
import { defaultConfirmationGate } from '../application/runtime/ConfirmationGate.js';
import { defaultConversationStore } from '../application/runtime/ConversationStore.js';
import { getToolRegistry } from '../application/tools/ToolRegistry.js';
import { AIAssistantJobScheduler } from './AIAssistantJobScheduler.js';
import { AIAssistantServiceFactory } from './AIAssistantServiceFactory.js';
import { LlmProviderFactory } from './providers/LlmProviderFactory.js';
import { SessionNotifier } from './SessionNotifier.js';
import { AIAssistantPollRequestJob } from './jobs/AIAssistantPollRequestJob.js';

class AIAssistantFactory {
  static createGetSettings() {
    return new GetAIAssistantSettings({
      settingsDataSource: SettingsDataSourceFactory.default(),
    });
  }

  static createSaveSettings() {
    return new SaveAIAssistantSettings({
      settingsDataSource: SettingsDataSourceFactory.default(),
    });
  }

  static createConfirmTool() {
    return new ConfirmAIAssistantTool({
      confirmationGate: defaultConfirmationGate,
    });
  }

  static clearConversation(conversationId: string) {
    defaultConversationStore.clear(conversationId);
  }

  static createSendMessage() {
    const getSettings = AIAssistantFactory.createGetSettings();

    return new SendAIAssistantMessage({
      aiAssistantService: AIAssistantFactory.lazyBertService(),
      pollScheduler: new AIAssistantJobScheduler({
        dispatcher: ExecutionContext.jobsDispatcher,
      }),
      getSettings,
      startLlmTurn: async input => AIAssistantFactory.startLlmTurn(input, getSettings),
    });
  }

  static createPollRequestJob() {
    return new AIAssistantPollRequestJob({
      aiAssistantService: AIAssistantServiceFactory.createDefault(),
      pollScheduler: new AIAssistantJobScheduler({
        dispatcher: ExecutionContext.jobsDispatcher,
      }),
      sessionId: ExecutionContext.sessionId,
    });
  }

  private static lazyBertService(): AIAssistantService {
    return {
      submitMessage: async input => AIAssistantServiceFactory.createDefault().submitMessage(input),
      getJobStatus: async jobId => AIAssistantServiceFactory.createDefault().getJobStatus(jobId),
    };
  }

  private static async startLlmTurn(
    input: AgentLoopInput,
    getSettings: GetAIAssistantSettings
  ): Promise<void> {
    const notifier = new SessionNotifier(input.sessionId);
    try {
      const settings = await getSettings.execute({ includeSecrets: true });
      const loop = new AgentLoop({
        provider: LlmProviderFactory.create(settings),
        tools: getToolRegistry().list(),
        conversationStore: defaultConversationStore,
        confirmationGate: defaultConfirmationGate,
        notifier,
      });
      await loop.run(input);
    } catch (error) {
      notifier.error({
        jobId: input.conversationId,
        error:
          error instanceof Error
            ? error.message
            : 'Bert could not complete your request. Try again.',
      });
    }
  }
}

export { AIAssistantFactory };
