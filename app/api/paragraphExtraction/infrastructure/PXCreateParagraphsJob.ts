import {
  UserAwareDispatchable,
  UserAwareDispatchableParams,
  // @ts-expect-error TS(2307): Cannot find module '../queue.v2/application/contra... Remove this comment to see the full error message
} from '../queue.v2/application/contracts/UserAwareDispatchable.js';
// @ts-expect-error TS(2307): Cannot find module '../queue.v2/infrastructure/err... Remove this comment to see the full error message
import { NonRetryableJobError } from '../queue.v2/infrastructure/errors.js';
// @ts-expect-error TS(2307): Cannot find module '../queue.v2/application/contra... Remove this comment to see the full error message
import { HeartbeatCallback, JobInfo } from '../queue.v2/application/contracts/Dispatchable.js';
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

  // eslint-disable-next-line max-statements
  async handle(heartBeatCallBack: HeartbeatCallback, jobInfo: JobInfo) {
    const isRetriable = jobInfo.retryCount < jobInfo.maxRetries;
    try {
      // @ts-expect-error TS(2339): Property 'params' does not exist on type 'PXCreate... Remove this comment to see the full error message
      if (!this.params.results.success) {
        throw new NonRetryableJobError(
          // @ts-expect-error TS(2339): Property 'params' does not exist on type 'PXCreate... Remove this comment to see the full error message
          new Error(`Paragraph Extraction failed with error: ${this.params.results.error_message}`)
        );
      }
      // @ts-expect-error TS(2339): Property 'params' does not exist on type 'PXCreate... Remove this comment to see the full error message
      if (!this.params.results.data_url) {
        throw new NonRetryableJobError(new Error('data_url for paragraph extraction is missing'));
      }
      const paragraphsResult = await this.dependencies.extractionService.getParagraphsResult(
        // @ts-expect-error TS(2339): Property 'params' does not exist on type 'PXCreate... Remove this comment to see the full error message
        this.params.results.data_url
      );
      await this.dependencies.useCase.execute({
        // @ts-expect-error TS(2339): Property 'params' does not exist on type 'PXCreate... Remove this comment to see the full error message
        userId: this.params.userId,
        // @ts-expect-error TS(2339): Property 'params' does not exist on type 'PXCreate... Remove this comment to see the full error message
        entityStatusId: this.params.entityStatusId,
        paragraphs: paragraphsResult.paragraphs,
        onParagraphCreated: heartBeatCallBack,
      });
    } catch (e) {
      if (!isRetriable) {
        // @ts-expect-error TS(2339): Property 'params' does not exist on type 'PXCreate... Remove this comment to see the full error message
        await this.dependencies.pxEntitiesStatusDS.markAsError(this.params.entityStatusId);
      }
      throw e;
    }
  }
}

export { PXCreateParagraphsJob };
