import { testingEnvironment } from '#api/utils/testingEnvironment.js';
import { tenants } from '#api/tenants/index.js';
import * as setupSockets from '#api/socketio/setupSockets.js';
import { AcceptSuggestionsJob } from '../AcceptSuggestionsJob.js';
import { isPrivilegedJob } from '#api/core/infrastructure/jobs/PrivilegedJob.js';

jest.mock('api/socketio/setupSockets');

const heartbeat = jest.fn();

describe('AcceptSuggestionsJob', () => {
  let useCase: { execute: jest.Mock };
  let dispatcher: { dispatch: jest.Mock };

  beforeAll(async () => {
    await testingEnvironment.setUp({});
  });

  afterAll(async () => {
    await testingEnvironment.tearDown();
  });

  beforeEach(() => {
    heartbeat.mockClear();
    useCase = { execute: jest.fn() };
    dispatcher = { dispatch: jest.fn().mockResolvedValue(undefined) };
    jest.spyOn(setupSockets, 'emitToTenantAdminsAndEditors').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('is a privileged job, so its recompute bypasses entity RLS', () => {
    expect(isPrivilegedJob(AcceptSuggestionsJob as unknown as { name: string })).toBe(true);
  });

  const createSut = () =>
    new AcceptSuggestionsJob({
      useCase: useCase as any,
      dispatcher: dispatcher as any,
      batchSize: 50,
    });

  const dispatch = async (job: AcceptSuggestionsJob, extractorId: string, userId: string) =>
    job.handleDispatch(heartbeat, { extractorId, userId } as any, {
      namespace: tenants.current().name,
      maxRetries: 3,
      retryCount: 0,
    });

  it('re-dispatches the next batch without tenantName and emits to the running tenant', async () => {
    useCase.execute.mockResolvedValue({ processed: 1 });

    await dispatch(createSut(), 'extractor1', 'user1');

    expect(dispatcher.dispatch).toHaveBeenCalledWith(AcceptSuggestionsJob, {
      extractorId: 'extractor1',
      userId: 'user1',
    });
    expect(dispatcher.dispatch.mock.calls[0][1]).not.toHaveProperty('tenantName');
    expect(setupSockets.emitToTenantAdminsAndEditors).toHaveBeenCalledWith(
      tenants.current().name,
      'ix_model_status',
      'extractor1',
      'processing_auto_accept'
    );
  });
});
