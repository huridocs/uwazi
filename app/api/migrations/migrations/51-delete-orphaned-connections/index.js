export default {
  delta: 51,

  name: 'delete-orphaned-connections',

  description: 'Removes all orphaned connections',

  async up() {
    process.stdout.write(`${this.name}...\r\n`);
    return Promise.reject(new Error('error! change this, recently created migration'));
  },
};
