/* eslint-disable no-await-in-loop */
export default {
  delta: 80,

  name: 'fix_template_translations',

  description: 'fixes translations keys for template titles',

  reindex: false,

  async up(db) {
    process.stdout.write(`${this.name}...\r\n`);
    const cursor = db.collection('templates').find({}, { name: 1 });

    let index = 1;

    while (await cursor.hasNext()) {
      const template = await cursor.next();
      const currentTranslationLabels = (
        await db
          .collection('translations')
          .aggregate([
            { $unwind: '$contexts' },
            { $match: { 'contexts.id': template._id.toString() } },
            { $replaceRoot: { newRoot: '$contexts' } },
            { $project: { label: 1 } },
          ])
          .toArray()
      ).map(context => context.label);

      // eslint-disable-next-line no-restricted-syntax
      for await (const currentLabel of currentTranslationLabels) {
        await db.collection('translations').updateMany(
          {},
          {
            $set: {
              'contexts.$[context].label': template.name,
              'contexts.$[context].values.$[value].key': template.name,
            },
          },
          {
            arrayFilters: [
              { 'context.id': template._id.toString() },
              { 'value.key': currentLabel },
            ],
          }
        );
      }
      process.stdout.write(` -> processed: ${index} \r`);
      index += 1;
    }
  },
};
