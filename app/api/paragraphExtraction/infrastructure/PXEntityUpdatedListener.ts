import { EventsBus } from '#api/core/libs/eventsbus/index.js';
import { EntityUpdatedEvent } from '#api/entities/events/EntityUpdatedEvent.js';
import { EntitySchema } from '#shared/types/entityType.js';
import { getConnection } from '#api/core/infrastructure/mongodb/common/getConnectionForCurrentTenant.js';
import { TransactionManagerFactory } from '#api/core/infrastructure/factories/TransactionManagerFactory.js';
import { FilesDataSource } from '#api/core/application/contracts/FilesDataSource.js';
import { FilesDataSourceFactory } from '#api/core/infrastructure/factories/FilesDataSourceFactory.js';
import { SettingsDataSource } from '#api/core/application/contracts/SettingsDataSource.js';
import { SettingsDataSourceFactory } from '#api/core/infrastructure/factories/SettingsDataSourceFactory.js';
import { featureFlaggedHandler } from '#api/common.v2/utils/featureFlaggedHandler.js';
import { PXExtractorsDataSource } from '../domain/PXExtractorDataSource.js';
import { PXEntitiesStatusDataSource } from '../domain/PXEntitiesStatusDataSource.js';
import { PXEntitiesStatusDataSourceFactory } from './PXEntityStatusDataSourceFactory.js';
import { PXExtractorsDataSourceFactory } from './PXExtractorsDataSourceFactory.js';
import { EntityStatus } from '../domain/PXEntityStatusModel.js';

type Dependencies = {
  settingsDS: SettingsDataSource;
  filesDS: FilesDataSource;
  extractorsDS: PXExtractorsDataSource;
  entitiesStatusDS: PXEntitiesStatusDataSource;
};

type OnTemplateChangedProps = {
  oldEntity: EntitySchema;
  newEntity: EntitySchema;
};

export class PXEntityUpdatedListener {
  private dependencies!: Dependencies;

  private eventBus: EventsBus;

  constructor(eventBus: EventsBus) {
    this.eventBus = eventBus;
  }

  private setupDependencies() {
    const connection = getConnection();
    const mongoTransactionManager = TransactionManagerFactory.default();

    const extractorsDS = PXExtractorsDataSourceFactory.createDefault({
      connection,
      mongoTransactionManager,
    });

    const entitiesStatusDS = PXEntitiesStatusDataSourceFactory.createDefault({
      connection,
      mongoTransactionManager,
    });

    const filesDS = FilesDataSourceFactory.default();

    const settingsDS = SettingsDataSourceFactory.default(mongoTransactionManager);

    this.dependencies = {
      entitiesStatusDS,
      extractorsDS,
      filesDS,
      settingsDS,
    };
  }

  private async onTemplateChanged({ newEntity, oldEntity }: OnTemplateChangedProps) {
    await this.dependencies.entitiesStatusDS.deleteBySourceEntity(oldEntity.sharedId!);

    const extractor = await this.dependencies.extractorsDS.getBySourceTemplate(
      newEntity.template!.toString()
    );

    const languages = (await this.dependencies.settingsDS.getInstalledLanguages()).map(
      l => l.ISO639_1!
    );

    const documentsInInstalledLanguage = await this.dependencies.filesDS
      .getProcessedDocsForEntity(newEntity.sharedId!, { languages })
      .all();

    if (!extractor || !documentsInInstalledLanguage.length) {
      return;
    }

    await this.dependencies.entitiesStatusDS.createWithStatus({
      entitySharedId: newEntity.sharedId!,
      extractorId: extractor.id,
      status: EntityStatus.New,
    });
  }

  private async afterEntityUpdated({ before, after }: EntityUpdatedEvent['data']) {
    const templateHasChanged = after[0].template?.toString() !== before[0].template?.toString();

    if (!templateHasChanged) {
      return;
    }

    this.setupDependencies();

    await this.onTemplateChanged({ oldEntity: before[0], newEntity: after[0] });
  }

  start() {
    this.eventBus.on(
      EntityUpdatedEvent,
      featureFlaggedHandler('paragraphExtraction', this.afterEntityUpdated.bind(this))
    );
  }
}
