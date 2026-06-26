import { CreateDatavizUseCase } from '#api/dataviz.v2/application/useCases/CreateDataviz.js';
import { UpdateDatavizUseCase } from '#api/dataviz.v2/application/useCases/UpdateDataviz.js';
import { DeleteDatavizUseCase } from '#api/dataviz.v2/application/useCases/DeleteDataviz.js';
import { ListDatavizUseCase } from '#api/dataviz.v2/application/useCases/ListDataviz.js';
import { GetDatavizDefinitionUseCase } from '#api/dataviz.v2/application/useCases/GetDatavizDefinition.js';
import { GetDatavizDataUseCase } from '#api/dataviz.v2/application/useCases/GetDatavizData.js';
import { GetPublicDatavizEmbedUseCase } from '#api/dataviz.v2/application/useCases/GetPublicDatavizEmbed.js';
import { RefreshDatavizSnapshotJob } from '#api/dataviz.v2/application/jobs/RefreshDatavizSnapshotJob.js';
import { ExecutionContext } from '#api/core/libs/ExecutionContext.js';
import { CachedTranslationsDataSource } from '#api/i18n.v2/database/data_source_defaults.js';
import { getConnection } from '#api/core/infrastructure/mongodb/common/getConnectionForCurrentTenant.js';
import { MongoTransactionManager } from '#api/core/infrastructure/mongodb/common/MongoTransactionManager.js';
import { IdGeneratorFactory } from '#api/core/infrastructure/factories/IdGeneratorFactory.js';
import { SettingsDataSourceFactory } from '#api/core/infrastructure/factories/SettingsDataSourceFactory.js';
import { TemplatesDataSourceFactory } from '#api/core/infrastructure/factories/TemplatesDataSourceFactory.js';
import { TemplatesDAOFactory } from '#api/core/infrastructure/factories/TemplatesDAOFactory.js';
import { ThesauriDAOFactory } from '#api/core/infrastructure/factories/ThesauriDAOFactory.js';
import { MongoEntitiesDAOFactory } from '#api/core/infrastructure/factories/MongoEntitiesDAOFactory.js';
import type { LanguageISO6391 } from '#shared/types/commonTypes.js';
import { MongoDatavizDataSource } from '../mongodb/MongoDatavizDataSource.js';
import { MongoDatavizSnapshotsDataSource } from '../mongodb/MongoDatavizSnapshotsDataSource.js';
import { MongoDatavizQueryExecutor } from '../mongodb/MongoDatavizQueryExecutor.js';
import type {
  EntitiesReadDAO,
  TemplatesReadDAO,
} from '../mongodb/executor/buildDatavizMultilingualLabelContext.js';
import { DatavizSchedulerService } from '../services/DatavizSchedulerService.js';
import { DatavizScheduledRefreshJobHandler } from '../jobHandlers/DatavizScheduledRefreshJobHandler.js';

class DatavizFactory {
  private static getTransactionManager(): MongoTransactionManager {
    return ExecutionContext.transactionManager as MongoTransactionManager;
  }

  private static getExecutionScope() {
    const { tenant, actor } = ExecutionContext;
    return { tenant, actor, transactionManager: this.getTransactionManager() };
  }

  static dataSource() {
    return new MongoDatavizDataSource(getConnection(), this.getTransactionManager());
  }

  static snapshotsDataSource() {
    return new MongoDatavizSnapshotsDataSource(getConnection(), this.getTransactionManager());
  }

  static queryExecutor() {
    const transactionManager = this.getTransactionManager();

    return new MongoDatavizQueryExecutor(getConnection(), transactionManager, {
      settingsDS: SettingsDataSourceFactory.cached({ transactionManager }),
      translationsDS: CachedTranslationsDataSource(transactionManager),
      templatesDAO: TemplatesDAOFactory.default() as TemplatesReadDAO,
      thesauriDAO: ThesauriDAOFactory.default(),
      entitiesDAO: MongoEntitiesDAOFactory.default() as EntitiesReadDAO,
    });
  }

  static schedulerService() {
    return new DatavizSchedulerService({
      jobsDispatcher: ExecutionContext.jobsDispatcher,
      tenantName: ExecutionContext.tenant.name,
    });
  }

  static createUseCase() {
    const { tenant, actor, transactionManager } = this.getExecutionScope();

    return new CreateDatavizUseCase(
      {
        transactionManager,
        idGenerator: IdGeneratorFactory.default(),
        datavizDS: this.dataSource(),
        snapshotsDS: this.snapshotsDataSource(),
        queryExecutor: this.queryExecutor(),
        templatesDS: TemplatesDataSourceFactory.default(),
        scheduler: this.schedulerService(),
      },
      { actor, tenant }
    );
  }

  static updateUseCase() {
    const { tenant, actor, transactionManager } = this.getExecutionScope();

    return new UpdateDatavizUseCase(
      {
        transactionManager,
        datavizDS: this.dataSource(),
        snapshotsDS: this.snapshotsDataSource(),
        queryExecutor: this.queryExecutor(),
        templatesDS: TemplatesDataSourceFactory.default(),
        scheduler: this.schedulerService(),
      },
      { actor, tenant }
    );
  }

  static deleteUseCase() {
    const { tenant, actor, transactionManager } = this.getExecutionScope();

    return new DeleteDatavizUseCase(
      {
        transactionManager,
        datavizDS: this.dataSource(),
        snapshotsDS: this.snapshotsDataSource(),
        scheduler: this.schedulerService(),
      },
      { actor, tenant }
    );
  }

  static listUseCase() {
    const { tenant, actor } = this.getExecutionScope();

    return new ListDatavizUseCase({ datavizDS: this.dataSource() }, { actor, tenant });
  }

  static getDefinitionUseCase() {
    const { tenant, actor } = this.getExecutionScope();

    return new GetDatavizDefinitionUseCase({ datavizDS: this.dataSource() }, { actor, tenant });
  }

  static getDataUseCase() {
    const { tenant, actor } = this.getExecutionScope();

    return new GetDatavizDataUseCase(
      {
        datavizDS: this.dataSource(),
        snapshotsDS: this.snapshotsDataSource(),
        queryExecutor: this.queryExecutor(),
      },
      { actor, tenant }
    );
  }

  static getPublicEmbedUseCase(overrides?: { targetLanguage?: LanguageISO6391 }) {
    const { tenant, actor } = this.getExecutionScope();

    return new GetPublicDatavizEmbedUseCase(
      {
        datavizDS: this.dataSource(),
        snapshotsDS: this.snapshotsDataSource(),
        settingsDS: SettingsDataSourceFactory.default({
          transactionManager: this.getTransactionManager(),
        }),
      },
      { actor, tenant, targetLanguage: overrides?.targetLanguage }
    );
  }

  static refreshSnapshotJob() {
    const { tenant, actor, transactionManager } = this.getExecutionScope();

    return new RefreshDatavizSnapshotJob(
      {
        transactionManager,
        datavizDS: this.dataSource(),
        snapshotsDS: this.snapshotsDataSource(),
        queryExecutor: this.queryExecutor(),
        templatesDS: TemplatesDataSourceFactory.default(),
      },
      { actor, tenant }
    );
  }

  static scheduledRefreshJobHandler(_namespace: string) {
    return new DatavizScheduledRefreshJobHandler({
      job: this.refreshSnapshotJob(),
      datavizDS: this.dataSource(),
      jobsDispatcher: ExecutionContext.jobsDispatcher,
    });
  }
}

export { DatavizFactory };
