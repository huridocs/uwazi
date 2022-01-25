class Inheritance {
  constructor() {
    this.templateInfo = {};
  }

  async build(db) {
    const templates = await db.collection('templates').find({}).toArray();
    templates.forEach(template => {
      this.templateInfo[template._id] = {};
      template.properties?.forEach(property => {
        if (property.type === 'relationship') {
          this.templateInfo[template._id][property.name] = { ...property.inherit };
        }
      });
    });
    console.log(this.templateInfo);
  }

  async prepareForBatch(sharedIds, db) {
    console.log('---------------inheritance prepareForbatch');
    console.log(sharedIds);
  }
}

const inheritance = new Inheritance();

export { inheritance };
