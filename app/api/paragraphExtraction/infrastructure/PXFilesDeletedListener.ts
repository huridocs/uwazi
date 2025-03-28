import { EventsBus } from 'api/eventsbus';
import { FilesDeletedEvent } from 'api/files/events/FilesDeletedEvent';
import { getConnection } from 'api/common.v2/database/getConnectionForCurrentTenant';
import { DefaultTransactionManager } from 'api/common.v2/database/data_source_defaults';
import { DefaultSettingsDataSource } from 'api/settings.v2/database/data_source_defaults';
import { Document } from 'api/files.v2/model/Document';
import { FileMappers } from 'api/files.v2/database/FilesMappers';
import { SettingsDataSource } from 'api/settings.v2/contracts/SettingsDataSource';
import { files as filesDS } from 'api/files';

import { PXEntitiesStatusDataSource } from '../domain/PXEntitiesStatusDataSource';
import { PXEntitiesStatusDataSourceFactory } from './PXEntityStatusDataSourceFactory';

type LegacyFilesDS = typeof filesDS;

type Dependencies = {
  entitiesStatusDS: PXEntitiesStatusDataSource;
  filesDS: LegacyFilesDS;
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

      const settingsDS = DefaultSettingsDataSource(mongoTransactionManager);

      this.dependencies = { entitiesStatusDS, filesDS, settingsDS };
    }
  }

  private async getDocumentsInInstalledLanguages(sharedId: string, iso3Languages: string[]) {
    const documentsInInstalledLanguages = await this.dependencies.filesDS.get({
      entity: sharedId,
      type: 'document',
      language: { $in: iso3Languages },
    });

    return documentsInInstalledLanguages.map(d => FileMappers.toDocumentModel(d as any));
  }

  private async getInitialData(deletedDocuments: Document[]) {
    const entityStatus = await this.dependencies.entitiesStatusDS.getExisting({
      entitySharedId: deletedDocuments[0].entity,
    });

    const installedLanguages = await this.dependencies.settingsDS.getInstalledLanguages();

    const documentsInInstalledLanguages = await this.getDocumentsInInstalledLanguages(
      deletedDocuments[0].entity,
      installedLanguages.map(l => l.ISO639_3!)
    );

    return {
      entityStatus,
      installedLanguages: installedLanguages.map(l => l.key),
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

    if (documentsInInstalledLanguages.length) {
      await this.dependencies.entitiesStatusDS.markAsObsolete(entityStatus.id);
    } else {
      await this.dependencies.entitiesStatusDS.delete(entityStatus.id);
    }
  }

  private async afterFilesDeleted({ files }: FilesDeletedEvent['data']) {
    this.setupDependencies();

    const deletedDocuments = files
      .filter(f => f.type === 'document')
      .map(d => FileMappers.toDocumentModel(d as any));

    if (!deletedDocuments.length) {
      return;
    }

    await this.onDocumentsDeleted(deletedDocuments);
  }

  start() {
    this.eventBus.on(FilesDeletedEvent, this.afterFilesDeleted.bind(this));
  }
}
