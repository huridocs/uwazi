import { GeolocationPropertyTypes } from 'app/V2/domain/entities/types';
import { BasePropertyProcessor } from './BasePropertyProcessor';
import { PropertyValue, ProcessingContext, FormattedProperty, GeolocationPropertyValue } from './types';

export class GeolocationProcessor extends BasePropertyProcessor {
  readonly name = 'GeolocationProcessor';
  readonly propertyTypes: GeolocationPropertyTypes[] = ['geolocation'];

  processBatch(properties: any[], context: ProcessingContext): Map<string, FormattedProperty> {
    const results = new Map<string, FormattedProperty>();

    if (context.combineGeolocation && !context.editionMode) {
      this.processWithCombining(properties, context, results);
    } else {
      this.processIndividually(properties, context, results);
    }

    return results;
  }

  protected createRawValues(property: PropertyValue, context?: ProcessingContext): GeolocationPropertyValue[] {
    return this.processGeoValues(property, false, context);
  }

  protected formatProperty(property: any, context: ProcessingContext): GeolocationPropertyValue[] {
    return this.processGeoValues(property, true, context);
  }

  private processGeoValues(property: any, format: boolean, context?: ProcessingContext): GeolocationPropertyValue[] {
    if (property._isInheritedGeolocation && property.value && context) {
      return this.processInheritedGeolocationValues(property, format, context);
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

      const result: GeolocationPropertyValue = {
        value: { latitude: lat, longitude: lon },
        label: format ? coordinateLabel : (geo.label || coordinateLabel),
        name: property.name,
      };

      return result;
    });
  }

  private processInheritedGeolocationValues(property: any, format: boolean, context: ProcessingContext): GeolocationPropertyValue[] {
    const values = Array.isArray(property.value) ? property.value : [property.value];
    const allGeolocationValues: GeolocationPropertyValue[] = [];

    values.forEach((rel: any) => {
      if (!rel) return;

      if (rel.inheritedValue && Array.isArray(rel.inheritedValue)) {
        rel.inheritedValue.forEach((inheritedGeo: any) => {
          if (!inheritedGeo || !inheritedGeo.value) return;

          const lat = inheritedGeo.value.lat;
          const lon = inheritedGeo.value.lon;

          if (lat === undefined || lon === undefined || lat === null || lon === null) {
            return;
          }

          const coordinateLabel = format
            ? `${Number(lat).toFixed(2)}°N, ${Number(lon).toFixed(2)}°E`
            : `${lat}, ${lon}`;

          const targetTemplate = property.content ?
            context.templates.find((t: any) => t._id === property.content) : null;
          const templateColor = targetTemplate?.color || '';

          const result: GeolocationPropertyValue = {
            value: { latitude: lat, longitude: lon },
            label: rel.label || '',
            name: property.name,
            color: templateColor,
            properties: {
              entity: rel.value,
              label: rel.label || '',
              icon: rel.icon || '',
              type: rel.type || '',
              inheritedType: rel.inheritedType || '',
              url: rel.url || `/entity/${rel.value}`,
            },
          };

          allGeolocationValues.push(result);
        });
      }
    });

    return allGeolocationValues;
  }

  private processWithCombining(properties: any[], context: ProcessingContext, results: Map<string, FormattedProperty>): void {
    const propertiesByEntity = new Map<string, any[]>();
    properties.forEach(prop => {
      const entityId = prop._entityId;
      if (!propertiesByEntity.has(entityId)) propertiesByEntity.set(entityId, []);
      propertiesByEntity.get(entityId)!.push(prop);
    });

    propertiesByEntity.forEach((entityProps, entityId) => {
      // Sort properties by index, but include properties without index at the end
      const sortedProps = entityProps
        .sort((a, b) => {
          const indexA = a.index !== undefined ? a.index : 9999;
          const indexB = b.index !== undefined ? b.index : 9999;
          return indexA - indexB;
        });

      const groups = this.findAdjacentGroups(sortedProps);

      groups.forEach(group => {
        const key = `${entityId}:${group[0].name}`;
        const values = group.length > 1
          ? this.combineProperties(group, context)
          : this.formatProperty(group[0], context);

        const resultProperty = group.length > 1
          ? {
            ...group[0],
            name: '_combined_geolocation',
            label: 'Combined Geolocation',
            translatedLabel: 'Combined Geolocation',
            values
          }
          : { ...group[0], values };

        results.set(key, resultProperty);
      });
    });
  }

  private processIndividually(properties: any[], context: ProcessingContext, results: Map<string, FormattedProperty>): void {
    properties.forEach(property => {
      try {
        const key = `${property._entityId}:${property.name}`;
        const values = this.formatProperty(property, context);
        results.set(key, { ...property, values });
      } catch (error) {
        console.error(`Error processing ${this.name} property ${property.name}:`, error);
      }
    });
  }

  private findAdjacentGroups(sortedProps: any[]): any[][] {
    const groups: any[][] = [];
    let currentGroup: any[] = [];

    sortedProps.forEach(prop => {
      if (currentGroup.length === 0 || this.isAdjacent(prop, currentGroup[currentGroup.length - 1])) {
        currentGroup.push(prop);
      } else {
        groups.push([...currentGroup]);
        currentGroup = [prop];
      }
    });

    if (currentGroup.length > 0) groups.push(currentGroup);
    return groups;
  }

  private isAdjacent(prop: any, prevProp: any): boolean {
    if (prop._entityId !== prevProp._entityId) {
      return false;
    }

    if (prop._isInheritedGeolocation || prevProp._isInheritedGeolocation) {
      return true;
    }

    return (prop.index || 0) === (prevProp.index || 0) + 1;
  }

  private combineProperties(properties: any[], context: ProcessingContext): GeolocationPropertyValue[] {
    const allValues: GeolocationPropertyValue[] = [];

    properties.forEach(p => {
      const propValues = this.formatProperty(p, context);
      allValues.push(...propValues);
    });

    return allValues;
  }
}
