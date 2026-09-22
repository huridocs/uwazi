import { PXExtractionKey } from '#api/paragraphExtraction/domain/PXExtractionKey.js';
import { testingEnvironment } from '#api/utils/testingEnvironment.js';
import { ObjectId } from 'mongodb';

import { JobsDispatcher } from '#api/core/libs/queue/application/contracts/JobsDispatcher.js';
import { TestUtils } from '#api/common.v2/utils/Test.js';
import { appContext } from '#api/utils/AppContext.js';
import { PXCreateParagraphsJob } from '../PXCreateParagraphsJob.js';
import { PXParagraphsResultListener, ResultMessage } from '../PXParagraphsResultListener.js';

jest.mock('api/services/tasksmanager/TaskManager');

const extractionKey = PXExtractionKey.create({
  entityStatusId: new ObjectId().toHexString(),
  tenantName: 'any_tenant_name',
  userId: 'any_user_id',
});

const resultMessage: ResultMessage = {
  success: true,
  key: extractionKey.key,
  data_url: 'data_url',
  error_message: 'error_message',
  xmls: [],
};

const createSut = () => {
  const dispatcher = TestUtils.mockClass<JobsDispatcher>({
    dispatch: jest.fn(),
    dispatchMany: jest.fn(),
  });
  const tenantsSeenByDispatcher: unknown[] = [];

  const listener = new PXParagraphsResultListener(() => {
    tenantsSeenByDispatcher.push(appContext.get('tenant'));
    return dispatcher;
  });

  return {
    listener,
    processResults: (listener as any).processResults.bind(listener),
    dispatcher,
    tenantsSeenByDispatcher,
  };
};

describe('PXParagraphsResultListener', () => {
  beforeEach(async () => {
    await testingEnvironment.setUp();
  });

  afterAll(async () => {
    await testingEnvironment.tearDown();
  });

  it('should dispatch PXCreateParagraphsJob with proper params', async () => {
    const { processResults, dispatcher } = createSut();

    await processResults(resultMessage);

    expect(dispatcher.dispatch).toHaveBeenCalledWith(PXCreateParagraphsJob, {
      results: {
        success: resultMessage.success,
        data_url: resultMessage.data_url,
        error_message: resultMessage.error_message,
      },
      entityStatusId: extractionKey.entityStatusId,
      tenantName: extractionKey.tenantName,
      userId: extractionKey.userId,
    });
  });

  it('should dispatch within the context of the tenant encoded in the extraction key', async () => {
    const { processResults, tenantsSeenByDispatcher } = createSut();

    await appContext.run(async () => processResults(resultMessage), { tenant: 'default' });

    expect(tenantsSeenByDispatcher).toEqual([extractionKey.tenantName]);
  });
});
