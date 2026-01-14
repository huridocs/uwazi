import { IncomingHttpHeaders } from 'http';
import { EntitySchema } from 'shared/types/entityType';
import {
  BatchCompositionResult,
  CompositionOptions,
  CompositionResult,
  ProcessingContext,
} from './services/processors/types';
import { AdapterEntityProcessor } from './services/processors/AdapterEntityProcessor';
import { EntityCompositionUseCase } from './useCases/EntityCompositionUseCase';

export class FluentCompositionBuilder {
  private options: CompositionOptions = {};

  constructor(
    private readonly processingContext: ProcessingContext,
    private readonly entityIdOrIds?: string | string[],
    private readonly useCase?: EntityCompositionUseCase
  ) {}

  static create(
    processingContext: ProcessingContext,
    entityIdOrIds?: string | string[]
  ): FluentCompositionBuilder {
    return new FluentCompositionBuilder(processingContext, entityIdOrIds);
  }

  static createWithUseCase(
    processingContext: ProcessingContext,
    useCase: EntityCompositionUseCase,
    entityIdOrIds: string | string[]
  ): FluentCompositionBuilder {
    return new FluentCompositionBuilder(processingContext, entityIdOrIds, useCase);
  }

  forCardView(): FluentCompositionBuilder {
    this.options.includeTemplate = true;
    this.options.onlyForCards = true;
    return this;
  }

  forDetailView(): FluentCompositionBuilder {
    this.options.includeTemplate = true;
    this.options.combineGeolocation = true;
    this.options.translateLabels = true;
    this.options.formatDates = true;
    this.options.includePropertyMetadata = true;
    return this;
  }

  forForm(): FluentCompositionBuilder {
    this.options.combineGeolocation = false;
    this.options.translateLabels = true;
    this.options.includePropertyMetadata = true;
    this.options.editionMode = true;
    return this;
  }

  includeOnlyFields(fieldNames: string[]): FluentCompositionBuilder {
    this.options.includeFields = fieldNames;
    return this;
  }

  async compose(context: {
    headers?: IncomingHttpHeaders;
  }): Promise<CompositionResult | BatchCompositionResult> {
    if (!this.useCase || !this.entityIdOrIds) {
      throw new Error('UseCase and entityIdOrIds are required for compose method');
    }

    if (Array.isArray(this.entityIdOrIds)) {
      return this.useCase.composeEntities(this.entityIdOrIds, this.options, context);
    }
    return this.useCase.composeEntity(this.entityIdOrIds, this.options, context);
  }

  processEntity(rawEntity: EntitySchema) {
    const mergedContext: ProcessingContext = {
      ...this.processingContext,
      ...this.options,
    };

    const processor = new AdapterEntityProcessor(mergedContext);
    return processor.processEntity(rawEntity);
  }

  processEntities(rawEntities: EntitySchema[]) {
    const mergedContext: ProcessingContext = {
      ...this.processingContext,
      ...this.options,
    };

    const processor = new AdapterEntityProcessor(mergedContext);
    return processor.processAllEntities(rawEntities);
  }

  async processEntityAsResult(rawEntity: EntitySchema): Promise<CompositionResult> {
    try {
      const { entity } = this.processEntity(rawEntity);
      return { entity, success: true };
    } catch (error) {
      return {
        entity: null,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  async processEntitiesAsResult(rawEntities: EntitySchema[]): Promise<BatchCompositionResult> {
    try {
      const { entities } = this.processEntities(rawEntities);
      return {
        entities,
        success: true,
        totalProcessed: rawEntities.length,
        successCount: entities.length,
        errorCount: 0,
        errors: [],
      };
    } catch (error) {
      return {
        entities: [],
        success: false,
        totalProcessed: rawEntities.length,
        successCount: 0,
        errorCount: rawEntities.length,
        errors: [
          {
            entityId: 'batch',
            error: error instanceof Error ? error.message : 'Unknown error',
            timestamp: new Date(),
          },
        ],
      };
    }
  }
}
