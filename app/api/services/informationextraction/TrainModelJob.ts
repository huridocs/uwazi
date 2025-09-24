/* eslint-disable max-statements */
// @ts-expect-error TS(2307): Cannot find module '../queue.v2/application/contra... Remove this comment to see the full error message
import { Dispatchable, HeartbeatCallback } from '../queue.v2/application/contracts/Dispatchable.js';
// @ts-expect-error TS(2307): Cannot find module '../tenants.js' or its correspo... Remove this comment to see the full error message
import { tenants } from 'api/tenants/index.js';
// @ts-expect-error TS(2307): Cannot find module '../queue.v2/infrastructure/err... Remove this comment to see the full error message
import { NonRetryableJobError } from '../queue.v2/infrastructure/errors.js';
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
