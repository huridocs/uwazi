import { getFixturesFactory } from '#api/utils/fixturesFactory.js';
import { testingEnvironment } from '#api/utils/testingEnvironment.js';
import { UserRole } from '#shared/types/userSchema.js';

const fixturesFactory = getFixturesFactory();

const fixtures = {
  settings: [{ languages: [{ key: 'en', label: 'English', default: true }] }],
  users: [fixturesFactory.user('ai-assistant-poll-user', UserRole.EDITOR)],
};

jest.mock('#api/socketio/setupSockets.js', () => ({
  emitToSession: jest.fn(),
}));

jest.mock('#api/aiAssistant/infrastructure/AIAssistantCancellationRegistry.js', () => ({
  AIAssistantCancellationRegistry: {
    isCancelled: jest.fn().mockResolvedValue(false),
  },
}));

import type { AIAssistantPollScheduler } from '#api/aiAssistant/application/contracts/AIAssistantPollScheduler.js';
import { PollAIAssistantRequest } from '#api/aiAssistant/application/PollAIAssistantRequest.js';
import { AIAssistantPollRequestJob } from '../AIAssistantPollRequestJob.js';

const { emitToSession } = jest.requireMock('#api/socketio/setupSockets.js');
const { AIAssistantCancellationRegistry } = jest.requireMock(
  '#api/aiAssistant/infrastructure/AIAssistantCancellationRegistry.js'
);

describe('AIAssistantPollRequestJob', () => {
  beforeAll(async () => {
    await testingEnvironment.setUp(fixtures, 'ai-assistant-poll-request-job');
  });

  afterAll(async () => {
    await testingEnvironment.tearDown();
  });

  const userId = fixtures.users[0]._id!.toString();

  const params = {
    tenantName: 'default',
    userId,
    sessionId: 'session-1',
    jobId: 'job-42',
  };

  const jobInfo = { retryCount: 2, maxRetries: 3, namespace: 'default' };

  const createJob = (overrides: {
    pollUseCase?: PollAIAssistantRequest;
    pollScheduler?: AIAssistantPollScheduler;
  } = {}) => {
    const pollScheduler: AIAssistantPollScheduler = overrides.pollScheduler ?? {
      schedulePoll: jest.fn(),
      cancelPolls: jest.fn(),
    };

    const pollUseCase =
      overrides.pollUseCase ??
      new PollAIAssistantRequest({
        aiAssistantService: {
          submitMessage: jest.fn(),
          getJobStatus: jest.fn().mockResolvedValue({ status: 'pending' }),
          cancelJob: jest.fn(),
        },
      });

    return new AIAssistantPollRequestJob({ pollUseCase, pollScheduler });
  };

  beforeEach(() => {
    jest.clearAllMocks();
    AIAssistantCancellationRegistry.isCancelled.mockResolvedValue(false);
  });

  it('should emit a reply and stop polling when the job is completed', async () => {
    const pollUseCase = new PollAIAssistantRequest({
      aiAssistantService: {
        submitMessage: jest.fn(),
        getJobStatus: jest.fn().mockResolvedValue({
          status: 'completed',
          message: 'Done',
        }),
        cancelJob: jest.fn(),
      },
    });
    const pollScheduler: AIAssistantPollScheduler = {
      schedulePoll: jest.fn(),
      cancelPolls: jest.fn(),
    };

    const job = createJob({ pollUseCase, pollScheduler });
    await job.handleDispatch(jest.fn(), params, jobInfo);

    expect(emitToSession).toHaveBeenCalledWith('session-1', 'aiAssistant:reply', {
      jobId: 'job-42',
      message: 'Done',
    });
    expect(pollScheduler.schedulePoll).not.toHaveBeenCalled();
  });

  it('should emit progress and reschedule when the job is still running', async () => {
    const pollScheduler: AIAssistantPollScheduler = {
      schedulePoll: jest.fn(),
      cancelPolls: jest.fn(),
    };
    const pollUseCase = new PollAIAssistantRequest({
      aiAssistantService: {
        submitMessage: jest.fn(),
        getJobStatus: jest.fn().mockResolvedValue({
          status: 'running',
          progress: 'Working...',
        }),
        cancelJob: jest.fn(),
      },
    });

    const job = createJob({ pollUseCase, pollScheduler });
    await job.handleDispatch(jest.fn(), params, jobInfo);

    expect(emitToSession).toHaveBeenCalledWith('session-1', 'aiAssistant:progress', {
      jobId: 'job-42',
      progress: 'Working...',
    });
    expect(pollScheduler.schedulePoll).toHaveBeenCalledWith(params);
  });

  it('should emit an error to the client on the last retry when polling fails', async () => {
    const pollUseCase = new PollAIAssistantRequest({
      aiAssistantService: {
        submitMessage: jest.fn(),
        getJobStatus: jest.fn().mockRejectedValue(new Error('Service unavailable')),
        cancelJob: jest.fn(),
      },
    });

    const job = createJob({ pollUseCase });

    await expect(
      job.handleDispatch(jest.fn(), params, { retryCount: 3, maxRetries: 3, namespace: 'default' })
    ).rejects.toThrow('Service unavailable');

    expect(emitToSession).toHaveBeenCalledWith('session-1', 'aiAssistant:error', {
      jobId: 'job-42',
      error: 'Service unavailable',
    });
  });

  it('should not emit an error to the client before the last retry', async () => {
    const pollUseCase = new PollAIAssistantRequest({
      aiAssistantService: {
        submitMessage: jest.fn(),
        getJobStatus: jest.fn().mockRejectedValue(new Error('Service unavailable')),
        cancelJob: jest.fn(),
      },
    });

    const job = createJob({ pollUseCase });

    await expect(job.handleDispatch(jest.fn(), params, jobInfo)).rejects.toThrow(
      'Service unavailable'
    );

    expect(emitToSession).not.toHaveBeenCalled();
  });

  it('should skip processing when the conversation was cancelled', async () => {
    AIAssistantCancellationRegistry.isCancelled.mockResolvedValue(true);
    const pollUseCase = {
      execute: jest.fn(),
    } as unknown as PollAIAssistantRequest;

    const job = createJob({ pollUseCase });
    await job.handleDispatch(jest.fn(), params, jobInfo);

    expect(pollUseCase.execute).not.toHaveBeenCalled();
    expect(emitToSession).not.toHaveBeenCalled();
  });
});
