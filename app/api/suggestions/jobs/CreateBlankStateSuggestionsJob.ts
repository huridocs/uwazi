import { PrivilegedJob } from '#api/core/infrastructure/jobs/PrivilegedJob.js';
import { UwaziJobHandler, UwaziJobParams } from '#api/core/infrastructure/jobs/UwaziJobHandler.js';
import { BatchRange } from '../batchProcessing.js';
import { createBlankStateSuggestionsBatch } from '../blankSuggestions.js';

type SpecificJobParams = UwaziJobParams & {
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

@PrivilegedJob()
class CreateBlankStateSuggestionsJob extends UwaziJobHandler<SpecificJobParams> {
  protected async handle(_heartbeat: any, params: SpecificJobParams): Promise<void> {
    const { batch, templateId, extractorId } = params;
    await createBlankStateSuggestionsBatch(batch, templateId, extractorId);
  }
}

export { CreateBlankStateSuggestionsJob };
export type { SpecificJobParams as CreateParagraphExtractionEntityStatusesJobParams };
