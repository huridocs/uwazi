import {
  UserAwareDispatchable,
  UserAwareDispatchableParams,
  // @ts-expect-error TS(2307): Cannot find module '../queue.v2/application/contra... Remove this comment to see the full error message
} from '../queue.v2/application/contracts/UserAwareDispatchable.js';

// @ts-expect-error TS(2307): Cannot find module '../queue.v2/application/contra... Remove this comment to see the full error message
import { HeartbeatCallback, JobInfo } from '../queue.v2/application/contracts/Dispatchable.js';
import { PXExtractParagraphsFromEntityInput } from '../application/PXExtractParagraphsFromEntity';
import { PXExtractParagraphsFromEntityFactory } from './PXExtractParagraphsFromEntityFactory';

type Params = UserAwareDispatchableParams & PXExtractParagraphsFromEntityInput;

class PXExtractParagraphsFromEntityJob extends UserAwareDispatchable<Params> {
  async handle(_heartBeatCallBack: HeartbeatCallback, jobInfo: JobInfo) {
    // @ts-expect-error TS(2339): Property 'params' does not exist on type 'PXExtrac... Remove this comment to see the full error message
    const useCase = PXExtractParagraphsFromEntityFactory.createDefault(this.params.tenantName);
    const isRetriable = jobInfo.retryCount < jobInfo.maxRetries;

    // @ts-expect-error TS(2339): Property 'params' does not exist on type 'PXExtrac... Remove this comment to see the full error message
    await useCase.execute(this.params, isRetriable);
  }
}

export { PXExtractParagraphsFromEntityJob };
