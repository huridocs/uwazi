import { DateTime } from 'luxon';
import { DateMetadataProperty, DatePropertyTypes, DateRangeMetadataProperty, MetadataProperty } from 'app/V2/domain/entities/types';
import { PropertyValueSchema } from 'shared/types/commonTypes';
import { ProcessingContext, AdapterMetadataProperty, PropertyTypeProcessor } from './types';
import { BasePropertyProcessor } from './BasePropertyProcessor';

export class DatePropertyProcessor extends BasePropertyProcessor {
  readonly name = 'DatePropertyProcessor';

  readonly propertyTypes: DatePropertyTypes[] = [
    'date',
    'multidate',
    'daterange',
    'multidaterange',
  ];

  protected formatProperty(property: AdapterMetadataProperty, context: ProcessingContext): MetadataProperty["values"] {
    if (property.type === 'daterange' || property.type === 'multidaterange') {
      return this.formatDateRange(property, context);
    }
    return this.formatSingleDate(property, context);
  }

  private formatDate(timestamp: number, context: ProcessingContext) {
    if (context.formatDates) {
      let luxonInstance = DateTime.fromSeconds(timestamp, { zone: 'utc' });
      if (context.language) {
        luxonInstance = luxonInstance.setLocale(context.language);
      }
      if (context.timezone) {
        luxonInstance = luxonInstance.setZone(context.timezone);
      }

      if (!luxonInstance.isValid) {
        return '';
      }

      if (context.dateFormat) {
        return luxonInstance.toFormat(context.dateFormat);
      }
      return luxonInstance.toLocaleString(DateTime.DATE_MED);
    }
    return '';
  }

  private formatSingleDate(property: AdapterMetadataProperty, context: ProcessingContext): MetadataProperty["values"] {
    const values = Array.isArray(property.value) ? property.value : [property.value];

    return values.flatMap((value: PropertyValueSchema) => {
      let timestamp: number = 0;

      if (typeof value === 'number') {
        timestamp = value;
      }

      const formattedValue = this.formatDate(timestamp, context);
      return [{ value: value, label: formattedValue }];
    });
  }

  private formatDateRange(property: AdapterMetadataProperty, context: ProcessingContext): DateRangeMetadataProperty["values"] {
    const ranges = Array.isArray(property.value) ? property.value : [property.value];

    return ranges.flatMap((value: PropertyValueSchema) => {
      const rangeValue = value && typeof value === 'object' && 'from' in value && 'to' in value ? value as { from: number | null; to: number | null } : { from: null, to: null };
      const { from, to } = rangeValue;

      if (!from && !to) {
        return [];
      }

      const formattedFrom = from ? this.formatDate(from, context) : '';
      const formattedTo = to ? this.formatDate(to, context) : '';
      return [{
        value: { from: from || 0, to: to || 0 },
        label: { from: formattedFrom, to: formattedTo },
      }];
    });
  }
}
