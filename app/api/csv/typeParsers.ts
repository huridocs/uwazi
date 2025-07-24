import url from 'url';

import { RawEntity } from 'api/csv/entityRow';
import { MetadataObjectSchema, PropertySchema } from 'shared/types/commonTypes';
import { ensure } from 'shared/tsUtils';
import { sanitizeMetadataValue, SanitizationWarning } from './sanitizationUtils';

export interface ParserResult {
  data: MetadataObjectSchema[];
  warnings: SanitizationWarning[];
}

import moment from 'moment';
import generatedid from './typeParsers/generatedid';
import geolocation from './typeParsers/geolocation';
import multiselect from './typeParsers/multiselect';
import select from './typeParsers/select';
import relationship from './typeParsers/relationship';
import { csvConstants } from './csvDefinitions';

const defaultParser = async (
  entityToImport: RawEntity,
  property: PropertySchema
): Promise<ParserResult> => {
  const rawValue = entityToImport.propertiesFromColumns[ensure<string>(property.name)];
  const sanitizationResult = sanitizeMetadataValue(
    rawValue,
    ensure<string>(property.name),
    property.type
  );

  if (sanitizationResult.value === '') {
    return {
      data: [],
      warnings: sanitizationResult.warnings,
    };
  }

  return {
    data: [{ value: sanitizationResult.value }],
    warnings: sanitizationResult.warnings,
  };
};

const parseDateValue = (dateValue: string, dateFormat: string) => {
  const allowedFormats = [
    dateFormat.toUpperCase(),
    'LL',
    'YYYY MM DD',
    'YYYY/MM/DD',
    'YYYY-MM-DD',
    'YYYY',
  ];

  return moment.utc(dateValue, allowedFormats).unix();
};

const parseDate = (dateValue: string, dateFormat: string) => ({
  value: parseDateValue(dateValue, dateFormat),
});

const parseDateRange = (rangeValue: string, dateFormat: string) => {
  const [from, to] = rangeValue.split(csvConstants.dateRangeImportSeparator);

  return {
    value: {
      from: from !== '' ? parseDateValue(from, dateFormat) : null,
      to: to !== '' ? parseDateValue(to, dateFormat) : null,
    },
  };
};

const parseMultiValue = (values: string) =>
  values.split(csvConstants.multiValueSeparator).filter(value => value !== '');

export default {
  nested: defaultParser,
  preview: defaultParser,
  image: defaultParser,
  media: defaultParser,
  markdown: defaultParser,
  text: defaultParser,
  generatedid,
  geolocation,
  select,
  multiselect,
  relationship,
  newRelationship: defaultParser,

  async numeric(entityToImport: RawEntity, property: PropertySchema): Promise<ParserResult> {
    const rawValue = entityToImport.propertiesFromColumns[ensure<string>(property.name)];
    const sanitizationResult = sanitizeMetadataValue(
      rawValue,
      ensure<string>(property.name),
      property.type
    );

    if (sanitizationResult.value === '') {
      return {
        data: [],
        warnings: sanitizationResult.warnings,
      };
    }

    const value = sanitizationResult.value;
    const data = Number.isNaN(Number(value)) ? [{ value }] : [{ value: Number(value) }];
    return {
      data,
      warnings: sanitizationResult.warnings,
    };
  },

  async date(
    entityToImport: RawEntity,
    property: PropertySchema,
    dateFormat: string
  ): Promise<ParserResult> {
    const rawValue = entityToImport.propertiesFromColumns[ensure<string>(property.name)];
    const sanitizationResult = sanitizeMetadataValue(
      rawValue,
      ensure<string>(property.name),
      property.type
    );

    if (sanitizationResult.value === '') {
      return {
        data: [],
        warnings: sanitizationResult.warnings,
      };
    }

    const date = sanitizationResult.value;
    return {
      data: [parseDate(date, dateFormat)],
      warnings: sanitizationResult.warnings,
    };
  },

  async multidate(
    entityToImport: RawEntity,
    property: PropertySchema,
    dateFormat: string
  ): Promise<ParserResult> {
    const rawValue = entityToImport.propertiesFromColumns[ensure<string>(property.name)];
    const sanitizationResult = sanitizeMetadataValue(
      rawValue,
      ensure<string>(property.name),
      property.type
    );

    if (sanitizationResult.value === '') {
      return {
        data: [],
        warnings: sanitizationResult.warnings,
      };
    }

    const dates = parseMultiValue(sanitizationResult.value);
    return {
      data: dates.map(date => parseDate(date, dateFormat)),
      warnings: sanitizationResult.warnings,
    };
  },

  async daterange(
    entityToImport: RawEntity,
    property: PropertySchema,
    dateFormat: string
  ): Promise<ParserResult> {
    const rawValue = entityToImport.propertiesFromColumns[ensure<string>(property.name)];
    const sanitizationResult = sanitizeMetadataValue(
      rawValue,
      ensure<string>(property.name),
      property.type
    );

    if (sanitizationResult.value === '') {
      return {
        data: [],
        warnings: sanitizationResult.warnings,
      };
    }

    const range = sanitizationResult.value;
    return {
      data: [parseDateRange(range, dateFormat)],
      warnings: sanitizationResult.warnings,
    };
  },

  async multidaterange(
    entityToImport: RawEntity,
    property: PropertySchema,
    dateFormat: string
  ): Promise<ParserResult> {
    const rawValue = entityToImport.propertiesFromColumns[ensure<string>(property.name)];
    const sanitizationResult = sanitizeMetadataValue(
      rawValue,
      ensure<string>(property.name),
      property.type
    );

    if (sanitizationResult.value === '') {
      return {
        data: [],
        warnings: sanitizationResult.warnings,
      };
    }

    const ranges = parseMultiValue(sanitizationResult.value);
    return {
      data: ranges.map(range => parseDateRange(range, dateFormat)),
      warnings: sanitizationResult.warnings,
    };
  },

  async link(entityToImport: RawEntity, property: PropertySchema): Promise<ParserResult | null> {
    const rawValue = entityToImport.propertiesFromColumns[ensure<string>(property.name)];
    const sanitizationResult = sanitizeMetadataValue(
      rawValue,
      ensure<string>(property.name),
      property.type
    );

    if (sanitizationResult.value === '') {
      return {
        data: [],
        warnings: sanitizationResult.warnings,
      };
    }

    let [label, linkUrl] = sanitizationResult.value.split(csvConstants.multiValueSeparator);

    if (!linkUrl) {
      linkUrl = sanitizationResult.value;
      label = linkUrl;
    }

    if (!url.parse(linkUrl).host) {
      return null;
    }

    return {
      data: [
        {
          value: {
            label,
            url: linkUrl,
          },
        },
      ],
      warnings: sanitizationResult.warnings,
    };
  },
};
