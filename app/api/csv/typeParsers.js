/** @format */

import url from 'url';

import geolocation from './typeParsers/geolocation.js';
import multiselect from './typeParsers/multiselect.js';
import select from './typeParsers/select.js';
import relationship from './typeParsers/relationship.js';

export default {
  geolocation,
  select,
  multiselect,
  relationship,

  async default(entityToImport, templateProperty) {
    return this.text(entityToImport, templateProperty);
  },

  async text(entityToImport, templateProperty) {
    return [{ value: entityToImport[templateProperty.name] }];
  },

  async date(entityToImport, templateProperty) {
    return [{ value: new Date(`${entityToImport[templateProperty.name]} UTC`).getTime() / 1000 }];
  },

  async link(entityToImport, templateProperty) {
    let [label, linkUrl] = entityToImport[templateProperty.name].split('|');

    if (!linkUrl) {
      linkUrl = entityToImport[templateProperty.name];
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
