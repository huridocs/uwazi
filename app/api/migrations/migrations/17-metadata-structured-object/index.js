/**
 * @format
 */
/* eslint-disable no-await-in-loop */
/* eslint-disable max-statements */

import entities from 'api/entities';
import { QueryForEach } from 'api/odm';

export default {
  delta: 17,

  name: 'metadata-structured-object',

  description: 'Convert entities.metadata into structured object',

  expandMetadata(metadata) {
    const resolveProp = value => {
      if (value === null || value === undefined || value === '') {
        value = [];
      }
      if (!Array.isArray(value)) {
        value = [value];
      }
      return value
        .filter(v => v)
        .map(elem => (elem.hasOwnProperty('value') ? elem : { value: elem }));
    };
    return Object.keys(metadata).reduce(
      (meta, prop) => ({
        ...meta,
        [prop]: resolveProp(metadata[prop]),
      }),
      {}
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

    const total = await entities.count({});
    await QueryForEach(entities.get({}), 1000, async entity => {
      const template = templatesByKey[entity.template ? entity.template.toString() : null];
      index += 1;
      if (entity.metadata && template) {
        entity.metadata = await entities.denormalizeMetadata(
          this.expandMetadata(entity.metadata),
          entity,
          template,
          dictionariesByKey
        );
        await db
          .collection('entities')
          .update({ _id: entity._id }, { $set: { metadata: entity.metadata } });
      }
      if (index % 100 === 0) {
        process.stdout.write(`Converted entities.metadata -> ${index} / ${total}\r`);
      }
    });
    process.stdout.write(`Converted entities.metadata -> ${index}\r`);
    process.stdout.write('\r\n');
  },
};
