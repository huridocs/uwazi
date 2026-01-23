import { ObjectId } from 'mongodb';

import { FilesDataSource } from '#api/core/application/contracts/FilesDataSource.js';
import { FileStorage } from '#api/core/application/contracts/FileStorage.js';
import { IdGenerator } from '#api/core/application/contracts/IdGenerator.js';
import { SettingsDataSource } from '#api/core/application/contracts/SettingsDataSource.js';
import { Segmentation } from '#api/core/domain/files/Segmentation.js';
import { Logger } from '#api/core/libs/logger/contracts/Logger.js';
import { UseCase } from '#api/core/libs/UseCase.js';
import { LanguageISO6391, LanguagesListSchema } from '#shared/types/commonTypes.js';

import { ArrayUtils } from '#api/common.v2/utils/Array.js';
import { Entity } from '#api/core/domain/entity/Entity.js';
import { FileContents } from '#api/core/domain/files/FileContents.js';
import { ProcessedPDF } from '#api/core/domain/files/ProcessedPDF.js';
import { MultiLanguageEntityDataSource } from '#api/entities.v2/contracts/MultiLanguageEntitiesDataSource.js';
import { PXEntitiesStatusDataSource } from '#api/paragraphExtraction/domain/PXEntitiesStatusDataSource.js';
import { PXExtractionKey } from '#api/paragraphExtraction/domain/PXExtractionKey.js';
import { PXExtractionService } from '#api/paragraphExtraction/domain/PXExtractionService.js';
import { PXExtractorsDataSource } from '#api/paragraphExtraction/domain/PXExtractorDataSource.js';
import {
  PXErrorCode,
  PXValidationError,
} from '#api/paragraphExtraction/domain/PXValidationError.js';

type PXExtractParagraphsFromEntityInput = {
  userId: string;
  extractorId: string;
  entitySharedId: string;
  entityStatusId: string;
};

type Output = void;

type Dependencies = {
  extractorsDS: PXExtractorsDataSource;
  entitiesDS: MultiLanguageEntityDataSource;
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
      const { extractor, entity, installedLanguages, defaultLanguage } =
        await this.getInitialData(input);

      const documents = await this.getDocuments(entity, installedLanguages, defaultLanguage);

      const segmentations = await this.getSegmentations(documents, entity, defaultLanguage);

      const files = await this.getSegmentationFiles(segmentations);

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

  private static getMainLanguage(documents: ProcessedPDF[], defaultLanguage: LanguageISO6391) {
    const documentsHaveDefaultLanguage = documents.some(d => d.language === defaultLanguage);

    const mainLanguage = documentsHaveDefaultLanguage ? defaultLanguage : documents[0].language;

    return mainLanguage;
  }

  // eslint-disable-next-line max-statements
  private async getInitialData(input: PXExtractParagraphsFromEntityInput) {
    const [extractor, entity, installedLanguages] = await Promise.all([
      this.dependencies.extractorsDS.getById(input.extractorId),
      (await this.dependencies.entitiesDS.getEntitiesBySharedIds([input.entitySharedId])).first(),
      this.dependencies.settingsDS.getInstalledLanguages(),
    ]);

    const defaultLanguage = installedLanguages.find(language => !!language.default)?.key!;

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
        `The Entity "${entity.getTitle(defaultLanguage)}" does not have valid template configured by this Extractor`
      );
    }

    return { extractor, entity, installedLanguages, defaultLanguage };
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

  private async getDocuments(
    entity: Entity,
    installedLanguages: LanguagesListSchema,
    defaultLanguage: LanguageISO6391
  ) {
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
        {} as Record<string, ProcessedPDF>
      )
    );

    if (!uniqueByLanguage.length) {
      throw new PXValidationError(
        PXErrorCode.DOCUMENTS_NOT_FOUND,
        `There is no valid Documents for the Entity ${entity.getTitle(defaultLanguage)}`
      );
    }

    return uniqueByLanguage;
  }

  private async getSegmentations(
    documents: ProcessedPDF[],
    entity: Entity,
    defaultLanguage: LanguageISO6391
  ) {
    const segmentations = await this.dependencies.filesDS
      .getSegmentations(documents.map(document => document.id))
      .all();

    if (segmentations.length !== documents.length) {
      throw new PXValidationError(
        PXErrorCode.SEGMENTATIONS_UNAVAILABLE,
        `There are some Documents without Segmentations for the Entity "${entity.getTitle(
          defaultLanguage!
        )}"`
      );
    }

    return segmentations;
  }
}

export type { PXExtractParagraphsFromEntityInput };
