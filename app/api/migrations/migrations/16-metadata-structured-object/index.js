/**
 * @format
 */
/* eslint-disable no-await-in-loop */

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
      if (entity.metadata) {
        const newMetadata = Object.keys(entity.metadata).reduce((metadata, property) => {
          const propertyData = templatesByKey[entity.template.toString()].properties.find(
            p => p.name === property && p.content
          );
          let value = entity.metadata[property];
          if (!Array.isArray(value)) {
            value = [value];
          }
          const newValue = value.map(elem => {
            const mo = { value: elem };
            if (propertyData && propertyData.content) {
              if (dictionariesByKey[propertyData.content]) {
                const dictElem = dictionariesByKey[propertyData.content.toString()].values.find(
                  v => v.id === elem
                );
                if (dictElem) {
                  mo.label = dictElem.label;
                }
              }
            }
            return mo;
          });
          return Object.assign({}, metadata, { [property]: newValue });
        }, {});

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
