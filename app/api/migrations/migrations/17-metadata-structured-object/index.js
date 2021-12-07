/* eslint-disable no-await-in-loop, max-statements */

async function collectionForEach(collection, batchSize, fn) {
  const totalNumber = await collection.countDocuments({});
  let offset = 0;
  while (offset < totalNumber) {
    const batch = await collection.find({}).skip(offset).limit(batchSize).toArray();
    if (!batch || !batch.length) {
      break;
    }
    await Promise.all(batch.map(fn));
    offset += batch.length;
  }
}

function getContext(translation, contextId = '') {
  return (
    translation.contexts.find(ctx => ctx.id.toString() === contextId.toString()) || { values: {} }
  );
}

function translate(context, key, text) {
  return context.values[key] || text;
}

async function denormalizeMetadata(db, entity, template, dictionariesByKey) {
  if (!entity.metadata) {
    return entity.metadata;
  }

  const translation = (
    await db.collection('translations').find({ locale: entity.language }).toArray()
  )[0];

  const resolveProp = async (key, value) => {
    if (!Array.isArray(value)) {
      throw new Error('denormalizeMetadata received non-array prop!');
    }
    const prop = template.properties.find(p => p.name === key);
    return Promise.all(
      value.map(async _elem => {
        const elem = { ..._elem };
        if (!elem.hasOwnProperty('value')) {
          throw new Error('denormalizeMetadata received non-value prop!');
        }
        if (!prop) {
          return elem;
        }
        if (prop.content && ['select', 'multiselect'].includes(prop.type)) {
          const dict = dictionariesByKey
            ? dictionariesByKey[prop.content]
            : await db.collection('dictionaries').findById(prop.content);
          if (dict) {
            const context = getContext(translation, prop.content);
            const flattenValues = dict.values.reduce(
              (result, dv) => (dv.values ? result.concat(dv.values) : result.concat([dv])),
              []
            );
            const dictElem = flattenValues.find(v => v.id === elem.value);

            if (dictElem && dictElem.label) {
              elem.label = translate(context, dictElem.label, dictElem.label);
            }
          }
        }

        if (prop.type === 'relationship') {
          const partner = await db
            .collection('entities')
            .find({ sharedId: elem.value, language: entity.language })
            .toArray();

          if (partner && partner[0] && partner[0].title) {
            elem.label = partner[0].title;
            elem.icon = partner[0].icon;
            elem.type = partner[0].file ? 'document' : 'entity';
          }
        }
        return elem;
      })
    );
  };
  if (!template) {
    template = await db.collection('templates').findById(entity.template);
    if (!template) {
      return entity.metadata;
    }
  }
  return Object.keys(entity.metadata).reduce(
    async (meta, prop) => ({
      ...(await meta),
      [prop]: await resolveProp(prop, entity.metadata[prop]),
    }),
    Promise.resolve({})
  );
}

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
    const templates = await db.collection('templates').find().toArray();

    const templatesByKey = templates.reduce((memo, t) => ({ ...memo, [t._id.toString()]: t }), {});

    const dictionaries = await db.collection('dictionaries').find().toArray();

    const dictionariesByKey = dictionaries.reduce(
      (memo, d) => ({ ...memo, [d._id.toString()]: d }),
      {}
    );

    let index = 0;

    const total = await db.collection('entities').countDocuments({});
    await collectionForEach(db.collection('entities'), 1000, async entity => {
      const template = templatesByKey[entity.template ? entity.template.toString() : null];
      index += 1;
      if (entity.metadata && template) {
        entity.metadata = this.expandMetadata(entity.metadata);
        entity.metadata = await denormalizeMetadata(db, entity, template, dictionariesByKey);
        await db
          .collection('entities')
          .updateOne({ _id: entity._id }, { $set: { metadata: entity.metadata } });
      }
      if (index % 100 === 0) {
        process.stdout.write(`Converted entities.metadata -> ${index} / ${total}\r`);
      }
    });
    process.stdout.write(`Converted entities.metadata -> ${index}\r`);
    process.stdout.write('\r\n');
  },
};
