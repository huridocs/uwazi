import { ObjectId } from 'mongodb';

// @ts-expect-error TS(2307): Cannot find module '../../shared/types/fileType.js... Remove this comment to see the full error message
import { FileType as LegacyFileType } from 'shared/types/fileType.js';
// @ts-expect-error TS(2307): Cannot find module '../files.v2/model/FileType.js'... Remove this comment to see the full error message
import { FileType } from '../files.v2/model/FileType.js';

import { LanguageISO6391 } from 'shared/types/commonTypes.js';
// @ts-expect-error TS(2307): Cannot find module '../settings.v2/contracts/Setti... Remove this comment to see the full error message
import { SettingsDataSource } from '../settings.v2/contracts/SettingsDataSource.js';
// @ts-expect-error TS(2307): Cannot find module '../files.v2/contracts/FilesDat... Remove this comment to see the full error message
import { FilesDataSource } from '../files.v2/contracts/FilesDataSource.js';
// @ts-expect-error TS(2307): Cannot find module '../files.v2/model/Document.js'... Remove this comment to see the full error message
import { Document } from '../files.v2/model/Document.js';
// @ts-expect-error TS(2307): Cannot find module '../entities.v2/contracts/Entit... Remove this comment to see the full error message
import { EntitiesDataSource } from '../entities.v2/contracts/EntitiesDataSource.js';

import { PXEntitiesStatusDataSource } from '../domain/PXEntitiesStatusDataSource';
import { PXExtractorsDataSource } from '../domain/PXExtractorDataSource';
import { PXValidationError } from '../domain/PXValidationError';
import { EntityStatus } from '../domain/PXEntityStatusModel';

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
      // @ts-expect-error TS(7006): Parameter 'l' implicitly has an 'any' type.
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
          .getDocumentsForEntity(entity.sharedId!, { languages: installedLanguages })
          .all()
      ).reduce(
        // @ts-expect-error TS(7006): Parameter 'acc' implicitly has an 'any' type.
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
        {} as Record<string, Document>
      );

      const isDocumentUsedForExtraction = Object.values(documentsInInstalledLanguages).some(
        // @ts-expect-error TS(2571): Object is of type 'unknown'.
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
