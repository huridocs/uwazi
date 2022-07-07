export default {
  delta: 87,

  name: 'add-localized-language',

  description: 'Adds the localized language to the settings',

  reindex: false,

  async up(db) {
    process.stdout.write(`${this.name}...\r\n`);

    const [settings] = await db.collection('settings').find().toArray();

    const { languages } = settings;

    const updatedLanguages = languages.map(language => {
      const intl = new Intl.DisplayNames([language.key], {
        type: 'language',
        languageDisplay: 'dialect',
      });

      const localizedName = intl.of(language.key);

      return {
        ...language,
        localized_label: localizedName.charAt(0).toUpperCase() + localizedName.slice(1),
      };
    });

    return db.collection('settings').updateOne({}, { $set: { languages: updatedLanguages } });
  },
};
