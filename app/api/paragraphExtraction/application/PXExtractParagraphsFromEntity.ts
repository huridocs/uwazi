import { ObjectId } from 'mongodb';

import { IdGenerator } from 'api/core/application/contracts/IdGenerator';
import { SettingsDataSource } from 'api/core/application/contracts/SettingsDataSource';
import { Logger } from 'api/core/libs/logger/contracts/Logger';
import { UseCase } from 'api/core/libs/UseCase';
import { EntitiesDataSource } from 'api/entities.v2/contracts/EntitiesDataSource';
import { Entity } from 'api/entities.v2/model/Entity';
import { FilesDataSource } from 'api/files.v2/contracts/FilesDataSource';
import { FileStorage } from 'api/files.v2/contracts/FileStorage';
import { Segmentation } from 'api/files.v2/model/Segmentation';
import { LanguageISO6391, LanguagesListSchema } from 'shared/types/commonTypes';

import { ProcessedDocument } from 'api/files.v2/model/ProcessedDocument';
import { PXEntitiesStatusDataSource } from '../domain/PXEntitiesStatusDataSource';
import { PXExtractionKey } from '../domain/PXExtractionKey';
import { PXExtractionService } from '../domain/PXExtractionService';
import { PXExtractorsDataSource } from '../domain/PXExtractorDataSource';
import { PXErrorCode, PXValidationError } from '../domain/PXValidationError';
import { FileContents } from 'api/files.v2/model/FileContents';
import { ArrayUtils } from 'api/common.v2/utils/Array';

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

      const files = await this.getSegmentationFiles(segmentations);

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

  private static getMainLanguage(documents: ProcessedDocument[], defaultLanguage: LanguageISO6391) {
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

  private async getSegmentationFiles(segmentations: Segmentation[]) {
    const files: { filename: string; contents: FileContents }[] = await ArrayUtils.parallelFor(
      segmentations,
      async segmentation => ({
        filename: segmentation.xmlname!,
        contents: await this.dependencies.fileStorage.getFile({
          filename: segmentation.xmlname!,
          type: 'segmentation',
        }),
      })
    );

    return files;
  }

  private async getDocuments(entity: Entity, installedLanguages: LanguagesListSchema) {
    const documents = await this.dependencies.filesDS
      .getProcessedDocsForEntity(entity.sharedId)
      .all();

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
        {} as Record<string, ProcessedDocument>
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

  private async getSegmentations(documents: ProcessedDocument[], entity: Entity) {
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
