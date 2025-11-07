import { ObjectId } from 'mongodb';

import { SettingsDataSource } from 'api/core/application/contracts/SettingsDataSource';
import { EntitiesDataSource } from 'api/entities.v2/contracts/EntitiesDataSource';
import { FilesDataSource } from 'api/files.v2/contracts/FilesDataSource';
import { FileType } from 'api/files.v2/model/FileType';
import { LanguageISO6391 } from 'shared/types/commonTypes';
import { FileType as LegacyFileType } from 'shared/types/fileType';

import { ProcessedDocument } from 'api/files.v2/model/ProcessedDocument';
import { PXEntitiesStatusDataSource } from '../domain/PXEntitiesStatusDataSource';
import { EntityStatus } from '../domain/PXEntityStatusModel';
import { PXExtractorsDataSource } from '../domain/PXExtractorDataSource';
import { PXValidationError } from '../domain/PXValidationError';

type Dependencies = {
  entitiesStatusDS: PXEntitiesStatusDataSource;
  entitiesDS: EntitiesDataSource;
  settingsDS: SettingsDataSource;
  extractorsDS: PXExtractorsDataSource;
  filesDS: FilesDataSource;
};

type FileModel = {
  id: string;
  type: FileType;
  language?: LanguageISO6391;
  entity: string;
  status: Required<LegacyFileType['status']>;
};

export type PXEntityStatusManagerInput = {
  before: FileModel;
  after: FileModel;
};

export class PXEntityStatusManager {
  constructor(private dependencies: Dependencies) {}

  // eslint-disable-next-line max-statements
  async execute({ after, before }: PXEntityStatusManagerInput) {
    if (after.type !== 'document') {
      throw new PXValidationError(
        PXValidationError.codes.INVALID_FILE_TYPE,
        `File with id of ${after.entity} is not of the type Document`
      );
    }

    if (after.status !== 'ready') {
      throw new PXValidationError(
        PXValidationError.codes.DOCUMENT_IS_NOT_READY_TO_BE_USED,
        `Document with id of ${after.entity}, cannot be used to create a EntityStatus while is not processed`
      );
    }

    if (before.language === after.language) {
      throw new PXValidationError(
        PXValidationError.codes.DOCUMENT_DO_NOT_HAVE_CHANGE_CRITERIA,
        `Document with id of ${after.entity} does not have a relevant change for EntityStatus`
      );
    }

    const installedLanguages = (await this.dependencies.settingsDS.getInstalledLanguages()).map(
      l => l.key
    );

    if (!installedLanguages.includes(after.language!)) {
      throw new PXValidationError(
        PXValidationError.codes.DOCUMENT_DO_NOT_MEET_ENTITY_STATUS_CRITERIA,
        `Cannot manage EntityStatus for a Document language that does not belongs to UI Languages. sharedId: ${after.entity}`
      );
    }

    const [entity] = await this.dependencies.entitiesDS.getByIds([after.entity]).all();

    if (!entity) {
      throw new PXValidationError(
        PXValidationError.codes.CANNOT_MANAGE_ENTITY_STATUS_FOR_SOURCE_TEMPLATE_NOT_EXISTING,
        `Cannot manage EntityStatus for a source Entity that does not exist. sharedId: ${after.entity}`
      );
    }

    const extractor = await this.dependencies.extractorsDS.getBySourceTemplate(
      entity.template!.toString()
    );

    if (!extractor) {
      throw new PXValidationError(
        PXValidationError.codes.CANNOT_MANAGE_ENTITY_STATUS_FOR_SOURCE_TEMPLATE_NOT_MATCHING_CRITERIA,
        'Cannot manage EntityStatus for a source Entity that does not match Extractor'
      );
    }

    const entityStatus = await this.dependencies.entitiesStatusDS.getExisting({
      entitySharedId: entity.sharedId!,
      extractorId: extractor.id,
    });

    if (entityStatus) {
      const documentsInInstalledLanguages = (
        await this.dependencies.filesDS
          .getProcessedDocsForEntity(entity.sharedId!, { languages: installedLanguages })
          .all()
      ).reduce(
        (acc, file) => {
          const existingDocument = acc[file.language!];
          if (!existingDocument) {
            return { ...acc, [file.language!]: file };
          }

          const existingDocumentDate = new ObjectId(existingDocument.id).getTimestamp();
          const newDocumentDate = new ObjectId(file.id).getTimestamp();

          return {
            ...acc,
            [file.language!]: existingDocumentDate < newDocumentDate ? existingDocument : file,
          };
        },
        {} as Record<string, ProcessedDocument>
      );

      const isDocumentUsedForExtraction = Object.values(documentsInInstalledLanguages).some(
        d => d.id === after.id
      );

      if (!isDocumentUsedForExtraction) {
        return;
      }

      await this.dependencies.entitiesStatusDS.markAsObsolete(entityStatus.id);
    } else {
      await this.dependencies.entitiesStatusDS.createWithStatus({
        extractorId: extractor.id,
        entitySharedId: entity.sharedId!,
        status: EntityStatus.New,
      });
    }
  }
}
