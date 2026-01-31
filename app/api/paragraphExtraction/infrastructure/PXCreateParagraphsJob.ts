import {
  HeartbeatCallback,
  JobInfo,
} from '#api/core/libs/queue/application/contracts/Dispatchable.js';
import {
  UserAwareDispatchableParams,
  UserAwareDispatchable,
} from '#api/core/libs/queue/application/contracts/UserAwareDispatchable.js';
import { NonRetryableJobError } from '#api/core/libs/queue/infrastructure/errors.js';
import { PXCreateParagraphs } from '#api/paragraphExtraction/application/PXCreateParagraphs.js';
import { PXExtractionService } from '#api/paragraphExtraction/domain/PXExtractionService.js';
import { MongoPXEntitiesStatusDataSource } from '#api/paragraphExtraction/infrastructure/MongoPXEntitiesStatusDataSource.js';

type PXCreateParagraphsJobParams = UserAwareDispatchableParams & {
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

class PXCreateParagraphsJob extends UserAwareDispatchable<PXCreateParagraphsJobParams> {
  public constructor(private dependencies: Dependencies) {
    super();
  }

  // eslint-disable-next-line max-statements
  async handle(heartBeatCallBack: HeartbeatCallback, jobInfo: JobInfo) {
    const isRetriable = jobInfo.retryCount < jobInfo.maxRetries;
    try {
      if (!this.params.results.success) {
        throw new NonRetryableJobError(
          new Error(`Paragraph Extraction failed with error: ${this.params.results.error_message}`)
        );
      }
      if (!this.params.results.data_url) {
        throw new NonRetryableJobError(new Error('data_url for paragraph extraction is missing'));
      }
      const paragraphsResult = await this.dependencies.extractionService.getParagraphsResult(
        this.params.results.data_url
      );
      await this.dependencies.useCase.execute({
        userId: this.params.userId,
        entityStatusId: this.params.entityStatusId,
        paragraphs: paragraphsResult.paragraphs,
        onParagraphBatchCreated: heartBeatCallBack,
      });
    } catch (e) {
      if (!isRetriable) {
        await this.dependencies.pxEntitiesStatusDS.markAsError(this.params.entityStatusId);
      }
      throw e;
    }
  }
}

export { PXCreateParagraphsJob };
