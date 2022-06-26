export default {
  delta: 83,

  name: 'sync_template_config_array_to_object',

  description:
    'template config allows for arrays or objects, this unifies the configs to only allow for objects of type {properties: []}',

  reindex: false,

  async up(db) {
    process.stdout.write(`${this.name}...\r\n`);
    const [settings] = await db.collection('settings').find({}).toArray();

    if (settings.sync) {
      const newSync = settings.sync.map(oneSync => {
        const { templates } = oneSync.config;
        Object.keys(templates).forEach(templateId => {
          if (Array.isArray(templates[templateId])) {
            templates[templateId] = {
              properties: templates[templateId],
            };
          }
        });
        return oneSync;
      });

      await db.collection('settings').updateOne({}, { $set: { sync: newSync } });
    }
  },
};
