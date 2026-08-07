
import {
  HeartbeatCallback,
  JobInfo,
} from '#api/core/libs/queue/application/contracts/Dispatchable.js';
import { PXExtractParagraphsFromEntityInput } from '../application/PXExtractParagraphsFromEntity.js';
import { PXExtractParagraphsFromEntityFactory } from './PXExtractParagraphsFromEntityFactory.js';
import { UwaziJobHandler, UwaziJobParams } from '#api/core/infrastructure/jobs/UwaziJobHandler.js';
import { PrivilegedJob } from '#api/core/infrastructure/jobs/PrivilegedJob.js';

type Params = UwaziJobParams & PXExtractParagraphsFromEntityInput & { tenantName: string };

@PrivilegedJob()
class PXExtractParagraphsFromEntityJob extends UwaziJobHandler<Params> {
  async handle(_heartBeatCallBack: HeartbeatCallback, params: Params, jobInfo: JobInfo) {
    const useCase = PXExtractParagraphsFromEntityFactory.createDefault(params.tenantName);
    const isRetriable = jobInfo.retryCount < jobInfo.maxRetries;

    await useCase.execute(params, isRetriable);
  }
}

export { PXExtractParagraphsFromEntityJob };
