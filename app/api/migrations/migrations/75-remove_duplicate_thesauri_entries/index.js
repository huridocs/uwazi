export default {
  delta: 75,

  name: 'remove_duplicate_thesauri_entries',

  description:
    'This migration removes duplicated thesauri entries, and links the entity property values to the remaining entry.',

  reindex: false,

  async up() {
    process.stdout.write(`${this.name}...\r\n`);
  },
};
