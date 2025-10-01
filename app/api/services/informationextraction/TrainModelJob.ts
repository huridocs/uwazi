/* eslint-disable max-statements */
import {
  Dispatchable,
  HeartbeatCallback,
} from 'api/core/libs/queue/application/contracts/Dispatchable';
import { tenants } from 'api/tenants';
import { NonRetryableJobError } from 'api/core/libs/queue/infrastructure/errors';
import { ExtractorNotFound, Extractors } from './ixextractors';
import { TrainModelForPDF } from './TrainModelForPDF';
import { NoEntitiesForTraining, TrainModelForText } from './TrainModelForText';
import { NoFilesForTraining, NoLabeledEntities, NoSegmentedFiles } from './ixMaterials';

type CustomParams = {
  extractorId: string;
};

type Props = {
  tenantName: string;
  trainModelForPDF: TrainModelForPDF;
  trainModelForText: TrainModelForText;
  extractorsDS?: typeof Extractors;
};

export class IXTrainModelJob implements Dispatchable {
  private props: Required<Props>;

  constructor(props: Props) {
    this.props = { ...props, extractorsDS: props.extractorsDS ?? Extractors };
  }

  async handleDispatch(_: HeartbeatCallback, { extractorId }: CustomParams): Promise<void> {
    await tenants.run(async () => {
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
    }, this.props.tenantName);
  }
}
