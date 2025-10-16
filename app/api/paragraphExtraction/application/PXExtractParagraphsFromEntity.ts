import { ObjectId } from 'mongodb';

import { UseCase } from 'api/core/libs/UseCase';
import { EntitiesDataSource } from 'api/entities.v2/contracts/EntitiesDataSource';
import { SettingsDataSource } from 'api/settings.v2/contracts/SettingsDataSource';
import { FilesDataSource } from 'api/files.v2/contracts/FilesDataSource';
import { Entity } from 'api/entities.v2/model/Entity';
import { Document } from 'api/files.v2/model/Document';
import { LanguageISO6391, LanguagesListSchema } from 'shared/types/commonTypes';
import { FileStorage } from 'api/files.v2/contracts/FileStorage';
import { Segmentation } from 'api/files.v2/model/Segmentation';
import { IdGenerator } from 'api/core/libs/IdGenerator';
import { Logger } from 'api/log.v2/contracts/Logger';

import { PXExtractorsDataSource } from '../domain/PXExtractorDataSource';
import { PXErrorCode, PXValidationError } from '../domain/PXValidationError';
import { PXExtractionService } from '../domain/PXExtractionService';
import { PXExtractionKey } from '../domain/PXExtractionKey';
import { PXEntitiesStatusDataSource } from '../domain/PXEntitiesStatusDataSource';

type PXExtractParagraphsFromEntityInput = {
  userId: string;
  extractorId: string;
  entitySharedId: string;
  entityStatusId: string;
};

type Output = void;

type Dependencies = {
  extractorsDS: PXExtractorsDataSource;
  entityDS: EntitiesDataSource;
  filesDS: FilesDataSource;
  settingsDS: SettingsDataSource;
  extractionService: PXExtractionService;
  entitiesStatusDS: PXEntitiesStatusDataSource;
  fileStorage: FileStorage;
  idGenerator: IdGenerator;
  logger: Logger;
  tenantName: string;
};

export class PXExtractParagraphsFromEntity
  implements UseCase<PXExtractParagraphsFromEntityInput, Output>
{
  constructor(private dependencies: Dependencies) {}

  // eslint-disable-next-line max-statements
  async execute(input: PXExtractParagraphsFromEntityInput, isRetriable = false): Promise<Output> {
    try {
      const { extractor, entity, installedLanguages } = await this.getInitialData(input);

      const documents = await this.getDocuments(entity, installedLanguages);

      const segmentations = await this.getSegmentations(documents, entity);

      const files = await this.getSegmentationFiles(segmentations, entity);

      const defaultLanguage = installedLanguages.find(language => !!language.default)?.key!;

      const extractionKey = PXExtractionKey.create({
        tenantName: this.dependencies.tenantName,
        userId: input.userId,
        entityStatusId: input.entityStatusId,
      });

      const mainLanguage = PXExtractParagraphsFromEntity.getMainLanguage(
        documents,
        defaultLanguage
      );

      await this.dependencies.extractorsDS.deleteParagraphs({
        extractorId: extractor.id,
        entitySharedId: input.entitySharedId,
      });

      await this.dependencies.extractionService.extractParagraphs({
        documents,
        segmentations,
        mainLanguage,
        extractionKey,
        files,
      });

      this.dependencies.logger.info(
        `[PX] - Extract Paragraphs Request - ${JSON.stringify({
          entitySharedId: entity.sharedId,
          extractorId: extractor.id,
        })}`
      );
    } catch (e) {
      if (!isRetriable) {
        await this.dependencies.entitiesStatusDS.markAsError(input.entityStatusId);
      }

      throw e;
    }
  }

  private static getMainLanguage(documents: Document[], defaultLanguage: LanguageISO6391) {
    const documentsHaveDefaultLanguage = documents.some(d => d.language === defaultLanguage);

    const mainLanguage = documentsHaveDefaultLanguage ? defaultLanguage : documents[0].language;

    return mainLanguage;
  }

  // eslint-disable-next-line max-statements
  private async getInitialData(input: PXExtractParagraphsFromEntityInput) {
    const [extractor, entities, installedLanguages] = await Promise.all([
      this.dependencies.extractorsDS.getById(input.extractorId),
      this.dependencies.entityDS.getByIds([input.entitySharedId]).all(),
      this.dependencies.settingsDS.getInstalledLanguages(),
    ]);

    const [entity] = entities;

    if (!extractor) {
      throw new PXValidationError(
        PXErrorCode.EXTRACTOR_NOT_FOUND,
        `Extractor with id "${input.extractorId}" was not found`
      );
    }

    if (!entity) {
      throw new PXValidationError(
        PXErrorCode.ENTITY_NOT_FOUND,
        `Entity with id "${input.extractorId}" was not found`
      );
    }

    if (!extractor.canExtract(entity)) {
      throw new PXValidationError(
        PXErrorCode.ENTITY_INVALID,
        `The Entity "${entity.title}" does not have valid template configured by this Extractor`
      );
    }

    return { extractor, entity, installedLanguages };
  }

  private async getSegmentationFiles(segmentations: Segmentation[], entity: Entity) {
    const files = await this.dependencies.fileStorage.getFiles(
      segmentations.map(segmentation => ({
        filename: segmentation.xmlname!,
        type: 'segmentation',
      }))
    );

    if (!files.length) {
      throw new PXValidationError(
        PXErrorCode.SEGMENTATION_FILES_NOT_FOUND,
        `There are no Segmentations Files for the Entity "${entity.title}"`
      );
    }

    return files;
  }

  private async getDocuments(entity: Entity, installedLanguages: LanguagesListSchema) {
    const documents = await this.dependencies.filesDS.getDocumentsForEntity(entity.sharedId).all();

    const filteredDocuments = documents.filter(document =>
      installedLanguages.some(language => language.key === document.language)
    );

    const uniqueByLanguage = Object.values(
      filteredDocuments.reduce(
        (prev, document) => {
          const existingDocument = prev[document.language];
          if (!existingDocument) {
            return { ...prev, [document.language]: document };
          }

          const existingDocumentCreationDate = new ObjectId(existingDocument.id).getTimestamp();
          const documentCreationDate = new ObjectId(document.id).getTimestamp();

          return {
            ...prev,
            [document.language]:
              existingDocumentCreationDate < documentCreationDate ? existingDocument : document,
          };
        },
        {} as Record<string, Document>
      )
    );

    if (!uniqueByLanguage.length) {
      throw new PXValidationError(
        PXErrorCode.DOCUMENTS_NOT_FOUND,
        `There is no valid Documents for the Entity ${entity.title}`
      );
    }

    return uniqueByLanguage;
  }

  private async getSegmentations(documents: Document[], entity: Entity) {
    const segmentations = await this.dependencies.filesDS
      .getSegmentations(documents.map(document => document.id))
      .all();

    if (segmentations.length !== documents.length) {
      throw new PXValidationError(
        PXErrorCode.SEGMENTATIONS_UNAVAILABLE,
        `There are some Documents without Segmentations for the Entity "${entity.title}"`
      );
    }

    return segmentations;
  }
}

export type { PXExtractParagraphsFromEntityInput };
