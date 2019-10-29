/**
 * @format
 */
/* eslint-disable no-await-in-loop */

import entities from 'api/entities';

export default {
  delta: 16,

  name: 'metadata-structured-object',

  description: 'Convert entities.metadata into structured object',

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
        const newMetadata = await entities.expandMetadata(template, dictionariesByKey, entity);
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
