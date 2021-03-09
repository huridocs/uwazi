export default {
  delta: 35,

  name: 'remove-_id-from-filter-items',

  description: 'Removed _id from filter items in settings',

  async up(db) {
    process.stdout.write(`${this.name}...\r\n`);
    await db.collection('settings').updateMany(
      {
        filters: {
          $exists: true,
          $ne: [],
          $elemMatch: {
            items: { $exists: true },
          },
        },
      },
      { $unset: { 'filters.$[].items.$[]._id': 1 } },
      { multi: true }
    );
  },
};
