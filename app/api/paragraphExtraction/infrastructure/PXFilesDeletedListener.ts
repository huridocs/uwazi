import { ObjectId } from 'mongodb';
// @ts-expect-error TS(2307): Cannot find module '../eventsbus.js' or its corres... Remove this comment to see the full error message
import { EventsBus } from '../eventsbus.js';
// @ts-expect-error TS(2307): Cannot find module '../files/events/FilesDeletedEv... Remove this comment to see the full error message
import { FilesDeletedEvent } from '../files/events/FilesDeletedEvent.js';
// @ts-expect-error TS(2307): Cannot find module '../common.v2/database/getConne... Remove this comment to see the full error message
import { getConnection } from 'api/common.v2/database/getConnectionForCurrentTenant.js';

import { DefaultTransactionManager } from 'api/common.v2/database/data_source_defaults.js';
// @ts-expect-error TS(2307): Cannot find module '../settings.v2/database/data_s... Remove this comment to see the full error message
import { DefaultSettingsDataSource } from '../settings.v2/database/data_source_defaults.js';
// @ts-expect-error TS(2307): Cannot find module '../files.v2/model/Document.js'... Remove this comment to see the full error message
import { Document } from '../files.v2/model/Document.js';
// @ts-expect-error TS(2307): Cannot find module '../files.v2/database/FilesMapp... Remove this comment to see the full error message
import { FileMappers } from '../files.v2/database/FilesMappers.js';
// @ts-expect-error TS(2307): Cannot find module '../settings.v2/contracts/Setti... Remove this comment to see the full error message
import { SettingsDataSource } from '../settings.v2/contracts/SettingsDataSource.js';

import { LanguageISO6391 } from 'shared/types/commonTypes.js';
// @ts-expect-error TS(2307): Cannot find module '../files.v2/contracts/FilesDat... Remove this comment to see the full error message
import { FilesDataSource } from '../files.v2/contracts/FilesDataSource.js';
// @ts-expect-error TS(2307): Cannot find module '../files.v2/database/data_sour... Remove this comment to see the full error message
import { DefaultFilesDataSource } from '../files.v2/database/data_source_defaults.js';
// @ts-expect-error TS(2307): Cannot find module '../common.v2/utils/featureFlag... Remove this comment to see the full error message
import { featureFlaggedHandler } from '../common.v2/utils/featureFlaggedHandler.js';
import { PXEntitiesStatusDataSource } from '../domain/PXEntitiesStatusDataSource';
import { PXEntitiesStatusDataSourceFactory } from './PXEntityStatusDataSourceFactory';

type Dependencies = {
  entitiesStatusDS: PXEntitiesStatusDataSource;
  filesDS: FilesDataSource;
  settingsDS: SettingsDataSource;
};

export class PXFilesDeletedListener {
  private dependencies!: Dependencies;

  private eventBus: EventsBus;

  constructor(eventBus: EventsBus) {
    this.eventBus = eventBus;
  }

  private setupDependencies() {
    const connection = getConnection();
    const mongoTransactionManager = DefaultTransactionManager();
    const entitiesStatusDS = PXEntitiesStatusDataSourceFactory.createDefault({
      connection,
      mongoTransactionManager,
    });

    const filesDS = DefaultFilesDataSource(mongoTransactionManager);
    const settingsDS = DefaultSettingsDataSource(mongoTransactionManager);

    this.dependencies = { entitiesStatusDS, filesDS, settingsDS };
  }

  private async getDocumentsInInstalledLanguages(
    sharedId: string,
    installedLanguages: LanguageISO6391[]
  ) {
    const documentsInInstalledLanguages = await this.dependencies.filesDS
      .getDocumentsForEntity(sharedId)
      .all();

    // @ts-expect-error TS(7006): Parameter 'd' implicitly has an 'any' type.
    return documentsInInstalledLanguages.filter(d => installedLanguages.includes(d.language));
  }

  private async getInitialData(deletedDocuments: Document[]) {
    const entityStatus = await this.dependencies.entitiesStatusDS.getExisting({
      entitySharedId: deletedDocuments[0].entity,
    });

    const installedLanguages = (await this.dependencies.settingsDS.getInstalledLanguages()).map(
      // @ts-expect-error TS(7006): Parameter 'l' implicitly has an 'any' type.
      l => l.key
    );

    const documentsInInstalledLanguages = await this.getDocumentsInInstalledLanguages(
      deletedDocuments[0].entity,
      installedLanguages
    );

    return {
      entityStatus,
      installedLanguages,
      documentsInInstalledLanguages,
    };
  }

  // eslint-disable-next-line max-statements
  private async onDocumentsDeleted(deletedDocuments: Document[]) {
    const { entityStatus, documentsInInstalledLanguages, installedLanguages } =
      await this.getInitialData(deletedDocuments);

    if (!entityStatus) {
      return;
    }

    const deletedDocumentsInInstalledLanguage = deletedDocuments.filter(d =>
      installedLanguages.includes(d.language)
    );

    if (!deletedDocumentsInInstalledLanguage.length) {
      return;
    }

    const deletedDocumentsUsedOnParagraphsExtraction = deletedDocumentsInInstalledLanguage.filter(
      document => {
        const sameLanguageDocuments = documentsInInstalledLanguages.filter(
          // @ts-expect-error TS(7006): Parameter 'd' implicitly has an 'any' type.
          d => d.language === document.language
        );

        if (!sameLanguageDocuments.length) {
          return true;
        }

        // @ts-expect-error TS(7006): Parameter 'oldest' implicitly has an 'any' type.
        const oldestDocument = sameLanguageDocuments.reduce((oldest, current) =>
          new ObjectId(oldest.id).getTimestamp() < new ObjectId(current.id).getTimestamp()
            ? oldest
            : current
        );

        return (
          new ObjectId(document.id).getTimestamp() < new ObjectId(oldestDocument.id).getTimestamp()
        );
      }
    );

    if (!deletedDocumentsUsedOnParagraphsExtraction.length) {
      return;
    }

    if (documentsInInstalledLanguages.length) {
      await this.dependencies.entitiesStatusDS.markAsObsolete(entityStatus.id);
    } else {
      await this.dependencies.entitiesStatusDS.delete(entityStatus.id);
    }
  }

  private async afterFilesDeleted({ files }: FilesDeletedEvent['data']) {
    this.setupDependencies();

    const deletedDocuments = files
      // @ts-expect-error TS(7006): Parameter 'f' implicitly has an 'any' type.
      .filter(f => f.type === 'document')
      // @ts-expect-error TS(7006): Parameter 'd' implicitly has an 'any' type.
      .map(d => FileMappers.toDocumentModel(d as any));

    if (!deletedDocuments.length) {
      return;
    }

    await this.onDocumentsDeleted(deletedDocuments);
  }

  start() {
    this.eventBus.on(
      FilesDeletedEvent,
      featureFlaggedHandler('paragraphExtraction', this.afterFilesDeleted.bind(this))
    );
  }
}
