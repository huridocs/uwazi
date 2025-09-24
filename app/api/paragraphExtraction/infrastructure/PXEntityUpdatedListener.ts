// @ts-expect-error TS(2307): Cannot find module '../eventsbus.js' or its corres... Remove this comment to see the full error message
import { EventsBus } from '../eventsbus.js';
// @ts-expect-error TS(2307): Cannot find module '../entities/events/EntityUpdat... Remove this comment to see the full error message
import { EntityUpdatedEvent } from '../entities/events/EntityUpdatedEvent.js';
// @ts-expect-error TS(2307): Cannot find module '../../shared/types/entityType.... Remove this comment to see the full error message
import { EntitySchema } from 'shared/types/entityType.js';
// @ts-expect-error TS(2307): Cannot find module '../common.v2/database/getConne... Remove this comment to see the full error message
import { getConnection } from 'api/common.v2/database/getConnectionForCurrentTenant.js';

import { DefaultTransactionManager } from 'api/common.v2/database/data_source_defaults.js';
// @ts-expect-error TS(2307): Cannot find module '../files.v2/contracts/FilesDat... Remove this comment to see the full error message
import { FilesDataSource } from '../files.v2/contracts/FilesDataSource.js';
// @ts-expect-error TS(2307): Cannot find module '../files.v2/database/data_sour... Remove this comment to see the full error message
import { DefaultFilesDataSource } from '../files.v2/database/data_source_defaults.js';
// @ts-expect-error TS(2307): Cannot find module '../settings.v2/contracts/Setti... Remove this comment to see the full error message
import { SettingsDataSource } from '../settings.v2/contracts/SettingsDataSource.js';
// @ts-expect-error TS(2307): Cannot find module '../settings.v2/database/data_s... Remove this comment to see the full error message
import { DefaultSettingsDataSource } from '../settings.v2/database/data_source_defaults.js';
// @ts-expect-error TS(2307): Cannot find module '../common.v2/utils/featureFlag... Remove this comment to see the full error message
import { featureFlaggedHandler } from '../common.v2/utils/featureFlaggedHandler.js';
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
      // @ts-expect-error TS(7006): Parameter 'l' implicitly has an 'any' type.
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
