import { IncomingHttpHeaders } from 'http';
import { createStore } from 'jotai';
import { EntityRepository } from '#V2/infrastructure/index.js';
import { settingsAtom, templatesAtom, thesauriAtom, userAtom } from '#V2/atoms/index.js';
import { localeAtom, translationsAtom } from '#V2/atoms/translationsAtoms.js';
import { EntitySchema } from '#shared/types/entityType.js';
import { AdapterEntityProcessor } from '#V2/application/services/processors/AdapterEntityProcessor.js';
import {
  BatchCompositionResult,
  CompositionOptions,
  CompositionResult,
  ProcessingContext,
} from '#V2/application/services/processors/types.js';
import { cardViewOptions, fullDetailOptions, editionModeOptions } from '#V2/application/optionsPresets.js';

export class EntityCompositionUseCase {
  constructor(
    private repository: EntityRepository,
    private atomStore: ReturnType<typeof createStore>
  ) {}

  private createProcessingContext(options: CompositionOptions): ProcessingContext {
    return {
      ...options,
      language: this.atomStore.get(localeAtom) || 'en',
      translations: this.atomStore.get(translationsAtom) || [],
      templates: this.atomStore.get(templatesAtom) || [],
      settings: this.atomStore.get(settingsAtom) || {},
      thesauri: this.atomStore.get(thesauriAtom) || {},
      currentUser: this.atomStore.get(userAtom) || undefined,
      defaultLanguage:
        this.atomStore.get(settingsAtom)?.languages?.find(l => l.default)?.key || 'en',
    };
  }

  async composeEntityData(
    entity: EntitySchema,
    options: CompositionOptions
  ): Promise<CompositionResult> {
    try {
      const processingContext = this.createProcessingContext(options);
      const processor = new AdapterEntityProcessor(processingContext);
      const result = processor.processEntity(entity);
      return { entity: result.entity, success: true };
    } catch (error) {
      return {
        entity: null,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  async composeEntitiesData(
    entities: EntitySchema[],
    options: CompositionOptions
  ): Promise<BatchCompositionResult> {
    const processingContext = this.createProcessingContext(options);
    const processor = new AdapterEntityProcessor(processingContext);
    return processor.processAllEntities(entities);
  }

  async composeEntity(
    entityId: string,
    options: CompositionOptions,
    context: { headers?: IncomingHttpHeaders }
  ): Promise<CompositionResult> {
    try {
      const response = await this.repository.getBySharedId(
        {
          sharedId: entityId,
          language: this.atomStore.get(localeAtom) || 'en',
          omitRelationships: options.omitRelationships ?? false,
        },
        context.headers || {}
      );
      if (!response || response.length === 0) {
        return { entity: null, success: false, error: 'Entity not found' };
      }

      return this.composeEntityData(response[0], options);
    } catch (error) {
      return {
        entity: null,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  async composeEntities(
    entityIds: string[],
    options: CompositionOptions,
    context: { headers?: IncomingHttpHeaders }
  ): Promise<BatchCompositionResult> {
    try {
      const entities = await this.repository.getBySharedIds(
        {
          sharedIds: entityIds,
          language: this.atomStore.get(localeAtom) || 'en',
          omitRelationships: true,
        },
        context.headers || {}
      );

      return this.composeEntitiesData(entities, options);
    } catch (error) {
      return {
        entities: [],
        success: false,
        errors: [
          {
            entityId: 'batch',
            error: error instanceof Error ? error.message : 'Unknown error',
            timestamp: new Date(),
          },
        ],
        totalProcessed: entityIds.length,
        successCount: 0,
        errorCount: entityIds.length,
      };
    }
  }

  async composeEntitiesForCardView(
    entityIds: string[],
    context: { headers?: IncomingHttpHeaders }
  ): Promise<BatchCompositionResult> {
    return this.composeEntities(entityIds, cardViewOptions, context);
  }

  async composeEntityForDetailView(
    entityId: string,
    dateFormat: string,
    context: { headers?: IncomingHttpHeaders }
  ): Promise<CompositionResult> {
    return this.composeEntity(entityId, { ...fullDetailOptions, dateFormat }, context);
  }

  async composeEntityForEdition(
    entityId: string,
    dateFormat: string,
    context: { headers?: IncomingHttpHeaders }
  ): Promise<CompositionResult> {
    return this.composeEntity(entityId, { ...editionModeOptions, dateFormat }, context);
  }
}
