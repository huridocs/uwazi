import {
  GeolocationMetadataProperty,
  GeolocationPropertyTypes,
} from 'app/V2/domain/entities/types';
import { reportErrorToSentry } from 'app/V2/shared/errorUtils';
import { BasePropertyProcessor } from './BasePropertyProcessor';
import { ProcessingContext, PropertyTypeProcessor, AdapterMetadataProperty } from './types';

export class GeolocationProcessor extends BasePropertyProcessor {
  readonly name = 'GeolocationProcessor';

  readonly propertyTypes: GeolocationPropertyTypes[] = ['geolocation'];

  private formatCoordinate(latitude: number, longitude: number): string {
    const latDir = latitude >= 0 ? 'N' : 'S';
    const lonDir = longitude >= 0 ? 'E' : 'W';
    return `${Math.abs(latitude).toFixed(2)}°${latDir}, ${Math.abs(longitude).toFixed(2)}°${lonDir}`;
  }

  processBatch(
    properties: AdapterMetadataProperty[],
    context: ProcessingContext,
    processors?: Map<string, PropertyTypeProcessor>
  ): AdapterMetadataProperty[] {
    const results: AdapterMetadataProperty[] = [];

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
    return this.processGeoValues(property, context);
  }

  private processGeoValues(
    property: AdapterMetadataProperty,
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

      return {
        value: { latitude: lat, longitude: lon },
        label: property.label,
        translatedLabel: property.translatedLabel,
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

      const { lat, lon, label } = geo.value.value || geo.value;

      if (lat === undefined || lon === undefined || lat === null || lon === null) {
        return;
      }

      const targetTemplate = property.properties.content
        ? context.templates.find((t: any) => t._id === property.properties.content)
        : null;
      const templateColor = targetTemplate?.color || '';

      const result = {
        value: { latitude: lat, longitude: lon },
        label: geo.source?.label || label || '',
        name: property.name,
        source: {
          value: geo.source?.value || '',
          label: geo.source?.label || '',
          color: templateColor,
          icon: geo.source?.icon,
          url: geo.source?.url || '',
          type: 'entity',
          inheritedType: 'geolocation',
        },
      };

      allGeolocationValues.push(result);
    });

    return allGeolocationValues;
  }

  private processWithCombining(
    properties: AdapterMetadataProperty[],
    context: ProcessingContext,
    results: AdapterMetadataProperty[],
    processors?: Map<string, PropertyTypeProcessor>
  ): void {
    const propertiesByEntity: Map<string, AdapterMetadataProperty[]> = new Map();

    properties.forEach(prop => {
      const entityId = prop.entity?._id!;
      if (!propertiesByEntity.has(entityId)) propertiesByEntity.set(entityId, []);
      propertiesByEntity.get(entityId)!.push(prop);
    });

    propertiesByEntity.forEach(entityProps => {
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
            : this.formatProperty(group[0], context);

        const baseProperty = group[0];
        const groupedProperty = {
          ...baseProperty,
          type: 'geolocation' as const,
          name: group.length > 1 ? '_combined_geolocation' : baseProperty.name,
          label: group.length > 1 ? 'Combined Geolocation' : baseProperty.label,
          translatedLabel: group.length > 1 ? 'Combined Geolocation' : baseProperty.translatedLabel,
          values,
        };

        results.push(groupedProperty);
      });
    });
  }

  private processIndividually(
    properties: AdapterMetadataProperty[],
    context: ProcessingContext,
    results: AdapterMetadataProperty[]
  ): void {
    properties.forEach(property => {
      try {
        const values = this.formatProperty(property, context).map(v => ({
          ...v,
          label: this.formatCoordinate(v.value.latitude, v.value.longitude),
        }));
        results.push(Object.assign(property, { values }));
      } catch (error) {
        reportErrorToSentry(
          error as Error,
          `Error processing ${this.name} property ${property.name}`
        );
      }
    });
  }

  private findAdjacentGroups(sortedProps: AdapterMetadataProperty[]): AdapterMetadataProperty[][] {
    const groups: AdapterMetadataProperty[][] = [];
    let currentGroup: AdapterMetadataProperty[] = [];

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

  private isAdjacent(prop: AdapterMetadataProperty, prevProp: AdapterMetadataProperty): boolean {
    if (prop.entity?._id !== prevProp.entity?._id) {
      return false;
    }

    if (prop.properties?.inherited) {
      return true;
    }

    return (prop.index || 0) === (prevProp.index || 0) + 1;
  }

  private combineProperties(
    properties: AdapterMetadataProperty[],
    context: ProcessingContext,
    _processors?: Map<string, PropertyTypeProcessor>
  ): GeolocationMetadataProperty['values'] {
    const allValues: GeolocationMetadataProperty['values'] = [];

    properties.forEach(p => {
      const propValues = this.formatProperty(p, context);
      const valuesWithName = propValues.map(v => ({
        ...v,
        name: p.name,
      }));
      allValues.push(...valuesWithName);
    });

    return allValues;
  }
}
