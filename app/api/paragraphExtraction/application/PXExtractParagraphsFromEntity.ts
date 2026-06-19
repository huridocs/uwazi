import { ObjectId } from 'mongodb';

import { FilesDataSource } from '#api/core/application/contracts/FilesDataSource.js';
import { FileStorage } from '#api/core/application/contracts/FileStorage.js';
import { IdGenerator } from '#api/core/application/contracts/IdGenerator.js';
import { SettingsDataSource } from '#api/core/application/contracts/SettingsDataSource.js';
import { Segmentation } from '#api/segmentation.v2/domain/Segmentation.js';
import { SegmentationDataSource } from '#api/segmentation.v2/application/contracts/SegmentationDataSource.js';
import { Logger } from '#api/core/libs/logger/contracts/Logger.js';
import { AbstractUseCase } from '#api/core/libs/UseCase.js';
import { LanguageISO6391, LanguagesListSchema } from '#shared/types/commonTypes.js';

import { ArrayUtils } from '#api/common.v2/utils/Array.js';
import { Entity } from '#api/core/domain/entity/Entity.js';
import { FileContents } from '#api/core/domain/files/FileContents.js';
import { PDFDocument } from '#api/core/domain/files/PDFDocument.js';
import { MultiLanguageEntityDataSource } from '#api/entities.v2/contracts/MultiLanguageEntitiesDataSource.js';
import { EntitiesService } from '#api/core/application/EntitiesService.js';
import { PXEntitiesStatusDataSource } from '../domain/PXEntitiesStatusDataSource.js';
import { PXExtractionKey } from '../domain/PXExtractionKey.js';
import { PXExtractionService } from '../domain/PXExtractionService.js';
import { PXExtractorsDataSource } from '../domain/PXExtractorDataSource.js';
import { PXErrorCode, PXValidationError } from '../domain/PXValidationError.js';

type PXExtractParagraphsFromEntityInput = {
  userId: string;
  extractorId: string;
  entitySharedId: string;
  entityStatusId: string;
};

type Output = void;

type Deps = {
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
  entitiesService: EntitiesService;
  segmentationDS: SegmentationDataSource;
};

export class PXExtractParagraphsFromEntity extends AbstractUseCase<
  PXExtractParagraphsFromEntityInput,
  Output,
  Deps
> {
  // eslint-disable-next-line max-statements
  async execute(input: PXExtractParagraphsFromEntityInput, isRetriable = false): Promise<Output> {
    try {
      const { extractor, entity, installedLanguages, defaultLanguage } =
        await this.getInitialData(input);

      const documents = await this.getDocuments(entity, installedLanguages, defaultLanguage);

      const segmentations = await this.getSegmentations(documents, entity, defaultLanguage);

      const files = await this.getSegmentationFiles(segmentations);

      const extractionKey = PXExtractionKey.create({
        tenantName: this.deps.tenantName,
        userId: input.userId,
        entityStatusId: input.entityStatusId,
      });

      const mainLanguage = PXExtractParagraphsFromEntity.getMainLanguage(
        documents,
        defaultLanguage
      );

      const paragraphs = await this.deps.extractorsDS.getParagraphsIds({
        extractorId: extractor.id,
        entitySharedId: input.entitySharedId,
      });

      await this.transactionManager.run(async () =>
        this.deps.entitiesService.delete(paragraphs, {
          actor: this.getActor(),
          tenantName: this.tenant.name,
        })
      );

      await this.deps.extractionService.extractParagraphs({
        documents,
        segmentations,
        mainLanguage,
        extractionKey,
        files,
      });

      this.deps.logger.info(
        `[PX] - Extract Paragraphs Request - ${JSON.stringify({
          entitySharedId: entity.sharedId,
          extractorId: extractor.id,
        })}`
      );
    } catch (e) {
      if (!isRetriable) {
        await this.deps.entitiesStatusDS.markAsError(input.entityStatusId);
      }

      throw e;
    }
  }

  private static getMainLanguage(documents: PDFDocument[], defaultLanguage: LanguageISO6391) {
    const documentsHaveDefaultLanguage = documents.some(d => d.language === defaultLanguage);

    const mainLanguage = documentsHaveDefaultLanguage ? defaultLanguage : documents[0].language!;

    return mainLanguage;
  }

  // eslint-disable-next-line max-statements
  private async getInitialData(input: PXExtractParagraphsFromEntityInput) {
    const [extractor, entity, installedLanguages] = await Promise.all([
      this.deps.extractorsDS.getById(input.extractorId),
      (await this.deps.entitiesDS.getEntitiesBySharedIds([input.entitySharedId])).first(),
      this.deps.settingsDS.getInstalledLanguages(),
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
        contents: await this.deps.fileStorage.getFile({
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
    const documents = await this.deps.filesDS.getProcessedDocsForEntity(entity.sharedId).all();

    const filteredDocuments = documents.filter(document =>
      installedLanguages.some(language => language.key === document.language)
    );

    const uniqueByLanguage = Object.values(
      filteredDocuments.reduce(
        (prev, document) => {
          const existingDocument = prev[document.language!];
          if (!existingDocument) {
            return { ...prev, [document.language!]: document };
          }

          const existingDocumentCreationDate = new ObjectId(existingDocument.id).getTimestamp();
          const documentCreationDate = new ObjectId(document.id).getTimestamp();

          return {
            ...prev,
            [document.language!]:
              existingDocumentCreationDate < documentCreationDate ? existingDocument : document,
          };
        },
        {} as Record<string, PDFDocument>
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
    documents: PDFDocument[],
    entity: Entity,
    defaultLanguage: LanguageISO6391
  ) {
    const segmentations = await this.deps.segmentationDS
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
