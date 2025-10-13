import moment from 'moment';
import { PropertyValue, ProcessingContext } from './types';
import { BasePropertyProcessor } from './BasePropertyProcessor';

export class DatePropertyProcessor extends BasePropertyProcessor {
  readonly name = 'DatePropertyProcessor';
  readonly propertyTypes = ['date', 'multidate', 'daterange', 'multidaterange'];

  protected formatProperty(property: any, context: ProcessingContext): PropertyValue[] {
    if (this.shouldSkipFormatting(context, 'date')) {
      return this.createRawValues(property);
    }

    const dateFormat = this.getCustomFormat(context, 'date', context.dateFormat || '');
    const dateFormatting = {
      format: dateFormat,
      locale: context.language,
    };

    return this.formatDateProperty(property, dateFormatting);
  }

  protected createRawValues(property: any): PropertyValue[] {
    if (property.type === 'date' || property.type === 'multidate') {
      return this.createRawSingleValues(property);
    }

    if (property.type === 'daterange' || property.type === 'multidaterange') {
      return this.createRawRangeValues(property);
    }

    return super.createRawValues(property);
  }

  private createRawSingleValues(property: any): PropertyValue[] {
    const values = Array.isArray(property.value) ? property.value : [property.value];
    return values.map((propertyValue: PropertyValue) => {
      if (!propertyValue) {
        return {
          value: propertyValue,
          label: '',
          displayValue: '',
        };
      }
      return {
        ...propertyValue,
        value: propertyValue.value,
        label: propertyValue.value?.toString() || '',
        displayValue: propertyValue.value?.toString() || '',
      };
    });
  }

  private createRawRangeValues(property: any): PropertyValue[] {
    const ranges = Array.isArray(property.value) ? property.value : [property.value];
    return ranges.map((propertyValue: PropertyValue) => {
      const { from, to } = propertyValue.value;
      if (!from && !to) {
        return {
          ...propertyValue,
          label: '',
          displayValue: '',
        };
      }
      const fromStr = from ? from.toString() : '';
      const toStr = to ? to.toString() : '';
      const rangeStr = fromStr && toStr ? `${fromStr} ~ ${toStr}` : fromStr || toStr;
      return {
        ...propertyValue,
        label: rangeStr,
        displayValue: rangeStr,
      };
    });
  }

  protected shouldSkipFormatting(context: ProcessingContext, formatKey?: string): boolean {
    if (formatKey === 'date') {
      return !context.dateFormat;
    }
    return false;
  }

  protected getCustomFormat(
    context: ProcessingContext,
    formatKey: string,
    defaultFormat: string
  ): string {
    if (formatKey === 'date') {
      return context.dateFormat || defaultFormat;
    }
    return defaultFormat;
  }

  private formatDateProperty(property: any, dateFormatting: any): PropertyValue[] {
    if (property.type === 'date' || property.type === 'multidate') {
      return this.formatSingleDate(property, dateFormatting);
    }

    if (property.type === 'daterange' || property.type === 'multidaterange') {
      return this.formatDateRange(property, dateFormatting);
    }

    return [
      {
        value: property.value,
        label: property.value?.toString() || '',
        displayValue: property.value?.toString() || '',
      },
    ];
  }

  private formatSingleDate(property: any, dateFormatting: any): PropertyValue[] {
    const { format, timezone, includeTime, relativeTime, locale } = dateFormatting;
    const values = Array.isArray(property.value) ? property.value : [property.value];

    return values.map((propertyValue: PropertyValue) => {
      if (!propertyValue) {
        return {
          value: propertyValue,
          label: '',
          displayValue: '',
          formattedValue: '',
          localizedValue: '',
        };
      }

      let momentInstance = moment.utc(propertyValue.value, 'X');
      momentInstance = momentInstance.locale(locale);

      if (timezone && typeof momentInstance.tz === 'function') {
        momentInstance = momentInstance.tz(timezone);
      }

      const rawValue = propertyValue.value;

      let formattedValue = '';
      if (relativeTime) {
        formattedValue = momentInstance.fromNow();
      } else {
        const baseFormat = includeTime ? `${format} HH:mm:ss` : format;
        formattedValue = momentInstance.format(baseFormat);
      }

      const localizedValue = momentInstance.format('ll' + (includeTime ? ' HH:mm' : ''));

      return {
        ...propertyValue,
        value: rawValue,
        formattedValue,
        localizedValue,
        displayValue: localizedValue,
        label: formattedValue,
      };
    });
  }

  private formatDateRange(property: any, dateFormatting: string): PropertyValue[] {
    const ranges = Array.isArray(property.value) ? property.value : [property.value];

    return ranges.map((propertyValue: PropertyValue) => {
      const { from, to } = propertyValue.value;

      if (!from && !to) {
        return {
          ...propertyValue,
          formattedValue: '',
          localizedValue: '',
          displayValue: '',
        };
      }

      if (!from) {
        const toFormatted = this.formatSingleDate({ value: [{ value: to }] }, dateFormatting);
        return {
          ...propertyValue,
          formattedValue: toFormatted[0]?.formattedValue || '',
          localizedValue: toFormatted[0]?.localizedValue || '',
          displayValue: toFormatted[0]?.displayValue || '',
        };
      }

      if (!to) {
        const fromFormatted = this.formatSingleDate({ value: [{ value: from }] }, dateFormatting);
        return {
          ...propertyValue,
          formattedValue: fromFormatted[0]?.formattedValue || '',
          localizedValue: fromFormatted[0]?.localizedValue || '',
          displayValue: fromFormatted[0]?.displayValue || '',
        };
      }

      const fromFormatted = this.formatSingleDate({ value: [{ value: from }] }, dateFormatting);
      const toFormatted = this.formatSingleDate({ value: [{ value: to }] }, dateFormatting);

      return {
        ...propertyValue,
        formattedValue: {
          from: fromFormatted[0]?.formattedValue || '',
          to: toFormatted[0]?.formattedValue || '',
        },
        localizedValue: {
          from: fromFormatted[0]?.localizedValue || '',
          to: toFormatted[0]?.localizedValue || '',
        },
        displayValue: {
          from: fromFormatted[0]?.localizedValue || '',
          to: toFormatted[0]?.localizedValue || '',
        },
      };
    });
  }
}
