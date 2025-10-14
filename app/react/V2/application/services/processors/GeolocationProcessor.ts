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

  protected createRawValues(property: PropertyValue): GeolocationPropertyValue[] {
    return this.processGeoValues(property, false);
  }

  protected formatProperty(property: any, context: ProcessingContext): GeolocationPropertyValue[] {
    return this.processGeoValues(property, true);
  }

  private processGeoValues(property: any, format: boolean): GeolocationPropertyValue[] {
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
      };

      if (geo.name) {
        result.name = geo.name;
      }
      if (geo.label) {
        result.label = geo.label;
      }

      return result;
    });
  }

  private processWithCombining(properties: any[], context: ProcessingContext, results: Map<string, FormattedProperty>): void {
    const propertiesByEntity = new Map<string, any[]>();
    properties.forEach(prop => {
      const entityId = prop._entityId;
      if (!propertiesByEntity.has(entityId)) propertiesByEntity.set(entityId, []);
      propertiesByEntity.get(entityId)!.push(prop);
    });

    propertiesByEntity.forEach((entityProps, entityId) => {
      const sortedProps = entityProps
        .filter(p => p.index !== undefined)
        .sort((a, b) => (a.index || 0) - (b.index || 0));

      const groups = this.findAdjacentGroups(sortedProps);

      groups.forEach(group => {
        const key = `${entityId}:${group[0].name}`;
        const values = group.length > 1
          ? this.combineProperties(group, context)
          : this.formatProperty(group[0], context);
        results.set(key, { ...group[0], values });
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
    return prop._entityId === prevProp._entityId &&
      (prop.index || 0) === (prevProp.index || 0) + 1;
  }

  private combineProperties(properties: any[], context: ProcessingContext): GeolocationPropertyValue[] {
    const allValues = properties.flatMap(p => {
      const values = Array.isArray(p.value) ? p.value : [p.value];
      return values.map((value: any) => ({
        ...value,
        name: p.name,
        label: p.label,
      }));
    });

    const combinedProperty = {
      ...properties[0],
      value: allValues,
      name: properties.map(p => p.name).join(', '),
      label: properties.map(p => p.label).join(', '),
    };
    return this.formatProperty(combinedProperty, context);
  }
}
