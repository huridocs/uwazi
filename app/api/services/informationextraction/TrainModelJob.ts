/* eslint-disable max-classes-per-file */
/* eslint-disable max-statements */
import { PrivilegedJob } from '#api/core/infrastructure/jobs/PrivilegedJob.js';
import { UwaziJobHandler, UwaziJobParams } from '#api/core/infrastructure/jobs/UwaziJobHandler.js';
import { NonRetryableJobError } from '#api/core/libs/queue/infrastructure/errors.js';
import { emitToTenantAdminsAndEditors } from '#api/socketio/setupSockets.js';
import { tenants } from '#api/tenants/index.js';
import { ExtractorNotFound, Extractors } from './ixextractors.js';
import { TrainModelForPDF } from './TrainModelForPDF.js';
import { NoEntitiesForTraining, TrainModelForText } from './TrainModelForText.js';
import { NoFilesForTraining, NoLabeledEntities, NoSegmentedFiles } from './ixMaterials.js';
import { IXWebSocketEvents } from './WebSocketEvents.js';
import ixmodels from './ixmodels.js';

type CustomParams = UwaziJobParams & {
  extractorId: string;
};

/** An extractor whose `source` is neither `pdf` nor `property`: there is nothing to train from. */
class UntrainableExtractorSource extends Error {
  constructor(extractorId: string) {
    super(`Extractor ${extractorId} has no trainable source: expected either a pdf or a property.`);
  }
}

type Props = {
  trainModelForPDF: TrainModelForPDF;
  trainModelForText: TrainModelForText;
  extractorsDS?: typeof Extractors;
};

@PrivilegedJob()
export class IXTrainModelJob extends UwaziJobHandler<CustomParams> {
  private props: Required<Props>;

  constructor(props: Props) {
    super();
    this.props = { ...props, extractorsDS: props.extractorsDS ?? Extractors };
  }

  /**
   * `trainModelForText` and `trainModelForPDF` each release the model and notify the user from
   * their own catch. The two failures below happen *before* either of them runs, so nothing
   * else will do it: without this the model stays at `status: processing,
   * findingSuggestions: true` forever and the UI reports "Training model" indefinitely, with no
   * error anywhere. Returns the error so callers can `throw` it at the point of failure.
   */
  private static async releaseModel<E extends Error>(extractorId: string, error: E): Promise<E> {
    await ixmodels.markReady(extractorId);

    emitToTenantAdminsAndEditors(tenants.current().name, IXWebSocketEvents.ErrorTrainingModel, {
      message: error.message,
    });

    return error;
  }

  protected async handle(_: any, { extractorId }: CustomParams): Promise<void> {
    try {
      const extractor = await this.props.extractorsDS.getById(extractorId);
      if (!extractor) {
        throw await IXTrainModelJob.releaseModel(extractorId, new ExtractorNotFound(extractorId));
      }

      if (extractor.source.pdf) {
        await this.props.trainModelForPDF.execute({ extractor });
        return;
      }

      if (extractor.source.property) {
        await this.props.trainModelForText.execute({ extractor });
        return;
      }

      throw await IXTrainModelJob.releaseModel(
        extractorId,
        new UntrainableExtractorSource(extractorId)
      );
    } catch (e) {
      if (
        [
          NoEntitiesForTraining.name,
          NoLabeledEntities.name,
          NoFilesForTraining.name,
          NoSegmentedFiles.name,
          ExtractorNotFound.name,
          UntrainableExtractorSource.name,
        ].includes(e.constructor.name)
      ) {
        throw new NonRetryableJobError(e);
      }

      throw e;
    }
  }
}

export { UntrainableExtractorSource };
