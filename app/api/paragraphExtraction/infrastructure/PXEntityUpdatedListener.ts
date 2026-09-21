import { EventsBus } from '#api/core/libs/eventsbus/index.js';
import { EntityUpdatedEvent } from '#api/entities/events/EntityUpdatedEvent.js';
import { EntitySchema } from '#shared/types/entityType.js';
import { getConnection } from '#api/core/infrastructure/mongodb/common/getConnectionForCurrentTenant.js';
import { ExecutionContext } from '#api/core/libs/ExecutionContext.js';
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
  private eventBus: EventsBus;

  constructor(eventBus: EventsBus) {
    this.eventBus = eventBus;
  }

  /**
   * Built per event, from the context of the tenant the event belongs to. Paragraph extraction
   * stores are Mongo-only; files and settings follow the tenant's postgresCore flag.
   */
  private static buildDependencies(): Dependencies {
    const connection = getConnection();
    const { mongoTransactionManager } = ExecutionContext;

    return {
      extractorsDS: PXExtractorsDataSourceFactory.createDefault({
        connection,
        mongoTransactionManager,
      }),
      entitiesStatusDS: PXEntitiesStatusDataSourceFactory.createDefault({
        connection,
        mongoTransactionManager,
      }),
      filesDS: FilesDataSourceFactory.default(),
      settingsDS: SettingsDataSourceFactory.default(),
    };
  }

  private static async onTemplateChanged(
    dependencies: Dependencies,
    { newEntity, oldEntity }: OnTemplateChangedProps
  ) {
    await dependencies.entitiesStatusDS.deleteBySourceEntity(oldEntity.sharedId!);

    const extractor = await dependencies.extractorsDS.getBySourceTemplate(
      newEntity.template!.toString()
    );

    const languages = (await dependencies.settingsDS.getInstalledLanguages()).map(l => l.ISO639_1!);

    const documentsInInstalledLanguage = await dependencies.filesDS.getProcessedDocsForEntity(
      newEntity.sharedId!,
      { languages }
    );

    if (!extractor || !documentsInInstalledLanguage.length) {
      return;
    }

    await dependencies.entitiesStatusDS.createWithStatus({
      entitySharedId: newEntity.sharedId!,
      extractorId: extractor.id,
      status: EntityStatus.New,
    });
  }

  private static async afterEntityUpdated({ before, after }: EntityUpdatedEvent['data']) {
    const templateHasChanged = after[0].template?.toString() !== before[0].template?.toString();

    if (!templateHasChanged) {
      return;
    }

    await PXEntityUpdatedListener.onTemplateChanged(PXEntityUpdatedListener.buildDependencies(), {
      oldEntity: before[0],
      newEntity: after[0],
    });
  }

  start() {
    this.eventBus.on(
      EntityUpdatedEvent,
      featureFlaggedHandler('paragraphExtraction', PXEntityUpdatedListener.afterEntityUpdated)
    );
  }
}
