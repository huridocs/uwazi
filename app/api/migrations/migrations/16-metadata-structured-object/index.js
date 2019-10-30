/**
 * @format
 */
/* eslint-disable no-await-in-loop */

import entities from 'api/entities';

export default {
  delta: 16,

  name: 'metadata-structured-object',

  description: 'Convert entities.metadata into structured object',

  async expandMetadata(template, dictionariesByKey, entity) {
    const resolveProp = async (key, value) => {
      if (value === null || value === undefined) {
        value = [];
      }
      if (!Array.isArray(value)) {
        value = [value];
      }
      const prop = template.properties.find(p => p.name === key && p.content);
      return Promise.all(
        value.map(async elem => {
          // Preserve elem if it already has value, but recompute label.
          const mo = elem.value ? elem : { value: elem };
          if (!prop) {
            return mo;
          }
          if (prop.content && ['select', 'multiselect'].includes(prop.type)) {
            if (dictionariesByKey[prop.content]) {
              const flattenValues = dictionariesByKey[prop.content].values.reduce(
                (result, value) =>
                  value.values ? result.concat(value.values) : result.concat([value]),
                []
              );
              const dictElem = flattenValues.find(v => v.id === elem);
              if (dictElem) {
                mo.label = dictElem.label;
              }
            }
          } else if (prop.type === 'relationship') {
            const partner = await entities.get({ sharedId: mo.value, language: entity.language });
            if (partner && partner[0] && partner[0].title) {
              mo.label = partner[0].title;
            }
          }
          return mo;
        })
      );
    };
    return Object.keys(entity.metadata).reduce(
      async (meta, prop) => ({
        ...(await meta),
        [prop]: await resolveProp(prop, entity.metadata[prop]),
      }),
      Promise.resolve({})
    );
  },

  async up(db) {
    process.stdout.write(`${this.name}...\r\n`);
    const templates = await db
      .collection('templates')
      .find()
      .toArray();
    const templatesByKey = templates.reduce(
      (memo, t) => Object.assign({}, memo, { [t._id.toString()]: t }),
      {}
    );

    const dictionaries = await db
      .collection('dictionaries')
      .find()
      .toArray();
    const dictionariesByKey = dictionaries.reduce(
      (memo, t) => Object.assign({}, memo, { [t._id.toString()]: t }),
      {}
    );

    let index = 0;

    const cursor = db.collection('entities').find();
    while (await cursor.hasNext()) {
      const entity = await cursor.next();
      const template = templatesByKey[entity.template.toString()];
      if (entity.metadata && template) {
        const newMetadata = await this.expandMetadata(template, dictionariesByKey, entity);
        await db
          .collection('entities')
          .update({ _id: entity._id }, { $set: { metadata: newMetadata } });
        index += 1;
      }
    }
    process.stdout.write(`Converted entities.metadata -> ${index}\r`);
    process.stdout.write('\r\n');
  },
};
