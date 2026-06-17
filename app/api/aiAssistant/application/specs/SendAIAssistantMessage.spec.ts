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
      sessionId: 'session-1',
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
    expect(pollScheduler.schedulePoll).toHaveBeenCalledWith(
      {
        sessionId: 'session-1',
        jobId: 'job-42',
      },
      0
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
      sessionId: 'session-1',
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
