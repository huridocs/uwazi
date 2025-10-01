import {
  UserAwareDispatchable,
  UserAwareDispatchableParams,
} from '#api/queue.v2/application/contracts/UserAwareDispatchable.js';

import { HeartbeatCallback, JobInfo } from '#api/queue.v2/application/contracts/Dispatchable.js';
import { PXExtractParagraphsFromEntityInput } from '#api/paragraphExtraction/application/PXExtractParagraphsFromEntity';
import { PXExtractParagraphsFromEntityFactory } from './PXExtractParagraphsFromEntityFactory';

type Params = UserAwareDispatchableParams & PXExtractParagraphsFromEntityInput;

class PXExtractParagraphsFromEntityJob extends UserAwareDispatchable<Params> {
  async handle(_heartBeatCallBack: HeartbeatCallback, jobInfo: JobInfo) {
    const useCase = PXExtractParagraphsFromEntityFactory.createDefault(this.params.tenantName);
    const isRetriable = jobInfo.retryCount < jobInfo.maxRetries;

    await useCase.execute(this.params, isRetriable);
  }
}

export { PXExtractParagraphsFromEntityJob };
