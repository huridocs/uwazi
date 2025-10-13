import { GeolocationPropertyTypes } from 'app/V2/domain/entities/types';
import { BasePropertyProcessor } from './BasePropertyProcessor';
import { PropertyValue, ProcessingContext } from './types';

export class GeolocationProcessor extends BasePropertyProcessor {
  readonly name = 'GeolocationProcessor';
  readonly propertyTypes: GeolocationPropertyTypes[] = ['geolocation'];

  protected createRawValues(property: PropertyValue): PropertyValue[] {
    const values = Array.isArray(property.value) ? property.value : [property.value];
    return values.map((geo: any) => {
      if (!geo) {
        return {
          value: geo,
          label: '',
          displayValue: '',
        };
      }

      let lat: number;
      let lon: number;

      if (geo.value && (geo.value.latitude !== undefined || geo.value.longitude !== undefined)) {
        lat = geo.value.latitude || geo.value.lat;
        lon = geo.value.longitude || geo.value.lon;
      } else if (
        geo.value &&
        geo.value.value &&
        (geo.value.value.lat !== undefined || geo.value.value.lon !== undefined)
      ) {
        // Handle nested structure: { value: { lat: X, lon: Y } }
        lat = geo.value.value.lat;
        lon = geo.value.value.lon;
      } else if (geo.latitude !== undefined || geo.longitude !== undefined) {
        // Handle case where geo is the coordinate object directly
        lat = geo.latitude || geo.lat;
        lon = geo.longitude || geo.lon;
      } else {
        // Fallback - return the original geo object
        return {
          value: geo,
          label: geo.toString() || '',
          displayValue: geo.toString() || '',
        };
      }

      const coordinateLabel =
        lat !== undefined && lon !== undefined && lat !== null && lon !== null
          ? `${lat}, ${lon}`
          : 'Invalid coordinates';
      return {
        value: { latitude: lat, longitude: lon },
        label: geo.label || coordinateLabel,
      };
    });
  }

  protected formatProperty(property: any, context: ProcessingContext): PropertyValue[] {
    const geolocationFormatting = {
      combineGeolocation: context.editionMode ? false : context.combineGeolocation,
    };
    const values = Array.isArray(property.value) ? property.value : [property.value];

    const formattedValues = values.map((geo: any) => {
      if (!geo) {
        return {
          value: geo,
          label: '',
          displayValue: '',
        };
      }

      let lat: number;
      let lon: number;

      if (geo.value && (geo.value.lat !== undefined || geo.value.lon !== undefined)) {
        lat = geo.value.lat;
        lon = geo.value.lon;
      } else if (
        geo.value &&
        geo.value.value &&
        (geo.value.value.lat !== undefined || geo.value.value.lon !== undefined)
      ) {
        lat = geo.value.value.lat;
        lon = geo.value.value.lon;
      } else if (
        geo.value &&
        (geo.value.latitude !== undefined || geo.value.longitude !== undefined)
      ) {
        lat = geo.value.latitude || geo.value.lat;
        lon = geo.value.longitude || geo.value.lon;
      } else if (geo.latitude !== undefined || geo.longitude !== undefined) {
        lat = geo.latitude || geo.lat;
        lon = geo.longitude || geo.lon;
      } else if (geo.lat !== undefined || geo.lon !== undefined) {
        lat = geo.lat;
        lon = geo.lon;
      } else {
        return {
          value: geo,
          label: 'Invalid coordinates',
          displayValue: 'Invalid coordinates',
          error: 'Invalid coordinates',
        };
      }

      if (lat === undefined || lon === undefined || lat === null || lon === null) {
        return {
          value: geo,
          label: 'Invalid coordinates',
          displayValue: 'Invalid coordinates',
          error: 'Invalid coordinates',
        };
      }

      const latFormatted = Number(lat).toFixed(2);
      const lonFormatted = Number(lon).toFixed(2);
      const label = `${latFormatted}°N, ${lonFormatted}°E`;

      return {
        value: { latitude: lat, longitude: lon },
        label,
      };
    });

    const finalValues =
      geolocationFormatting.combineGeolocation && formattedValues.length > 1
        ? [
          {
            value: formattedValues.map((v: any) => v.value),
            label: `Multiple locations (${formattedValues.length})`,
            displayValue: `Multiple locations (${formattedValues.length})`,
            formattedValue: formattedValues,
          },
        ]
        : formattedValues;

    return finalValues;
  }
}
