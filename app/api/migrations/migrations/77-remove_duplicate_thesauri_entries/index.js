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

  bulkWriteActions: [],

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
      if (!Object.keys(this.propertyNameContentMap[template._id.toString()]).length) {
        delete this.propertyNameContentMap[template._id.toString()];
        delete this.propertyIdContentMap[template._id.toString()];
      }
    }
  },

  denormalizeEntry(entry, thesaurus) {
    const newEntry = { ...entry, label: thesaurus[entry.value] };
    if (entry.parent) newEntry.parent = this.denormalizeEntry(entry.parent, thesaurus);
    return newEntry;
  },

  denormalizeProperty(name, entries, templateId) {
    if (
      templateId in this.propertyNameContentMap &&
      name in this.propertyNameContentMap[templateId]
    ) {
      const thesaurusId = this.propertyNameContentMap[templateId][name];
      const thesaurus = this.thesauriIdLabelMap[thesaurusId];
      // console.log(name)
      // console.log(entries);
      // console.log(thesaurus)
      return [name, entries.map(entry => this.denormalizeEntry(entry, thesaurus))];
    }
    return [name, entries];
  },

  denormalizeMetadata(metadata, templateId) {
    return Object.fromEntries(
      Object.entries(metadata).map(([name, entries]) =>
        this.denormalizeProperty(name, entries, templateId)
      )
    );
  },

  denormalizeEntity(entity) {
    return {
      ...entity,
      metadata: this.denormalizeMetadata(entity.metadata, entity.template.toString()),
    };
  },

  replaceAction(entity) {
    return {
      replaceOne: {
        filter: { _id: entity._id },
        replacement: entity,
      },
    };
  },

  async perform(db) {
    await db.collection('entities').bulkWrite(this.bulkWriteActions);
    this.bulkWriteActions = [];
  },

  async denormalize(db) {
    const entities = await db.collection('entities').find({});
    while (await entities.hasNext()) {
      const entity = await entities.next();
      const templateId = entity.template.toString();
      if (templateId in this.propertyNameContentMap) {
        this.bulkWriteActions.push(this.replaceAction(this.denormalizeEntity(entity)));
      }
      if (this.bulkWriteActions.length >= 1000) await this.perform();
    }
    if (this.bulkWriteActions.length) await this.perform(db);
  },

  async up(db) {
    process.stdout.write(`${this.name}...\r\n`);

    await this.handleThesauri(db);

    await this.buildThesauriMap(db);

    await this.buildContentMaps(db);

    await this.denormalize(db);
  },
};
