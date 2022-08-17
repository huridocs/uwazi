export default {
  delta: 92,

  name: 'remove_nonexisting_metadata',

  description: 'Removes metadata from entities, where the property does not exist on the template.',

  reindex: false,

  async up() {
    process.stdout.write(`${this.name}...\r\n`);
    return Promise.reject(new Error('error! change this, recently created migration'));
  },
};
