/* eslint-disable max-lines */
import { flatMap, groupBy, map } from 'lodash';
import { Entity, MetadataProperty } from 'app/V2/domain';
import { DateMetadataProperty, EntityTemplate } from 'app/V2/domain/entities/types';
import { EntitySchema } from 'shared/types/entityType';
import { MetadataObjectSchema } from 'shared/types/commonTypes';
import {
  AdapterEntity,
  AdapterEntityTemplate,
  AdapterMetadataProperty,
  BatchCompositionResult,
  ProcessingContext,
  ProcessingError,
  PropertyTypeProcessor,
} from './types';
import { AdapterTemplateProcessor } from './AdapterTemplateProcessor';
import { DatePropertyProcessor } from './DatePropertyProcessor';
import { SelectPropertyProcessor } from './SelectPropertyProcessor';
import { GeolocationProcessor } from './GeolocationProcessor';
import { RelationshipProcessor } from './RelationshipProcessor';
import { ImagePropertyProcessor } from './ImagePropertyProcessor';
import { MediaPropertyProcessor } from './MediaPropertyProcessor';
import { DefaultPropertyProcessor } from './DefaultPropertyProcessor';
import { LinkPropertyProcessor } from './LinkPropertyProcessor';
import { PreviewPropertyProcessor } from './PreviewPropertyProcessor';
import { SupportingFilesProcessor } from './SupportingFilesProcessor';

export class AdapterEntityProcessor {
  private readonly context: ProcessingContext;

  private readonly processors: Map<string, PropertyTypeProcessor> = new Map();

  private readonly templateProcessor: AdapterTemplateProcessor;

  private readonly supportingFilesProcessor: SupportingFilesProcessor;

  constructor(context: ProcessingContext) {
    this.context = context;
    this.templateProcessor = new AdapterTemplateProcessor(context);
    this.supportingFilesProcessor = new SupportingFilesProcessor();

    this.initializeProcessors();
  }

  private initializeProcessors(): void {
    const processors = [
      new DatePropertyProcessor(),
      new SelectPropertyProcessor(),
      new GeolocationProcessor(),
      new RelationshipProcessor(),
      new ImagePropertyProcessor(),
      new MediaPropertyProcessor(),
      new LinkPropertyProcessor(),
      new PreviewPropertyProcessor(),
    ];

    processors.forEach(processor => {
      processor.propertyTypes.forEach(type => this.processors.set(type, processor));
    });

    this.processors.set('any', new DefaultPropertyProcessor());
  }

  private collectPropertiesByType(
    entities: AdapterEntity[]
  ): Map<string, AdapterMetadataProperty[]> {
    const allProperties = flatMap(entities, entity => {
      const metadataProperties: AdapterMetadataProperty[] = map(
        Object.keys(entity.rawEntity?.metadata || {}),
        (name, index) => {
          const templateProperty = entity.template.properties.get(name);
          if (templateProperty) {
            const entityProperty = entity.rawEntity?.metadata?.[name];
            return {
              ...templateProperty,
              value: entityProperty,
              index,
              values: entityProperty,
              entity,
            } as AdapterMetadataProperty;
          }

          return undefined;
        }
      ).filter(property => property !== undefined);

      return metadataProperties.map((property, newIndex) => ({
        ...property,
        index: newIndex,
      }));
    });

    allProperties.forEach(property => {
      if (this.shouldConvertToInheritedType(property)) {
        this.convertToInheritedType(property);
      }
    });

    const groupedProperties = groupBy(allProperties, 'type');
    const propertiesByType = new Map<string, AdapterMetadataProperty[]>();

    Object.entries(groupedProperties).forEach(([type, properties]) => {
      propertiesByType.set(type, properties);
    });

    return propertiesByType;
  }

  private processFinalValues(properties: AdapterMetadataProperty[]): AdapterMetadataProperty[] {
    return properties.map((property): AdapterMetadataProperty => {
      if (property.type === 'relationship' && property.value && Array.isArray(property.value)) {
        const hasInheritedValues = property.value.some(
          (value: any) =>
            value.inheritedValue &&
            Array.isArray(value.inheritedValue) &&
            value.inheritedValue.length > 0
        );

        if (hasInheritedValues) {
          const isHierarchical = property.value.some(
            (value: MetadataObjectSchema) => value.inheritedType === 'relationship'
          );

          if (isHierarchical) {
            const processedValues = this.flattenInheritedValues(property.value, property.entity, [
              property.entity._id,
            ]);
            return {
              ...property,
              type: 'relationship' as const,
              value: processedValues,
              values: processedValues as any,
            } as AdapterMetadataProperty;
          }
          return property;
        }
      }
      return property;
    });
  }

  private flattenInheritedValues(
    values: MetadataObjectSchema[],
    mainEntity: AdapterEntity,
    sourceChain: string[],
    parentSource?: { value: string; label: string; url: string }
  ): MetadataObjectSchema[] {
    return values
      .map(value => {
        if (
          value.inheritedValue &&
          Array.isArray(value.inheritedValue) &&
          value.inheritedValue.length > 0
        ) {
          if (sourceChain.includes(value.value as string)) {
            return [];
          }

          if (value.inheritedType === 'relationship') {
            sourceChain.push(value.value as string);
            const currentSource = {
              value: value.value as string,
              label: value.label || '',
              url: `/entity/${value.value}`,
            };
            return this.flattenInheritedValues(
              value.inheritedValue,
              mainEntity,
              sourceChain,
              currentSource
            );
          }
          const source = parentSource || {
            value: value.value,
            label: value.label,
            url: `/entity/${value.value}`,
          };
          return value.inheritedValue.map(inherited => ({
            value: inherited.value,
            label: inherited.label,
            parent: inherited.parent,
            source,
          }));
        }

        return {
          value: value.value,
          label: value.label,
          url: `/entity/${value.value}`,
          icon: value.icon,
        };
      })
      .flat();
  }

  private processPropertiesByType(
    propertiesByType: Map<string, AdapterMetadataProperty[]>
  ): AdapterMetadataProperty[] {
    const allResults: AdapterMetadataProperty[] = [];

    Array.from(propertiesByType.entries()).forEach(([propertyType, properties]) => {
      const processor = this.processors.get(propertyType) || this.processors.get('any');
      if (processor && properties.length > 0) {
        const processedProperties = this.processFinalValues(properties);
        const results = processor.processBatch(processedProperties, this.context, this.processors);
        allResults.push(...results);
      }
    });

    return allResults;
  }

  private processRootLevelDates(formattedEntities: AdapterEntity[]): void {
    const dateProcessor = this.processors.get('date') as DatePropertyProcessor;
    if (!dateProcessor) return;

    const rootDates: AdapterMetadataProperty[] = formattedEntities
      .map(entity => [
        { ...entity.creationDate, entity },
        { ...entity.editDate, entity },
      ])
      .flat();

    const results = dateProcessor.processBatch(rootDates, this.context, this.processors);
    results.forEach(({ entity, ...property }: AdapterMetadataProperty) => {
      Object.assign(entity, { [property.name]: property });
    });
  }

  private getRootDate(
    name: string,
    label: string,
    translatedLabel: string,
    value: number
  ): AdapterMetadataProperty {
    return {
      _id: name,
      name,
      entity: undefined as any,
      label,
      translatedLabel,
      type: 'date',
      value: [{ value }],
      index: 0,
      values: [
        {
          value,
          label: '',
        },
      ],
      properties: {
        _id: label,
        inherited: false,
      },
    };
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

  // eslint-disable-next-line max-statements
  processAllEntities(entities: EntitySchema[]): BatchCompositionResult {
    const allErrors: ProcessingError[] = [];
    let formattedEntities: AdapterEntity[] = [];

    try {
      const templateIds = entities.map(entity => entity.template as string);
      const templatesData = this.templateProcessor.formatTemplateData(templateIds);
      const templatesById = new Map(
        templatesData.map(template => [template._id, template as AdapterEntityTemplate])
      );

      const systemContext = this.context.translations
        .find(translation => translation.locale === this.context.language)
        ?.contexts.find(context => context.id === 'System');
      const createdTranslatedLabel = systemContext?.values.creationDate || 'Creation Date';
      const editTranslatedLabel = systemContext?.values.editDate || 'Edit Date';

      formattedEntities = entities.map(entity => ({
        _id: entity._id! as string,
        title: entity.title!,
        sharedId: entity.sharedId!,
        language: entity.language!,
        template: templatesById.get(entity.template as string)!,
        creationDate: this.getRootDate(
          'creationDate',
          'Creation Date',
          createdTranslatedLabel,
          entity.creationDate || 0
        ),
        editDate: this.getRootDate(
          'editDate',
          'Edit Date',
          editTranslatedLabel,
          (entity.editDate as number) || 0
        ), //TODO: editDate is not defined
        rawEntity: entity,
        metadata: [],
        icon: entity.icon,
      }));

      const propertiesByType = this.collectPropertiesByType(formattedEntities);
      const processedMetadata = this.processPropertiesByType(propertiesByType);
      this.processRootLevelDates(formattedEntities);

      processedMetadata.forEach(({ entity, value, index, ...property }) => {
        if (entity && entity.metadata) {
          const formattedProperty: MetadataProperty = property;
          entity.metadata.splice(index, 0, formattedProperty);
        }
      });

      if (this.context.includeSupportingFiles) {
        this.supportingFilesProcessor.attachSupportingFiles(formattedEntities);
      }
    } catch (error) {
      allErrors.push({
        entityId: 'batch',
        error: error instanceof Error ? error.message : 'AdapterEntityProcessor error',
        timestamp: new Date(),
      });
    }

    const composedEntities: Entity[] = formattedEntities.map(entity => this.composeEntity(entity));

    return {
      entities: composedEntities,
      errors: allErrors,
      success: allErrors.length === 0,
      totalProcessed: entities.length,
      successCount: composedEntities.length,
      errorCount: allErrors.length,
    };
  }

  private shouldConvertToInheritedType(property: AdapterMetadataProperty): boolean {
    return (
      property.type === 'relationship' &&
      !!property.properties.inheritedProperty?.type &&
      property.properties.inheritedProperty.type === 'geolocation'
    );
  }

  private convertToInheritedType(property: AdapterMetadataProperty): void {
    const inheritedProperty = property.properties?.inheritedProperty;
    if (!inheritedProperty?.type) return;

    const transformedValues: AdapterMetadataProperty['value'] = [];

    property.value.forEach(rel => {
      rel.inheritedValue?.forEach(inheritedValue => {
        const transformedValue = {
          value: inheritedValue.value,
          label: inheritedValue.label,
          source: {
            value: rel.value?.toString() || '',
            label: rel.label || '',
            icon: (rel.icon as any)?._id || '',
            url: `/entity/${rel.value?.toString() || ''}`,
          },
        };
        transformedValues.push(transformedValue);
      });
    });

    Object.assign(property, {
      ...property,
      type: inheritedProperty.type,
      value: transformedValues,
      values: transformedValues,
      properties: {
        ...property.properties,
        inherited: true,
        inheritedProperty,
      },
    });
  }

  private composeEntity(adapterEntity: AdapterEntity): Entity {
    const { rawEntity, template, creationDate, editDate, ...entity } = adapterEntity;
    const { entity: _, ...cleanCreationDate } = creationDate;
    const { entity: __, ...cleanEditDate } = editDate;

    return {
      ...entity,
      creationDate: cleanCreationDate as DateMetadataProperty,
      editDate: cleanEditDate as DateMetadataProperty,
      ...(this.context.includeTemplate ? { template: template as EntityTemplate } : {}),
      ...(this.context.includeRawEntity ? { rawEntity } : {}),
    };
  }
}
