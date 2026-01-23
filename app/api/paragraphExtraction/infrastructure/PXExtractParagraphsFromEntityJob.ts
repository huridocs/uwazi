import {
  UserAwareDispatchable,
  UserAwareDispatchableParams,
} from '#api/core/libs/queue/application/contracts/UserAwareDispatchable.js';

import {
  HeartbeatCallback,
  JobInfo,
} from '#api/core/libs/queue/application/contracts/Dispatchable.js';
import { PXExtractParagraphsFromEntityInput } from '#api/paragraphExtraction/application/PXExtractParagraphsFromEntity.js';
import { PXExtractParagraphsFromEntityFactory } from '#api/paragraphExtraction/infrastructure/PXExtractParagraphsFromEntityFactory.js';

type Params = UserAwareDispatchableParams & PXExtractParagraphsFromEntityInput;

class PXExtractParagraphsFromEntityJob extends UserAwareDispatchable<Params> {
  async handle(_heartBeatCallBack: HeartbeatCallback, jobInfo: JobInfo) {
    const useCase = PXExtractParagraphsFromEntityFactory.createDefault(this.params.tenantName);
    const isRetriable = jobInfo.retryCount < jobInfo.maxRetries;

    await useCase.execute(this.params, isRetriable);
  }
}

export { PXExtractParagraphsFromEntityJob };
