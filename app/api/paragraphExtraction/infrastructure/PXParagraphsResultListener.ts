import users from 'api/users/users';
import { TaskManager } from 'api/services/tasksmanager/TaskManager';
import { tenants } from 'api/tenants';
import { getConnection } from 'api/common.v2/database/getConnectionForCurrentTenant';
import { DefaultTransactionManager } from 'api/common.v2/database/data_source_defaults';
import { permissionsContext } from 'api/permissions/permissionsContext';

import { PXExtractionService } from '../domain/PXExtractionService';
import { PXExtractionServiceFactory } from './PXExtractionServiceFactory';
import { PXCreateParagraphsFactory } from './PXCreateParagraphsFactory';
import { PXExtractionKey } from '../domain/PXExtractionKey';
import { PXEntitiesStatusDataSourceFactory } from './PXEntityStatusDataSourceFactory';

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
    this.extractionService = PXExtractionServiceFactory.createDefault();
    this.taskManager = new TaskManager({
      serviceName: PXParagraphsResultListener.SERVICE_NAME,
      processResults: this.processResults.bind(this) as any,
    });
  }

  private async processResults(results: ResultMessage) {
    const extractionKey = new PXExtractionKey(results.key);

    await tenants.run(async () => {
      try {
        if (!results.success || !results.data_url) {
          throw new Error(`Paragraph Extraction failed - ${JSON.stringify(extractionKey)}`);
        }

        const result = await this.extractionService.getParagraphsResult(results.data_url);

        await this.setCurrentUser(extractionKey.userId);
        await this.getUseCase().execute(result);
      } catch (e) {
        const entitiesStatusDS = PXEntitiesStatusDataSourceFactory.createDefault({
          connection: getConnection(),
          mongoTransactionManager: DefaultTransactionManager(),
        });

        await entitiesStatusDS.setAsError(extractionKey.entityStatusId);

        throw e;
      }
    }, extractionKey.tenantName);
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
