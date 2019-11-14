/**
 * @format
 */
/* eslint-disable no-await-in-loop */
/* eslint-disable max-statements */

import entities from 'api/entities';

export default {
  delta: 16,

  name: 'metadata-structured-object',

  description: 'Convert entities.metadata into structured object',

  expandMetadata(metadata) {
    const resolveProp = value => {
      if (value === null || value === undefined) {
        value = [];
      }
      if (!Array.isArray(value)) {
        value = [value];
      }
      return value.map(elem => (elem.hasOwnProperty('value') ? elem : { value: elem }));
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

    for (let attempt = 0; attempt < 10; attempt += 1) {
      try {
        let index = 0;

        const cursor = db
          .collection('entities')
          .find({}, null, { noCursorTimeout: true, batchSize: 100, lean: true });
        while (await cursor.hasNext()) {
          const entity = await cursor.next();
          const template = templatesByKey[entity.template ? entity.template.toString() : null];
          if (entity.metadata && template) {
            entity.metadata = this.expandMetadata(entity.metadata);
            entity.metadata = await entities.denormalizeMetadata(
              entity,
              template,
              dictionariesByKey
            );
            await db
              .collection('entities')
              .update({ _id: entity._id }, { $set: { metadata: entity.metadata } });
            index += 1;
          }
        }
        process.stdout.write(`Converted entities.metadata -> ${index}\r`);
        process.stdout.write('\r\n');
        break;
      } catch (err) {
        process.stdout.write(
          `Encountered error, but trying several times to increase the chance of success!\r\n${err}.\r\n`
        );
      }
    }
  },
};
