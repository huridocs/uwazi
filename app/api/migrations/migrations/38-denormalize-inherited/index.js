/* eslint-disable no-await-in-loop */
export default {
  delta: 38,

  name: 'denormalize-inherited',

  description: 'Denormalize inherited metadata',

  async up(db) {
    const cursor = db.collection('entities').find({});
    const templates = await db.collection('templates').find({}).toArray();

    let index = 1;

    while (await cursor.hasNext()) {
      const entity = await cursor.next();
      if (entity.template && entity.metadata) {
        const template = templates.find(t => t._id.toString() === entity.template.toString());

        await Promise.all(
          template.properties.map(async prop => {
            if (prop.type === 'relationship') {
              const value = entity.metadata[prop.name] || [];
              const denormalizedValue = await Promise.all(
                value.map(async _elem => {
                  const elem = { ..._elem };
                  const [partner] = await db
                    .collection('entities')
                    .find({
                      sharedId: elem.value,
                      language: entity.language,
                    })
                    .toArray();

                  if (prop.inherit && partner) {
                    const partnerTemplate = templates.find(
                      t => t._id.toString() === partner.template.toString()
                    );

                    const inheritedProperty = partnerTemplate.properties.find(
                      p => p._id && p._id.toString() === prop.inheritProperty.toString()
                    );

                    elem.inheritedValue = (partner.metadata || {})[inheritedProperty.name] || [];
                    elem.inheritedType = inheritedProperty.type;
                  }
                  return elem;
                })
              );

              entity.metadata[prop.name] = denormalizedValue.filter(v => v);
            }
          })
        );

        await db
          .collection('entities')
          .updateOne({ _id: entity._id }, { $set: { metadata: entity.metadata } });
      }
      process.stdout.write(`-> processed: ${index} \r`);
      index += 1;
    }

    process.stdout.write('\r\n');
  },
};
