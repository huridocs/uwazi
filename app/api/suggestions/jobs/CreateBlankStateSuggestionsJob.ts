import {
  Dispatchable,
  HeartbeatCallback,
  JobInfo,
  
} from '../queue.v2/application/contracts/Dispatchable.js';

import { tenants } from 'api/tenants/index.js';
import { BatchRange } from '../batchProcessing';
import { createBlankStateSuggestionsBatch } from '../blankSuggestions';

type SpecificJobParams = {
  batch: BatchRange;
  templateId: string;
  extractorId: string;
  extractorProperty: string;
  extractorSource: {
    pdf?: boolean;
    property?: string;
  };
  isMultiValued: boolean;
};

class CreateBlankStateSuggestionsJob implements Dispatchable {
  constructor() {}

  // eslint-disable-next-line class-methods-use-this
  async handleDispatch(
    _heartbeat: HeartbeatCallback,
    params: SpecificJobParams,
    jobInfo: JobInfo
  ): Promise<void> {
    const { batch, templateId, extractorId } = params;
    await tenants.run(async () => {
      await createBlankStateSuggestionsBatch(batch, templateId, extractorId);
    }, jobInfo.namespace);
  }
}

export { CreateBlankStateSuggestionsJob };
export type { SpecificJobParams as CreateParagraphExtractionEntityStatusesJobParams };
