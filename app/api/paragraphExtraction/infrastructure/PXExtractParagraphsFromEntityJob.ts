import {
  UserAwareDispatchable,
  UserAwareDispatchableParams,
} from '../queue.v2/application/contracts/UserAwareDispatchable.js';

import { HeartbeatCallback, JobInfo } from '../queue.v2/application/contracts/Dispatchable.js';
import { PXExtractParagraphsFromEntityInput } from '../application/PXExtractParagraphsFromEntity';
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
