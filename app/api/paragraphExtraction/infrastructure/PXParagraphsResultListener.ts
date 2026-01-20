import { TaskManager } from '#api/services/tasksmanager/TaskManager.js';

import { JobsDispatcher } from '#api/core/libs/queue/application/contracts/JobsDispatcher.js';
import { QueueOptions } from '#api/core/libs/queue/infrastructure/NamespacedDispatcher.js';
import { PXExtractionKey } from '#api/paragraphExtraction/domain/PXExtractionKey.js';
import { PXCreateParagraphsJob } from '#api/paragraphExtraction/infrastructure/PXCreateParagraphsJob.js';

type ResultMessage = {
  key: string;
  xmls: Xml[];
  success: boolean;
  error_message: string;
  data_url?: string;
};

type Xml = {
  xml_file_name: string;
  language: string;
  is_main_language: boolean;
};

export class PXParagraphsResultListener {
  static SERVICE_NAME = 'extract_paragraphs';

  private taskManager: TaskManager;

  private buildDispatcher: (tenant: string, queueOptions?: QueueOptions) => JobsDispatcher;

  constructor(buildDispatcher: (tenant: string, queueOptions?: QueueOptions) => JobsDispatcher) {
    this.buildDispatcher = buildDispatcher;
    this.taskManager = new TaskManager({
      serviceName: PXParagraphsResultListener.SERVICE_NAME,
      processResults: this.processResults.bind(this) as any,
    });
  }

  private async processResults(results: ResultMessage) {
    const extractionKey = new PXExtractionKey(results.key);

    const dispatcher = this.buildDispatcher(extractionKey.tenantName, {
      lockWindow: 1000 * 60,
    });

    await dispatcher.dispatch(PXCreateParagraphsJob, {
      results: {
        success: results.success,
        data_url: results.data_url,
        error_message: results.error_message,
      },
      entityStatusId: extractionKey.entityStatusId,
      tenantName: extractionKey.tenantName,
      userId: extractionKey.userId,
    });
  }

  start(interval = 500) {
    this.taskManager.subscribeToResults(interval);
  }

  async stop() {
    await this.taskManager.stop();
  }
}

export type { ResultMessage };
