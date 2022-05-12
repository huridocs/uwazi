/* eslint-disable no-await-in-loop */
const ROOT_PROPERTIES = new Set(['select', 'multiselect']);

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

  thesauriIdLabelMap: {},

  propertyNameContentMap: {},

  propertyIdContentMap: {},

  async handleThesauri(db) {
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

  async buildThesauriMap(db) {
    const thesauri = db.collection('dictionaries').find();

    while (await thesauri.hasNext()) {
      const thesaurus = await thesauri.next();
      const flatValues = [];
      thesaurus.values.forEach(value => {
        flatValues.push(value);
        if (value.values) {
          value.values.forEach(v => {
            flatValues.push(v);
          });
        }
      });
      this.thesauriIdLabelMap[thesaurus._id.toString()] = Object.fromEntries(
        flatValues.map(({ id, label }) => [id, label])
      );
    }
  },

  async buildContentMaps(db) {
    const templates = db.collection('templates').find();
    while (await templates.hasNext()) {
      const template = await templates.next();
      this.propertyNameContentMap[template._id.toString()] = {};
      this.propertyIdContentMap[template._id.toString()] = {};
      template.properties.forEach(p => {
        if (ROOT_PROPERTIES.has(p.type)) {
          this.propertyNameContentMap[template._id.toString()][p.name] = p.content;
          this.propertyIdContentMap[template._id.toString()][p._id.toString()] = p.content;
        }
      });
    }
  },

  async up(db) {
    process.stdout.write(`${this.name}...\r\n`);

    await this.handleThesauri(db);

    await this.buildThesauriMap(db);

    await this.buildContentMaps(db);

    console.log(this.propertyNameContentMap);
    console.log(this.propertyIdContentMap);
  },
};
