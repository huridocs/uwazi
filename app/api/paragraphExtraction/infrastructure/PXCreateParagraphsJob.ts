import { NonRetryableJobError } from '#api/core/libs/queue/infrastructure/errors.js';
import {
  HeartbeatCallback,
  JobInfo,
} from '#api/core/libs/queue/application/contracts/Dispatchable.js';
import { PXCreateParagraphs } from '../application/PXCreateParagraphs.js';
import { PXExtractionService } from '../domain/PXExtractionService.js';
import { MongoPXEntitiesStatusDataSource } from './MongoPXEntitiesStatusDataSource.js';
import { UwaziJobHandler, UwaziJobParams } from '#api/core/infrastructure/jobs/UwaziJobHandler.js';
import { PrivilegedJob } from '#api/core/infrastructure/jobs/PrivilegedJob.js';

type PXCreateParagraphsJobParams = UwaziJobParams & {
  results: {
    success: boolean;
    data_url: string | undefined;
    error_message: string | undefined;
  };
  entityStatusId: string;
};

type Dependencies = {
  extractionService: PXExtractionService;
  useCase: PXCreateParagraphs;
  pxEntitiesStatusDS: MongoPXEntitiesStatusDataSource;
};

@PrivilegedJob()
class PXCreateParagraphsJob extends UwaziJobHandler<PXCreateParagraphsJobParams> {
  public constructor(private dependencies: Dependencies) {
    super();
  }

  // eslint-disable-next-line max-statements
  async handle(
    heartBeatCallBack: HeartbeatCallback,
    params: PXCreateParagraphsJobParams,
    jobInfo: JobInfo
  ) {
    const isRetriable = jobInfo.retryCount < jobInfo.maxRetries;
    try {
      if (!params.results.success) {
        throw new NonRetryableJobError(
          new Error(`Paragraph Extraction failed with error: ${params.results.error_message}`)
        );
      }
      if (!params.results.data_url) {
        throw new NonRetryableJobError(new Error('data_url for paragraph extraction is missing'));
      }
      const paragraphsResult = await this.dependencies.extractionService.getParagraphsResult(
        params.results.data_url
      );
      await this.dependencies.useCase.execute({
        userId: params.userId,
        entityStatusId: params.entityStatusId,
        paragraphs: paragraphsResult.paragraphs,
        onParagraphBatchCreated: heartBeatCallBack,
      });
    } catch (e) {
      if (!isRetriable) {
        await this.dependencies.pxEntitiesStatusDS.markAsError(params.entityStatusId);
      }
      throw e;
    }
  }
}

export { PXCreateParagraphsJob };
