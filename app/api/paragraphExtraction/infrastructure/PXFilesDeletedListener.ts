import { featureFlaggedHandler } from '#api/common.v2/utils/featureFlaggedHandler.js';
import { FilesDataSource } from '#api/core/application/contracts/FilesDataSource.js';
import { FileStorage } from '#api/core/application/contracts/FileStorage.js';
import { SettingsDataSource } from '#api/core/application/contracts/SettingsDataSource.js';
import { PDFDocument } from '#api/core/domain/files/PDFDocument.js';
import { FilesDataSourceFactory } from '#api/core/infrastructure/factories/FilesDataSourceFactory.js';
import { SettingsDataSourceFactory } from '#api/core/infrastructure/factories/SettingsDataSourceFactory.js';
import { TransactionManagerFactory } from '#api/core/infrastructure/factories/TransactionManagerFactory.js';
import { FileStorageFactory } from '#api/core/infrastructure/files/FileStorageFactory.js';
import { getConnection } from '#api/core/infrastructure/mongodb/common/getConnectionForCurrentTenant.js';
import { FileMappers } from '#api/core/infrastructure/mongodb/files/FilesMappers.js';
import { EventsBus } from '#api/core/libs/eventsbus/index.js';
import { FilesDeletedEvent } from '#api/files/events/FilesDeletedEvent.js';
import { ObjectId } from 'mongodb';
import { LanguageISO6391 } from '#shared/types/commonTypes.js';
import { PXEntitiesStatusDataSource } from '../domain/PXEntitiesStatusDataSource.js';
import { PXEntitiesStatusDataSourceFactory } from './PXEntityStatusDataSourceFactory.js';

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

    const filesDS = FilesDataSourceFactory.default({ transactionManager: mongoTransactionManager });
    const settingsDS = SettingsDataSourceFactory.default({
      transactionManager: mongoTransactionManager,
    });
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

    return documentsInInstalledLanguages.filter(
      d => d.language !== undefined && installedLanguages.includes(d.language)
    );
  }

  private async getInitialData(deletedDocuments: PDFDocument[]) {
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
  private async onDocumentsDeleted(deletedDocuments: PDFDocument[]) {
    const { entityStatus, documentsInInstalledLanguages, installedLanguages } =
      await this.getInitialData(deletedDocuments);

    if (!entityStatus) {
      return;
    }

    const deletedDocumentsInInstalledLanguage = deletedDocuments.filter(
      d => d.language !== undefined && installedLanguages.includes(d.language)
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
      deletedDocuments.filter((d): d is PDFDocument => d instanceof PDFDocument)
    );
  }

  start() {
    this.eventBus.on(
      FilesDeletedEvent,
      featureFlaggedHandler('paragraphExtraction', this.afterFilesDeleted.bind(this))
    );
  }
}
