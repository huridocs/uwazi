import type { AIAssistantPollScheduler } from '../contracts/AIAssistantPollScheduler.js';
import { SendAIAssistantMessage } from '../SendAIAssistantMessage.js';
import type { AIAssistantService } from '../contracts/AIAssistantService.js';

describe('SendAIAssistantMessage', () => {
  it('should submit the message and schedule the first poll', async () => {
    const aiAssistantService: AIAssistantService = {
      submitMessage: jest.fn().mockResolvedValue({ jobId: 'job-42' }),
      getJobStatus: jest.fn(),
    };

    const pollScheduler: AIAssistantPollScheduler = {
      schedulePoll: jest.fn(),
    };

    const useCase = new SendAIAssistantMessage({ aiAssistantService, pollScheduler });

    const result = await useCase.execute({
      tenantName: 'default',
      userId: 'user-1',
      message: 'Hello',
      credentials: {
        url: 'http://localhost',
        username: 'admin',
        password: 'secret',
      },
    });

    expect(result).toEqual({ jobId: 'job-42' });
    expect(aiAssistantService.submitMessage).toHaveBeenCalledWith({
      message: 'Hello',
      credentials: {
        url: 'http://localhost',
        username: 'admin',
        password: 'secret',
      },
      jobId: undefined,
    });
    expect(pollScheduler.schedulePoll).toHaveBeenCalledWith({ jobId: 'job-42' }, 0);
  });

  it('should start an in-process LLM turn when the provider is not Bert', async () => {
    const startLlmTurn = jest.fn().mockResolvedValue(undefined);
    const useCase = new SendAIAssistantMessage({
      aiAssistantService: {
        submitMessage: jest.fn(),
        getJobStatus: jest.fn(),
      },
      pollScheduler: { schedulePoll: jest.fn() },
      getSettings: {
        execute: jest.fn().mockResolvedValue({ provider: 'openai_compat' }),
      } as any,
      startLlmTurn,
    });

    const actor = { _id: 'user-1', role: 'editor' } as any;
    const result = await useCase.execute({
      tenantName: 'default',
      userId: 'user-1',
      message: 'List templates',
      actor,
      language: 'en',
      sessionId: 'sid',
      protocol: 'http',
      instanceHost: 'localhost',
    });

    expect(result.jobId).toEqual(expect.any(String));
    expect(startLlmTurn).toHaveBeenCalledWith(
      expect.objectContaining({
        conversationId: result.jobId,
        message: 'List templates',
        actor,
        sessionId: 'sid',
      })
    );
  });

  it('should continue an existing conversation when conversationJobId is provided', async () => {
    const aiAssistantService: AIAssistantService = {
      submitMessage: jest.fn().mockResolvedValue({ jobId: 'job-42' }),
      getJobStatus: jest.fn(),
    };

    const pollScheduler: AIAssistantPollScheduler = {
      schedulePoll: jest.fn(),
    };

    const useCase = new SendAIAssistantMessage({ aiAssistantService, pollScheduler });

    await useCase.execute({
      tenantName: 'default',
      userId: 'user-1',
      message: 'Follow up',
      conversationJobId: 'job-42',
      credentials: {
        url: 'http://localhost',
        username: 'admin',
        password: 'secret',
      },
    });

    expect(aiAssistantService.submitMessage).toHaveBeenCalledWith(
      expect.objectContaining({ jobId: 'job-42' })
    );
  });
});
