import { Queue } from 'bullmq';

import { EmitterFactory } from 'api/common.v2/infrastructure/emitter/EmitterFactory';
import { BullMQEventForwarder } from 'api/common.v2/infrastructure/queue/BullMQEventForwarder';
import { BullMQWorker } from 'api/common.v2/infrastructure/worker/BullMQWorker';

import { PXExtractParagraphFromEntityEvent } from '../domain/PXExtractParagraphFromEntityEvent';

const queue = new Queue('ExtractParagraphFromEntityQueue');

const forwarder = new BullMQEventForwarder({
  emitter: EmitterFactory.createDefault(),
  eventName: PXExtractParagraphFromEntityEvent.eventName,
  queue,
});

const extractParagraphFromEntityWorker = new BullMQWorker({
  name: forwarder.queue.name,
  process: async () => console.log('Call the use case'),
});

export { extractParagraphFromEntityWorker };
