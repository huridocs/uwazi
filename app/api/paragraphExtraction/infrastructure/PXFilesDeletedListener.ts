import { ObjectId } from 'mongodb';
import { EventsBus } from 'api/core/libs/eventsbus';
import { FilesDeletedEvent } from 'api/files/events/FilesDeletedEvent';
import { getConnection } from 'api/common.v2/database/getConnectionForCurrentTenant';
import { DefaultTransactionManager } from 'api/common.v2/database/data_source_defaults';
import { DefaultSettingsDataSource } from 'api/settings.v2/database/data_source_defaults';
import { Document } from 'api/files.v2/model/Document';
import { FileMappers } from 'api/files.v2/database/FilesMappers';
import { SettingsDataSource } from 'api/settings.v2/contracts/SettingsDataSource';
import { LanguageISO6391 } from 'shared/types/commonTypes';
import { FilesDataSource } from 'api/files.v2/contracts/FilesDataSource';
import { DefaultFilesDataSource } from 'api/files.v2/database/data_source_defaults';
import { featureFlaggedHandler } from 'api/common.v2/utils/featureFlaggedHandler';
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

    return documentsInInstalledLanguages.filter(d => installedLanguages.includes(d.language));
  }

  private async getInitialData(deletedDocuments: Document[]) {
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
      .filter(f => f.type === 'document')
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
