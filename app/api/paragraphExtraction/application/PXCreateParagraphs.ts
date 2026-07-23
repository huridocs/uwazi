import { ObjectId } from 'mongodb';

import { ArrayUtils } from '#api/common.v2/utils/Array.js';
import { EntitiesService } from '#api/core/application/EntitiesService.js';
import { PropertyAssignmentCreatorServiceStrategy } from '#api/core/application/propertyAssignmentCreatorService/PropertyAssignmentCreatorServiceStrategy.js';
import { LoggerFactory } from '#api/core/infrastructure/factories/LoggerFactory.js';
import { UseCase } from '#api/core/libs/UseCase.js';
import relationshipsDS from '#api/relationships/relationships.js';

import { OperationalError } from '#api/common.v2/errors/OperationalError.js';
import { TransactionManager } from '#api/core/application/contracts/TransactionManager.js';
import { EntitiesDataSource } from '#api/core/application/contracts/EntitiesDataSource.js';
import { PXEntitiesStatusDataSource } from '../domain/PXEntitiesStatusDataSource.js';
import { ParagraphOutput } from '../domain/PXExtractionService.js';
import { PXExtractorsDataSource } from '../domain/PXExtractorDataSource.js';
import { PXValidationError } from '../domain/PXValidationError.js';
import { PXCreateParagraphsBatch } from './PXCreateParagraphsBatch.js';

type PXCreateParagraphsInput = {
  userId: string;
  entityStatusId: string;
  paragraphs: ParagraphOutput[];
  onParagraphBatchCreated?: () => Promise<void>;
};

type Output = any;

type Dependencies = {
  extractorsDS: PXExtractorsDataSource;
  entitiesStatusDS: PXEntitiesStatusDataSource;
  entitiesService: EntitiesService;
  entitiesDS: EntitiesDataSource;
  propertyAssignmentStrategy: PropertyAssignmentCreatorServiceStrategy;
  transactionManager: TransactionManager;
};

export class PXCreateParagraphs implements UseCase<PXCreateParagraphsInput, Output> {
  private static readonly DEFAULT_BATCH_SIZE = 100;

  private readonly batchSize: number;

  createParagraphsBatch: PXCreateParagraphsBatch;

  constructor(
    private dependencies: Dependencies,
    batchSize?: number
  ) {
    this.batchSize = batchSize ?? PXCreateParagraphs.DEFAULT_BATCH_SIZE;
    this.createParagraphsBatch = new PXCreateParagraphsBatch({
      logger: LoggerFactory.default(),
      entitiesStatusDS: this.dependencies.entitiesStatusDS,
      relationshipsDS,
      entitiesService: this.dependencies.entitiesService,
      propertyAssignmentStrategy: this.dependencies.propertyAssignmentStrategy,
      transactionManager: this.dependencies.transactionManager,
    });
  }

  async execute({
    entityStatusId,
    paragraphs,
    userId,
    onParagraphBatchCreated,
  }: PXCreateParagraphsInput): Promise<Output> {
    const user = { _id: new ObjectId(userId) };
    const entityStatus = await this.getEntityStatus(entityStatusId);

    const [extractor, sourceEntity] = await Promise.all([
      this.dependencies.extractorsDS.getById(entityStatus.extractorId),
      (
        await this.dependencies.entitiesDS.getEntitiesBySharedIds([entityStatus.entitySharedId])
      ).first(),
    ]);

    if (!extractor) {
      throw new PXValidationError(
        PXValidationError.codes.EXTRACTOR_NOT_FOUND,
        `The Extractor with id ${entityStatus.extractorId} does not exist anymore`
      );
    }

    if (!sourceEntity) {
      throw new PXValidationError(
        PXValidationError.codes.SOURCE_ENTITY_DOES_NOT_EXIST_ANYMORE,
        `The source Entity for the Extractor ${extractor?.id} does not exist anymore`
      );
    }

    const batches = ArrayUtils.splitInChunks(paragraphs, this.batchSize);
    await ArrayUtils.sequentialFor(batches, async batch => {
      await this.createParagraphsBatch.execute({
        paragraphs: batch,
        extractor,
        sourceEntity,
        user,
      });
      if (onParagraphBatchCreated) {
        await onParagraphBatchCreated();
      }
    });

    await this.dependencies.entitiesStatusDS.markAsProcessed(entityStatusId);
  }

  private async getEntityStatus(entityStatusId: string) {
    const entityStatus = await this.dependencies.entitiesStatusDS.getById(entityStatusId);
    if (!entityStatus) {
      throw new OperationalError('Entity Status not found');
    }
    return entityStatus;
  }
}

export type { PXCreateParagraphsInput };
