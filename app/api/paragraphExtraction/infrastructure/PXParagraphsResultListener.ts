import { TaskManager } from '#api/services/tasksmanager/TaskManager.js';
import { runInJobContext } from '#api/services/tasksmanager/runInJobContext.js';
import { ExecutionContext } from '#api/core/libs/ExecutionContext.js';

import { JobsDispatcher } from '#api/core/libs/queue/application/contracts/JobsDispatcher.js';
import { PXExtractionKey } from '../domain/PXExtractionKey.js';
import { PXCreateParagraphsJob } from './PXCreateParagraphsJob.js';

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

  private buildDispatcher: () => JobsDispatcher;

  constructor(buildDispatcher: () => JobsDispatcher = () => ExecutionContext.jobsDispatcher) {
    this.buildDispatcher = buildDispatcher;
    this.taskManager = new TaskManager({
      serviceName: PXParagraphsResultListener.SERVICE_NAME,
      processResults: this.processResults.bind(this) as any,
    });
  }

  private async processResults(results: ResultMessage) {
    const extractionKey = new PXExtractionKey(results.key);

    // TaskManager already runs this inside runInJobContext(message.tenant), but PX result messages
    // carry no `tenant` field (the request only sends `key`), so that context is the default
    // tenant's. The extraction's tenant is only known from the key.
    await runInJobContext(extractionKey.tenantName, async () => {
      await this.buildDispatcher().dispatch(PXCreateParagraphsJob, {
        results: {
          success: results.success,
          data_url: results.data_url,
          error_message: results.error_message,
        },
        entityStatusId: extractionKey.entityStatusId,
        tenantName: extractionKey.tenantName,
        userId: extractionKey.userId,
      });
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
