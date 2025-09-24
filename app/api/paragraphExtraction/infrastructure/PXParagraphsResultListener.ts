// @ts-expect-error TS(2307): Cannot find module '../services/tasksmanager/TaskM... Remove this comment to see the full error message
import { TaskManager } from '../services/tasksmanager/TaskManager.js';

// @ts-expect-error TS(2307): Cannot find module '../queue.v2/application/contra... Remove this comment to see the full error message
import { JobsDispatcher } from '../queue.v2/application/contracts/JobsDispatcher.js';
// @ts-expect-error TS(2307): Cannot find module '../queue.v2/infrastructure/Nam... Remove this comment to see the full error message
import { QueueOptions } from '../queue.v2/infrastructure/NamespacedDispatcher.js';
import { PXExtractionKey } from '../domain/PXExtractionKey';
import { PXCreateParagraphsJob } from './PXCreateParagraphsJob';

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

  private buildDispatcher: (tenant: string, queueOptions?: QueueOptions) => Promise<JobsDispatcher>;

  constructor(
    buildDispatcher: (tenant: string, queueOptions?: QueueOptions) => Promise<JobsDispatcher>
  ) {
    this.buildDispatcher = buildDispatcher;
    this.taskManager = new TaskManager({
      serviceName: PXParagraphsResultListener.SERVICE_NAME,
      processResults: this.processResults.bind(this) as any,
    });
  }

  private async processResults(results: ResultMessage) {
    const extractionKey = new PXExtractionKey(results.key);

    const dispatcher = await this.buildDispatcher(extractionKey.tenantName, {
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
