import {
  GeolocationMetadataProperty,
  GeolocationPropertyTypes,
} from 'app/V2/domain/entities/types';
import { BasePropertyProcessor } from './BasePropertyProcessor';
import { ProcessingContext, PropertyTypeProcessor, AdapterMetadataProperty } from './types';

export class GeolocationProcessor extends BasePropertyProcessor {
  readonly name = 'GeolocationProcessor';

  readonly propertyTypes: GeolocationPropertyTypes[] = ['geolocation'];

  processBatch(
    properties: Partial<AdapterMetadataProperty>[],
    context: ProcessingContext,
    processors?: Map<string, PropertyTypeProcessor>
  ): Map<string, AdapterMetadataProperty> {
    const results = new Map<string, AdapterMetadataProperty>();

    if (context.combineGeolocation && !context.editionMode) {
      this.processWithCombining(properties, context, results, processors);
    } else {
      this.processIndividually(properties, context, results);
    }
    return results;
  }

  protected formatProperty(
    property: AdapterMetadataProperty,
    context: ProcessingContext
  ): GeolocationMetadataProperty['values'] {
    return this.processGeoValues(property, true, context);
  }

  private processGeoValues(
    property: AdapterMetadataProperty,
    format: boolean,
    context: ProcessingContext
  ): GeolocationMetadataProperty['values'] {
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
  ): GeolocationMetadataProperty['values'] {
    const values = Array.isArray(property.value) ? property.value : [property.value];
    const allGeolocationValues: GeolocationMetadataProperty['values'] = [];

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
    results: Map<string, AdapterMetadataProperty>,
    processors?: Map<string, PropertyTypeProcessor>
  ): void {
    const propertiesByEntity = new Map<string, Partial<AdapterMetadataProperty>[]>();

    properties.forEach(prop => {
      const entityId = prop.entity?._id!;
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
        const values =
          group.length > 1
            ? this.combineProperties(group, context, processors)
            : this.formatProperty(group[0] as AdapterMetadataProperty, context);

        const baseProperty = group[0] as AdapterMetadataProperty;
        const groupedProperty = {
          ...baseProperty,
          type: 'geolocation' as const,
          name: group.length > 1 ? '_combined_geolocation' : baseProperty.name,
          label: group.length > 1 ? 'Combined Geolocation' : baseProperty.label,
          translatedLabel: group.length > 1 ? 'Combined Geolocation' : baseProperty.translatedLabel,
          values,
        } as AdapterMetadataProperty;

        this.pushProperty(groupedProperty, values, results);
      });
    });
  }

  private processIndividually(
    properties: Partial<AdapterMetadataProperty>[],
    context: ProcessingContext,
    results: Map<string, AdapterMetadataProperty>
  ): void {
    properties.forEach(property => {
      try {
        const values = this.formatProperty(property as AdapterMetadataProperty, context);
        this.pushProperty(property as AdapterMetadataProperty, values, results);
      } catch (error) {
        console.error(`Error processing ${this.name} property ${property.name}:`, error);
      }
    });
  }

  private findAdjacentGroups(
    sortedProps: Partial<AdapterMetadataProperty>[]
  ): Partial<AdapterMetadataProperty>[][] {
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

  private isAdjacent(
    prop: Partial<AdapterMetadataProperty>,
    prevProp: Partial<AdapterMetadataProperty>
  ): boolean {
    if (prop.entity?._id !== prop.entity?._id) {
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
  ): GeolocationMetadataProperty['values'] {
    const allValues: GeolocationMetadataProperty['values'] = [];

    properties.forEach(p => {
      const propValues = this.formatProperty(p as AdapterMetadataProperty, context);
      allValues.push(...(propValues as any));
    });

    return allValues;
  }
}
