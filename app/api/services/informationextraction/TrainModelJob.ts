import { Dispatchable, HeartbeatCallback } from 'api/queue.v2/application/contracts/Dispatchable';
import { tenants } from 'api/tenants';
import { Extractors } from './ixextractors';
import { TrainModelForPDF } from './TrainModelForPDF';
import { TrainModelForText } from './TrainModelForText';

type CustomParams = {
  extractorId: string;
};

type Props = {
  tenantName: string;
  trainModelForPDF: TrainModelForPDF;
  trainModelForText: TrainModelForText;
};

export class IXTrainModelJob implements Dispatchable {
  constructor(private props: Props) {}

  async handleDispatch(_: HeartbeatCallback, { extractorId }: CustomParams): Promise<void> {
    await tenants.run(async () => {
      const extractor = await Extractors.getById(extractorId);
      if (!extractor) {
        throw new Error(`Extractor with ID ${extractorId} not found.`);
      }

      if (extractor.source.pdf) {
        await this.props.trainModelForPDF.execute({ extractor });
        return;
      }

      if (extractor.source.property) {
        await this.props.trainModelForText.execute({ extractor });
      }
    }, this.props.tenantName);
  }
}
