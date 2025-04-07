import {
  UserAwareDispatchable,
  UserAwareDispatchableParams,
} from 'api/queue.v2/application/contracts/UserAwareDispatchable';
import { NonRetryableJobError } from 'api/queue.v2/infrastructure/errors';
import { HeartbeatCallback } from 'api/queue.v2/application/contracts/Dispatchable';
import { PXCreateParagraphs } from '../application/PXCreateParagraphs';
import { PXExtractionService } from '../domain/PXExtractionService';
import { MongoPXEntitiesStatusDataSource } from './MongoPXEntitiesStatusDataSource';

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

  async handle(heartBeatCallBack: HeartbeatCallback) {
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
        onParagraphCreated: heartBeatCallBack,
      });
    } catch (e) {
      await this.dependencies.pxEntitiesStatusDS.markAsError(this.params.entityStatusId);
      throw e;
    }
  }
}

export { PXCreateParagraphsJob };
