export default {
  delta: 93,

  name: 'remove_nonexisting_metadata',

  description: 'Removes metadata from entities, where the property does not exist on the template.',

  reindex: false,

  batchSize: 1000,

  actions: [],

  async getPropertyData(db) {
    const templates = await db.collection('templates').find().toArray();
    const indexed = Object.fromEntries(
      templates.map(t => [t._id, t.properties ? new Set(t.properties.map(p => p.name)) : new Set()])
    );
    return indexed;
  },

  async perform(db) {
    await db.collection('entities').bulkWrite(this.actions);
    this.actions = [];
    this.reindex = true;
  },

  handleEntity(entity, propertyData) {
    const metadata = entity.metadata || {};
    if (!entity.template) return;
    if (!propertyData[entity.template]) return;

    const extraProperties = Object.keys(metadata).filter(
      k => !propertyData[entity.template].has(k)
    );

    if (extraProperties.length) {
      this.actions.push({
        updateOne: {
          filter: { _id: entity._id },
          update: { $unset: Object.fromEntries(extraProperties.map(p => [`metadata.${p}`, 1])) },
        },
      });
    }
  },

  async handleEntities(db, propertyData) {
    const entities = await db.collection('entities').find();
    // eslint-disable-next-line no-await-in-loop
    while (await entities.hasNext()) {
      // eslint-disable-next-line no-await-in-loop
      this.handleEntity(await entities.next(), propertyData);
      // eslint-disable-next-line no-await-in-loop
      if (this.actions.length >= this.batchSize) await this.perform(db);
    }
    if (this.actions.length) await this.perform(db);
  },

  async up(db) {
    this.actions = [];
    this.reindex = false;
    process.stdout.write(`${this.name}...\r\n`);

    const propertyData = await this.getPropertyData(db);
    await this.handleEntities(db, propertyData);
  },
};
