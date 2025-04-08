import {
  UserAwareDispatchable,
  UserAwareDispatchableParams,
} from 'api/queue.v2/application/contracts/UserAwareDispatchable';

import { HeartbeatCallback, JobInfo } from 'api/queue.v2/application/contracts/Dispatchable';
import { PXExtractParagraphsFromEntityInput } from '../application/PXExtractParagraphsFromEntity';
import { PXExtractParagraphsFromEntityFactory } from './PXExtractParagraphsFromEntityFactory';
import { MongoPXEntitiesStatusDataSource } from './MongoPXEntitiesStatusDataSource';

type Params = UserAwareDispatchableParams & PXExtractParagraphsFromEntityInput;

type Dependencies = {
  pxEntitiesStatusDS: MongoPXEntitiesStatusDataSource;
};

class PXExtractParagraphsFromEntityJob extends UserAwareDispatchable<Params> {
  public constructor(private dependencies: Dependencies) {
    super();
  }

  async handle(_heartBeatCallBack: HeartbeatCallback, jobInfo: JobInfo) {
    const useCase = PXExtractParagraphsFromEntityFactory.createDefault(this.params.tenantName);
    try {
      await useCase.execute(this.params);
    } catch (e) {
      if (jobInfo.retryCount !== jobInfo.maxRetries) {
        await this.dependencies.pxEntitiesStatusDS.markAsProcessing(this.params.entityStatusId);
      }
      throw e;
    }
  }
}

export { PXExtractParagraphsFromEntityJob };
