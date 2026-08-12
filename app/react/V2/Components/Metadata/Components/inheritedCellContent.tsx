import { type ReactNode } from 'react';
import type {
  GeolocationMetadataProperty,
  ImageMetadataProperty,
  MediaMetadataProperty,
  MetadataProperty,
  SimpleMetadataProperty,
} from '#V2/formatters/types.js';
import { inheritedCellText } from '../EntityEditor/functions/relationshipFieldHelpers.js';
import { renderFieldContent } from './metadataFieldContent.js';

type RichInheritedType = 'geolocation' | 'markdown' | 'media' | 'image';

type InheritedValueItem = {
  value?: unknown;
  label?: string;
};

type InheritedSourceRows = {
  value?: unknown;
  inheritedType?: string;
  inheritedValue?: InheritedValueItem[];
}[];

const isRichInheritedType = (type: string | undefined): type is RichInheritedType =>
  type === 'geolocation' || type === 'markdown' || type === 'media' || type === 'image';

const isLatLon = (value: unknown): value is { lat: number; lon: number; label?: string } => {
  if (!value || typeof value !== 'object') return false;
  if (!('lat' in value) || !('lon' in value)) return false;
  return typeof value.lat === 'number' && typeof value.lon === 'number';
};

const stringValues = (items: InheritedValueItem[]): Array<{ value: string }> =>
  items.flatMap(item =>
    typeof item.value === 'string' && item.value.length > 0 ? [{ value: item.value }] : []
  );

const toInheritedField = (
  inheritedType: RichInheritedType,
  inheritedValue: InheritedValueItem[]
): MetadataProperty | null => {
  const base = { _id: 'inherited', name: 'inherited', label: '' };
  switch (inheritedType) {
    case 'geolocation': {
      const values: GeolocationMetadataProperty['values'] = inheritedValue.flatMap(item => {
        if (!isLatLon(item.value)) return [];
        const label =
          (typeof item.label === 'string' && item.label) ||
          (typeof item.value.label === 'string' ? item.value.label : undefined);
        return [
          {
            value: { latitude: item.value.lat, longitude: item.value.lon },
            ...(label ? { label } : {}),
          },
        ];
      });
      if (!values.length) return null;
      const field: GeolocationMetadataProperty = { ...base, type: 'geolocation', values };
      return field;
    }
    case 'markdown': {
      const values = stringValues(inheritedValue);
      if (!values.length) return null;
      const field: SimpleMetadataProperty = { ...base, type: 'markdown', values };
      return field;
    }
    case 'media': {
      const values = stringValues(inheritedValue);
      if (!values.length) return null;
      const field: MediaMetadataProperty = { ...base, type: 'media', values };
      return field;
    }
    case 'image': {
      const values = stringValues(inheritedValue);
      if (!values.length) return null;
      const field: ImageMetadataProperty = {
        ...base,
        type: 'image',
        style: 'contain',
        values,
      };
      return field;
    }
    default:
      return null;
  }
};

const inheritedCellContent = (
  values: InheritedSourceRows | undefined,
  entityId: string
): ReactNode => {
  const row = values?.find(value => String(value.value ?? '') === entityId);
  if (!row?.inheritedValue?.length) return undefined;

  if (isRichInheritedType(row.inheritedType)) {
    const field = toInheritedField(row.inheritedType, row.inheritedValue);
    return field ? renderFieldContent(field) : undefined;
  }

  return inheritedCellText(values, entityId);
};

export { inheritedCellContent };
