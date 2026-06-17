import type { AIAssistantService } from '#api/aiAssistant/domain/AIAssistantService.js';
import type { AIAssistantPollScheduler } from '#api/aiAssistant/application/contracts/AIAssistantPollScheduler.js';
import { getFixturesFactory } from '#api/utils/fixturesFactory.js';
import { testingEnvironment } from '#api/utils/testingEnvironment.js';
import { LanguageISO6391 } from '#shared/types/commonTypes.js';
import { UserRole } from '#shared/types/userSchema.js';
import { AIAssistantPollRequestJob } from '../AIAssistantPollRequestJob.js';

const fixturesFactory = getFixturesFactory();

const fixtures = {
  settings: [{ languages: [{ key: 'en' as LanguageISO6391, label: 'English', default: true }] }],
  users: [fixturesFactory.user('ai-assistant-poll-user', UserRole.EDITOR)],
};

jest.mock('#api/socketio/setupSockets.js', () => ({
  emitToSession: jest.fn(),
}));

const { emitToSession } = jest.requireMock('#api/socketio/setupSockets.js');

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

  const createJob = (
    overrides: {
      aiAssistantService?: AIAssistantService;
      pollScheduler?: AIAssistantPollScheduler;
    } = {}
  ) => {
    const pollScheduler: AIAssistantPollScheduler = overrides.pollScheduler ?? {
      schedulePoll: jest.fn(),
    };

    const aiAssistantService: AIAssistantService =
      overrides.aiAssistantService ??
      ({
        submitMessage: jest.fn(),
        getJobStatus: jest.fn().mockResolvedValue({ status: 'pending' }),
      } as AIAssistantService);

    return new AIAssistantPollRequestJob({ aiAssistantService, pollScheduler });
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should emit a reply and stop polling when the job is completed', async () => {
    const aiAssistantService = {
      submitMessage: jest.fn(),
      getJobStatus: jest.fn().mockResolvedValue({
        status: 'completed',
        message: 'Done',
      }),
    } as AIAssistantService;
    const pollScheduler: AIAssistantPollScheduler = {
      schedulePoll: jest.fn(),
    };

    const job = createJob({ aiAssistantService, pollScheduler });
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
    };
    const aiAssistantService = {
      submitMessage: jest.fn(),
      getJobStatus: jest.fn().mockResolvedValue({
        status: 'running',
        progress: 'Working...',
      }),
    } as AIAssistantService;

    const job = createJob({ aiAssistantService, pollScheduler });
    await job.handleDispatch(jest.fn(), params, jobInfo);

    expect(emitToSession).toHaveBeenCalledWith('session-1', 'aiAssistant:progress', {
      jobId: 'job-42',
      progress: 'Working...',
    });
    expect(pollScheduler.schedulePoll).toHaveBeenCalledWith(params);
  });

  it('should emit an error to the client on the last retry when polling fails', async () => {
    const aiAssistantService = {
      submitMessage: jest.fn(),
      getJobStatus: jest.fn().mockRejectedValue(new Error('Service unavailable')),
    } as AIAssistantService;

    const job = createJob({ aiAssistantService });

    await expect(
      job.handleDispatch(jest.fn(), params, { retryCount: 3, maxRetries: 3, namespace: 'default' })
    ).rejects.toThrow('Service unavailable');

    expect(emitToSession).toHaveBeenCalledWith('session-1', 'aiAssistant:error', {
      jobId: 'job-42',
      error: 'Service unavailable',
    });
  });

  it('should not emit an error to the client before the last retry', async () => {
    const aiAssistantService = {
      submitMessage: jest.fn(),
      getJobStatus: jest.fn().mockRejectedValue(new Error('Service unavailable')),
    } as AIAssistantService;

    const job = createJob({ aiAssistantService });

    await expect(job.handleDispatch(jest.fn(), params, jobInfo)).rejects.toThrow(
      'Service unavailable'
    );

    expect(emitToSession).not.toHaveBeenCalled();
  });
});
