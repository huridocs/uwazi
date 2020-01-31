/** @format */
/* eslint-disable max-statements, no-await-in-loop */

const stringifyValue = data => ({ ...data, value: data.value.toString() });
const stringifyId = data => ({ ...data, id: data.id.toString() });

const sanitizeThesaurus = thesaurus => {
  if (!thesaurus.values) {
    return undefined;
  }

  return thesaurus.values.map(value => {
    const sanitizedValue = stringifyId(value);
    if (sanitizedValue.values) {
      sanitizedValue.values = sanitizedValue.values.map(stringifyId);
    }
    return sanitizedValue;
  });
};

const determineMetadata = (entity, templatesById) => {
  let shouldProcess = false;
  const newMetadata = Object.keys(entity.metadata).reduce((metadata, property) => {
    const propertyData = templatesById[entity.template.toString()].properties.find(
      p => p.name === property
    );

    if (propertyData && (propertyData.type === 'select' || propertyData.type === 'multiselect')) {
      const values = entity.metadata[property];

      if (values) {
        shouldProcess = true;
        const newValues = values.reduce((results, data) => {
          const value = data.value.toString();
          let label = data.label;

          if (!Object.keys(data).includes('label')) {
            console.log('miising label', data);
          }

          return results.concat([{ ...data, value }]);
        }, []);
        return Object.assign({}, metadata, {
          [property]: newValues.length ? newValues : undefined,
        });
      }

      return metadata;
    }
    return metadata;
  }, {});

  return { shouldProcess, newMetadata };
};

export default {
  delta: 18,

  name: 'fix-malformed-metadata',

  description: 'Migration to sanitize values and labels of non-string values',

  async up(db) {
    process.stdout.write(`${this.name}...\r\n`);

    const getDocumentsFrom = async collection =>
      db
        .collection(collection)
        .find()
        .toArray();

    process.stdout.write(' -> Processing thesauri values...\r\n');

    const thesauri = await getDocumentsFrom('dictionaries');
    const thesauriById = thesauri.reduce(
      (results, t) => Object.assign({}, results, { [t._id.toString()]: t }),
      {}
    );

    thesauri.forEach(async thesaurus => {
      const values = sanitizeThesaurus(thesaurus);
      await db.collection('dictionaries').update({ _id: thesaurus._id }, { ...thesaurus, values });
    });

    process.stdout.write(' -> Processing entity values...\r\n');

    const cursor = db.collection('entities').find({});
    const templates = await db
      .collection('templates')
      .find()
      .toArray();
    const templatesById = templates.reduce(
      (results, t) => Object.assign({}, results, { [t._id.toString()]: t }),
      {}
    );

    let index = 1;

    while (await cursor.hasNext()) {
      const entity = await cursor.next();

      if (entity.metadata) {
        const { shouldProcess, newMetadata } = determineMetadata(
          entity,
          templatesById,
          thesauriById
        );

        if (shouldProcess) {
          await db
            .collection('entities')
            .update({ _id: entity._id }, { $set: { metadata: newMetadata } });
        }
      }

      process.stdout.write(`    -> processed: ${index} \r`);
      index += 1;
    }

    process.stdout.write('\r\n');
  },
};
