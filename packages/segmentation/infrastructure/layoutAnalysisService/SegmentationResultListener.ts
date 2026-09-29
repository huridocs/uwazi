import { TaskManager } from '#api/services/tasksmanager/TaskManager.js';
import { handleError } from '#api/utils/handleError.js';
import { SegmentationOutcome } from '../../application/contracts/PdfSegmenter.js';
import { MalformedSegmentationResult } from '../../application/errors/MalformedSegmentationResult.js';
import { ResultMessageTranslator } from './ResultMessageTranslator.js';

const SERVICE_NAME = 'segmentation';
const MAX_DELIVERIES = 10;

type Deps = {
  /** Runs inside the message's tenant context. */
  saveResult: (outcome: SegmentationOutcome) => Promise<void>;
  messageHiddenTimeSeconds?: number;
  /** The service's queue family; `segmentation` unless a spec needs its own. */
  serviceName?: string;
};

/**
 * Reads the segmentation service's results queue and hands each outcome over for processing.
 * It does no work of its own: a message is removed only once handed over, so a failed hand-over
 * is delivered again, and one it cannot understand is reported and dropped rather than retried.
 */
class SegmentationResultListener {
  private readonly taskManager: TaskManager;

  constructor(private readonly deps: Deps) {
    this.taskManager = new TaskManager({
      serviceName: deps.serviceName ?? SERVICE_NAME,
      processResults: async message => this.handOver(message),
      processResultsMessageHiddenTime: deps.messageHiddenTimeSeconds ?? 30,
      deleteAfterProcessing: true,
      maxDeliveries: MAX_DELIVERIES,
    });
  }

  start(interval = 500) {
    this.taskManager.subscribeToResults(interval);
  }

  async stop() {
    await this.taskManager.stop();
  }

  private async handOver(message: unknown) {
    let outcome: SegmentationOutcome;
    try {
      ({ outcome } = ResultMessageTranslator.toOutcome(message));
    } catch (error) {
      if (error instanceof MalformedSegmentationResult) {
        handleError(error, { useContext: false });
        return;
      }
      throw error;
    }
    await this.deps.saveResult(outcome);
  }
}

export { SegmentationResultListener };
