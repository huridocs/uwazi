import { ObjectId } from 'mongodb';
import { featureFlaggedHandler } from '#api/common.v2/utils/featureFlaggedHandler.js';
import { FilesDataSource } from '#api/core/application/contracts/FilesDataSource.js';
import { FileStorage } from '#api/core/application/contracts/FileStorage.js';
import { SettingsDataSource } from '#api/core/application/contracts/SettingsDataSource.js';
import { PDFDocument } from '#api/core/domain/files/PDFDocument.js';
import { FilesDataSourceFactory } from '#api/core/infrastructure/factories/FilesDataSourceFactory.js';
import { SettingsDataSourceFactory } from '#api/core/infrastructure/factories/SettingsDataSourceFactory.js';
import { ExecutionContext } from '#api/core/libs/ExecutionContext.js';
import { FileStorageFactory } from '#api/core/infrastructure/files/FileStorageFactory.js';
import { getConnection } from '#api/core/infrastructure/mongodb/common/getConnectionForCurrentTenant.js';
import { FileMappers } from '#api/core/infrastructure/mongodb/files/FilesMappers.js';
import { EventsBus } from '#api/core/libs/eventsbus/index.js';
import { FilesDeletedEvent } from '#api/files/events/FilesDeletedEvent.js';
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
  private eventBus: EventsBus;

  constructor(eventBus: EventsBus) {
    this.eventBus = eventBus;
  }

  /**
   * Built per event, from the context of the tenant the event belongs to. Paragraph extraction
   * stores are Mongo-only; files and settings follow the tenant's postgresCore flag.
   */
  private static buildDependencies(): Dependencies {
    return {
      entitiesStatusDS: PXEntitiesStatusDataSourceFactory.createDefault({
        connection: getConnection(),
        mongoTransactionManager: ExecutionContext.mongoTransactionManager,
      }),
      filesDS: FilesDataSourceFactory.default(),
      settingsDS: SettingsDataSourceFactory.default(),
      fileStorage: FileStorageFactory.default(),
    };
  }

  private static async getDocumentsInInstalledLanguages(
    dependencies: Dependencies,
    sharedId: string,
    installedLanguages: LanguageISO6391[]
  ) {
    const documentsInInstalledLanguages =
      await dependencies.filesDS.getProcessedDocsForEntity(sharedId);

    return documentsInInstalledLanguages.filter(
      d => d.language !== undefined && installedLanguages.includes(d.language)
    );
  }

  private static async getInitialData(dependencies: Dependencies, deletedDocuments: PDFDocument[]) {
    const entityStatus = await dependencies.entitiesStatusDS.getExisting({
      entitySharedId: deletedDocuments[0].entity,
    });

    const installedLanguages = (await dependencies.settingsDS.getInstalledLanguages()).map(
      l => l.key
    );

    const documentsInInstalledLanguages =
      await PXFilesDeletedListener.getDocumentsInInstalledLanguages(
        dependencies,
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
  private static async onDocumentsDeleted(
    dependencies: Dependencies,
    deletedDocuments: PDFDocument[]
  ) {
    const { entityStatus, documentsInInstalledLanguages, installedLanguages } =
      await PXFilesDeletedListener.getInitialData(dependencies, deletedDocuments);

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
      await dependencies.entitiesStatusDS.markAsObsolete(entityStatus.id);
    } else {
      await dependencies.entitiesStatusDS.delete(entityStatus.id);
    }
  }

  private static async afterFilesDeleted({ files }: FilesDeletedEvent['data']) {
    const dependencies = PXFilesDeletedListener.buildDependencies();

    const deletedDocuments = files
      .filter(f => f.type === 'document' && f.status === 'ready')
      .map(d =>
        FileMappers.toModel(d as any, {
          contentLoader: dependencies.fileStorage.getFile.bind(dependencies.fileStorage),
        })
      );

    if (!deletedDocuments.length) {
      return;
    }

    await PXFilesDeletedListener.onDocumentsDeleted(
      dependencies,
      deletedDocuments.filter((d): d is PDFDocument => d instanceof PDFDocument)
    );
  }

  start() {
    this.eventBus.on(
      FilesDeletedEvent,
      featureFlaggedHandler('paragraphExtraction', PXFilesDeletedListener.afterFilesDeleted)
    );
  }
}
