import { UseCase } from 'api/common.v2/contracts/UseCase';
import { EntitiesDataSource } from 'api/entities.v2/contracts/EntitiesDataSource';
import { SettingsDataSource } from 'api/settings.v2/contracts/SettingsDataSource';
import { FilesDataSource } from 'api/files.v2/contracts/FilesDataSource';
import { Entity } from 'api/entities.v2/model/Entity';
import { Document } from 'api/files.v2/model/Document';
import { LanguageISO6391, LanguagesListSchema } from 'shared/types/commonTypes';
import { FileStorage } from 'api/files.v2/contracts/FileStorage';
import { Segmentation } from 'api/files.v2/model/Segmentation';
import { IdGenerator } from 'api/common.v2/contracts/IdGenerator';
import { Logger } from 'api/log.v2/contracts/Logger';

import { PXExtractorsDataSource } from '../domain/PXExtractorDataSource';
import { PXErrorCode, PXValidationError } from '../domain/PXValidationError';
import { PXExtractionService } from '../domain/PXExtractionService';
import { PXExtractionId } from '../domain/PXExtractionId';
import { PXExtraction } from '../domain/PXExtraction';
import { PXExtractionsDataSource } from '../domain/PXExtractionDataSource';

type Input = {
  userId: string;
  extractorId: string;
  entitySharedId: string;
};

type Output = void;

type Dependencies = {
  extractorsDS: PXExtractorsDataSource;
  entityDS: EntitiesDataSource;
  filesDS: FilesDataSource;
  settingsDS: SettingsDataSource;
  extractionService: PXExtractionService;
  extractionsDS: PXExtractionsDataSource;
  fileStorage: FileStorage;
  idGenerator: IdGenerator;
  logger: Logger;
  tenantName: string;
};

export class PXExtractParagraphsFromEntity implements UseCase<Input, Output> {
  constructor(private dependencies: Dependencies) {}

  async execute(input: Input): Promise<Output> {
    const { extractor, entity, installedLanguages, extraction } = await this.getInitialData(input);

    const documents = await this.getDocuments(entity, installedLanguages);

    const segmentations = await this.getSegmentations(documents, entity);

    const files = await this.getSegmentationFiles(segmentations, entity);

    const defaultLanguage = installedLanguages.find(language => !!language.default)?.key!;

    await this.dependencies.extractionService.extractParagraphs({
      documents,
      segmentations,
      mainLanguage: PXExtractParagraphsFromEntity.getMainLanguage(documents, defaultLanguage),
      extractionId: PXExtractionId.create({
        entitySharedId: entity.sharedId,
        extractorId: extractor.id,
        tenantName: this.dependencies.tenantName,
        userId: input.userId,
      }),
      files,
    });

    this.dependencies.logger.info(
      `[PX] - Extract Paragraphs Request - ${JSON.stringify({
        entitySharedId: entity.sharedId,
        extractorId: extractor.id,
      })}`
    );

    extraction.startProcessing();

    await this.dependencies.extractionsDS.save(extraction);
  }

  private static getMainLanguage(documents: Document[], defaultLanguage: LanguageISO6391) {
    const documentsHaveDefaultLanguage = documents.some(d => d.language === defaultLanguage);

    const mainLanguage = documentsHaveDefaultLanguage ? defaultLanguage : documents[0].language;

    return mainLanguage;
  }

  // eslint-disable-next-line max-statements
  private async getInitialData(input: Input) {
    const [extractor, entities, installedLanguages, extraction] = await Promise.all([
      this.dependencies.extractorsDS.getById(input.extractorId),
      this.dependencies.entityDS.getByIds([input.entitySharedId]).all(),
      this.dependencies.settingsDS.getInstalledLanguages(),
      this.getExtraction(input),
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
    return { extractor, entity, installedLanguages, extraction };
  }

  private async getExtraction(input: Input): Promise<PXExtraction> {
    const existingExtraction = await this.dependencies.extractionsDS.getExisting({
      ...input,
      tenantName: this.dependencies.tenantName,
    });

    if (existingExtraction) {
      return existingExtraction;
    }

    return PXExtraction.create({
      id: this.dependencies.idGenerator.generate(),
      extractorId: input.extractorId,
      sourceEntityId: input.entitySharedId,
      tenantName: this.dependencies.tenantName,
      userId: input.userId,
    });
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

    if (!filteredDocuments.length) {
      throw new PXValidationError(
        PXErrorCode.DOCUMENTS_NOT_FOUND,
        `There is no valid Documents for the Entity ${entity.title}`
      );
    }

    return filteredDocuments;
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
