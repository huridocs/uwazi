/* eslint-disable max-statements */
import type { MetadataValue } from '#app/V2/formatters/types.js';
import { parseCoordinate } from '#shared/geolocationCoordinates.js';
import type {
  MetadataObjectSchema,
  PropertyValueSchema,
  InheritedValueSchema,
  SelectParentSchema,
} from '#shared/types/commonTypes.js';

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null;

const coerceCoordinate = (value: unknown): number | undefined => {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === 'string') {
    return parseCoordinate(value);
  }
  return undefined;
};

const hasLatLonKeys = (value: Record<string, unknown>) =>
  'lat' in value || 'lon' in value || 'latitude' in value || 'longitude' in value;

const toLatLonValue = (
  value: Record<string, unknown>
): { lat: number; lon: number; label?: string } | null => {
  const lat = coerceCoordinate(value.lat ?? value.latitude);
  const lon = coerceCoordinate(value.lon ?? value.longitude);
  if (lat === undefined || lon === undefined) {
    return null;
  }
  return {
    lat,
    lon,
    ...(typeof value.label === 'string' ? { label: value.label } : {}),
  };
};

const isNestedRow = (value: unknown): value is Record<string, string[]> =>
  isRecord(value) &&
  Object.values(value).every(
    column => Array.isArray(column) && column.every(item => typeof item === 'string')
  );

const toPropertyValueSchema = (value: unknown): PropertyValueSchema => {
  if (
    value === null ||
    typeof value === 'string' ||
    typeof value === 'number' ||
    typeof value === 'boolean'
  ) {
    return value;
  }

  if (
    Array.isArray(value) &&
    value.length > 0 &&
    value.every(item => isRecord(item) && hasLatLonKeys(item))
  ) {
    const points = value.map(item => toLatLonValue(item));
    if (points.some(point => point === null)) {
      return null;
    }
    return points.filter((point): point is NonNullable<typeof point> => point !== null);
  }

  if (isRecord(value) && hasLatLonKeys(value)) {
    return toLatLonValue(value);
  }

  if (isNestedRow(value)) {
    return value;
  }

  if (isRecord(value)) {
    const { from, to, label, url } = value;

    if (from !== undefined || to !== undefined || from === null || to === null) {
      return {
        from: typeof from === 'number' || from === null ? from : undefined,
        to: typeof to === 'number' || to === null ? to : undefined,
      };
    }

    if (label !== undefined || url !== undefined || label === null || url === null) {
      return {
        label: typeof label === 'string' || label === null ? label : undefined,
        url: typeof url === 'string' || url === null ? url : undefined,
      };
    }
  }

  return null;
};

const toParentSchema = (parent?: MetadataValue['parent']): SelectParentSchema | undefined =>
  parent && typeof parent.label === 'string' && typeof parent.value === 'string'
    ? { label: parent.label, value: parent.value }
    : undefined;

const toInheritedValueSchema = (value: MetadataValue): InheritedValueSchema => {
  const inherited: InheritedValueSchema = {
    value: toPropertyValueSchema(value.value),
  };

  if (typeof value.label === 'string') {
    inherited.label = value.label;
  }

  const parent = toParentSchema(value.parent);
  if (parent) {
    inherited.parent = parent;
  }

  return inherited;
};

const toMetadataObjectSchema = (value: MetadataValue): MetadataObjectSchema => {
  if (value.type === 'entity') {
    return {
      value: toPropertyValueSchema(value.value),
    };
  }

  const metadataValue: MetadataObjectSchema = {
    value: toPropertyValueSchema(value.value),
  };

  if (typeof value.label === 'string') {
    metadataValue.label = value.label;
  }

  if (typeof value.inheritedType === 'string') {
    metadataValue.inheritedType = value.inheritedType;
  }

  const parent = toParentSchema(value.parent);

  if (parent) {
    metadataValue.parent = parent;
  }

  if (Array.isArray(value.inheritedValue) && value.inheritedValue.length > 0) {
    metadataValue.inheritedValue = value.inheritedValue.map(toInheritedValueSchema);
  }

  return metadataValue;
};

export { toMetadataObjectSchema };
