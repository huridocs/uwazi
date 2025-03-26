import { FileType as LegacyFileType } from 'shared/types/fileType';
import { FileType } from 'api/files.v2/model/FileType';
import { LanguageISO6391 } from 'shared/types/commonTypes';
import { SettingsDataSource } from 'api/settings.v2/contracts/SettingsDataSource';
import entities from 'api/entities';

import { PXEntitiesStatusDataSource } from '../domain/PXEntitiesStatusDataSource';
import { PXExtractorsDataSource } from '../domain/PXExtractorDataSource';
import { PXValidationError } from '../domain/PXValidationError';

type LegacyEntitiesDS = typeof entities;

type Dependencies = {
  entitiesStatusDS: PXEntitiesStatusDataSource;
  entitiesDS: LegacyEntitiesDS;
  settingsDS: SettingsDataSource;
  extractorsDS: PXExtractorsDataSource;
};

type FileModel = {
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

    const [entity] = await this.dependencies.entitiesDS.getAllLanguages(after.entity);

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
      await this.dependencies.entitiesStatusDS.markAsObsolete(entityStatus.id);
    } else {
      await this.dependencies.entitiesStatusDS.createAsNew({
        extractorId: extractor.id,
        entitySharedId: entity.sharedId!,
      });
    }
  }
}
