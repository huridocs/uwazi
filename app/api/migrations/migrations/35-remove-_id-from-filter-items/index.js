export default {
  delta: 35,

  name: 'remove-_id-from-filter-items',

  description: 'Removed _id from filter items in settings',

  async up(db) {
    process.stdout.write(`${this.name}...\r\n`);
    const [settings] = await db.collection('settings').find().toArray();

    const { filters } = settings;
    if (!filters) {
      return;
    }

    const updatedFilters = filters.map(f => {
      if (f.items) {
        f.items = f.items.map(item => {
          delete item._id;
          return item;
        });
      }

      return f;
    });

    await db.collection('settings').updateOne({}, { $set: { filters: updatedFilters } });
  },
};
