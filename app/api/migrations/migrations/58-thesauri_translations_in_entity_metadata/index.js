/* eslint-disable no-await-in-loop */

const applyTranslation = (property, translation) =>
  property.map(prop => {
    const [translatedProperty] = translation.values.filter(
      value => value.key === prop.label && value.value !== prop.label
    );

    if (prop.parent) {
      const [translatedParent] = translation.values.filter(
        value => value.key === prop.parent.label && value.value !== prop.parent.label
      );

      return {
        value: prop.value,
        label: translatedProperty ? translatedProperty.value : prop.label,
        parent: {
          value: prop.parent.value,
          label: translatedParent ? translatedParent.value : prop.parent.label,
        },
      };
    }

    return {
      value: prop.value,
      label: translatedProperty ? translatedProperty.value : prop.label,
    };
  });

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
