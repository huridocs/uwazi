/* eslint-disable max-statements, no-await-in-loop */

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

const findLabel = (value, propertyData, thesauriById, translation) => {
  const thesauri = thesauriById[propertyData.content.toString()];
  const flattenedValues = thesauri.values.reduce(
    (result, thesauriValue) =>
      thesauriValue.values ? result.concat(thesauriValue.values) : result.concat([thesauriValue]),
    []
  );

  const thesaurusElement = flattenedValues.find(v => v.id === value.toString());
  if (thesaurusElement) {
    const context = translation.contexts.find(
      ctx => ctx.id.toString() === propertyData.content.toString()
    );

    if (context) {
      const translationElement = context.values.find(v => v.key === thesaurusElement.label);
      return translationElement ? translationElement.value : thesaurusElement.label;
    }

    return thesaurusElement.label;
  }
  throw new Error('missingThesaurusElement');
};

const determineMetadata = (entity, templatesById, thesauriById, translation) => {
  let shouldProcess = false;

  const newMetadata = Object.keys(entity.metadata).reduce((metadata, property) => {
    const propertyData = templatesById[entity.template.toString()].properties.find(
      p => p.name === property
    );

    if (propertyData && (propertyData.type === 'select' || propertyData.type === 'multiselect')) {
      const entries = entity.metadata[property];

      if (entries) {
        shouldProcess = true;

        const newEntries = entries.reduce((results, data) => {
          let { label, value } = data;
          value = value.toString();
          try {
            label = findLabel(value, propertyData, thesauriById, translation);
          } catch (err) {
            if (err.message === 'missingThesaurusElement') {
              return results;
            }
            throw err;
          }

          return results.concat([{ ...data, value, label }]);
        }, []);

        return { ...metadata, [property]: newEntries.length ? newEntries : [] };
      }

      return { ...metadata, [property]: [] };
    }

    return { ...metadata, [property]: entity.metadata[property] };
  }, {});

  return { shouldProcess, newMetadata };
};

export default {
  delta: 18,

  name: 'fix-malformed-metadata',

  description: 'Migration to sanitize values and labels of non-string values',

  async up(db) {
    process.stdout.write(`${this.name}...\r\n`);

    const getDocumentsFrom = async collection => db.collection(collection).find().toArray();

    process.stdout.write(' -> Processing thesauri values...\r\n');

    const thesauri = await getDocumentsFrom('dictionaries');

    thesauri.forEach(async thesaurus => {
      const values = sanitizeThesaurus(thesaurus);
      await db
        .collection('dictionaries')
        .replaceOne({ _id: thesaurus._id }, { ...thesaurus, values });
    });

    const upadtedThesauri = await getDocumentsFrom('dictionaries');
    const thesauriById = upadtedThesauri.reduce(
      (results, t) => ({ ...results, [t._id.toString()]: t }),
      {}
    );

    process.stdout.write(' -> Processing entity values...\r\n');

    const cursor = db.collection('entities').find({});
    const templates = await getDocumentsFrom('templates');
    const templatesById = templates.reduce(
      (results, t) => ({ ...results, [t._id.toString()]: t }),
      {}
    );

    let index = 1;

    while (await cursor.hasNext()) {
      const entity = await cursor.next();

      const [translation] = await db
        .collection('translations')
        .find({ locale: entity.language })
        .toArray();

      if (entity.metadata) {
        const { shouldProcess, newMetadata } = determineMetadata(
          entity,
          templatesById,
          thesauriById,
          translation
        );

        if (shouldProcess) {
          await db
            .collection('entities')
            .updateOne({ _id: entity._id }, { $set: { metadata: newMetadata } });
        }
      }

      process.stdout.write(`    -> processed: ${index} \r`);
      index += 1;
    }

    process.stdout.write('\r\n');
  },
};
