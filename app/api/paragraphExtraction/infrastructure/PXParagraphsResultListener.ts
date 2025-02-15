import { TaskManager } from 'api/services/tasksmanager/TaskManager';
import { PXCreateParagraphs } from '../application/PXCreateParagraphs';
import { PXExtractionService } from '../domain/PXExtractionService';

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

type PXParagraphsResultListenerProps = {
  createParagraphs: PXCreateParagraphs;
  extractionService: PXExtractionService;
};

export class PXParagraphsResultListener {
  static SERVICE_NAME = 'extract_paragraphs';

  private taskManager: TaskManager;

  constructor(private props: PXParagraphsResultListenerProps) {
    this.taskManager = new TaskManager({
      serviceName: PXParagraphsResultListener.SERVICE_NAME,
      processResults: this.processResults.bind(this) as any,
    });
  }

  private async processResults(results: ResultMessage) {
    if (!results.success || !results.data_url) return;

    const { paragraphs } = await this.props.extractionService.getParagraphsResult(results.data_url);

    await this.props.createParagraphs.execute(paragraphs);
  }

  start(interval = 500) {
    this.taskManager.subscribeToResults(interval);
  }

  async stop() {
    await this.taskManager.stop();
  }
}
