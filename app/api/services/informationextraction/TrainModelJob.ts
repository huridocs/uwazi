/* eslint-disable max-statements */
import { PrivilegedJob } from '#api/core/infrastructure/jobs/PrivilegedJob.js';
import { UwaziJobHandler, UwaziJobParams } from '#api/core/infrastructure/jobs/UwaziJobHandler.js';
import { NonRetryableJobError } from '#api/core/libs/queue/infrastructure/errors.js';
import { ExtractorNotFound, Extractors } from './ixextractors.js';
import { TrainModelForPDF } from './TrainModelForPDF.js';
import { NoEntitiesForTraining, TrainModelForText } from './TrainModelForText.js';
import { NoFilesForTraining, NoLabeledEntities, NoSegmentedFiles } from './ixMaterials.js';

type CustomParams = UwaziJobParams & {
  extractorId: string;
};

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

  protected async handle(_: any, { extractorId }: CustomParams): Promise<void> {
    try {
      const extractor = await this.props.extractorsDS.getById(extractorId);
      if (!extractor) {
        throw new ExtractorNotFound(extractorId);
      }

      if (extractor.source.pdf) {
        await this.props.trainModelForPDF.execute({ extractor });
        return;
      }

      if (extractor.source.property) {
        await this.props.trainModelForText.execute({ extractor });
      }
    } catch (e) {
      if (
        [
          NoEntitiesForTraining.name,
          NoLabeledEntities.name,
          NoFilesForTraining.name,
          NoSegmentedFiles.name,
          ExtractorNotFound.name,
        ].includes(e.constructor.name)
      ) {
        throw new NonRetryableJobError(e);
      }

      throw e;
    }
  }
}
