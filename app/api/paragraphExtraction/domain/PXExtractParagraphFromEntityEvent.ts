import { Event } from 'api/common.v2/contracts/emitter/Event';

import { PXExtractParagraphsFromEntityInput } from '../application/PXExtractParagraphFromEntity';

class PXExtractParagraphFromEntityEvent extends Event<PXExtractParagraphsFromEntityInput> {
  static eventName = 'PXExtractParagraphFromEntityEvent';

  constructor(payload: PXExtractParagraphsFromEntityInput) {
    super({ payload, name: PXExtractParagraphFromEntityEvent.eventName });
  }
}

export { PXExtractParagraphFromEntityEvent };
