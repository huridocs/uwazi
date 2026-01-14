import { ObjectId } from 'mongodb';

import { EventsBus } from '#api/eventsbus/index.js';

import { FilesDeletedEvent } from '#api/files/events/FilesDeletedEvent.js';

import { getConnection } from '#api/common.v2/database/getConnectionForCurrentTenant.js';

import { DefaultTransactionManager } from '#api/common.v2/database/data_source_defaults.js';

import { DefaultSettingsDataSource } from '#api/settings.v2/database/data_source_defaults.js';

import { Document } from '#api/files.v2/model/Document.js';

import { FileMappers } from '#api/files.v2/database/FilesMappers.js';

import { SettingsDataSource } from '#api/settings.v2/contracts/SettingsDataSource.js';

import { LanguageISO6391 } from '#shared/types/commonTypes.js';

import { FilesDataSource } from '#api/files.v2/contracts/FilesDataSource.js';

import { DefaultFilesDataSource } from '#api/files.v2/database/data_source_defaults.js';

import { featureFlaggedHandler } from '#api/common.v2/utils/featureFlaggedHandler.js';
import { PXEntitiesStatusDataSource } from '#api/paragraphExtraction/domain/PXEntitiesStatusDataSource.js';
import { PXEntitiesStatusDataSourceFactory } from './PXEntityStatusDataSourceFactory';

type Dependencies = {
  entitiesStatusDS: PXEntitiesStatusDataSource;
  filesDS: FilesDataSource;
  settingsDS: SettingsDataSource;
  fileStorage: FileStorage;
};

export class PXFilesDeletedListener {
  private dependencies!: Dependencies;

  private eventBus: EventsBus;

  constructor(eventBus: EventsBus) {
    this.eventBus = eventBus;
  }

  private setupDependencies() {
    const connection = getConnection();
    const mongoTransactionManager = TransactionManagerFactory.default();
    const entitiesStatusDS = PXEntitiesStatusDataSourceFactory.createDefault({
      connection,
      mongoTransactionManager,
    });

    const filesDS = FilesDataSourceFactory.default(mongoTransactionManager);
    const settingsDS = SettingsDataSourceFactory.default(mongoTransactionManager);
    const fileStorage = FileStorageFactory.default();

    this.dependencies = { entitiesStatusDS, filesDS, settingsDS, fileStorage };
  }

  private async getDocumentsInInstalledLanguages(
    sharedId: string,
    installedLanguages: LanguageISO6391[]
  ) {
    const documentsInInstalledLanguages = await this.dependencies.filesDS
      .getProcessedDocsForEntity(sharedId)
      .all();

    return documentsInInstalledLanguages.filter(d => installedLanguages.includes(d.language));
  }

  private async getInitialData(deletedDocuments: ProcessedPDF[]) {
    const entityStatus = await this.dependencies.entitiesStatusDS.getExisting({
      entitySharedId: deletedDocuments[0].entity,
    });

    const installedLanguages = (await this.dependencies.settingsDS.getInstalledLanguages()).map(
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
  private async onDocumentsDeleted(deletedDocuments: ProcessedPDF[]) {
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
          d => d.language === document.language
        );

        if (!sameLanguageDocuments.length) {
          return true;
        }

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
      .filter(f => f.type === 'document' && f.status === 'ready')
      .map(d =>
        FileMappers.toModel(d as any, {
          contentLoader: this.dependencies.fileStorage.getFile.bind(this.dependencies.fileStorage),
        })
      );

    if (!deletedDocuments.length) {
      return;
    }

    await this.onDocumentsDeleted(
      deletedDocuments.filter((d): d is ProcessedPDF => d instanceof ProcessedPDF)
    );
  }

  start() {
    this.eventBus.on(
      FilesDeletedEvent,
      featureFlaggedHandler('paragraphExtraction', this.afterFilesDeleted.bind(this))
    );
  }
}
