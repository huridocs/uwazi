import {
  UserAwareDispatchable,
  UserAwareDispatchableParams,
} from 'api/core/libs/queue/application/contracts/UserAwareDispatchable';

import { HeartbeatCallback, JobInfo } from 'api/core/libs/queue/application/contracts/Dispatchable';
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
