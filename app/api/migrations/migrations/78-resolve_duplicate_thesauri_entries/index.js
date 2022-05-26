/* eslint-disable no-await-in-loop */
const ROOT_TYPES = new Set(['select', 'multiselect']);

const isInheritedWithThesaurus = property =>
  property.type === 'relationship' &&
  property.inherit?.type &&
  ROOT_TYPES.has(property.inherit.type);

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
  delta: 78,

  name: 'resolve_duplicate_thesauri_entries',

  description: `This migration resolves duplicated thesauri entries, by renaming multiples: 
    three labels named "A" will be transformed to "A", "A__(2)" and "A__(3)".`,

  reindex: false,

  templateIdMap: {},

  thesauriIdLabelMap: {},

  propertyNameContentMap: {},

  propertyIdContentMap: {},

  bulkWriteActions: [],

  async buildTemplateMap(db) {
    const templates = db.collection('templates').find();
    while (await templates.hasNext()) {
      const template = await templates.next();
      this.templateIdMap[template._id.toString()] = template;
    }
  },

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
      (thesaurus.values || []).forEach(value => {
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

  async gatherRootProperties(db) {
    const templates = db.collection('templates').find();
    while (await templates.hasNext()) {
      const template = await templates.next();
      this.propertyNameContentMap[template._id.toString()] = {};
      (template.properties || []).forEach(p => {
        if (ROOT_TYPES.has(p.type)) {
          this.propertyNameContentMap[template._id.toString()][p.name] = p.content;
          this.propertyIdContentMap[p._id.toString()] = p.content;
        }
      });
    }
  },

  async gatherInheritedProperties(db) {
    const templates = db.collection('templates').find();
    while (await templates.hasNext()) {
      const template = await templates.next();
      (template.properties || []).forEach(p => {
        if (isInheritedWithThesaurus(p)) {
          this.propertyNameContentMap[template._id.toString()][p.name] =
            this.propertyIdContentMap[p.inherit.property];
        }
      });
      if (!Object.keys(this.propertyNameContentMap[template._id.toString()]).length) {
        delete this.propertyNameContentMap[template._id.toString()];
      }
    }
  },

  async buildContentMaps(db) {
    await this.gatherRootProperties(db);
    await this.gatherInheritedProperties(db);
  },

  denormalizeEntry(entry, thesaurus) {
    const newEntry = { ...entry };
    if (entry.inheritedValue) {
      newEntry.inheritedValue = entry.inheritedValue.map(e => this.denormalizeEntry(e, thesaurus));
    } else {
      newEntry.label = thesaurus[entry.value];
      if (entry.parent) newEntry.parent = this.denormalizeEntry(entry.parent, thesaurus);
    }
    return newEntry;
  },

  denormalizeProperty(name, entries, templateId) {
    if (
      templateId in this.propertyNameContentMap &&
      name in this.propertyNameContentMap[templateId]
    ) {
      const thesaurusId = this.propertyNameContentMap[templateId][name];
      const thesaurus = this.thesauriIdLabelMap[thesaurusId];
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
    return entity.template
      ? {
          ...entity,
          metadata: this.denormalizeMetadata(entity.metadata, entity.template.toString()),
        }
      : entity;
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
      const templateId = entity.template?.toString();
      const template = this.templateIdMap[templateId];
      if (templateId && !template?.synced && templateId in this.propertyNameContentMap) {
        this.bulkWriteActions.push(this.replaceAction(this.denormalizeEntity(entity)));
      }
      if (this.bulkWriteActions.length >= 1000) await this.perform(db);
    }
    if (this.bulkWriteActions.length) await this.perform(db);
  },

  async up(db) {
    process.stdout.write(`${this.name}...\r\n`);

    await this.buildTemplateMap(db);

    await this.handleThesauri(db);

    await this.buildThesauriMap(db);

    await this.buildContentMaps(db);

    await this.denormalize(db);
  },
};
