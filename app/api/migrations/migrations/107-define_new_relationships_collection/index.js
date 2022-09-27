export default {
  delta: 107,

  name: 'define_new_relationships_collection',

  description: 'Defines the indices and schema validation for the new relationships collection.',

  reindex: false,

  async up() {
    process.stdout.write(`${this.name}...\r\n`);
    return Promise.reject(new Error('error! change this, recently created migration'));
  },
};
