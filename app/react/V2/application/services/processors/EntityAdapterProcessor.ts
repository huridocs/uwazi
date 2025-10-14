import { flatMap, groupBy, map } from 'lodash';
import { BatchCompositionResult, Entity } from 'app/V2/domain';
import { ComposedProperty, ComposedTemplate } from 'app/V2/domain/entities/types';
import { EntitySchema } from 'shared/types/entityType';
import {
  FormattedProperty,
  ProcessingContext,
  ProcessingError,
  PropertyTypeProcessor,
} from './types';
import { AdapterTemplateProcessor } from './AdapterTemplateProcessor';
import { DatePropertyProcessor } from './DatePropertyProcessor';
import { SelectPropertyProcessor } from './SelectPropertyProcessor';
import { GeolocationProcessor } from './GeolocationProcessor';
import { RelationshipProcessor } from './RelationshipProcessor';
import { FileProcessor } from './FileProcessor';
import { MediaPropertyProcessor } from './MediaPropertyProcessor';
import { PermissionProcessor } from './PermissionProcessor';
import { DefaultPropertyProcessor } from './DefaultPropertyProcessor';

export class EntityAdapterProcessor {
  private readonly context: ProcessingContext;
  private readonly processors: Map<string, PropertyTypeProcessor> = new Map();
  private readonly templateProcessor: AdapterTemplateProcessor;

  constructor(context: ProcessingContext) {
    this.context = context;
    this.templateProcessor = new AdapterTemplateProcessor(context);

    this.initializeProcessors();
  }

  private initializeProcessors(): void {
    const dateProcessor = new DatePropertyProcessor();
    const selectProcessor = new SelectPropertyProcessor();
    const geolocationProcessor = new GeolocationProcessor();
    const relationshipProcessor = new RelationshipProcessor();
    const fileProcessor = new FileProcessor();
    const mediaProcessor = new MediaPropertyProcessor();
    const permissionProcessor = new PermissionProcessor();
    const defaultProcessor = new DefaultPropertyProcessor();

    dateProcessor.propertyTypes.forEach(type => this.processors.set(type, dateProcessor));
    selectProcessor.propertyTypes.forEach(type => this.processors.set(type, selectProcessor));
    geolocationProcessor.propertyTypes.forEach(type =>
      this.processors.set(type, geolocationProcessor)
    );
    relationshipProcessor.propertyTypes.forEach(type =>
      this.processors.set(type, relationshipProcessor)
    );
    fileProcessor.propertyTypes.forEach(type => this.processors.set(type, fileProcessor));
    mediaProcessor.propertyTypes.forEach(type => this.processors.set(type, mediaProcessor));
    permissionProcessor.propertyTypes.forEach(type =>
      this.processors.set(type, permissionProcessor)
    );

    this.processors.set('any', defaultProcessor);
  }

  private collectPropertiesByType(entities: Partial<Entity>[]): Map<string, any[]> {
    const propertiesByType = new Map<string, ComposedProperty[]>();

    const allProperties = flatMap(entities, entity => {
      const metadataProperties = map(
        Object.entries(entity.rawEntity?.metadata || {}),
        ([name, property]) => {
          return {
            value: property,
            _entityId: entity._id,
            entity,
            ...(entity.template?.properties?.get(name) || {}),
          };
        }
      );

      const rootProperties = [];
      if (entity.rawEntity?.permissions) {
        rootProperties.push({
          value: entity.rawEntity.permissions,
          name: 'permissions',
          label: 'Permissions',
          type: 'permissions',
          _entityId: entity._id,
          entity,
          refId: entity.rawEntity._id || entity._id,
        });
      }

      return [...metadataProperties, ...rootProperties];
    });

    if (this.context.combineGeolocation) {
      allProperties.forEach(property => {
        if (property.type === 'relationship' && property.inherit?.type === 'geolocation') {
          (property as any)._originalRelationshipType = 'relationship';
          (property as any)._isInheritedGeolocation = true;
          property.type = 'geolocation';
        }
      });
    }

    const groupedProperties = groupBy(allProperties, 'type');

    Object.entries(groupedProperties).forEach(([type, properties]) => {
      propertiesByType.set(type, properties as ComposedProperty[]);
    });

    return propertiesByType;
  }

  private processPropertiesByType(
    propertiesByType: Map<string, any[]>
  ): Map<string, FormattedProperty> {
    const allResults = new Map<string, FormattedProperty>();

    Array.from(propertiesByType.entries()).forEach(([propertyType, properties]) => {
      const processor = this.processors.get(propertyType) || this.processors.get('any');

      if (processor && properties.length > 0) {
        const results = processor.processBatch(properties, this.context);
        results.forEach((property, key) => {
          allResults.set(key, property);
        });
      }
    });

    return allResults;
  }

  private processRootLevelDates(formattedEntities: Partial<Entity>[]): void {
    const dateProcessor = this.processors.get('date') as DatePropertyProcessor;
    if (!dateProcessor) return;

    formattedEntities.forEach(entity => {
      if (entity.rawEntity?.creationDate) {
        const creationDateValue =
          typeof entity.rawEntity.creationDate === 'object' &&
            entity.rawEntity.creationDate !== null
            ? entity.rawEntity.creationDate
            : entity.rawEntity.creationDate;

        const processedCreationDate = dateProcessor.processBatch(
          [
            {
              value: creationDateValue,
              name: 'creationDate',
              label: 'Creation date',
              type: 'date',
              _entityId: entity._id,
              entity,
              refId: entity.rawEntity._id || entity._id,
            },
          ],
          this.context
        );

        const creationDateResult = processedCreationDate.get(`${entity._id}:creationDate`);
        if (creationDateResult) {
          const { entity: _entityRef, ...dateWithoutEntity } = creationDateResult;
          (entity as any).creationDate = {
            ...entity.creationDate,
            ...dateWithoutEntity,
            translatedLabel: 'Creation date',
            propertyMetadata: creationDateResult.propertyMetadata || {},
          };
        }
      }

      if (entity.rawEntity?.editDate) {
        const editDateValue =
          typeof entity.rawEntity.editDate === 'object' && entity.rawEntity.editDate !== null
            ? entity.rawEntity.editDate
            : entity.rawEntity.editDate;

        const processedEditDate = dateProcessor.processBatch(
          [
            {
              value: editDateValue,
              name: 'editDate',
              label: 'Edit date',
              type: 'date',
              _entityId: entity._id,
              entity,
              refId: entity.rawEntity._id || entity._id,
            },
          ],
          this.context
        );

        const editDateResult = processedEditDate.get(`${entity._id}:editDate`);
        if (editDateResult) {
          const { entity: _entityRef, ...dateWithoutEntity } = editDateResult;
          (entity as any).editDate = {
            ...dateWithoutEntity,
            translatedLabel: 'Edit date',
            propertyMetadata: editDateResult.propertyMetadata || {},
          };
        }
      }
    });
  }

  processEntity(entity: EntitySchema): {
    entity: Entity;
    errors: ProcessingError[];
  } {
    const result = this.processAllEntities([entity]);
    return {
      entity: result.entities[0],
      errors: result.errors,
    };
  }

  processAllEntities(entities: EntitySchema[]): BatchCompositionResult {
    const allErrors: ProcessingError[] = [];
    let formattedEntities: Partial<Entity>[] = [];
    const resultEntities = entities.map(entity => ({ ...entity }));

    let propertiesByType: Map<string, any[]> | null = new Map();
    try {
      const templateIds = entities.map(entity => entity.template as string);
      const templatesData = this.templateProcessor.formatTemplateData(templateIds);
      const templatesById = new Map<string, ComposedTemplate>();

      templatesData.forEach(template => {
        templatesById.set(template._id, template);
      });

      formattedEntities = resultEntities.map(entity => ({
        _id: entity._id as string,
        title: entity.title,
        sharedId: entity.sharedId,
        language: entity.language,
        template: templatesById.get(entity.template as string),
        rawEntity: entity,
        metadata: [],
        creationDate: {
          name: 'creationDate',
          label: 'Creation date',
          type: 'date',
          values: [{ value: Number(entity.creationDate) || 0 }],
        },
        editDate: {
          name: 'editDate',
          label: 'Edit date',
          type: 'date',
          values: [{ value: Number(entity.editDate) || 0 }],
        },
        icon: entity.icon,
      }));

      propertiesByType = this.collectPropertiesByType(formattedEntities as Partial<Entity>[]);

      const batchResults = this.processPropertiesByType(propertiesByType);

      batchResults.forEach(({ entity, rawEntity, ...property }) => {
        if (entity && entity.metadata) {
          entity.metadata.splice(property.index, 0, property);
        }
      });

      this.processRootLevelDates(formattedEntities);
    } catch (error) {
      allErrors.push({
        entityId: 'batch',
        error: error instanceof Error ? error.message : 'EntityAdapterProcessor error',
        timestamp: new Date(),
      });
    }

    const composedEntities = formattedEntities.map(({ rawEntity, ...restEntity }) => {
      const { template, ...entity } = restEntity;
      if (template) {
        const { properties, commonProperties, ...restTemplate } = template;
        return {
          ...entity,
          template: restTemplate as ComposedTemplate,
        } as Entity;
      }
      return {
        ...entity,
        template,
      } as Entity;
    });
    return {
      entities: composedEntities,
      errors: allErrors,
      success: allErrors.length === 0,
      totalProcessed: entities.length,
      successCount: composedEntities.length,
      errorCount: allErrors.length,
    };
  }
}
