import { flatMap, groupBy, map } from 'lodash';
import { Entity, MetadataProperty } from 'app/V2/domain';
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
import { MediaPropertyProcessor } from './MediaPropertyProcessor';
import { PermissionProcessor } from './PermissionProcessor';
import { DefaultPropertyProcessor } from './DefaultPropertyProcessor';
import { LinkPropertyProcessor } from './LinkPropertyProcessor';
import { PreviewPropertyProcessor } from './PreviewPropertyProcessor';

export class AdapterEntityProcessor {
  private readonly context: ProcessingContext;
  private readonly processors: Map<string, PropertyTypeProcessor> = new Map();
  private readonly templateProcessor: AdapterTemplateProcessor;

  constructor(context: ProcessingContext) {
    this.context = context;
    this.templateProcessor = new AdapterTemplateProcessor(context);

    this.initializeProcessors();
  }

  private initializeProcessors(): void {
    const processors = [
      new DatePropertyProcessor(),
      new SelectPropertyProcessor(),
      new GeolocationProcessor(),
      new RelationshipProcessor(),
      new MediaPropertyProcessor(),
      new PermissionProcessor(),
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
              entity: entity,
            } as AdapterMetadataProperty;
          }
        }
      ).filter(property => property !== undefined);

      return metadataProperties;
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
    return properties.map(property => {
      if (property.type === 'relationship' && property.value && Array.isArray(property.value)) {
        const hasInheritedValues = property.value.some(
          (value: any) =>
            value.inheritedValue &&
            Array.isArray(value.inheritedValue) &&
            value.inheritedValue.length > 0
        );

        if (hasInheritedValues) {
          const processedValues = this.flattenInheritedValues(property.value, property.entity, [property.entity._id]);
          return {
            ...property,
            type: 'relationship',
            value: processedValues,
            values: processedValues,
          };
        }
      }
      return property;
    });
  }

  private flattenInheritedValues(
    values: MetadataObjectSchema[],
    mainEntity: AdapterEntity,
    sourceChain: string[],
  ): MetadataObjectSchema[] {
    return values.map(value => {
      if (value.inheritedType !== 'relationship' || sourceChain.includes(value.value as string)) {
        return {
          value: value.value,
          label: value.label,
          url: '/entity/' + value.value,
          icon: value.icon,
        };
      }
      sourceChain.push(value.value as string);
      return this.flattenInheritedValues(value.inheritedValue || [], mainEntity, sourceChain);
    }).flat();
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
      name: name,
      entity: undefined as any,
      label: label,
      translatedLabel,
      type: 'date',
      value: [{ value }],
      index: 0,
      values: [
        {
          value: value,
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

      processedMetadata.forEach(({ entity, ...property }) => {
        if (entity && entity.metadata) {
          entity.metadata.splice(property.index, 0, property as MetadataProperty);
        }
      });
    } catch (error) {
      allErrors.push({
        entityId: 'batch',
        error: error instanceof Error ? error.message : 'AdapterEntityProcessor error',
        timestamp: new Date(),
      });
    }

    const composedEntities = formattedEntities.map(({ rawEntity, ...restEntity }) => {
      const { template, ...entity } = restEntity;
      if (template) {
        const { properties, commonProperties, ...restTemplate } = template;
        return { ...entity, template: restTemplate as AdapterEntityTemplate } as Entity;
      }
      return { ...entity, template };
    });

    return {
      entities: composedEntities as Entity[],
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
      property.properties.inheritedProperty.type !== 'relationship'
    );
  }

  private convertToInheritedType(property: AdapterMetadataProperty): void {
    const inheritedProperty = property.properties?.inheritedProperty;
    if (!inheritedProperty?.type) return;

    const transformedValues: AdapterMetadataProperty['value'] = [];

    property.value.forEach(rel => {
      rel.inheritedValue?.forEach(inheritedValue => {
        transformedValues.push({
          value: inheritedValue.value,
          label: inheritedValue.label,
          source: {
            value: rel.value?.toString() || '',
            label: rel.label || '',
            url: '/entity/' + (rel.value?.toString() || ''),
          },
        });
      });
    });

    Object.assign(property, {
      ...property,
      values: transformedValues,
      properties: {
        ...property.properties,
        type: inheritedProperty.type,
        inherited: true,
      },
    });
  }
}
