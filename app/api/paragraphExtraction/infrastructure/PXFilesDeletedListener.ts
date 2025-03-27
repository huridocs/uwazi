import { EventsBus } from 'api/eventsbus';
import { FilesDeletedEvent } from 'api/files/events/FilesDeletedEvent';
import { getConnection } from 'api/common.v2/database/getConnectionForCurrentTenant';
import { DefaultTransactionManager } from 'api/common.v2/database/data_source_defaults';
import { DefaultFilesDataSource } from 'api/files.v2/database/data_source_defaults';
import { DefaultSettingsDataSource } from 'api/settings.v2/database/data_source_defaults';
import { Document } from 'api/files.v2/model/Document';
import { FileMappers } from 'api/files.v2/database/FilesMappers';
import { FilesDataSource } from 'api/files.v2/contracts/FilesDataSource';
import { SettingsDataSource } from 'api/settings.v2/contracts/SettingsDataSource';

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
    if (!this.dependencies) {
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
  }

  // eslint-disable-next-line max-statements
  private async onDocumentsDeleted(deletedDocuments: Document[]) {
    const languagesInstalled = (await this.dependencies.settingsDS.getInstalledLanguages()).map(
      l => l.key
    );

    const documentsInInstalledLanguages = (
      await this.dependencies.filesDS.getDocumentsForEntity(deletedDocuments[0].entity).all()
    ).filter(d => languagesInstalled.includes(d.language));

    const deletedDocumentsInInstalledLanguage = deletedDocuments.filter(d =>
      languagesInstalled.includes(d.language)
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
          new Date(oldest.creationDate!) < new Date(current.creationDate!) ? oldest : current
        );

        return document.creationDate! < oldestDocument.creationDate!;
      }
    );

    if (!deletedDocumentsUsedOnParagraphsExtraction.length) {
      return;
    }

    const entityStatus = await this.dependencies.entitiesStatusDS.getExisting({
      entitySharedId: deletedDocumentsUsedOnParagraphsExtraction[0].entity,
    });

    if (!entityStatus) {
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

    const documents = files
      .filter(f => f.type === 'document')
      .map(d => FileMappers.toDocumentModel(d as any));

    if (!documents.length) {
      return;
    }

    await this.onDocumentsDeleted(documents);
  }

  start() {
    this.eventBus.on(FilesDeletedEvent, this.afterFilesDeleted.bind(this));
  }
}
