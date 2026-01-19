import { ObjectId } from 'mongodb';

import { ArrayUtils } from 'api/common.v2/utils/Array';
import { EntitiesService } from 'api/core/application/EntitiesService';
import { PropertyAssignmentCreatorServiceStrategy } from 'api/core/application/propertyAssignmentCreatorService/PropertyAssignmentCreatorServiceStrategy';
import { LoggerFactory } from 'api/core/infrastructure/factories/LoggerFactory';
import { UseCase } from 'api/core/libs/UseCase';
import entities from 'api/entities';
import relationshipsDS from 'api/relationships';

import { OperationalError } from 'api/common.v2/errors/OperationalError';
import { TransactionManager } from 'api/core/application/contracts/TransactionManager';
import { PXEntitiesStatusDataSource } from '../domain/PXEntitiesStatusDataSource';
import { ParagraphOutput } from '../domain/PXExtractionService';
import { PXExtractorsDataSource } from '../domain/PXExtractorDataSource';
import { PXValidationError } from '../domain/PXValidationError';
import { PXCreateParagraphsBatch } from './PXCreateParagraphsBatch';

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

    const [extractor, sourceEntities] = await Promise.all([
      this.dependencies.extractorsDS.getById(entityStatus.extractorId),
      entities.getAllLanguages(entityStatus.entitySharedId),
    ]);

    if (!extractor) {
      throw new PXValidationError(
        PXValidationError.codes.EXTRACTOR_NOT_FOUND,
        `The Extractor with id ${entityStatus.extractorId} does not exist anymore`
      );
    }

    if (!sourceEntities.length) {
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
        sourceEntities,
        user,
        entityStatus,
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
