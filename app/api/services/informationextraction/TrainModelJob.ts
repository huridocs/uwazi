/* eslint-disable max-statements */

import { Dispatchable, HeartbeatCallback } from '#api/core/libs/queue/application/contracts/Dispatchable.js';

import { tenants } from '#api/tenants/index.js';

import { NonRetryableJobError } from '#api/core/libs/queue/infrastructure/errors.js';
import { ExtractorNotFound, Extractors } from '#api/services/informationextraction/ixextractors.js';
import { TrainModelForPDF } from '#api/services/informationextraction/TrainModelForPDF.js';
import { NoEntitiesForTraining, TrainModelForText } from '#api/services/informationextraction/TrainModelForText.js';
import { NoFilesForTraining, NoLabeledEntities, NoSegmentedFiles } from '#api/services/informationextraction/ixMaterials.js';

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
