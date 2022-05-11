/* eslint-disable no-await-in-loop */
const renameValues = values => {
  if (!values) return values;
  const labelCounter = {};
  const newValues = [];
  values.forEach(v => {
    const newValue = { ...v };
    if (!(v.label in labelCounter)) {
      labelCounter[v.label] = 1;
    } else {
      labelCounter[v.label] += 1;
      newValue.label = `${v.label}__(${labelCounter[v.label]})`;
    }
    if (v.values) newValue.values = renameValues(v.values);
    newValues.push(newValue);
  });
  return newValues;
};

export default {
  delta: 77,

  name: 'remove_duplicate_thesauri_entries',

  description:
    'This migration removes duplicated thesauri entries, and links the entity property values to the remaining entry.',

  reindex: false,

  async up(db) {
    process.stdout.write(`${this.name}...\r\n`);

    const thesauri = db.collection('dictionaries').find();

    while (await thesauri.hasNext()) {
      const thesaurus = await thesauri.next();
      const newValues = renameValues(thesaurus.values);
      await db
        .collection('dictionaries')
        .updateOne({ _id: thesaurus._id }, { $set: { values: newValues } });
    }
  },
};
