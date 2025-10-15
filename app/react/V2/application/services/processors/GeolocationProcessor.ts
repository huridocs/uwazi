import { GeolocationPropertyTypes } from 'app/V2/domain/entities/types';
import { MetadataProperty } from 'app/V2/domain/entities/types';
import { BasePropertyProcessor } from './BasePropertyProcessor';
import {
  ProcessingContext,
  PropertyTypeProcessor,
  AdapterMetadataProperty,
} from './types';

export class GeolocationProcessor extends BasePropertyProcessor {
  readonly name = 'GeolocationProcessor';

  readonly propertyTypes: GeolocationPropertyTypes[] = ['geolocation'];

  processBatch(
    properties: Partial<AdapterMetadataProperty>[],
    context: ProcessingContext,
    processors?: Map<string, PropertyTypeProcessor>
  ): Map<string, MetadataProperty> {
    const results = new Map<string, MetadataProperty>();

    if (context.combineGeolocation && !context.editionMode) {
      this.processWithCombining(properties, context, results, processors);
    } else {
      this.processIndividually(properties, context, results, processors);
    }

    return results;
  }

  protected formatProperty(
    property: AdapterMetadataProperty,
    context: ProcessingContext
  ): MetadataProperty["values"] {
    return this.processGeoValues(property, true, context);
  }

  private processGeoValues(
    property: AdapterMetadataProperty,
    format: boolean,
    context: ProcessingContext
  ): MetadataProperty["values"] {
    if (
      property.properties.inherited &&
      property.properties.inheritedProperty?.type === 'geolocation' &&
      property.value
    ) {
      return this.processInheritedGeolocationValues(property, context);
    }

    const values = Array.isArray(property.value) ? property.value : [property.value];

    return values.map((geo: any) => {
      if (!geo) return { value: geo, label: '' };

      const lat = geo.value?.lat;
      const lon = geo.value?.lon;

      if (lat === undefined || lon === undefined || lat === null || lon === null) {
        return { value: geo, label: '' };
      }

      const coordinateLabel = format
        ? `${Number(lat).toFixed(2)}°N, ${Number(lon).toFixed(2)}°E`
        : `${lat}, ${lon}`;

      return {
        value: { latitude: lat, longitude: lon },
        label: format ? coordinateLabel : geo.label || coordinateLabel,
        name: property.name,
      };
    });
  }

  private processInheritedGeolocationValues(
    property: AdapterMetadataProperty,
    context: ProcessingContext
  ): MetadataProperty["values"] {
    const values = Array.isArray(property.value) ? property.value : [property.value];
    const allGeolocationValues: MetadataProperty["values"] = [];

    values.forEach((geo: any) => {
      if (!geo || !geo.value) return;

      const { lat, lon, label } = geo.value;

      if (lat === undefined || lon === undefined || lat === null || lon === null) {
        return;
      }

      const targetTemplate = property.properties.content
        ? context.templates.find((t: any) => t._id === property.properties.content)
        : null;
      const templateColor = targetTemplate?.color || '';

      const result = {
        value: { latitude: lat, longitude: lon },
        label: geo._relationshipMetadata?.label || label || '',
        name: property.name,
        color: templateColor,
        properties: geo._relationshipMetadata || undefined,
      };

      allGeolocationValues.push(result as any);
    });

    return allGeolocationValues;
  }

  private processWithCombining(
    properties: Partial<AdapterMetadataProperty>[],
    context: ProcessingContext,
    results: Map<string, MetadataProperty>,
    processors?: Map<string, PropertyTypeProcessor>
  ): void {
    const propertiesByEntity = new Map<string, Partial<AdapterMetadataProperty>[]>();
    properties.forEach(prop => {
      const entityId = prop._entityId!;
      if (!propertiesByEntity.has(entityId)) propertiesByEntity.set(entityId, []);
      propertiesByEntity.get(entityId)!.push(prop);
    });

    propertiesByEntity.forEach((entityProps, entityId) => {
      const sortedProps = entityProps.sort((a, b) => {
        const indexA = a.index !== undefined ? a.index : 9999;
        const indexB = b.index !== undefined ? b.index : 9999;
        return indexA - indexB;
      });

      const groups = this.findAdjacentGroups(sortedProps);

      groups.forEach(group => {
        const key = `${entityId}:${group[0].name}`;
        const values =
          group.length > 1
            ? this.combineProperties(group, context, processors)
            : this.formatProperty(group[0] as AdapterMetadataProperty, context);

        const resultProperty = {
          _id: group[0]._id!,
          _entityId: group[0]._entityId!,
          type: group[0].type!,
          name: group.length > 1 ? '_combined_geolocation' : group[0].name!,
          label: group.length > 1 ? 'Combined Geolocation' : group[0].label!,
          translatedLabel: group.length > 1 ? 'Combined Geolocation' : group[0].translatedLabel,
          values,
          value: group[0].value || null,
          inherited: group[0].inherited || false,
          inheritedType: group[0].inheritedType,
          properties: {
            _id: group[0]._id!,
            template: group[0].properties?.template ? {
              _id: group[0].properties.template._id,
              name: group[0].properties.template.name,
              label: group[0].properties.template.label || group[0].properties?.template?.name,
              color: group[0].properties.template.color || '',
            } : undefined,
            inheritedProperty: group[0].properties?.inheritedProperty ? {
              property: group[0].properties.inheritedProperty.name || '',
              type: (group[0].properties.inheritedProperty.type || 'geolocation') as any,
              name: group[0].properties.inheritedProperty.name || '',
              label: group[0].properties.inheritedProperty.label || '',
            } : undefined,
            translateContext: group[0].properties?.content || ''
          },
        };

        results.set(key, resultProperty);
      });
    });
  }

  private processIndividually(
    properties: Partial<AdapterMetadataProperty>[],
    context: ProcessingContext,
    results: Map<string, MetadataProperty>,
    processors?: Map<string, PropertyTypeProcessor>
  ): void {
    properties.forEach(property => {
      try {
        const key = `${property._entityId}:${property.name}`;
        const values = this.formatProperty(property as AdapterMetadataProperty, context);

        const resultProperty = {
          _id: property._id!,
          _entityId: property._entityId!,
          type: property.type!,
          name: property.name!,
          label: property.label!,
          translatedLabel: property.translatedLabel,
          values,
          value: property.value || null,
          inherited: property.inherited || false,
          inheritedType: property.inheritedType,
          properties: {
            _id: property._id!,
            template: property.properties?.template ? {
              _id: property.properties.template._id,
              name: property.properties.template.name,
              label: property.properties.template.label || property.properties?.template?.name,
              color: property.properties.template.color || '',
            } : undefined,
            inheritedProperty: property.properties?.inheritedProperty ? {
              property: property.properties.inheritedProperty.name || '',
              type: (property.properties.inheritedProperty.type || 'geolocation') as any,
              name: property.properties.inheritedProperty.name || '',
              label: property.properties.inheritedProperty.label || '',
            } : undefined,
            translateContext: property.properties?.content || ''
          },
        };

        results.set(key, resultProperty as MetadataProperty);
      } catch (error) {
        console.error(`Error processing ${this.name} property ${property.name}:`, error);
      }
    });
  }

  private findAdjacentGroups(sortedProps: Partial<AdapterMetadataProperty>[]): Partial<AdapterMetadataProperty>[][] {
    const groups: Partial<AdapterMetadataProperty>[][] = [];
    let currentGroup: Partial<AdapterMetadataProperty>[] = [];

    sortedProps.forEach(prop => {
      if (
        currentGroup.length === 0 ||
        this.isAdjacent(prop, currentGroup[currentGroup.length - 1])
      ) {
        currentGroup.push(prop);
      } else {
        groups.push([...currentGroup]);
        currentGroup = [prop];
      }
    });

    if (currentGroup.length > 0) groups.push(currentGroup);
    return groups;
  }

  private isAdjacent(prop: Partial<AdapterMetadataProperty>, prevProp: Partial<AdapterMetadataProperty>): boolean {
    if (prop._entityId !== prevProp._entityId) {
      return false;
    }

    if (prop.properties?.inherited) {
      return true;
    }

    return (prop.index || 0) === (prevProp.index || 0) + 1;
  }

  private combineProperties(
    properties: Partial<AdapterMetadataProperty>[],
    context: ProcessingContext,
    processors?: Map<string, PropertyTypeProcessor>
  ): MetadataProperty["values"] {
    const allValues: MetadataProperty["values"] = [];

    properties.forEach(p => {
      const propValues = this.formatProperty(p as AdapterMetadataProperty, context);
      allValues.push(...(propValues as any));
    });

    return allValues;
  }
}
