/* eslint-disable no-await-in-loop */

const applyTranslation = (property, translation) => {
  const [translatedProperty] = translation.values.filter(
    value => value.key === property[0].label && value.value !== property[0].label
  );

  return [
    {
      value: property[0].value,
      label: translatedProperty ? translatedProperty.value : property[0].label,
    },
  ];
};

const prepareTranslation = (entity, templates, translations) => (entityMetadata, propertyName) => {
  const property = templates[entity.template.toString()].properties.find(
    p => p.name === propertyName
  );

  if (
    property &&
    entity.metadata[propertyName].length > 0 &&
    (property.type === 'select' || property.type === 'multiselect')
  ) {
    const [translationsForLanguage] = translations.filter(
      translation => translation.locale === entity.language
    );
    const [propertyTranslation] = translationsForLanguage.contexts.filter(
      context => context.id === property.content
    );
    if (propertyTranslation) {
      const translatedProperty = applyTranslation(
        entity.metadata[propertyName],
        propertyTranslation
      );
      return { ...entityMetadata, [propertyName]: translatedProperty };
    }
  }

  return { ...entityMetadata, [propertyName]: entity.metadata[propertyName] };
};

// eslint-disable-next-line import/no-default-export
export default {
  delta: 58,

  name: 'thesauri_translations_in_entity_metadata',

  description: "Fix Thesauri translations not propagated to entity's metadata",

  async up(db) {
    process.stdout.write(`${this.name}...\r\n`);

    const cursor = db.collection('entities').find();
    const translations = await db.collection('translations').find().toArray();
    const templates = await db.collection('templates').find().toArray();
    const templatesByKey = templates.reduce((memo, t) => ({ ...memo, [t._id.toString()]: t }), {});

    while (await cursor.hasNext()) {
      const entity = await cursor.next();

      if (entity.metadata) {
        const newMetadata = Object.keys(entity.metadata).reduce(
          prepareTranslation(entity, templatesByKey, translations),
          {}
        );

        await db
          .collection('entities')
          .updateOne({ _id: entity._id }, { $set: { metadata: newMetadata } });
      }
    }
  },
};
