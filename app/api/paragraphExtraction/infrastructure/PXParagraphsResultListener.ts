import users from 'api/users/users';
import { TaskManager } from 'api/services/tasksmanager/TaskManager';
import { tenants } from 'api/tenants';
import { permissionsContext } from 'api/permissions/permissionsContext';

import { PXExtractionService } from '../domain/PXExtractionService';
import { PXExtractionServiceFactory } from './PXExtractionServiceFactory';
import { PXCreateParagraphsFactory } from './PXCreateParagraphsFactory';

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

  private extractionService: PXExtractionService;

  constructor() {
    this.taskManager = new TaskManager({
      serviceName: PXParagraphsResultListener.SERVICE_NAME,
      processResults: this.processResults.bind(this) as any,
    });
    this.extractionService = PXExtractionServiceFactory.createDefault();
  }

  private async processResults(results: ResultMessage) {
    if (!results.success || !results.data_url) return;

    const result = await this.extractionService.getParagraphsResult(results.data_url);

    await tenants.run(async () => {
      await this.setCurrentUser(result.extractionId.userId);
      await this.getUseCase().execute(result);
    }, result.extractionId.tenantName);
  }

  // eslint-disable-next-line class-methods-use-this
  private getUseCase() {
    return PXCreateParagraphsFactory.createDefault();
  }

  // eslint-disable-next-line class-methods-use-this
  private async setCurrentUser(userId: string) {
    const user = await users.getById(userId, '-password', true);
    permissionsContext.setUserInContext(user);
  }

  start(interval = 500) {
    this.taskManager.subscribeToResults(interval);
  }

  async stop() {
    await this.taskManager.stop();
  }
}

export type { ResultMessage };
