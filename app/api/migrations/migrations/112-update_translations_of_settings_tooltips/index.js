export default {
  delta: 112,

  reindex: false,

  name: 'update_translations_of_settings_tooltips',

  description: 'Updates the text for the tooltips of the settings page',

  async up(db) {
    process.stdout.write(`${this.name}...\r\n`);
  },
};
