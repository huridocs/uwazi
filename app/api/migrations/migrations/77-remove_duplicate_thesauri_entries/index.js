/* eslint-disable no-await-in-loop */
const renameValues = values => {
  if (!values) return [values, false];
  let changed = false;
  const labelCounter = {};
  const newValues = values.map(v => {
    const newValue = { ...v };
    if (!(v.label in labelCounter)) {
      labelCounter[v.label] = 1;
    } else {
      labelCounter[v.label] += 1;
      newValue.label = `${v.label}__(${labelCounter[v.label]})`;
      changed = true;
    }
    if (v.values) {
      const [nv, c] = renameValues(v.values);
      newValue.values = nv;
      changed = changed || c;
    }
    return newValue;
  });
  return [newValues, changed];
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
      const [newValues, changed] = renameValues(thesaurus.values);
      if (changed) {
        this.reindex = true;
        await db
          .collection('dictionaries')
          .updateOne({ _id: thesaurus._id }, { $set: { values: newValues } });
      }
    }
  },
};
