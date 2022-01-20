import url from 'url';

import { RawEntity } from 'api/csv/entityRow';
import { MetadataObjectSchema, PropertySchema } from 'shared/types/commonTypes';
import { ensure } from 'shared/tsUtils';

import moment from 'moment';
import generatedid from './typeParsers/generatedid';
import geolocation from './typeParsers/geolocation';
import multiselect from './typeParsers/multiselect';
import select from './typeParsers/select';
import relationship from './typeParsers/relationship';

const defaultParser = async (
  entityToImport: RawEntity,
  property: PropertySchema
): Promise<MetadataObjectSchema[]> => [{ value: entityToImport[ensure<string>(property.name)] }];

export default {
  multidaterange: defaultParser,
  daterange: defaultParser,
  multidate: defaultParser,
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

  async numeric(
    entityToImport: RawEntity,
    property: PropertySchema
  ): Promise<MetadataObjectSchema[]> {
    const value = entityToImport[ensure<string>(property.name)];
    return Number.isNaN(Number(value)) ? [{ value }] : [{ value: Number(value) }];
  },

  async date(
    entityToImport: RawEntity,
    property: PropertySchema,
    dateFormat: string
  ): Promise<MetadataObjectSchema[]> {
    const allowedFormats = [
      dateFormat.toUpperCase(),
      'LL',
      'YYYY MM DD',
      'YYYY/MM/DD',
      'YYYY-MM-DD',
      'YYYY',
    ];
    const date = entityToImport[ensure<string>(property.name)];

    return [{ value: moment.utc(date, allowedFormats).unix() }];
  },

  async link(
    entityToImport: RawEntity,
    property: PropertySchema
  ): Promise<MetadataObjectSchema[] | null> {
    let [label, linkUrl] = entityToImport[ensure<string>(property.name)].split('|');

    if (!linkUrl) {
      linkUrl = entityToImport[ensure<string>(property.name)];
      label = linkUrl;
    }

    if (!url.parse(linkUrl).host) {
      return null;
    }

    return [
      {
        value: {
          label,
          url: linkUrl,
        },
      },
    ];
  },
};
