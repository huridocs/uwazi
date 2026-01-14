import { DateTime } from 'luxon';
import {
  DateMetadataProperty,
  DatePropertyTypes,
  DateRangeMetadataProperty,
} from 'app/V2/domain/entities/types';
import { DateRangeSchema, MetadataObjectSchema } from 'shared/types/commonTypes';
import { ProcessingContext, AdapterMetadataProperty } from './types';
import { BasePropertyProcessor } from './BasePropertyProcessor';

export class DatePropertyProcessor extends BasePropertyProcessor {
  readonly name = 'DatePropertyProcessor';

  readonly propertyTypes: DatePropertyTypes[] = [
    'date',
    'multidate',
    'daterange',
    'multidaterange',
  ];

  protected formatProperty(
    property: AdapterMetadataProperty,
    context: ProcessingContext
  ): DateMetadataProperty['values'] | DateRangeMetadataProperty['values'] {
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

  private formatSingleDate(
    property: AdapterMetadataProperty,
    context: ProcessingContext
  ): DateMetadataProperty['values'] {
    const values = Array.isArray(property.value) ? property.value : [property.value];

    return values.flatMap(value => {
      // Handle null/undefined values
      if (value === null || value === undefined) {
        return [];
      }

      let timestamp: number = 0;

      if (typeof value.value === 'number') {
        // Check if timestamp is in milliseconds (13+ digits) or seconds (10 digits)
        if (value.value > 9999999999) {
          timestamp = Math.floor(value.value / 1000);
        } else {
          timestamp = value.value;
        }
      }

      const formattedValue = this.formatDate(timestamp, context);
      return [{ value: timestamp, label: formattedValue }];
    });
  }

  private formatDateRange(
    property: AdapterMetadataProperty,
    context: ProcessingContext
  ): DateRangeMetadataProperty['values'] {
    const ranges = Array.isArray(property.value) ? property.value : [property.value];

    return ranges.flatMap(({ value }: MetadataObjectSchema) => {
      if (value === null || value === undefined) {
        return [];
      }

      const { from, to } = value as DateRangeSchema;

      if (!from && !to) {
        return [];
      }

      const formattedFrom = from ? this.formatDate(from, context) : '';
      const formattedTo = to ? this.formatDate(to, context) : '';
      return [
        {
          value: { from: from || 0, to: to || 0 },
          label: { from: formattedFrom, to: formattedTo },
        },
      ];
    });
  }
}
