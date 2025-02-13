import { TaskManager } from 'api/services/tasksmanager/TaskManager';
import { PXCreateParagraphs } from '../application/PXCreateParagraphs';

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

  private createParagraphs: PXCreateParagraphs;

  constructor(createParagraphs: PXCreateParagraphs) {
    this.createParagraphs = createParagraphs;

    this.taskManager = new TaskManager({
      serviceName: PXParagraphsResultListener.SERVICE_NAME,
      processResults: this.processResults.bind(this) as any,
    });
  }

  private async processResults(results: ResultMessage) {
    if (!results.data_url) return;

    await this.createParagraphs.execute({ resultUrl: results.data_url });
  }

  start(interval = 500) {
    this.taskManager.subscribeToResults(interval);
  }

  async stop() {
    await this.taskManager.stop();
  }
}
