export default {
  delta: 12,

  name: 'add-RTL-to-settings-languages',

  description: 'Adds the missing RTL value for existing instances with RTL languages',

  rtlLanguagesList: ['ar', 'dv', 'ha', 'he', 'ks', 'ku', 'ps', 'fa', 'ur', 'yi'],

  async up(db) {
    process.stdout.write(`${this.name}...\r\n`);

    const [settings] = await db.collection('settings').find().toArray();

    let { languages } = settings;

    languages = languages.map(l => {
      const migratedLanguage = l;
      if (this.rtlLanguagesList.includes(l.key)) {
        migratedLanguage.rtl = true;
      }

      return migratedLanguage;
    });

    return db.collection('settings').updateOne({ _id: settings._id }, { $set: { languages } });
  },
};
