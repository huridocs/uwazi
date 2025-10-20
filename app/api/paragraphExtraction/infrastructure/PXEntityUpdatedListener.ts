import { EventsBus } from 'api/core/libs/eventsbus';
import { EntityUpdatedEvent } from 'api/entities/events/EntityUpdatedEvent';
import { EntitySchema } from 'shared/types/entityType';
import { getConnection } from 'api/common.v2/database/getConnectionForCurrentTenant';
import { DefaultTransactionManager } from 'api/common.v2/database/data_source_defaults';
import { FilesDataSource } from 'api/files.v2/contracts/FilesDataSource';
import { DefaultFilesDataSource } from 'api/files.v2/database/data_source_defaults';
import { SettingsDataSource } from 'api/settings.v2/contracts/SettingsDataSource';
import { DefaultSettingsDataSource } from 'api/settings.v2/database/data_source_defaults';
import { featureFlaggedHandler } from 'api/common.v2/utils/featureFlaggedHandler';
import { PXExtractorsDataSource } from '../domain/PXExtractorDataSource';
import { PXEntitiesStatusDataSource } from '../domain/PXEntitiesStatusDataSource';
import { PXEntitiesStatusDataSourceFactory } from './PXEntityStatusDataSourceFactory';
import { PXExtractorsDataSourceFactory } from './PXExtractorsDataSourceFactory';
import { EntityStatus } from '../domain/PXEntityStatusModel';

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
    const mongoTransactionManager = DefaultTransactionManager();

    const extractorsDS = PXExtractorsDataSourceFactory.createDefault({
      connection,
      mongoTransactionManager,
    });

    const entitiesStatusDS = PXEntitiesStatusDataSourceFactory.createDefault({
      connection,
      mongoTransactionManager,
    });

    const filesDS = DefaultFilesDataSource(mongoTransactionManager);

    const settingsDS = DefaultSettingsDataSource(mongoTransactionManager);

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
      .getDocumentsForEntity(newEntity.sharedId!, { languages })
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
