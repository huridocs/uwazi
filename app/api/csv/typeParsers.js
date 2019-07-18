import entities from 'api/entities';
import url from 'url';

import { unique, emptyString } from 'api/utils/filters';

import geolocation from './typeParsers/geolocation.js';
import multiselect from './typeParsers/multiselect.js';
import select from './typeParsers/select.js';

const escapeRegExpCharacters = string => string.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&');

export default {
  geolocation,

  select,

  multiselect,

  async default(entityToImport, templateProperty) {
    return this.text(entityToImport, templateProperty);
  },

  async text(entityToImport, templateProperty) {
    return entityToImport[templateProperty.name];
  },

  async date(entityToImport, templateProperty) {
    return new Date(`${entityToImport[templateProperty.name]} UTC`).getTime() / 1000;
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

    return {
      label,
      url: linkUrl,
    };
  },

  async relationship(entityToImport, templateProperty) {
    const values = entityToImport[templateProperty.name].split('|')
    .map(v => v.trim())
    .filter(emptyString)
    .filter(unique);

    const current = await entities.get({ title: { $in: values.map(v => new RegExp(`\\s?${escapeRegExpCharacters(v)}\\s?`, 'i')) } });
    const newValues = values.filter(v => !current.map(c => c.title.trim()).includes(v));

    await newValues.reduce(
      async (promise, title) => {
        await promise;
        return entities.save({
          title,
          template: templateProperty.content,
        },
          {
            language: 'en',
            user: {}
          }
        );
      },
      Promise.resolve([])
    );

    const toRelateEntities = await entities.get({ title: { $in: values.map(v => new RegExp(`\\s?${escapeRegExpCharacters(v)}\\s?`, 'i')) } });
    return toRelateEntities.map(e => e.sharedId).filter((id, index, ids) => ids.indexOf(id) === index);
  },
};
