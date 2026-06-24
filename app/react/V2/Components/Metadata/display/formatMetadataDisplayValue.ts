import type { MetadataProperty } from '#V2/formatters/types.js';
import type { DisplayContext } from './displayContext.js';
import { formatMetadataTimestamp } from './formatMetadataTimestamp.js';
import { formatMetadataSelectValue } from './formatMetadataSelectValue.js';

const formatMetadataDisplayValue = (
  property: MetadataProperty,
  context: DisplayContext
): string => {
  switch (property.type) {
    case 'text':
    case 'generatedid':
    case 'numeric':
    case 'markdown':
      return property.values
        .map(value => String(value.value ?? ''))
        .filter(Boolean)
        .join(', ');
    case 'date':
    case 'multidate':
      return property.values
        .map(value =>
          typeof value.value === 'number' ? formatMetadataTimestamp(value.value, context) : ''
        )
        .filter(Boolean)
        .join(', ');
    case 'daterange':
    case 'multidaterange':
      return property.values
        .map(value => {
          const from =
            typeof value.value.from === 'number'
              ? formatMetadataTimestamp(value.value.from, context)
              : '';
          const to =
            typeof value.value.to === 'number'
              ? formatMetadataTimestamp(value.value.to, context)
              : '';
          if (from && to) return `${from} ~ ${to}`;
          return from || to;
        })
        .filter(Boolean)
        .join(', ');
    case 'select':
    case 'multiselect':
      return property.values.map(formatMetadataSelectValue).filter(Boolean).join(', ');
    case 'link':
      return property.values
        .map(value => value.label || value.value)
        .filter(Boolean)
        .join(', ');
    case 'relationship':
      if (property.mode === 'inherited') {
        return property.values
          .map(value => formatMetadataDisplayValue(value, context))
          .filter(Boolean)
          .join(', ');
      }
      return property.values
        .map(value => value.title)
        .filter(Boolean)
        .join(', ');
    case 'geolocation':
      return property.values
        .map(value => {
          const { latitude, longitude } = value.value;
          if (value.label) return value.label;
          if (typeof latitude === 'number' && typeof longitude === 'number') {
            return `${latitude}, ${longitude}`;
          }
          return '';
        })
        .filter(Boolean)
        .join(', ');
    case 'media':
    case 'image':
    case 'preview':
      return property.values
        .map(value => value.alt || value.value)
        .filter(Boolean)
        .join(', ');
    default:
      return '';
  }
};

export { formatMetadataDisplayValue };
