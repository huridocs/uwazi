import url from 'url';

import { rawEntity } from 'api/csv/entityRow.js';
import { PropertySchema, MetadataObjectSchema } from 'shared/types/commonTypes';
import { ensure } from 'shared/tsUtils';

import geolocation from './typeParsers/geolocation';
import multiselect from './typeParsers/multiselect';
import select from './typeParsers/select';
import relationship from './typeParsers/relationship';

export default {
  geolocation,
  select,
  multiselect,
  relationship,

  async default(
    entityToImport: rawEntity,
    property: PropertySchema
  ): Promise<MetadataObjectSchema[]> {
    return this.text(entityToImport, property);
  },

  async text(entityToImport: rawEntity, property: PropertySchema): Promise<MetadataObjectSchema[]> {
    return [{ value: entityToImport[ensure<string>(property.name)] }];
  },

  async numeric(
    entityToImport: rawEntity,
    property: PropertySchema
  ): Promise<MetadataObjectSchema[]> {
    const value = entityToImport[ensure<string>(property.name)];
    return Number.isNaN(Number(value)) ? [{ value }] : [{ value: Number(value) }];
  },

  async date(entityToImport: rawEntity, property: PropertySchema): Promise<MetadataObjectSchema[]> {
    return [
      { value: new Date(`${entityToImport[ensure<string>(property.name)]} UTC`).getTime() / 1000 },
    ];
  },

  async link(
    entityToImport: rawEntity,
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
