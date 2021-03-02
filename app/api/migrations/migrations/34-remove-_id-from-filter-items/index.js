export default {
  delta: 34,

  name: 'remove-_id-from-filter-items',

  description: 'Removed _id from filter items in settings',

  async up(db) {
    process.stdout.write(`${this.name}...\r\n`);
  },
};
