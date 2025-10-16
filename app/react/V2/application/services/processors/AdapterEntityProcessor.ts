import { flatMap, groupBy, map } from 'lodash';
import { Entity, MetadataProperty } from 'app/V2/domain';
import { EntitySchema } from 'shared/types/entityType';
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
            } as AdapterMetadataProperty; //TODO avoid this cast
          }
        }
      ).filter(property => property !== undefined);

      // const rootProperties: AdapterMetadataProperty[] = [];
      // if (entity.rawEntity?.permissions) {
      //   rootProperties.push({
      //     _id: 'permissions',
      //     value: entity.rawEntity.permissions as any,
      //     name: 'permissions',
      //     label: 'Permissions',
      //     type: 'permissions',
      //     entity: entity,
      //     index: 0,
      //     values: [],
      //     properties: {
      //       _id: 'permissions',
      //       content: 'permissions',
      //       inherited: false,
      //       translatedLabel: 'Permissions',
      //       inheritedProperty: undefined,
      //     },
      //   });
      // }

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
        const processedValues = this.flattenInheritedValues(property.value, []);
        return {
          ...property,
          value: processedValues,
          values: processedValues,
        };
      }
      return property;
    });
  }

  private flattenInheritedValues(values: any[], sourceChain: any[]): any[] {
    const result: any[] = [];

    values.forEach(value => {
      if (value.inheritedValue && Array.isArray(value.inheritedValue)) {
        const newSourceChain = [
          ...sourceChain,
          {
            value: value.value,
            label: value.label,
            icon: value.icon,
            type: value.type,
          },
        ];
        const nestedValues = this.flattenInheritedValues(value.inheritedValue, newSourceChain);
        result.push(...nestedValues);
      } else {
        const source =
          sourceChain.length > 1
            ? sourceChain[sourceChain.length - 2]
            : sourceChain.length > 0
              ? sourceChain[sourceChain.length - 1]
              : null;
        result.push({
          ...value,
          _inheritedSource: source,
        });
      }
    });

    return result;
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
    const inheritedType = property.properties?.inheritedProperty?.type;
    if (!inheritedType) return;

    const transformedValues: unknown[] = [];
    const values = Array.isArray(property.value) ? property.value : [property.value];

    values.forEach((rel: unknown) => {
      if (
        rel &&
        typeof rel === 'object' &&
        'inheritedValue' in rel &&
        Array.isArray((rel as any).inheritedValue)
      ) {
        (rel as any).inheritedValue.forEach((inheritedValue: unknown) => {
          if (
            inheritedValue &&
            typeof inheritedValue === 'object' &&
            'value' in inheritedValue &&
            (inheritedValue as any).value !== undefined
          ) {
            transformedValues.push(this.createTransformedValue(inheritedType, inheritedValue, rel));
          }
        });
      }
    });

    Object.assign(property, {
      ...property,
      type: inheritedType as any,
      _originalRelationshipType: 'relationship',
      _isInheritedProperty: true,
      _inheritedType: inheritedType,
      value: transformedValues,
      properties: {
        ...property.properties,
        inherited: true,
      },
    });
  }

  private createTransformedValue(
    inheritedType: string,
    inheritedValue: unknown,
    rel: unknown
  ): unknown {
    const valueObj =
      inheritedValue && typeof inheritedValue === 'object' && 'value' in inheritedValue
        ? (inheritedValue as any).value
        : null;
    const relObj = rel && typeof rel === 'object' ? (rel as any) : {};

    const value =
      inheritedType === 'geolocation' && valueObj?.lat && valueObj?.lon
        ? { lat: valueObj.lat, lon: valueObj.lon, label: valueObj.label || '' }
        : valueObj;

    return {
      value: {
        value,
        label: (inheritedValue as any)?.label || value?.toString(),
        parent: (inheritedValue as any)?.parent,
      },
      _relationshipMetadata: {
        entity: relObj.value || '',
        label: relObj.label || '',
        icon: relObj.icon || '',
        type: relObj.type || '',
        inheritedType: relObj.inheritedType || '',
        url: relObj.url || `/entity/${relObj.value}`,
      },
    };
  }
}
