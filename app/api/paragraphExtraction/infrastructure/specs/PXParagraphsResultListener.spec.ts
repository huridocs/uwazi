// @ts-expect-error TS(2307): Cannot find module '../paragraphExtraction/domain/... Remove this comment to see the full error message
import { PXExtractionKey } from '../paragraphExtraction/domain/PXExtractionKey.js';

import { testingEnvironment } from 'api/utils/testingEnvironment.js';
import { ObjectId } from 'mongodb';

// @ts-expect-error TS(2307): Cannot find module '../queue.v2/application/contra... Remove this comment to see the full error message
import { JobsDispatcher } from '../queue.v2/application/contracts/JobsDispatcher.js';
import { PXCreateParagraphsJob } from '../PXCreateParagraphsJob';
import { PXParagraphsResultListener, ResultMessage } from '../PXParagraphsResultListener';

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
  const dispatcher: JobsDispatcher = {
    dispatch: jest.fn(),
  };

  const listener = new PXParagraphsResultListener(async () => dispatcher);

  return {
    listener,
    processResults: (listener as any).processResults.bind(listener),
    dispatcher,
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
});
