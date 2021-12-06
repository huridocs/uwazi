export default {
  delta: 44,

  name: 'default_null_inheritedValue_to_empty_array',

  description: `sometimes inheritValue can be null,
  we want an array to be consistent with the rest of
  the values and be able to perform mongo array update operations`,

  async up(db) {
    process.stdout.write(`${this.name}...\r\n`);
    const templates = await db.collection('templates').find().toArray();

    const properties = templates.reduce(
      (props, template) => props.concat(template.properties.map(p => p.name)),
      []
    );

    await properties.reduce(async (previousUpdate, propName) => {
      await previousUpdate;
      await db.collection('entities').updateMany(
        {
          [`metadata.${propName}`]: { $exists: true },
          [`metadata.${propName}.inheritValue`]: null,
        },
        { $set: { [`metadata.${propName}.$[nullIndex].inheritedValue`]: [] } },
        {
          arrayFilters: [{ 'nullIndex.inheritedValue': { $exists: true, $in: [null] } }],
        }
      );
    }, Promise.resolve());
  },
};
