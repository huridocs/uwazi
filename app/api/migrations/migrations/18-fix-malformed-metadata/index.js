/** @format */

const stringifyValue = thesaurusValue => ({ ...thesaurusValue, id: thesaurusValue.id.toString() });

const sanitizeThesaurus = thesaurus => {
  if (!thesaurus.values) {
    return undefined;
  }

  return thesaurus.values.map(value => {
    const sanitizedValue = stringifyValue(value);
    if (sanitizedValue.values) {
      sanitizedValue.values = sanitizedValue.values.map(stringifyValue);
    }
    return sanitizedValue;
  });
};

export default {
  delta: 18,

  name: 'fix-malformed-metadata',

  description: 'Migration to sanitize values and labels of non-string values',

  async up(db) {
    process.stdout.write(`${this.name}...\r\n`);

    process.stdout.write('Processing thesauri values...\r\n');

    const thesauri = await db
      .collection('dictionaries')
      .find()
      .toArray();

    thesauri.forEach(async thesaurus => {
      const values = sanitizeThesaurus(thesaurus);
      await db.collection('dictionaries').update({ _id: thesaurus._id }, { ...thesaurus, values });
    });

    return Promise.resolve();
  },
};
